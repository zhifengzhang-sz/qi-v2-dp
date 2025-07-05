// lib/src/coingecko/types.ts
// TypeScript type definitions for CoinGecko domain operations

// Re-export all types from client and DSL for convenience
export {
  // Client Configuration Types
  type CoinGeckoClientConfig,
  
  // API Response Types
  type CoinGeckoPriceResponse,
  type CoinGeckoOHLCVEntry,
  type CoinGeckoMarketData,
  type CoinGeckoGlobalData,
  type CoinGeckoTrendingResponse,
  type CoinGeckoSearchResponse,
  
  // Query Options Types
  type PriceQueryOptions,
  type OHLCVQueryOptions,
  type MarketQueryOptions,
  type HistoricalQueryOptions,
  type SearchQueryOptions,
} from './coingecko-client';

export {
  // Domain Data Types
  type CryptoPriceData,
  type CryptoOHLCVData,
  type CryptoMarketAnalytics,
  type TopPerformer,
  type CryptoMarketSummary,
  
  // Domain Query Types
  type DomainPriceQuery,
  type DomainOHLCVQuery,
  type DomainMarketQuery,
} from './coingecko-dsl';

// =============================================================================
// ADDITIONAL UTILITY TYPES
// =============================================================================

/**
 * Common cryptocurrency symbols for type safety
 */
export type CryptoSymbol = 
  | 'BTC' | 'ETH' | 'BNB' | 'XRP' | 'ADA' | 'SOL' | 'DOGE' | 'DOT' | 'MATIC' | 'AVAX'
  | 'LINK' | 'UNI' | 'LTC' | 'BCH' | 'ATOM' | 'ALGO' | 'VET' | 'ICP' | 'FIL' | 'TRX'
  | string; // Allow other symbols

/**
 * Supported vs currencies for pricing
 */
export type VsCurrency = 
  | 'usd' | 'eur' | 'jpy' | 'btc' | 'eth' | 'ltc' | 'bch' | 'bnb' | 'eos' | 'xrp'
  | 'xlm' | 'link' | 'dot' | 'yfi' | 'bits' | 'sats';

/**
 * Time intervals for OHLCV data
 */
export type TimeInterval = 'hourly' | 'daily';

/**
 * Standardized timeframes for technical analysis
 */
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '12h' | '1d' | '1w' | '1M';

/**
 * Market sentiment indicators
 */
export type MarketSentiment = 'bullish' | 'bearish' | 'neutral';

/**
 * Sort orders for market data
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Market data sorting criteria
 */
export type MarketSortBy = 'market_cap' | 'volume' | 'price_change' | 'name' | 'price';

/**
 * Price change periods
 */
export type PriceChangePeriod = '1h' | '24h' | '7d' | '14d' | '30d' | '200d' | '1y';

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * CoinGecko API error types
 */
export interface CoinGeckoError {
  status: {
    error_code: number;
    error_message: string;
  };
}

/**
 * Client error types
 */
export type CoinGeckoClientError = 
  | 'CONNECTION_FAILED'
  | 'RATE_LIMITED'
  | 'INVALID_PARAMETERS'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED';

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/**
 * Environment types for CoinGecko API
 */
export type CoinGeckoEnvironment = 'free' | 'demo' | 'pro';

/**
 * Connection transport types
 */
export type MCPTransport = 'stdio' | 'sse' | 'websocket';

// =============================================================================
// UTILITY INTERFACES
// =============================================================================

/**
 * Health check response
 */
export interface HealthStatus {
  isConnected: boolean;
  serverRunning: boolean;
  lastResponseTime?: number;
  rateLimitRemaining?: number;
  apiCreditsRemaining?: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  averageResponseTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  uptime: number;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

// =============================================================================
// DATA VALIDATION TYPES
// =============================================================================

/**
 * Validation result for API responses
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

/**
 * Data quality indicators
 */
export interface DataQuality {
  freshness: number; // Age in milliseconds
  completeness: number; // Percentage of fields populated
  accuracy: 'high' | 'medium' | 'low';
  source: string;
  timestamp: Date;
}

// =============================================================================
// WEBHOOK/STREAMING TYPES (for future use)
// =============================================================================

/**
 * Real-time price update
 */
export interface PriceUpdate {
  coinId: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: Date;
  source: 'coingecko';
}

/**
 * Market event types
 */
export type MarketEventType = 
  | 'price_alert'
  | 'volume_spike'
  | 'new_listing'
  | 'delisting'
  | 'market_cap_milestone'
  | 'trending_change';

/**
 * Market event structure
 */
export interface MarketEvent {
  type: MarketEventType;
  coinId: string;
  symbol: string;
  data: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}