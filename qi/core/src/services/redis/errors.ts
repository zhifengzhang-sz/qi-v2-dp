/**
 * @fileoverview Redis error handling and customization
 * @module @qi/core/services/redis/errors
 *
 * @description
 * This module defines Redis-specific error handling by extending the core application error system.
 * It provides strongly-typed error details and specialized error creation methods for Redis operations.
 * The error system integrates with the core error codes while adding Redis-specific context and handling.
 *
 * Key features:
 * - Extends core ApplicationError for Redis-specific cases
 * - Strongly typed error details for Redis operations
 * - Factory methods for common Redis error scenarios
 * - Integration with core error codes
 * - Contextual error information for debugging
 *
 * @example
 * ```typescript
 * // Creating a connection error
 * throw RedisError.connectionError("Failed to connect to Redis", {
 *   operation: "connect",
 *   attempt: 3,
 *   error: "ECONNREFUSED"
 * });
 *
 * // Handling validation errors
 * throw RedisError.validationError("redis-config", [
 *   { field: "port", message: "Invalid port number", value: -1 }
 * ]);
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-28
 */

import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorCode } from "@qi/core/errors";

/**
 * Schema validation error structure
 * Provides detailed information about validation failures
 *
 * @interface SchemaValidationError
 * @property {string} [field] - The field that failed validation
 * @property {string} message - The validation error message
 * @property {unknown} [value] - The value that failed validation
 * @property {string} [path] - JSON path to the failed field
 */
export interface SchemaValidationError {
  field?: string;
  message: string;
  value?: unknown;
  path?: string;
}

/**
 * Extended error details for Redis operations
 * Adds Redis-specific context to base error details
 *
 * @interface RedisErrorDetails
 * @extends {ErrorDetails}
 * @property {string} [operation] - Redis operation being performed
 * @property {number} [timeout] - Operation timeout duration in milliseconds
 * @property {number} [attempt] - Current retry attempt number
 * @property {string} [error] - Underlying error message
 * @property {string} [schemaId] - Schema identifier for validation errors
 * @property {string} [connectionId] - Redis connection identifier
 * @property {string} [command] - Redis command that failed
 * @property {SchemaValidationError[]} [validationErrors] - Array of validation errors
 */
export interface RedisErrorDetails extends ErrorDetails {
  operation?: string;
  timeout?: number;
  attempt?: number;
  error?: string;
  schemaId?: string;
  connectionId?: string;
  command?: string;
  validationErrors?: SchemaValidationError[];
}

/**
 * Redis-specific error class with enhanced details and context
 *
 * @class RedisError
 * @extends {ApplicationError}
 */
export class RedisError extends ApplicationError {
  /**
   * Creates a new Redis error instance
   *
   * @constructor
   * @param {string} message - Error message
   * @param {ErrorCode} [code=ErrorCode.REDIS_ERROR] - Error code
   * @param {RedisErrorDetails} [details] - Additional error context
   */
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.REDIS_ERROR,
    details?: RedisErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "RedisError";
  }

  /**
   * Creates a connection error
   * Used for Redis connection failures
   *
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorDetails} [details] - Additional error context
   * @returns {RedisError} New Redis error instance
   */
  static connectionError(
    message: string,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, ErrorCode.CONNECTION_ERROR, details);
  }

  /**
   * Creates a configuration error
   * Used for Redis configuration validation and setup failures
   *
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorDetails} [details] - Additional error context
   * @returns {RedisError} New Redis error instance
   */
  static configurationError(
    message: string,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, ErrorCode.CONFIGURATION_ERROR, details);
  }

  /**
   * Creates a timeout error
   * Used when Redis operations exceed their timeout
   *
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorDetails} [details] - Additional error context
   * @returns {RedisError} New Redis error instance
   */
  static timeoutError(
    message: string,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, ErrorCode.TIMEOUT_ERROR, details);
  }

  /**
   * Creates an operation error
   * Used for Redis command execution failures
   *
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorDetails} [details] - Additional error context
   * @returns {RedisError} New Redis error instance
   */
  static operationError(
    message: string,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, ErrorCode.OPERATION_ERROR, details);
  }

  /**
   * Creates a client error
   * Used for Redis client state and usage errors
   *
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorDetails} [details] - Additional error context
   * @returns {RedisError} New Redis error instance
   */
  static clientError(message: string, details?: RedisErrorDetails): RedisError {
    return new RedisError(message, ErrorCode.CLIENT_ERROR, details);
  }

  /**
   * Creates a validation error
   * Used for Redis configuration schema validation failures
   *
   * @static
   * @param {string} schemaId - ID of the schema that failed validation
   * @param {Array<SchemaValidationError>} errors - Validation errors
   * @returns {RedisError} New Redis error instance
   */
  static validationError(
    schemaId: string,
    errors: Array<SchemaValidationError>
  ): RedisError {
    return new RedisError(
      `Schema validation failed for "${schemaId}": ${errors[0]?.message || "Unknown validation error"}`,
      ErrorCode.SCHEMA_VALIDATION_FAILED,
      {
        schemaId,
        validationErrors: errors,
      }
    );
  }
}
