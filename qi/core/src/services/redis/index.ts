/**
 * @fileoverview Redis Service Module Entry Point
 * @module @qi/core/services/redis
 *
 * @description
 * Exports Redis service components including clients, configuration,
 * error handling, and types. This is the main entry point for the Redis module.
 * Provides a comprehensive Redis client implementation with configuration management,
 * connection pooling, and error handling.
 *
 * Key features:
 * - Type-safe Redis client implementation
 * - Configuration management with validation
 * - Connection pooling and lifecycle management
 * - Structured error handling
 * - Event monitoring and health checks
 * - Automatic retry handling
 *
 * @example Basic Usage
 * ```typescript
 * import { createRedisClient } from '@qi/core/services/redis';
 *
 * const client = await createRedisClient({
 *   pools: {
 *     default: { min: 1, max: 10 }
 *   },
 *   features: {
 *     keyPrefix: "app:",
 *     enableAutoPipelining: true
 *   }
 * });
 *
 * // Use the client
 * await client.ping();
 * const value = await client.get("key");
 * await client.close();
 * ```
 *
 * @example Custom Pool Configuration
 * ```typescript
 * const client = await createRedisClient({
 *   pools: {
 *     custom: {
 *       min: 5,
 *       max: 20,
 *       acquireTimeoutMillis: 30000
 *     }
 *   }
 * }, {
 *   poolName: "custom",
 *   logger: customLogger,
 *   connectTimeout: 5000
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-26
 * @modified 2024-11-28
 */

import type { Logger } from "winston";
import { RedisPoolConfig } from "./config/types.js";
import { createClient } from "./factory.js";

// Base client exports
export { RedisBaseClient } from "./base/client.js";
export type { RedisBaseService, RedisServiceEvents } from "./base/types.js";

// Application client exports
export { RedisAppClient } from "./app/client.js";
export type { RedisAppService } from "./app/types.js";

// Configuration exports
export type {
  RedisConfig,
  RedisPoolConfig,
  RedisRetryStrategy,
} from "./config/types.js";
export { redisConfigSchema } from "./config/schema.js";

// Error handling exports
export { RedisError } from "./errors.js";
export type { RedisErrorDetails, SchemaValidationError } from "./errors.js";

/**
 * Options for Redis client creation
 *
 * @interface RedisFactoryOptions
 * @property {string} [host="localhost"] - Redis server host
 * @property {number} [port=6379] - Redis server port
 * @property {string} [poolName="default"] - Name of the connection pool to use
 * @property {Logger} [logger] - Custom logger instance
 * @property {number} [connectTimeout] - Connection timeout in milliseconds
 * @property {boolean} [enableOfflineQueue=true] - Whether to queue commands when connection is lost
 * @property {string} [password] - Redis authentication password
 * @property {number} [db=0] - Redis database number
 */
export interface RedisFactoryOptions {
  host?: string;
  port?: number;
  poolName?: string;
  logger?: Logger;
  connectTimeout?: number;
  enableOfflineQueue?: boolean;
  password?: string;
  db?: number;
}

/**
 * Creates a new Redis client with the specified configuration and options.
 *
 * @async
 * @function createRedisClient
 * @param {RedisConfig} config - Redis configuration including pools, retry strategy, and features
 * @param {RedisFactoryOptions} [options] - Additional factory options
 * @returns {Promise<RedisAppService>} Configured Redis client instance
 *
 * @throws {RedisError}
 *  - ConfigurationError: If config validation fails
 *  - ConnectionError: If initial connection fails
 *  - TimeoutError: If connection times out
 */
export const createRedisClient = createClient;

/**
 * Default configuration values
 */
export const DEFAULT_POOL_NAME = "default";
export const DEFAULT_RETRY_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAY = 1000;
export const DEFAULT_COMMAND_TIMEOUT = 5000;

/**
 * Default pool configuration
 * Used when no specific pool configuration is provided
 */
export const DEFAULT_POOL_CONFIG: RedisPoolConfig = {
  min: 1,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 5000,
  idleTimeoutMillis: 60000,
};
