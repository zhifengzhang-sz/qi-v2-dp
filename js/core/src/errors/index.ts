/**
 * @module errors
 * @description Custom error classes for different types of application errors
 */

/**
 * @class ApplicationError
 * @extends Error
 * @description Base error class for all application errors
 * 
 * @example
 * throw new ApplicationError('Something went wrong', 'CUSTOM_ERROR', 500);
 */
export class ApplicationError extends Error {
  /**
   * @constructor
   * @param message Error message
   * @param code Error code for categorization
   * @param statusCode HTTP status code
   * @param details Additional error details
   */
  constructor(
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

/**
 * @class ValidationError
 * @extends ApplicationError
 * @description Error for validation failures
 * 
 * @example
 * throw new ValidationError('Invalid input', { field: 'email', constraint: 'format' });
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * @class DatabaseError
 * @extends ApplicationError
 * @description Error for database operation failures
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * @class NotFoundError
 * @extends ApplicationError
 * @description Error for resource not found
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'NOT_FOUND', 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * @class AuthenticationError
 * @extends ApplicationError
 * @description Error for authentication failures
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * @class AuthorizationError
 * @extends ApplicationError
 * @description Error for authorization failures
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * @class ExternalServiceError
 * @extends ApplicationError
 * @description Error for external service failures
 */
export class ExternalServiceError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, details);
    this.name = 'ExternalServiceError';
  }
}

/**
 * @class RateLimitError
 * @extends ApplicationError
 * @description Error for rate limit exceeded
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'RATE_LIMIT_ERROR', 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * @class ConfigurationError
 * @extends ApplicationError
 * @description Error for configuration issues
 */
export class ConfigurationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
}

/**
 * @class CacheError
 * @extends ApplicationError
 * @description Error for cache operation failures
 */
export class CacheError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', 500, details);
    this.name = 'CacheError';
  }
}