1. `qi/core/src/logger/index.ts`
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
  
2. `qi/core/src/errors/ErrorCodes.ts`
```ts
/**
 * @fileoverview
 * @module ErrorCodes.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-22
 */
  
// src/errors/ErrorCodes.ts
  
/**
 * Centralized Error Codes Enumeration.
 * Each error code is a unique integer.
 */
export enum ErrorCode {
  // Generic Errors
  APPLICATION_ERROR = 1000,
  READ_ERROR = 1001,
  PARSE_ERROR = 1002,
  WATCH_ERROR = 1003,
  OPERATION_ERROR = 1004,
  CONNECTION_ERROR = 1101,
  TIMEOUT_ERROR = 1102,
  CLIENT_ERROR = 1103,
  PING_ERROR = 1104,
  
  // Configuration Errors
  CONFIGURATION_ERROR = 2000,
  INVALID_SCHEMA = 2001,
  SCHEMA_NOT_FOUND = 2002,
  SCHEMA_VALIDATION_FAILED = 2003,
  ENV_LOAD_ERROR = 2007,
  ENV_MISSING_ERROR = 2008,
  CONFIG_LOAD_ERROR = 2009,
  CONFIG_PARSE_ERROR = 2010,
  
  // Redis Errors
  REDIS_ERROR = 3000,
  
  // CLI Configuration Errors
  CLI_INVALID_ARGUMENT = 4000,
  CLI_MISSING_ARGUMENT = 4001,
  
  // Services Configuration Errors
  SERVICE_CONFIG_INVALID = 5000,
  SERVICE_CONFIG_MISSING = 5001,
  
  // Cache Errors
  CACHE_ERROR = 6001,
  
  // Add more categories and error codes as needed
}
  
```  
  
3. `qi/core/src/errors/ApplicationError.ts`
```ts
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
```

4. `qi/core/src/errors/index.ts`
```ts
/**
 * @fileoverview Core error handling system providing strongly-typed error classes
 * for different categories of application failures. Includes detailed error tracking,
 * type-safe error details, and standardized error codes.
 * @module @qi/core/errors
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-22
 */

export { ErrorDetails, ApplicationError } from "./ApplicationError.js";
export { ErrorCode } from "./ErrorCodes.js";
```

5. `qi/core/src/utils/index.ts`
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
  options: {
    retries: number;
    minTimeout: number;
    onRetry?: (times: number) => void;
  } = { retries: 3, minTimeout: 1000 }
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
        } else if (options.onRetry) {
          options.onRetry(operation.attempts());
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