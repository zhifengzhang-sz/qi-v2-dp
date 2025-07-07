#!/usr/bin/env bun

/**
 * Redpanda Market Data Writer - Clean Plugin Implementation
 *
 * This Writer:
 * - Extends BaseWriter for unified DSL foundation
 * - Implements only the plugin functions for Redpanda-specific logic
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
} from "../../abstract/dsl";
import { BaseWriter } from "../../abstract/writers/BaseWriter";
import { RedpandaClient } from "../../base/streaming/redpanda/redpanda-client";
import type { MessagePayload } from "../../base/streaming/redpanda/types";

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
// REDPANDA MARKET DATA WRITER - CLEAN PLUGIN IMPLEMENTATION
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
  // PLUGIN IMPLEMENTATIONS - REDPANDA-SPECIFIC PUBLISHING
  // =============================================================================

  protected async publishPricePlugin(
    data: CryptoPriceData,
    options?: PublishOptions,
  ): Promise<any> {
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

    return this.redpandaClient.produceBatch([message]);
  }

  protected async publishPricesPlugin(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<any> {
    const topic = options?.topic || this.config.topics?.prices || "crypto-prices";

    const messages: MessagePayload[] = data.map((price) => ({
      topic,
      key: this.createMessageKey(price),
      value: price,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    }));

    return this.redpandaClient.produceBatch(messages);
  }

  protected async publishOHLCVPlugin(
    data: CryptoOHLCVData,
    options?: PublishOptions,
  ): Promise<any> {
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

    return this.redpandaClient.produceBatch([message]);
  }

  protected async publishOHLCVBatchPlugin(
    data: CryptoOHLCVData[],
    options?: BatchPublishOptions,
  ): Promise<any> {
    const topic = options?.topic || this.config.topics?.ohlcv || "crypto-ohlcv";

    const messages: MessagePayload[] = data.map((ohlcv) => ({
      topic,
      key: this.createMessageKey(ohlcv),
      value: ohlcv,
      partition: options?.partition,
      timestamp: options?.timestamp?.getTime(),
      headers: options?.headers,
    }));

    return this.redpandaClient.produceBatch(messages);
  }

  protected async publishAnalyticsPlugin(
    data: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<any> {
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

    return this.redpandaClient.produceBatch([message]);
  }

  protected async publishLevel1Plugin(data: Level1Data, options?: PublishOptions): Promise<any> {
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

    return this.redpandaClient.produceBatch([message]);
  }

  protected async flushPlugin(timeoutMs?: number): Promise<any> {
    if (!this.redpandaClient) {
      throw new Error("RedpandaClient not initialized");
    }

    // Note: Flush is typically handled automatically by Kafka producer
    // This is a placeholder for any explicit flush logic
    return { flushed: true, timeout: timeoutMs || this.config.timeout || 30000 };
  }

  protected async createDestinationPlugin(
    name: string,
    config?: Record<string, any>,
  ): Promise<any> {
    // Use RedpandaClient to create topic
    await this.redpandaClient.createTopic({
      name,
      partitions: config?.partitions || 3,
      replicationFactor: config?.replicationFactor || 1,
      configs: config?.configs,
    });

    return {
      topic: name,
      partitions: config?.partitions || 3,
      replicationFactor: config?.replicationFactor || 1,
      created: true,
    };
  }

  protected async getPublishingMetricsPlugin(): Promise<any> {
    // Mock metrics - in real implementation would query Kafka metrics
    return {
      totalMessages: this.totalPublishes,
      successCount: this.totalPublishes - this.errorCount,
      failureCount: this.errorCount,
      averageLatency: 50, // ms
      throughput: this.calculateThroughput(),
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
