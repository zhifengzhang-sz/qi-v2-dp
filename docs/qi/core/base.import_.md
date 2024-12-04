## Base modules in `qi/core`
  
### `qi/core/src/logger`
  
```ts
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
 * @modified 2024-12-03
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
    `[<img src="https://latex.codecogs.com/gif.latex?{level.toUpperCase()}]`.padEnd(7),%20%20%20%20String(message),%20//%20Ensure%20message%20is%20converted%20to%20string%20%20].join(&quot;%20&quot;);%20%20//%20Format%20and%20append%20metadata%20if%20present%20%20const%20formattedMetadata%20=%20formatMetadata(metadata);%20%20return%20formattedMetadata%20%20%20%20?%20`"/>{baseMessage}\n<img src="https://latex.codecogs.com/gif.latex?{formattedMetadata}`%20%20%20%20:%20baseMessage;});/**%20*%20Winston%20logger%20instance%20configured%20for%20the%20application&#39;s%20needs.%20*%20*%20@since%201.0.0%20*%20*%20Features:%20*%20-%20Color-coded%20output%20in%20console%20*%20-%20Millisecond-precision%20timestamps%20*%20-%20JSON%20metadata%20support%20*%20-%20File%20logging%20in%20development%20*%20-%20Error-specific%20file%20logging%20*%20-%20Console%20logging%20to%20stderr%20for%20errors%20*%20*%20Configuration%20is%20environment-aware:%20*%20-%20Production:%20Console-only%20logging%20*%20-%20Development:%20Additional%20file%20logging%20*%20*%20@example%20Basic%20Usage%20*%20```typescript%20*%20//%20Info%20logging%20*%20logger.info(&#39;Process%20started&#39;,%20{%20processId:%20123%20});%20*%20*%20//%20Error%20logging%20with%20stack%20trace%20*%20try%20{%20*%20%20%20throw%20new%20Error(&#39;Process%20failed&#39;);%20*%20}%20catch%20(error)%20{%20*%20%20%20logger.error(&#39;Process%20error&#39;,%20{%20error,%20processId:%20123%20});%20*%20}%20*%20*%20//%20Debug%20logging%20with%20context%20*%20logger.debug(&#39;Cache%20operation&#39;,%20{%20*%20%20%20operation:%20&#39;set&#39;,%20*%20%20%20key:%20&#39;user:123&#39;,%20*%20%20%20duration:%2045%20*%20});%20*%20```%20*/const%20logger%20=%20winston.createLogger({%20%20//%20Log%20level%20from%20environment%20or%20default%20to%20&#39;info&#39;%20%20level:%20process.env.LOG_LEVEL%20||%20&quot;info&quot;,%20%20//%20Combine%20multiple%20formatting%20options%20%20format:%20combine(%20%20%20%20colorize({%20all:%20true%20}),%20%20%20%20timestamp({%20format:%20&quot;YYYY-MM-DD%20HH:mm:ss.SSS&quot;%20}),%20%20%20%20align(),%20%20%20%20customFormat%20%20),%20%20//%20Define%20log%20transports%20%20transports:%20[%20%20%20%20//%20Console%20transport%20%20%20%20new%20winston.transports.Console({%20%20%20%20%20%20stderrLevels:%20[&quot;error&quot;],%20%20%20%20}),%20%20],});//%20Add%20file%20transports%20in%20development%20environmentif%20(process.env.NODE_ENV%20!==%20&quot;production&quot;)%20{%20%20//%20Error-specific%20log%20file%20%20logger.add(%20%20%20%20new%20winston.transports.File({%20%20%20%20%20%20filename:%20&quot;error.log&quot;,%20%20%20%20%20%20level:%20&quot;error&quot;,%20%20%20%20%20%20format:%20combine(timestamp(),%20customFormat),%20%20%20%20})%20%20);%20%20//%20Combined%20log%20file%20for%20all%20levels%20%20logger.add(%20%20%20%20new%20winston.transports.File({%20%20%20%20%20%20filename:%20&quot;combined.log&quot;,%20%20%20%20%20%20format:%20combine(timestamp(),%20customFormat),%20%20%20%20})%20%20);}export%20{%20logger%20};```%20%20####%20Usage%20ExampleTo%20utilize%20the%20logger%20in%20the%20application,%20import%20it%20and%20log%20messages%20at%20various%20levels%20as%20shown%20below:```typescript//%20src/app.tsimport%20{%20logger%20}%20from%20&quot;@qi/core/logger&quot;;//%20Log%20an%20informational%20messagelogger.info(&quot;Server%20started%20successfully&quot;,%20{%20port:%203000%20});//%20Log%20a%20warning%20messagelogger.warn(&quot;Disk%20space%20running%20low&quot;,%20{%20availableSpace:%20&quot;500MB&quot;%20});//%20Log%20an%20error%20messagelogger.error(&quot;Failed%20to%20connect%20to%20database&quot;,%20{%20error:%20err.message%20});```####%20DescriptionThe%20`logger`%20instance%20is%20configured%20using%20Winston%20to%20provide%20versatile%20logging%20capabilities%20across%20the%20application.%20It%20supports:-%20**Color-Coded%20Console%20Output**:%20Enhances%20readability%20by%20colorizing%20log%20levels%20in%20the%20console.-%20**Precise%20Timestamps**:%20Logs%20include%20timestamps%20with%20millisecond%20precision%20for%20accurate%20tracing.-%20**JSON%20Metadata%20Support**:%20Allows%20attaching%20additional%20metadata%20to%20log%20messages%20for%20better%20context.-%20**File%20Logging%20in%20Development**:%20In%20non-production%20environments,%20logs%20are%20written%20to%20both%20`error.log`%20and%20`combined.log`%20files%20for%20persistent%20storage%20and%20review.####%20ExampleHere&#39;s%20how%20we%20can%20implement%20and%20use%20the%20logger%20in%20different%20scenarios:```typescript//%20Import%20the%20loggerimport%20{%20logger%20}%20from%20&quot;@qi/core/logger&quot;;//%20Logging%20an%20informational%20messagelogger.info(&quot;User%20registration%20successful&quot;,%20{%20%20userId:%20&quot;abc123&quot;,%20%20role:%20&quot;admin&quot;,});//%20Logging%20a%20warning%20messagelogger.warn(&quot;Cache%20miss%20for%20key&quot;,%20{%20key:%20&quot;user_profile_abc123&quot;%20});//%20Logging%20an%20error%20messagelogger.error(&quot;Unhandled%20exception%20occurred&quot;,%20{%20error:%20err.stack%20});```This%20setup%20ensures%20that%20the%20application%20has%20a%20robust%20and%20flexible%20logging%20mechanism,%20aiding%20in%20both%20development%20and%20production%20debugging%20processes.---###%20`qi/core/src/errors`1.%20`qi/core/src/errors/ErrorCode.ts`%20%20%20```ts%20%20%20/**%20*%20@fileoverview%20Error%20Codes%20Enumeration%20*%20@module%20@qi/core/errors/ErrorCodes%20*%20*%20@description%20*%20Centralized%20error%20codes%20for%20the%20application.%20Organized%20by%20category%20with%20*%20reserved%20ranges%20for%20different%20types%20of%20errors.%20*%20*%20Ranges:%20*%201000-1999:%20Generic/Base%20errors%20*%202000-2999:%20Configuration%20errors%20*%203000-3999:%20Service%20lifecycle%20errors%20*%204000-4999:%20CLI%20errors%20*%205000-5999:%20Service%20configuration%20errors%20*%206000-6999:%20Data/Cache%20errors%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-11-21%20*%20@modified%202024-12-01%20*/export%20enum%20ErrorCode%20{%20%20//%20===%20Generic%20Errors%20(1000-1999)%20===%20%20//%20Base%20errors%20%20APPLICATION_ERROR%20=%201000,%20%20INITIALIZATION_ERROR%20=%201001,%20%20NOT_INITIALIZED%20=%201002,%20%20//%20IO%20errors%20%20READ_ERROR%20=%201100,%20%20WRITE_ERROR%20=%201101,%20%20PARSE_ERROR%20=%201102,%20%20WATCH_ERROR%20=%201103,%20%20//%20Connection%20errors%20%20CONNECTION_ERROR%20=%201200,%20%20TIMEOUT_ERROR%20=%201201,%20%20PING_ERROR%20=%201202,%20%20//%20Operation%20errors%20%20OPERATION_ERROR%20=%201300,%20%20INVALID_OPERATION%20=%201301,%20%20OPERATION_TIMEOUT%20=%201302,%20%20//%20===%20Configuration%20Errors%20(2000-2999)%20===%20%20//%20Basic%20config%20errors%20%20CONFIGURATION_ERROR%20=%202000,%20%20CONFIG_NOT_FOUND%20=%202001,%20%20CONFIG_LOAD_ERROR%20=%202002,%20%20CONFIG_PARSE_ERROR%20=%202003,%20%20//%20Schema%20errors%20%20SCHEMA_ERROR%20=%202100,%20%20INVALID_SCHEMA%20=%202101,%20%20SCHEMA_NOT_FOUND%20=%202102,%20%20SCHEMA_VALIDATION_FAILED%20=%202103,%20%20//%20Environment%20errors%20%20ENV_ERROR%20=%202200,%20%20ENV_LOAD_ERROR%20=%202201,%20%20ENV_MISSING_ERROR%20=%202202,%20%20ENV_VALIDATION_ERROR%20=%202203,%20%20//%20===%20Service%20Lifecycle%20Errors%20(3000-3999)%20===%20%20//%20Service%20management%20%20SERVICE_ERROR%20=%203000,%20%20SERVICE_INITIALIZATION_ERROR%20=%203001,%20%20SERVICE_NOT_INITIALIZED%20=%203002,%20%20SERVICE_ALREADY_INITIALIZED%20=%203003,%20%20SERVICE_SHUTDOWN_ERROR%20=%203004,%20%20//%20Redis%20lifecycle%20%20REDIS_ERROR%20=%203100,%20%20REDIS_CONNECTION_ERROR%20=%203101,%20%20REDIS_OPERATION_ERROR%20=%203102,%20%20//%20Future%20service%20lifecycle%20(reserve%20ranges)%20%20POSTGRES_ERROR%20=%203200,%20%20QUESTDB_ERROR%20=%203300,%20%20MESSAGE_QUEUE_ERROR%20=%203400,%20%20//%20===%20CLI%20Errors%20(4000-4999)%20===%20%20CLI_ERROR%20=%204000,%20%20CLI_INVALID_ARGUMENT%20=%204001,%20%20CLI_MISSING_ARGUMENT%20=%204002,%20%20//%20===%20Service%20Configuration%20Errors%20(5000-5999)%20===%20%20//%20General%20service%20config%20%20SERVICE_CONFIG_ERROR%20=%205000,%20%20SERVICE_CONFIG_INVALID%20=%205001,%20%20SERVICE_CONFIG_MISSING%20=%205002,%20%20//%20Database%20config%20%20DB_CONFIG_ERROR%20=%205100,%20%20POSTGRES_CONFIG_INVALID%20=%205101,%20%20QUESTDB_CONFIG_INVALID%20=%205102,%20%20REDIS_CONFIG_INVALID%20=%205103,%20%20//%20Message%20queue%20config%20%20QUEUE_CONFIG_ERROR%20=%205200,%20%20REDPANDA_CONFIG_INVALID%20=%205201,%20%20//%20Monitoring%20config%20%20MONITORING_CONFIG_ERROR%20=%205300,%20%20GRAFANA_CONFIG_INVALID%20=%205301,%20%20PGADMIN_CONFIG_INVALID%20=%205302,%20%20//%20Network%20config%20%20NETWORK_CONFIG_ERROR%20=%205400,%20%20NETWORK_CONFIG_INVALID%20=%205401,%20%20//%20===%20Data/Cache%20Errors%20(6000-6999)%20===%20%20DATA_ERROR%20=%206000,%20%20CACHE_ERROR%20=%206001,%20%20CACHE_MISS%20=%206002,%20%20CACHE_INVALIDATION_ERROR%20=%206003,}```%20%202.%20`qi/core/src/errors/ApplicationError.ts`%20%20%20```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20*%20@module%20ApplicationError%20*%20*%20@description%20*%20This%20module%20defines%20the%20base%20`ApplicationError`%20class,%20which%20serves%20as%20the%20foundational%20*%20error%20type%20for%20all%20application-specific%20errors.%20It%20encapsulates%20common%20error%20properties%20*%20and%20provides%20a%20standardized%20method%20for%20handling%20errors,%20including%20logging%20and%20response%20*%20preparation.%20*%20*%20@created%202024-11-21%20*%20@modified%202024-11-22%20*%20*%20@note%20*%20This%20file%20is%20automatically%20processed%20by%20a%20pre-commit%20script%20to%20ensure%20*%20that%20file%20headers%20are%20up-to-date%20with%20the%20author&#39;s%20name%20and%20modification%20date.%20*/import%20{%20ErrorCode%20}%20from%20&quot;./ErrorCodes.js&quot;;import%20{%20logger%20}%20from%20&quot;@qi/core/logger&quot;;/**%20*%20Interface%20for%20error%20details%20providing%20additional%20context.%20*/export%20interface%20ErrorDetails%20{%20%20[key:%20string]:%20unknown;}/**%20*%20Base%20error%20class%20for%20all%20application-specific%20errors.%20*%20*%20@class%20*%20@extends%20Error%20*%20*%20@property%20{ErrorCode}%20code%20-%20The%20specific%20error%20code%20representing%20the%20error%20type.%20*%20@property%20{number}%20statusCode%20-%20HTTP%20status%20code%20associated%20with%20the%20error.%20*%20@property%20{ErrorDetails}%20[details]%20-%20Additional%20details%20providing%20context%20about%20the%20error.%20*%20*%20@example%20*%20```typescript%20*%20throw%20new%20ApplicationError(&quot;An%20unexpected%20error%20occurred.&quot;,%20ErrorCode.UNEXPECTED_ERROR,%20500,%20{%20debugInfo:%20&quot;Stack%20trace...&quot;%20});%20*%20```%20*/export%20class%20ApplicationError%20extends%20Error%20{%20%20constructor(%20%20%20%20message:%20string,%20%20%20%20public%20code:%20ErrorCode%20=%20ErrorCode.APPLICATION_ERROR,%20%20%20%20public%20statusCode:%20number%20=%20500,%20%20%20%20public%20details?:%20ErrorDetails%20%20)%20{%20%20%20%20super(message);%20%20%20%20this.name%20=%20&quot;ApplicationError&quot;;%20%20%20%20Error.captureStackTrace(this,%20this.constructor);%20%20}%20%20/**%20%20%20*%20Handles%20the%20error%20by%20logging%20it%20and%20preparing%20a%20standardized%20response.%20%20%20*%20%20%20*%20@returns%20{object}%20Standardized%20error%20response%20containing%20status%20and%20error%20details.%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20try%20{%20%20%20*%20%20%20//%20Some%20operation%20that%20may%20throw%20an%20error%20%20%20*%20}%20catch%20(error)%20{%20%20%20*%20%20%20if%20(error%20instanceof%20ApplicationError)%20{%20%20%20*%20%20%20%20%20const%20response%20=%20error.handle();%20%20%20*%20%20%20%20%20//%20Send%20response%20to%20client%20%20%20*%20%20%20%20%20res.status(response.status).json(response.error);%20%20%20*%20%20%20}%20%20%20*%20}%20%20%20*%20```%20%20%20*/%20%20handle()%20{%20%20%20%20//%20Log%20the%20error%20details%20%20%20%20logger.error(`"/>{this.name} [<img src="https://latex.codecogs.com/gif.latex?{this.code}]:"/>{this.message}`, {
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
  
3. `qi/core/src/errors/index.ts`
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
  
#### ApplicationError Overview
  
The `ApplicationError` class is the cornerstone of the application's error handling mechanism. It provides a consistent and structured way to handle errors across the entire codebase, ensuring that all errors are managed uniformly and contain necessary contextual information.
  
#### Key Features
  
1. **Centralized Error Codes:**
  
   - Utilizes the `ErrorCode` enumeration to assign standardized codes to errors, promoting consistency and ease of identification.
  
2. **Structured Error Details:**
  
   - Incorporates an `ErrorDetails` interface to attach additional context to errors, facilitating easier debugging and more informative responses.
  
3. **Standardized Handling Mechanism:**
  
   - Implements a `handle` method that logs error details and prepares a consistent response format, suitable for APIs or other interfaces.
  
4. **Integration with Logging System:**
   - Leverages a centralized `logger` to record error information, including messages, codes, details, and stack traces.
  
#### Components
  
1. **ErrorCode Enumeration (`ErrorCodes.ts`):**
  
   - Defines a comprehensive set of error codes used throughout the application.
   - Ensures that each error type is uniquely identifiable and standardized.
  
   ```typescript
   // src/errors/ErrorCodes.ts
  
   export enum ErrorCode {
     APPLICATION_ERROR = "APPLICATION_ERROR",
     INVALID_INPUT = "INVALID_INPUT",
     AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
     // Add other error codes as needed
   }
   ```
  
2. **ErrorDetails Interface:**
  
   - Provides a flexible structure to include any additional information related to an error.
   - Allows for the inclusion of nested objects, arrays, or primitive values to convey detailed context.
  
3. **ApplicationError Class:**
   - Serves as the base class for all application-specific errors.
   - Encapsulates common properties such as `message`, `code`, `statusCode`, and `details`.
   - Offers a `handle` method to process the error uniformly across different parts of the application.
  
#### Usage Guidelines
  
1. **Creating Custom Errors:**
  
   - Extend the `ApplicationError` class to create specific error types tailored to different scenarios.
   - Assign appropriate `ErrorCode` values to each custom error to maintain clarity and consistency.
  
   ````typescript
   // src/errors/CustomErrors.ts
  
   import { ApplicationError, ErrorDetails } from "./ApplicationError";
   import { ErrorCode } from "./ErrorCodes";
  
   /**
    * Error thrown when user authentication fails.
    */
   export class AuthenticationError extends ApplicationError {
     constructor(message: string, details?: ErrorDetails) {
       super(message, ErrorCode.AUTHENTICATION_FAILED, 401, details);
       this.name = "AuthenticationError";
     }
  
     /**
      * Factory method to create a new AuthenticationError instance.
      *
      * @param {string} message - Error message.
      * @param {ErrorDetails} [details] - Additional error details.
      * @returns {AuthenticationError} New instance of AuthenticationError.
      *
      * @example
      * ```typescript
      * throw AuthenticationError.create("Invalid credentials provided.", { username: "john_doe" });
      * ```
      */
     static create(
       message: string,
       details?: ErrorDetails
     ): AuthenticationError {
       return new AuthenticationError(message, details);
     }
   }
   ````
  
2. **Throwing Errors:**
  
   - Instantiate and throw errors using either the constructor or factory methods provided by custom error classes.
  
   ```typescript
   // src/controllers/UserController.ts
  
   import { AuthenticationError } from "../errors/CustomErrors";
  
   export async function loginUser(req, res) {
     const { username, password } = req.body;
  
     const user = await findUserByUsername(username);
     if (!user || !validatePassword(user, password)) {
       throw AuthenticationError.create("Invalid username or password.", {
         username,
       });
     }
  
     // Proceed with generating token or session
   }
   ```
  
3. **Catching and Handling Errors:**
  
   - Use try-catch blocks to intercept errors and utilize the `handle` method for logging and response preparation.
  
   ```typescript
   // src/middleware/errorHandler.ts
  
   import { ApplicationError } from "../errors/ApplicationError";
  
   export function errorHandler(err, req, res, next) {
     if (err instanceof ApplicationError) {
       const response = err.handle();
       return res.status(response.status).json(response.error);
     }
  
     // Handle non-ApplicationError instances
     console.error("Unhandled error:", err);
     res
       .status(500)
       .json({
         code: "INTERNAL_SERVER_ERROR",
         message: "An unexpected error occurred.",
       });
   }
   ```
  
#### Best Practices
  
- **Consistent Error Codes:**
  
  - Always use predefined `ErrorCode` values when throwing errors to maintain consistency and facilitate easier error tracking.
  
- **Comprehensive Error Details:**
  
  - Provide as much contextual information as possible within the `details` property to aid in debugging and user feedback.
  
- **Avoid Sensitive Information:**
  
  - Ensure that sensitive data is not exposed in error messages or details, especially in production environments.
  
- **Utilize Factory Methods:**
  
  - Prefer using factory methods for creating error instances, as they encapsulate the instantiation logic and enforce consistent usage patterns.
  
- **Centralized Error Handling:**
  - Implement a centralized error handling middleware or mechanism to uniformly process and respond to errors across the application.
  
#### Extending the Error Handling System
  
To extend the error handling system with new error types:
  
1. **Define a New ErrorCode:**
  
   - Add a new entry to the `ErrorCode` enumeration in `ErrorCodes.ts`.
  
   ```typescript
   export enum ErrorCode {
     // Existing codes...
     RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
     // Add new codes here
   }
   ```
  
2. **Create a Custom Error Class:**
  
   - Extend `ApplicationError` to create a new error class corresponding to the new error code.
  
   ````typescript
   // src/errors/ResourceErrors.ts
  
   import { ApplicationError, ErrorDetails } from "./ApplicationError";
   import { ErrorCode } from "./ErrorCodes";
  
   /**
    * Error thrown when a requested resource is not found.
    */
   export class ResourceNotFoundError extends ApplicationError {
     constructor(message: string, details?: ErrorDetails) {
       super(message, ErrorCode.RESOURCE_NOT_FOUND, 404, details);
       this.name = "ResourceNotFoundError";
     }
  
     /**
      * Factory method to create a new ResourceNotFoundError instance.
      *
      * @param {string} message - Error message.
      * @param {ErrorDetails} [details] - Additional error details.
      * @returns {ResourceNotFoundError} New instance of ResourceNotFoundError.
      *
      * @example
      * ```typescript
      * throw ResourceNotFoundError.create("User not found.", { userId: 123 });
      * ```
      */
     static create(
       message: string,
       details?: ErrorDetails
     ): ResourceNotFoundError {
       return new ResourceNotFoundError(message, details);
     }
   }
   ````
  
3. **Utilize the New Error:**
  
   - Throw the new error in appropriate places within the application.
  
   ```typescript
   // src/services/UserService.ts
  
   import { ResourceNotFoundError } from "../errors/ResourceErrors";
  
   export async function getUserById(userId: number) {
     const user = await database.findUserById(userId);
     if (!user) {
       throw ResourceNotFoundError.create("User not found.", { userId });
     }
     return user;
   }
   ```
  
#### **Summary**
  
The `ApplicationError` class, in conjunction with the `ErrorCode` enumeration and specialized error classes, establishes a robust error handling framework within the application. By adhering to the outlined practices and extending the system as needed, developers can ensure consistent, informative, and manageable error management throughout the project.
  
---
  
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
 * @modified 2024-11-28
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
    result[key.trim()] = value.replace(/^["']|["']<img src="https://latex.codecogs.com/gif.latex?/g,%20&quot;&quot;);%20%20});%20%20return%20result;}/**%20*%20Loads%20and%20parses%20environment%20variables%20from%20a%20file.%20*%20Supports%20optional%20overriding%20of%20existing%20variables.%20*%20*%20@param%20envFile%20-%20Path%20to%20environment%20file%20*%20@param%20options%20-%20Configuration%20options%20*%20%20%20%20%20%20%20%20-%20override:%20Whether%20to%20override%20existing%20variables%20*%20@returns%20Parsed%20environment%20variables%20or%20null%20if%20file%20doesn&#39;t%20exist%20*%20*%20@example%20*%20```typescript%20*%20//%20Load%20without%20overriding%20existing%20vars%20*%20const%20vars%20=%20await%20loadEnv(&#39;.env&#39;);%20*%20*%20//%20Load%20and%20override%20existing%20vars%20*%20const%20vars%20=%20await%20loadEnv(&#39;.env.local&#39;,%20{%20override:%20true%20});%20*%20```%20*/export%20async%20function%20loadEnv(%20%20envFile:%20string,%20%20options:%20{%20override?:%20boolean%20}%20=%20{}):%20Promise&lt;Record&lt;string,%20string&gt;%20|%20null&gt;%20{%20%20const%20data%20=%20await%20orIfFileNotExist(fs.readFile(envFile,%20&quot;utf8&quot;),%20null);%20%20if%20(data%20===%20null)%20return%20null;%20%20const%20parsed%20=%20parseEnvFile(data);%20%20if%20(options.override)%20{%20%20%20%20Object.entries(parsed).forEach(([key,%20value])%20=&gt;%20{%20%20%20%20%20%20process.env[key]%20=%20value;%20%20%20%20});%20%20}%20else%20{%20%20%20%20Object.entries(parsed).forEach(([key,%20value])%20=&gt;%20{%20%20%20%20%20%20if%20(!Object.prototype.hasOwnProperty.call(process.env,%20key))%20{%20%20%20%20%20%20%20%20process.env[key]%20=%20value;%20%20%20%20%20%20}%20%20%20%20});%20%20}%20%20return%20parsed;}/**%20*%20Creates%20a%20SHA-256%20hash%20of%20the%20input%20string.%20*%20*%20@param%20input%20-%20String%20to%20hash%20*%20@returns%20Hexadecimal%20hash%20string%20*%20*%20@example%20*%20```typescript%20*%20const%20hashedPassword%20=%20hash(&#39;user-password&#39;);%20*%20```%20*/export%20function%20hash(input:%20string):%20string%20{%20%20return%20createHash(&quot;sha256&quot;).update(input).digest(&quot;hex&quot;);}/**%20*%20Formats%20byte%20sizes%20into%20human-readable%20strings.%20*%20*%20@param%20byteCount%20-%20Number%20of%20bytes%20*%20@param%20decimals%20-%20Number%20of%20decimal%20places%20(default:%202)%20*%20@returns%20Formatted%20string%20with%20units%20(e.g.,%20&quot;1.5%20MB&quot;)%20*%20*%20@example%20*%20```typescript%20*%20console.log(formatBytes(1536));%20//%20&quot;1.5%20KB&quot;%20*%20console.log(formatBytes(1048576,%201));%20//%20&quot;1.0%20MB&quot;%20*%20```%20*/export%20function%20formatBytes(byteCount:%20number,%20decimals%20=%202):%20string%20{%20%20return%20bytes.format(byteCount,%20{%20%20%20%20unitSeparator:%20&quot;%20&quot;,%20%20%20%20decimalPlaces:%20decimals,%20%20});}/**%20*%20Truncates%20a%20string%20to%20specified%20length,%20adding%20ellipsis%20if%20needed.%20*%20*%20@param%20str%20-%20String%20to%20truncate%20*%20@param%20length%20-%20Maximum%20length%20*%20@returns%20Truncated%20string%20with%20ellipsis%20if%20needed%20*%20*%20@example%20*%20```typescript%20*%20console.log(truncate(&quot;Long%20text%20here&quot;,%208));%20//%20&quot;Long%20...&quot;%20*%20```%20*/export%20function%20truncate(str:%20string,%20length:%20number):%20string%20{%20%20return%20str.length%20&gt;%20length%20?%20str.slice(0,%20length)%20+%20&quot;...&quot;%20:%20str;}/**%20*%20Retries%20an%20asynchronous%20operation%20with%20exponential%20backoff.%20*%20*%20@param%20fn%20-%20Async%20function%20to%20retry%20*%20@param%20options%20-%20Retry%20configuration%20*%20%20%20%20%20%20%20%20-%20retries:%20Maximum%20number%20of%20attempts%20*%20%20%20%20%20%20%20%20-%20minTimeout:%20Initial%20timeout%20in%20milliseconds%20*%20@returns%20Promise%20resolving%20to%20function%20result%20*%20*%20@example%20*%20```typescript%20*%20const%20data%20=%20await%20retryOperation(%20*%20%20%20()%20=&gt;%20fetchData(),%20*%20%20%20{%20retries:%203,%20minTimeout:%201000%20}%20*%20);%20*%20```%20*/export%20async%20function%20retryOperation&lt;T&gt;(%20%20fn:%20()%20=&gt;%20Promise&lt;T&gt;,%20%20options:%20{%20%20%20%20retries:%20number;%20%20%20%20minTimeout:%20number;%20%20%20%20onRetry?:%20(times:%20number)%20=&gt;%20void;%20%20}%20=%20{%20retries:%203,%20minTimeout:%201000%20}):%20Promise&lt;T&gt;%20{%20%20const%20operation%20=%20retry.operation({%20%20%20%20...options,%20%20%20%20randomize:%20false,%20%20});%20%20return%20new%20Promise((resolve,%20reject)%20=&gt;%20{%20%20%20%20operation.attempt(async%20()%20=&gt;%20{%20%20%20%20%20%20try%20{%20%20%20%20%20%20%20%20const%20result%20=%20await%20fn();%20%20%20%20%20%20%20%20resolve(result);%20%20%20%20%20%20}%20catch%20(err)%20{%20%20%20%20%20%20%20%20if%20(!operation.retry(err%20as%20Error))%20{%20%20%20%20%20%20%20%20%20%20reject(operation.mainError());%20%20%20%20%20%20%20%20}%20else%20if%20(options.onRetry)%20{%20%20%20%20%20%20%20%20%20%20options.onRetry(operation.attempts());%20%20%20%20%20%20%20%20}%20%20%20%20%20%20}%20%20%20%20});%20%20});}/**%20*%20Formats%20a%20JSON%20object%20with%20color-coded%20syntax%20highlighting.%20*%20Color%20scheme:%20*%20-%20Blue:%20Property%20keys%20*%20-%20Green:%20String%20values%20*%20-%20Yellow:%20Numbers,%20booleans,%20null%20*%20-%20White:%20Structural%20characters%20*%20*%20@param%20obj%20-%20Object%20to%20format%20*%20@returns%20Color-formatted%20JSON%20string%20*%20*%20@example%20*%20```typescript%20*%20console.log(formatJsonWithColor({%20*%20%20%20name:%20&quot;test&quot;,%20*%20%20%20count:%2042,%20*%20%20%20active:%20true%20*%20}));%20*%20```%20*/export%20const%20formatJsonWithColor%20=%20(obj:%20unknown):%20string%20=&gt;%20{%20%20const%20colorizeValue%20=%20(value:%20unknown):%20string%20=&gt;%20{%20%20%20%20if%20(typeof%20value%20===%20&quot;string&quot;)%20{%20%20%20%20%20%20return%20chalk.green(`&quot;"/>{value}"`);
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
        .map((item) => `<img src="https://latex.codecogs.com/gif.latex?{spaces}"/>{formatWithIndent(item, indent + 1)}`)
        .join(",\n");
      return `[\n<img src="https://latex.codecogs.com/gif.latex?{items}\n"/>{spaces}]`;
    }
  
    if (data && typeof data === "object" && data !== null) {
      if (Object.keys(data).length === 0) return "{}";
      const entries = Object.entries(data)
        .map(([key, value]) => {
          const coloredKey = chalk.blue(`"<img src="https://latex.codecogs.com/gif.latex?{key}&quot;`);%20%20%20%20%20%20%20%20%20%20const%20formattedValue%20=%20formatWithIndent(value,%20indent%20+%201);%20%20%20%20%20%20%20%20%20%20return%20`"/>{spaces}  <img src="https://latex.codecogs.com/gif.latex?{coloredKey}:"/>{formattedValue}`;
        })
        .join(",\n");
      return `{\n<img src="https://latex.codecogs.com/gif.latex?{entries}\n"/>{spaces}}`;
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
} from "@qi/core/utils";
import { promises as fs } from "fs";
  
async function initializeApp() {
  // Environment Handling
  const envContent = await orIfFileNotExist(fs.readFile(".env", "utf-8"), "");
  const envVars = parseEnvFile(envContent);
  console.log(envVars);
  
  // Cryptographic Hashing
  const passwordHash = generateHash("my_secure_password");
  console.log(`Password Hash: ${passwordHash}`);
  
  // Data Formatting
  const formattedBytes = formatBytes(2048);
  console.log(`Formatted Bytes: ${formattedBytes}`);
  
  const longString =
    "This is an exceptionally long string that needs to be truncated.";
  const shortString = truncate(longString, 30);
  console.log(`Truncated String: ${shortString}`);
  
  // Logging Enhancements
  coloredLog("info", "Application initialized successfully.");
  coloredLog("warn", "Low disk space detected.");
  coloredLog("error", "Failed to connect to the database.");
  
  // Retry Mechanism
  try {
    const data = await retryAsync(() => fetchDataFromAPI(), {
      retries: 3,
      minTimeout: 1000,
    });
    console.log("Data fetched:", data);
  } catch (error) {
    console.error("Failed to fetch data after retries:", error);
  }
  
  // Lodash Utilities
  const debouncedFunction = debounce(() => {
    console.log("Debounced Function Executed");
  }, 300);
  
  debouncedFunction();
  
  const throttledFunction = throttle(() => {
    console.log("Throttled Function Executed");
  }, 1000);
  
  throttledFunction();
  
  const mergedObject = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
  console.log("Merged Object:", mergedObject);
  
  const plain = isPlainObject(mergedObject);
  console.log("Is Plain Object:", plain);
  
  const uniqueArray = uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], "id");
  console.log("Unique Array:", uniqueArray);
}
  
initializeApp();
  
/**
 * Mock function to simulate fetching data from an API.
 * Replace this with actual API call logic.
 */
async function fetchDataFromAPI(): Promise<any> {
  // Simulate a network request with a possibility of failure
  if (Math.random() < 0.7) {
    throw new Error("Network Error");
  }
  return { data: "Sample Data" };
}
```
  
#### Example Breakdown
  
1. **Environment Handling:**
  
   - **Reading Environment Variables:**
     ```typescript
     const envContent = await orIfFileNotExist(
       fs.readFile(".env", "utf-8"),
       ""
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
     const passwordHash = generateHash("my_secure_password");
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
     const longString =
       "This is an exceptionally long string that needs to be truncated.";
     const shortString = truncate(longString, 30);
     console.log(`Truncated String: ${shortString}`);
     ```
     - Shortens a long string to `30` characters, appending an ellipsis.
  
4. **Logging Enhancements:**
  
   - **Colored Logging:**
     ```typescript
     coloredLog("info", "Application initialized successfully.");
     coloredLog("warn", "Low disk space detected.");
     coloredLog("error", "Failed to connect to the database.");
     ```
     - Logs messages with colors based on severity (`info` in blue, `warn` in yellow, `error` in red).
  
5. **Retry Mechanism:**
  
   - **Retrying an Operation:**
     ```typescript
     try {
       const data = await retryAsync(() => fetchDataFromAPI(), {
         retries: 3,
         minTimeout: 1000,
       });
       console.log("Data fetched:", data);
     } catch (error) {
       console.error("Failed to fetch data after retries:", error);
     }
     ```
     - Attempts to fetch data from an API.
     - Retries up to `3` times with a minimum timeout of `1` second between attempts.
  
6. **Lodash Utilities:**
  
   - **Debounce and Throttle:**
  
     ```typescript
     const debouncedFunction = debounce(() => {
       console.log("Debounced Function Executed");
     }, 300);
  
     debouncedFunction();
  
     const throttledFunction = throttle(() => {
       console.log("Throttled Function Executed");
     }, 1000);
  
     throttledFunction();
     ```
  
     - Debounces and throttles functions to control their execution frequency.
  
   - **Deep Merge:**
  
     ```typescript
     const mergedObject = deepMerge({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
     console.log("Merged Object:", mergedObject);
     ```
  
     - Deeply merges two objects.
  
   - **Type Checking:**
  
     ```typescript
     const plain = isPlainObject(mergedObject);
     console.log("Is Plain Object:", plain);
     ```
  
     - Checks if `mergedObject` is a plain JavaScript object.
  
   - **Unique By Property:**
     ```typescript
     const uniqueArray = uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], "id");
     console.log("Unique Array:", uniqueArray);
     ```
     - Removes duplicate objects from an array based on the `id` property.
  
#### **Summary**
  
The `@qi/core/utils` module is a comprehensive collection of utility functions designed to streamline common tasks within the application. By providing robust environment handling, secure cryptographic operations, flexible data formatting, reliable retry mechanisms, and convenient Lodash re-exports (the re-export mechanism can be thought of adaptor pattern), this module enhances both the development experience and the application's reliability.
  
Implementing these utilities can significantly reduce boilerplate code, improve error handling, and ensure consistent data processing across different parts of the application.
  
If one requires further customization or additional utilities, consider extending this module to fit the specific project needs.
  