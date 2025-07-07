#!/usr/bin/env bun

/**
 * TimescaleDB Market Data Writer - Clean Plugin Implementation
 *
 * This Writer:
 * - Extends BaseWriter for unified DSL foundation
 * - Implements only the plugin functions for TimescaleDB-specific logic
 * - BaseWriter handles all DSL interface + workflow complexity
 * - Writes to TimescaleDB using real TimescaleClient
 */

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
import type {
  BatchPublishOptions,
  BatchPublishResult,
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
  PublishOptions,
  PublishResult,
} from "../../abstract/dsl";
import { BaseWriter } from "../../abstract/writers/BaseWriter";
import { TimescaleClient } from "../../base/database/timescale-client";
import type {
  TimescaleCryptoPrice,
  TimescaleMarketAnalytics,
  TimescaleOHLCV,
} from "../../base/database/timescale-client";

// =============================================================================
// TIMESCALE WRITER CONFIGURATION
// =============================================================================

export interface TimescaleWriterConfig {
  connectionString: string;
  poolConfig?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
}

// =============================================================================
// TIMESCALE MARKET DATA WRITER - CLEAN PLUGIN IMPLEMENTATION
// =============================================================================

export class TimescaleMarketDataWriter extends BaseWriter {
  protected config: TimescaleWriterConfig & { name: string };
  private timescaleClient: TimescaleClient;
  private isConnected = false;

  constructor(config: TimescaleWriterConfig & { name: string }) {
    super({
      name: config.name || "timescale-market-data-writer",
      debug: config.debug,
    });

    const defaultConfig = {
      connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/crypto_data",
      poolConfig: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      batchSize: 100,
      flushInterval: 5000,
      debug: false,
    };

    this.config = {
      ...defaultConfig,
      ...config,
      poolConfig: {
        ...defaultConfig.poolConfig,
        ...config.poolConfig,
      },
    };

    // Initialize TimescaleClient with config
    this.timescaleClient = new TimescaleClient(
      this.config.connectionString,
      this.config.poolConfig,
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
        console.log("🚀 Initializing TimescaleDB Writer...");
      }

      // Initialize TimescaleDB using real client
      await this.timescaleClient.initialize();
      this.isConnected = true;
      this.isInitialized = true;

      if (this.config.debug) {
        console.log("✅ Connected to TimescaleDB");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_INIT_FAILED",
        `TimescaleDB Writer initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up TimescaleDB Writer...");
      }

      if (this.isConnected) {
        await this.timescaleClient.destroy();
        this.isConnected = false;
      }

      this.isInitialized = false;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_CLEANUP_FAILED",
        `TimescaleDB Writer cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // PLUGIN IMPLEMENTATIONS - TIMESCALE-SPECIFIC DATABASE WRITING
  // =============================================================================

  protected async publishPricePlugin(
    data: CryptoPriceData,
    _options?: PublishOptions,
  ): Promise<any> {
    const timescalePrice: TimescaleCryptoPrice = {
      time: data.lastUpdated,
      coin_id: data.coinId,
      symbol: data.symbol,
      usd_price: data.usdPrice,
      btc_price: data.btcPrice,
      market_cap: data.marketCap,
      volume_24h: data.volume24h,
      change_24h: data.change24h,
      last_updated: data.lastUpdated.getTime(),
    };

    await this.timescaleClient.insertPrices([timescalePrice]);

    return {
      table: "crypto_prices",
      rowsInserted: 1,
      timestamp: new Date(),
      coinId: data.coinId,
    };
  }

  protected async publishPricesPlugin(
    data: CryptoPriceData[],
    _options?: BatchPublishOptions,
  ): Promise<any> {
    const timescalePrices: TimescaleCryptoPrice[] = data.map((price) => ({
      time: price.lastUpdated,
      coin_id: price.coinId,
      symbol: price.symbol,
      usd_price: price.usdPrice,
      btc_price: price.btcPrice,
      market_cap: price.marketCap,
      volume_24h: price.volume24h,
      change_24h: price.change24h,
      last_updated: price.lastUpdated.getTime(),
    }));

    await this.timescaleClient.insertPrices(timescalePrices);

    return {
      table: "crypto_prices",
      rowsInserted: data.length,
      timestamp: new Date(),
      batchId: this.generateMessageId(),
    };
  }

  protected async publishOHLCVPlugin(
    data: CryptoOHLCVData,
    _options?: PublishOptions,
  ): Promise<any> {
    const timescaleOHLCV: TimescaleOHLCV = {
      time: data.timestamp,
      coin_id: data.coinId,
      symbol: data.symbol || data.coinId.toUpperCase(),
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
      volume: data.volume,
      interval: data.timeframe,
    };

    await this.timescaleClient.insertOHLCV([timescaleOHLCV]);

    return {
      table: "ohlcv_data",
      rowsInserted: 1,
      timestamp: new Date(),
      coinId: data.coinId,
    };
  }

  protected async publishOHLCVBatchPlugin(
    data: CryptoOHLCVData[],
    _options?: BatchPublishOptions,
  ): Promise<any> {
    const timescaleOHLCVs: TimescaleOHLCV[] = data.map((ohlcv) => ({
      time: ohlcv.timestamp,
      coin_id: ohlcv.coinId,
      symbol: ohlcv.symbol || ohlcv.coinId.toUpperCase(),
      open: ohlcv.open,
      high: ohlcv.high,
      low: ohlcv.low,
      close: ohlcv.close,
      volume: ohlcv.volume,
      interval: ohlcv.timeframe,
    }));

    await this.timescaleClient.insertOHLCV(timescaleOHLCVs);

    return {
      table: "ohlcv_data",
      rowsInserted: data.length,
      timestamp: new Date(),
      batchId: this.generateMessageId(),
    };
  }

  protected async publishAnalyticsPlugin(
    data: CryptoMarketAnalytics,
    _options?: PublishOptions,
  ): Promise<any> {
    const timescaleAnalytics: TimescaleMarketAnalytics = {
      time: data.timestamp,
      total_market_cap: data.totalMarketCap,
      total_volume: data.totalVolume,
      btc_dominance: data.btcDominance,
      eth_dominance: data.ethDominance,
      active_cryptocurrencies: data.activeCryptocurrencies,
    };

    await this.timescaleClient.insertMarketAnalytics(timescaleAnalytics);

    return {
      table: "market_analytics",
      rowsInserted: 1,
      timestamp: new Date(),
    };
  }

  protected async publishLevel1Plugin(data: Level1Data, _options?: PublishOptions): Promise<any> {
    // Convert Level1 data to price format for storage
    const priceData: TimescaleCryptoPrice = {
      time: data.timestamp,
      coin_id: data.ticker.toLowerCase(),
      symbol: data.ticker.toUpperCase(),
      usd_price: (data.bestBid + data.bestAsk) / 2, // Mid price
      last_updated: data.timestamp.getTime(),
    };

    await this.timescaleClient.insertPrices([priceData]);

    return {
      table: "crypto_prices",
      rowsInserted: 1,
      timestamp: new Date(),
      ticker: data.ticker,
      dataType: "level1",
    };
  }

  protected async flushPlugin(_timeoutMs?: number): Promise<any> {
    if (!this.timescaleClient) {
      throw new Error("TimescaleClient not initialized");
    }

    // TimescaleDB auto-commits transactions, but we can ensure connection is healthy
    return { flushed: true, timestamp: new Date() };
  }

  protected async createDestinationPlugin(
    name: string,
    _config?: Record<string, any>,
  ): Promise<any> {
    // In TimescaleDB, "destinations" would be tables, which are already created
    // This could be used to create custom views or additional tables
    return {
      destination: name,
      type: "timescale_table",
      created: true,
      timestamp: new Date(),
    };
  }

  protected async getPublishingMetricsPlugin(): Promise<any> {
    // Get basic metrics from TimescaleDB
    const hypertables = await this.timescaleClient.listHypertables();

    return {
      totalMessages: this.totalPublishes,
      successCount: this.totalPublishes - this.errorCount,
      failureCount: this.errorCount,
      averageLatency: 50, // Approximate database write latency
      throughput: this.calculateThroughput(),
      database: {
        hypertables: hypertables.length,
        connected: this.isConnected,
      },
    };
  }

  // =============================================================================
  // TRANSFORM IMPLEMENTATIONS - TIMESCALE-SPECIFIC DATA TRANSFORMATION
  // =============================================================================

  protected transformPublishResult(data: any): PublishResult {
    return {
      messageId: this.generateMessageId(),
      topic: data.table || "unknown",
      partition: 0, // TimescaleDB doesn't have partitions like Kafka
      offset: 0,
      timestamp: new Date(),
      size: data.rowsInserted || 1,
    };
  }

  protected transformBatchPublishResult(data: any): BatchPublishResult {
    return {
      totalMessages: data.rowsInserted || 0,
      successCount: data.rowsInserted || 0,
      failureCount: 0,
      results: [
        {
          messageId: this.generateMessageId(),
          topic: data.table || "unknown",
          partition: 0,
          offset: 0,
          timestamp: new Date(),
          size: data.rowsInserted || 0,
        },
      ],
      batchId: data.batchId || this.generateMessageId(),
      processingTime: Date.now(),
    };
  }

  protected transformPublishingMetrics(data: any): {
    totalMessages: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
  } {
    return {
      totalMessages: data.totalMessages || 0,
      successRate: data.successCount / data.totalMessages || 1.0,
      averageLatency: data.averageLatency || 0,
      errorRate: data.failureCount / data.totalMessages || 0,
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private calculateThroughput(): number {
    if (!this.lastActivity) return 0;
    const timeDiff = Date.now() - this.lastActivity.getTime();
    return timeDiff > 0 ? (this.totalPublishes / timeDiff) * 1000 : 0; // writes per second
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      hasTimescaleClient: !!this.timescaleClient,
      connectionString: this.config.connectionString.replace(/:[^:@]*@/, ":****@"), // Hide password
      poolConfig: this.config.poolConfig,
      lastActivity: this.lastActivity,
      totalPublishes: this.totalPublishes,
      errorCount: this.errorCount,
      throughput: this.calculateThroughput(),
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createTimescaleMarketDataWriter(
  config: TimescaleWriterConfig & { name: string },
): TimescaleMarketDataWriter {
  return new TimescaleMarketDataWriter(config);
}
