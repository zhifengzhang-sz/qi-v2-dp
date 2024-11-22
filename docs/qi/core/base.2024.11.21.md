## Base modules in `qi/core`
  
### `qi/core/src/logger`
  
```ts
/**
 * @fileoverview Configurable logging system based on Winston providing structured
 * logging with customizable formatting, multiple transports, and environment-aware configuration.
 * @module @qi/core/logger
 *
 * Key features:
 * - Structured logging with JSON support
 * - Environment-based configuration
 * - Multiple transport targets (console, file)
 * - Custom formatting with timestamps
 * - Color-coded output by log level
 * - Error-specific file logging
 * - Millisecond precision timestamps
 *
 * Configuration:
 * - LOG_LEVEL: Set via environment variable (default: 'info')
 * - NODE_ENV: Controls file logging (enabled in non-production)
 *
 * Log Levels:
 * - error: Error events that require immediate attention
 * - warn: Warning conditions that should be addressed
 * - info: Normal but significant events
 * - debug: Detailed debugging information
 *
 * @example
 * ```typescript
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database connection failed', {
 *   error: err.message,
 *   connectionId: 'db-1'
 * });
 *
 * // Debug with detailed context
 * logger.debug('Processing request', {
 *   requestId: 'req-123',
 *   method: 'POST',
 *   path: '/api/users',
 *   duration: 150
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-19
 */
  
import winston from "winston";
  
const { combine, timestamp, printf, colorize, align } = winston.format;
  
/**
 * Custom log format function
 * Formats log entries with timestamp, level, message, and metadata
 * @param level Log level
 * @param message Log message
 * @param timestamp Timestamp string
 * @param metadata Additional metadata
 * @returns Formatted log string
 *
 * @example
 * // Output format:
 * // 2024-03-14 12:34:56.789 [info] : User logged in {"userId": "123"}
 */
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `<img src="https://latex.codecogs.com/gif.latex?{timestamp}%20["/>{level}] : <img src="https://latex.codecogs.com/gif.latex?{message}`;%20%20if%20(Object.keys(metadata).length%20&gt;%200)%20{%20%20%20%20msg%20+=%20`"/>{JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});
  
/**
 * Winston logger instance with custom configuration
 *
 * Features:
 * - Color-coded output in console
 * - Millisecond-precision timestamps
 * - JSON metadata support
 * - File logging in development
 *
 * @example
 * import { logger } from './logger';
 *
 * logger.info('Operation successful', { operation: 'create', id: 123 });
 * logger.error('Operation failed', { error: err.message });
 */
const logger = winston.createLogger({
  // Log level from environment or default to 'info'
  level: process.env.LOG_LEVEL || "info",
  
  // Combine multiple formatting options
  format: combine(
    // Add colors to log levels
    colorize({ all: true }),
    // Add timestamp with millisecond precision
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    // Align log messages
    align(),
    // Apply custom format
    customFormat
  ),
  
  // Define log transports
  transports: [
    // Console transport
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});
  
// Add file transports in development environment
if (process.env.NODE_ENV !== "production") {
  // Error log file
  logger.add(
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: combine(timestamp(), customFormat),
    })
  );
  
  // Combined log file
  logger.add(
    new winston.transports.File({
      filename: "combined.log",
      format: combine(timestamp(), customFormat),
    })
  );
}
  
// Export configured logger
export { logger };
  
```  
  
### Usage Example
  
To utilize the logger in the application, import it and log messages at various levels as shown below:
  
```typescript
// src/app.ts
  
import { logger } from '@qi/core/logger';
  
// Log an informational message
logger.info('Server started successfully', { port: 3000 });
  
// Log a warning message
logger.warn('Disk space running low', { availableSpace: '500MB' });
  
// Log an error message
logger.error('Failed to connect to database', { error: err.message });
```
  
### Description
  
The `logger` instance is configured using Winston to provide versatile logging capabilities across the application. It supports:
  
- **Color-Coded Console Output**: Enhances readability by colorizing log levels in the console.
- **Precise Timestamps**: Logs include timestamps with millisecond precision for accurate tracing.
- **JSON Metadata Support**: Allows attaching additional metadata to log messages for better context.
- **File Logging in Development**: In non-production environments, logs are written to both `error.log` and `combined.log` files for persistent storage and review.
  
### Example
  
Here's how we can implement and use the logger in different scenarios:
  
```typescript
// Import the logger
import { logger } from '@qi/core/logger';
  
// Logging an informational message
logger.info('User registration successful', { userId: 'abc123', role: 'admin' });
  
// Logging a warning message
logger.warn('Cache miss for key', { key: 'user_profile_abc123' });
  
// Logging an error message
logger.error('Unhandled exception occurred', { error: err.stack });
```
  
This setup ensures that the application has a robust and flexible logging mechanism, aiding in both development and production debugging processes.
  
  
### `qi/core/src/errors`
  
```ts
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
  
```  
  
### `qi/core/src/utils`
  
```ts
/**
 * @fileoverview Core utility functions providing common operations, environment handling,
 * data formatting, and enhanced error handling capabilities.
 * @module @qi/core/utils
 *
 * Key Features:
 * - Environment file loading and parsing
 * - Secure cryptographic hashing
 * - Data formatting (bytes, JSON, truncation)
 * - Retry mechanisms for operations
 * - Lodash utility re-exports
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-19
 */

import {
  debounce,
  throttle,
  merge as deepMerge,
  isPlainObject,
  uniqBy as uniqueBy,
} from "lodash-es";
import { createHash } from "crypto";
import bytes from "bytes";
import retry from "retry";
import { promises as fs } from "fs";
import chalk from "chalk";

// Re-export lodash utilities
export { debounce, throttle, deepMerge, isPlainObject, uniqueBy };

/**
 * Handles file not found errors by returning a fallback value.
 * Used for graceful handling of missing config/env files.
 *
 * @param promise - Promise that might reject with ENOENT/ENOTDIR
 * @param fallbackValue - Value to return if file not found
 * @returns Promise resolving to either the original value or fallback
 *
 * @example
 * ```typescript
 * const content = await orIfFileNotExist(
 *   fs.readFile('config.json'),
 *   '{}'
 * );
 * ```
 */
async function orIfFileNotExist<T>(
  promise: Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (
      (e as NodeJS.ErrnoException).code === "ENOENT" ||
      (e as NodeJS.ErrnoException).code === "ENOTDIR"
    ) {
      return fallbackValue;
    }
    throw e;
  }
}

/**
 * Parses environment file content in KEY=VALUE format.
 * Handles comments, empty lines, and quoted values.
 *
 * @param content - Raw content of environment file
 * @returns Object mapping environment variable names to values
 *
 * @example
 * ```typescript
 * const vars = parseEnvFile(`
 *   # Database config
 *   DB_HOST=localhost
 *   DB_PORT=5432
 *   DB_NAME="my_app"
 * `);
 * ```
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const [key, ...valueParts] = line.split("=");
    if (!key || valueParts.length === 0) return;

    const value = valueParts.join("=").trim();
    result[key.trim()] = value.replace(/^["']|["']$/g, "");
  });

  return result;
}

/**
 * Loads and parses environment variables from a file.
 * Supports optional overriding of existing variables.
 *
 * @param envFile - Path to environment file
 * @param options - Configuration options
 *        - override: Whether to override existing variables
 * @returns Parsed environment variables or null if file doesn't exist
 *
 * @example
 * ```typescript
 * // Load without overriding existing vars
 * const vars = await loadEnv('.env');
 *
 * // Load and override existing vars
 * const vars = await loadEnv('.env.local', { override: true });
 * ```
 */
export async function loadEnv(
  envFile: string,
  options: { override?: boolean } = {}
): Promise<Record<string, string> | null> {
  const data = await orIfFileNotExist(fs.readFile(envFile, "utf8"), null);
  if (data === null) return null;

  const parsed = parseEnvFile(data);

  if (options.override) {
    Object.entries(parsed).forEach(([key, value]) => {
      process.env[key] = value;
    });
  } else {
    Object.entries(parsed).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = value;
      }
    });
  }

  return parsed;
}

/**
 * Creates a SHA-256 hash of the input string.
 *
 * @param input - String to hash
 * @returns Hexadecimal hash string
 *
 * @example
 * ```typescript
 * const hashedPassword = hash('user-password');
 * ```
 */
export function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Formats byte sizes into human-readable strings.
 *
 * @param byteCount - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with units (e.g., "1.5 MB")
 *
 * @example
 * ```typescript
 * console.log(formatBytes(1536)); // "1.5 KB"
 * console.log(formatBytes(1048576, 1)); // "1.0 MB"
 * ```
 */
export function formatBytes(byteCount: number, decimals = 2): string {
  return bytes.format(byteCount, {
    unitSeparator: " ",
    decimalPlaces: decimals,
  });
}

/**
 * Truncates a string to specified length, adding ellipsis if needed.
 *
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string with ellipsis if needed
 *
 * @example
 * ```typescript
 * console.log(truncate("Long text here", 8)); // "Long ..."
 * ```
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

/**
 * Retries an asynchronous operation with exponential backoff.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 *        - retries: Maximum number of attempts
 *        - minTimeout: Initial timeout in milliseconds
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const data = await retryOperation(
 *   () => fetchData(),
 *   { retries: 3, minTimeout: 1000 }
 * );
 * ```
 */
export async function retryOperation<T>(
  fn: () => Promise<T>,
  options = { retries: 3, minTimeout: 1000 }
): Promise<T> {
  const operation = retry.operation({
    ...options,
    randomize: false,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        if (!operation.retry(err as Error)) {
          reject(operation.mainError());
        }
      }
    });
  });
}

/**
 * Formats a JSON object with color-coded syntax highlighting.
 * Color scheme:
 * - Blue: Property keys
 * - Green: String values
 * - Yellow: Numbers, booleans, null
 * - White: Structural characters
 *
 * @param obj - Object to format
 * @returns Color-formatted JSON string
 *
 * @example
 * ```typescript
 * console.log(formatJsonWithColor({
 *   name: "test",
 *   count: 42,
 *   active: true
 * }));
 * ```
 */
export const formatJsonWithColor = (obj: unknown): string => {
  const colorizeValue = (value: unknown): string => {
    if (typeof value === "string") {
      return chalk.green(`"${value}"`);
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return chalk.yellow(String(value));
    }
    return String(value);
  };

  const formatWithIndent = (data: unknown, indent = 0): string => {
    const spaces = " ".repeat(indent * 2);

    if (Array.isArray(data)) {
      if (data.length === 0) return "[]";
      const items = data
        .map((item) => `${spaces}  ${formatWithIndent(item, indent + 1)}`)
        .join(",\n");
      return `[\n${items}\n${spaces}]`;
    }

    if (data && typeof data === "object" && data !== null) {
      if (Object.keys(data).length === 0) return "{}";
      const entries = Object.entries(data)
        .map(([key, value]) => {
          const coloredKey = chalk.blue(`"${key}"`);
          const formattedValue = formatWithIndent(value, indent + 1);
          return `${spaces}  ${coloredKey}: ${formattedValue}`;
        })
        .join(",\n");
      return `{\n${entries}\n${spaces}}`;
    }

    return colorizeValue(data);
  };

  return formatWithIndent(obj);
};  
```  
  
#### Description
  
The `@qi/core/utils` module offers a collection of essential utility functions that facilitate common operations within the application. These utilities enhance environment handling, data formatting, error management, and provide re-exports of frequently used Lodash functions for streamlined development.
  
**Key Features:**
  
- **Environment Handling:**
  - `parseEnvFile`: Parses environment variable files (`.env`) supporting comments and quoted values.
  - `orIfFileNotExist`: Gracefully handles file read operations by providing fallback values if files are missing.
  
- **Data Formatting:**
  - `formatBytes`: Converts byte values into human-readable formats (e.g., KB, MB).
  - `truncate`: Shortens long strings and appends ellipses for readability.
  
- **Cryptographic Operations:**
  - `generateHash`: Creates SHA-256 hashes for input strings, useful for securing sensitive data.
  
- **Retry Mechanisms:**
  - `retryAsync`: Implements retry logic for asynchronous operations, enhancing reliability in network requests or unstable operations.
  
- **Logging Enhancements:**
  - `coloredLog`: Outputs log messages with colors corresponding to their severity levels for better visibility in the console.
  
- **Lodash Utilities:**
  - Re-exports common Lodash functions like `debounce`, `throttle`, `deepMerge`, `isPlainObject`, and `uniqueBy` for ease of use across the application.
  
#### Usage Example
  
Here's how we can utilize the various utility functions provided by the `@qi/core/utils` module in the application:
  
```typescript
// src/app.ts
  
import {
  debounce,
  throttle,
  deepMerge,
  isPlainObject,
  uniqueBy,
  orIfFileNotExist,
  parseEnvFile,
  generateHash,
  formatBytes,
  retryAsync,
  truncate,
  coloredLog,
} from '@qi/core/utils';
import { promises as fs } from 'fs';
  
async function initializeApp() {
  // Environment Handling
  const envContent = await orIfFileNotExist(
    fs.readFile('.env', 'utf-8'),
    ''
  );
  const envVars = parseEnvFile(envContent);
  console.log(envVars);
  
  // Cryptographic Hashing
  const passwordHash = generateHash('my_secure_password');
  console.log(`Password Hash: ${passwordHash}`);
  
  // Data Formatting
  const formattedBytes = formatBytes(2048);
  console.log(`Formatted Bytes: ${formattedBytes}`);
  
  const longString = "This is an exceptionally long string that needs to be truncated.";
  const shortString = truncate(longString, 30);
  console.log(`Truncated String: ${shortString}`);
  
  // Logging Enhancements
  coloredLog('info', 'Application initialized successfully.');
  coloredLog('warn', 'Low disk space detected.');
  coloredLog('error', 'Failed to connect to the database.');
  
  // Retry Mechanism
  try {
    const data = await retryAsync(
      () => fetchDataFromAPI(),
      { retries: 3, minTimeout: 1000 }
    );
    console.log('Data fetched:', data);
  } catch (error) {
    console.error('Failed to fetch data after retries:', error);
  }
  
  // Lodash Utilities
  const debouncedFunction = debounce(() => {
    console.log('Debounced Function Executed');
  }, 300);
  
  debouncedFunction();
  
  const throttledFunction = throttle(() => {
    console.log('Throttled Function Executed');
  }, 1000);
  
  throttledFunction();
  
  const mergedObject = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
  console.log('Merged Object:', mergedObject);
  
  const plain = isPlainObject(mergedObject);
  console.log('Is Plain Object:', plain);
  
  const uniqueArray = uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], 'id');
  console.log('Unique Array:', uniqueArray);
}
  
initializeApp();
  
/**
 * Mock function to simulate fetching data from an API.
 * Replace this with actual API call logic.
 */
async function fetchDataFromAPI(): Promise<any> {
  // Simulate a network request with a possibility of failure
  if (Math.random() < 0.7) {
    throw new Error('Network Error');
  }
  return { data: 'Sample Data' };
}
```
  
#### Example Breakdown
  
1. **Environment Handling:**
   - **Reading Environment Variables:**
     ```typescript
     const envContent = await orIfFileNotExist(
       fs.readFile('.env', 'utf-8'),
       ''
     );
     const envVars = parseEnvFile(envContent);
     console.log(envVars);
     ```
     - Attempts to read a `.env` file.
     - If the file doesn't exist, returns an empty string as a fallback.
     - Parses the environment variables and logs them.
  
2. **Cryptographic Hashing:**
   - **Generating a Hash:**
     ```typescript
     const passwordHash = generateHash('my_secure_password');
     console.log(`Password Hash: ${passwordHash}`);
     ```
     - Creates a SHA-256 hash of the input string.
  
3. **Data Formatting:**
   - **Formatting Bytes:**
     ```typescript
     const formattedBytes = formatBytes(2048);
     console.log(`Formatted Bytes: ${formattedBytes}`);
     ```
     - Converts `2048` bytes to a human-readable format (`2 kB`).
  
   - **Truncating Strings:**
     ```typescript
     const longString = "This is an exceptionally long string that needs to be truncated.";
     const shortString = truncate(longString, 30);
     console.log(`Truncated String: ${shortString}`);
     ```
     - Shortens a long string to `30` characters, appending an ellipsis.
  
4. **Logging Enhancements:**
   - **Colored Logging:**
     ```typescript
     coloredLog('info', 'Application initialized successfully.');
     coloredLog('warn', 'Low disk space detected.');
     coloredLog('error', 'Failed to connect to the database.');
     ```
     - Logs messages with colors based on severity (`info` in blue, `warn` in yellow, `error` in red).
  
5. **Retry Mechanism:**
   - **Retrying an Operation:**
     ```typescript
     try {
       const data = await retryAsync(
         () => fetchDataFromAPI(),
         { retries: 3, minTimeout: 1000 }
       );
       console.log('Data fetched:', data);
     } catch (error) {
       console.error('Failed to fetch data after retries:', error);
     }
     ```
     - Attempts to fetch data from an API.
     - Retries up to `3` times with a minimum timeout of `1` second between attempts.
  
6. **Lodash Utilities:**
   - **Debounce and Throttle:**
     ```typescript
     const debouncedFunction = debounce(() => {
       console.log('Debounced Function Executed');
     }, 300);
  
     debouncedFunction();
  
     const throttledFunction = throttle(() => {
       console.log('Throttled Function Executed');
     }, 1000);
  
     throttledFunction();
     ```
     - Debounces and throttles functions to control their execution frequency.
  
   - **Deep Merge:**
     ```typescript
     const mergedObject = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
     console.log('Merged Object:', mergedObject);
     ```
     - Deeply merges two objects.
  
   - **Type Checking:**
     ```typescript
     const plain = isPlainObject(mergedObject);
     console.log('Is Plain Object:', plain);
     ```
     - Checks if `mergedObject` is a plain JavaScript object.
  
   - **Unique By Property:**
     ```typescript
     const uniqueArray = uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], 'id');
     console.log('Unique Array:', uniqueArray);
     ```
     - Removes duplicate objects from an array based on the `id` property.
  
#### **Summary**
  
The `@qi/core/utils` module is a comprehensive collection of utility functions designed to streamline common tasks within the application. By providing robust environment handling, secure cryptographic operations, flexible data formatting, reliable retry mechanisms, and convenient Lodash re-exports, this module enhances both the development experience and the application's reliability.
  
Implementing these utilities can significantly reduce boilerplate code, improve error handling, and ensure consistent data processing across different parts of the application.
  
If one requires further customization or additional utilities, consider extending this module to fit the specific project needs.
  