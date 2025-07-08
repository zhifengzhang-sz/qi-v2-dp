#!/usr/bin/env bun

/**
 * Redpanda MCP Market Data Reader (Aiven MCP)
 *
 * This Reader:
 * - Extends BaseReader for unified DSL foundation
 * - Uses Aiven MCP server for enterprise-grade Kafka/Redpanda access
 * - Implements handler functions for streaming operations
 * - Supports real-time stream processing with sub-100ms latency
 */

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Data,
  Level1Query,
} from "../../../dsl";
import { BaseReader } from "../../abstract/readers/BaseReader";

// MCP imports
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// =============================================================================
// AIVEN MCP READER CONFIGURATION
// =============================================================================

export interface RedpandaMCPReaderConfig {
  name: string;
  // Aiven MCP Configuration
  aivenProject?: string;
  aivenServiceName?: string;
  aivenApiToken?: string;
  brokers?: string[];
  groupId?: string;
  clientId?: string;
  topics?: {
    prices?: string;
    ohlcv?: string;
    analytics?: string;
    level1?: string;
  };
  mcpServerPath?: string;
  debug?: boolean;
  timeout?: number;
  // Streaming options
  enableRealTimeStreaming?: boolean;
  maxPollRecords?: number;
}

// =============================================================================
// REDPANDA MCP MARKET DATA READER
// =============================================================================

export class RedpandaMCPMarketDataReader extends BaseReader {
  protected config: RedpandaMCPReaderConfig & { name: string };
  private mcpClient?: Client;
  private mcpClientInitialized = false;

  constructor(config: RedpandaMCPReaderConfig & { name: string }) {
    super({
      name: config.name || "redpanda-mcp-reader",
      debug: config.debug,
    });

    this.config = {
      brokers: ["localhost:9092"],
      groupId: "redpanda-mcp-reader-group",
      clientId: "redpanda-mcp-reader",
      topics: {
        prices: "crypto-prices",
        ohlcv: "crypto-ohlcv",
        analytics: "market-analytics",
        level1: "level1-data",
      },
      mcpServerPath: "aiven-mcp-server",
      timeout: 30000,
      debug: false,
      enableRealTimeStreaming: true,
      maxPollRecords: 100,
      ...config,
    };

    // Create Aiven MCP client
    this.mcpClient = new Client(
      {
        name: config.name || "redpanda-mcp-reader",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      },
    );
  }

  // =============================================================================
  // READER LIFECYCLE
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🎭 Initializing Redpanda MCP Reader...");
      }

      // Connect to Aiven MCP server
      if (this.mcpClient && (this.config.aivenProject || this.config.brokers)) {
        try {
          const transport = new StdioClientTransport({
            command: this.config.mcpServerPath || "aiven-mcp-server",
            args: this.config.aivenProject
              ? [
                  `--project=${this.config.aivenProject}`,
                  `--service=${this.config.aivenServiceName}`,
                ]
              : ["--brokers", this.config.brokers?.join(",") || "localhost:9092"],
            env: {
              ...process.env,
              AIVEN_PROJECT: this.config.aivenProject || "",
              AIVEN_SERVICE_NAME: this.config.aivenServiceName || "",
              AIVEN_API_TOKEN: this.config.aivenApiToken || "",
              KAFKA_BROKERS: this.config.brokers?.join(",") || "localhost:9092",
              KAFKA_GROUP_ID: this.config.groupId || "default-group",
              KAFKA_CLIENT_ID: this.config.clientId || "default-client",
            },
          });

          await this.mcpClient.connect(transport);
          this.mcpClientInitialized = true;

          // Add MCP client to BaseReader's client management
          this.addClient("aiven-mcp", this.mcpClient, {
            name: "aiven-mcp",
            type: "data-source",
          });

          // Mark client as connected
          const clientAssoc = this.getClient("aiven-mcp");
          if (clientAssoc) {
            clientAssoc.isConnected = true;
          }

          if (this.config.debug) {
            console.log("✅ Connected to Aiven MCP server");
          }
        } catch (error) {
          if (this.config.debug) {
            console.log("⚠️ Aiven MCP server connection failed:", error);
          }
          this.mcpClientInitialized = false;
        }
      }

      this.isInitialized = true;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_INIT_FAILED",
        `Redpanda MCP Reader initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error, config: this.config },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  async cleanup(): Promise<Result<void>> {
    try {
      if (this.config.debug) {
        console.log("🛑 Cleaning up Redpanda MCP Reader...");
      }

      if (this.mcpClient && this.mcpClientInitialized) {
        await this.mcpClient.close();
        this.mcpClientInitialized = false;
      }

      this.isInitialized = false;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_CLEANUP_FAILED",
        `Redpanda MCP Reader cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // HANDLER IMPLEMENTATIONS - REDPANDA STREAMING OPERATIONS
  // =============================================================================

  protected async getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // Read latest price from Redpanda stream
    const result = await this.mcpClient.callTool({
      name: "consume_message",
      arguments: {
        topic: this.config.topics?.prices,
        filter: { coinId },
        timeout: 5000,
      },
    });

    const data = this.extractMCPData(result) as any;
    if (data?.message) {
      const priceData = JSON.parse(data.message.value);
      return priceData.usdPrice || 0;
    }

    throw new Error(`No price data found for ${coinId}`);
  }

  protected async getCurrentPricesHandler(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // Consume messages for multiple coins
    const result = await this.mcpClient.callTool({
      name: "consume_batch",
      arguments: {
        topic: this.config.topics?.prices,
        filter: { coinIds },
        maxMessages: coinIds.length * 2,
        timeout: 5000,
      },
    });

    const data = this.extractMCPData(result) as any;
    const prices: CryptoPriceData[] = [];

    if (data?.messages) {
      for (const msg of data.messages) {
        const priceData = JSON.parse(msg.value);
        if (coinIds.includes(priceData.coinId)) {
          prices.push({
            ...priceData,
            lastUpdated: new Date(priceData.lastUpdated),
          });
        }
      }
    }

    return prices;
  }

  protected async getCurrentOHLCVHandler(
    coinId: string,
    interval: "hourly" | "daily",
  ): Promise<CryptoOHLCVData> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const timeframe = interval === "hourly" ? "1h" : "1d";
    const result = await this.mcpClient.callTool({
      name: "consume_message",
      arguments: {
        topic: this.config.topics?.ohlcv,
        filter: { coinId, timeframe },
        timeout: 5000,
      },
    });

    const data = this.extractMCPData(result) as any;
    if (data?.message) {
      const ohlcvData = JSON.parse(data.message.value);
      return {
        ...ohlcvData,
        timestamp: new Date(ohlcvData.timestamp),
      };
    }

    throw new Error(`No OHLCV data found for ${coinId}`);
  }

  protected async getLatestOHLCVHandler(
    coinIds: string[],
    timeframe?: string,
  ): Promise<CryptoOHLCVData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const tf = timeframe || "1d";
    const result = await this.mcpClient.callTool({
      name: "consume_batch",
      arguments: {
        topic: this.config.topics?.ohlcv,
        filter: { coinIds, timeframe: tf },
        maxMessages: coinIds.length * 2,
        timeout: 5000,
      },
    });

    const data = this.extractMCPData(result) as any;
    const ohlcvData: CryptoOHLCVData[] = [];

    if (data?.messages) {
      for (const msg of data.messages) {
        const ohlcv = JSON.parse(msg.value);
        if (coinIds.includes(ohlcv.coinId)) {
          ohlcvData.push({
            ...ohlcv,
            timestamp: new Date(ohlcv.timestamp),
          });
        }
      }
    }

    return ohlcvData;
  }

  protected async getPriceHistoryHandler(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // For price history, we need to read from a compacted topic or time-windowed consumer
    const result = await this.mcpClient.callTool({
      name: "consume_time_range",
      arguments: {
        topic: this.config.topics?.prices,
        filter: { coinId },
        fromTime: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        toTime: new Date().toISOString(),
        maxMessages: 1000,
      },
    });

    const data = this.extractMCPData(result) as any;
    const prices: CryptoPriceData[] = [];

    if (data?.messages) {
      for (const msg of data.messages) {
        const priceData = JSON.parse(msg.value);
        prices.push({
          ...priceData,
          lastUpdated: new Date(priceData.lastUpdated),
        });
      }
    }

    return prices;
  }

  protected async getOHLCVByDateRangeHandler(
    query: DateRangeOHLCVQuery,
  ): Promise<CryptoOHLCVData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "consume_time_range",
      arguments: {
        topic: this.config.topics?.ohlcv,
        filter: {
          coinId: query.ticker,
          timeframe: query.interval,
        },
        fromTime: query.dateStart.toISOString(),
        toTime: query.dateEnd.toISOString(),
        maxMessages: 1000,
      },
    });

    const data = this.extractMCPData(result) as any;
    const ohlcvData: CryptoOHLCVData[] = [];

    if (data?.messages) {
      for (const msg of data.messages) {
        const ohlcv = JSON.parse(msg.value);
        ohlcvData.push({
          ...ohlcv,
          timestamp: new Date(ohlcv.timestamp),
        });
      }
    }

    return ohlcvData;
  }

  protected async getAvailableTickersHandler(limit: number): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // Get unique tickers from recent messages
    const result = await this.mcpClient.callTool({
      name: "get_topic_metadata",
      arguments: {
        topic: this.config.topics?.prices,
      },
    });

    const data = this.extractMCPData(result) as any;
    const tickers: CryptoPriceData[] = [];

    if (data?.uniqueKeys) {
      for (let i = 0; i < Math.min(limit, data.uniqueKeys.length); i++) {
        const [coinId, exchangeId, symbol] = data.uniqueKeys[i].split(":");
        tickers.push({
          coinId,
          symbol,
          exchangeId,
          usdPrice: 0,
          lastUpdated: new Date(),
          source: "redpanda-mcp",
          attribution: "Available from Redpanda stream",
        });
      }
    }

    return tickers;
  }

  protected async getLevel1DataHandler(query: Level1Query): Promise<Level1Data> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "consume_message",
      arguments: {
        topic: this.config.topics?.level1,
        filter: {
          ticker: query.ticker,
          exchange: query.exchange,
          market: query.market,
        },
        timeout: 5000,
      },
    });

    const data = this.extractMCPData(result) as any;
    if (data?.message) {
      const level1Data = JSON.parse(data.message.value);
      return {
        ...level1Data,
        timestamp: new Date(level1Data.timestamp),
      };
    }

    throw new Error(`No Level1 data found for ${query.ticker}`);
  }

  protected async getMarketAnalyticsHandler(): Promise<CryptoMarketAnalytics> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "consume_message",
      arguments: {
        topic: this.config.topics?.analytics,
        timeout: 5000,
      },
    });

    const data = this.extractMCPData(result) as any;
    if (data?.message) {
      const analytics = JSON.parse(data.message.value);
      return {
        ...analytics,
        timestamp: new Date(analytics.timestamp),
      };
    }

    throw new Error("No market analytics data found");
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private extractMCPData<T>(result: any): T {
    if (result?.content?.[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch (error) {
        throw new Error(`Failed to parse MCP response: ${error}`);
      }
    }
    return result?.data || result;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      mcpClientInitialized: this.mcpClientInitialized,
      hasMCPClient: !!this.mcpClient,
      brokers: this.config.brokers,
      groupId: this.config.groupId,
      topics: this.config.topics,
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
      dataSource: "redpanda-mcp",
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createRedpandaMCPMarketDataReader(
  config: RedpandaMCPReaderConfig & { name: string },
): RedpandaMCPMarketDataReader {
  return new RedpandaMCPMarketDataReader(config);
}
