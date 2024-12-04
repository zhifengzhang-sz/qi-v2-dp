/**
 * @fileoverview Redis service implementation with full client compatibility
 * @module @qi/core/services/redis
 *
 * @description
 * Provides a Redis service implementation that wraps the ioredis client while
 * integrating with the service infrastructure. Key features include:
 * - Base service infrastructure integration
 * - Full compatibility with existing cache module
 * - Health monitoring and reporting
 * - Connection lifecycle management
 * - Event handling and logging
 * - Error handling with ApplicationError
 * - Password extraction from connection strings
 *
 * This service maintains API compatibility with modules that expect direct
 * Redis client access while providing additional service-level features.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection,
 *   options: {
 *     keyPrefix: 'app:',
 *     commandTimeout: 5000
 *   }
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * ```
 *
 * @example With Health Checks
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection,
 *   healthCheck: {
 *     enabled: true,
 *     interval: 30000,
 *     timeout: 5000,
 *     retries: 3
 *   }
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 * @modified 2024-12-05
 */

import { Redis } from "ioredis";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { RedisConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Redis service configuration interface
 *
 * @interface RedisServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {RedisConnection} connection - Redis connection configuration
 * @property {Object} [options] - Optional Redis-specific settings
 * @property {string} [options.keyPrefix] - Prefix for all Redis keys
 * @property {number} [options.commandTimeout] - Timeout for Redis commands in ms
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between checks in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for failed checks
 *
 * @example
 * ```typescript
 * const config: RedisServiceConfig = {
 *   enabled: true,
 *   connection: redisConnection,
 *   options: {
 *     keyPrefix: 'myapp:',
 *     commandTimeout: 5000
 *   },
 *   healthCheck: {
 *     enabled: true,
 *     interval: 30000,
 *     timeout: 5000,
 *     retries: 3
 *   }
 * };
 * ```
 */
interface RedisServiceConfig {
  enabled: boolean;
  connection: RedisConnection;
  options?: {
    keyPrefix?: string;
    commandTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

/**
 * Redis service implementation that maintains compatibility with the Cache module
 * while providing service-level features.
 *
 * @class RedisService
 * @extends {BaseServiceClient<RedisServiceConfig>}
 *
 * @example
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * await client.set('key', 'value');
 * ```
 */
export class RedisService extends BaseServiceClient<RedisServiceConfig> {
  /**
   * Underlying Redis client instance
   * @private
   */
  private client: Redis | null = null;

  /**
   * Creates a new Redis service instance
   *
   * @param {RedisServiceConfig} config - Service configuration
   */
  constructor(config: RedisServiceConfig) {
    super(config, "Redis");
  }

  /**
   * Establishes connection to Redis server
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   *
   * @example
   * ```typescript
   * await service.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("Redis service is disabled");
      return;
    }

    try {
      this.client = new Redis({
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
        password: this.getPassword(),
        maxRetriesPerRequest: 3,
        keyPrefix: this.config.options?.keyPrefix,
        commandTimeout: this.config.options?.commandTimeout,
        retryStrategy: (times) => {
          const delay = Math.min(times * 1000, 3000);
          logger.debug("Redis retry", { attempt: times, delay });
          return delay;
        },
      });

      // Set up event handlers
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

      await this.client.ping();
      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to Redis",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Gracefully disconnects from Redis server
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   *
   * @example
   * ```typescript
   * await service.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from Redis",
          ErrorCode.CONNECTION_ERROR,
          500,
          { error: String(error) }
        );
      }
    }
  }

  /**
   * Performs Redis health check
   *
   * @protected
   * @returns {Promise<HealthCheckResult>} Health check result
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.client) {
      return {
        status: "unhealthy",
        message: "Redis client not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const isPing = (await this.client.ping()) === "PONG";
      return {
        status: isPing ? "healthy" : "unhealthy",
        message: isPing ? "Redis is responsive" : "Redis ping failed",
        details: {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gets the Redis client instance
   * This method maintains compatibility with the Cache module
   *
   * @returns {Redis} Redis client instance
   * @throws {ApplicationError} If client is not initialized
   *
   * @example
   * ```typescript
   * const client = service.getClient();
   * await client.set('key', 'value');
   * ```
   */
  getClient(): Redis {
    if (!this.client) {
      throw new ApplicationError(
        "Redis client not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.client;
  }

  /**
   * Extracts password from connection string or returns direct password
   *
   * @private
   * @returns {string} Redis password
   *
   * @example
   * ```typescript
   * // From connection string: redis://:password123@localhost:6379
   * const password = this.getPassword(); // Returns 'password123'
   * ```
   */
  private getPassword(): string {
    const connectionString = this.config.connection.getConnectionString();
    try {
      const matches = connectionString.match(/redis:\/\/:([^@]+)@/);
      if (matches && matches[1]) {
        return decodeURIComponent(matches[1]);
      }
      const url = new URL(connectionString);
      if (url.password) {
        return decodeURIComponent(url.password);
      }
      return this.config.connection.getPassword();
    } catch {
      return this.config.connection.getPassword();
    }
  }
}

export default RedisService;
