/**
 * @fileoverview Redis service type definitions
 * @module @qi/core/services/redis/types
 *
 * @description
 * Defines TypeScript interfaces for Redis client configuration and operations.
 * Extends the service configuration with Redis-specific options.
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

import type { RedisConnection } from "../config/dsl.js";

/**
 * Extended Redis configuration for client
 * Adds client-specific options to base service config
 */
export interface RedisClientConfig {
  /** Base configuration from services config */
  connection: RedisConnection;
  /** Optional client-specific settings */
  options?: {
    /** Connection pool size */
    poolSize?: number;
    /** Command timeout in milliseconds */
    commandTimeout?: number;
    /** Key prefix for namespacing */
    keyPrefix?: string;
  };
}
