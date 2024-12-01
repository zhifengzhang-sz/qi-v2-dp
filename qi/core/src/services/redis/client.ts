/**
 * @fileoverview Redis client implementation
 * @module @qi/core/services/redis/client
 *
 * @description
 * Provides a Redis client implementation that integrates with the service
 * configuration system. Uses ioredis for Redis operations.
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
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

  /**
   * Creates a new Redis client instance
   *
   * @param config - Redis configuration from service config
   */
  constructor(config: RedisClientConfig) {
    this.config = config;

    this.client = new Redis({
      host: config.connection.getHost(),
      port: config.connection.getPort(),
      // Parse password from connection string for security
      password: new URL(config.connection.getConnectionString()).password,
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
}
