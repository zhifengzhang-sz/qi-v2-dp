## The redis module

### `qi/core/src/services/redis/types.ts`

```typescript
/**
 * @fileoverview Redis Service Type Definitions
 * @module @qi/core/services/redis/types
 * 
 * @description
 * This module defines the core types and interfaces for the Redis service implementation.
 * It includes:
 * - Event definitions for Redis service state changes
 * - Configuration options for Redis client setup
 * - Core service interface definition
 * 
 * These types provide a foundation for type-safe Redis operations and event handling
 * throughout the application.
 * 
 * @example
 * ```typescript
 * // Using Redis service types
 * const options: RedisServiceOptions = {
 *   host: 'localhost',
 *   port: 6379,
 *   keyPrefix: 'myapp:',
 *   enableReadyCheck: true
 * };
 * 
 * const service: RedisService = createRedisService(options);
 * service.on('connect', () => console.log('Connected!'));
 * ```
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */

import type { Redis, RedisOptions } from "ioredis";

/**
 * Events emitted by the Redis service.
 * Provides type-safe event definitions for Redis service state changes.
 * 
 * @interface RedisServiceEvents
 */
export interface RedisServiceEvents {
  /** Emitted when a connection is established */
  connect: () => void;
  /** Emitted when an error occurs */
  error: (error: Error) => void;
  /** Emitted when the connection is closed */
  close: () => void;
  /** Emitted when attempting to reconnect */
  reconnecting: (attempt: number) => void;
}

/**
 * Configuration options for the Redis service.
 * Extends IoRedis options with additional custom settings.
 * 
 * @interface RedisServiceOptions
 * @extends RedisOptions
 */
export interface RedisServiceOptions extends RedisOptions {
  /** Prefix for all Redis keys */
  keyPrefix?: string;
  /** Enable Redis ready check on connection */
  enableReadyCheck?: boolean;
  /** Maximum number of retries per request */
  maxRetriesPerRequest?: number;
  /** Connection timeout in milliseconds */
  connectionTimeout?: number;
  /** Retry strategy configuration */
  retryStrategy?: {
    /** Maximum number of retry attempts */
    maxAttempts: number;
    /** Minimum timeout between retries in milliseconds */
    minTimeout: number;
    /** Maximum timeout between retries in milliseconds */
    maxTimeout: number;
  };
}

/**
 * Core Redis service interface.
 * Defines the public API for interacting with Redis.
 * 
 * @interface RedisService
 */
export interface RedisService {
  /**
   * Retrieves the Redis client instance.
   * 
   * @throws {RedisError} If client is not connected
   * @returns {Redis} The Redis client instance
   */
  getClient(): Redis;

  /**
   * Pings the Redis server to check connectivity.
   * Implements automatic retry with configurable strategy.
   * 
   * @throws {RedisError} If ping fails after retries
   * @returns {Promise<boolean>} True if ping succeeds
   */
  ping(): Promise<boolean>;

  /**
   * Gracefully closes the Redis connection.
   * Ensures proper cleanup of resources.
   * 
   * @throws {RedisError} If closure fails
   * @returns {Promise<void>}
   */
  close(): Promise<void>;

  /**
   * Subscribes to Redis service events.
   * Provides type-safe event subscription.
   * 
   * @template E - Event name from RedisServiceEvents
   * @param {E} event - The event to subscribe to
   * @param {RedisServiceEvents[E]} listener - Event handler function
   */
  on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void;
}
```

### `qi/core/src/services/config/errors.ts`

```typescript
/**
 * @fileoverview Redis Error Handling
 * @module @qi/core/services/redis/errors
 * 
 * @description
 * This module provides structured error handling for Redis operations.
 * It defines:
 * - Custom error types for Redis-specific errors
 * - Detailed error contexts for debugging
 * - Error factory methods for common error cases
 * - Error code constants for categorization
 * 
 * The error handling system is designed to provide detailed context
 * for debugging while maintaining clean error hierarchies.
 * 
 * @example
 * ```typescript
 * try {
 *   await redisClient.connect();
 * } catch (error) {
 *   if (error instanceof RedisError) {
 *     console.error('Redis error:', error.message, error.details);
 *   }
 * }
 * ```
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */

import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorCode } from "@qi/core/errors";

/**
 * Detailed context for Redis errors.
 * Provides structured information about error circumstances.
 * 
 * @interface RedisErrorDetails
 * @extends ErrorDetails
 */
export interface RedisErrorDetails extends ErrorDetails {
  /** Redis operation being performed when error occurred */
  operation?: string;
  /** Timeout duration that was exceeded */
  timeout?: number;
  /** Current retry attempt number */
  attempt?: number;
  /** Original error message or cause */
  error?: string;
  /** Connection context when error occurred */
  connection?: {
    host?: string;
    port?: number;
    database?: number;
  };
  /** Additional context specific to error */
  [key: string]: unknown;
}

/**
 * Redis-specific error codes.
 * Maps Redis errors to application error codes.
 * 
 * @const REDIS_ERROR_CODES
 */
export const REDIS_ERROR_CODES = {
  /** Failed to establish connection */
  CONNECTION_ERROR: ErrorCode.CONNECTION_ERROR,
  /** Operation timed out */
  TIMEOUT_ERROR: ErrorCode.TIMEOUT_ERROR,
  /** Redis operation failed */
  OPERATION_ERROR: ErrorCode.OPERATION_ERROR,
  /** Client usage error */
  CLIENT_ERROR: ErrorCode.CLIENT_ERROR,
  /** Ping check failed */
  PING_ERROR: ErrorCode.PING_ERROR,
  /** Authentication failed */
  AUTHENTICATION_ERROR: ErrorCode.AUTHENTICATION_ERROR,
  /** Pub/Sub operation failed */
  SUBSCRIPTION_ERROR: ErrorCode.SUBSCRIPTION_ERROR,
} as const;

/**
 * Redis-specific error class.
 * Provides structured error handling for Redis operations.
 * 
 * @class RedisError
 * @extends ApplicationError
 */
export class RedisError extends ApplicationError {
  /**
   * Creates a new Redis error instance.
   * 
   * @param {string} message - Error message
   * @param {RedisErrorCode} code - Error code
   * @param {RedisErrorDetails} [details] - Error context
   */
  constructor(
    message: string,
    code: RedisErrorCode = ErrorCode.REDIS_ERROR,
    details?: RedisErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "RedisError";
  }

  /**
   * Creates a new Redis error with given details.
   * 
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorCode} code - Error code
   * @param {RedisErrorDetails} [details] - Error context
   * @returns {RedisError}
   */
  static create(
    message: string,
    code: RedisErrorCode,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, code, details);
  }

  /**
   * Creates a connection-specific error.
   * 
   * @static
   * @param {string} message - Error message
   * @param {RedisErrorDetails} [details] - Connection details
   * @returns {RedisError}
   */
  static connectionError(
    message: string,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, REDIS_ERROR_CODES.CONNECTION_ERROR, details);
  }

  /**
   * Creates an operation-specific error.
   * 
   * @static
   * @param {string} operation - Failed operation name
   * @param {unknown} error - Original error
   * @param {RedisErrorDetails} [details] - Operation details
   * @returns {RedisError}
   */
  static operationError(
    operation: string,
    error: unknown,
    details?: RedisErrorDetails
  ): RedisError {
    const message = error instanceof Error ? error.message : String(error);
    return new RedisError(
      `Redis operation '${operation}' failed: ${message}`,
      REDIS_ERROR_CODES.OPERATION_ERROR,
      { operation, error: message, ...details }
    );
  }
}
```

### `qi/core/src/services/redis/client.ts`

```typescript
/**
 * @fileoverview Redis Client Implementation
 * @module @qi/core/services/redis/client
 * 
 * @description
 * This module provides the core Redis client implementation.
 * It includes:
 * - Connection management with automatic reconnection
 * - Event handling and state management
 * - Error handling with retries
 * - Logging integration
 * - Type-safe Redis operations
 * 
 * The client is designed to be robust and maintainable while
 * providing a clean API for Redis operations.
 * 
 * @example
 * ```typescript
 * const logger = createLogger();
 * const redis = new Redis(options);
 * const client = new RedisClient(redis, logger);
 * 
 * await client.ping();
 * const redisClient = client.getClient();
 * // Perform Redis operations...
 * await client.close();
 * ```
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */

import { Redis } from "ioredis";
import { RedisError, REDIS_ERROR_CODES } from "./errors.js";
import { RedisServiceEvents, RedisService, RedisServiceOptions } from "./types.js";
import { retryOperation } from "@qi/core/utils";
import { Logger } from "winston";

/**
 * Redis client implementation.
 * Provides robust Redis connectivity with error handling.
 * 
 * @class RedisClient
 * @implements {RedisService}
 */
export class RedisClient implements RedisService {
  private readonly client: Redis;
  private readonly logger: Logger;
  private readonly options: RedisServiceOptions;
  private isConnected: boolean = false;
  private connectionPromise?: Promise<void>;

  /**
   * Creates a new Redis client instance.
   * 
   * @param {Redis} client - IoRedis client instance
   * @param {Logger} logger - Winston logger instance
   * @param {RedisServiceOptions} [options] - Client configuration
   */
  constructor(
    client: Redis,
    logger: Logger,
    options: RedisServiceOptions = {}
  ) {
    this.client = client;
    this.logger = logger;
    this.options = {
      connectionTimeout: 5000,
      retryStrategy: {
        maxAttempts: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
      },
      ...options,
    };

    this.setupListeners();
  }

  /**
   * Sets up event listeners for Redis state changes.
   * Handles connection, error, close, and reconnection events.
   * 
   * @private
   */
  private setupListeners(): void {
    const eventHandlers: Record<keyof RedisServiceEvents, (...args: any[]) => void> = {
      connect: () => {
        this.isConnected = true;
        this.logger.info("Redis connected successfully", {
          host: this.options.host,
          port: this.options.port,
        });
      },
      error: (error: Error) => {
        this.logger.error("Redis encountered an error", {
          error: error.message,
          stack: error.stack,
        });
      },
      close: () => {
        this.isConnected = false;
        this.logger.info("Redis connection closed");
      },
      reconnecting: (attempt: number) => {
        this.logger.info("Redis attempting to reconnect", { attempt });
      },
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      this.client.on(event, handler);
    });
  }

  /**
   * Waits for Redis connection to be established.
   * Implements timeout and proper cleanup.
   * 
   * @private
   * @throws {RedisError} If connection fails or times out
   * @returns {Promise<void>}
   */
  private async waitForConnection(): Promise<void> {
    if (this.isConnected) return;

    if (!this.connectionPromise) {
      this.connectionPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(
            RedisError.create(
              "Connection timeout exceeded",
              REDIS_ERROR_CODES.TIMEOUT_ERROR,
              {
                operation: "connect",
                timeout: this.options.connectionTimeout,
                connection: {
                  host: this.options.host,
                  port: this.options.port,
                },
              }
            )
          );
        }, this.options.connectionTimeout);

        const cleanup = () => {
          clearTimeout(timeout);
          this.client.removeListener("connect", onConnect);
          this.client.removeListener("error", onError);
        };

        const onConnect = () => {
          cleanup();
          this.isConnected = true;
          resolve();
        };

        const onError = (error: Error) => {
          cleanup();
          reject(
            RedisError.connectionError("Failed to establish connection", {
              error: error.message,
              connection: {
                host: this.options.host,
                port: this.options.port,
              },
            })
          );
        };

        this.client.once("connect", onConnect);
        this.client.once("error", onError);
      });
    }

    return this.connectionPromise;
  }

  /**
   * Gets the Redis client instance.
   * Ensures client is connected before returning.
   * 
   * @throws {RedisError} If client is not connected
   * @returns {Redis} Redis client instance
   */
  public getClient(): Redis {
    if (!this.isConnected) {
      throw RedisError.create(
        "Cannot get Redis client - not connected",
        REDIS_ERROR_CODES.CLIENT_ERROR,
        { operation: "getClient" }
      );
    }
    return this.client;
  }

  /**
   * Pings Redis server to check connectivity.
   * Implements retry strategy for reliability.
   * 
   * @throws {RedisError} If ping fails after retries
   * @returns {Promise<boolean>} True if ping succeeds
   */
  public async ping(): Promise<boolean> {
    const { maxAttempts, minTimeout } = this.options.retryStrategy!;
    let attemptCount = 0;

    try {
      const result = await retryOperation(
        async () => {
          attemptCount++;
          this.logger.debug("Executing ping", { attempt: attemptCount });
          return this.client.ping();
        },
        {
          retries: maxAttempts,
          minTimeout,
        }
      );

      return result === "PONG";
    } catch (error) {
      throw RedisError.operationError("ping", error, {
        attempt: attemptCount,
      });
    }
  }

  /**
   * Gracefully closes the Redis connection.
   * Ensures proper cleanup of resources.
   * 
   * @throws {RedisError} If closure fails
   * @returns {Promise<void>}
   */
  public async close(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      this.logger.info("Redis connection closed gracefully");
    } catch (error) {
      throw RedisError.operationError("close", error);
    }
  }

  /**
   * Subscribes to Redis service events.
   * Provides type-safe event subscription.
   * 
   * @template E - Event name from RedisServiceEvents
   * @param {E} event - The event to subscribe to
   * @param {RedisServiceEvents[E]} listener - Event handler function
   */
  public on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void {
    this.client.on(event, listener);
  }
}
```

## Config

### `qi/core/src/services/redis/config/schema.ts`

```typescript
/**
 * @fileoverview Redis Service Application Configuration Schema
 * @module @qi/core/services/redis/config/schema
 * 
 * @description
 * Defines JSON Schema for Redis application-level configuration, focusing on 
 * behavior, pooling, and features. Infrastructure settings (host, port, credentials)
 * are managed by the service-level configuration.
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-25
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Schema for Redis pool configuration
 */
const poolConfigSchema: JsonSchema = {
  type: "object",
  properties: {
    min: { type: "integer", minimum: 0, default: 1 },
    max: { type: "integer", minimum: 1, default: 10 },
    acquireTimeoutMillis: { type: "integer", minimum: 0, default: 30000 },
    createTimeoutMillis: { type: "integer", minimum: 0, default: 5000 },
    idleTimeoutMillis: { type: "integer", minimum: 0, default: 60000 },
    evictionRunIntervalMillis: { type: "integer", minimum: 0, default: 30000 },
    softIdleTimeoutMillis: { type: "integer", minimum: 0, default: 30000 }
  }
};

/**
 * Schema for Redis retry strategy
 */
const retryStrategySchema: JsonSchema = {
  type: "object",
  properties: {
    maxAttempts: { type: "integer", minimum: 1, default: 3 },
    initialDelayMs: { type: "integer", minimum: 0, default: 1000 },
    maxDelayMs: { type: "integer", minimum: 0, default: 5000 },
    factorMultiplier: { type: "number", minimum: 1, default: 2 }
  }
};

/**
 * Complete Redis application configuration schema
 * Focuses on behavior and features, not connection details
 */
export const redisConfigSchema: JsonSchema = {
  $id: "redis-app-config",
  type: "object",
  properties: {
    pools: {
      type: "object",
      patternProperties: {
        "^[a-zA-Z0-9_-]+$": poolConfigSchema
      },
      additionalProperties: false
    },
    retry: retryStrategySchema,
    features: {
      type: "object",
      properties: {
        enableAutoPipelining: { type: "boolean", default: true },
        enableOfflineQueue: { type: "boolean", default: true },
        enableReadyCheck: { type: "boolean", default: true },
        lazyConnect: { type: "boolean", default: false },
        keyPrefix: { type: "string" },
        commandTimeout: { type: "integer", minimum: 0, default: 5000 },
        keepAlive: { type: "integer", minimum: 0, default: 30000 }
      }
    },
    monitoring: {
      type: "object",
      properties: {
        enableMetrics: { type: "boolean", default: true },
        metricsInterval: { type: "integer", minimum: 1000, default: 15000 },
        enableHealthCheck: { type: "boolean", default: true },
        healthCheckInterval: { type: "integer", minimum: 1000, default: 30000 }
      }
    }
  }
};
```

### `qi/core/src/services/redis/config/types.ts`

```typescript
/**
 * @fileoverview Redis Service Configuration Types
 * @module @qi/core/services/redis/config/types
 */

import { BaseConfig } from "@qi/core/config";

export interface RedisPoolConfig {
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  evictionRunIntervalMillis?: number;
  softIdleTimeoutMillis?: number;
}

export interface RedisRetryStrategy {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factorMultiplier?: number;
}

/**
 * Redis application configuration
 * Focuses on behavioral settings, not connection details
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

### `redis.config.json:`

```json
{
  "pools": {
    "default": {
      "min": 2,
      "max": 10,
      "acquireTimeoutMillis": 30000
    },
    "cache": {
      "min": 5,
      "max": 20,
      "idleTimeoutMillis": 30000
    }
  },
  "retry": {
    "maxAttempts": 3,
    "initialDelayMs": 1000,
    "maxDelayMs": 5000
  },
  "features": {
    "enableAutoPipelining": true,
    "enableReadyCheck": true,
    "keyPrefix": "myapp:",
    "commandTimeout": 5000
  },
  "monitoring": {
    "enableMetrics": true,
    "healthCheckInterval": 30000
  }
}
```

### `qi/core/src/services/redis/client.ts`

```typescript
/**
 * Example of how to combine service config with Redis config
 */
import { ServiceConfig } from "@qi/core/services/config/types";
import { RedisConfig } from "./config/types";
import Redis from "ioredis";
import { Logger } from "winston";

export function createRedisClient(
  serviceConfig: ServiceConfig["databases"]["redis"],
  redisConfig: RedisConfig,
  poolName: string = "default",
  logger: Logger
): Redis {
  // Get pool configuration
  const poolConfig = redisConfig.pools?.[poolName] ?? redisConfig.pools?.default;
  
  // Create Redis client with merged configuration
  const client = new Redis({
    // Infrastructure settings from service config
    host: serviceConfig.host,
    port: serviceConfig.port,
    password: serviceConfig.password,
    
    // Application behavior from Redis config
    retryStrategy: (times) => {
      const retry = redisConfig.retry ?? {};
      const maxAttempts = retry.maxAttempts ?? 3;
      
      if (times > maxAttempts) return null;
      
      const delay = Math.min(
        retry.initialDelayMs! * Math.pow(retry.factorMultiplier!, times),
        retry.maxDelayMs!
      );
      
      return delay;
    },
    
    // Pool settings if applicable
    ...(poolConfig && {
      minIdle: poolConfig.min,
      maxIdle: poolConfig.max,
      acquireTimeout: poolConfig.acquireTimeoutMillis,
      createTimeout: poolConfig.createTimeoutMillis,
      idleTimeout: poolConfig.idleTimeoutMillis,
    }),
    
    // Feature settings
    keyPrefix: redisConfig.features?.keyPrefix,
    enableAutoPipelining: redisConfig.features?.enableAutoPipelining,
    enableOfflineQueue: redisConfig.features?.enableOfflineQueue,
    enableReadyCheck: redisConfig.features?.enableReadyCheck,
    lazyConnect: redisConfig.features?.lazyConnect,
    commandTimeout: redisConfig.features?.commandTimeout,
    keepAlive: redisConfig.features?.keepAlive,
  });

  return client;
}
```

Key benefits of this revised design:

1. Clear Separation of Concerns:
   - Service config (services.json) handles infrastructure: host, port, password
   - Redis config (redis.config.json) handles application behavior: pools, features, monitoring

2. No Configuration Overlap:
   - Infrastructure settings live only in service config
   - Application settings live only in Redis config

3. Multiple Connection Pools:
   - Can define different pools for different use cases
   - Each pool can have its own settings
   - Reuses same connection info from service config

4. Enhanced Features:
   - Retry strategy configuration
   - Command timeouts and keepalive
   - Monitoring and metrics settings
   - Feature flags for Redis capabilities

### Usage example

```typescript
async function initializeRedisService() {
  // Load both configs
  const serviceConfig = await initializeAppConfig();
  const redisLoader = new RedisConfigLoader();
  const redisConfig = await redisLoader.load('config/redis.config.json');

  // Create Redis clients for different purposes
  const defaultClient = createRedisClient(
    serviceConfig.databases.redis,
    redisConfig,
    'default',
    logger
  );

  const cacheClient = createRedisClient(
    serviceConfig.databases.redis,
    redisConfig,
    'cache',
    logger
  );

  return {
    default: defaultClient,
    cache: cacheClient
  };
}
```

---

This approach:
1. Eliminates configuration duplication
2. Maintains separation between infrastructure and application settings
3. Provides flexibility for different Redis usage patterns
4. Keeps type safety and validation
5. Integrates cleanly with existing service configuration

---

Further enhancements:
1. Add more Redis-specific features?
2. Show how to handle cluster configuration?
3. Add more pool configurations?
4. Explain the monitoring integration?

---

## Clients

Above, there are two versions of `client.ts`:

1. Infrastructure client (services/redis/client.ts)

   - Basic Redis client wrapper handling connection, ping, close
   - Uses service config for connection details


2. Application client (currently in discussion)

   - Enhanced client with pools, retry strategies, features
   - Uses Redis app config for behavior settings

We should keep them separate with clear naming:

- `RedisBaseClient` (infrastructure)
- `RedisAppClient` (application)

### `qi/core/src/services/redis/base/types.ts`

```typescript
export interface RedisServiceEvents {
  connect: () => void;
  error: (error: Error) => void;
  close: () => void;
  reconnecting: (attempt: number) => void;
}

export interface RedisBaseService {
  getClient(): Redis;
  ping(): Promise<boolean>;
  close(): Promise<void>;
  on<E extends keyof RedisServiceEvents>(event: E, listener: RedisServiceEvents[E]): void;
}
```

### `qi/core/src/services/redis/base/client.ts`

```typescript
import type { Redis as RedisClient } from "ioredis";
import Redis from "ioredis";
import { RedisError, REDIS_ERROR_CODES } from "../errors.js";
import { RedisServiceEvents, RedisBaseService } from "./types.js";
import { retryOperation } from "@qi/core/utils";
import { Logger } from "winston";

export class RedisBaseClient implements RedisBaseService {
  private client: RedisClient;
  private isConnected: boolean = false;
  private readonly logger: Logger;

  constructor(client: RedisClient, logger: Logger) {
    this.client = client;
    this.logger = logger;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.client.on("connect", () => {
      this.isConnected = true;
      this.logger.info("Redis connected.");
    });

    this.client.on("error", (error) => {
      this.logger.error("Redis error:", error);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      this.logger.info("Redis connection closed.");
    });

    this.client.on("reconnecting", (attempt: number) => {
      this.logger.info(`Redis reconnecting. Attempt ${attempt}.`);
    });
  }

  private async waitForConnection(): Promise<void> {
    if (this.isConnected) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          RedisError.create(
            "Connection timeout",
            REDIS_ERROR_CODES.TIMEOUT_ERROR,
            {
              operation: "connect",
              timeout: 5000,
            }
          )
        );
      }, 5000);

      this.client.once("connect", () => {
        clearTimeout(timeout);
        this.isConnected = true;
        resolve();
      });

      this.client.once("error", (error) => {
        clearTimeout(timeout);
        reject(
          RedisError.create(
            "Connection failed",
            REDIS_ERROR_CODES.CONNECTION_ERROR,
            {
              operation: "connect",
              error: error instanceof Error ? error.message : String(error),
            }
          )
        );
      });
    });
  }

  public getClient(): RedisClient {
    if (!this.isConnected) {
      throw RedisError.create(
        "Client not connected",
        REDIS_ERROR_CODES.CLIENT_ERROR,
        { operation: "getClient" }
      );
    }
    return this.client;
  }

  public async ping(): Promise<boolean> {
    let attemptCount = 0;
    try {
      const result = await retryOperation(
        async () => {
          attemptCount += 1;
          this.logger.debug(`Ping attempt ${attemptCount}`);
          return await this.client.ping();
        },
        {
          retries: 3,
          minTimeout: 1000,
          onRetry: (times: number) => {
            this.logger.debug(`Retry attempt ${times}`);
          }
        }
      );
      return result === "PONG";
    } catch (error) {
      throw RedisError.create("Ping failed", REDIS_ERROR_CODES.PING_ERROR, {
        attempt: attemptCount,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async close(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      this.logger.info("Connection closed gracefully");
    } catch (error) {
      throw RedisError.create(
        "Failed to close connection",
        REDIS_ERROR_CODES.OPERATION_ERROR,
        {
          operation: "close",
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  public on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void {
    this.client.on(event, listener);
  }
}
```

### `qi/core/src/services/redis/app/types.ts`

```typescript
export interface RedisAppService extends RedisBaseService {
  get(key: string): Promise<string | null>;
  getPoolConfig(): RedisPoolConfig | undefined;
  // Add other application-level methods
}
```

### `qi/core/src/services/redis/app/client.ts`

```typescript
import { RedisConfig } from "./config/types";
import { RedisAppService } from "./types";
import { RedisBaseClient } from "../base/client";
import { RedisError } from "../errors";

export class RedisAppClient implements RedisAppService {
  private readonly baseClient: RedisBaseClient;
  private readonly config: RedisConfig;
  private readonly poolName: string;

  constructor(baseClient: RedisBaseClient, config: RedisConfig, poolName: string = "default") {
    this.baseClient = baseClient;
    this.config = config;
    this.poolName = poolName;
  }

  // Enhanced methods with pool and feature support
  public async get(key: string): Promise<string | null> {
    const client = this.baseClient.getClient();
    const prefixedKey = this.getPrefixedKey(key);
    return client.get(prefixedKey);
  }

  // Add other Redis operations with application-level features

  private getPrefixedKey(key: string): string {
    const prefix = this.config.features?.keyPrefix ?? "";
    return `${prefix}${key}`;
  }

  public getPoolConfig() {
    return this.config.pools?.[this.poolName];
  }
}
```

---

This structure:
- Base client handles infrastructure concerns
- App client adds features and pooling
- Each has its own interface and responsibilities
- App client reuses base client functionality