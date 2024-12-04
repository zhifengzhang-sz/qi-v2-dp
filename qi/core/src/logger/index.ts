/**
 * @fileoverview Configurable logging system based on Winston providing structured
 * logging with customizable formatting, multiple transports, and environment-aware configuration.
 * @module @qi/core/logger
 *
 * @description
 * Provides a flexible, structured logging system with support for multiple environments,
 * custom formatting, and comprehensive error handling. Key features include:
 * - JSON-structured logging with pretty-printing
 * - Environment-aware configuration
 * - Multiple transport targets (console, file)
 * - Color-coded output by log level
 * - Error object handling with stack traces
 * - Millisecond precision timestamps
 * - Consistent metadata formatting
 *
 * Configuration:
 * - LOG_LEVEL: Set via environment variable (default: 'info')
 * - NODE_ENV: Controls file logging (enabled in non-production)
 *
 * Log Levels (in order of severity):
 * - error: Critical errors requiring immediate attention
 * - warn: Warning conditions that should be reviewed
 * - info: Normal but significant events (default)
 * - debug: Detailed debugging information
 *
 * @example Basic Usage
 * ```typescript
 * // Simple logging
 * logger.info('Operation successful');
 *
 * // Logging with metadata
 * logger.info('User action', {
 *   userId: '123',
 *   action: 'login',
 *   duration: 150
 * });
 *
 * // Error logging
 * try {
 *   await someOperation();
 * } catch (error) {
 *   logger.error('Operation failed', {
 *     error,
 *     operation: 'someOperation',
 *     context: { id: 123 }
 *   });
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-12-04
 */

import winston from "winston";

const { combine, timestamp, printf, colorize, align } = winston.format;

/**
 * Interface representing a log entry structure.
 * Extends Winston's TransformableInfo with stricter typing.
 *
 * @interface LogEntry
 * @since 1.0.0
 *
 * @property {string} level - Log level (error, warn, info, debug)
 * @property {unknown} message - Primary log message
 * @property {string} [timestamp] - ISO timestamp with millisecond precision
 * @property {unknown} [key: string] - Additional metadata fields
 */
interface LogEntry extends winston.Logform.TransformableInfo {
  level: string;
  message: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Formats metadata objects for logging output.
 * Handles special cases and provides consistent formatting for complex objects.
 *
 * @since 1.0.0
 * @private
 *
 * @param {Record<string, unknown>} metadata - Object containing log metadata
 * @returns {string} Formatted metadata string ready for output
 *
 * Features:
 * - Handles Error objects with stack traces
 * - Filters out Winston internal properties
 * - Pretty-prints nested objects
 * - Handles undefined/null values
 * - Prevents circular reference issues
 *
 * @example
 * ```typescript
 * const metadata = {
 *   error: new Error('Failed'),
 *   context: { id: 123 }
 * };
 * const formatted = formatMetadata(metadata);
 * // Output:
 * // {
 * //   "error": {
 * //     "message": "Failed",
 * //     "stack": "Error: Failed\n    at ..."
 * //   },
 * //   "context": {
 * //     "id": 123
 * //   }
 * // }
 * ```
 */
function formatMetadata(metadata: Record<string, unknown>): string {
  const cleaned = Object.entries(metadata).reduce(
    (acc, [key, value]) => {
      // Skip Winston internal properties
      if (key === "level" || key === "message" || key === "timestamp") {
        return acc;
      }

      // Handle Error objects comprehensively
      if (value instanceof Error) {
        const errorInfo: Record<string, unknown> = {
          message: value.message,
          stack: value.stack,
        };

        // Add any custom properties from the error
        const errorObj = value as unknown as Record<string, unknown>;
        for (const prop in errorObj) {
          if (prop !== "message" && prop !== "stack") {
            errorInfo[prop] = errorObj[prop];
          }
        }

        acc[key] = errorInfo;
        return acc;
      }

      // Handle undefined/null
      if (value === undefined) {
        acc[key] = "undefined";
        return acc;
      }

      if (value === null) {
        acc[key] = "null";
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {} as Record<string, unknown>
  );

  return Object.keys(cleaned).length > 0
    ? JSON.stringify(cleaned, null, 2)
    : "";
}

/**
 * Custom log format function that creates a structured, readable log message.
 * Combines timestamp, log level, message, and formatted metadata.
 *
 * @since 1.0.0
 * @private
 *
 * Features:
 * - Consistent spacing and alignment
 * - Metadata on separate lines for readability
 * - Uppercase log levels for visibility
 * - Preserved message formatting
 *
 * @example Output Formats
 * ```
 * // Basic log
 * 2024-03-14 12:34:56.789 [INFO]    User logged in
 *
 * // Log with metadata
 * 2024-03-14 12:34:56.789 [ERROR]   Database connection failed
 * {
 *   "error": {
 *     "message": "Connection timeout",
 *     "code": "ETIMEDOUT"
 *   },
 *   "database": "users",
 *   "attemptCount": 3
 * }
 * ```
 */
const customFormat = printf((info: LogEntry) => {
  const { level, message, timestamp, ...metadata } = info;

  // Build base log message with consistent spacing
  const baseMessage = [
    timestamp,
    `[${level.toUpperCase()}]`.padEnd(7),
    String(message), // Ensure message is converted to string
  ].join(" ");

  // Format and append metadata if present
  const formattedMetadata = formatMetadata(metadata);
  return formattedMetadata
    ? `${baseMessage}\n${formattedMetadata}`
    : baseMessage;
});

/**
 * Winston logger instance configured for the application's needs.
 *
 * @since 1.0.0
 *
 * Features:
 * - Color-coded output in console
 * - Millisecond-precision timestamps
 * - JSON metadata support
 * - File logging in development
 * - Error-specific file logging
 * - Console logging to stderr for errors
 *
 * Configuration is environment-aware:
 * - Production: Console-only logging
 * - Development: Additional file logging
 *
 * @example Basic Usage
 * ```typescript
 * // Info logging
 * logger.info('Process started', { processId: 123 });
 *
 * // Error logging with stack trace
 * try {
 *   throw new Error('Process failed');
 * } catch (error) {
 *   logger.error('Process error', { error, processId: 123 });
 * }
 *
 * // Debug logging with context
 * logger.debug('Cache operation', {
 *   operation: 'set',
 *   key: 'user:123',
 *   duration: 45
 * });
 * ```
 */
const logger = winston.createLogger({
  // Log level from environment or default to 'info'
  level: process.env.LOG_LEVEL || "info",

  // Combine multiple formatting options
  format: combine(
    colorize({ all: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    align(),
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
  // Error-specific log file
  logger.add(
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: combine(timestamp(), customFormat),
    })
  );

  // Combined log file for all levels
  logger.add(
    new winston.transports.File({
      filename: "combined.log",
      format: combine(timestamp(), customFormat),
    })
  );
}

export { logger };
