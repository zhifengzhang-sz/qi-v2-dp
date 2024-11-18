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
 * @created 2024-11-16
 * @modified 2024-11-19
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
   * Attempts to retrieve the configuration from the cache using a unique cache key.
   * If the configuration is not found in the cache, it delegates the loading to the underlying loader,
   * caches the result, and then returns the loaded configuration.
   */
  async load(): Promise<T> {
    if (!this.cache) {
      return this.loader.load();
    }

    const cached = await this.cache.get(this.getCacheKey());
    if (cached) {
      return cached as T;
    }

    const config = await this.loader.load();
    await this.cache.set(this.getCacheKey(), config);
    return config;
  }

  /**
   * Registers a callback to be invoked when the configuration changes.
   *
   * @method watch
   * @param {(event: ConfigChangeEvent<T>) => void} callback - The callback function to handle configuration change events.
   * @returns {void}
   * @description
   * Adds a watcher to the underlying loader if it supports watching. When a configuration change event
   * is emitted by the underlying loader, it updates the cache with the new configuration and invokes
   * the provided callback with the event details.
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    if ("watch" in this.loader && typeof this.loader.watch === "function") {
      this.loader.watch(async (event) => {
        if (this.cache) {
          await this.cache.set(this.getCacheKey(), event.current);
        }
        callback(event);
      });
    }
  }

  /**
   * Stops watching for configuration changes.
   *
   * @method unwatch
   * @returns {void}
   * @description
   * Removes the watcher from the underlying loader if it supports unwatching, thereby stopping
   * the monitoring of configuration changes. This ensures that callbacks are no longer invoked
   * when the configuration updates.
   */
  unwatch(): void {
    if ("unwatch" in this.loader && typeof this.loader.unwatch === "function") {
      this.loader.unwatch();
    }
  }

  /**
   * Generates a unique cache key based on the loader's class name.
   *
   * @private
   * @method getCacheKey
   * @returns {string} - The generated cache key.
   * @description
   * Constructs a unique key for caching purposes by prefixing the loader's constructor name.
   * This ensures that different loaders have distinct cache entries.
   */
  private getCacheKey(): string {
    return `config:${this.loader.constructor.name}`;
  }
}
