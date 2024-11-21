/**
 * @fileoverview
 * @module errors.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

import { ApplicationError } from "@qi/core/errors";
import { ErrorDetails } from "@qi/core/errors";

export interface RedisErrorDetails extends ErrorDetails {
  operation?: string;
  timeout?: number;
  attempt?: number;
  error?: string;
  [key: string]: unknown; // Add index signature to match ErrorDetails
}

export const REDIS_ERROR_CODES = {
  CONNECTION_ERROR: "CONNECTION_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  OPERATION_ERROR: "OPERATION_ERROR",
  CLIENT_ERROR: "CLIENT_ERROR",
  PING_ERROR: "PING_ERROR",
} as const;

export type RedisErrorCode =
  (typeof REDIS_ERROR_CODES)[keyof typeof REDIS_ERROR_CODES];

export class RedisError extends ApplicationError {
  constructor(
    message: string,
    code: RedisErrorCode,
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
