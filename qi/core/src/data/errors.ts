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
 * @modified 2024-12-11
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
