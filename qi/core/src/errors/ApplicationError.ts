/**
 * @fileoverview
 * @module ApplicationError.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

// src/errors/ApplicationError.ts

import { ErrorCode } from "./ErrorCodes.js";
import { logger } from "@qi/core/logger";

/**
 * Interface for error details providing additional context.
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base error class for all application errors.
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
   * Handles the error by logging and preparing a standardized response.
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
