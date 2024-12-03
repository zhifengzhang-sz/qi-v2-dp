/**
 * @fileoverview Cache Service Application
 * @module qi/app/src/services/cache
 *
 * @description
 * Application integration for Cache service. Provides a high-level interface
 * for caching operations by combining service configuration with the Cache
 * implementation from @qi/core.
 */

import { Cache, type CacheOptions } from "@qi/core/cache";
import { getClient as getRedisClient } from "../redis/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { initializeConfig } from "../config/index.js";

/**
 * Default cache configuration
 * @const
 */
export const DEFAULT_CACHE_OPTIONS = {
  prefix: "qi:",
  ttl: 3600, // 1 hour default TTL
  maxRetries: 3,
} as const;

/**
 * Cache client singleton instance
 * @private
 */
let cacheClient: Cache | undefined;

/**
 * Initializes Cache service using application configuration.
 *
 * @async
 * @function
 * @param {Partial<typeof DEFAULT_CACHE_OPTIONS>} [options] - Optional cache configuration
 * @returns {Promise<Cache>} Initialized cache client
 * @throws {ApplicationError} If initialization fails
 */
export async function initialize(
  options: Partial<typeof DEFAULT_CACHE_OPTIONS> = {}
): Promise<Cache> {
  try {
    // Only initialize once
    if (cacheClient) {
      return cacheClient;
    }

    // Load service configuration
    const services = await initializeConfig();
    const redisConfig = services.databases.redis;

    // Determine if we're in production by checking NODE_ENV
    const isProduction = process.env.NODE_ENV === "production";

    // Create cache configuration
    const config: CacheOptions = {
      storage: isProduction ? "redis" : "memory",
      prefix: options.prefix || DEFAULT_CACHE_OPTIONS.prefix,
      ttl: options.ttl || DEFAULT_CACHE_OPTIONS.ttl,
    };

    // If using Redis storage, get the Redis client and validate configuration
    if (config.storage === "redis") {
      if (!redisConfig) {
        throw new ApplicationError(
          "Redis configuration missing",
          ErrorCode.CONFIGURATION_ERROR,
          500
        );
      }

      // Get Redis client and access the underlying ioredis instance
      const redisClient = getRedisClient();
      config.redis = redisClient.getRedisInstance();
    }

    // Initialize cache client
    cacheClient = new Cache(config);

    // Test the connection
    if (config.storage === "redis") {
      await cacheClient.set("__test__", "test");
      await cacheClient.delete("__test__");
    }

    return cacheClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize Cache service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
        storage: process.env.NODE_ENV === "production" ? "redis" : "memory",
      }
    );
  }
}

/**
 * Gets the Cache client instance.
 *
 * @function
 * @returns {Cache} The Cache client instance
 * @throws {ApplicationError} If client is not initialized
 */
export function getClient(): Cache {
  if (!cacheClient) {
    throw new ApplicationError(
      "Cache service not initialized. Call initialize() first.",
      ErrorCode.NOT_INITIALIZED,
      500
    );
  }
  return cacheClient;
}

/**
 * Closes the Cache service.
 * For memory cache, this clears all entries.
 * For Redis cache, this is a no-op as Redis connection is managed separately.
 *
 * @async
 * @function
 */
export async function close(): Promise<void> {
  if (cacheClient) {
    await cacheClient.clear();
    cacheClient = undefined;
  }
}

// Re-export types for convenience
export type { CacheOptions } from "@qi/core/cache";
