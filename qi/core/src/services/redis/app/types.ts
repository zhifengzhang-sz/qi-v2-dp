/**
 * @fileoverview Application Redis service types
 * @module @qi/core/services/redis/app/types
 * @description Defines application-level Redis service interfaces extending base functionality
 * with business features.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-28
 */

import { RedisBaseService } from "../base/types.js";
import { RedisPoolConfig } from "../config/types.js";

/**
 * Application Redis service interface
 * Extends base service with business features
 *
 * @extends {RedisBaseService}
 * @interface
 */
export interface RedisAppService extends RedisBaseService {
  /**
   * Gets value with automatic key prefixing
   *
   * @param {string} key - Redis key
   * @returns {Promise<string|null>} Value or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Gets current pool configuration
   *
   * @returns {RedisPoolConfig|undefined} Pool config if exists
   */
  getPoolConfig(): RedisPoolConfig | undefined;
}
