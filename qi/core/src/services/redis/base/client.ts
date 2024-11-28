/**
 * @fileoverview Base Redis client implementation
 * @module @qi/core/services/redis/base/client
 *
 * @description
 * Implements core Redis functionality including connection management,
 * health checks, error handling, and event handling. This base implementation
 * provides foundational Redis operations and lifecycle management that can
 * be extended by specific client implementations.
 *
 * Key features:
 * - Connection lifecycle management
 * - Health check/ping functionality
 * - Event handling and monitoring
 * - Connection state tracking
 * - Error handling and retry logic
 *
 * @example
 * ```typescript
 * const client = new RedisBaseClient(redisClient, logger);
 *
 * // Monitor connection events
 * client.on('connect', () => console.log('Connected'));
 * client.on('error', (err) => console.error('Error:', err));
 *
 * // Check health
 * const isHealthy = await client.ping();
 *
 * // Graceful shutdown
 * await client.close();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-28
 */

import type { Redis as RedisClient } from "ioredis";
import { RedisError } from "../errors.js";
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
      this.logger.info("Redis connected");
    });

    this.client.on("error", (error) => {
      this.logger.error("Redis error occurred", {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    this.client.on("close", () => {
      this.isConnected = false;
      this.logger.info("Redis connection closed");
    });

    this.client.on("reconnecting", (attempt: number) => {
      this.logger.info("Redis reconnecting", { attempt });
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
          RedisError.timeoutError("Connection timeout", {
            operation: "connect",
            timeout: 5000,
          })
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
          RedisError.connectionError("Failed to establish connection", {
            operation: "connect",
            error: error instanceof Error ? error.message : String(error),
          })
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
      throw RedisError.clientError("Client not connected", {
        operation: "getClient",
      });
    }
    return this.client;
  }

  /**
   * Checks connection health with retries
   * Attempts to ping Redis server to verify connectivity
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
          this.logger.debug("Attempting ping", { attempt: attemptCount });
          return await this.client.ping();
        },
        {
          retries: 3,
          minTimeout: 1000,
          onRetry: (times: number) => {
            this.logger.debug("Retrying ping", { attempt: times });
          },
        }
      );
      return result === "PONG";
    } catch (error) {
      throw RedisError.operationError("Ping failed", {
        operation: "ping",
        attempt: attemptCount,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Closes Redis connection gracefully
   * Ensures proper cleanup of resources and event handlers
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
      throw RedisError.operationError("Failed to close connection", {
        operation: "close",
        error: error instanceof Error ? error.message : String(error),
      });
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
