# Project Source Code Documentation

## data

### errors

#### index.ts

```typescript
/**
 * @fileoverview Market data error definitions
 * @module @qi/core/data/errors
 *
 * @description
 * Provides specialized error handling for market data operations:
 * - Defines error codes specific to market data operations
 * - Extends core application error system
 * - Provides typed error details
 * - Includes factory methods for common error scenarios
 *
 * Error code ranges:
 * - 7000-7099: General market data errors
 * - 7100-7199: Provider-specific errors
 * - 7200-7299: Data validation errors
 * - 7300-7399: Storage errors
 * - 7400-7499: Query errors
 *
 * @example Basic Usage
 * ```typescript
 * import { MarketDataError, MARKET_DATA_CODES } from '@qi/core/data/errors';
 *
 * throw new MarketDataError(
 *   "Invalid timeframe provided",
 *   MARKET_DATA_CODES.INVALID_INTERVAL,
 *   { interval: "invalid" }
 * );
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 */

import { ApplicationError, ErrorCode, ErrorDetails } from "@qi/core/errors";

/**
 * Market data error details interface.
 * Provides structured error context for market data operations.
 *
 * @interface MarketDataErrorDetails
 *
 * @property {string} [provider] - Data provider identifier
 * @property {string} [exchange] - Exchange identifier
 * @property {string} [symbol] - Trading pair symbol
 * @property {string} [interval] - Time interval
 * @property {unknown} [query] - Query parameters
 * @property {unknown} [response] - Provider response
 * @property {[key: string]: unknown} Additional context
 *
 * @example
 * ```typescript
 * const errorDetails: MarketDataErrorDetails = {
 *   provider: "cryptocompare",
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   interval: "1h",
 *   query: { limit: 100 }
 * };
 * ```
 */
export interface MarketDataErrorDetails extends ErrorDetails {
  provider?: string;
  exchange?: string;
  symbol?: string;
  interval?: string;
  query?: unknown;
  response?: unknown;
  [key: string]: unknown;
}

/**
 * Market data specific error class.
 * Extends the core ApplicationError with market data specific functionality.
 *
 * @class MarketDataError
 * @extends {ApplicationError}
 *
 * @example Basic Usage
 * ```typescript
 * throw new MarketDataError(
 *   "Failed to fetch OHLCV data",
 *   MARKET_DATA_CODES.API_ERROR,
 *   {
 *     provider: "cryptocompare",
 *     symbol: "BTC-USD",
 *     response: error
 *   }
 * );
 * ```
 */
export class MarketDataError extends ApplicationError {
  /**
   * Creates a new MarketDataError instance.
   *
   * @param {string} message - Error message
   * @param {ErrorCode} [code=ErrorCode.MARKET_DATA_ERROR] - Error code
   * @param {MarketDataErrorDetails} [details] - Additional error context
   *
   * @example
   * ```typescript
   * const error = new MarketDataError(
   *   "Invalid time interval",
   *   MARKET_DATA_CODES.INVALID_INTERVAL,
   *   { interval: "invalid" }
   * );
   * ```
   */
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.MARKET_DATA_ERROR,
    statusCode: number = 500,
    details?: MarketDataErrorDetails
  ) {
    super(message, code, statusCode, details);
  }

  /**
   * Creates a provider-specific error.
   *
   * @static
   * @param {string} provider - Provider identifier
   * @param {string} message - Error message
   * @param {MarketDataErrorDetails} [details] - Additional error context
   * @returns {MarketDataError} Provider-specific error instance
   *
   * @example
   * ```typescript
   * throw MarketDataError.createProviderError(
   *   "cryptocompare",
   *   "API request failed",
   *   { response: apiError }
   * );
   * ```
   */
  static createProviderError(
    message: string,
    details?: MarketDataErrorDetails
  ): MarketDataError {
    return new MarketDataError(message, ErrorCode.PROVIDER_ERROR, 500, details);
  }

  /**
   * Creates a validation error.
   *
   * @static
   * @param {string} message - Validation error message
   * @param {MarketDataErrorDetails} [details] - Additional error context
   * @returns {MarketDataError} Validation error instance
   *
   * @example
   * ```typescript
   * throw MarketDataError.createValidationError(
   *   "Invalid OHLCV data",
   *   { data: invalidData }
   * );
   * ```
   */
  static createValidationError(
    message: string,
    details?: MarketDataErrorDetails
  ): MarketDataError {
    return new MarketDataError(
      message,
      ErrorCode.VALIDATION_ERROR,
      500,
      details
    );
  }

  /**
   * Creates a storage error.
   *
   * @static
   * @param {string} message - Storage error message
   * @param {MarketDataErrorDetails} [details] - Additional error context
   * @returns {MarketDataError} Storage error instance
   *
   * @example
   * ```typescript
   * throw MarketDataError.createStorageError(
   *   "Failed to write OHLCV data",
   *   { error: dbError }
   * );
   * ```
   */
  static createStorageError(
    message: string,
    details?: MarketDataErrorDetails
  ): MarketDataError {
    return new MarketDataError(message, ErrorCode.STORAGE_ERROR, 500, details);
  }

  /**
   * Creates a query error.
   *
   * @static
   * @param {string} message - Query error message
   * @param {MarketDataErrorDetails} [details] - Additional error context
   * @returns {MarketDataError} Query error instance
   *
   * @example
   * ```typescript
   * throw MarketDataError.createQueryError(
   *   "Invalid date range",
   *   { start, end }
   * );
   * ```
   */
  static createQueryError(
    message: string,
    details?: MarketDataErrorDetails
  ): MarketDataError {
    return new MarketDataError(message, ErrorCode.QUERY_ERROR, 500, details);
  }
}

```

### models

#### base

##### enums.ts

```typescript
/**
 * Time intervals for market data queries.
 * Represents standardized time periods for OHLCV data.
 *
 * @typedef {string} TimeInterval
 *
 * Available intervals:
 * - Minutes: "1m", "5m", "15m", "30m"
 * - Hours: "1h", "4h"
 * - Days/Weeks/Months: "1d", "1w", "1M"
 *
 * @example
 * ```typescript
 * const interval: TimeInterval = "15m";
 * const dailyInterval: TimeInterval = "1d";
 * ```
 */
export type TimeInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m" // Minutes
  | "1h"
  | "4h" // Hours
  | "1d"
  | "1w"
  | "1M"; // Days/Weeks/Months

```

##### ohlcv.ts

```typescript
import { BaseMarketData } from "./types.js";

/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data.
 * Represents price and volume data for a specific time period.
 *
 * @interface OHLCV
 * @extends {BaseMarketData}
 *
 * @property {number} open - Opening price of the period
 * @property {number} high - Highest price during the period
 * @property {number} low - Lowest price during the period
 * @property {number} close - Closing price of the period
 * @property {number} volume - Trading volume in base currency
 * @property {number} [quoteVolume] - Optional trading volume in quote currency
 * @property {number} [trades] - Optional number of trades in the period
 *
 * @example
 * ```typescript
 * const ohlcv: OHLCV = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   timestamp: 1701936000000,
 *   open: 43250.5,
 *   high: 43500.0,
 *   low: 43100.0,
 *   close: 43300.5,
 *   volume: 123.45,
 *   quoteVolume: 5342917.25,
 *   trades: 1250
 * };
 * ```
 */
export interface OHLCV extends BaseMarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

```

##### tick.ts

```typescript
import { BaseMarketData } from "./types.js";

/**
 * Market tick data
 */
export interface Tick extends BaseMarketData {
  price: number;
  quantity: number;
  side: "buy" | "sell" | "unknown";
}

```

##### types.ts

```typescript
/**
 * @fileoverview Base market data type definitions
 * @module @qi/core/data/models/base/types
 *
 * @description
 * Core type definitions for market data including OHLCV, ticks, and order books.
 * These types are used throughout the data module and by external consumers.
 * Provides standardized interfaces for:
 * - Time intervals for market data queries
 * - Base market data structure
 * - OHLCV (candlestick) data
 * - Query parameters
 * - Provider configuration
 * - Market data provider interface
 *
 * @example Import Types
 * ```typescript
 * import {
 *   TimeInterval,
 *   OHLCV,
 *   MarketDataQuery,
 *   IMarketDataProvider
 * } from '@qi/core/data/models/base/types';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-08
 */

import { TimeInterval } from "./enums.js";
import { OHLCV } from "./ohlcv.js";

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

/**
 * Market data query parameters.
 * Used to request historical market data from providers.
 *
 * @interface MarketDataQuery
 *
 * @property {string} exchange - Exchange to query
 * @property {string} symbol - Symbol to query (e.g., "BTC-USD")
 * @property {TimeInterval} interval - Time interval for the data
 * @property {number} [start] - Optional start timestamp in milliseconds
 * @property {number} [end] - Optional end timestamp in milliseconds
 * @property {number} [limit] - Optional maximum number of results
 *
 * @example
 * ```typescript
 * const query: MarketDataQuery = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   interval: "15m",
 *   start: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
 *   end: Date.now(),
 *   limit: 100
 * };
 * ```
 */
export interface MarketDataQuery {
  exchange: string;
  symbol: string;
  interval: TimeInterval;
  start?: number;
  end?: number;
  limit?: number;
}

/**
 * Provider configuration options.
 * Defines the configuration required for a market data provider.
 *
 * @interface ProviderConfig
 *
 * @property {string} type - Provider identifier (e.g., "cryptocompare", "twelvedata")
 * @property {string} version - Provider API version
 * @property {string} [baseUrl] - Optional base URL override for API endpoints
 * @property {string} apiKey - API authentication key
 * @property {Object} rateLimit - Rate limiting configuration
 * @property {number} rateLimit.requestsPerSecond - Maximum requests per second
 * @property {number} [rateLimit.requestsPerHour] - Optional maximum requests per hour
 *
 * @example
 * ```typescript
 * const config: ProviderConfig = {
 *   type: "cryptocompare",
 *   version: "1.0",
 *   apiKey: "your-api-key",
 *   baseUrl: "https://custom.api.endpoint",
 *   rateLimit: {
 *     requestsPerSecond: 10,
 *     requestsPerHour: 10000
 *   }
 * };
 * ```
 */
export interface ProviderConfig {
  type: string;
  version: string;
  baseUrl?: string;
  apiKey: string;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerHour?: number;
  };
}

/**
 * Market data provider interface.
 * Defines the required methods that all market data providers must implement.
 *
 * @interface IMarketDataProvider
 *
 * @example
 * ```typescript
 * class CryptoCompareProvider implements IMarketDataProvider {
 *   async getOHLCV(query: MarketDataQuery): Promise<OHLCV[]> {
 *     // Implementation
 *   }
 *
 *   supportsExchange(exchange: string): boolean {
 *     // Implementation
 *   }
 *
 *   async getSupportedExchanges(): Promise<string[]> {
 *     // Implementation
 *   }
 *
 *   async getSupportedSymbols(exchange: string): Promise<string[]> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export interface IMarketDataProvider {
  /**
   * Get historical OHLCV data based on query parameters.
   *
   * @param {MarketDataQuery} query - Query parameters for historical data
   * @returns {Promise<OHLCV[]>} Array of OHLCV data points
   * @throws {MarketDataError} If the query fails or returns invalid data
   *
   * @example
   * ```typescript
   * const data = await provider.getOHLCV({
   *   exchange: "kraken",
   *   symbol: "BTC-USD",
   *   interval: "1h",
   *   limit: 24
   * });
   * ```
   */
  getOHLCV(query: MarketDataQuery): Promise<OHLCV[]>;

  /**
   * Check if provider supports a given exchange.
   *
   * @param {string} exchange - Exchange identifier to check
   * @returns {boolean} True if the exchange is supported
   *
   * @example
   * ```typescript
   * if (provider.supportsExchange("kraken")) {
   *   // Proceed with kraken-specific operations
   * }
   * ```
   */
  supportsExchange(exchange: string): boolean;

  /**
   * Get list of all supported exchanges.
   *
   * @returns {Promise<string[]>} Array of supported exchange identifiers
   *
   * @example
   * ```typescript
   * const exchanges = await provider.getSupportedExchanges();
   * console.log(`Supported exchanges: ${exchanges.join(", ")}`);
   * ```
   */
  getSupportedExchanges(): Promise<string[]>;

  /**
   * Get supported trading pairs for a specific exchange.
   *
   * @param {string} exchange - Exchange to get symbols for
   * @returns {Promise<string[]>} Array of supported trading pair symbols
   * @throws {MarketDataError} If the exchange is not supported
   *
   * @example
   * ```typescript
   * const symbols = await provider.getSupportedSymbols("kraken");
   * symbols.forEach(symbol => {
   *   console.log(`Supported pair: ${symbol}`);
   * });
   * ```
   */
  getSupportedSymbols(exchange: string): Promise<string[]>;
}

```

#### sources

##### cryptocompare

###### ohlcv.ts

```typescript
import { OHLCV } from "../../base/ohlcv.js";

/**
 * Individual OHLCV data entry.
 *
 * @interface CryptoCompareOHLCVData
 *
 * @property {string} UNIT - Time unit ("MINUTE", "HOUR", "DAY")
 * @property {number} TIMESTAMP - Unix timestamp in seconds
 * @property {string} TYPE - Message type identifier
 * @property {string} MARKET - Exchange identifier
 * @property {string} INSTRUMENT - Trading pair identifier
 * @property {string} MAPPED_INSTRUMENT - Standardized instrument identifier
 * @property {string} BASE - Base asset symbol
 * @property {string} QUOTE - Quote asset symbol
 * @property {number} OPEN - Opening price
 * @property {number} HIGH - Highest price
 * @property {number} LOW - Lowest price
 * @property {number} CLOSE - Closing price
 * @property {number} VOLUME - Trading volume in base asset
 * @property {number} TOTAL_TRADES - Number of trades
 * @property {number} QUOTE_VOLUME - Trading volume in quote asset
 *
 * @example
 * ```typescript
 * const ohlcv: CryptoCompareOHLCVData = {
 *   UNIT: "DAY",
 *   TIMESTAMP: 1701936000,
 *   TYPE: "952",
 *   MARKET: "Kraken",
 *   INSTRUMENT: "BTC-USD",
 *   MAPPED_INSTRUMENT: "BTC-USD",
 *   BASE: "BTC",
 *   QUOTE: "USD",
 *   OPEN: 43250.5,
 *   HIGH: 43500.0,
 *   LOW: 43100.0,
 *   CLOSE: 43300.5,
 *   VOLUME: 123.45,
 *   TOTAL_TRADES: 1250,
 *   QUOTE_VOLUME: 5342917.25
 * };
 * ```
 */
export interface CryptoCompareOHLCV extends OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

```

###### tick.ts

```typescript
import { Tick } from "../../base/tick.js";

/**
 * Market tick data
 */
export interface CryptoCompareTick extends Tick {
  price: number;
  quantity: number;
  side: "buy" | "sell" | "unknown";
}

```

###### types.ts

```typescript
/**
 * @fileoverview CryptoCompare API type definitions
 * @module @qi/core/data/models/sources/cryptocompare/types
 *
 * @description
 * Type definitions for CryptoCompare API requests and responses.
 * Includes:
 * - API configuration types
 * - Response interfaces matching API structure
 * - Error response types
 * - Parameter types for different endpoints
 *
 * Based on CryptoCompare Data API v1/v2:
 * - OHLCV historical data
 * - Trade data
 * - Market metadata
 *
 * @see {@link https://developers.cryptocompare.com/documentation Documentation}
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 */

import { MarketDataError, MarketDataErrorDetails } from "@qi/core/data/errors";
import { ErrorCode, StatusCode } from "@qi/core/errors";
import { CryptoCompareOHLCV } from "./ohlcv.js";

export class CryptocompareError extends MarketDataError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PROVIDER_ERROR,
    statusCode: StatusCode = StatusCode.BAD_GATEWAY,
    details?: MarketDataErrorDetails
  ) {
    super(message, code, statusCode, {
      provider: "cryptocompare",
      ...details,
    });
    this.name = "CryptocompareError";
  }

  /**
   * Creates an error for API request failures specific to Cryptocompare.
   *
   * @param message - Error message
   * @param details - Additional error details
   */
  static createApiError(
    message: string,
    details?: MarketDataErrorDetails
  ): CryptocompareError {
    return new CryptocompareError(
      message,
      ErrorCode.API_ERROR,
      StatusCode.BAD_GATEWAY,
      details
    );
  }

  // Add more static methods if needed for other specific error cases
}

/**
 * CryptoCompare provider configuration.
 *
 * @interface CryptoCompareConfig
 * @extends {ProviderConfig}
 *
 * @property {string} type - Must be 'cryptocompare'
 * @property {string} version - API version (e.g., '1.0')
 * @property {string} apiKey - API key for authentication
 * @property {string} [baseUrl] - Optional API endpoint override
 * @property {Object} rateLimit - Rate limiting settings
 *
 * @example
 * ```typescript
 * const config: CryptoCompareConfig = {
 *   type: 'cryptocompare',
 *   version: '1.0',
 *   apiKey: 'your-api-key',
 *   rateLimit: {
 *     requestsPerSecond: 50,
 *     requestsPerHour: 150000
 *   }
 * };
 * ```
 */
export interface CryptoCompareConfig {
  type: "cryptocompare";
  version: string;
  apiKey: string;
  baseUrl?: string;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerHour: number;
  };
}

/**
 * Common error response structure.
 *
 * @interface CryptoCompareError
 *
 * @property {number} type - Error type code
 * @property {string} message - Error message
 * @property {Object} [other_info] - Additional error context
 *
 * @example
 * ```typescript
 * const error: CryptoCompareError = {
 *   type: 1,
 *   message: "Parameter missing",
 *   other_info: {
 *     param: "market",
 *     values: ["invalid_market"]
 *   }
 * };
 * ```
 */
export interface CryptoCompareError {
  type: number;
  message: string;
  other_info?: {
    param?: string;
    values?: string[];
  };
}

/**
 * OHLCV historical data response.
 * Response format for daily/hourly/minute historical data endpoints.
 *
 * @interface CryptoCompareOHLCVResponse
 *
 * @property {Object} Data - Response data container
 * @property {Array<CryptoCompareOHLCVData>} Data.Data - Array of OHLCV entries
 * @property {CryptoCompareError} [Err] - Error information if request failed
 *
 * @example
 * ```typescript
 * const response: CryptoCompareOHLCVResponse = {
 *   Data: {
 *     Data: [{
 *       TIMESTAMP: 1701936000,
 *       MARKET: "Kraken",
 *       INSTRUMENT: "BTC-USD",
 *       OPEN: 43250.5,
 *       HIGH: 43500.0,
 *       LOW: 43100.0,
 *       CLOSE: 43300.5,
 *       VOLUME: 123.45,
 *       TOTAL_TRADES: 1250,
 *       QUOTE_VOLUME: 5342917.25
 *     }]
 *   }
 * };
 * ```
 */
export interface CryptoCompareOHLCVResponse {
  Response: string;
  Message?: string;
  Data: {
    Data: CryptoCompareOHLCV[];
  };
  Err?: CryptoCompareError;
}

/**
 * Parameters for OHLCV historical data requests.
 *
 * @interface CryptoCompareOHLCVParams
 *
 * @property {string} market - Exchange name
 * @property {string} instrument - Trading pair
 * @property {number} [limit] - Maximum number of data points
 * @property {number} [aggregate] - Time period aggregation
 * @property {boolean} [fill] - Fill empty periods with previous values
 * @property {boolean} [apply_mapping] - Apply instrument mapping
 * @property {'JSON'} response_format - Response format (only JSON supported)
 *
 * @example
 * ```typescript
 * const params: CryptoCompareOHLCVParams = {
 *   market: "kraken",
 *   instrument: "BTC-USD",
 *   limit: 100,
 *   aggregate: 1,
 *   fill: true,
 *   apply_mapping: true,
 *   response_format: "JSON"
 * };
 * ```
 */
export interface CryptoCompareOHLCVParams {
  market: string;
  instrument: string;
  limit?: number;
  aggregate?: number;
  fill?: boolean;
  apply_mapping?: boolean;
  response_format: "JSON";
}

/**
 * Time intervals mapping for CryptoCompare API.
 * Maps internal interval types to API endpoint paths.
 *
 * @type {Record<string, string>}
 *
 * @example
 * ```typescript
 * const endpoint = `${baseUrl}/spot/v1/historical/${
 *   INTERVAL_ENDPOINTS[interval]
 * }`;
 * ```
 */
export const INTERVAL_ENDPOINTS: Record<string, string> = {
  "1m": "minutes",
  "5m": "minutes",
  "15m": "minutes",
  "30m": "minutes",
  "1h": "hours",
  "4h": "hours",
  "1d": "days",
  "1w": "days",
  "1M": "days",
} as const;

/**
 * Maps internal intervals to API aggregation values.
 *
 * @type {Record<string, number>}
 *
 * @example
 * ```typescript
 * const params = {
 *   ...baseParams,
 *   aggregate: INTERVAL_AGGREGATION[interval] || 1
 * };
 * ```
 */
export const INTERVAL_AGGREGATION: Record<string, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 1,
  "4h": 4,
  "1d": 1,
  "1w": 7,
  "1M": 30,
} as const;

```

### sources

#### cryptocompare

##### errors.ts

```typescript
/**
 * @fileoverview CryptoCompare specific error handling
 * @module @qi/core/data/sources/cryptocompare/errors
 */

import { MarketDataError, MarketDataErrorDetails } from "@qi/core/data/errors";
import { ErrorCode } from "@qi/core/errors";

/**
 * CryptoCompare specific error details
 */
export interface CryptoCompareErrorDetails extends MarketDataErrorDetails {
  errorType?: number; // CryptoCompare error type
  endpoint?: string; // API endpoint
  parameters?: Record<string, unknown>; // API parameters
  errorInfo?: {
    // CryptoCompare error info
    param?: string; // Error parameter
    values?: string[]; // Error values
    [key: string]: unknown;
  };
}

/**
 * CryptoCompare error response type
 */
export interface CryptoCompareErrorResponse {
  Response?: string;
  Message?: string;
  HasWarning?: boolean;
  Type?: number;
  RateLimit?: {
    remainingRequests: number;
    resetTimeSeconds: number;
  };
  Data?: Record<string, unknown>;
  ParamWithError?: string;
  Err?: {
    type: number;
    message: string;
    other_info?: {
      param?: string;
      values?: string[];
    };
  };
}

/**
 * Maps CryptoCompare error types to application error codes
 */
export const ERROR_TYPE_MAP: Record<number, ErrorCode> = {
  1: ErrorCode.VALIDATION_ERROR, // Invalid parameters
  2: ErrorCode.RATE_LIMIT_ERROR, // Rate limit exceeded
  3: ErrorCode.AUTH_ERROR, // Invalid/missing API key
  4: ErrorCode.NOT_FOUND_ERROR, // Resource not found
  5: ErrorCode.PROVIDER_ERROR, // CryptoCompare internal error
};

/**
 * CryptoCompare specific error handler
 */
export class CryptoCompareError extends MarketDataError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.PROVIDER_ERROR,
    statusCode: number = 500,
    details?: CryptoCompareErrorDetails
  ) {
    super(message, code, statusCode, {
      ...details,
      provider: "cryptocompare",
    });
  }

  /**
   * Creates error from CryptoCompare API response
   */
  static fromApiResponse(
    response: CryptoCompareErrorResponse,
    endpoint: string,
    parameters: Record<string, unknown>
  ): CryptoCompareError {
    const errorType = response.Err?.type || response.Type || 5;
    const message =
      response.Err?.message ||
      response.Message ||
      "Unknown CryptoCompare error";

    const details: CryptoCompareErrorDetails = {
      errorType,
      endpoint,
      parameters,
      response,
      errorInfo: response.Err?.other_info,
    };

    return new CryptoCompareError(
      message,
      ERROR_TYPE_MAP[errorType] || ErrorCode.PROVIDER_ERROR,
      500,
      details
    );
  }

  /**
   * Creates network error
   */
  static createNetworkError(
    error: Error,
    endpoint: string,
    parameters: Record<string, unknown>
  ): CryptoCompareError {
    return new CryptoCompareError(
      "Network error occurred",
      ErrorCode.NETWORK_ERROR,
      500,
      {
        endpoint,
        parameters,
        error: error.message,
        stack: error.stack,
      }
    );
  }

  /**
   * Creates rate limit error
   */
  static createRateLimitError(
    endpoint: string,
    parameters: Record<string, unknown>
  ): CryptoCompareError {
    return new CryptoCompareError(
      "Rate limit exceeded",
      ErrorCode.RATE_LIMIT_ERROR,
      429,
      {
        endpoint,
        parameters,
      }
    );
  }

  /**
   * Creates validation error
   */
  static createValidationError(
    message: string,
    parameters: Record<string, unknown>
  ): CryptoCompareError {
    return new CryptoCompareError(message, ErrorCode.VALIDATION_ERROR, 400, {
      parameters,
    });
  }
}

/**
 * Validates OHLCV response data
 */
export function validateOHLCVResponse(
  data: unknown
): asserts data is { Data: { Data: unknown[] } } {
  if (!data || typeof data !== "object") {
    throw CryptoCompareError.createValidationError(
      "Invalid OHLCV response format",
      { response: data }
    );
  }

  const response = data as { Data?: { Data?: unknown[] } };

  if (!response.Data?.Data || !Array.isArray(response.Data.Data)) {
    throw CryptoCompareError.createValidationError(
      "Missing or invalid OHLCV data array",
      { response }
    );
  }
}

/**
 * Validates tick response data
 */
export function validateTickResponse(
  data: unknown
): asserts data is Record<string, unknown> {
  if (!data || typeof data !== "object") {
    throw CryptoCompareError.createValidationError(
      "Invalid tick response format",
      { response: data }
    );
  }

  const response = data as Record<string, unknown>;

  // Required fields for tick data
  const requiredFields = [
    "TYPE",
    "MARKET",
    "INSTRUMENT",
    "PRICE",
    "LAST_TRADE_QUANTITY",
    "LAST_TRADE_ID",
  ];

  for (const field of requiredFields) {
    if (!(field in response)) {
      throw CryptoCompareError.createValidationError(
        `Missing required field: ${field}`,
        { response }
      );
    }
  }
}

```

### validation

#### guards.ts

```typescript
/**
 * @fileoverview Type guards and validation functions
 */

import { TimeInterval } from "../models/base/enums.js";
import { OHLCV } from "../models/base/ohlcv.js";

export function isValidTimeInterval(
  interval: string
): interval is TimeInterval {
  return ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"].includes(
    interval
  );
}

export function isValidOHLCV(data: unknown): data is OHLCV {
  if (typeof data !== "object" || data === null) return false;

  const ohlcv = data as OHLCV;
  return (
    typeof ohlcv.timestamp === "number" &&
    typeof ohlcv.exchange === "string" &&
    typeof ohlcv.symbol === "string" &&
    typeof ohlcv.open === "number" &&
    typeof ohlcv.high === "number" &&
    typeof ohlcv.low === "number" &&
    typeof ohlcv.close === "number" &&
    typeof ohlcv.volume === "number" &&
    ohlcv.high >= ohlcv.low &&
    ohlcv.open >= ohlcv.low &&
    ohlcv.open <= ohlcv.high &&
    ohlcv.close >= ohlcv.low &&
    ohlcv.close <= ohlcv.high
  );
}

```

