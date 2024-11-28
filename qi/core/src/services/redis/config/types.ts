/**
 * @fileoverview Core Redis client configuration types
 * @module @qi/core/services/redis/config/types
 * @description Defines configuration interfaces for Redis client behavior, connection pools,
 * retry strategies, and monitoring features. Focuses on application-level settings rather
 * than connection details.
 *
 * @see {@link JsonSchema} for config validation
 * @see {@link RedisBaseService} for service implementation
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-28
 */

import { BaseConfig } from "@qi/core/config";

/**
 * Redis connection pool configuration
 *
 * @property {number} [min] - Minimum pool size (connections)
 * @property {number} [max] - Maximum pool size (connections)
 * @property {number} [acquireTimeoutMillis] - Max time to wait for connection acquisition
 * @property {number} [createTimeoutMillis] - Max time to wait for connection creation
 * @property {number} [idleTimeoutMillis] - Time before idle connection is destroyed
 * @property {number} [evictionRunIntervalMillis] - Interval to check for idle connections
 * @property {number} [softIdleTimeoutMillis] - Soft timeout for idle connections
 */
export interface RedisPoolConfig {
  min?: number;
  max?: number;
  acquireTimeoutMillis?: number;
  createTimeoutMillis?: number;
  idleTimeoutMillis?: number;
  evictionRunIntervalMillis?: number;
  softIdleTimeoutMillis?: number;
}

/**
 * Retry behavior configuration for failed operations
 *
 * @property {number} [maxAttempts] - Maximum retry attempts before failing
 * @property {number} [initialDelayMs] - Initial delay between retries
 * @property {number} [maxDelayMs] - Maximum delay between retries
 * @property {number} [factorMultiplier] - Exponential backoff multiplier
 */
export interface RedisRetryStrategy {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factorMultiplier?: number;
}

/**
 * Complete Redis application configuration
 * Extends BaseConfig with Redis-specific settings
 *
 * @extends {BaseConfig}
 *
 * @property {Record<string, RedisPoolConfig>} [pools] - Named connection pools
 * @property {RedisRetryStrategy} [retry] - Retry behavior settings
 * @property {object} [features] - Feature flags and settings
 * @property {object} [monitoring] - Monitoring configuration
 */
export interface RedisConfig extends BaseConfig {
  pools?: Record<string, RedisPoolConfig>;
  retry?: RedisRetryStrategy;
  features?: {
    enableAutoPipelining?: boolean;
    enableOfflineQueue?: boolean;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
    keyPrefix?: string;
    commandTimeout?: number;
    keepAlive?: number;
  };
  monitoring?: {
    enableMetrics?: boolean;
    metricsInterval?: number;
    enableHealthCheck?: boolean;
    healthCheckInterval?: number;
  };
}
