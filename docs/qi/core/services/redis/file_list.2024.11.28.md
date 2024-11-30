## The `qi/core/src/services/redis` module
  
### The `qi/core/src/services/redis`
  
1. `qi/core/src/services/redis/errors.ts`:
```ts
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
 * @modified 2024-11-22
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
      `Schema validation failed for "<img src="https://latex.codecogs.com/gif.latex?{schemaId}&quot;:"/>{errors[0]?.message || "Unknown validation error"}`,
      ErrorCode.SCHEMA_VALIDATION_FAILED,
      {
        schemaId,
        validationErrors: errors,
      }
    );
  }
}
  
```  
  
2. `qi/core/src/services/redis/factory.ts`:
```ts
/**
 * @fileoverview Redis Client Factory Implementation
 * @module @qi/core/services/redis/factory
 * @description Implements Redis client creation with configuration validation,
 * connection management, and pool setup. Provides factory methods for creating
 * properly configured Redis clients with error handling.
 *
 * @see {@link RedisAppService} for service interface
 * @see {@link RedisConfig} for configuration options
 *
 * @author Zhifeng Zhang
 * @created 2024-11-26
 * @modified 2024-11-28
 */
  
import { Redis, RedisOptions } from "ioredis";
import { Schema } from "@qi/core/config";
import { RedisBaseClient } from "./base/client.js";
import { RedisAppClient } from "./app/client.js";
import { RedisConfig } from "./config/types.js";
import { redisConfigSchema } from "./config/schema.js";
import { RedisError } from "./errors.js";
import type { RedisFactoryOptions } from "./index.js";
import {
  DEFAULT_POOL_NAME,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_DELAY,
  DEFAULT_COMMAND_TIMEOUT,
} from "./index.js";
import { retryOperation } from "@qi/core/utils";
import { logger as defaultLogger } from "@qi/core/logger";
  
/**
 * Validates Redis configuration against schema
 *
 * @private
 * @param {RedisConfig} config - Configuration to validate
 * @throws {RedisError} If validation fails
 */
const validateConfig = (config: RedisConfig): void => {
  try {
    const schema = new Schema({ formats: true });
    schema.registerSchema("redis-config", redisConfigSchema);
    schema.validate(config, "redis-config");
  } catch (error) {
    throw RedisError.configurationError("Invalid Redis configuration", {
      error: error instanceof Error ? error.message : String(error),
      schemaId: "redis-config",
    });
  }
};
  
/**
 * Creates Redis client options from configuration and factory options
 *
 * @private
 * @param {RedisConfig} config - Redis configuration
 * @param {RedisFactoryOptions} options - Factory options
 * @returns {RedisOptions} IoRedis client options
 * @throws {RedisError} If pool configuration is invalid or missing
 */
const createClientOptions = (
  config: RedisConfig,
  options: RedisFactoryOptions
): RedisOptions => {
  const poolName = options.poolName || DEFAULT_POOL_NAME;
  const poolConfig = config.pools?.[poolName];
  
  if (!poolConfig) {
    throw RedisError.configurationError(
      `Pool configuration not found: ${poolName}`,
      {
        poolName,
        operation: "createClientOptions",
      }
    );
  }
  
  return {
    // Connection
    host: options.host || "localhost",
    port: options.port || 6379,
    connectTimeout: options.connectTimeout || DEFAULT_COMMAND_TIMEOUT,
    password: options.password,
    db: options.db || 0,
  
    // Retry settings
    maxRetriesPerRequest: config.retry?.maxAttempts || DEFAULT_RETRY_ATTEMPTS,
    retryStrategy: (times: number) => {
      const delay =
        (config.retry?.initialDelayMs || DEFAULT_RETRY_DELAY) *
        Math.pow(2, times - 1);
      return Math.min(delay, config.retry?.maxDelayMs || Infinity);
    },
  
    // Features
    enableOfflineQueue: options.enableOfflineQueue ?? true,
    keyPrefix: config.features?.keyPrefix || "",
    commandTimeout: config.features?.commandTimeout || DEFAULT_COMMAND_TIMEOUT,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,
  
    // Connection management
    keepAlive: config.features?.keepAlive || 0,
    connectionName: `${poolName}-pool`,
  };
};
  
/**
 * Creates and initializes a new Redis client instance with retry
 *
 * @private
 * @param {RedisConfig} config - Redis configuration
 * @param {RedisFactoryOptions} options - Factory options
 * @returns {Promise<Redis>} Connected Redis client
 * @throws {RedisError} If connection fails after retries
 */
const createRedisConnection = async (
  config: RedisConfig,
  options: RedisFactoryOptions
): Promise<Redis> => {
  const clientOptions = createClientOptions(config, options);
  const logger = options.logger || defaultLogger;
  
  return await retryOperation(
    async () => {
      const client = new Redis(clientOptions);
      await client.ping(); // Verify connection
      return client;
    },
    {
      retries: config.retry?.maxAttempts || DEFAULT_RETRY_ATTEMPTS,
      minTimeout: config.retry?.initialDelayMs || DEFAULT_RETRY_DELAY,
      onRetry: (times: number) => {
        logger.warn("Retrying Redis connection", {
          attempt: times,
          host: clientOptions.host,
          port: clientOptions.port,
        });
      },
    }
  ).catch((error) => {
    throw RedisError.connectionError("Failed to establish Redis connection", {
      operation: "createConnection",
      error: error instanceof Error ? error.message : String(error),
      host: clientOptions.host,
      port: clientOptions.port,
    });
  });
};
  
/**
 * Creates and initializes a new Redis client instance
 *
 * @param {RedisConfig} config - Redis configuration
 * @param {RedisFactoryOptions} [options={}] - Factory options
 * @returns {Promise<RedisAppClient>} Configured Redis client
 * @throws {RedisError} If creation or connection fails
 */
export const createClient = async (
  config: RedisConfig,
  options: RedisFactoryOptions = {}
): Promise<RedisAppClient> => {
  const logger = options.logger || defaultLogger;
  
  try {
    // Validate configuration
    validateConfig(config);
  
    // Create Redis client with retry
    const redisClient = await createRedisConnection(config, options);
  
    // Create base client
    const baseClient = new RedisBaseClient(redisClient, logger);
  
    // Create and return app client
    return new RedisAppClient(
      baseClient,
      config,
      options.poolName || DEFAULT_POOL_NAME
    );
  } catch (error) {
    // If it's already a RedisError, rethrow it
    if (error instanceof RedisError) {
      throw error;
    }
  
    // Otherwise wrap it in a RedisError
    throw RedisError.clientError("Failed to create Redis client", {
      operation: "createClient",
      error: error instanceof Error ? error.message : String(error),
      poolName: options.poolName || DEFAULT_POOL_NAME,
    });
  }
};
  
// Export the factory function
export const createRedisClient = createClient;
  
```  
  
3. `qi/core/src/services/redis/index.ts`:
```ts
/**
 * @fileoverview Redis Service Module Entry Point
 * @module @qi/core/services/redis
 *
 * @description
 * Exports Redis service components including clients, configuration,
 * error handling, and types. This is the main entry point for the Redis module.
 * Provides a comprehensive Redis client implementation with configuration management,
 * connection pooling, and error handling.
 *
 * Key features:
 * - Type-safe Redis client implementation
 * - Configuration management with validation
 * - Connection pooling and lifecycle management
 * - Structured error handling
 * - Event monitoring and health checks
 * - Automatic retry handling
 *
 * @example Basic Usage
 * ```typescript
 * import { createRedisClient } from '@qi/core/services/redis';
 *
 * const client = await createRedisClient({
 *   pools: {
 *     default: { min: 1, max: 10 }
 *   },
 *   features: {
 *     keyPrefix: "app:",
 *     enableAutoPipelining: true
 *   }
 * });
 *
 * // Use the client
 * await client.ping();
 * const value = await client.get("key");
 * await client.close();
 * ```
 *
 * @example Custom Pool Configuration
 * ```typescript
 * const client = await createRedisClient({
 *   pools: {
 *     custom: {
 *       min: 5,
 *       max: 20,
 *       acquireTimeoutMillis: 30000
 *     }
 *   }
 * }, {
 *   poolName: "custom",
 *   logger: customLogger,
 *   connectTimeout: 5000
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-26
 * @modified 2024-11-28
 */
  
import type { Logger } from "winston";
import { RedisPoolConfig } from "./config/types.js";
import { createClient } from "./factory.js";
  
// Base client exports
export { RedisBaseClient } from "./base/client.js";
export type { RedisBaseService, RedisServiceEvents } from "./base/types.js";
  
// Application client exports
export { RedisAppClient } from "./app/client.js";
export type { RedisAppService } from "./app/types.js";
  
// Configuration exports
export type {
  RedisConfig,
  RedisPoolConfig,
  RedisRetryStrategy,
} from "./config/types.js";
export { redisConfigSchema } from "./config/schema.js";
  
// Error handling exports
export { RedisError } from "./errors.js";
export type { RedisErrorDetails, SchemaValidationError } from "./errors.js";
  
/**
 * Options for Redis client creation
 *
 * @interface RedisFactoryOptions
 * @property {string} [host="localhost"] - Redis server host
 * @property {number} [port=6379] - Redis server port
 * @property {string} [poolName="default"] - Name of the connection pool to use
 * @property {Logger} [logger] - Custom logger instance
 * @property {number} [connectTimeout] - Connection timeout in milliseconds
 * @property {boolean} [enableOfflineQueue=true] - Whether to queue commands when connection is lost
 * @property {string} [password] - Redis authentication password
 * @property {number} [db=0] - Redis database number
 */
export interface RedisFactoryOptions {
  host?: string;
  port?: number;
  poolName?: string;
  logger?: Logger;
  connectTimeout?: number;
  enableOfflineQueue?: boolean;
  password?: string;
  db?: number;
}
  
/**
 * Creates a new Redis client with the specified configuration and options.
 *
 * @async
 * @function createRedisClient
 * @param {RedisConfig} config - Redis configuration including pools, retry strategy, and features
 * @param {RedisFactoryOptions} [options] - Additional factory options
 * @returns {Promise<RedisAppService>} Configured Redis client instance
 *
 * @throws {RedisError}
 *  - ConfigurationError: If config validation fails
 *  - ConnectionError: If initial connection fails
 *  - TimeoutError: If connection times out
 */
export const createRedisClient = createClient;
  
/**
 * Default configuration values
 */
export const DEFAULT_POOL_NAME = "default";
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAY = 1000;
export const DEFAULT_COMMAND_TIMEOUT = 5000;
  
/**
 * Default pool configuration
 * Used when no specific pool configuration is provided
 */
export const DEFAULT_POOL_CONFIG: RedisPoolConfig = {
  min: 1,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 5000,
  idleTimeoutMillis: 60000,
};
  
```  
  
### The `qi/core/src/services/redis/config`
  
1. `qi/core/src/services/redis/config/types.ts`:
```ts
/**
 * @fileoverview Core Redis client configuration types
 * @module @qi/core/services/redis/config/types
 * @description Defines configuration interfaces for Redis client behavior, connection pools,
 * retry strategies, and monitoring features. Focuses on application-level settings rather
 * than connection details.
 *
 * @see {@link JsonSchema} for config validation
 * @see {@link RedisBaseService} for service implementation
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */
  
import { BaseConfig } from "@qi/core/config";
  
/**
 * Redis connection pool configuration
 *
 * @property {number} [min] - Minimum pool size (connections)
 * @property {number} [max] - Maximum pool size (connections)
 * @property {number} [acquireTimeoutMillis] - Max time to wait for connection acquisition
 * @property {number} [createTimeoutMillis] - Max time to wait for connection creation
 * @property {number} [idleTimeoutMillis] - Time before idle connection is destroyed
 * @property {number} [evictionRunIntervalMillis] - Interval to check for idle connections
 * @property {number} [softIdleTimeoutMillis] - Soft timeout for idle connections
 */
export interface RedisPoolConfig {
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  evictionRunIntervalMillis?: number;
  softIdleTimeoutMillis?: number;
}
  
/**
 * Retry behavior configuration for failed operations
 *
 * @property {number} [maxAttempts] - Maximum retry attempts before failing
 * @property {number} [initialDelayMs] - Initial delay between retries
 * @property {number} [maxDelayMs] - Maximum delay between retries
 * @property {number} [factorMultiplier] - Exponential backoff multiplier
 */
export interface RedisRetryStrategy {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factorMultiplier?: number;
}
  
/**
 * Complete Redis application configuration
 * Extends BaseConfig with Redis-specific settings
 *
 * @extends {BaseConfig}
 *
 * @property {Record<string, RedisPoolConfig>} [pools] - Named connection pools
 * @property {RedisRetryStrategy} [retry] - Retry behavior settings
 * @property {object} [features] - Feature flags and settings
 * @property {object} [monitoring] - Monitoring configuration
 */
export interface RedisConfig extends BaseConfig {
  pools?: Record<string, RedisPoolConfig>;
  retry?: RedisRetryStrategy;
  features?: {
    enableAutoPipelining?: boolean;
    enableOfflineQueue?: boolean;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
    keyPrefix?: string;
    commandTimeout?: number;
    keepAlive?: number;
  };
  monitoring?: {
    enableMetrics?: boolean;
    metricsInterval?: number;
    enableHealthCheck?: boolean;
    healthCheckInterval?: number;
  };
}
  
```  
  
2. `qi/core/src/services/redis/config/schema.ts`:
```ts
/**
 * @fileoverview Redis Service Application Configuration Schema
 * @module @qi/core/services/redis/config/schema
 * @description Defines JSON Schema for Redis application configuration validation.
 * Uses AJV for validation with proper schema identification and referencing.
 *
 * @see {@link RedisConfig} for TypeScript interface
 * @see {@link JsonSchema} for schema type definition
 */
  
import { JsonSchema } from "@qi/core/config";
  
/**
 * Schema for Redis connection pool configuration
 * @type {JsonSchema}
 */
export const poolConfigSchema: JsonSchema = {
  $id: "qi://core/services/redis/pool.schema",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    min: {
      type: "integer",
      minimum: 0,
      default: 1,
      description: "Minimum number of connections to maintain",
    },
    max: {
      type: "integer",
      minimum: 1,
      default: 10,
      description: "Maximum number of connections allowed",
    },
    acquireTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 30000,
      description: "Maximum time to wait for connection acquisition",
    },
    createTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 5000,
      description: "Maximum time to wait for connection creation",
    },
    idleTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 60000,
      description: "Time before idle connection is destroyed",
    },
    evictionRunIntervalMillis: {
      type: "integer",
      minimum: 0,
      default: 30000,
      description: "Interval to check for idle connections",
    },
    softIdleTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 30000,
      description: "Soft timeout for idle connections",
    },
  },
  additionalProperties: false,
  required: ["min", "max"],
};
  
/**
 * Schema for Redis retry strategy configuration
 * @type {JsonSchema}
 */
export const retryStrategySchema: JsonSchema = {
  $id: "qi://core/services/redis/retry.schema",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    maxAttempts: {
      type: "integer",
      minimum: 1,
      default: 3,
      description: "Maximum number of retry attempts",
    },
    initialDelayMs: {
      type: "integer",
      minimum: 0,
      default: 1000,
      description: "Initial delay between retries",
    },
    maxDelayMs: {
      type: "integer",
      minimum: 0,
      default: 5000,
      description: "Maximum delay between retries",
    },
    factorMultiplier: {
      type: "number",
      minimum: 1,
      default: 2,
      description: "Exponential backoff multiplier",
    },
  },
  additionalProperties: false,
  required: ["maxAttempts", "initialDelayMs"],
};
  
/**
 * Complete Redis application configuration schema
 * @type {JsonSchema}
 */
export const redisConfigSchema: JsonSchema = {
  $id: "qi://core/services/redis/config.schema",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    pools: {
      type: "object",
      properties: {
        default: { $ref: "qi://core/services/redis/pool.schema" },
      },
      additionalProperties: { $ref: "qi://core/services/redis/pool.schema" },
      description: "Named connection pool configurations",
      required: ["default"],
    },
    retry: { $ref: "qi://core/services/redis/retry.schema" },
    features: {
      type: "object",
      properties: {
        enableAutoPipelining: {
          type: "boolean",
          default: true,
          description: "Enable automatic command pipelining",
        },
        enableOfflineQueue: {
          type: "boolean",
          default: true,
          description: "Queue commands when connection lost",
        },
        enableReadyCheck: {
          type: "boolean",
          default: true,
          description: "Check if Redis is ready before operations",
        },
        lazyConnect: {
          type: "boolean",
          default: false,
          description: "Delay connection until first command",
        },
        keyPrefix: {
          type: "string",
          description: "Prefix for all Redis keys",
        },
        commandTimeout: {
          type: "integer",
          minimum: 0,
          default: 5000,
          description: "Command execution timeout",
        },
        keepAlive: {
          type: "integer",
          minimum: 0,
          default: 30000,
          description: "TCP keepAlive time",
        },
      },
      additionalProperties: false,
    },
    monitoring: {
      type: "object",
      properties: {
        enableMetrics: {
          type: "boolean",
          default: true,
          description: "Enable performance metrics collection",
        },
        metricsInterval: {
          type: "integer",
          minimum: 1000,
          default: 15000,
          description: "Metrics collection interval",
        },
        enableHealthCheck: {
          type: "boolean",
          default: true,
          description: "Enable periodic health checks",
        },
        healthCheckInterval: {
          type: "integer",
          minimum: 1000,
          default: 30000,
          description: "Health check interval",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ["pools"],
};
  
```  
  
3. `qi/core/src/services/redis/config/validator.ts`:
```ts
/**
 * @fileoverview Redis schema validation implementation
 * @module @qi/core/services/redis/config/validator
 *
 * @description
 * Provides schema validation for Redis service configurations using the base configuration module.
 * This implementation delegates actual schema validation to the core config module while
 * handling Redis-specific validation needs and error handling.
 *
 * Key features:
 * - Redis-specific schema registration and validation
 * - Integration with core config validation system
 * - Custom error handling for Redis configuration issues
 * - Type-safe validation assertions
 *
 * @example
 * ```typescript
 * // Create validator
 * const validator = new RedisSchemaValidator();
 *
 * // Validate config
 * const config = {
 *   pools: {
 *     default: { min: 1, max: 10 }
 *   }
 * };
 * validator.validate(config); // throws RedisError if invalid
 *
 * // Access schema
 * const schema = validator.getSchema();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-26
 * @modified 2024-11-28
 */
  
import { Schema, ISchema, JsonSchema } from "@qi/core/config";
import {
  redisConfigSchema,
  poolConfigSchema,
  retryStrategySchema,
} from "./schema.js";
import { RedisConfig } from "./types.js";
import { RedisError, SchemaValidationError } from "../errors.js";
import { logger } from "@qi/core/logger";
  
/**
 * Type to ensure schema has required <img src="https://latex.codecogs.com/gif.latex?id%20property%20*%20Used%20internally%20for%20schema%20validation%20and%20registration%20*%20*%20@internal%20*/type%20SchemaWithId%20=%20JsonSchema%20&amp;%20{"/>id: string };
  
/**
 * Interface for validation error structure from core config module
 *
 * @internal
 */
interface ValidationError {
  path?: string;
  message: string;
  value?: unknown;
}
  
/**
 * Extended Error interface with validation errors
 *
 * @internal
 */
interface SchemaValidationErrorObject extends Error {
  validationErrors: ValidationError[];
}
  
/**
 * Validates Redis configurations against a defined JSON schema.
 * Uses the core configuration module's validation system while providing
 * Redis-specific validation handling.
 *
 * @class
 * @description
 * Provides Redis-specific schema validation by leveraging the core configuration
 * validation system. Handles schema registration, validation, and error mapping
 * for Redis configurations.
 */
export class RedisSchemaValidator {
  private readonly schema: ISchema;
  
  /**
   * Creates a new Redis schema validator
   *
   * @param {ISchema} [schema] - Optional custom schema validator
   * @throws {RedisError} If schema registration fails
   */
  constructor(schema?: ISchema) {
    this.schema = schema || new Schema({ formats: true });
    this.registerSchemas();
  }
  
  /**
   * Ensures a schema has an <img src="https://latex.codecogs.com/gif.latex?id%20property%20%20%20*%20%20%20*%20@private%20%20%20*%20@param%20{JsonSchema}%20schema%20-%20Schema%20to%20check%20%20%20*%20@param%20{string}%20name%20-%20Schema%20name%20for%20error%20messages%20%20%20*%20@returns%20{SchemaWithId}%20Schema%20with%20verified%20ID%20%20%20*%20@throws%20{RedisError}%20If%20schema%20is%20missing"/>id
   */
  private ensureSchemaId(schema: JsonSchema, name: string): SchemaWithId {
    if (!schema.<img src="https://latex.codecogs.com/gif.latex?id)%20{%20%20%20%20%20%20throw%20RedisError.configurationError(%20%20%20%20%20%20%20%20`Schema"/>{name} missing <img src="https://latex.codecogs.com/gif.latex?id%20property`,%20%20%20%20%20%20%20%20{%20%20%20%20%20%20%20%20%20%20schemaName:%20name,%20%20%20%20%20%20%20%20}%20%20%20%20%20%20);%20%20%20%20}%20%20%20%20return%20schema%20as%20SchemaWithId;%20%20}%20%20/**%20%20%20*%20Registers%20all%20Redis%20schemas%20with%20the%20validator%20%20%20*%20Handles%20registration%20of%20component%20schemas%20in%20correct%20dependency%20order%20%20%20*%20%20%20*%20@private%20%20%20*%20@throws%20{RedisError}%20If%20schema%20registration%20fails%20%20%20*/%20%20private%20registerSchemas():%20void%20{%20%20%20%20try%20{%20%20%20%20%20%20const%20pool%20=%20this.ensureSchemaId(poolConfigSchema,%20&quot;pool&quot;);%20%20%20%20%20%20const%20retry%20=%20this.ensureSchemaId(retryStrategySchema,%20&quot;retry&quot;);%20%20%20%20%20%20const%20config%20=%20this.ensureSchemaId(redisConfigSchema,%20&quot;config&quot;);%20%20%20%20%20%20if%20(!this.schema.hasSchema(pool."/>id)) {
        this.schema.registerSchema(pool.<img src="https://latex.codecogs.com/gif.latex?id,%20pool);%20%20%20%20%20%20%20%20logger.debug(&quot;Registered%20Redis%20pool%20schema&quot;,%20{%20schemaId:%20pool."/>id });
      }
  
      if (!this.schema.hasSchema(retry.<img src="https://latex.codecogs.com/gif.latex?id))%20{%20%20%20%20%20%20%20%20this.schema.registerSchema(retry."/>id, retry);
        logger.debug("Registered Redis retry schema", { schemaId: retry.<img src="https://latex.codecogs.com/gif.latex?id%20});%20%20%20%20%20%20}%20%20%20%20%20%20if%20(!this.schema.hasSchema(config."/>id)) {
        this.schema.registerSchema(config.<img src="https://latex.codecogs.com/gif.latex?id,%20config);%20%20%20%20%20%20%20%20logger.debug(&quot;Registered%20Redis%20config%20schema&quot;,%20{%20%20%20%20%20%20%20%20%20%20schemaId:%20config."/>id,
        });
      }
    } catch (error) {
      throw RedisError.configurationError("Failed to register Redis schemas", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  /**
   * Type guard for schema validation errors
   *
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean} True if error contains validation errors
   */
  private isSchemaError(error: Error): error is SchemaValidationErrorObject {
    return (
      "validationErrors" in error &&
      Array.isArray((error as SchemaValidationErrorObject).validationErrors)
    );
  }
  
  /**
   * Maps core validation errors to Redis validation errors
   *
   * @private
   * @param {ValidationError[]} errors - Core validation errors
   * @returns {SchemaValidationError[]} Redis validation errors
   */
  private mapValidationErrors(
    errors: ValidationError[]
  ): SchemaValidationError[] {
    return errors.map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
  }
  
  /**
   * Validates Redis configuration against registered schema
   *
   * @param {unknown} config - Configuration to validate
   * @throws {RedisError} If validation fails
   */
  public validate(config: unknown): asserts config is RedisConfig {
    const schemaId = this.ensureSchemaId(redisConfigSchema, "config").<img src="https://latex.codecogs.com/gif.latex?id;%20%20%20%20try%20{%20%20%20%20%20%20this.schema.validate(config,%20schemaId);%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20if%20(error%20instanceof%20Error%20&amp;&amp;%20this.isSchemaError(error))%20{%20%20%20%20%20%20%20%20throw%20RedisError.validationError(%20%20%20%20%20%20%20%20%20%20schemaId,%20%20%20%20%20%20%20%20%20%20this.mapValidationErrors(error.validationErrors)%20%20%20%20%20%20%20%20);%20%20%20%20%20%20}%20%20%20%20%20%20throw%20RedisError.configurationError(%20%20%20%20%20%20%20%20&quot;Redis%20configuration%20validation%20failed&quot;,%20%20%20%20%20%20%20%20{%20%20%20%20%20%20%20%20%20%20error:%20error%20instanceof%20Error%20?%20error.message%20:%20String(error),%20%20%20%20%20%20%20%20%20%20schemaId,%20%20%20%20%20%20%20%20}%20%20%20%20%20%20);%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Gets%20the%20underlying%20Redis%20configuration%20schema%20%20%20*%20%20%20*%20@returns%20{JsonSchema}%20JSON%20Schema%20used%20for%20Redis%20configuration%20validation%20%20%20*/%20%20public%20getSchema():%20JsonSchema%20{%20%20%20%20return%20redisConfigSchema;%20%20}}```%20%20###%20The%20`qi/core/src/services/base`1.%20`qi/core/src/services/base/types.ts`:```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Base%20Redis%20service%20types%20*%20@module%20@qi/core/services/redis/base/types%20*%20@description%20Defines%20core%20interfaces%20for%20Redis%20service%20functionality%20including%20*%20connection%20management,%20events,%20and%20operations.%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-11-21%20*/import%20type%20{%20Redis%20as%20RedisClient%20}%20from%20&quot;ioredis&quot;;/**%20*%20Redis%20service%20event%20handler%20types%20*%20Maps%20event%20names%20to%20handler%20function%20signatures%20*%20*%20@interface%20*/export%20interface%20RedisServiceEvents%20{%20%20connect:%20()%20=&gt;%20void;%20%20error:%20(error:%20Error)%20=&gt;%20void;%20%20close:%20()%20=&gt;%20void;%20%20reconnecting:%20(attempt:%20number)%20=&gt;%20void;}/**%20*%20Core%20Redis%20service%20interface%20*%20Defines%20base%20functionality%20required%20by%20all%20Redis%20clients%20*%20*%20@interface%20*/export%20interface%20RedisBaseService%20{%20%20getClient():%20RedisClient;%20%20ping():%20Promise&lt;boolean&gt;;%20%20close():%20Promise&lt;void&gt;;%20%20on&lt;E%20extends%20keyof%20RedisServiceEvents&gt;(%20%20%20%20event:%20E,%20%20%20%20listener:%20RedisServiceEvents[E]%20%20):%20void;}```%20%202.%20`qi/core/src/services/base/client.ts`:```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Base%20Redis%20client%20implementation%20*%20@module%20@qi/core/services/redis/base/client%20*%20*%20@description%20*%20Implements%20core%20Redis%20functionality%20including%20connection%20management,%20*%20health%20checks,%20error%20handling,%20and%20event%20handling.%20This%20base%20implementation%20*%20provides%20foundational%20Redis%20operations%20and%20lifecycle%20management%20that%20can%20*%20be%20extended%20by%20specific%20client%20implementations.%20*%20*%20Key%20features:%20*%20-%20Connection%20lifecycle%20management%20*%20-%20Health%20check/ping%20functionality%20*%20-%20Event%20handling%20and%20monitoring%20*%20-%20Connection%20state%20tracking%20*%20-%20Error%20handling%20and%20retry%20logic%20*%20*%20@example%20*%20```typescript%20*%20const%20client%20=%20new%20RedisBaseClient(redisClient,%20logger);%20*%20*%20//%20Monitor%20connection%20events%20*%20client.on(&#39;connect&#39;,%20()%20=&gt;%20console.log(&#39;Connected&#39;));%20*%20client.on(&#39;error&#39;,%20(err)%20=&gt;%20console.error(&#39;Error:&#39;,%20err));%20*%20*%20//%20Check%20health%20*%20const%20isHealthy%20=%20await%20client.ping();%20*%20*%20//%20Graceful%20shutdown%20*%20await%20client.close();%20*%20```%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-11-21%20*%20@modified%202024-11-28%20*/import%20type%20{%20Redis%20as%20RedisClient%20}%20from%20&quot;ioredis&quot;;import%20{%20RedisError%20}%20from%20&quot;../errors.js&quot;;import%20{%20RedisServiceEvents,%20RedisBaseService%20}%20from%20&quot;./types.js&quot;;import%20{%20retryOperation%20}%20from%20&quot;@qi/core/utils&quot;;import%20{%20Logger%20}%20from%20&quot;winston&quot;;/**%20*%20Base%20Redis%20client%20implementation%20*%20Handles%20core%20Redis%20operations%20and%20connection%20lifecycle%20*%20*%20@implements%20{RedisBaseService}%20*%20@class%20*/export%20class%20RedisBaseClient%20implements%20RedisBaseService%20{%20%20private%20client:%20RedisClient;%20%20private%20isConnected:%20boolean%20=%20false;%20%20private%20readonly%20logger:%20Logger;%20%20/**%20%20%20*%20Creates%20new%20Redis%20base%20client%20instance%20%20%20*%20%20%20*%20@param%20{RedisClient}%20client%20-%20IoRedis%20client%20instance%20%20%20*%20@param%20{Logger}%20logger%20-%20Winston%20logger%20instance%20%20%20*/%20%20constructor(client:%20RedisClient,%20logger:%20Logger)%20{%20%20%20%20this.client%20=%20client;%20%20%20%20this.logger%20=%20logger;%20%20%20%20this.setupListeners();%20%20}%20%20/**%20%20%20*%20Initializes%20Redis%20event%20listeners%20%20%20*%20Tracks%20connection%20state%20and%20logs%20events%20%20%20*%20%20%20*%20@private%20%20%20*/%20%20private%20setupListeners():%20void%20{%20%20%20%20this.client.on(&quot;connect&quot;,%20()%20=&gt;%20{%20%20%20%20%20%20this.isConnected%20=%20true;%20%20%20%20%20%20this.logger.info(&quot;Redis%20connected&quot;);%20%20%20%20});%20%20%20%20this.client.on(&quot;error&quot;,%20(error)%20=&gt;%20{%20%20%20%20%20%20this.logger.error(&quot;Redis%20error%20occurred&quot;,%20{%20%20%20%20%20%20%20%20error:%20error%20instanceof%20Error%20?%20error.message%20:%20String(error),%20%20%20%20%20%20});%20%20%20%20});%20%20%20%20this.client.on(&quot;close&quot;,%20()%20=&gt;%20{%20%20%20%20%20%20this.isConnected%20=%20false;%20%20%20%20%20%20this.logger.info(&quot;Redis%20connection%20closed&quot;);%20%20%20%20});%20%20%20%20this.client.on(&quot;reconnecting&quot;,%20(attempt:%20number)%20=&gt;%20{%20%20%20%20%20%20this.logger.info(&quot;Redis%20reconnecting&quot;,%20{%20attempt%20});%20%20%20%20});%20%20}%20%20/**%20%20%20*%20Waits%20for%20Redis%20connection%20with%20timeout%20%20%20*%20Used%20during%20initialization%20and%20reconnection%20%20%20*%20%20%20*%20@private%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20Resolves%20when%20connected%20%20%20*%20@throws%20{RedisError}%20On%20connection%20timeout%20or%20failure%20%20%20*/%20%20private%20async%20waitForConnection():%20Promise&lt;void&gt;%20{%20%20%20%20if%20(this.isConnected)%20return;%20%20%20%20return%20new%20Promise((resolve,%20reject)%20=&gt;%20{%20%20%20%20%20%20const%20timeout%20=%20setTimeout(()%20=&gt;%20{%20%20%20%20%20%20%20%20reject(%20%20%20%20%20%20%20%20%20%20RedisError.timeoutError(&quot;Connection%20timeout&quot;,%20{%20%20%20%20%20%20%20%20%20%20%20%20operation:%20&quot;connect&quot;,%20%20%20%20%20%20%20%20%20%20%20%20timeout:%205000,%20%20%20%20%20%20%20%20%20%20})%20%20%20%20%20%20%20%20);%20%20%20%20%20%20},%205000);%20%20%20%20%20%20this.client.once(&quot;connect&quot;,%20()%20=&gt;%20{%20%20%20%20%20%20%20%20clearTimeout(timeout);%20%20%20%20%20%20%20%20this.isConnected%20=%20true;%20%20%20%20%20%20%20%20resolve();%20%20%20%20%20%20});%20%20%20%20%20%20this.client.once(&quot;error&quot;,%20(error)%20=&gt;%20{%20%20%20%20%20%20%20%20clearTimeout(timeout);%20%20%20%20%20%20%20%20reject(%20%20%20%20%20%20%20%20%20%20RedisError.connectionError(&quot;Failed%20to%20establish%20connection&quot;,%20{%20%20%20%20%20%20%20%20%20%20%20%20operation:%20&quot;connect&quot;,%20%20%20%20%20%20%20%20%20%20%20%20error:%20error%20instanceof%20Error%20?%20error.message%20:%20String(error),%20%20%20%20%20%20%20%20%20%20})%20%20%20%20%20%20%20%20);%20%20%20%20%20%20});%20%20%20%20});%20%20}%20%20/**%20%20%20*%20Gets%20underlying%20Redis%20client%20if%20connected%20%20%20*%20%20%20*%20@returns%20{RedisClient}%20Redis%20client%20instance%20%20%20*%20@throws%20{RedisError}%20If%20not%20connected%20%20%20*/%20%20public%20getClient():%20RedisClient%20{%20%20%20%20if%20(!this.isConnected)%20{%20%20%20%20%20%20throw%20RedisError.clientError(&quot;Client%20not%20connected&quot;,%20{%20%20%20%20%20%20%20%20operation:%20&quot;getClient&quot;,%20%20%20%20%20%20});%20%20%20%20}%20%20%20%20return%20this.client;%20%20}%20%20/**%20%20%20*%20Checks%20connection%20health%20with%20retries%20%20%20*%20Attempts%20to%20ping%20Redis%20server%20to%20verify%20connectivity%20%20%20*%20%20%20*%20@returns%20{Promise&lt;boolean&gt;}%20True%20if%20healthy%20%20%20*%20@throws%20{RedisError}%20After%20max%20retries%20%20%20*/%20%20public%20async%20ping():%20Promise&lt;boolean&gt;%20{%20%20%20%20let%20attemptCount%20=%200;%20%20%20%20try%20{%20%20%20%20%20%20const%20result%20=%20await%20retryOperation(%20%20%20%20%20%20%20%20async%20()%20=&gt;%20{%20%20%20%20%20%20%20%20%20%20attemptCount%20+=%201;%20%20%20%20%20%20%20%20%20%20this.logger.debug(&quot;Attempting%20ping&quot;,%20{%20attempt:%20attemptCount%20});%20%20%20%20%20%20%20%20%20%20return%20await%20this.client.ping();%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20{%20%20%20%20%20%20%20%20%20%20retries:%203,%20%20%20%20%20%20%20%20%20%20minTimeout:%201000,%20%20%20%20%20%20%20%20%20%20onRetry:%20(times:%20number)%20=&gt;%20{%20%20%20%20%20%20%20%20%20%20%20%20this.logger.debug(&quot;Retrying%20ping&quot;,%20{%20attempt:%20times%20});%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20}%20%20%20%20%20%20);%20%20%20%20%20%20return%20result%20===%20&quot;PONG&quot;;%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20throw%20RedisError.operationError(&quot;Ping%20failed&quot;,%20{%20%20%20%20%20%20%20%20operation:%20&quot;ping&quot;,%20%20%20%20%20%20%20%20attempt:%20attemptCount,%20%20%20%20%20%20%20%20error:%20error%20instanceof%20Error%20?%20error.message%20:%20String(error),%20%20%20%20%20%20});%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Closes%20Redis%20connection%20gracefully%20%20%20*%20Ensures%20proper%20cleanup%20of%20resources%20and%20event%20handlers%20%20%20*%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20Resolves%20when%20closed%20%20%20*%20@throws%20{RedisError}%20On%20close%20failure%20%20%20*/%20%20public%20async%20close():%20Promise&lt;void&gt;%20{%20%20%20%20try%20{%20%20%20%20%20%20await%20this.client.quit();%20%20%20%20%20%20this.isConnected%20=%20false;%20%20%20%20%20%20this.logger.info(&quot;Connection%20closed%20gracefully&quot;);%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20throw%20RedisError.operationError(&quot;Failed%20to%20close%20connection&quot;,%20{%20%20%20%20%20%20%20%20operation:%20&quot;close&quot;,%20%20%20%20%20%20%20%20error:%20error%20instanceof%20Error%20?%20error.message%20:%20String(error),%20%20%20%20%20%20});%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Registers%20Redis%20event%20listener%20%20%20*%20%20%20*%20@param%20{E}%20event%20-%20Event%20name%20%20%20*%20@param%20{RedisServiceEvents[E]}%20listener%20-%20Event%20handler%20%20%20*/%20%20public%20on&lt;E%20extends%20keyof%20RedisServiceEvents&gt;(%20%20%20%20event:%20E,%20%20%20%20listener:%20RedisServiceEvents[E]%20%20):%20void%20{%20%20%20%20this.client.on(event,%20listener);%20%20}}```%20%20###%20The%20`qi/core/src/services/app`1.%20`qi/core/src/services/app/types.ts`:```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Application%20Redis%20service%20types%20*%20@module%20@qi/core/services/redis/app/types%20*%20@description%20Defines%20application-level%20Redis%20service%20interfaces%20extending%20base%20functionality%20*%20with%20business%20features.%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-11-21%20*%20@modified%202024-11-25%20*/import%20{%20RedisBaseService%20}%20from%20&quot;../base/types.js&quot;;import%20{%20RedisPoolConfig%20}%20from%20&quot;../config/types.js&quot;;/**%20*%20Application%20Redis%20service%20interface%20*%20Extends%20base%20service%20with%20business%20features%20*%20*%20@extends%20{RedisBaseService}%20*%20@interface%20*/export%20interface%20RedisAppService%20extends%20RedisBaseService%20{%20%20/**%20%20%20*%20Gets%20value%20with%20automatic%20key%20prefixing%20%20%20*%20%20%20*%20@param%20{string}%20key%20-%20Redis%20key%20%20%20*%20@returns%20{Promise&lt;string|null&gt;}%20Value%20or%20null%20if%20not%20found%20%20%20*/%20%20get(key:%20string):%20Promise&lt;string%20|%20null&gt;;%20%20/**%20%20%20*%20Gets%20current%20pool%20configuration%20%20%20*%20%20%20*%20@returns%20{RedisPoolConfig|undefined}%20Pool%20config%20if%20exists%20%20%20*/%20%20getPoolConfig():%20RedisPoolConfig%20|%20undefined;}```%20%202.%20`qi/core/src/services/app/client.ts`:```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Application%20Redis%20client%20implementation%20*%20@module%20@qi/core/services/redis/app/client%20*%20@description%20Implements%20application-level%20Redis%20client%20with%20business%20features%20*%20like%20key%20prefixing%20and%20pool%20configuration.%20*%20*%20@see%20{@link%20RedisAppService}%20for%20interface%20definition%20*%20@see%20{@link%20RedisBaseClient}%20for%20base%20implementation%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-11-21%20*%20@modified%202024-11-25%20*/import%20{%20RedisConfig%20}%20from%20&quot;../config/types.js&quot;;import%20{%20RedisAppService%20}%20from%20&quot;./types.js&quot;;import%20{%20RedisServiceEvents%20}%20from%20&quot;../base/types.js&quot;;import%20{%20RedisBaseClient%20}%20from%20&quot;../base/client.js&quot;;/**%20*%20Application%20Redis%20client%20implementation%20*%20Adds%20business%20features%20to%20base%20Redis%20functionality%20*%20*%20@implements%20{RedisAppService}%20*%20@class%20*/export%20class%20RedisAppClient%20implements%20RedisAppService%20{%20%20private%20readonly%20baseClient:%20RedisBaseClient;%20%20private%20readonly%20config:%20RedisConfig;%20%20private%20readonly%20poolName:%20string;%20%20/**%20%20%20*%20Creates%20new%20application%20Redis%20client%20%20%20*%20%20%20*%20@param%20{RedisBaseClient}%20baseClient%20-%20Base%20Redis%20client%20%20%20*%20@param%20{RedisConfig}%20config%20-%20Redis%20configuration%20%20%20*%20@param%20{string}%20[poolName=default]%20-%20Connection%20pool%20name%20%20%20*/%20%20constructor(%20%20%20%20baseClient:%20RedisBaseClient,%20%20%20%20config:%20RedisConfig,%20%20%20%20poolName:%20string%20=%20&quot;default&quot;%20%20)%20{%20%20%20%20this.baseClient%20=%20baseClient;%20%20%20%20this.config%20=%20config;%20%20%20%20this.poolName%20=%20poolName;%20%20}%20%20/**%20%20%20*%20Gets%20underlying%20Redis%20client%20instance%20%20%20*%20Delegates%20to%20base%20client%20%20%20*%20%20%20*%20@returns%20{RedisClient}%20Redis%20client%20instance%20%20%20*%20@throws%20{RedisError}%20If%20not%20connected%20%20%20*/%20%20public%20getClient()%20{%20%20%20%20return%20this.baseClient.getClient();%20%20}%20%20/**%20%20%20*%20Checks%20connection%20health%20%20%20*%20Delegates%20to%20base%20client%20%20%20*%20%20%20*%20@returns%20{Promise&lt;boolean&gt;}%20True%20if%20healthy%20%20%20*%20@throws%20{RedisError}%20After%20max%20retries%20%20%20*/%20%20public%20async%20ping():%20Promise&lt;boolean&gt;%20{%20%20%20%20return%20this.baseClient.ping();%20%20}%20%20/**%20%20%20*%20Closes%20Redis%20connection%20%20%20*%20Delegates%20to%20base%20client%20%20%20*%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20Resolves%20when%20closed%20%20%20*%20@throws%20{RedisError}%20On%20close%20failure%20%20%20*/%20%20public%20async%20close():%20Promise&lt;void&gt;%20{%20%20%20%20return%20this.baseClient.close();%20%20}%20%20/**%20%20%20*%20Registers%20Redis%20event%20listener%20%20%20*%20Delegates%20to%20base%20client%20%20%20*%20%20%20*%20@param%20{E}%20event%20-%20Event%20name%20%20%20*%20@param%20{RedisServiceEvents[E]}%20listener%20-%20Event%20handler%20%20%20*/%20%20public%20on&lt;E%20extends%20keyof%20RedisServiceEvents&gt;(%20%20%20%20event:%20E,%20%20%20%20listener:%20RedisServiceEvents[E]%20%20):%20void%20{%20%20%20%20this.baseClient.on(event,%20listener);%20%20}%20%20/**%20%20%20*%20Gets%20Redis%20value%20with%20automatic%20key%20prefixing%20%20%20*%20Applies%20configured%20prefix%20to%20key%20before%20access%20%20%20*%20%20%20*%20@param%20{string}%20key%20-%20Redis%20key%20%20%20*%20@returns%20{Promise&lt;string|null&gt;}%20Value%20or%20null%20if%20not%20found%20%20%20*%20@throws%20{RedisError}%20On%20Redis%20operation%20failure%20%20%20*/%20%20public%20async%20get(key:%20string):%20Promise&lt;string%20|%20null&gt;%20{%20%20%20%20const%20client%20=%20this.baseClient.getClient();%20%20%20%20const%20prefixedKey%20=%20this.getPrefixedKey(key);%20%20%20%20return%20client.get(prefixedKey);%20%20}%20%20/**%20%20%20*%20Applies%20configured%20prefix%20to%20Redis%20key%20%20%20*%20%20%20*%20@private%20%20%20*%20@param%20{string}%20key%20-%20Original%20key%20%20%20*%20@returns%20{string}%20Key%20with%20prefix%20applied%20%20%20*/%20%20private%20getPrefixedKey(key:%20string):%20string%20{%20%20%20%20const%20prefix%20=%20this.config.features?.keyPrefix%20??%20&quot;&quot;;%20%20%20%20return%20`"/>{prefix}${key}`;
  }
  
  /**
   * Gets configuration for current connection pool
   *
   * @returns {RedisPoolConfig|undefined} Pool configuration if exists
   */
  public getPoolConfig() {
    return this.config.pools?.[this.poolName];
  }
}
  
```  
  