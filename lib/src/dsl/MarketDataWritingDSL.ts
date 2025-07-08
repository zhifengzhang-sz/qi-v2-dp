#!/usr/bin/env bun

/**
 * Market Data Writing DSL Interface Abstractions
 *
 * DSL interface contract for writing/publishing market data operations.
 * Works across ALL targets - MCP, Kafka, Database, Files, etc.
 */

import type { ResultType as Result } from "@qi/core/base";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
} from "./MarketDataTypes";

// Re-export shared types
export type { CryptoPriceData, CryptoOHLCVData, CryptoMarketAnalytics, Level1Data };

// =============================================================================
// PUBLISHING/WRITING TYPES
// =============================================================================

export interface PublishOptions {
  topic?: string;
  partition?: number;
  key?: string;
  headers?: Record<string, string>;
  timestamp?: Date;
  timeout?: number;
}

export interface PublishResult {
  messageId: string;
  topic: string;
  partition?: number;
  offset?: number;
  timestamp: Date;
  size: number;
}

export interface BatchPublishOptions extends PublishOptions {
  batchSize?: number;
  flushInterval?: number;
  compressionType?: "none" | "gzip" | "snappy" | "lz4";
}

export interface BatchPublishResult {
  totalMessages: number;
  successCount: number;
  failureCount: number;
  results: PublishResult[];
  errors?: Array<{ index: number; error: string }>;
  batchId: string;
  processingTime: number;
}

// =============================================================================
// WRITING DSL INTERFACE
// =============================================================================

export interface MarketDataWritingDSL {
  /**
   * DSL Function 1: Publish single price data
   */
  publishPrice(data: CryptoPriceData, options?: PublishOptions): Promise<Result<PublishResult>>;

  /**
   * DSL Function 1 (Batch): Publish multiple price data
   */
  publishPrices(
    data: CryptoPriceData[],
    options?: BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>>;

  /**
   * DSL Function 2: Publish single OHLCV data
   */
  publishOHLCV(data: CryptoOHLCVData, options?: PublishOptions): Promise<Result<PublishResult>>;

  /**
   * DSL Function 2 (Batch): Publish multiple OHLCV data
   */
  publishOHLCVBatch(
    data: CryptoOHLCVData[],
    options?: BatchPublishOptions,
  ): Promise<Result<BatchPublishResult>>;

  /**
   * DSL Function 3: Publish market analytics
   */
  publishAnalytics(
    data: CryptoMarketAnalytics,
    options?: PublishOptions,
  ): Promise<Result<PublishResult>>;

  /**
   * DSL Function 4: Publish Level 1 data
   */
  publishLevel1(data: Level1Data, options?: PublishOptions): Promise<Result<PublishResult>>;

  /**
   * DSL Function 5: Flush pending messages
   */
  flush(timeoutMs?: number): Promise<Result<void>>;

  /**
   * DSL Function 6: Create topic/destination
   */
  createDestination(name: string, config?: Record<string, any>): Promise<Result<void>>;

  /**
   * DSL Function 7: Get publishing metrics
   */
  getPublishingMetrics(): Promise<
    Result<{
      totalMessages: number;
      successRate: number;
      averageLatency: number;
      errorRate: number;
    }>
  >;
}
