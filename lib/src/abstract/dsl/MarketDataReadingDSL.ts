#!/usr/bin/env bun

/**
 * Market Data Reading DSL Interface Abstractions
 *
 * Universal DSL factory and types for reading market data operations.
 * Works across ALL sources - MCP, APIs, Databases, Files, etc.
 *
 * Supports both patterns:
 * - Actor Pattern (composition): DSL + associates with clients (≥0)
 * - MCP Actor Pattern (inheritance): IS a client + DSL
 */

import type { ResultType as Result } from "@qi/core/base";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Data,
  Level1Query,
} from "./MarketDataTypes";

// =============================================================================
// READING DSL INTERFACE
// =============================================================================

export interface MarketDataReadingDSL {
  /**
   * DSL Function 1: Get current price for a single coin
   */
  getCurrentPrice(coinId: string, vsCurrency?: string): Promise<Result<number>>;

  /**
   * DSL Function 2: Get current prices for multiple coins
   */
  getCurrentPrices(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<Result<CryptoPriceData[]>>;

  /**
   * DSL Function 3: Get current OHLCV data
   */
  getCurrentOHLCV(coinId: string, vsCurrency?: string): Promise<Result<CryptoOHLCVData>>;

  /**
   * DSL Function 4: Get latest OHLCV data for multiple coins
   */
  getLatestOHLCV(coinIds: string[], timeframe?: string): Promise<Result<CryptoOHLCVData[]>>;

  /**
   * DSL Function 5: Get price history
   */
  getPriceHistory(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<Result<CryptoPriceData[]>>;

  /**
   * DSL Function 6: Get OHLCV data by date range
   */
  getOHLCVByDateRange(query: DateRangeOHLCVQuery): Promise<Result<CryptoOHLCVData[]>>;

  /**
   * DSL Function 7: Get available tickers
   */
  getAvailableTickers(limit?: number): Promise<Result<CryptoPriceData[]>>;

  /**
   * DSL Function 8: Get Level 1 market data
   */
  getLevel1Data(query: Level1Query): Promise<Result<Level1Data>>;

  /**
   * DSL Function 9: Get market analytics
   */
  getMarketAnalytics(): Promise<Result<CryptoMarketAnalytics>>;
}
