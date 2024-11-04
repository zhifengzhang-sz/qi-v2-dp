/**
 * @module logger/index
 * @description Winston logger configuration with custom formatting
 */

import winston from 'winston';

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
  level: process.env.LOG_LEVEL || 'info',

  // Combine multiple formatting options
  format: combine(
    // Add colors to log levels
    colorize({ all: true }),
    // Add timestamp with millisecond precision
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    // Align log messages
    align(),
    // Apply custom format
    customFormat
  ),

  // Define log transports
  transports: [
    // Console transport
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  ]
});

// Add file transports in development environment
if (process.env.NODE_ENV !== 'production') {
  // Error log file
  logger.add(new winston.transports.File({
    filename: 'error.log',
    level: 'error',
    format: combine(
      timestamp(),
      customFormat
    )
  }));

  // Combined log file
  logger.add(new winston.transports.File({
    filename: 'combined.log',
    format: combine(
      timestamp(),
      customFormat
    )
  }));
}

// Export configured logger
export { logger };
