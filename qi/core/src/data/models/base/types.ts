/**
 * @fileoverview Base market data type definitions and interfaces
 * @module @qi/core/data/models/base
 *
 * @description
 * Core market data model types and interfaces used throughout the system for data representation.
 * Provides foundational data structures that all market data implementations must follow.
 *
 * @example Import Types
 * ```typescript
 * import { BaseMarketData, OHLCV, Tick } from '@qi/core/data/models/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-11
 */

/**
 * Base interface for all market data.
 * Provides common fields that all market data types must implement.
 *
 * @interface BaseMarketData
 *
 * @property {string} exchange - Exchange identifier (e.g., "binance", "kraken")
 * @property {string} symbol - Trading pair symbol (e.g., "BTC-USD", "ETH-USDT")
 * @property {number} timestamp - Unix timestamp in milliseconds
 *
 * @example
 * ```typescript
 * const marketData: BaseMarketData = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface BaseMarketData {
  exchange: string;
  symbol: string;
  timestamp: number;
}
