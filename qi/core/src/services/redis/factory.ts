/**
 * @fileoverview Redis Client Factory Implementation
 * @module @qi/core/services/redis/factory
 * @description Implements Redis client creation with configuration validation,
 * connection management, and pool setup. Provides factory methods for creating
 * properly configured Redis clients with error handling.
 *
 * @see {@link RedisAppService} for service interface
 * @see {@link RedisConfig} for configuration options
 *
 * @author Zhifeng Zhang
 * @created 2024-11-26
 * @modified 2024-11-28
 */

import { Redis, RedisOptions } from "ioredis";
import { Schema } from "@qi/core/config";
import { RedisBaseClient } from "./base/client.js";
import { RedisAppClient } from "./app/client.js";
import { RedisConfig } from "./config/types.js";
import { redisConfigSchema } from "./config/schema.js";
import { RedisError } from "./errors.js";
import type { RedisFactoryOptions } from "./index.js";
import {
  DEFAULT_POOL_NAME,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_DELAY,
  DEFAULT_COMMAND_TIMEOUT,
} from "./index.js";
import { retryOperation } from "@qi/core/utils";
import { logger as defaultLogger } from "@qi/core/logger";

/**
 * Validates Redis configuration against schema
 *
 * @private
 * @param {RedisConfig} config - Configuration to validate
 * @throws {RedisError} If validation fails
 */
const validateConfig = (config: RedisConfig): void => {
  try {
    const schema = new Schema({ formats: true });
    schema.registerSchema("redis-config", redisConfigSchema);
    schema.validate(config, "redis-config");
  } catch (error) {
    throw RedisError.configurationError("Invalid Redis configuration", {
      error: error instanceof Error ? error.message : String(error),
      schemaId: "redis-config",
    });
  }
};

/**
 * Creates Redis client options from configuration and factory options
 *
 * @private
 * @param {RedisConfig} config - Redis configuration
 * @param {RedisFactoryOptions} options - Factory options
 * @returns {RedisOptions} IoRedis client options
 * @throws {RedisError} If pool configuration is invalid or missing
 */
const createClientOptions = (
  config: RedisConfig,
  options: RedisFactoryOptions
): RedisOptions => {
  const poolName = options.poolName || DEFAULT_POOL_NAME;
  const poolConfig = config.pools?.[poolName];

  if (!poolConfig) {
    throw RedisError.configurationError(
      `Pool configuration not found: ${poolName}`,
      {
        poolName,
        operation: "createClientOptions",
      }
    );
  }

  return {
    // Connection
    host: options.host || "localhost",
    port: options.port || 6379,
    connectTimeout: options.connectTimeout || DEFAULT_COMMAND_TIMEOUT,
    password: options.password,
    db: options.db || 0,

    // Retry settings
    maxRetriesPerRequest: config.retry?.maxAttempts || DEFAULT_RETRY_ATTEMPTS,
    retryStrategy: (times: number) => {
      const delay =
        (config.retry?.initialDelayMs || DEFAULT_RETRY_DELAY) *
        Math.pow(2, times - 1);
      return Math.min(delay, config.retry?.maxDelayMs || Infinity);
    },

    // Features
    enableOfflineQueue: options.enableOfflineQueue ?? true,
    keyPrefix: config.features?.keyPrefix || "",
    commandTimeout: config.features?.commandTimeout || DEFAULT_COMMAND_TIMEOUT,
    autoResubscribe: true,
    autoResendUnfulfilledCommands: true,

    // Connection management
    keepAlive: config.features?.keepAlive || 0,
    connectionName: `${poolName}-pool`,
  };
};

/**
 * Creates and initializes a new Redis client instance with retry
 *
 * @private
 * @param {RedisConfig} config - Redis configuration
 * @param {RedisFactoryOptions} options - Factory options
 * @returns {Promise<Redis>} Connected Redis client
 * @throws {RedisError} If connection fails after retries
 */
const createRedisConnection = async (
  config: RedisConfig,
  options: RedisFactoryOptions
): Promise<Redis> => {
  const clientOptions = createClientOptions(config, options);
  const logger = options.logger || defaultLogger;

  return await retryOperation(
    async () => {
      const client = new Redis(clientOptions);
      await client.ping(); // Verify connection
      return client;
    },
    {
      retries: config.retry?.maxAttempts || DEFAULT_RETRY_ATTEMPTS,
      minTimeout: config.retry?.initialDelayMs || DEFAULT_RETRY_DELAY,
      onRetry: (times: number) => {
        logger.warn("Retrying Redis connection", {
          attempt: times,
          host: clientOptions.host,
          port: clientOptions.port,
        });
      },
    }
  ).catch((error) => {
    throw RedisError.connectionError("Failed to establish Redis connection", {
      operation: "createConnection",
      error: error instanceof Error ? error.message : String(error),
      host: clientOptions.host,
      port: clientOptions.port,
    });
  });
};

/**
 * Creates and initializes a new Redis client instance
 *
 * @param {RedisConfig} config - Redis configuration
 * @param {RedisFactoryOptions} [options={}] - Factory options
 * @returns {Promise<RedisAppClient>} Configured Redis client
 * @throws {RedisError} If creation or connection fails
 */
export const createClient = async (
  config: RedisConfig,
  options: RedisFactoryOptions = {}
): Promise<RedisAppClient> => {
  const logger = options.logger || defaultLogger;

  try {
    // Validate configuration
    validateConfig(config);

    // Create Redis client with retry
    const redisClient = await createRedisConnection(config, options);

    // Create base client
    const baseClient = new RedisBaseClient(redisClient, logger);

    // Create and return app client
    return new RedisAppClient(
      baseClient,
      config,
      options.poolName || DEFAULT_POOL_NAME
    );
  } catch (error) {
    // If it's already a RedisError, rethrow it
    if (error instanceof RedisError) {
      throw error;
    }

    // Otherwise wrap it in a RedisError
    throw RedisError.clientError("Failed to create Redis client", {
      operation: "createClient",
      error: error instanceof Error ? error.message : String(error),
      poolName: options.poolName || DEFAULT_POOL_NAME,
    });
  }
};

// Export the factory function
export const createRedisClient = createClient;
