#!/usr/bin/env bun

/**
 * Redpanda Market Data Writer - Clean Handler Implementation
 *
 * This Writer:
 * - Extends BaseWriter for unified DSL foundation
 * - Implements only the handler functions for Redpanda-specific logic
 * - BaseWriter handles all DSL interface + workflow complexity
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
} from "@qi/dp/dsl";
import { RedpandaClient } from "../../../base/streaming/redpanda/redpanda-client";
import type { MessagePayload } from "../../../base/streaming/redpanda/types";
import { BaseWriter } from "../../abstract/writers/BaseWriter";

// =============================================================================
// REDPANDA WRITER CONFIGURATION
// =============================================================================

export interface RedpandaWriterConfig {
  brokers: string[];
  clientId?: string;
  topics?: {
    prices?: string;
    ohlcv?: string;
    analytics?: string;
    level1?: string;
  };
  compression?: "none" | "gzip" | "snappy" | "lz4";
  batchSize?: number;
  flushInterval?: number;
  retries?: number;
  timeout?: number;
  debug?: boolean;
}

// =============================================================================
// REDPANDA MARKET DATA WRITER - CLEAN HANDLER IMPLEMENTATION
// =============================================================================

export class RedpandaMarketDataWriter extends BaseWriter {
  protected config: RedpandaWriterConfig & { name: string };
  private redpandaClient: RedpandaClient;
  private isConnected = false;

  constructor(config: RedpandaWriterConfig & { name: string }) {
    super({
      name: config.name || "redpanda-market-data-writer",
      debug: config.debug,
    });

    const defaultConfig = {
      brokers: ["localhost:19092"],
      clientId: "market-data-writer",
      topics: {
        prices: "crypto-prices",
        ohlcv: "crypto-ohlcv",
        analytics: "market-analytics",
        level1: "level1-data",
      },
      compression: "snappy" as const,
      batchSize: 100,
      flushInterval: 5000,
      retries: 3,
      timeout: 30000,
      debug: false,
    };

    this.config = {
      ...defaultConfig,
      ...config,
      topics: {
        ...defaultConfig.topics,
        ...config.topics,
      },
    };

    // Initialize RedpandaClient with config
    this.redpandaClient = new RedpandaClient({
      brokers: this.config.brokers,
      clientId: this.config.clientId,
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
        console.log("🚀 Initializing Redpanda Writer...");
      }

      // Connect to Redpanda using real client
      await this.redpandaClient.connect();
      this.isConnected = true;

      // Register client with BaseWriter's client management
      this.addClient("redpanda-kafka", this.redpandaClient, {
        name: "redpanda-kafka",
        type: "data-target",
      });

      // Mark client as connected
      const clientAssoc = this.getClient("redpanda-kafka");
      if (clientAssoc) {
        clientAssoc.isConnected = true;
      }

      this.isInitialized = true;

      if (this.config.debug) {
        console.log("✅ Connected to Redpanda cluster");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_INIT_FAILED",
        `Redpanda Writer initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up Redpanda Writer...");
      }

      if (this.isConnected) {
        await this.redpandaClient.disconnect();
        this.isConnected = false;
      }

      this.isInitialized = false;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "WRITER_CLEANUP_FAILED",
        `Redpanda Writer cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // HANDLER IMPLEMENTATIONS - REDPANDA-SPECIFIC PUBLISHING
  // =============================================================================

  protected async publishPriceHandler(
    data: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    const topic = options?.topic || this.config.topics?.prices || "crypto-prices";
    const key = this.createMessageKey(data);

    const message: MessagePayload = {
      topic,
      key,
      value: data,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    };

    const result = await this.redpandaClient.produceBatch([message]);

    // Transform raw Redpanda result to PublishResult
    return {
      messageId: `redpanda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      partition: result[0]?.partition || 0,
      offset: Number.parseInt(result[0]?.offset || "0", 10),
      timestamp: new Date(result[0]?.timestamp || Date.now()),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishPricesHandler(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const topic = options?.topic || this.config.topics?.prices || "crypto-prices";

    const messages: MessagePayload[] = data.map((price) => ({
      topic,
      key: this.createMessageKey(price),
      value: price,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    }));

    const results = await this.redpandaClient.produceBatch(messages);

    // Transform raw Redpanda results to BatchPublishResult
    const publishResults: PublishResult[] = results.map((result, index) => ({
      messageId: `redpanda-batch-${Date.now()}-${index}`,
      topic,
      partition: result.partition || 0,
      offset: Number.parseInt(result.offset || "0", 10),
      timestamp: new Date(result.timestamp || Date.now()),
      size: JSON.stringify(data[index]).length,
    }));

    return {
      totalMessages: results.length,
      successCount: results.length,
      failureCount: 0,
      results: publishResults,
      errors: [],
      batchId: `batch-${Date.now()}`,
      processingTime: 0, // Could track actual time if needed
    };
  }

  protected async publishOHLCVHandler(
    data: CryptoOHLCVData,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    const topic = options?.topic || this.config.topics?.ohlcv || "crypto-ohlcv";
    const key = this.createMessageKey(data);

    const message: MessagePayload = {
      topic,
      key,
      value: data,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    };

    const result = await this.redpandaClient.produceBatch([message]);

    // Transform raw Redpanda result to PublishResult
    return {
      messageId: `redpanda-ohlcv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      partition: result[0]?.partition || 0,
      offset: Number.parseInt(result[0]?.offset || "0", 10),
      timestamp: new Date(result[0]?.timestamp || Date.now()),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishOHLCVBatchHandler(
    data: CryptoOHLCVData[],
    options?: BatchPublishOptions,
  ): Promise<BatchPublishResult> {
    const topic = options?.topic || this.config.topics?.ohlcv || "crypto-ohlcv";

    const messages: MessagePayload[] = data.map((ohlcv) => ({
      topic,
      key: this.createMessageKey(ohlcv),
      value: ohlcv,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    }));

    const results = await this.redpandaClient.produceBatch(messages);

    // Transform raw Redpanda results to BatchPublishResult
    const publishResults: PublishResult[] = results.map((result, index) => ({
      messageId: `redpanda-ohlcv-batch-${Date.now()}-${index}`,
      topic,
      partition: result.partition || 0,
      offset: Number.parseInt(result.offset || "0", 10),
      timestamp: new Date(result.timestamp || Date.now()),
      size: JSON.stringify(data[index]).length,
    }));

    return {
      totalMessages: results.length,
      successCount: results.length,
      failureCount: 0,
      results: publishResults,
      errors: [],
      batchId: `ohlcv-batch-${Date.now()}`,
      processingTime: 0,
    };
  }

  protected async publishAnalyticsHandler(
    data: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    const topic = options?.topic || this.config.topics?.analytics || "market-analytics";
    const key = `analytics-${data.timestamp.getTime()}`;

    const message: MessagePayload = {
      topic,
      key,
      value: data,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    };

    const result = await this.redpandaClient.produceBatch([message]);

    // Transform raw Redpanda result to PublishResult
    return {
      messageId: `redpanda-analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      partition: result[0]?.partition || 0,
      offset: Number.parseInt(result[0]?.offset || "0", 10),
      timestamp: new Date(result[0]?.timestamp || Date.now()),
      size: JSON.stringify(data).length,
    };
  }

  protected async publishLevel1Handler(
    data: Level1Data,
    options?: PublishOptions,
  ): Promise<PublishResult> {
    const topic = options?.topic || this.config.topics?.level1 || "level1-data";
    const key = `${data.ticker}-${data.timestamp.getTime()}`;

    const message: MessagePayload = {
      topic,
      key,
      value: data,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    };

    const result = await this.redpandaClient.produceBatch([message]);

    // Transform raw Redpanda result to PublishResult
    return {
      messageId: `redpanda-level1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      topic,
      partition: result[0]?.partition || 0,
      offset: Number.parseInt(result[0]?.offset || "0", 10),
      timestamp: new Date(result[0]?.timestamp || Date.now()),
      size: JSON.stringify(data).length,
    };
  }

  protected async flushHandler(timeoutMs?: number): Promise<void> {
    if (!this.redpandaClient) {
      throw new Error("RedpandaClient not initialized");
    }

    // Note: Flush is typically handled automatically by Kafka producer
    // This is a placeholder for any explicit flush logic
    // No return value needed for void
  }

  protected async createDestinationHandler(
    name: string,
    config?: Record<string, any>,
  ): Promise<void> {
    // Use RedpandaClient to create topic
    await this.redpandaClient.createTopic({
      name,
      partitions: config?.partitions || 3,
      replicationFactor: config?.replicationFactor || 1,
      configs: config?.configs,
    });

    // No return value needed for void
  }

  protected async getPublishingMetricsHandler(): Promise<{
    totalMessages: number;
    successRate: number;
    averageLatency: number;
    errorRate: number;
  }> {
    // Mock metrics - in real implementation would query Kafka metrics
    const totalMessages = this.totalPublishes;
    const successCount = this.totalPublishes - this.errorCount;
    const failureCount = this.errorCount;

    return {
      totalMessages,
      successRate: totalMessages > 0 ? successCount / totalMessages : 0,
      averageLatency: 50, // ms
      errorRate: totalMessages > 0 ? failureCount / totalMessages : 0,
    };
  }

  // =============================================================================
  // TRANSFORM IMPLEMENTATIONS - REDPANDA-SPECIFIC DATA TRANSFORMATION
  // =============================================================================

  protected transformPublishResult(data: any): PublishResult {
    // Transform Kafka producer response to PublishResult
    const record = data[0]; // First message result

    return {
      messageId: this.generateMessageId(),
      topic: record.topicName || "unknown",
      partition: record.partition || 0,
      offset: record.baseOffset || 0,
      timestamp: new Date(),
      size: record.serializedKeySize + record.serializedValueSize || 0,
    };
  }

  protected transformBatchPublishResult(data: any): BatchPublishResult {
    const results: PublishResult[] = data.map((record: any) => ({
      messageId: this.generateMessageId(),
      topic: record.topicName || "unknown",
      partition: record.partition || 0,
      offset: record.baseOffset || 0,
      timestamp: new Date(),
      size: record.serializedKeySize + record.serializedValueSize || 0,
    }));

    return {
      totalMessages: results.length,
      successCount: results.length,
      failureCount: 0,
      results,
      batchId: this.generateMessageId(),
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
      successRate: data.successCount / data.totalMessages || 0,
      averageLatency: data.averageLatency || 0,
      errorRate: data.failureCount / data.totalMessages || 0,
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private createMessageKey(data: CryptoPriceData | CryptoOHLCVData): string {
    const timestamp = "timestamp" in data ? data.timestamp : data.lastUpdated;
    return `${data.coinId}-${timestamp.getTime()}`;
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private calculateThroughput(): number {
    if (!this.lastActivity) return 0;
    const timeDiff = Date.now() - this.lastActivity.getTime();
    return timeDiff > 0 ? (this.totalPublishes / timeDiff) * 1000 : 0; // messages per second
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isConnected,
      hasRedpandaClient: !!this.redpandaClient,
      brokers: this.config.brokers,
      topics: this.config.topics,
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

export function createRedpandaMarketDataWriter(
  config: RedpandaWriterConfig & { name: string },
): RedpandaMarketDataWriter {
  return new RedpandaMarketDataWriter(config);
}
