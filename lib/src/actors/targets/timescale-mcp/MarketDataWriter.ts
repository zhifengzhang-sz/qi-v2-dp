#!/usr/bin/env bun

/**
 * TimescaleDB MCP Market Data Writer
 *
 * MCP-based writer for publishing market data to TimescaleDB via Azure PostgreSQL MCP server.
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

// =============================================================================
// AZURE POSTGRESQL MCP WRITER CONFIGURATION
// =============================================================================

export interface TimescaleDBMCPWriterConfig {
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
  batchSize?: number;
}

// =============================================================================
// TIMESCALEDB MCP MARKET DATA WRITER
// =============================================================================

export class TimescaleDBMCPMarketDataWriter extends BaseWriter {
  protected config: TimescaleDBMCPWriterConfig & { name: string };
  private mcpClient?: Client;
  private mcpClientInitialized = false;

  constructor(config: TimescaleDBMCPWriterConfig & { name: string }) {
    super({
      name: config.name || "timescale-mcp-writer",
      debug: config.debug,
    });

    this.config = {
      mcpServerPath: "azure-postgresql-mcp",
      timeout: 30000,
      debug: false,
      useHypertables: true,
      useContinuousAggregates: true,
      batchSize: 100,
      ...config,
    };

    // Create Azure PostgreSQL MCP client
    this.mcpClient = new Client(
      {
        name: config.name || "timescale-mcp-writer",
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
  // WRITER LIFECYCLE
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🎭 Initializing TimescaleDB MCP Writer...");
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

          // Add MCP client to BaseWriter's client management
          this.addClient("azure-postgresql-mcp", this.mcpClient, {
            name: "azure-postgresql-mcp",
            type: "data-sink",
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
        "WRITER_INIT_FAILED",
        `TimescaleDB MCP Writer initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up TimescaleDB MCP Writer...");
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
        `TimescaleDB MCP Writer cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // HANDLER IMPLEMENTATIONS - TIMESCALEDB WRITE OPERATIONS
  // =============================================================================

  protected async publishPriceHandler(
    data: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    await this.mcpClient.callTool({
      name: "execute_query",
      arguments: {
        query: `
          INSERT INTO crypto_prices (
            coin_id, symbol, name, exchange_id, usd_price, btc_price, eth_price,
            market_cap, volume_24h, change_24h, change_7d, last_updated, source, attribution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (coin_id, exchange_id, symbol) DO UPDATE SET
            usd_price = EXCLUDED.usd_price,
            btc_price = EXCLUDED.btc_price,
            eth_price = EXCLUDED.eth_price,
            market_cap = EXCLUDED.market_cap,
            volume_24h = EXCLUDED.volume_24h,
            change_24h = EXCLUDED.change_24h,
            change_7d = EXCLUDED.change_7d,
            last_updated = EXCLUDED.last_updated,
            source = EXCLUDED.source,
            attribution = EXCLUDED.attribution
        `,
        params: [
          data.coinId,
          data.symbol,
          data.name,
          data.exchangeId,
          data.usdPrice,
          data.btcPrice,
          data.ethPrice,
          data.marketCap,
          data.volume24h,
          data.change24h,
          data.change7d,
          data.lastUpdated,
          data.source,
          data.attribution,
        ],
      },
    });

    return {
      messageId: `${data.coinId}-${data.exchangeId}-${Date.now()}`,
      topic: "crypto_prices",
      timestamp: new Date(),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishPricesHandler(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const results = [];
    const errors = [];
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

    await this.mcpClient.callTool({
      name: "execute_query",
      arguments: {
        query: `
          INSERT INTO ohlcv_data (
            coin_id, symbol, exchange_id, timestamp, open, high, low, close, volume, timeframe, source, attribution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (coin_id, exchange_id, timestamp, timeframe) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume,
            source = EXCLUDED.source,
            attribution = EXCLUDED.attribution
        `,
        params: [
          data.coinId,
          data.symbol,
          data.exchangeId,
          data.timestamp,
          data.open,
          data.high,
          data.low,
          data.close,
          data.volume,
          data.timeframe,
          data.source,
          data.attribution,
        ],
      },
    });

    return {
      messageId: `${data.coinId}-${data.exchangeId}-${data.timestamp}-${Date.now()}`,
      topic: "ohlcv_data",
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

    await this.mcpClient.callTool({
      name: "execute_query",
      arguments: {
        query: `
          INSERT INTO market_analytics (
            timestamp, exchange_id, total_market_cap, total_volume, btc_dominance, 
            eth_dominance, active_cryptocurrencies, markets, market_cap_change_24h, source, attribution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (timestamp, exchange_id) DO UPDATE SET
            total_market_cap = EXCLUDED.total_market_cap,
            total_volume = EXCLUDED.total_volume,
            btc_dominance = EXCLUDED.btc_dominance,
            eth_dominance = EXCLUDED.eth_dominance,
            active_cryptocurrencies = EXCLUDED.active_cryptocurrencies,
            markets = EXCLUDED.markets,
            market_cap_change_24h = EXCLUDED.market_cap_change_24h,
            source = EXCLUDED.source,
            attribution = EXCLUDED.attribution
        `,
        params: [
          data.timestamp,
          data.exchangeId,
          data.totalMarketCap,
          data.totalVolume,
          data.btcDominance,
          data.ethDominance,
          data.activeCryptocurrencies,
          data.markets,
          data.marketCapChange24h,
          data.source,
          data.attribution,
        ],
      },
    });

    return {
      messageId: `analytics-${data.exchangeId || "global"}-${Date.now()}`,
      topic: "market_analytics",
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

    await this.mcpClient.callTool({
      name: "execute_query",
      arguments: {
        query: `
          INSERT INTO level1_data (
            ticker, timestamp, best_bid, best_ask, spread, spread_percent, 
            exchange, market, source, attribution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (ticker, exchange, timestamp) DO UPDATE SET
            best_bid = EXCLUDED.best_bid,
            best_ask = EXCLUDED.best_ask,
            spread = EXCLUDED.spread,
            spread_percent = EXCLUDED.spread_percent,
            market = EXCLUDED.market,
            source = EXCLUDED.source,
            attribution = EXCLUDED.attribution
        `,
        params: [
          data.ticker,
          data.timestamp,
          data.bestBid,
          data.bestAsk,
          data.spread,
          data.spreadPercent,
          data.exchange,
          data.market,
          data.source,
          data.attribution,
        ],
      },
    });

    return {
      messageId: `${data.ticker}-${data.exchange}-${Date.now()}`,
      topic: "level1_data",
      timestamp: new Date(),
      size: JSON.stringify(data).length,
    };
  }

  protected async flushHandler(timeoutMs?: number): Promise<void> {
    // For PostgreSQL, there's no explicit flush needed
    if (this.config.debug) {
      console.log(`🚽 Flushing TimescaleDB writes (timeout: ${timeoutMs}ms)`);
    }
  }

  protected async createDestinationHandler(
    name: string,
    config?: Record<string, any>,
  ): Promise<void> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // Create table if it doesn't exist
    await this.mcpClient.callTool({
      name: "execute_query",
      arguments: {
        query: `CREATE TABLE IF NOT EXISTS ${name} (id SERIAL PRIMARY KEY, data JSONB, created_at TIMESTAMP DEFAULT NOW())`,
        params: [],
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
      averageLatency: 25, // ms
      errorRate: 0.0,
    };
  }

  // =============================================================================
  // TIMESCALEDB SPECIFIC OPERATIONS
  // =============================================================================

  /**
   * Create hypertable for time-series data
   */
  async createHypertable(tableName: string, timeColumn = "time"): Promise<Result<void>> {
    if (!this.mcpClient) {
      return failure(
        createQiError("CLIENT_NOT_INITIALIZED", "MCP client not initialized", "SYSTEM"),
      );
    }

    try {
      await this.mcpClient.callTool({
        name: "create_hypertable",
        arguments: {
          project: this.config.azureResourceGroup,
          service: this.config.azureServerName,
          database: this.config.azureDatabaseName,
          table: tableName,
          time_column: timeColumn,
          chunk_time_interval: "1 day",
        },
      });

      return success(undefined);
    } catch (error) {
      return failure(
        createQiError(
          "HYPERTABLE_CREATION_FAILED",
          `Failed to create hypertable: ${error}`,
          "SYSTEM",
        ),
      );
    }
  }

  /**
   * Create continuous aggregate for real-time views
   */
  async createContinuousAggregate(
    viewName: string,
    query: string,
    refreshPolicy = "INTERVAL '1 minute'",
  ): Promise<Result<void>> {
    if (!this.mcpClient) {
      return failure(
        createQiError("CLIENT_NOT_INITIALIZED", "MCP client not initialized", "SYSTEM"),
      );
    }

    try {
      await this.mcpClient.callTool({
        name: "create_continuous_aggregate",
        arguments: {
          project: this.config.azureResourceGroup,
          service: this.config.azureServerName,
          database: this.config.azureDatabaseName,
          view_name: viewName,
          query: query,
          refresh_policy: refreshPolicy,
        },
      });

      return success(undefined);
    } catch (error) {
      return failure(
        createQiError(
          "CONTINUOUS_AGGREGATE_CREATION_FAILED",
          `Failed to create continuous aggregate: ${error}`,
          "SYSTEM",
        ),
      );
    }
  }

  // =============================================================================
  // STATUS AND UTILITIES
  // =============================================================================

  async getStatus(): Promise<Result<any>> {
    try {
      return success({
        mcpClientInitialized: this.mcpClientInitialized,
        mcpClient: this.mcpClient ? "connected" : "disconnected",
        config: {
          azureResourceGroup: this.config.azureResourceGroup,
          azureServerName: this.config.azureServerName,
          azureDatabaseName: this.config.azureDatabaseName,
          connectionString: this.config.connectionString ? "[REDACTED]" : undefined,
        },
        isConnected: this.mcpClient !== null,
        errorCount: 0,
      });
    } catch (error) {
      return failure(
        createQiError("STATUS_ERROR", "Failed to get TimescaleDB MCP status", "SYSTEM", {
          error: String(error),
        }),
      );
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createTimescaleDBMCPMarketDataWriter(
  config: TimescaleDBMCPWriterConfig & { name: string },
): TimescaleDBMCPMarketDataWriter {
  return new TimescaleDBMCPMarketDataWriter(config);
}
