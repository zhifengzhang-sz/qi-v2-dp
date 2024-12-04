/**
 * @fileoverview Redis Service Application
 * @module qi/app/src/services/redis
 *
 * @description
 * Application integration for Redis service. Provides a high-level interface
 * for Redis operations with features like health monitoring and connection management.
 *
 * Features:
 * - Integration with service configuration
 * - Singleton Redis service management
 * - Health monitoring
 * - Connection lifecycle management
 * - Type-safe Redis operations
 *
 * @example Basic Usage
 * ```typescript
 * import { initialize } from 'qi/app/src/services/redis';
 *
 * // Initialize Redis
 * const service = await initialize();
 * const client = service.getClient();
 * await client.set('key', 'value');
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-01
 */

import { RedisService } from "@qi/core/services/redis";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { Redis } from "ioredis";

// Extract config type from RedisService using TypeScript utility types
type RedisServiceConfig = ConstructorParameters<typeof RedisService>[0];

const DEFAULT_OPTIONS = {
  keyPrefix: "qi:",
  commandTimeout: 5000,
} as const;

const DEFAULT_HEALTH_CHECK_CONFIG = {
  enabled: true,
  interval: 30000,
  timeout: 5000,
  retries: 3,
} as const;

export const DEFAULT_REDIS_OPTIONS = {
  enabled: true,
  options: DEFAULT_OPTIONS,
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
} as const;

/**
 * Redis service singleton instance
 * @private
 */
let redisService: RedisService | undefined;

/**
 * Initializes Redis service using application configuration.
 *
 * @async
 * @function
 * @param {Partial<typeof DEFAULT_REDIS_OPTIONS>} [options] - Optional Redis configuration
 * @returns {Promise<RedisService>} Initialized Redis service
 * @throws {ApplicationError} If initialization fails
 */
export async function initialize(
  options: Partial<typeof DEFAULT_REDIS_OPTIONS> = {}
): Promise<RedisService> {
  try {
    if (redisService) {
      return redisService;
    }

    const services = await initializeConfig();

    const config: RedisServiceConfig = {
      enabled: options.enabled ?? DEFAULT_REDIS_OPTIONS.enabled,
      connection: services.databases.redis,
      options: {
        ...DEFAULT_REDIS_OPTIONS.options,
        ...options.options,
      },
      healthCheck: {
        ...DEFAULT_REDIS_OPTIONS.healthCheck,
        ...options.healthCheck,
      },
    };

    redisService = new RedisService(config);

    logger.debug("Initializing Redis service with configuration:", {
      host: services.databases.redis.getHost(),
      port: services.databases.redis.getPort(),
      keyPrefix: config.options?.keyPrefix,
      healthCheckEnabled: config.healthCheck?.enabled,
    });

    await redisService.connect();

    logger.info("Redis service initialized successfully", {
      host: services.databases.redis.getHost(),
      port: services.databases.redis.getPort(),
    });

    return redisService;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize Redis service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}

/**
 * Gets the Redis service instance.
 *
 * @function
 * @returns {RedisService} The Redis service instance
 * @throws {ApplicationError} If service is not initialized
 */
export function getService(): RedisService {
  if (!redisService) {
    throw new ApplicationError(
      "Redis service not initialized. Call initialize() first.",
      ErrorCode.SERVICE_NOT_INITIALIZED,
      500
    );
  }
  return redisService;
}

/**
 * Gets the Redis client instance from the service.
 *
 * @function
 * @returns {Redis} Redis client instance
 * @throws {ApplicationError} If service is not initialized
 */
export function getClient(): Redis {
  return getService().getClient();
}

/**
 * Closes the Redis service.
 *
 * @async
 * @function
 */
export async function close(): Promise<void> {
  if (redisService) {
    await redisService.disconnect();
    redisService = undefined;
  }
}

export type { RedisService };
