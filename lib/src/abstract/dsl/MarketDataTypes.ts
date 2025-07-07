#!/usr/bin/env bun

/**
 * Market Data Types - Independent Data Class Definitions
 *
 * These data classes are used by both readers and writers.
 * No dependencies on DSL implementations - pure data structures.
 */

// =============================================================================
// CLIENT ASSOCIATION TYPES
// =============================================================================

export interface ClientConfig {
  type:
    | "mcp"
    | "api"
    | "database"
    | "data-source"
    | "data-sink"
    | "data-target"
    | "cache"
    | "kafka"
    | "analytics";
  name: string;
  options?: Record<string, any>;
}

export interface ClientAssociation {
  client: any;
  config: ClientConfig;
  isConnected: boolean;
  errorCount: number;
}

// =============================================================================
// MARKET DATA TYPES
// =============================================================================

export interface CryptoPriceData {
  coinId: string;
  symbol: string;
  name?: string;
  usdPrice: number;
  btcPrice?: number;
  ethPrice?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  change7d?: number;
  lastUpdated: Date;
  source: string;
  attribution: string;
}

export interface CryptoOHLCVData {
  coinId: string;
  symbol?: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  source: string;
  attribution: string;
}

export interface CryptoMarketAnalytics {
  timestamp: Date;
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance?: number;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChange24h: number;
  source: string;
  attribution: string;
}

export interface Level1Data {
  ticker: string;
  timestamp: Date;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  exchange?: string;
  market: string;
  source: string;
  attribution: string;
}

// =============================================================================
// QUERY TYPES
// =============================================================================

export interface CurrentPricesOptions {
  vsCurrencies?: string[];
  includeMarketData?: boolean;
  includePriceChange?: boolean;
  sparkline?: boolean;
}

export interface DateRangeOHLCVQuery {
  ticker: string;
  dateStart: Date;
  dateEnd: Date;
  interval: string;
  market?: string;
}

export interface Level1Query {
  ticker: string;
  exchange?: string;
  market?: string;
}
