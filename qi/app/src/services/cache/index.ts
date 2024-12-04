/**
 * @fileoverview Cache Service Application
 * @module qi/app/src/services/cache
 *
 * @description
 * Application integration for Cache service. Provides a high-level interface
 * for caching operations by combining service configuration with the Cache
 * implementation from @qi/core.
 *
 * Features:
 * - Automatic storage selection based on environment
 * - Redis integration for production environments
 * - In-memory storage for development
 * - Configurable TTL and key prefixing
 * - Type-safe cache operations
 *
 * @example Basic Usage
 * ```typescript
 * import { initialize } from 'qi/app/src/services/cache';
 *
 * const cache = await initialize();
 * await cache.set('key', 'value');
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 */

import { Cache, type CacheOptions } from "@qi/core/cache";
import { getService as getRedisService } from "../redis/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { initializeConfig } from "../config/index.js";
import { logger } from "@qi/core/logger";

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
    if (cacheClient) {
      return cacheClient;
    }

    const services = await initializeConfig();
    const isProduction = process.env.NODE_ENV === "production";
    const storage = isProduction ? "redis" : "memory";

    logger.debug("Initializing cache service", {
      storage,
      prefix: options.prefix || DEFAULT_CACHE_OPTIONS.prefix,
      ttl: options.ttl || DEFAULT_CACHE_OPTIONS.ttl,
    });

    const config: CacheOptions = {
      storage,
      prefix: options.prefix || DEFAULT_CACHE_OPTIONS.prefix,
      ttl: options.ttl || DEFAULT_CACHE_OPTIONS.ttl,
    };

    if (config.storage === "redis") {
      if (!services.databases.redis) {
        throw new ApplicationError(
          "Redis configuration missing",
          ErrorCode.CONFIGURATION_ERROR,
          500
        );
      }

      // Get Redis service and its client
      const redisService = getRedisService();
      config.redis = redisService.getClient();

      logger.debug("Using Redis storage for cache", {
        host: services.databases.redis.getHost(),
        port: services.databases.redis.getPort(),
      });
    }

    cacheClient = new Cache(config);

    // Verify cache is working
    if (config.storage === "redis") {
      await cacheClient.set("__test__", "test");
      await cacheClient.delete("__test__");
    }

    logger.info("Cache service initialized successfully", {
      storage,
      prefix: config.prefix,
    });

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
      ErrorCode.SERVICE_NOT_INITIALIZED,
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

export type { CacheOptions } from "@qi/core/cache";
