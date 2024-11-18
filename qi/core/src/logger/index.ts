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
  let msg = `${timestamp} [${level}] : ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`;
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
