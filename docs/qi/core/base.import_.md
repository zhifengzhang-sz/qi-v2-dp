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
  
---
  
### `qi/core/src/errors`
  
#### `qi/core/src/errors/ErrorCode.ts`
  
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
  
#### `qi/core/src/errors/ApplicationError.ts`
  
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
    logger.error(`<img src="https://latex.codecogs.com/gif.latex?{this.name}%20["/>{this.code}]: <img src="https://latex.codecogs.com/gif.latex?{this.message}`,%20{%20%20%20%20%20%20statusCode:%20this.statusCode,%20%20%20%20%20%20details:%20this.details,%20%20%20%20%20%20stack:%20this.stack,%20%20%20%20});%20%20%20%20//%20Prepare%20standardized%20response%20(example%20for%20an%20HTTP%20API)%20%20%20%20return%20{%20%20%20%20%20%20status:%20this.statusCode,%20%20%20%20%20%20error:%20{%20%20%20%20%20%20%20%20code:%20this.code,%20%20%20%20%20%20%20%20message:%20this.message,%20%20%20%20%20%20%20%20...(process.env.NODE_ENV%20===%20&quot;development&quot;%20&amp;&amp;%20{%20%20%20%20%20%20%20%20%20%20details:%20this.details,%20%20%20%20%20%20%20%20}),%20%20%20%20%20%20},%20%20%20%20};%20%20}}```%20%20####%20`qi/core/src/errors/index.ts````ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Core%20error%20handling%20system%20providing%20strongly-typed%20error%20classes%20*%20for%20different%20categories%20of%20application%20failures.%20Includes%20detailed%20error%20tracking,%20*%20type-safe%20error%20details,%20and%20standardized%20error%20codes.%20*%20@module%20@qi/core/errors%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-03-18%20*%20@modified%202024-11-22%20*/export%20{%20ErrorDetails,%20ApplicationError%20}%20from%20&quot;./ApplicationError.js&quot;;export%20{%20ErrorCode%20}%20from%20&quot;./ErrorCodes.js&quot;;```%20%20####%20ApplicationError%20OverviewThe%20`ApplicationError`%20class%20is%20the%20cornerstone%20of%20the%20application&#39;s%20error%20handling%20mechanism.%20It%20provides%20a%20consistent%20and%20structured%20way%20to%20handle%20errors%20across%20the%20entire%20codebase,%20ensuring%20that%20all%20errors%20are%20managed%20uniformly%20and%20contain%20necessary%20contextual%20information.####%20Key%20Features1.%20**Centralized%20Error%20Codes:**%20%20%20-%20Utilizes%20the%20`ErrorCode`%20enumeration%20to%20assign%20standardized%20codes%20to%20errors,%20promoting%20consistency%20and%20ease%20of%20identification.2.%20**Structured%20Error%20Details:**%20%20%20-%20Incorporates%20an%20`ErrorDetails`%20interface%20to%20attach%20additional%20context%20to%20errors,%20facilitating%20easier%20debugging%20and%20more%20informative%20responses.3.%20**Standardized%20Handling%20Mechanism:**%20%20%20-%20Implements%20a%20`handle`%20method%20that%20logs%20error%20details%20and%20prepares%20a%20consistent%20response%20format,%20suitable%20for%20APIs%20or%20other%20interfaces.4.%20**Integration%20with%20Logging%20System:**%20%20%20-%20Leverages%20a%20centralized%20`logger`%20to%20record%20error%20information,%20including%20messages,%20codes,%20details,%20and%20stack%20traces.####%20Components1.%20**ErrorCode%20Enumeration%20(`ErrorCodes.ts`):**%20%20%20-%20Defines%20a%20comprehensive%20set%20of%20error%20codes%20used%20throughout%20the%20application.%20%20%20-%20Ensures%20that%20each%20error%20type%20is%20uniquely%20identifiable%20and%20standardized.%20%20%20```typescript%20%20%20//%20src/errors/ErrorCodes.ts%20%20%20export%20enum%20ErrorCode%20{%20%20%20%20%20APPLICATION_ERROR%20=%20&quot;APPLICATION_ERROR&quot;,%20%20%20%20%20INVALID_INPUT%20=%20&quot;INVALID_INPUT&quot;,%20%20%20%20%20AUTHENTICATION_FAILED%20=%20&quot;AUTHENTICATION_FAILED&quot;,%20%20%20%20%20//%20Add%20other%20error%20codes%20as%20needed%20%20%20}%20%20%20```2.%20**ErrorDetails%20Interface:**%20%20%20-%20Provides%20a%20flexible%20structure%20to%20include%20any%20additional%20information%20related%20to%20an%20error.%20%20%20-%20Allows%20for%20the%20inclusion%20of%20nested%20objects,%20arrays,%20or%20primitive%20values%20to%20convey%20detailed%20context.3.%20**ApplicationError%20Class:**%20%20%20-%20Serves%20as%20the%20base%20class%20for%20all%20application-specific%20errors.%20%20%20-%20Encapsulates%20common%20properties%20such%20as%20`message`,%20`code`,%20`statusCode`,%20and%20`details`.%20%20%20-%20Offers%20a%20`handle`%20method%20to%20process%20the%20error%20uniformly%20across%20different%20parts%20of%20the%20application.####%20Usage%20Guidelines1.%20**Creating%20Custom%20Errors:**%20%20%20-%20Extend%20the%20`ApplicationError`%20class%20to%20create%20specific%20error%20types%20tailored%20to%20different%20scenarios.%20%20%20-%20Assign%20appropriate%20`ErrorCode`%20values%20to%20each%20custom%20error%20to%20maintain%20clarity%20and%20consistency.%20%20%20```typescript%20%20%20//%20src/errors/CustomErrors.ts%20%20%20import%20{%20ApplicationError,%20ErrorDetails%20}%20from%20&quot;./ApplicationError&quot;;%20%20%20import%20{%20ErrorCode%20}%20from%20&quot;./ErrorCodes&quot;;%20%20%20/**%20%20%20%20*%20Error%20thrown%20when%20user%20authentication%20fails.%20%20%20%20*/%20%20%20export%20class%20AuthenticationError%20extends%20ApplicationError%20{%20%20%20%20%20constructor(%20%20%20%20%20%20%20message:%20string,%20%20%20%20%20%20%20details?:%20ErrorDetails%20%20%20%20%20)%20{%20%20%20%20%20%20%20super(message,%20ErrorCode.AUTHENTICATION_FAILED,%20401,%20details);%20%20%20%20%20%20%20this.name%20=%20&quot;AuthenticationError&quot;;%20%20%20%20%20}%20%20%20%20%20/**%20%20%20%20%20%20*%20Factory%20method%20to%20create%20a%20new%20AuthenticationError%20instance.%20%20%20%20%20%20*%20%20%20%20%20%20*%20@param%20{string}%20message%20-%20Error%20message.%20%20%20%20%20%20*%20@param%20{ErrorDetails}%20[details]%20-%20Additional%20error%20details.%20%20%20%20%20%20*%20@returns%20{AuthenticationError}%20New%20instance%20of%20AuthenticationError.%20%20%20%20%20%20*%20%20%20%20%20%20*%20@example%20%20%20%20%20%20*%20```typescript%20%20%20%20%20%20*%20throw%20AuthenticationError.create(&quot;Invalid%20credentials%20provided.&quot;,%20{%20username:%20&quot;john_doe&quot;%20});%20%20%20%20%20%20*%20```%20%20%20%20%20%20*/%20%20%20%20%20static%20create(message:%20string,%20details?:%20ErrorDetails):%20AuthenticationError%20{%20%20%20%20%20%20%20return%20new%20AuthenticationError(message,%20details);%20%20%20%20%20}%20%20%20}%20%20%20```2.%20**Throwing%20Errors:**%20%20%20-%20Instantiate%20and%20throw%20errors%20using%20either%20the%20constructor%20or%20factory%20methods%20provided%20by%20custom%20error%20classes.%20%20%20```typescript%20%20%20//%20src/controllers/UserController.ts%20%20%20import%20{%20AuthenticationError%20}%20from%20&quot;../errors/CustomErrors&quot;;%20%20%20export%20async%20function%20loginUser(req,%20res)%20{%20%20%20%20%20const%20{%20username,%20password%20}%20=%20req.body;%20%20%20%20%20const%20user%20=%20await%20findUserByUsername(username);%20%20%20%20%20if%20(!user%20||%20!validatePassword(user,%20password))%20{%20%20%20%20%20%20%20throw%20AuthenticationError.create(&quot;Invalid%20username%20or%20password.&quot;,%20{%20username%20});%20%20%20%20%20}%20%20%20%20%20//%20Proceed%20with%20generating%20token%20or%20session%20%20%20}%20%20%20```3.%20**Catching%20and%20Handling%20Errors:**%20%20%20-%20Use%20try-catch%20blocks%20to%20intercept%20errors%20and%20utilize%20the%20`handle`%20method%20for%20logging%20and%20response%20preparation.%20%20%20```typescript%20%20%20//%20src/middleware/errorHandler.ts%20%20%20import%20{%20ApplicationError%20}%20from%20&quot;../errors/ApplicationError&quot;;%20%20%20export%20function%20errorHandler(err,%20req,%20res,%20next)%20{%20%20%20%20%20if%20(err%20instanceof%20ApplicationError)%20{%20%20%20%20%20%20%20const%20response%20=%20err.handle();%20%20%20%20%20%20%20return%20res.status(response.status).json(response.error);%20%20%20%20%20}%20%20%20%20%20//%20Handle%20non-ApplicationError%20instances%20%20%20%20%20console.error(&quot;Unhandled%20error:&quot;,%20err);%20%20%20%20%20res.status(500).json({%20code:%20&quot;INTERNAL_SERVER_ERROR&quot;,%20message:%20&quot;An%20unexpected%20error%20occurred.&quot;%20});%20%20%20}%20%20%20```####%20Best%20Practices-%20**Consistent%20Error%20Codes:**%20%20-%20Always%20use%20predefined%20`ErrorCode`%20values%20when%20throwing%20errors%20to%20maintain%20consistency%20and%20facilitate%20easier%20error%20tracking.-%20**Comprehensive%20Error%20Details:**%20%20-%20Provide%20as%20much%20contextual%20information%20as%20possible%20within%20the%20`details`%20property%20to%20aid%20in%20debugging%20and%20user%20feedback.-%20**Avoid%20Sensitive%20Information:**%20%20-%20Ensure%20that%20sensitive%20data%20is%20not%20exposed%20in%20error%20messages%20or%20details,%20especially%20in%20production%20environments.-%20**Utilize%20Factory%20Methods:**%20%20-%20Prefer%20using%20factory%20methods%20for%20creating%20error%20instances,%20as%20they%20encapsulate%20the%20instantiation%20logic%20and%20enforce%20consistent%20usage%20patterns.-%20**Centralized%20Error%20Handling:**%20%20-%20Implement%20a%20centralized%20error%20handling%20middleware%20or%20mechanism%20to%20uniformly%20process%20and%20respond%20to%20errors%20across%20the%20application.####%20**Extending%20the%20Error%20Handling%20System**To%20extend%20the%20error%20handling%20system%20with%20new%20error%20types:1.%20**Define%20a%20New%20ErrorCode:**%20%20%20-%20Add%20a%20new%20entry%20to%20the%20`ErrorCode`%20enumeration%20in%20`ErrorCodes.ts`.%20%20%20```typescript%20%20%20export%20enum%20ErrorCode%20{%20%20%20%20%20//%20Existing%20codes...%20%20%20%20%20RESOURCE_NOT_FOUND%20=%20&quot;RESOURCE_NOT_FOUND&quot;,%20%20%20%20%20//%20Add%20new%20codes%20here%20%20%20}%20%20%20```2.%20**Create%20a%20Custom%20Error%20Class:**%20%20%20-%20Extend%20`ApplicationError`%20to%20create%20a%20new%20error%20class%20corresponding%20to%20the%20new%20error%20code.%20%20%20```typescript%20%20%20//%20src/errors/ResourceErrors.ts%20%20%20import%20{%20ApplicationError,%20ErrorDetails%20}%20from%20&quot;./ApplicationError&quot;;%20%20%20import%20{%20ErrorCode%20}%20from%20&quot;./ErrorCodes&quot;;%20%20%20/**%20%20%20%20*%20Error%20thrown%20when%20a%20requested%20resource%20is%20not%20found.%20%20%20%20*/%20%20%20export%20class%20ResourceNotFoundError%20extends%20ApplicationError%20{%20%20%20%20%20constructor(%20%20%20%20%20%20%20message:%20string,%20%20%20%20%20%20%20details?:%20ErrorDetails%20%20%20%20%20)%20{%20%20%20%20%20%20%20super(message,%20ErrorCode.RESOURCE_NOT_FOUND,%20404,%20details);%20%20%20%20%20%20%20this.name%20=%20&quot;ResourceNotFoundError&quot;;%20%20%20%20%20}%20%20%20%20%20/**%20%20%20%20%20%20*%20Factory%20method%20to%20create%20a%20new%20ResourceNotFoundError%20instance.%20%20%20%20%20%20*%20%20%20%20%20%20*%20@param%20{string}%20message%20-%20Error%20message.%20%20%20%20%20%20*%20@param%20{ErrorDetails}%20[details]%20-%20Additional%20error%20details.%20%20%20%20%20%20*%20@returns%20{ResourceNotFoundError}%20New%20instance%20of%20ResourceNotFoundError.%20%20%20%20%20%20*%20%20%20%20%20%20*%20@example%20%20%20%20%20%20*%20```typescript%20%20%20%20%20%20*%20throw%20ResourceNotFoundError.create(&quot;User%20not%20found.&quot;,%20{%20userId:%20123%20});%20%20%20%20%20%20*%20```%20%20%20%20%20%20*/%20%20%20%20%20static%20create(message:%20string,%20details?:%20ErrorDetails):%20ResourceNotFoundError%20{%20%20%20%20%20%20%20return%20new%20ResourceNotFoundError(message,%20details);%20%20%20%20%20}%20%20%20}%20%20%20```3.%20**Utilize%20the%20New%20Error:**%20%20%20-%20Throw%20the%20new%20error%20in%20appropriate%20places%20within%20the%20application.%20%20%20```typescript%20%20%20//%20src/services/UserService.ts%20%20%20import%20{%20ResourceNotFoundError%20}%20from%20&quot;../errors/ResourceErrors&quot;;%20%20%20export%20async%20function%20getUserById(userId:%20number)%20{%20%20%20%20%20const%20user%20=%20await%20database.findUserById(userId);%20%20%20%20%20if%20(!user)%20{%20%20%20%20%20%20%20throw%20ResourceNotFoundError.create(&quot;User%20not%20found.&quot;,%20{%20userId%20});%20%20%20%20%20}%20%20%20%20%20return%20user;%20%20%20}%20%20%20```####%20**Summary**The%20`ApplicationError`%20class,%20in%20conjunction%20with%20the%20`ErrorCode`%20enumeration%20and%20specialized%20error%20classes,%20establishes%20a%20robust%20error%20handling%20framework%20within%20the%20application.%20By%20adhering%20to%20the%20outlined%20practices%20and%20extending%20the%20system%20as%20needed,%20developers%20can%20ensure%20consistent,%20informative,%20and%20manageable%20error%20management%20throughout%20the%20project.---###%20`qi/core/src/utils````ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Core%20utility%20functions%20providing%20common%20operations,%20environment%20handling,%20*%20data%20formatting,%20and%20enhanced%20error%20handling%20capabilities.%20*%20@module%20@qi/core/utils%20*%20*%20Key%20Features:%20*%20-%20Environment%20file%20loading%20and%20parsing%20*%20-%20Secure%20cryptographic%20hashing%20*%20-%20Data%20formatting%20(bytes,%20JSON,%20truncation)%20*%20-%20Retry%20mechanisms%20for%20operations%20*%20-%20Lodash%20utility%20re-exports%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-03-18%20*%20@modified%202024-11-19%20*/import%20{%20%20debounce,%20%20throttle,%20%20merge%20as%20deepMerge,%20%20isPlainObject,%20%20uniqBy%20as%20uniqueBy,}%20from%20&quot;lodash-es&quot;;import%20{%20createHash%20}%20from%20&quot;crypto&quot;;import%20bytes%20from%20&quot;bytes&quot;;import%20retry%20from%20&quot;retry&quot;;import%20{%20promises%20as%20fs%20}%20from%20&quot;fs&quot;;import%20chalk%20from%20&quot;chalk&quot;;//%20Re-export%20lodash%20utilitiesexport%20{%20debounce,%20throttle,%20deepMerge,%20isPlainObject,%20uniqueBy%20};/**%20*%20Handles%20file%20not%20found%20errors%20by%20returning%20a%20fallback%20value.%20*%20Used%20for%20graceful%20handling%20of%20missing%20config/env%20files.%20*%20*%20@param%20promise%20-%20Promise%20that%20might%20reject%20with%20ENOENT/ENOTDIR%20*%20@param%20fallbackValue%20-%20Value%20to%20return%20if%20file%20not%20found%20*%20@returns%20Promise%20resolving%20to%20either%20the%20original%20value%20or%20fallback%20*%20*%20@example%20*%20```typescript%20*%20const%20content%20=%20await%20orIfFileNotExist(%20*%20%20%20fs.readFile(&#39;config.json&#39;),%20*%20%20%20&#39;{}&#39;%20*%20);%20*%20```%20*/async%20function%20orIfFileNotExist&lt;T&gt;(%20%20promise:%20Promise&lt;T&gt;,%20%20fallbackValue:%20T):%20Promise&lt;T&gt;%20{%20%20try%20{%20%20%20%20return%20await%20promise;%20%20}%20catch%20(e)%20{%20%20%20%20if%20(%20%20%20%20%20%20(e%20as%20NodeJS.ErrnoException).code%20===%20&quot;ENOENT&quot;%20||%20%20%20%20%20%20(e%20as%20NodeJS.ErrnoException).code%20===%20&quot;ENOTDIR&quot;%20%20%20%20)%20{%20%20%20%20%20%20return%20fallbackValue;%20%20%20%20}%20%20%20%20throw%20e;%20%20}}/**%20*%20Parses%20environment%20file%20content%20in%20KEY=VALUE%20format.%20*%20Handles%20comments,%20empty%20lines,%20and%20quoted%20values.%20*%20*%20@param%20content%20-%20Raw%20content%20of%20environment%20file%20*%20@returns%20Object%20mapping%20environment%20variable%20names%20to%20values%20*%20*%20@example%20*%20```typescript%20*%20const%20vars%20=%20parseEnvFile(`%20*%20%20%20#%20Database%20config%20*%20%20%20DB_HOST=localhost%20*%20%20%20DB_PORT=5432%20*%20%20%20DB_NAME=&quot;my_app&quot;%20*%20`);%20*%20```%20*/function%20parseEnvFile(content:%20string):%20Record&lt;string,%20string&gt;%20{%20%20const%20result:%20Record&lt;string,%20string&gt;%20=%20{};%20%20content.split(&quot;\n&quot;).forEach((line)%20=&gt;%20{%20%20%20%20line%20=%20line.trim();%20%20%20%20if%20(!line%20||%20line.startsWith(&quot;#&quot;))%20return;%20%20%20%20const%20[key,%20...valueParts]%20=%20line.split(&quot;=&quot;);%20%20%20%20if%20(!key%20||%20valueParts.length%20===%200)%20return;%20%20%20%20const%20value%20=%20valueParts.join(&quot;=&quot;).trim();%20%20%20%20result[key.trim()]%20=%20value.replace(/^[&quot;&#39;]|[&quot;&#39;]"/>/g, "");
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
      return chalk.green(`"<img src="https://latex.codecogs.com/gif.latex?{value}&quot;`);%20%20%20%20}%20%20%20%20if%20(%20%20%20%20%20%20typeof%20value%20===%20&quot;number&quot;%20||%20%20%20%20%20%20typeof%20value%20===%20&quot;boolean&quot;%20||%20%20%20%20%20%20value%20===%20null%20%20%20%20)%20{%20%20%20%20%20%20return%20chalk.yellow(String(value));%20%20%20%20}%20%20%20%20return%20String(value);%20%20};%20%20const%20formatWithIndent%20=%20(data:%20unknown,%20indent%20=%200):%20string%20=&gt;%20{%20%20%20%20const%20spaces%20=%20&quot;%20&quot;.repeat(indent%20*%202);%20%20%20%20if%20(Array.isArray(data))%20{%20%20%20%20%20%20if%20(data.length%20===%200)%20return%20&quot;[]&quot;;%20%20%20%20%20%20const%20items%20=%20data%20%20%20%20%20%20%20%20.map((item)%20=&gt;%20`"/>{spaces}  <img src="https://latex.codecogs.com/gif.latex?{formatWithIndent(item,%20indent%20+%201)}`)%20%20%20%20%20%20%20%20.join(&quot;,\n&quot;);%20%20%20%20%20%20return%20`[\n"/>{items}\n<img src="https://latex.codecogs.com/gif.latex?{spaces}]`;%20%20%20%20}%20%20%20%20if%20(data%20&amp;&amp;%20typeof%20data%20===%20&quot;object&quot;%20&amp;&amp;%20data%20!==%20null)%20{%20%20%20%20%20%20if%20(Object.keys(data).length%20===%200)%20return%20&quot;{}&quot;;%20%20%20%20%20%20const%20entries%20=%20Object.entries(data)%20%20%20%20%20%20%20%20.map(([key,%20value])%20=&gt;%20{%20%20%20%20%20%20%20%20%20%20const%20coloredKey%20=%20chalk.blue(`&quot;"/>{key}"`);
          const formattedValue = formatWithIndent(value, indent + 1);
          return `<img src="https://latex.codecogs.com/gif.latex?{spaces}"/>{coloredKey}: <img src="https://latex.codecogs.com/gif.latex?{formattedValue}`;%20%20%20%20%20%20%20%20})%20%20%20%20%20%20%20%20.join(&quot;,\n&quot;);%20%20%20%20%20%20return%20`{\n"/>{entries}\n<img src="https://latex.codecogs.com/gif.latex?{spaces}}`;%20%20%20%20}%20%20%20%20return%20colorizeValue(data);%20%20};%20%20return%20formatWithIndent(obj);};```%20%20####%20DescriptionThe%20`@qi/core/utils`%20module%20offers%20a%20collection%20of%20essential%20utility%20functions%20that%20facilitate%20common%20operations%20within%20the%20application.%20These%20utilities%20enhance%20environment%20handling,%20data%20formatting,%20error%20management,%20and%20provide%20re-exports%20of%20frequently%20used%20Lodash%20functions%20for%20streamlined%20development.**Key%20Features:**-%20**Environment%20Handling:**%20%20-%20`parseEnvFile`:%20Parses%20environment%20variable%20files%20(`.env`)%20supporting%20comments%20and%20quoted%20values.%20%20-%20`orIfFileNotExist`:%20Gracefully%20handles%20file%20read%20operations%20by%20providing%20fallback%20values%20if%20files%20are%20missing.-%20**Data%20Formatting:**%20%20-%20`formatBytes`:%20Converts%20byte%20values%20into%20human-readable%20formats%20(e.g.,%20KB,%20MB).%20%20-%20`truncate`:%20Shortens%20long%20strings%20and%20appends%20ellipses%20for%20readability.-%20**Cryptographic%20Operations:**%20%20-%20`generateHash`:%20Creates%20SHA-256%20hashes%20for%20input%20strings,%20useful%20for%20securing%20sensitive%20data.-%20**Retry%20Mechanisms:**%20%20-%20`retryAsync`:%20Implements%20retry%20logic%20for%20asynchronous%20operations,%20enhancing%20reliability%20in%20network%20requests%20or%20unstable%20operations.-%20**Logging%20Enhancements:**%20%20-%20`coloredLog`:%20Outputs%20log%20messages%20with%20colors%20corresponding%20to%20their%20severity%20levels%20for%20better%20visibility%20in%20the%20console.-%20**Lodash%20Utilities:**%20%20-%20Re-exports%20common%20Lodash%20functions%20like%20`debounce`,%20`throttle`,%20`deepMerge`,%20`isPlainObject`,%20and%20`uniqueBy`%20for%20ease%20of%20use%20across%20the%20application.####%20Usage%20ExampleHere&#39;s%20how%20we%20can%20utilize%20the%20various%20utility%20functions%20provided%20by%20the%20`@qi/core/utils`%20module%20in%20the%20application:```typescript//%20src/app.tsimport%20{%20%20debounce,%20%20throttle,%20%20deepMerge,%20%20isPlainObject,%20%20uniqueBy,%20%20orIfFileNotExist,%20%20parseEnvFile,%20%20generateHash,%20%20formatBytes,%20%20retryAsync,%20%20truncate,%20%20coloredLog,}%20from%20&#39;@qi/core/utils&#39;;import%20{%20promises%20as%20fs%20}%20from%20&#39;fs&#39;;async%20function%20initializeApp()%20{%20%20//%20Environment%20Handling%20%20const%20envContent%20=%20await%20orIfFileNotExist(%20%20%20%20fs.readFile(&#39;.env&#39;,%20&#39;utf-8&#39;),%20%20%20%20&#39;&#39;%20%20);%20%20const%20envVars%20=%20parseEnvFile(envContent);%20%20console.log(envVars);%20%20//%20Cryptographic%20Hashing%20%20const%20passwordHash%20=%20generateHash(&#39;my_secure_password&#39;);%20%20console.log(`Password%20Hash:"/>{passwordHash}`);
  
  // Data Formatting
  const formattedBytes = formatBytes(2048);
  console.log(`Formatted Bytes: <img src="https://latex.codecogs.com/gif.latex?{formattedBytes}`);%20%20const%20longString%20=%20&quot;This%20is%20an%20exceptionally%20long%20string%20that%20needs%20to%20be%20truncated.&quot;;%20%20const%20shortString%20=%20truncate(longString,%2030);%20%20console.log(`Truncated%20String:"/>{shortString}`);
  
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
  
The `@qi/core/utils` module is a comprehensive collection of utility functions designed to streamline common tasks within the application. By providing robust environment handling, secure cryptographic operations, flexible data formatting, reliable retry mechanisms, and convenient Lodash re-exports (the re-export mechanism can be thought of adaptor pattern), this module enhances both the development experience and the application's reliability.
  
Implementing these utilities can significantly reduce boilerplate code, improve error handling, and ensure consistent data processing across different parts of the application.
  
If one requires further customization or additional utilities, consider extending this module to fit the specific project needs.
  