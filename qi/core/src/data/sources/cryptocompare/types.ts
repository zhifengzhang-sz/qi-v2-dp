/**
 * @fileoverview CryptoCompare API type definitions
 * @module @qi/core/data/sources/cryptocompare/types
 *
 * @description
 * Type definitions for CryptoCompare API configuration and parameters.
 * Includes API configuration types, parameter types, and constants.
 *
 * Based on CryptoCompare Data API v1/v2.
 * @see {@link https://developers.cryptocompare.com/documentation Documentation}
 *
 * @author Zhifeng Zhang
 * @created 2024-12-09
 * @modified 2024-12-11
 */

import { MarketDataError, MarketDataErrorDetails } from "@qi/core/data";
import { ErrorCode, StatusCode } from "@qi/core/errors";

/**
 * CryptoCompare provider configuration.
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
 * Parameters for OHLCV historical data requests.
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

/**
 * CryptoCompare-specific error handling
 */
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
}
