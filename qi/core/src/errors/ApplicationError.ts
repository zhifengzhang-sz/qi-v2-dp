/**
 * @fileoverview
 * @module ApplicationError
 *
 * @description
 * This module defines the base `ApplicationError` class, which serves as the foundational
 * error type for all application-specific errors. It encapsulates common error properties
 * and provides a standardized method for handling errors, including logging and response
 * preparation.
 *
 * @created 2024-11-21
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { ErrorCode } from "./ErrorCodes.js";
import { logger } from "@qi/core/logger";

/**
 * Interface for error details providing additional context.
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base error class for all application-specific errors.
 *
 * @class
 * @extends Error
 *
 * @property {ErrorCode} code - The specific error code representing the error type.
 * @property {number} statusCode - HTTP status code associated with the error.
 * @property {ErrorDetails} [details] - Additional details providing context about the error.
 *
 * @example
 * ```typescript
 * throw new ApplicationError("An unexpected error occurred.", ErrorCode.UNEXPECTED_ERROR, 500, { debugInfo: "Stack trace..." });
 * ```
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.APPLICATION_ERROR,
    public statusCode: number = 500,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = "ApplicationError";
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Handles the error by logging it and preparing a standardized response.
   *
   * @returns {object} Standardized error response containing status and error details.
   *
   * @example
   * ```typescript
   * try {
   *   // Some operation that may throw an error
   * } catch (error) {
   *   if (error instanceof ApplicationError) {
   *     const response = error.handle();
   *     // Send response to client
   *     res.status(response.status).json(response.error);
   *   }
   * }
   * ```
   */
  handle() {
    // Log the error details
    logger.error(`${this.name} [${this.code}]: ${this.message}`, {
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    });

    // Prepare standardized response (example for an HTTP API)
    return {
      status: this.statusCode,
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === "development" && {
          details: this.details,
        }),
      },
    };
  }
}
