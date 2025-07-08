#!/usr/bin/env bun

/**
 * Redpanda MCP Market Data Writer
 *
 * MCP-based writer for publishing market data to Redpanda/Kafka topics via Aiven MCP server.
 * Implements the MarketDataWritingDSL interface using MCP protocol.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
} from "../../../dsl";
import type {
  BatchPublishOptions,
  BatchPublishResult,
  PublishOptions,
  PublishResult,
} from "../../../dsl/MarketDataWritingDSL";
import { BaseWriter } from "../../abstract/writers/BaseWriter";

export interface RedpandaMCPWriterConfig {
  name: string;
  aivenProject?: string;
  aivenServiceName?: string;
  aivenApiToken?: string;
  brokers?: string[];
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
}

export class RedpandaMCPMarketDataWriter extends BaseWriter {
  protected config: RedpandaMCPWriterConfig & { name: string };
  private mcpClient?: Client;
  private mcpClientInitialized = false;

  constructor(config: RedpandaMCPWriterConfig & { name: string }) {
    super({
      name: config.name || "redpanda-mcp-writer",
      debug: config.debug,
    });

    this.config = {
      brokers: ["localhost:9092"],
      clientId: "redpanda-mcp-writer",
      topics: {
        prices: "crypto-prices",
        ohlcv: "crypto-ohlcv",
        analytics: "market-analytics",
        level1: "level1-data",
      },
      mcpServerPath: "aiven-mcp-server",
      timeout: 30000,
      debug: false,
      ...config,
    };

    this.mcpClient = new Client(
      {
        name: config.name || "redpanda-mcp-writer",
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

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🎭 Initializing Redpanda MCP Writer...");
      }

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
              KAFKA_CLIENT_ID: this.config.clientId || "default-client",
            },
          });

          await this.mcpClient.connect(transport);
          this.mcpClientInitialized = true;

          this.addClient("aiven-mcp", this.mcpClient, {
            name: "aiven-mcp",
            type: "data-sink",
          });

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
        "WRITER_INIT_FAILED",
        `Redpanda MCP Writer initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up Redpanda MCP Writer...");
      }

      if (this.mcpClient && this.mcpClientInitialized) {
        await this.mcpClient.close();
        this.mcpClientInitialized = false;
      }

      this.isInitialized = false;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_CLEANUP_FAILED",
        `Redpanda MCP Writer cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  protected async publishPriceHandler(
    data: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const messageKey = `${data.coinId}:${data.exchangeId}:${data.symbol}`;
    const topic = options?.topic || this.config.topics?.prices || "crypto-prices";

    const result = await this.mcpClient.callTool({
      name: "produce_kafka_message",
      arguments: {
        project: this.config.aivenProject,
        service: this.config.aivenServiceName,
        topic: topic,
        key: messageKey,
        value: {
          coinId: data.coinId,
          symbol: data.symbol,
          exchangeId: data.exchangeId,
          usdPrice: data.usdPrice,
          marketCap: data.marketCap,
          volume24h: data.volume24h,
          change24h: data.change24h,
          lastUpdated: data.lastUpdated,
          source: data.source,
          timestamp: new Date().toISOString(),
        },
        partition_key: data.exchangeId,
      },
    });

    return {
      messageId: `${messageKey}-${Date.now()}`,
      topic: topic,
      partition: options?.partition,
      offset: (result as any)?.offset,
      timestamp: new Date(),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishPricesHandler(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const results: PublishResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    let successCount = 0;
    const startTime = Date.now();

    for (const [index, price] of data.entries()) {
      try {
        const result = await this.publishPriceHandler(price, options);
        results.push(result);
        successCount++;
      } catch (error) {
        errors.push({ index, error: String(error) });
      }
    }

    return {
      totalMessages: data.length,
      successCount,
      failureCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      batchId: `batch-${Date.now()}`,
      processingTime: Date.now() - startTime,
    };
  }

  protected async publishOHLCVHandler(
    data: CryptoOHLCVData,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const messageKey = `${data.coinId}:${data.exchangeId}:${data.timeframe}:${data.timestamp}`;
    const topic = options?.topic || this.config.topics?.ohlcv || "crypto-ohlcv";

    const result = await this.mcpClient.callTool({
      name: "produce_kafka_message",
      arguments: {
        project: this.config.aivenProject,
        service: this.config.aivenServiceName,
        topic: topic,
        key: messageKey,
        value: data,
        partition_key: `${data.exchangeId}:${data.timeframe}`,
      },
    });

    return {
      messageId: `${messageKey}-${Date.now()}`,
      topic: topic,
      partition: options?.partition,
      offset: (result as any)?.offset,
      timestamp: new Date(),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishOHLCVBatchHandler(
    data: CryptoOHLCVData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const results: PublishResult[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    let successCount = 0;
    const startTime = Date.now();

    for (const [index, ohlcv] of data.entries()) {
      try {
        const result = await this.publishOHLCVHandler(ohlcv, options);
        results.push(result);
        successCount++;
      } catch (error) {
        errors.push({ index, error: String(error) });
      }
    }

    return {
      totalMessages: data.length,
      successCount,
      failureCount: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
      batchId: `batch-${Date.now()}`,
      processingTime: Date.now() - startTime,
    };
  }

  protected async publishAnalyticsHandler(
    data: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const messageKey = `${data.exchangeId || "global"}:${data.timestamp}`;
    const topic = options?.topic || this.config.topics?.analytics || "market-analytics";

    const result = await this.mcpClient.callTool({
      name: "produce_kafka_message",
      arguments: {
        project: this.config.aivenProject,
        service: this.config.aivenServiceName,
        topic: topic,
        key: messageKey,
        value: data,
        partition_key: data.exchangeId || "global",
      },
    });

    return {
      messageId: `${messageKey}-${Date.now()}`,
      topic: topic,
      partition: options?.partition,
      offset: (result as any)?.offset,
      timestamp: new Date(),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishLevel1Handler(
    data: Level1Data,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const messageKey = `${data.ticker}:${data.exchange}:${data.timestamp}`;
    const topic = options?.topic || this.config.topics?.level1 || "level1-data";

    const result = await this.mcpClient.callTool({
      name: "produce_kafka_message",
      arguments: {
        project: this.config.aivenProject,
        service: this.config.aivenServiceName,
        topic: topic,
        key: messageKey,
        value: data,
        partition_key: data.exchange,
      },
    });

    return {
      messageId: `${messageKey}-${Date.now()}`,
      topic: topic,
      partition: options?.partition,
      offset: (result as any)?.offset,
      timestamp: new Date(),
      size: JSON.stringify(data).length,
    };
  }

  protected async flushHandler(timeoutMs?: number): Promise<void> {
    // For Kafka/Redpanda, flush is handled by the MCP server
    if (this.config.debug) {
      console.log(`🚽 Flushing Redpanda messages (timeout: ${timeoutMs}ms)`);
    }
  }

  protected async createDestinationHandler(
    name: string,
    config?: Record<string, any>,
  ): Promise<void> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    await this.mcpClient.callTool({
      name: "create_kafka_topic",
      arguments: {
        project: this.config.aivenProject,
        service: this.config.aivenServiceName,
        topic: name,
        partitions: config?.partitions || 12,
        replication_factor: config?.replicationFactor || 3,
        config: config || {},
      },
    });
  }

  protected async getPublishingMetricsHandler(): Promise<{
    totalMessages: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
  }> {
    // Return basic metrics - in a real implementation, these would be tracked
    return {
      totalMessages: 0,
      successRate: 1.0,
      averageLatency: 50, // ms
      errorRate: 0.0,
    };
  }

  async getStatus(): Promise<Result<any>> {
    try {
      return success({
        mcpClientInitialized: this.mcpClientInitialized,
        mcpClient: this.mcpClient ? "connected" : "disconnected",
        config: {
          aivenProject: this.config.aivenProject,
          aivenServiceName: this.config.aivenServiceName,
          brokers: this.config.brokers,
          topics: this.config.topics,
        },
        isConnected: this.mcpClient !== null,
        errorCount: 0,
      });
    } catch (error) {
      return failure(
        createQiError("STATUS_ERROR", "Failed to get Redpanda MCP status", "SYSTEM", {
          error: String(error),
        }),
      );
    }
  }
}

export function createRedpandaMCPMarketDataWriter(
  config: RedpandaMCPWriterConfig & { name: string },
): RedpandaMCPMarketDataWriter {
  return new RedpandaMCPMarketDataWriter(config);
}
