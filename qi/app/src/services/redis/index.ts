/**
 * @fileoverview Redis Service Application
 * @module qi/app/src/services/redis
 *
 * @description
 * Application integration for Redis service. Provides a high-level interface
 * for Redis operations by combining service configuration with the Redis client
 * implementation from @qi/core.
 *
 * Features:
 * - Integration with service configuration
 * - Singleton Redis client management
 * - Automatic retries and reconnection
 * - Connection health monitoring
 * - Type-safe Redis operations
 *
 * @example Basic Usage
 * ```typescript
 * import { initializeRedis } from 'qi/app/src/services/redis';
 *
 * // Initialize Redis
 * const client = await initializeRedis();
 * await client.set('key', 'value');
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-12-01
 */

import { RedisClient, type RedisClientConfig } from "@qi/core/services/redis";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Default Redis client configuration
 *
 * @const
 */
export const DEFAULT_REDIS_OPTIONS = {
  poolSize: 10,
  commandTimeout: 5000,
  keyPrefix: "qi:",
} as const;

/**
 * Redis client singleton instance
 * @private
 */
let redisClient: RedisClient | undefined;

/**
 * Initializes Redis service using application configuration.
 *
 * @async
 * @function
 * @param {Partial<typeof DEFAULT_REDIS_OPTIONS>} [options] - Optional Redis client configuration
 * @returns {Promise<RedisClient>} Initialized Redis client
 * @throws {ApplicationError} If initialization fails
 */
export async function initialize(
  options: Partial<typeof DEFAULT_REDIS_OPTIONS> = {}
): Promise<RedisClient> {
  try {
    // Only initialize once
    if (redisClient) {
      return redisClient;
    }

    // Get Redis connection configuration from services
    const services = await initializeConfig();

    // Create client configuration
    const config: RedisClientConfig = {
      connection: services.databases.redis,
      options: {
        ...DEFAULT_REDIS_OPTIONS,
        ...options,
      },
    };

    // Initialize and test client
    redisClient = new RedisClient(config);
    await redisClient.ping();

    return redisClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize Redis client",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Gets the Redis client instance.
 *
 * @function
 * @returns {RedisClient} The Redis client instance
 * @throws {ApplicationError} If client is not initialized
 */
export function getClient(): RedisClient {
  if (!redisClient) {
    throw new ApplicationError(
      "Redis client not initialized. Call initialize() first.",
      ErrorCode.NOT_INITIALIZED,
      500
    );
  }
  return redisClient;
}

/**
 * Closes the Redis service.
 *
 * @async
 * @function
 */
export async function close(): Promise<void> {
  if (redisClient) {
    await redisClient.close();
    redisClient = undefined;
  }
}

// Re-export types for convenience
export type { RedisClientConfig } from "@qi/core/services/redis";
