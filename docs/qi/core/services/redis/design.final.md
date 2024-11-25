## The `qi/core/src/services/redis` module

### The `qi/core/src/services/redis`

#### `qi/core/src/services/redis/errors.ts`
```typescript
/**
 * @fileoverview Redis error handling and customization
 * @module @qi/core/services/redis/errors
 * @description Provides Redis-specific error types, error codes, and error creation utilities.
 * Extends core application error handling with Redis context.
 * 
 * @see {@link ApplicationError} for base error handling
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-22
 */

import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorCode } from "@qi/core/errors";

/**
 * Extended error details for Redis operations
 * Adds Redis-specific context to base error details
 * 
 * @extends {ErrorDetails}
 * @property {string} [operation] - Redis operation being performed
 * @property {number} [timeout] - Operation timeout duration
 * @property {number} [attempt] - Current retry attempt number
 * @property {string} [error] - Underlying error message
 */
export interface RedisErrorDetails extends ErrorDetails {
  operation?: string;
  timeout?: number;
  attempt?: number;
  error?: string;
  [key: string]: unknown;
}

/**
 * Redis-specific error codes mapped to core error types
 * 
 * @constant
 */
export const REDIS_ERROR_CODES = {
  CONNECTION_ERROR: ErrorCode.CONNECTION_ERROR,
  TIMEOUT_ERROR: ErrorCode.TIMEOUT_ERROR,
  OPERATION_ERROR: ErrorCode.OPERATION_ERROR,
  CLIENT_ERROR: ErrorCode.CLIENT_ERROR,
  PING_ERROR: ErrorCode.PING_ERROR,
} as const;

export type RedisErrorCode = ErrorCode;

/**
 * Redis-specific error class with enhanced details
 * 
 * @extends {ApplicationError}
 * @class
 */
export class RedisError extends ApplicationError {
  /**
   * Creates a new Redis error
   * 
   * @param {string} message - Error message
   * @param {RedisErrorCode} [code] - Error code
   * @param {RedisErrorDetails} [details] - Additional error details
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
   * Factory method for creating Redis errors
   * 
   * @param {string} message - Error message
   * @param {RedisErrorCode} code - Error code
   * @param {RedisErrorDetails} [details] - Additional error details
   * @returns {RedisError} New Redis error instance
   */
  static create(
    message: string,
    code: RedisErrorCode,
    details?: RedisErrorDetails
  ): RedisError {
    return new RedisError(message, code, details);
  }
}
```

---

### The `qi/core/src/services/redis/config`

#### `qi/core/src/services/redis/config/types.ts`

```typescript
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
---

#### `qi/core/src/services/redis/config/schema.ts`

```typescript
/**
 * @fileoverview Redis Service Application Configuration Schema
 * @module @qi/core/services/redis/config/schema
 * @description Defines JSON Schema for Redis application configuration validation.
 * Covers connection pools, retry strategies, features, and monitoring settings.
 * 
 * @see {@link RedisConfig} for TypeScript interface
 * @see {@link JsonSchema} for schema type definition
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-25
 * @modified 2024-11-26
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Schema for Redis connection pool configuration
 * @type {JsonSchema}
 */
const poolConfigSchema: JsonSchema = {
  type: "object",
  properties: {
    min: { 
      type: "integer", 
      minimum: 0, 
      default: 1,
      description: "Minimum number of connections to maintain"
    },
    max: { 
      type: "integer", 
      minimum: 1, 
      default: 10,
      description: "Maximum number of connections allowed"
    },
    acquireTimeoutMillis: { 
      type: "integer", 
      minimum: 0, 
      default: 30000,
      description: "Maximum time to wait for connection acquisition"
    },
    createTimeoutMillis: { 
      type: "integer", 
      minimum: 0, 
      default: 5000,
      description: "Maximum time to wait for connection creation"
    },
    idleTimeoutMillis: { 
      type: "integer", 
      minimum: 0, 
      default: 60000,
      description: "Time before idle connection is destroyed"
    },
    evictionRunIntervalMillis: { 
      type: "integer", 
      minimum: 0, 
      default: 30000,
      description: "Interval to check for idle connections"
    },
    softIdleTimeoutMillis: { 
      type: "integer", 
      minimum: 0, 
      default: 30000,
      description: "Soft timeout for idle connections"
    },
  },
  additionalProperties: false
};

/**
 * Schema for Redis retry strategy configuration
 * @type {JsonSchema}
 */
const retryStrategySchema: JsonSchema = {
  type: "object",
  properties: {
    maxAttempts: { 
      type: "integer", 
      minimum: 1, 
      default: 3,
      description: "Maximum number of retry attempts"
    },
    initialDelayMs: { 
      type: "integer", 
      minimum: 0, 
      default: 1000,
      description: "Initial delay between retries"
    },
    maxDelayMs: { 
      type: "integer", 
      minimum: 0, 
      default: 5000,
      description: "Maximum delay between retries"
    },
    factorMultiplier: { 
      type: "number", 
      minimum: 1, 
      default: 2,
      description: "Exponential backoff multiplier"
    },
  },
  additionalProperties: false
};

/**
 * Complete Redis application configuration schema
 * @type {JsonSchema}
 */
export const redisConfigSchema: JsonSchema = {
  $id: "redis-app-config",
  type: "object",
  properties: {
    pools: {
      type: "object",
      properties: {
        default: poolConfigSchema,
      },
      additionalProperties: poolConfigSchema,
      description: "Named connection pool configurations"
    },
    retry: retryStrategySchema,
    features: {
      type: "object",
      properties: {
        enableAutoPipelining: { 
          type: "boolean", 
          default: true,
          description: "Enable automatic command pipelining"
        },
        enableOfflineQueue: { 
          type: "boolean", 
          default: true,
          description: "Queue commands when connection lost"
        },
        enableReadyCheck: { 
          type: "boolean", 
          default: true,
          description: "Check if Redis is ready before operations"
        },
        lazyConnect: { 
          type: "boolean", 
          default: false,
          description: "Delay connection until first command"
        },
        keyPrefix: { 
          type: "string",
          description: "Prefix for all Redis keys" 
        },
        commandTimeout: { 
          type: "integer", 
          minimum: 0, 
          default: 5000,
          description: "Command execution timeout"
        },
        keepAlive: { 
          type: "integer", 
          minimum: 0, 
          default: 30000,
          description: "TCP keepAlive time"
        },
      },
      additionalProperties: false
    },
    monitoring: {
      type: "object",
      properties: {
        enableMetrics: { 
          type: "boolean", 
          default: true,
          description: "Enable performance metrics collection"
        },
        metricsInterval: { 
          type: "integer", 
          minimum: 1000, 
          default: 15000,
          description: "Metrics collection interval"
        },
        enableHealthCheck: { 
          type: "boolean", 
          default: true,
          description: "Enable periodic health checks"
        },
        healthCheckInterval: { 
          type: "integer", 
          minimum: 1000, 
          default: 30000,
          description: "Health check interval"
        },
      },
      additionalProperties: false
    },
  },
  additionalProperties: false
};
```

---

### The `qi/core/src/services/base`

#### `qi/core/src/services/base/types.ts`

```typescript
/**
 * @fileoverview Base Redis service types
 * @module @qi/core/services/redis/base/types
 * @description Defines core interfaces for Redis service functionality including
 * connection management, events, and operations.
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 */

import type { Redis as RedisClient } from "ioredis";

/**
 * Redis service event handler types
 * Maps event names to handler function signatures
 * 
 * @interface
 */
export interface RedisServiceEvents {
  connect: () => void;
  error: (error: Error) => void;
  close: () => void;
  reconnecting: (attempt: number) => void;
}

/**
 * Core Redis service interface
 * Defines base functionality required by all Redis clients
 * 
 * @interface
 */
export interface RedisBaseService {
  getClient(): RedisClient;
  ping(): Promise<boolean>;
  close(): Promise<void>;
  on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void;
}
```

---

#### `qi/core/src/services/redis/base/client.ts`

```typescript
/**
 * @fileoverview Base Redis client implementation
 * @module @qi/core/services/redis/base/client
 * @description Implements core Redis functionality including connection management,
 * health checks, error handling, and event handling.
 * 
 * @see {@link RedisBaseService} for interface definition
 * @see {@link RedisError} for error handling
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */

import type { Redis as RedisClient } from "ioredis";
import { RedisError, REDIS_ERROR_CODES } from "../errors.js";
import { RedisServiceEvents, RedisBaseService } from "./types.js";
import { retryOperation } from "@qi/core/utils";
import { Logger } from "winston";

/**
 * Base Redis client implementation
 * Handles core Redis operations and connection lifecycle
 * 
 * @implements {RedisBaseService}
 * @class
 */
export class RedisBaseClient implements RedisBaseService {
  private client: RedisClient;
  private isConnected: boolean = false;
  private readonly logger: Logger;

  /**
   * Creates new Redis base client instance
   * 
   * @param {RedisClient} client - IoRedis client instance
   * @param {Logger} logger - Winston logger instance
   */
  constructor(client: RedisClient, logger: Logger) {
    this.client = client;
    this.logger = logger;
    this.setupListeners();
  }

  /**
   * Initializes Redis event listeners
   * Tracks connection state and logs events
   * 
   * @private
   */
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

  /**
   * Waits for Redis connection with timeout
   * Used during initialization and reconnection
   * 
   * @private
   * @returns {Promise<void>} Resolves when connected
   * @throws {RedisError} On connection timeout or failure
   */
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

  /**
   * Gets underlying Redis client if connected
   * 
   * @returns {RedisClient} Redis client instance
   * @throws {RedisError} If not connected
   */
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

  /**
   * Checks connection health with retries
   * 
   * @returns {Promise<boolean>} True if healthy
   * @throws {RedisError} After max retries
   */
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
          },
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

  /**
   * Closes Redis connection gracefully
   * 
   * @returns {Promise<void>} Resolves when closed
   * @throws {RedisError} On close failure
   */
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

  /**
   * Registers Redis event listener
   * 
   * @param {E} event - Event name
   * @param {RedisServiceEvents[E]} listener - Event handler
   */
  public on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void {
    this.client.on(event, listener);
  }
}
```
---

### The `qi/core/src/services/redis/app`

#### `qi/core/src/services/redis/app/types.ts`

```typescript
/**
 * @fileoverview Application Redis service types
 * @module @qi/core/services/redis/app/types
 * @description Defines application-level Redis service interfaces extending base functionality
 * with business features.
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */

import { RedisBaseService } from "../base/types.js";
import { RedisPoolConfig } from "../config/types.js";

/**
 * Application Redis service interface
 * Extends base service with business features
 * 
 * @extends {RedisBaseService}
 * @interface
 */
export interface RedisAppService extends RedisBaseService {
  /**
   * Gets value with automatic key prefixing
   * 
   * @param {string} key - Redis key
   * @returns {Promise<string|null>} Value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Gets current pool configuration
   * 
   * @returns {RedisPoolConfig|undefined} Pool config if exists
   */
  getPoolConfig(): RedisPoolConfig | undefined;
}
```

---

#### `qi/core/src/services/redis/app/client.ts`

```typescript
/**
 * @fileoverview Application Redis client implementation
 * @module @qi/core/services/redis/app/client
 * @description Implements application-level Redis client with business features
 * like key prefixing and pool configuration.
 * 
 * @see {@link RedisAppService} for interface definition
 * @see {@link RedisBaseClient} for base implementation
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-25
 */

import { RedisConfig } from "../config/types.js";
import { RedisAppService } from "./types.js";
import { RedisServiceEvents } from "../base/types.js";
import { RedisBaseClient } from "../base/client.js";

/**
 * Application Redis client implementation
 * Adds business features to base Redis functionality
 * 
 * @implements {RedisAppService}
 * @class
 */
export class RedisAppClient implements RedisAppService {
  private readonly baseClient: RedisBaseClient;
  private readonly config: RedisConfig;
  private readonly poolName: string;

  /**
   * Creates new application Redis client
   * 
   * @param {RedisBaseClient} baseClient - Base Redis client
   * @param {RedisConfig} config - Redis configuration
   * @param {string} [poolName=default] - Connection pool name
   */
  constructor(
    baseClient: RedisBaseClient,
    config: RedisConfig,
    poolName: string = "default"
  ) {
    this.baseClient = baseClient;
    this.config = config;
    this.poolName = poolName;
  }

  /**
   * Gets underlying Redis client instance
   * Delegates to base client
   * 
   * @returns {RedisClient} Redis client instance
   * @throws {RedisError} If not connected
   */
  public getClient() {
    return this.baseClient.getClient();
  }

  /**
   * Checks connection health
   * Delegates to base client
   * 
   * @returns {Promise<boolean>} True if healthy
   * @throws {RedisError} After max retries
   */
  public async ping(): Promise<boolean> {
    return this.baseClient.ping();
  }

  /**
   * Closes Redis connection
   * Delegates to base client
   * 
   * @returns {Promise<void>} Resolves when closed
   * @throws {RedisError} On close failure
   */
  public async close(): Promise<void> {
    return this.baseClient.close();
  }

  /**
   * Registers Redis event listener
   * Delegates to base client
   * 
   * @param {E} event - Event name
   * @param {RedisServiceEvents[E]} listener - Event handler
   */
  public on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void {
    this.baseClient.on(event, listener);
  }

  /**
   * Gets Redis value with automatic key prefixing
   * Applies configured prefix to key before access
   * 
   * @param {string} key - Redis key
   * @returns {Promise<string|null>} Value or null if not found
   * @throws {RedisError} On Redis operation failure
   */
  public async get(key: string): Promise<string | null> {
    const client = this.baseClient.getClient();
    const prefixedKey = this.getPrefixedKey(key);
    return client.get(prefixedKey);
  }

  /**
   * Applies configured prefix to Redis key
   * 
   * @private
   * @param {string} key - Original key
   * @returns {string} Key with prefix applied
   */
  private getPrefixedKey(key: string): string {
    const prefix = this.config.features?.keyPrefix ?? "";
    return `${prefix}${key}`;
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