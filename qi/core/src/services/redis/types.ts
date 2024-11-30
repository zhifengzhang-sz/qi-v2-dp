/**
 * @fileoverview Redis service type definitions
 * @module @qi/core/services/redis/types
 *
 * @description
 * Defines TypeScript interfaces for Redis client configuration and operations.
 * Extends the base service configuration with Redis-specific options.
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-30
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { DatabaseConfigs } from "../config/types.js";

/**
 * Base Redis configuration from service config
 * Extracted from DatabaseConfigs to allow extension
 */
export interface BaseRedisConfig {
  host: string;
  port: number;
  password?: string;
  maxRetries: number;
}

/**
 * Redis client configuration
 * Extends the base Redis configuration with client-specific options
 */
export interface RedisConfig extends BaseRedisConfig {
  // Optional Redis-specific additions
  poolSize?: number;
  commandTimeout?: number;
  keyPrefix?: string;
}

/**
 * Type assertion to ensure BaseRedisConfig matches DatabaseConfigs["redis"]
 */
type ValidateRedisConfig = DatabaseConfigs["redis"] extends BaseRedisConfig
  ? true
  : "BaseRedisConfig must match DatabaseConfigs['redis']";

// Using const assertion to validate at compile time without runtime overhead
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _: ValidateRedisConfig = true as const;
