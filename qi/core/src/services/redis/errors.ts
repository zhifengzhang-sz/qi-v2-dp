/**
 * @fileoverview
 * @module errors
 *
 * @description
 * This module defines Redis-specific error handling.
 * It extends the base ApplicationError class to provide structured
 * error handling for the Redis service.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-22
 */

import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorCode } from "@qi/core/errors";

export interface RedisErrorDetails extends ErrorDetails {
  operation?: string;
  timeout?: number;
  attempt?: number;
  error?: string;
  [key: string]: unknown;
}

export const REDIS_ERROR_CODES = {
  CONNECTION_ERROR: ErrorCode.CONNECTION_ERROR,
  TIMEOUT_ERROR: ErrorCode.TIMEOUT_ERROR,
  OPERATION_ERROR: ErrorCode.OPERATION_ERROR,
  CLIENT_ERROR: ErrorCode.CLIENT_ERROR,
  PING_ERROR: ErrorCode.PING_ERROR,
} as const;

export type RedisErrorCode = ErrorCode;

export class RedisError extends ApplicationError {
  constructor(
    message: string,
    code: RedisErrorCode = ErrorCode.REDIS_ERROR,
    details?: RedisErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "RedisError";
  }

  static create(
    message: string,
    code: RedisErrorCode,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, code, details);
  }
}
