/**
 * @fileoverview Application Redis client implementation
 * @module @qi/core/services/redis/app/client
 * @description Implements application-level Redis client with business features
 * like key prefixing and pool configuration.
 *
 * @see {@link RedisAppService} for interface definition
 * @see {@link RedisBaseClient} for base implementation
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-11-28
 */

import { RedisConfig } from "../config/types.js";
import { RedisAppService } from "./types.js";
import { RedisServiceEvents } from "../base/types.js";
import { RedisBaseClient } from "../base/client.js";

/**
 * Application Redis client implementation
 * Adds business features to base Redis functionality
 *
 * @implements {RedisAppService}
 * @class
 */
export class RedisAppClient implements RedisAppService {
  private readonly baseClient: RedisBaseClient;
  private readonly config: RedisConfig;
  private readonly poolName: string;

  /**
   * Creates new application Redis client
   *
   * @param {RedisBaseClient} baseClient - Base Redis client
   * @param {RedisConfig} config - Redis configuration
   * @param {string} [poolName=default] - Connection pool name
   */
  constructor(
    baseClient: RedisBaseClient,
    config: RedisConfig,
    poolName: string = "default"
  ) {
    this.baseClient = baseClient;
    this.config = config;
    this.poolName = poolName;
  }

  /**
   * Gets underlying Redis client instance
   * Delegates to base client
   *
   * @returns {RedisClient} Redis client instance
   * @throws {RedisError} If not connected
   */
  public getClient() {
    return this.baseClient.getClient();
  }

  /**
   * Checks connection health
   * Delegates to base client
   *
   * @returns {Promise<boolean>} True if healthy
   * @throws {RedisError} After max retries
   */
  public async ping(): Promise<boolean> {
    return this.baseClient.ping();
  }

  /**
   * Closes Redis connection
   * Delegates to base client
   *
   * @returns {Promise<void>} Resolves when closed
   * @throws {RedisError} On close failure
   */
  public async close(): Promise<void> {
    return this.baseClient.close();
  }

  /**
   * Registers Redis event listener
   * Delegates to base client
   *
   * @param {E} event - Event name
   * @param {RedisServiceEvents[E]} listener - Event handler
   */
  public on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void {
    this.baseClient.on(event, listener);
  }

  /**
   * Gets Redis value with automatic key prefixing
   * Applies configured prefix to key before access
   *
   * @param {string} key - Redis key
   * @returns {Promise<string|null>} Value or null if not found
   * @throws {RedisError} On Redis operation failure
   */
  public async get(key: string): Promise<string | null> {
    const client = this.baseClient.getClient();
    const prefixedKey = this.getPrefixedKey(key);
    return client.get(prefixedKey);
  }

  /**
   * Applies configured prefix to Redis key
   *
   * @private
   * @param {string} key - Original key
   * @returns {string} Key with prefix applied
   */
  private getPrefixedKey(key: string): string {
    const prefix = this.config.features?.keyPrefix ?? "";
    return `${prefix}${key}`;
  }

  /**
   * Gets configuration for current connection pool
   *
   * @returns {RedisPoolConfig|undefined} Pool configuration if exists
   */
  public getPoolConfig() {
    return this.config.pools?.[this.poolName];
  }
}
