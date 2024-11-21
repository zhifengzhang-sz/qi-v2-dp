/**
 * @fileoverview Core error handling system providing strongly-typed error classes
 * for different categories of application failures. Includes detailed error tracking,
 * type-safe error details, and standardized error codes.
 * @module @qi/core/errors
 *
 * Key features:
 * - Hierarchical error class structure with common base error
 * - Type-safe error details for each error category
 * - HTTP status code integration for API responses
 * - Standardized error codes for error handling
 * - Detailed contextual information for debugging
 *
 * Error Categories & Use Cases:
 * - ValidationError: Input validation, data format checks
 * - DatabaseError: Query failures, connection issues
 * - AuthenticationError: Invalid credentials, token expiration
 * - AuthorizationError: Permission checks, access control
 * - ExternalServiceError: API failures, third-party service issues
 * - RateLimitError: Request throttling, quota management
 * - ConfigurationError: Invalid settings, missing configs
 * - CacheError: Cache operations, invalidation issues
 *
 * Usage:
 * Each error class includes:
 * - Descriptive message
 * - Error code for programmatic handling
 * - HTTP status code for API responses
 * - Typed details object for additional context
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-21
 */

/**
 * Base interface for error details providing common structure for all error types.
 * Allows for extension while maintaining type safety with unknown values.
 * @interface ErrorDetails
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Details specific to database operation errors
 * @interface DatabaseErrorDetails
 * @extends ErrorDetails
 */
export interface DatabaseErrorDetails extends ErrorDetails {
  /** The database operation that failed (e.g., 'insert', 'update', 'delete') */
  operation?: string;
  /** The affected database table or collection */
  table?: string;
  /** Database-specific error code */
  errorCode?: string;
}

/**
 * Details specific to external service errors
 * @interface ExternalServiceErrorDetails
 * @extends ErrorDetails
 */
export interface ExternalServiceErrorDetails extends ErrorDetails {
  /** Name or identifier of the external service */
  service?: string;
  /** The specific endpoint that was called */
  endpoint?: string;
  /** HTTP status code returned by the external service */
  statusCode?: number;
  /** Response body from the failed request */
  responseBody?: unknown;
}

/**
 * Details specific to authentication and authorization errors
 * @interface AuthErrorDetails
 * @extends ErrorDetails
 */
export interface AuthErrorDetails extends ErrorDetails {
  /** ID of the user who failed authentication/authorization */
  userId?: string;
  /** The resource being accessed */
  resource?: string;
  /** List of permissions required for access */
  requiredPermissions?: string[];
}

/**
 * Details specific to rate limiting errors
 * @interface RateLimitErrorDetails
 * @extends ErrorDetails
 */
export interface RateLimitErrorDetails extends ErrorDetails {
  /** Maximum number of allowed requests */
  limit?: number;
  /** Current number of requests */
  current?: number;
  /** When the rate limit will reset */
  resetTime?: Date;
}

/**
 * Details specific to cache operation errors
 * @interface CacheErrorDetails
 * @extends ErrorDetails
 */
export interface CacheErrorDetails extends ErrorDetails {
  /** The cache key involved in the operation */
  key?: string;
  /** The cache operation that failed */
  operation?: "get" | "set" | "delete" | "clear";
}

/**
 * Base error class for all application errors. Extends the native Error class
 * with additional properties for better error handling and debugging.
 *
 * @class ApplicationError
 * @extends Error
 *
 * @example
 * ```typescript
 * throw new ApplicationError(
 *   'Failed to process request',
 *   'PROCESSING_ERROR',
 *   500,
 *   { requestId: '123', stage: 'validation' }
 * );
 * ```
 */
export class ApplicationError extends Error {
  /**
   * Creates a new ApplicationError instance
   * @param message - Human-readable error message
   * @param code - Error code for programmatic error handling
   * @param statusCode - HTTP status code for API responses
   * @param details - Additional error context and details
   */
  constructor(
    message: string,
    public code: string = "INTERNAL_ERROR",
    public statusCode: number = 500,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

/**
 * Error class for database operation failures
 * @class DatabaseError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new DatabaseError(
 *   'Failed to insert record',
 *   { operation: 'insert', table: 'users', errorCode: 'UNIQUE_VIOLATION' }
 * );
 * ```
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: DatabaseErrorDetails) {
    super(message, "DATABASE_ERROR", 500, details);
    this.name = "DatabaseError";
  }
}

/**
 * Error class for resource not found situations
 * @class NotFoundError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new NotFoundError(
 *   'User not found',
 *   { userId: '123', resource: 'user' }
 * );
 * ```
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
  }
}

/**
 * Error class for authentication failures
 * @class AuthenticationError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new AuthenticationError(
 *   'Invalid credentials',
 *   { userId: '123', resource: 'login' }
 * );
 * ```
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string, details?: AuthErrorDetails) {
    super(message, "AUTHENTICATION_ERROR", 401, details);
    this.name = "AuthenticationError";
  }
}

/**
 * Error class for authorization failures
 * @class AuthorizationError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new AuthorizationError(
 *   'Insufficient permissions',
 *   { userId: '123', resource: 'admin-panel', requiredPermissions: ['ADMIN'] }
 * );
 * ```
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string, details?: AuthErrorDetails) {
    super(message, "AUTHORIZATION_ERROR", 403, details);
    this.name = "AuthorizationError";
  }
}

/**
 * Error class for external service failures
 * @class ExternalServiceError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new ExternalServiceError(
 *   'Payment service unavailable',
 *   { service: 'stripe', endpoint: '/v1/charges', statusCode: 503 }
 * );
 * ```
 */
export class ExternalServiceError extends ApplicationError {
  constructor(message: string, details?: ExternalServiceErrorDetails) {
    super(message, "EXTERNAL_SERVICE_ERROR", 502, details);
    this.name = "ExternalServiceError";
  }
}

/**
 * Error class for rate limit exceeded situations
 * @class RateLimitError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new RateLimitError(
 *   'Too many requests',
 *   { limit: 100, current: 101, resetTime: new Date() }
 * );
 * ```
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string, details?: RateLimitErrorDetails) {
    super(message, "RATE_LIMIT_ERROR", 429, details);
    this.name = "RateLimitError";
  }
}

/**
 * Error class for cache operation failures
 * @class CacheError
 * @extends ApplicationError
 *
 * @example
 * ```typescript
 * throw new CacheError(
 *   'Failed to set cache value',
 *   { key: 'user:123', operation: 'set' }
 * );
 * ```
 */
export class CacheError extends ApplicationError {
  constructor(message: string, details?: CacheErrorDetails) {
    super(message, "CACHE_ERROR", 500, details);
    this.name = "CacheError";
  }
}
