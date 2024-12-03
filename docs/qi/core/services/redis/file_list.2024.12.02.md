1. `qi/core/src/services/redis/types.ts`:
```ts
/**
 * @fileoverview Redis service type definitions
 * @module @qi/core/services/redis/types
 *
 * @description
 * Defines TypeScript interfaces for Redis client configuration and operations.
 * Extends the service configuration with Redis-specific options.
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */
  
import type { RedisConnection } from "../config/dsl.js";
  
/**
 * Extended Redis configuration for client
 * Adds client-specific options to base service config
 */
export interface RedisClientConfig {
  /** Base configuration from services config */
  connection: RedisConnection;
  /** Optional client-specific settings */
  options?: {
    /** Connection pool size */
    poolSize?: number;
    /** Command timeout in milliseconds */
    commandTimeout?: number;
    /** Key prefix for namespacing */
    keyPrefix?: string;
  };
}
  
```  
  
2. `qi/core/src/services/redis/client.ts`:
```ts
/**
 * @fileoverview Redis client implementation
 * @module @qi/core/services/redis/client
 *
 * @description
 * Provides a Redis client implementation that integrates with the service
 * configuration system. Uses ioredis for Redis operations.
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-02
 * @created 2024-11-29
 */
  
import { Redis } from "ioredis";
import { ApplicationError, ErrorCode, ErrorDetails } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { retryOperation } from "@qi/core/utils";
import type { RedisClientConfig } from "./types.js";
  
export class RedisClient {
  private client: Redis;
  private readonly config: RedisClientConfig;
  
  constructor(config: RedisClientConfig) {
    this.config = config;
  
    this.client = new Redis({
      host: config.connection.getHost(),
      port: config.connection.getPort(),
      password: this.extractPassword(config.connection.getConnectionString()),
      maxRetriesPerRequest: config.connection.getMaxRetries(),
      retryStrategy: (times) => {
        const delay = Math.min(times * 1000, 3000);
        logger.debug("Redis retry", { attempt: times, delay });
        return delay;
      },
      keyPrefix: config.options?.keyPrefix,
      commandTimeout: config.options?.commandTimeout,
    });
  
    this.setupListeners();
  }
  
  private extractPassword(connectionString: string): string {
    // Extract password from redis://:password@host:port format
    try {
      const matches = connectionString.match(/redis:\/\/:([^@]+)@/);
      if (matches && matches[1]) {
        return decodeURIComponent(matches[1]);
      }
      // Fallback: try to parse as URL
      const url = new URL(connectionString);
      if (url.password) {
        return decodeURIComponent(url.password);
      }
      throw new Error("No password found in connection string");
    } catch (error) {
      throw new ApplicationError(
        "Invalid Redis connection string",
        ErrorCode.REDIS_CONFIG_INVALID,
        500,
        { error: String(error) }
      );
    }
  }
  
  /**
   * Sets up Redis event listeners
   */
  private setupListeners(): void {
    this.client.on("connect", () => {
      logger.info("Redis connected", {
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
      });
    });
  
    this.client.on("error", (error) => {
      logger.error("Redis error", {
        error: error.message,
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
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
        retries: this.config.connection.getMaxRetries(),
        minTimeout: 1000,
        onRetry: (times) => {
          logger.debug("Retrying Redis ping", { attempt: times });
        },
      });
      return result === "PONG";
    } catch (error) {
      const details: ErrorDetails = {
        operation: "ping",
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
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
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
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
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
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
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
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
   * Deletes one or more keys from Redis
   *
   * @param keys - Keys to delete (can be single key or multiple keys)
   * @returns Promise resolving to number of keys deleted
   */
  async del(...keys: string[]): Promise<number> {
    try {
      return await this.client.del(...keys);
    } catch (error) {
      const details: ErrorDetails = {
        operation: "del",
        keys,
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
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
  
  /**
   * Sets a key with expiration time
   *
   * @param key - Key to set
   * @param seconds - Time to live in seconds
   * @param value - Value to set
   * @returns Promise resolving to OK on success
   * @throws {ApplicationError} If operation fails
   *
   * @example
   * ```typescript
   * // Set key 'session:123' with 1 hour TTL
   * await client.setex('session:123', 3600, JSON.stringify({ userId: 456 }));
   * ```
   */
  async setex(key: string, seconds: number, value: string): Promise<"OK"> {
    try {
      return await this.client.setex(key, seconds, value);
    } catch (error) {
      const details: ErrorDetails = {
        operation: "setex",
        key,
        ttl: seconds,
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Redis setex operation failed",
        ErrorCode.OPERATION_ERROR,
        500,
        details
      );
    }
  }
  
  /**
   * Scans for keys matching a pattern
   *
   * This method safely handles large key spaces by using Redis SCAN command
   * instead of KEYS. It automatically iterates through all matches using
   * the cursor-based scanning mechanism to avoid blocking the server.
   *
   * @param pattern - Pattern to match (e.g. "user:*", "session:*")
   * @returns Promise resolving to array of matching keys
   * @throws {ApplicationError} If scan operation fails
   *
   * @example
   * ```typescript
   * // Find all user-related keys
   * const userKeys = await client.scan("user:*");
   * ```
   *
   * @remarks
   * - Use with caution on large datasets as it needs to scan the entire keyspace
   * - Returns empty array if no keys match
   * - Pattern follows Redis glob-style patterns:
   *   - h?llo matches hello, hallo and hxllo
   *   - h*llo matches hllo and heeeello
   *   - h[ae]llo matches hello and hallo, but not hillo
   */
  async scan(pattern: string): Promise<string[]> {
    try {
      const keys: string[] = [];
      let cursor = 0; // ioredis accepts number for cursor
  
      do {
        // Use correct ioredis scan method signature
        const result = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100
        );
        cursor = parseInt(result[0], 10);
        keys.push(...result[1]);
      } while (cursor !== 0);
  
      return keys;
    } catch (error) {
      const details: ErrorDetails = {
        operation: "scan",
        pattern,
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
        error: error instanceof Error ? error.message : String(error),
      };
  
      throw new ApplicationError(
        "Redis scan operation failed",
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
 * @modified 2024-12-01
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
export { RedisClient } from "./client.js";
export type { RedisClientConfig } from "./types.js";
  
```  
  