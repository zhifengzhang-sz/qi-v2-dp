/**
 * @fileoverview
 * @module ConfigCache
 *
 * @description
 * This module implements the ConfigCache class, which provides a cache mechanism
 * for configuration objects. It handles storing, retrieving, and managing the
 * lifecycle of cached configurations, including expiration and optional callbacks
 * upon cache item expiration.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { IConfigCache } from "./IConfig.js";
import { BaseConfig, CacheOptions } from "./types.js";

/**
 * Configuration cache implementation.
 *
 * @class ConfigCache
 * @implements {IConfigCache<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides a caching mechanism for configuration objects, allowing storage with
 * time-to-live (TTL) settings, optional refresh-on-access behavior, and expiration
 * callbacks. This implementation ensures efficient retrieval and management of
 * configurations in memory.
 */
export class ConfigCache<T extends BaseConfig> implements IConfigCache<T> {
  /**
   * Internal map to store cached configurations along with their expiration timestamps.
   *
   * @private
   * @type {Map<string, { value: T; expires: number }>}
   */
  private cache: Map<string, { value: T; expires: number }> = new Map();

  /**
   * Configuration cache options with all required properties.
   *
   * @private
   * @type {Required<CacheOptions>}
   */
  private options: Required<CacheOptions>;

  /**
   * Creates an instance of ConfigCache.
   *
   * @constructor
   * @param {CacheOptions} options - The options to configure the cache behavior.
   * @param {number} options.ttl - Time to live for cached items in milliseconds.
   * @param {boolean} [options.refreshOnAccess=false] - Whether to refresh the cached item upon access.
   * @param {(key: string) => void} [options.onExpire=() => {}] - Callback function invoked when an item expires.
   * @description
   * Initializes the ConfigCache with the provided options, setting default values
   * for optional properties if they are not supplied.
   */
  constructor(options: CacheOptions) {
    this.options = {
      refreshOnAccess: false,
      onExpire: () => {},
      ...options,
    };
  }

  /**
   * Determines if a cached item has expired based on the current time.
   *
   * @private
   * @method isExpired
   * @param {number} expires - The expiration timestamp of the cached item.
   * @returns {boolean} - True if the item has expired, false otherwise.
   * @description
   * Compares the current time with the provided expiration timestamp to determine
   * if the cached item should be considered expired.
   */
  private isExpired(expires: number): boolean {
    return Date.now() > expires;
  }

  /**
   * Calculates the expiration timestamp for a cached item based on the TTL.
   *
   * @private
   * @method setExpiry
   * @returns {number} - The calculated expiration timestamp in milliseconds.
   * @description
   * Adds the configured TTL to the current time to set the expiration time for a cached item.
   */
  private setExpiry(): number {
    return Date.now() + this.options.ttl;
  }

  /**
   * Retrieves a configuration object from the cache by its key.
   *
   * @async
   * @method get
   * @param {string} key - The key associated with the cached configuration.
   * @returns {Promise<T | undefined>} - A promise that resolves to the cached configuration or undefined if not found or expired.
   * @description
   * Attempts to retrieve the configuration from the cache. If the item is expired,
   * it is removed from the cache, and the onExpire callback is invoked. If refreshOnAccess
   * is enabled, the item's expiration timestamp is updated upon access.
   */
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry.expires)) {
      this.cache.delete(key);
      this.options.onExpire(key);
      return undefined;
    }

    if (this.options.refreshOnAccess) {
      entry.expires = this.setExpiry();
    }

    return entry.value;
  }

  /**
   * Stores a configuration object in the cache with the specified key.
   *
   * @async
   * @method set
   * @param {string} key - The key to associate with the cached configuration.
   * @param {T} value - The configuration object to cache.
   * @returns {Promise<void>} - A promise that resolves once the configuration is cached.
   * @description
   * Adds the configuration object to the cache with an expiration timestamp based
   * on the configured TTL.
   */
  async set(key: string, value: T): Promise<void> {
    this.cache.set(key, {
      value,
      expires: this.setExpiry(),
    });
  }

  /**
   * Checks if a configuration object exists in the cache and is not expired.
   *
   * @async
   * @method has
   * @param {string} key - The key associated with the cached configuration.
   * @returns {Promise<boolean>} - A promise that resolves to true if the configuration exists and is valid, false otherwise.
   * @description
   * Verifies the presence of a valid (non-expired) configuration in the cache.
   * If the item is expired, it is removed, and the onExpire callback is invoked.
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry.expires)) {
      this.cache.delete(key);
      this.options.onExpire(key);
      return false;
    }

    return true;
  }

  /**
   * Removes a configuration object from the cache by its key.
   *
   * @async
   * @method delete
   * @param {string} key - The key associated with the cached configuration to remove.
   * @returns {Promise<boolean>} - A promise that resolves to true if the item was successfully removed, false otherwise.
   * @description
   * Deletes the specified configuration from the cache, if it exists.
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  /**
   * Clears all configuration objects from the cache.
   *
   * @async
   * @method clear
   * @returns {Promise<void>} - A promise that resolves once the cache is cleared.
   * @description
   * Removes all entries from the cache, effectively resetting it.
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}
