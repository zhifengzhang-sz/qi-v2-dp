/**
 * @fileoverview CryptoCompare specific error handling
 * @module @qi/core/data/sources/cryptocompare/errors
 * @description This module provides specialized error handling for CryptoCompare API interactions, including custom error classes and validation functions.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-09
 * @modified 2024-12-11
 */

import { MarketDataError, MarketDataErrorDetails } from "../../errors.js";
import { ErrorCode } from "@qi/core/errors";

/**
 * @interface
 * @description Defines the structure for detailed information about CryptoCompare-specific errors.
 * Extends {@link MarketDataErrorDetails}.
 */
export interface CryptoCompareErrorDetails extends MarketDataErrorDetails {
  /**
   * @type {number}
   * @description CryptoCompare error type code.
   */
  errorType?: number; // CryptoCompare error type

  /**
   * @type {string}
   * @description The API endpoint that was called when the error occurred.
   */
  endpoint?: string; // API endpoint

  /**
   * @type {Record<string, unknown>}
   * @description Parameters sent with the API request.
   */
  parameters?: Record<string, unknown>; // API parameters

  /**
   * @type {object}
   * @description Additional error information provided by CryptoCompare.
   */
  errorInfo?: {
    /**
     * @type {string}
     * @description The parameter that caused the error.
     */
    param?: string; // Error parameter

    /**
     * @type {string[]}
     * @description Values related to the error parameter.
     */
    values?: string[]; // Error values

    /**
     * @type {Record<string, unknown>}
     * @description Additional key-value pairs for error information.
     */
    [key: string]: unknown;
  };
}

/**
 * @interface
 * @description Represents the structure of an error response from the CryptoCompare API.
 */
export interface CryptoCompareErrorResponse {
  /**
   * @type {string}
   * @description Status of the response.
   */
  Response?: string;

  /**
   * @type {string}
   * @description Error message returned by the API.
   */
  Message?: string;

  /**
   * @type {boolean}
   * @description Indicates whether the response includes a warning.
   */
  HasWarning?: boolean;

  /**
   * @type {number}
   * @description Error type code.
   */
  Type?: number;

  /**
   * @type {object}
   * @description Information about the rate limit.
   */
  RateLimit?: {
    /**
     * @type {number}
     * @description Number of remaining requests before rate limit is enforced.
     */
    remainingRequests: number;

    /**
     * @type {number}
     * @description Time in seconds until the rate limit resets.
     */
    resetTimeSeconds: number;
  };

  /**
   * @type {Record<string, unknown>}
   * @description Additional data returned with the error.
   */
  Data?: Record<string, unknown>;

  /**
   * @type {string}
   * @description The specific parameter that caused the error.
   */
  ParamWithError?: string;

  /**
   * @type {object}
   * @description Detailed error information.
   */
  Err?: {
    /**
     * @type {number}
     * @description Error type code.
     */
    type: number;

    /**
     * @type {string}
     * @description Detailed error message.
     */
    message: string;

    /**
     * @type {object}
     * @description Additional error information.
     */
    other_info?: {
      /**
       * @type {string}
       * @description The parameter that caused the error.
       */
      param?: string;

      /**
       * @type {string[]}
       * @description Values related to the error parameter.
       */
      values?: string[];
    };
  };
}

/**
 * @constant
 * @description Maps CryptoCompare error type codes to application-specific error codes.
 * @type {Record<number, ErrorCode>}
 */
export const ERROR_TYPE_MAP: Record<number, ErrorCode> = {
  1: ErrorCode.VALIDATION_ERROR, // Invalid parameters
  2: ErrorCode.RATE_LIMIT_ERROR, // Rate limit exceeded
  3: ErrorCode.AUTH_ERROR, // Invalid/missing API key
  4: ErrorCode.NOT_FOUND_ERROR, // Resource not found
  5: ErrorCode.PROVIDER_ERROR, // CryptoCompare internal error
};

/**
 * @class
 * @description Handles CryptoCompare-specific errors by extending the base {@link MarketDataError} class.
 * @extends MarketDataError
 */
export class CryptoCompareError extends MarketDataError {
  /**
   * @constructor
   * @description Initializes a new instance of CryptoCompareError.
   * @param {string} message - Error message.
   * @param {ErrorCode} [code=ErrorCode.PROVIDER_ERROR] - Application-specific error code.
   * @param {number} [statusCode=500] - HTTP status code.
   * @param {CryptoCompareErrorDetails} [details] - Additional error details.
   */
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
   * @method
   * @description Creates a CryptoCompareError instance from an API response.
   * @static
   * @param {CryptoCompareErrorResponse} response - The error response from CryptoCompare API.
   * @param {string} endpoint - The API endpoint that was called.
   * @param {Record<string, unknown>} parameters - Parameters sent with the API request.
   * @returns {CryptoCompareError} - The constructed CryptoCompareError instance.
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
 * @function
 * @description Validates the structure of an OHLCV response from the CryptoCompare API.
 * Ensures that the response contains the necessary data array in the expected format.
 * @param {unknown} data - The data to validate.
 * @throws {CryptoCompareError} - Throws validation error if data is invalid.
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
 * @function
 * @description Validates the structure of a tick response from the CryptoCompare API.
 * Ensures that the response contains all required fields for tick data.
 * @param {unknown} data - The data to validate.
 * @throws {CryptoCompareError} - Throws validation error if data is invalid.
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
