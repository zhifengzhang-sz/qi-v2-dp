1. `qi/core/src/services/redis/types.ts`:
```ts
/**
 * @fileoverview Redis service type definitions
 * @module @qi/core/services/redis/types
 *
 * @description
 * Defines TypeScript interfaces for Redis client configuration and operations.
 * Extends the base service configuration with Redis-specific options.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { DatabaseConfigs } from "../config/types.js";
  
/**
 * Base Redis configuration from service config
 * Extracted from DatabaseConfigs to allow extension
 */
export interface BaseRedisConfig {
  host: string;
  port: number;
  password?: string;
  maxRetries: number;
}
  
/**
 * Redis client configuration
 * Extends the base Redis configuration with client-specific options
 */
export interface RedisConfig extends BaseRedisConfig {
  // Optional Redis-specific additions
  poolSize?: number;
  commandTimeout?: number;
  keyPrefix?: string;
}
  
/**
 * Type assertion to ensure BaseRedisConfig matches DatabaseConfigs["redis"]
 */
type ValidateRedisConfig = DatabaseConfigs["redis"] extends BaseRedisConfig
  ? true
  : "BaseRedisConfig must match DatabaseConfigs['redis']";
  
// Using const assertion to validate at compile time without runtime overhead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _: ValidateRedisConfig = true as const;
  
```  
  
2. `qi/core/src/services/redis/client.ts`:
```ts
/**
 * @fileoverview Redis client implementation
 * @module @qi/core/services/redis/client
 *
 * @description
 * Provides a simplified Redis client implementation that handles connection
 * management, basic operations, and error handling. Uses the ioredis library
 * for Redis operations.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { Redis } from "ioredis";
import { ApplicationError, ErrorCode, ErrorDetails } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { RedisConfig } from "./types.js";
import { retryOperation } from "@qi/core/utils";
  
export class RedisClient {
  private client: Redis;
  private readonly config: RedisConfig;
  
  /**
   * Creates a new Redis client instance
   *
   * @param config - Redis configuration
   */
  constructor(config: RedisConfig) {
    this.config = config;
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      maxRetriesPerRequest: config.maxRetries,
      retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 3000);
        logger.debug("Redis retry", { attempt: times, delay });
        return delay;
      },
      keyPrefix: config.keyPrefix,
      commandTimeout: config.commandTimeout,
    });
  
    this.setupListeners();
  }
  
  /**
   * Sets up Redis event listeners
   *
   * @private
   */
  private setupListeners(): void {
    this.client.on("connect", () => {
      logger.info("Redis connected", {
        host: this.config.host,
        port: this.config.port,
      });
    });
  
    this.client.on("error", (error) => {
      logger.error("Redis error", {
        error: error.message,
        host: this.config.host,
        port: this.config.port,
      });
    });
  
    this.client.on("close", () => {
      logger.info("Redis connection closed");
    });
  }
  
  /**
   * Checks Redis connection health
   *
   * @returns Promise resolving to true if healthy
   * @throws ApplicationError if ping fails
   */
  async ping(): Promise<boolean> {
    try {
      const result = await retryOperation(() => this.client.ping(), {
        retries: this.config.maxRetries,
        minTimeout: 1000,
        onRetry: (times) => {
          logger.debug("Retrying Redis ping", { attempt: times });
        },
      });
      return result === "PONG";
    } catch (error) {
      const details: ErrorDetails = {
        operation: "ping",
        host: this.config.host,
        port: this.config.port,
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Redis ping failed",
        ErrorCode.PING_ERROR,
        500,
        details
      );
    }
  }
  
  /**
   * Closes Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.client.quit();
      logger.info("Redis connection closed gracefully");
    } catch (error) {
      const details: ErrorDetails = {
        operation: "close",
        host: this.config.host,
        port: this.config.port,
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Failed to close Redis connection",
        ErrorCode.CONNECTION_ERROR,
        500,
        details
      );
    }
  }
  
  /**
   * Gets a value from Redis
   *
   * @param key - Key to retrieve
   * @returns Promise resolving to value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      const details: ErrorDetails = {
        operation: "get",
        key,
        host: this.config.host,
        port: this.config.port,
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Redis get operation failed",
        ErrorCode.OPERATION_ERROR,
        500,
        details
      );
    }
  }
  
  /**
   * Sets a value in Redis
   *
   * @param key - Key to set
   * @param value - Value to set
   * @returns Promise resolving to OK on success
   */
  async set(key: string, value: string): Promise<"OK"> {
    try {
      return await this.client.set(key, value);
    } catch (error) {
      const details: ErrorDetails = {
        operation: "set",
        key,
        host: this.config.host,
        port: this.config.port,
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Redis set operation failed",
        ErrorCode.OPERATION_ERROR,
        500,
        details
      );
    }
  }
  
  /**
   * Deletes a key from Redis
   *
   * @param key - Key to delete
   * @returns Promise resolving to number of keys deleted
   */
  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      const details: ErrorDetails = {
        operation: "del",
        key,
        host: this.config.host,
        port: this.config.port,
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Redis delete operation failed",
        ErrorCode.OPERATION_ERROR,
        500,
        details
      );
    }
  }
}
  
```  
  
2. `qi/core/src/services/redis/index.ts`:
```ts
/**
 * @fileoverview Redis service module entry point
 * @module @qi/core/services/redis
 *
 * @description
 * Exports Redis client and configuration types.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
export { RedisClient } from "./client.js";
export type { RedisConfig } from "./types.js";
  
```  
  