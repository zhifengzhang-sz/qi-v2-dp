#!/usr/bin/env bun

/**
 * Redpanda Market Data Writer - TRUE Actor Implementation
 *
 * Actor Definition: "A class that extends MarketDataWriter and provides DSL interfaces"
 *
 * @author QiCore Contributors
 * @version 1.0.0
 */

// =============================================================================
// PRIMARY EXPORTS
// =============================================================================

export {
  RedpandaMarketDataWriter,
  createRedpandaMarketDataWriter,
} from "./RedpandaMarketDataWriter";
export type { RedpandaWriterConfig } from "./RedpandaMarketDataWriter";

// Export unified types from DSL abstraction
export type {
  PublishOptions,
  BatchPublishOptions,
  PublishResult,
  BatchPublishResult,
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
} from "../../abstract/dsl";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default Redpanda destination configuration
 */
export const DEFAULT_REDPANDA_DESTINATIONS = {
  REDPANDA: "redpanda",
  DATABASE: "database",
  API: "api",
  FILE: "file",
} as const;

/**
 * Default writer configuration
 */
export const DEFAULT_WRITER_CONFIG = {
  BATCH_SIZE: 100,
  FLUSH_INTERVAL: 5000, // 5 seconds
  COMPRESSION: true,
  TIMEOUT: 30000,
} as const;
