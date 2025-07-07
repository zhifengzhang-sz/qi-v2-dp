#!/usr/bin/env bun

/**
 * Redpanda Market Data Writer - TRUE Actor Implementation
 *
 * Actor Definition: "A class that extends MarketDataWriter and provides DSL interfaces"
 *
 * This Writer:
 * - IS a MarketDataWriter (extends MarketDataWriter base class)
 * - Provides financial market data writing DSL interfaces for Redpanda targets
 * - Uses qicore Result<T> for functional error handling
 * - Can write to Redpanda streams, databases, and other destinations
 */

// No MCP imports needed for Actor pattern
import {
  BaseWriter,
  type BatchPublishOptions,
  type BatchPublishResult,
  type CryptoMarketAnalytics,
  type CryptoOHLCVData,
  type CryptoPriceData,
  type Level1Data,
  type PublishOptions,
  type PublishResult,
} from "../../abstract/writers/BaseWriter";

// Types are exported from the index file and DSL abstraction

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";

import { RedpandaClient } from "../../base/streaming/redpanda/redpanda-client";
import type { MessagePayload, ProducerResponse } from "../../base/streaming/redpanda/types";

// =============================================================================
// REDPANDA MARKET DATA WRITER CONFIGURATION
// =============================================================================

export interface RedpandaMarketDataWriterConfig {
  brokers?: string[];
  clientId?: string;
  topics?: {
    prices?: string;
    ohlcv?: string;
    analytics?: string;
    level1?: string;
  };
  enableCompression?: boolean;
  batchSize?: number;
  flushInterval?: number;
  debug?: boolean;
  timeout?: number;
  autoCreateTopics?: boolean;
}

// =============================================================================
// MESSAGE PREPARATION UTILITIES
// =============================================================================

interface PreparedMessage {
  topic: string;
  key?: string;
  value: any;
  partition?: number;
  timestamp?: number;
  headers?: Record<string, string>;
}

// =============================================================================
// REDPANDA MARKET DATA WRITER - TRUE ACTOR IMPLEMENTATION
// =============================================================================

/**
 * Redpanda Market Data Writer - TRUE Actor Pattern Implementation
 *
 * Inheritance Chain: Client (MCP SDK) → MarketDataWriter → RedpandaMarketDataWriter
 *
 * This makes RedpandaMarketDataWriter a TRUE MCP client that provides cryptocurrency
 * market data writing DSL interfaces with Redpanda target support.
 */
export class RedpandaMarketDataWriterActor extends BaseWriter {
  protected config: RedpandaMarketDataWriterConfig & { name: string };
  protected isInitialized = false;
  protected serverConnected = false;
  protected totalWrites = 0;
  protected errorCount = 0;
  protected pendingWrites = 0;
  protected lastActivity?: Date = undefined;
  private redpandaClient?: RedpandaClient;
  private batchBuffer: Array<{
    type: string;
    data: any;
    options?: PublishOptions;
  }> = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: RedpandaMarketDataWriterConfig & { name: string }) {
    // Call Actor constructor - makes this a TRUE Actor (composition pattern)
    super({
      name: config.name || "redpanda-market-data-writer",
      debug: config.debug,
    });

    this.config = {
      brokers: ["localhost:9092"],
      clientId: "redpanda-market-data-writer",
      topics: {
        prices: "crypto-prices",
        ohlcv: "crypto-ohlcv",
        analytics: "crypto-analytics",
        level1: "crypto-level1",
      },
      enableCompression: true,
      batchSize: 100,
      flushInterval: 5000, // 5 seconds
      debug: false,
      timeout: 30000,
      autoCreateTopics: true,
      ...config,
      name: config.name,
    };
  }

  // =============================================================================
  // WRITER LIFECYCLE - REQUIRED IMPLEMENTATIONS
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🎭 Initializing Redpanda Market Data TRUE Writer...");
      }

      // Initialize RedpandaClient using the excellent base infrastructure
      this.redpandaClient = new RedpandaClient({
        clientId: this.config.clientId || "redpanda-market-data-writer",
        brokers: this.config.brokers || ["localhost:9092"],
      });

      await this.redpandaClient.connect();

      // Create topics if needed
      if (this.config.autoCreateTopics) {
        await this.createRequiredTopics();
      }

      // No MCP connection needed for Actor pattern

      // Start periodic flush
      this.startPeriodicFlush();

      this.isInitialized = true;
      this.serverConnected = true;

      if (this.config.debug) {
        console.log("✅ Redpanda Market Data TRUE Writer initialized - IS MCP client");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_INIT_FAILED",
        `Redpanda Market Data Writer initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up CoinGecko TRUE Writer...");
      }

      // Stop periodic flush
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }

      // Flush remaining buffered data
      await this.flush();

      // Cleanup RedpandaClient
      if (this.redpandaClient) {
        await this.redpandaClient.disconnect();
      }

      // No MCP connection to close for Actor pattern
      this.serverConnected = false;

      this.isInitialized = false;

      if (this.config.debug) {
        console.log("✅ CoinGecko TRUE Writer cleanup completed");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_CLEANUP_FAILED",
        `Redpanda Market Data Writer cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // FINANCIAL MARKET DATA WRITING DSL - IMPLEMENTATIONS
  // =============================================================================

  /**
   * DSL Function 1: Write current price data
   */
  async publishPrice(
    priceData: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    if (!this.validatePriceData(priceData)) {
      return failure(
        createQiError("INVALID_PRICE_DATA", "Price data validation failed", "BUSINESS"),
      );
    }

    try {
      const payload = this.prepareRedpandaMessage(priceData, "price");
      const writeResult = await this.writeToDestinations(payload, options);

      this.totalWrites++;
      this.lastActivity = new Date();

      return success(writeResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "PRICE_WRITE_FAILED",
          `Failed to write price data: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { priceData, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 1 (Multi): Write multiple price data entries
   */
  async publishPrices(
    pricesData: CryptoPriceData[],
    options?: PublishOptions & BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    try {
      const validPrices = pricesData.filter((price) => this.validatePriceData(price));
      if (validPrices.length === 0) {
        return failure(
          createQiError("NO_VALID_PRICE_DATA", "No valid price data to write", "BUSINESS"),
        );
      }

      const payloads = validPrices.map((price) => this.prepareRedpandaMessage(price, "price"));
      const batchResult = await this.writeBatchToDestinations(payloads, options);

      this.totalWrites += validPrices.length;
      this.lastActivity = new Date();

      return success(batchResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "PRICES_WRITE_FAILED",
          `Failed to write prices data: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { count: pricesData.length, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 2: Write OHLCV data
   */
  async publishOHLCV(
    ohlcvData: CryptoOHLCVData,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    if (!this.validateOHLCVData(ohlcvData)) {
      return failure(
        createQiError("INVALID_OHLCV_DATA", "OHLCV data validation failed", "BUSINESS"),
      );
    }

    try {
      const payload = this.prepareRedpandaMessage(ohlcvData, "ohlcv");
      const writeResult = await this.writeToDestinations(payload, options);

      this.totalWrites++;
      this.lastActivity = new Date();

      return success(writeResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "OHLCV_WRITE_FAILED",
          `Failed to write OHLCV data: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { ohlcvData, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 2 (Multi): Write multiple OHLCV data entries
   */
  async publishOHLCVBatch(
    ohlcvData: CryptoOHLCVData[],
    options?: PublishOptions & BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    try {
      const validOHLCV = ohlcvData.filter((data) => this.validateOHLCVData(data));
      if (validOHLCV.length === 0) {
        return failure(
          createQiError("NO_VALID_OHLCV_DATA", "No valid OHLCV data to write", "BUSINESS"),
        );
      }

      const payloads = validOHLCV.map((data) => this.prepareRedpandaMessage(data, "ohlcv"));
      const batchResult = await this.writeBatchToDestinations(payloads, options);

      this.totalWrites += validOHLCV.length;
      this.lastActivity = new Date();

      return success(batchResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "OHLCV_BATCH_WRITE_FAILED",
          `Failed to write OHLCV batch: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { count: ohlcvData.length, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 3: Write market analytics data
   */
  async publishAnalytics(
    analyticsData: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    if (!this.validateAnalyticsData(analyticsData)) {
      return failure(
        createQiError("INVALID_ANALYTICS_DATA", "Analytics data validation failed", "BUSINESS"),
      );
    }

    try {
      const payload = this.prepareRedpandaMessage(analyticsData, "analytics");
      const writeResult = await this.writeToDestinations(payload, options);

      this.totalWrites++;
      this.lastActivity = new Date();

      return success(writeResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "ANALYTICS_WRITE_FAILED",
          `Failed to write analytics data: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { analyticsData, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 4: Write raw event data
   */
  async publishRawEvent(
    eventType: string,
    data: any,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    try {
      const payload = this.prepareRedpandaMessage(data, eventType);
      const writeResult = await this.writeToDestinations(payload, options);

      this.totalWrites++;
      this.lastActivity = new Date();

      return success(writeResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "RAW_EVENT_WRITE_FAILED",
          `Failed to write raw event data: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { eventType, data, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 5: Write custom market data
   */
  async writeCustomData(
    data: any,
    dataType: string,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    try {
      const payload = this.prepareRedpandaMessage(data, dataType);
      const writeResult = await this.writeToDestinations(payload, options);

      this.totalWrites++;
      this.lastActivity = new Date();

      return success(writeResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "CUSTOM_DATA_WRITE_FAILED",
          `Failed to write custom data: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { data, dataType, options, error },
        ),
      );
    }
  }

  /**
   * DSL Function 6: Batch write mixed data types
   */
  async writeBatch(
    batch: Array<{
      type: "price" | "ohlcv" | "analytics" | "level1" | "custom";
      data: any;
      options?: PublishOptions;
    }>,
    options?: BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>> {
    if (!this.isInitialized) {
      return failure(createQiError("WRITER_NOT_INITIALIZED", "Writer not initialized", "BUSINESS"));
    }

    try {
      const payloads = batch.map((item) => this.prepareRedpandaMessage(item.data, item.type));
      const batchResult = await this.writeBatchToDestinations(payloads, options);

      this.totalWrites += batch.length;
      this.lastActivity = new Date();

      return success(batchResult);
    } catch (error: unknown) {
      this.errorCount++;
      return failure(
        createQiError(
          "BATCH_WRITE_FAILED",
          `Failed to write batch: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { batchSize: batch.length, options, error },
        ),
      );
    }
  }

  // =============================================================================
  // STREAM MANAGEMENT OPERATIONS
  // =============================================================================

  async createDestination(
    destination: string,
    config?: Record<string, any>,
  ): Promise<Result<void>> {
    try {
      if (!this.redpandaClient) {
        throw new Error("RedpandaClient not initialized");
      }

      // Create topic if it doesn't exist
      await this.redpandaClient.createTopic({
        name: destination,
        partitions: config?.partitions || 3,
        replicationFactor: config?.replicationFactor || 1,
        configs: config?.configs,
      });

      return success(undefined);
    } catch (error: unknown) {
      return failure(
        createQiError(
          "DESTINATION_ENSURE_FAILED",
          `Failed to ensure destination: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { destination, config, error },
        ),
      );
    }
  }

  async flush(): Promise<Result<void>> {
    try {
      // Flush buffered data
      if (this.batchBuffer.length > 0) {
        const batch = [...this.batchBuffer];
        this.batchBuffer = [];

        const payloads = batch.map((item) => this.prepareRedpandaMessage(item.data, item.type));
        await this.writeBatchToDestinations(payloads);
      }

      // RedpandaClient handles its own flushing internally
      return success(undefined);
    } catch (error: unknown) {
      return failure(
        createQiError(
          "FLUSH_FAILED",
          `Failed to flush: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { error },
        ),
      );
    }
  }

  async getPublishingMetrics(): Promise<
    Result<{
      totalMessages: number;
      successRate: number;
      averageLatency: number;
      errorRate: number;
      throughput: number;
    }>
  > {
    const totalMessages = this.totalWrites;
    const successRate =
      totalMessages > 0 ? ((totalMessages - this.errorCount) / totalMessages) * 100 : 100;
    const errorRate = totalMessages > 0 ? (this.errorCount / totalMessages) * 100 : 0;

    return success({
      totalMessages,
      successRate,
      averageLatency: 0, // TODO: implement latency tracking
      errorRate,
      throughput: 0, // TODO: implement throughput calculation
    });
  }

  async getDestinationInfo(destination?: string): Promise<
    Result<{
      destinations: string[];
      partitions?: number;
      replicas?: number;
      configs?: Record<string, any>;
    }>
  > {
    try {
      if (!this.redpandaClient) {
        throw new Error("RedpandaClient not initialized");
      }

      const topics = await this.redpandaClient.listTopics();

      let topicInfo: Awaited<ReturnType<typeof this.redpandaClient.getTopicMetadata>> | undefined;
      if (destination && topics.includes(destination)) {
        topicInfo = await this.redpandaClient.getTopicMetadata(destination);
      }

      return success({
        destinations: topics,
        partitions: topicInfo?.partitions.length,
        replicas: topicInfo?.partitions[0]?.replicas.length,
        configs: topicInfo?.configs,
      });
    } catch (error: unknown) {
      return failure(
        createQiError(
          "DESTINATION_INFO_FAILED",
          `Failed to get destination info: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { destination, error },
        ),
      );
    }
  }

  // =============================================================================
  // WRITER STATUS - REQUIRED IMPLEMENTATION
  // =============================================================================

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.serverConnected,
      serverName: "redpanda-market-data-writer",
      lastActivity: this.lastActivity,
      totalWrites: this.totalWrites,
      errorCount: this.errorCount,
      pendingWrites: this.pendingWrites,
      bufferedItems: this.batchBuffer.length,
      topics: this.config.topics ? Object.values(this.config.topics) : [],
      brokers: this.config.brokers,
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  // No transport creation needed for Actor pattern - uses RedpandaClient directly

  private async createRequiredTopics(): Promise<void> {
    if (!this.redpandaClient || !this.config.topics) {
      return;
    }

    const topics = Object.values(this.config.topics).filter(Boolean);

    for (const topicName of topics) {
      try {
        await this.redpandaClient.createTopic({
          name: topicName,
          partitions: 3,
          replicationFactor: 1,
        });
      } catch (error) {
        if (this.config.debug) {
          console.log(`Topic ${topicName} creation result:`, error);
        }
      }
    }
  }

  private prepareRedpandaMessage(data: any, dataType: string): PreparedMessage {
    let topic: string;

    switch (dataType) {
      case "price":
        topic = this.config.topics?.prices || "crypto-prices";
        break;
      case "ohlcv":
        topic = this.config.topics?.ohlcv || "crypto-ohlcv";
        break;
      case "analytics":
        topic = this.config.topics?.analytics || "crypto-analytics";
        break;
      case "level1":
        topic = this.config.topics?.level1 || "crypto-level1";
        break;
      default:
        topic = `crypto-${dataType}`;
    }

    return {
      topic,
      key: data.symbol || data.pair || data.instrument,
      value: data,
      timestamp: Date.now(),
      headers: {
        "data-type": dataType,
        source: this.getWriterSource(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async writeToDestinations(
    payload: PreparedMessage,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    this.pendingWrites++;

    try {
      if (!this.redpandaClient) {
        throw new Error("RedpandaClient not initialized");
      }

      const messagePayload: MessagePayload = {
        topic: payload.topic,
        key: payload.key,
        value: payload.value,
        partition: payload.partition,
        timestamp: payload.timestamp || Date.now(),
        headers: payload.headers,
      };

      const result = await this.redpandaClient.produceMessage(messagePayload);

      return {
        success: true,
        messageId: `${result.topic}-${result.partition}-${result.offset}`,
        offset: Number(result.offset),
        partition: result.partition,
        timestamp: new Date(result.timestamp),
      };
    } catch (error: unknown) {
      return {
        success: false,
        messageId: "",
        offset: 0,
        partition: 0,
        timestamp: new Date(),
      };
    } finally {
      this.pendingWrites--;
    }
  }

  private async writeBatchToDestinations(
    payloads: PreparedMessage[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    this.pendingWrites += payloads.length;

    try {
      if (!this.redpandaClient) {
        throw new Error("RedpandaClient not initialized");
      }

      const startTime = Date.now();

      const messagePayloads: MessagePayload[] = payloads.map((payload) => ({
        topic: payload.topic,
        key: payload.key,
        value: payload.value,
        partition: payload.partition,
        timestamp: payload.timestamp || Date.now(),
        headers: payload.headers,
      }));

      const results = await this.redpandaClient.produceBatch(messagePayloads);

      const writeResults = results.map((result) => ({
        success: true,
        messageId: `${result.topic}-${result.partition}-${result.offset}`,
        offset: Number(result.offset),
        partition: result.partition,
        timestamp: new Date(result.timestamp),
      }));

      return {
        totalMessages: results.length,
        successCount: results.length,
        failureCount: 0,
        results: writeResults,
      };
    } catch (error: unknown) {
      const failedResults = payloads.map(() => ({
        success: false,
        messageId: "",
        offset: 0,
        partition: 0,
        timestamp: new Date(),
      }));

      return {
        totalMessages: payloads.length,
        successCount: 0,
        failureCount: payloads.length,
        results: failedResults,
        errors: [{ index: 0, error: error instanceof Error ? error.message : String(error) }],
      };
    } finally {
      this.pendingWrites -= payloads.length;
    }
  }

  private startPeriodicFlush(): void {
    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush().catch((error) => {
          if (this.config.debug) {
            console.log("Periodic flush error:", error);
          }
        });
      }, this.config.flushInterval);
    }
  }

  protected getWriterSource(): string {
    return "redpanda-market-data-writer";
  }

  // Validation methods from base class
  protected validatePriceData(data: CryptoPriceData): boolean {
    return !!(data?.coinId && data.usdPrice && data.lastUpdated);
  }

  protected validateOHLCVData(data: CryptoOHLCVData): boolean {
    return !!(data?.coinId && data.open && data.high && data.low && data.close && data.timestamp);
  }

  protected validateAnalyticsData(data: CryptoMarketAnalytics): boolean {
    return !!(data?.totalMarketCap && data.timestamp);
  }

  protected validateLevel1Data(data: Level1Data): boolean {
    return !!(data?.ticker && data.bestBid && data.bestAsk && data.timestamp);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createRedpandaMarketDataWriter(
  config: RedpandaMarketDataWriterConfig & { name: string },
): RedpandaMarketDataWriterActor {
  return new RedpandaMarketDataWriterActor(config);
}
