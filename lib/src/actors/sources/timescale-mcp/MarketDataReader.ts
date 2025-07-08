#!/usr/bin/env bun

/**
 * TimescaleDB MCP Market Data Reader (Azure PostgreSQL MCP)
 *
 * This Reader:
 * - Extends BaseReader for unified DSL foundation
 * - Uses Azure PostgreSQL MCP server for enterprise-grade TimescaleDB access
 * - Implements handler functions for TimescaleDB-specific queries
 * - Supports TimescaleDB hypertables and continuous aggregates
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
// AZURE POSTGRESQL MCP READER CONFIGURATION
// =============================================================================

export interface TimescaleDBMCPReaderConfig {
  name: string;
  // Azure PostgreSQL MCP Configuration
  azureSubscriptionId?: string;
  azureResourceGroup?: string;
  azureServerName?: string;
  azureDatabaseName?: string;
  connectionString?: string;
  mcpServerPath?: string;
  debug?: boolean;
  timeout?: number;
  // TimescaleDB specific options
  useHypertables?: boolean;
  useContinuousAggregates?: boolean;
}

// =============================================================================
// TIMESCALEDB MCP MARKET DATA READER
// =============================================================================

export class TimescaleDBMCPMarketDataReader extends BaseReader {
  protected config: TimescaleDBMCPReaderConfig & { name: string };
  private mcpClient?: Client;
  private mcpClientInitialized = false;

  constructor(config: TimescaleDBMCPReaderConfig & { name: string }) {
    super({
      name: config.name || "timescale-mcp-reader",
      debug: config.debug,
    });

    this.config = {
      mcpServerPath: "azure-postgresql-mcp",
      timeout: 30000,
      debug: false,
      useHypertables: true,
      useContinuousAggregates: true,
      ...config,
    };

    // Create Azure PostgreSQL MCP client
    this.mcpClient = new Client(
      {
        name: config.name || "timescale-mcp-reader",
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
        console.log("🎭 Initializing TimescaleDB MCP Reader...");
      }

      // Connect to Azure PostgreSQL MCP server
      if (this.mcpClient && (this.config.connectionString || this.config.azureServerName)) {
        try {
          const transport = new StdioClientTransport({
            command: this.config.mcpServerPath || "azure-postgresql-mcp",
            args: this.config.connectionString
              ? [this.config.connectionString]
              : [
                  `--subscription-id=${this.config.azureSubscriptionId || ""}`,
                  `--resource-group=${this.config.azureResourceGroup || ""}`,
                  `--server-name=${this.config.azureServerName || ""}`,
                  `--database-name=${this.config.azureDatabaseName || ""}`,
                ],
            env: {
              ...process.env,
              AZURE_SUBSCRIPTION_ID: this.config.azureSubscriptionId || "",
              AZURE_RESOURCE_GROUP: this.config.azureResourceGroup || "",
              AZURE_SERVER_NAME: this.config.azureServerName || "",
              AZURE_DATABASE_NAME: this.config.azureDatabaseName || "",
              POSTGRES_CONNECTION_STRING: this.config.connectionString || "",
            },
          });

          await this.mcpClient.connect(transport);
          this.mcpClientInitialized = true;

          // Add MCP client to BaseReader's client management
          this.addClient("azure-postgresql-mcp", this.mcpClient, {
            name: "azure-postgresql-mcp",
            type: "data-source",
          });

          // Mark client as connected
          const clientAssoc = this.getClient("azure-postgresql-mcp");
          if (clientAssoc) {
            clientAssoc.isConnected = true;
          }

          if (this.config.debug) {
            console.log("✅ Connected to Azure PostgreSQL MCP server");
          }
        } catch (error) {
          if (this.config.debug) {
            console.log("⚠️ Azure PostgreSQL MCP server connection failed:", error);
          }
          this.mcpClientInitialized = false;
        }
      }

      this.isInitialized = true;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_INIT_FAILED",
        `TimescaleDB MCP Reader initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up TimescaleDB MCP Reader...");
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
        `TimescaleDB MCP Reader cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // HANDLER IMPLEMENTATIONS - TIMESCALEDB QUERY EXECUTION
  // =============================================================================

  protected async getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT usd_price 
          FROM crypto_prices 
          WHERE coin_id = $1 
          ORDER BY time DESC 
          LIMIT 1
        `,
        params: [coinId],
      },
    });

    const data = this.extractMCPData(result) as any;
    return data.rows?.[0]?.usd_price || 0;
  }

  protected async getCurrentPricesHandler(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT DISTINCT ON (coin_id, exchange_id) 
            coin_id, symbol, name, exchange_id, usd_price, btc_price, eth_price,
            market_cap, volume_24h, change_24h, change_7d, 
            last_updated, source, attribution
          FROM crypto_prices 
          WHERE coin_id = ANY($1)
          ORDER BY coin_id, exchange_id, time DESC
        `,
        params: [coinIds],
      },
    });

    const data = this.extractMCPData(result) as any;
    return data.rows?.map((row: any) => ({
      coinId: row.coin_id,
      symbol: row.symbol,
      name: row.name,
      exchangeId: row.exchange_id,
      usdPrice: Number.parseFloat(row.usd_price || "0"),
      btcPrice: row.btc_price ? Number.parseFloat(row.btc_price) : undefined,
      ethPrice: row.eth_price ? Number.parseFloat(row.eth_price) : undefined,
      marketCap: row.market_cap ? Number.parseFloat(row.market_cap) : undefined,
      volume24h: row.volume_24h ? Number.parseFloat(row.volume_24h) : undefined,
      change24h: row.change_24h ? Number.parseFloat(row.change_24h) : undefined,
      change7d: row.change_7d ? Number.parseFloat(row.change_7d) : undefined,
      lastUpdated: new Date(row.last_updated),
      source: row.source,
      attribution: row.attribution,
    }));
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
      name: "read_query",
      arguments: {
        query: `
          SELECT coin_id, symbol, exchange_id, time as timestamp, 
                 open, high, low, close, volume, timeframe, source, attribution
          FROM ohlcv_data
          WHERE coin_id = $1 AND timeframe = $2
          ORDER BY time DESC
          LIMIT 1
        `,
        params: [coinId, timeframe],
      },
    });

    const data = this.extractMCPData(result) as any;
    const row = data.rows?.[0];
    if (!row) {
      throw new Error(`No OHLCV data found for ${coinId}`);
    }

    return {
      coinId: row.coin_id,
      symbol: row.symbol,
      exchangeId: row.exchange_id,
      timestamp: new Date(row.timestamp),
      open: Number.parseFloat(row.open),
      high: Number.parseFloat(row.high),
      low: Number.parseFloat(row.low),
      close: Number.parseFloat(row.close),
      volume: Number.parseFloat(row.volume),
      timeframe: row.timeframe,
      source: row.source,
      attribution: row.attribution,
    };
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
      name: "read_query",
      arguments: {
        query: `
          SELECT DISTINCT ON (coin_id, exchange_id)
            coin_id, symbol, exchange_id, time as timestamp,
            open, high, low, close, volume, timeframe, source, attribution
          FROM ohlcv_data
          WHERE coin_id = ANY($1) AND timeframe = $2
          ORDER BY coin_id, exchange_id, time DESC
        `,
        params: [coinIds, tf],
      },
    });

    const data = this.extractMCPData(result) as any;
    return data.rows?.map((row: any) => ({
      coinId: row.coin_id,
      symbol: row.symbol,
      exchangeId: row.exchange_id,
      timestamp: new Date(row.timestamp),
      open: Number.parseFloat(row.open),
      high: Number.parseFloat(row.high),
      low: Number.parseFloat(row.low),
      close: Number.parseFloat(row.close),
      volume: Number.parseFloat(row.volume),
      timeframe: row.timeframe,
      source: row.source,
      attribution: row.attribution,
    }));
  }

  protected async getPriceHistoryHandler(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT coin_id, symbol, name, exchange_id, usd_price, btc_price, eth_price,
                 market_cap, volume_24h, change_24h, change_7d,
                 last_updated, source, attribution
          FROM crypto_prices
          WHERE coin_id = $1 
            AND time >= NOW() - INTERVAL '${days} days'
          ORDER BY time ASC
        `,
        params: [coinId],
      },
    });

    const data = this.extractMCPData(result) as any;
    return data.rows?.map((row: any) => ({
      coinId: row.coin_id,
      symbol: row.symbol,
      name: row.name,
      exchangeId: row.exchange_id,
      usdPrice: Number.parseFloat(row.usd_price || "0"),
      btcPrice: row.btc_price ? Number.parseFloat(row.btc_price) : undefined,
      ethPrice: row.eth_price ? Number.parseFloat(row.eth_price) : undefined,
      marketCap: row.market_cap ? Number.parseFloat(row.market_cap) : undefined,
      volume24h: row.volume_24h ? Number.parseFloat(row.volume_24h) : undefined,
      change24h: row.change_24h ? Number.parseFloat(row.change_24h) : undefined,
      change7d: row.change_7d ? Number.parseFloat(row.change_7d) : undefined,
      lastUpdated: new Date(row.last_updated),
      source: row.source,
      attribution: row.attribution,
    }));
  }

  protected async getOHLCVByDateRangeHandler(
    query: DateRangeOHLCVQuery,
  ): Promise<CryptoOHLCVData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT coin_id, symbol, exchange_id, time as timestamp,
                 open, high, low, close, volume, timeframe, source, attribution
          FROM ohlcv_data
          WHERE coin_id = $1 
            AND time >= $2 
            AND time <= $3
            AND timeframe = $4
          ORDER BY time ASC
        `,
        params: [query.ticker, query.dateStart, query.dateEnd, query.interval],
      },
    });

    const data = this.extractMCPData(result) as any;
    return data.rows?.map((row: any) => ({
      coinId: row.coin_id,
      symbol: row.symbol,
      exchangeId: row.exchange_id,
      timestamp: new Date(row.timestamp),
      open: Number.parseFloat(row.open),
      high: Number.parseFloat(row.high),
      low: Number.parseFloat(row.low),
      close: Number.parseFloat(row.close),
      volume: Number.parseFloat(row.volume),
      timeframe: row.timeframe,
      source: row.source,
      attribution: row.attribution,
    }));
  }

  protected async getAvailableTickersHandler(limit: number): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT DISTINCT coin_id, symbol, name, exchange_id, source, attribution
          FROM crypto_prices
          ORDER BY coin_id
          LIMIT $1
        `,
        params: [limit],
      },
    });

    const data = this.extractMCPData(result) as any;
    return data.rows?.map((row: any) => ({
      coinId: row.coin_id,
      symbol: row.symbol,
      name: row.name,
      exchangeId: row.exchange_id,
      usdPrice: 0,
      lastUpdated: new Date(),
      source: row.source,
      attribution: row.attribution,
    }));
  }

  protected async getLevel1DataHandler(query: Level1Query): Promise<Level1Data> {
    // TimescaleDB doesn't have Level1 data directly, simulate from price data
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT usd_price
          FROM crypto_prices
          WHERE coin_id = $1
          ORDER BY time DESC
          LIMIT 1
        `,
        params: [query.ticker.toLowerCase()],
      },
    });

    const data = this.extractMCPData(result) as any;
    const price = Number.parseFloat(data.rows?.[0]?.usd_price || "0");
    const spread = price * 0.001;

    return {
      ticker: query.ticker,
      timestamp: new Date(),
      bestBid: price - spread / 2,
      bestAsk: price + spread / 2,
      spread: spread,
      spreadPercent: 0.1,
      exchange: query.exchange || "timescale",
      market: query.market || "spot",
      source: "timescale-mcp",
      attribution: "Approximated from TimescaleDB price data",
    };
  }

  protected async getMarketAnalyticsHandler(): Promise<CryptoMarketAnalytics> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: "read_query",
      arguments: {
        query: `
          SELECT exchange_id, total_market_cap, total_volume, btc_dominance, eth_dominance,
                 active_cryptocurrencies, markets, market_cap_change_24h,
                 time as timestamp, source, attribution
          FROM market_analytics
          ORDER BY time DESC
          LIMIT 1
        `,
      },
    });

    const data = this.extractMCPData(result) as any;
    const row = data.rows?.[0];
    if (!row) {
      throw new Error("No market analytics data found");
    }

    return {
      timestamp: new Date(row.timestamp),
      exchangeId: row.exchange_id,
      totalMarketCap: Number.parseFloat(row.total_market_cap || "0"),
      totalVolume: Number.parseFloat(row.total_volume || "0"),
      btcDominance: Number.parseFloat(row.btc_dominance || "0"),
      ethDominance: row.eth_dominance ? Number.parseFloat(row.eth_dominance) : undefined,
      activeCryptocurrencies: Number.parseInt(row.active_cryptocurrencies || "0"),
      markets: Number.parseInt(row.markets || "0"),
      marketCapChange24h: Number.parseFloat(row.market_cap_change_24h || "0"),
      source: row.source,
      attribution: row.attribution,
    };
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
      connectionString: this.config.connectionString?.replace(/:[^:@]*@/, ":****@"),
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
      dataSource: "timescale-mcp",
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createTimescaleDBMCPMarketDataReader(
  config: TimescaleDBMCPReaderConfig & { name: string },
): TimescaleDBMCPMarketDataReader {
  return new TimescaleDBMCPMarketDataReader(config);
}
