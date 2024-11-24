/**
 * @fileoverview
 * @module CachedConfigLoader
 *
 * @description
 * This module defines the CachedConfigLoader class, which implements the IConfigLoader interface.
 * It provides a caching layer over an existing configuration loader, enabling efficient retrieval
 * of configurations by storing and serving cached configurations when available. The class handles
 * loading configurations from the underlying loader, caching them, and managing cache updates upon
 * configuration changes.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-25
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { IConfigCache, IConfigLoader } from "./IConfig.js";
import { BaseConfig, ConfigChangeEvent } from "./types.js";

/**
 * CachedConfigLoader class.
 *
 * @class CachedConfigLoader
 * @implements {IConfigLoader<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides a caching mechanism for configuration loaders. It attempts to retrieve the configuration
 * from the cache before delegating to the underlying loader. When a configuration is loaded from
 * the underlying loader, it is subsequently cached for future requests. Additionally, it listens
 * for configuration changes and updates the cache accordingly.
 */
export class CachedConfigLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  private readonly watchers: Set<(event: ConfigChangeEvent<T>) => void> =
    new Set();

  /**
   * Creates an instance of CachedConfigLoader.
   *
   * @constructor
   * @param {IConfigLoader<T>} loader - The underlying configuration loader to delegate loading operations.
   * @param {IConfigCache<BaseConfig>} [cache] - Optional cache instance to store and retrieve configurations.
   * @description
   * Initializes the CachedConfigLoader with the provided loader and optional cache. If a cache is
   * provided, it will be used to store and retrieve configurations to improve load performance.
   */
  constructor(
    private readonly loader: IConfigLoader<T>,
    private readonly cache?: IConfigCache<BaseConfig>
  ) {}

  /**
   * Loads the configuration.
   *
   * @async
   * @method load
   * @returns {Promise<T>} - A promise that resolves to the loaded configuration object.
   * @description
   * Attempts to retrieve the configuration from the cache if available. If the configuration is not
   * found in the cache or if no cache is configured, it delegates the loading to the underlying loader,
   * caches the result (if a cache is available), and then returns the loaded configuration.
   */
  async load(): Promise<T> {
    if (!this.cache) {
      return this.loader.load();
    }

    try {
      const cached = await this.cache.get(`${this.loader.constructor.name}`);
      if (cached) {
        return cached as T;
      }
    } catch (error) {
      // If cache retrieval fails, fallback to loader
      console.warn("Cache retrieval failed:", error);
    }

    const config = await this.loader.load();
    try {
      await this.cache.set(`${this.loader.constructor.name}`, config);
    } catch (error) {
      console.warn("Cache set failed:", error);
    }
    return config;
  }

  /**
   * Registers a callback to be invoked when the configuration changes.
   *
   * @method watch
   * @param {(event: ConfigChangeEvent<T>) => void} callback - The callback function to handle configuration change events.
   * @description
   * Adds a watcher to the underlying loader if it supports watching. When a configuration change event
   * occurs, it updates the cache with the new configuration and invokes the provided callback with
   * the event details.
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.watchers.add(callback);

    if (this.loader.watch) {
      if (this.watchers.size === 1) {
        // Only set up loader watch once
        this.loader.watch((event) => {
          if (this.cache) {
            this.cache
              .set(`${this.loader.constructor.name}`, event.current)
              .catch((error) => console.warn("Failed to update cache:", error));
          }
          // Notify all registered watchers
          for (const watcher of this.watchers) {
            watcher(event);
          }
        });
      }
    }
  }

  /**
   * Stops watching for configuration changes.
   *
   * @method unwatch
   * @description
   * Removes all registered watchers and stops watching for configuration changes in the
   * underlying loader if it supports unwatching.
   */
  unwatch(): void {
    if (this.loader.unwatch) {
      this.loader.unwatch();
    }
    // Clear all registered watchers
    this.watchers.clear();
  }
}
