#!/usr/bin/env bun

/**
 * TimescaleDB Market Data Writer - Clean Handler Implementation
 *
 * This Writer:
 * - Extends BaseWriter for unified DSL foundation
 * - Implements only the handler functions for TimescaleDB-specific logic
 * - BaseWriter handles all DSL interface + workflow complexity
 * - Writes to TimescaleDB using real TimescaleClient
 */

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
import { DrizzleClient } from "../../../base/database/drizzle-client";
import type {
  CryptoPriceInsert,
  MarketAnalyticsInsert,
  OHLCVDataInsert,
} from "../../../base/database/schema";
import type {
  BatchPublishOptions,
  BatchPublishResult,
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
  PublishOptions,
  PublishResult,
} from "../../../dsl";
import { BaseWriter } from "../../abstract/writers/BaseWriter";

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
// TIMESCALE MARKET DATA WRITER - CLEAN HANDLER IMPLEMENTATION
// =============================================================================

export class TimescaleMarketDataWriter extends BaseWriter {
  protected config: TimescaleWriterConfig & { name: string };
  private drizzleClient: DrizzleClient;
  private isConnected = false;

  constructor(config: TimescaleWriterConfig & { name: string }) {
    super({
      name: config.name || "timescale-market-data-writer",
      debug: config.debug,
    });

    const defaultConfig = {
      connectionString:
        process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/cryptodb",
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

    // Initialize DrizzleClient with config
    this.drizzleClient = new DrizzleClient({
      connectionString: this.config.connectionString,
      poolConfig: this.config.poolConfig,
      debug: this.config.debug,
    });
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

      // Initialize TimescaleDB using Drizzle client
      await this.drizzleClient.initialize();
      this.isConnected = true;

      // Register client with BaseWriter's client management
      this.addClient("timescale-db", this.drizzleClient, {
        name: "timescale-db",
        type: "data-target",
      });

      // Mark client as connected
      const clientAssoc = this.getClient("timescale-db");
      if (clientAssoc) {
        clientAssoc.isConnected = true;
      }

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
        await this.drizzleClient.close();
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
  // HANDLER IMPLEMENTATIONS - TIMESCALE-SPECIFIC DATABASE WRITING
  // =============================================================================

  protected async publishPriceHandler(
    data: CryptoPriceData,
    _options?: PublishOptions,
  ): Promise<PublishResult> {
    const cryptoPrice: CryptoPriceInsert = {
      time: data.lastUpdated,
      coinId: data.coinId,
      symbol: data.symbol,
      name: data.name,
      usdPrice: data.usdPrice.toString(),
      btcPrice: data.btcPrice?.toString(),
      ethPrice: data.ethPrice?.toString(),
      marketCap: data.marketCap?.toString(),
      volume24h: data.volume24h?.toString(),
      change24h: data.change24h?.toString(),
      change7d: data.change7d?.toString(),
      lastUpdated: data.lastUpdated,
      source: data.source,
      attribution: data.attribution,
      exchangeId: data.exchangeId, // Added required field
    };

    await this.drizzleClient.insertCryptoPrices([cryptoPrice]);

    return {
      messageId: this.generateMessageId(),
      topic: "crypto_prices",
      partition: 0,
      offset: 0,
      timestamp: new Date(),
      size: 1,
    };
  }

  protected async publishPricesHandler(
    data: CryptoPriceData[],
    _options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const cryptoPrices: CryptoPriceInsert[] = data.map((price) => ({
      time: price.lastUpdated,
      coinId: price.coinId,
      symbol: price.symbol,
      name: price.name,
      usdPrice: price.usdPrice.toString(),
      btcPrice: price.btcPrice?.toString(),
      ethPrice: price.ethPrice?.toString(),
      marketCap: price.marketCap?.toString(),
      volume24h: price.volume24h?.toString(),
      change24h: price.change24h?.toString(),
      change7d: price.change7d?.toString(),
      lastUpdated: price.lastUpdated,
      source: price.source,
      attribution: price.attribution,
      exchangeId: price.exchangeId, // Added required field
    }));

    await this.drizzleClient.insertCryptoPrices(cryptoPrices);

    const results: PublishResult[] = data.map((_, index) => ({
      messageId: `timescale-batch-${Date.now()}-${index}`,
      topic: "crypto_prices",
      partition: 0,
      offset: 0,
      timestamp: new Date(),
      size: 1,
    }));

    return {
      totalMessages: data.length,
      successCount: data.length,
      failureCount: 0,
      results,
      errors: [],
      batchId: this.generateMessageId(),
      processingTime: 0,
    };
  }

  protected async publishOHLCVHandler(
    data: CryptoOHLCVData,
    _options?: PublishOptions,
  ): Promise<PublishResult> {
    const ohlcvData: OHLCVDataInsert = {
      time: data.timestamp,
      coinId: data.coinId,
      symbol: data.symbol || data.coinId.toUpperCase(),
      timeframe: data.timeframe,
      open: data.open.toString(),
      high: data.high.toString(),
      low: data.low.toString(),
      close: data.close.toString(),
      volume: data.volume.toString(),
      source: data.source,
      attribution: data.attribution,
      exchangeId: data.exchangeId, // Added required field
    };

    await this.drizzleClient.insertOHLCVData([ohlcvData]);

    return {
      messageId: this.generateMessageId(),
      topic: "ohlcv_data",
      partition: 0,
      offset: 0,
      timestamp: new Date(),
      size: 1,
    };
  }

  protected async publishOHLCVBatchHandler(
    data: CryptoOHLCVData[],
    _options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const ohlcvDataArray: OHLCVDataInsert[] = data.map((ohlcv) => ({
      time: ohlcv.timestamp,
      coinId: ohlcv.coinId,
      symbol: ohlcv.symbol || ohlcv.coinId.toUpperCase(),
      timeframe: ohlcv.timeframe,
      open: ohlcv.open.toString(),
      high: ohlcv.high.toString(),
      low: ohlcv.low.toString(),
      close: ohlcv.close.toString(),
      volume: ohlcv.volume.toString(),
      source: ohlcv.source,
      attribution: ohlcv.attribution,
      exchangeId: ohlcv.exchangeId, // Added required field
    }));

    await this.drizzleClient.insertOHLCVData(ohlcvDataArray);

    const results: PublishResult[] = data.map((_, index) => ({
      messageId: `timescale-ohlcv-batch-${Date.now()}-${index}`,
      topic: "ohlcv_data",
      partition: 0,
      offset: 0,
      timestamp: new Date(),
      size: 1,
    }));

    return {
      totalMessages: data.length,
      successCount: data.length,
      failureCount: 0,
      results,
      errors: [],
      batchId: this.generateMessageId(),
      processingTime: 0,
    };
  }

  protected async publishAnalyticsHandler(
    data: CryptoMarketAnalytics,
    _options?: PublishOptions,
  ): Promise<PublishResult> {
    const marketAnalytics: MarketAnalyticsInsert = {
      time: data.timestamp,
      totalMarketCap: data.totalMarketCap.toString(),
      totalVolume: data.totalVolume.toString(),
      btcDominance: data.btcDominance.toString(),
      ethDominance: data.ethDominance?.toString(),
      activeCryptocurrencies: data.activeCryptocurrencies,
      markets: data.markets,
      marketCapChange24h: data.marketCapChange24h.toString(),
      source: data.source,
      attribution: data.attribution,
    };

    await this.drizzleClient.insertMarketAnalytics(marketAnalytics);

    return {
      messageId: this.generateMessageId(),
      topic: "market_analytics",
      partition: 0,
      offset: 0,
      timestamp: new Date(),
      size: 1,
    };
  }

  protected async publishLevel1Handler(
    data: Level1Data,
    _options?: PublishOptions,
  ): Promise<PublishResult> {
    // Convert Level1 data to price format for storage
    const priceData: CryptoPriceInsert = {
      time: data.timestamp,
      coinId: data.ticker.toLowerCase(),
      symbol: data.ticker.toUpperCase(),
      usdPrice: ((data.bestBid + data.bestAsk) / 2).toString(), // Mid price
      lastUpdated: data.timestamp,
      source: data.source,
      attribution: data.attribution,
      exchangeId: data.exchange, // Added required field
    };

    await this.drizzleClient.insertCryptoPrices([priceData]);

    return {
      messageId: this.generateMessageId(),
      topic: "crypto_prices",
      partition: 0,
      offset: 0,
      timestamp: new Date(),
      size: 1,
    };
  }

  protected async flushHandler(_timeoutMs?: number): Promise<void> {
    if (!this.drizzleClient) {
      throw new Error("DrizzleClient not initialized");
    }

    // TimescaleDB auto-commits transactions, but we can ensure connection is healthy
    // No return value needed for void
  }

  protected async createDestinationHandler(
    name: string,
    _config?: Record<string, any>,
  ): Promise<void> {
    // In TimescaleDB, "destinations" would be tables, which are already created
    // This could be used to create custom views or additional tables
    // No return value needed for void
  }

  protected async getPublishingMetricsHandler(): Promise<{
    totalMessages: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
  }> {
    // Get basic metrics from TimescaleDB
    const totalMessages = this.totalPublishes;
    const successCount = this.totalPublishes - this.errorCount;
    const failureCount = this.errorCount;

    return {
      totalMessages,
      successRate: totalMessages > 0 ? successCount / totalMessages : 0,
      averageLatency: 50, // Approximate database write latency
      errorRate: totalMessages > 0 ? failureCount / totalMessages : 0,
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
      hasDrizzleClient: !!this.drizzleClient,
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
