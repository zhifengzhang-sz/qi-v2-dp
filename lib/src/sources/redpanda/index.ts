#!/usr/bin/env bun

/**
 * Redpanda Market Data Reader - TRUE Actor Implementation
 *
 * Actor Definition: "A class that extends MarketDataReader and provides DSL interfaces"
 *
 * @author QiCore Contributors
 * @version 1.0.0
 */

// =============================================================================
// PRIMARY EXPORTS
// =============================================================================

export { RedpandaMarketDataReader, createRedpandaMarketDataReader } from "./MarketDataReader";
export type { RedpandaReaderConfig } from "./MarketDataReader";

// Export unified types from DSL abstraction
export type {
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
  DateRangeOHLCVQuery,
  Level1Query,
  CurrentPricesOptions,
} from "../../abstract/dsl";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default Redpanda topics for cryptocurrency data
 */
export const DEFAULT_CRYPTO_TOPICS = {
  PRICES: "crypto-prices",
  OHLCV: "crypto-ohlcv",
  ANALYTICS: "crypto-analytics",
  LEVEL1: "crypto-level1",
} as const;

/**
 * Default Redpanda configuration
 */
export const DEFAULT_REDPANDA_CONFIG = {
  BROKERS: ["localhost:9092"],
  GROUP_ID: "crypto-market-data-reader",
  TIMEOUT: 30000,
  CACHE_EXPIRY: 60000, // 1 minute
} as const;
