# Project Source Code Documentation

## src

### index.ts

```typescript
/**
 * @fileoverview
 * @module index.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

export * from "./utils/index.js";
export * from "./config/index.js";
export * from "./errors/index.js";
export * from "./logger/index.js";

```

### cache

#### index.ts

```typescript
/**
 * @fileoverview Cache implementation supporting Redis and in-memory storage
 * @module @qi/core/cache
 *
 * @description
 * Provides a flexible caching system with support for Redis in production and in-memory storage in development.
 * Features include:
 * - Redis support for production environments
 * - In-memory caching using node-cache for development
 * - TTL (Time To Live) support
 * - Type-safe operations with TypeScript generics
 * - Consistent error handling
 * - Prefix-based namespacing
 * - Efficient bulk operations
 * - Atomic operations for Redis
 * - Built-in statistics for debugging
 *
 * @example Redis Usage (Production)
 * ```typescript
 * const cache = new Cache({
 *   storage: 'redis',
 *   prefix: 'app:',
 *   redis: new Redis()
 * });
 *
 * await cache.set('user:123', { name: 'John' });
 * const user = await cache.get('user:123');
 * ```
 *
 * @example In-Memory Usage (Development)
 * ```typescript
 * const cache = new Cache({
 *   storage: 'memory',
 *   prefix: 'temp:',
 *   ttl: 3600
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-02
 * @modified 2024-12-03
 */

import { Redis } from "ioredis";
import NodeCache from "node-cache";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Configuration options for cache initialization
 *
 * @interface CacheOptions
 * @since 1.0.0
 *
 * @property {('redis'|'memory')} storage - Storage backend type
 * @property {string} prefix - Key prefix for namespacing cache entries
 * @property {number} [ttl] - Time to live in seconds (0 or undefined for no expiration)
 * @property {Redis} [redis] - Redis instance (required for redis storage)
 *
 * @example Redis Configuration
 * ```typescript
 * const options: CacheOptions = {
 *   storage: 'redis',
 *   prefix: 'myapp:',
 *   ttl: 3600,
 *   redis: new Redis()
 * };
 * ```
 *
 * @example Memory Configuration
 * ```typescript
 * const options: CacheOptions = {
 *   storage: 'memory',
 *   prefix: 'temp:',
 *   ttl: 300
 * };
 * ```
 */
interface CacheOptions {
  storage: "redis" | "memory";
  prefix: string;
  ttl?: number;
  redis?: Redis;
}

/**
 * Cache implementation supporting Redis and in-memory storage
 *
 * @class Cache
 * @since 1.0.0
 *
 * @description
 * Provides a unified interface for caching data using either Redis or in-memory storage.
 * Features:
 * - TTL support
 * - Type-safe operations
 * - Consistent error handling across storage types
 * - Automatic cleanup of expired entries
 * - Bulk operations support
 * - Namespace support through key prefixes
 * - Statistics for debugging (memory storage)
 *
 * @template T - Type of values to be cached
 *
 * @example Memory Cache Instance
 * ```typescript
 * const cache = new Cache({
 *   storage: 'memory',
 *   prefix: 'temp:',
 *   ttl: 300
 * });
 * ```
 *
 * @example Redis Cache with TTL
 * ```typescript
 * const cache = new Cache({
 *   storage: 'redis',
 *   prefix: 'app:',
 *   ttl: 3600,
 *   redis: new Redis()
 * });
 * ```
 */
class Cache {
  /**
   * Redis client instance used for Redis storage backend
   * @private
   */
  private redis?: Redis;

  /**
   * NodeCache instance used for in-memory storage
   * @private
   */
  private memoryCache?: NodeCache;

  /**
   * Normalized cache options with defaults
   * @private
   */
  private readonly options: {
    storage: "redis" | "memory";
    prefix: string;
    ttl: number;
  };

  /**
   * Creates a new Cache instance
   *
   * @constructor
   * @since 1.0.0
   *
   * @param {CacheOptions} options - Cache configuration options
   * @throws {ApplicationError} When required options are missing or invalid
   *
   * @example Redis Cache
   * ```typescript
   * const cache = new Cache({
   *   storage: 'redis',
   *   prefix: 'myapp:',
   *   redis: new Redis()
   * });
   * ```
   *
   * @example Memory Cache
   * ```typescript
   * const cache = new Cache({
   *   storage: 'memory',
   *   prefix: 'temp:',
   *   ttl: 300
   * });
   * ```
   */
  constructor(options: CacheOptions) {
    this.options = {
      ttl: options.ttl || 0,
      storage: options.storage,
      prefix: options.prefix,
    };

    if (options.storage === "redis") {
      if (!options.redis) {
        throw new ApplicationError(
          "Redis instance required",
          ErrorCode.CONFIGURATION_ERROR,
          500,
          { reason: "Missing Redis instance" }
        );
      }
      this.redis = options.redis;
    } else {
      this.memoryCache = new NodeCache({
        stdTTL: this.options.ttl || 0,
        checkperiod: this.options.ttl ? Math.max(this.options.ttl / 2, 1) : 0,
        useClones: false, // Better performance if we trust consumers
      });
    }
  }

  /**
   * Formats a cache key with prefix
   *
   * @private
   * @since 1.0.0
   *
   * @param {string} key - Original cache key
   * @returns {string} Formatted key with prefix
   *
   * @example
   * ```typescript
   * const fullKey = this.getKey('user:123');
   * // Returns: 'myapp:user:123' if prefix is 'myapp:'
   * ```
   */
  private getKey(key: string): string {
    return `${this.options.prefix}${key}`;
  }

  /**
   * Retrieves a value from cache
   *
   * @template T - Type of the cached value
   * @since 1.0.0
   *
   * @param {string} key - Cache key to retrieve
   * @returns {Promise<T | null>} Cached value or null if not found/expired
   * @throws {ApplicationError} If retrieval operation fails
   *
   * @example Type-safe Retrieval
   * ```typescript
   * interface User {
   *   id: number;
   *   name: string;
   * }
   *
   * const user = await cache.get<User>('user:123');
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   *
   * @example Basic Usage
   * ```typescript
   * const value = await cache.get('simple-key');
   * ```
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getKey(key);

      if (this.options.storage === "redis") {
        const data = await this.redis!.get(fullKey);
        return data ? JSON.parse(data) : null;
      } else {
        const value = this.memoryCache!.get<T>(fullKey);
        return value === undefined ? null : value;
      }
    } catch (error) {
      throw new ApplicationError(
        "Cache get operation failed",
        ErrorCode.CACHE_ERROR,
        500,
        { key, error: String(error) }
      );
    }
  }

  /**
   * Stores a value in cache
   *
   * @template T - Type of the value to cache
   * @since 1.0.0
   *
   * @param {string} key - Cache key
   * @param {T} value - Value to store
   * @returns {Promise<void>}
   * @throws {ApplicationError} If storage operation fails
   *
   * @example Storing Complex Types
   * ```typescript
   * interface User {
   *   id: number;
   *   name: string;
   *   email: string;
   * }
   *
   * const user: User = {
   *   id: 123,
   *   name: 'John',
   *   email: 'john@example.com'
   * };
   * await cache.set('user:123', user);
   * ```
   *
   * @example Simple Storage
   * ```typescript
   * await cache.set('greeting', 'Hello World');
   * ```
   */
  async set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = this.getKey(key);

      if (this.options.storage === "redis") {
        const data = JSON.stringify(value);
        if (this.options.ttl > 0) {
          await this.redis!.setex(fullKey, this.options.ttl, data);
        } else {
          await this.redis!.set(fullKey, data);
        }
      } else {
        this.memoryCache!.set(fullKey, value);
      }
    } catch (error) {
      throw new ApplicationError(
        "Cache set operation failed",
        ErrorCode.CACHE_ERROR,
        500,
        { key, error: String(error) }
      );
    }
  }

  /**
   * Removes a value from cache
   *
   * @since 1.0.0
   *
   * @param {string} key - Cache key to delete
   * @returns {Promise<boolean>} True if value was deleted, false if not found
   * @throws {ApplicationError} If deletion operation fails
   *
   * @example With Status Check
   * ```typescript
   * const deleted = await cache.delete('user:123');
   * console.log(`User ${deleted ? 'was' : 'was not'} deleted`);
   * ```
   *
   * @example Simple Deletion
   * ```typescript
   * await cache.delete('temporary-key');
   * ```
   */
  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKey(key);

      if (this.options.storage === "redis") {
        const result = await this.redis!.del(fullKey);
        return result > 0;
      } else {
        return this.memoryCache!.del(fullKey) > 0;
      }
    } catch (error) {
      throw new ApplicationError(
        "Cache delete operation failed",
        ErrorCode.CACHE_ERROR,
        500,
        { key, error: String(error) }
      );
    }
  }

  /**
   * Clears all cached values with this cache's prefix
   *
   * @since 1.0.0
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If clear operation fails
   *
   * @example
   * ```typescript
   * // Clear all cached items
   * await cache.clear();
   *
   * // Verify cache is empty
   * const value = await cache.get('any-key');
   * console.log(value); // null
   * ```
   *
   * @remarks
   * This operation is atomic for Redis storage but may not be for in-memory storage
   * if multiple operations are happening concurrently.
   */
  async clear(): Promise<void> {
    try {
      if (this.options.storage === "redis") {
        const keys = await this.getAllKeys();
        if (keys.length > 0) {
          await this.redis!.del(...keys);
        }
      } else {
        this.memoryCache!.flushAll();
      }
    } catch (error) {
      throw new ApplicationError(
        "Cache clear operation failed",
        ErrorCode.CACHE_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Retrieves all Redis keys matching the cache prefix
   *
   * @private
   * @since 1.0.0
   *
   * @returns {Promise<string[]>} Array of matching keys
   *
   * @example
   * ```typescript
   * const keys = await this.getAllKeys();
   * console.log(`Found ${keys.length} cached items`);
   * ```
   *
   * @remarks
   * This method uses Redis SCAN command for efficient key retrieval
   * and is only used internally by the clear() method.
   * The SCAN implementation uses batching to handle large key sets
   * efficiently and avoid memory issues.
   *
   * @throws {ApplicationError} If Redis scan operation fails
   *
   * @see {@link https://redis.io/commands/scan/ Redis SCAN Command}
   */
  private async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [nextCursor, batch] = await this.redis!.scan(
        cursor,
        "MATCH",
        `${this.options.prefix}*`,
        "COUNT",
        100
      );
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== "0");
    return keys;
  }

  /**
   * Returns cache statistics for monitoring/debugging
   * Only available for memory storage
   *
   * @since 1.0.0
   *
   * @returns {NodeCache.Stats | null} Cache statistics or null for Redis storage
   *
   * @example
   * ```typescript
   * const stats = cache.getStats();
   * if (stats) {
   *   console.log(`Keys: ${stats.keys}, Hits: ${stats.hits}, Misses: ${stats.misses}`);
   * }
   * ```
   */
  getStats() {
    if (this.options.storage === "memory" && this.memoryCache) {
      return this.memoryCache.getStats();
    }
    return null;
  }
}

export { Cache, type CacheOptions };

/**
 * @example Complete Usage Example
 * ```typescript
 * import { Cache } from '@qi/core/cache';
 * import { Redis } from 'ioredis';
 *
 * // Create a Redis-based cache
 * const cache = new Cache({
 *   storage: 'redis',
 *   prefix: 'myapp:',
 *   ttl: 3600,
 *   redis: new Redis()
 * });
 *
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * async function cacheUser(user: User): Promise<void> {
 *   await cache.set(`user:${user.id}`, user);
 * }
 *
 * async function getUser(id: number): Promise<User | null> {
 *   return await cache.get<User>(`user:${id}`);
 * }
 *
 * async function deleteUser(id: number): Promise<boolean> {
 *   return await cache.delete(`user:${id}`);
 * }
 *
 * async function clearAllUsers(): Promise<void> {
 *   await cache.clear();
 * }
 * ```
 *
 * @example Error Handling
 * ```typescript
 * try {
 *   await cache.set('key', 'value');
 * } catch (error) {
 *   if (error instanceof ApplicationError) {
 *     console.error(
 *       `Cache operation failed: ${error.message}`,
 *       error.details
 *     );
 *   }
 *   throw error;
 * }
 * ```
 *
 * @example Development Environment with Stats
 * ```typescript
 * const devCache = new Cache({
 *   storage: 'memory',
 *   prefix: 'dev:',
 *   ttl: 300
 * });
 *
 * // Later, check cache performance
 * const stats = devCache.getStats();
 * if (stats) {
 *   console.log('Cache Statistics:', {
 *     hits: stats.hits,
 *     misses: stats.misses,
 *     keys: stats.keys,
 *     ksize: stats.ksize,
 *     vsize: stats.vsize
 *   });
 * }
 * ```
 *
 * @example Type-Safe Caching with Custom Types
 * ```typescript
 * interface CacheableItem<T> {
 *   data: T;
 *   metadata: {
 *     created: Date;
 *     source: string;
 *   };
 * }
 *
 * interface Product {
 *   id: string;
 *   name: string;
 *   price: number;
 * }
 *
 * async function cacheProduct(product: Product): Promise<void> {
 *   const item: CacheableItem<Product> = {
 *     data: product,
 *     metadata: {
 *       created: new Date(),
 *       source: 'api'
 *     }
 *   };
 *   await cache.set(`product:${product.id}`, item);
 * }
 *
 * async function getProduct(id: string): Promise<Product | null> {
 *   const item = await cache.get<CacheableItem<Product>>(`product:${id}`);
 *   return item?.data || null;
 * }
 * ```
 */

```

### config

#### BaseLoader.ts

```typescript
/**
 * @fileoverview
 * @module BaseLoader
 *
 * @description
 * This module defines the abstract BaseLoader class, which provides a foundational
 * implementation for configuration loaders. It handles configuration watching and
 * change notifications, ensuring that derived classes implement the specific loading
 * and watcher initialization logic.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { FSWatcher } from "fs";
import { BaseConfig, ConfigChangeEvent } from "./types.js";
import { IConfigLoader } from "./IConfig.js";

/**
 * Abstract class representing a base configuration loader.
 *
 * @abstract
 * @class BaseLoader
 * @implements {IConfigLoader<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides a foundational implementation for configuration loaders, including methods
 * for watching configuration changes and notifying registered callbacks. Derived classes
 * must implement the specific loading logic and watcher initialization.
 */
export abstract class BaseLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  /**
   * The file system watcher for monitoring configuration changes.
   *
   * @protected
   * @type {FSWatcher | undefined}
   */
  protected watcher?: FSWatcher;

  /**
   * A set of callback functions to be invoked when a configuration change event occurs.
   *
   * @protected
   * @type {Set<(event: ConfigChangeEvent<T>) => void>}
   */
  protected callbacks = new Set<(event: ConfigChangeEvent<T>) => void>();

  /**
   * The current configuration object.
   *
   * @protected
   * @type {T | undefined}
   */
  protected currentConfig?: T;

  /**
   * Abstract method to load the configuration.
   *
   * @abstract
   * @method load
   * @returns {Promise<T>} - A promise that resolves to the loaded configuration object.
   * @throws {Error} - Throws an error if the configuration fails to load.
   * @description
   * Derived classes must implement this method to define the specific logic
   * for loading the configuration from the desired source (e.g., file, database).
   */
  abstract load(): Promise<T>;

  /**
   * Registers a callback to be invoked on configuration changes and initializes the watcher.
   *
   * @method watch
   * @param {(event: ConfigChangeEvent<T>) => void} callback - The callback function to handle configuration change events.
   * @returns {void}
   * @description
   * Adds the provided callback to the set of callbacks and initializes the file system watcher
   * if it hasn't been initialized already. This ensures that any changes to the configuration
   * are detected and the callbacks are notified accordingly.
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.callbacks.add(callback);
    this.initializeWatcher();
  }

  /**
   * Unregisters all callbacks and stops watching for configuration changes.
   *
   * @method unwatch
   * @returns {void}
   * @description
   * Closes the file system watcher if it exists, clears all registered callbacks,
   * and disables further notifications of configuration changes.
   */
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  /**
   * Abstract method to initialize the file system watcher.
   *
   * @protected
   * @abstract
   * @method initializeWatcher
   * @returns {void}
   * @description
   * Derived classes must implement this method to define how the configuration
   * should be watched for changes (e.g., watching a specific file or directory).
   * This method is responsible for setting up the FSWatcher and handling its events.
   */
  protected abstract initializeWatcher(): void;

  /**
   * Notifies all registered callbacks of a configuration change event.
   *
   * @protected
   * @method notifyChange
   * @param {T} previous - The previous state of the configuration.
   * @param {T} current - The current state of the configuration.
   * @param {string} source - The source identifier where the change originated.
   * @returns {void}
   * @description
   * Constructs a configuration change event object and invokes each registered callback
   * with this event. This facilitates reactive updates based on configuration changes.
   */
  protected notifyChange(previous: T, current: T, source: string): void {
    const event: ConfigChangeEvent<T> = {
      previous,
      current,
      timestamp: Date.now(),
      source,
    };
    this.callbacks.forEach((cb) => cb(event));
  }
}

```

#### CachedConfigLoader.ts

```typescript
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

```

#### ConfigCache.ts

```typescript
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

```

#### ConfigFactory.ts

```typescript
/**
 * @fileoverview
 * @module ConfigFactory
 *
 * @description
 * This module defines the ConfigFactory class, which implements the IConfigFactory interface.
 * It provides methods to create configuration loaders and validators based on specified options
 * and schemas. The factory leverages caching mechanisms to optimize configuration retrieval
 * and ensures that configurations adhere to defined schemas through validation processes.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { CachedConfigLoader } from "./CachedConfigLoader.js";
import {
  IConfigCache,
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
} from "./IConfig.js";
import { JsonLoader } from "./JsonLoader.js";
import { SchemaValidator } from "./SchemaValidator.js";
import { BaseConfig, JsonSchema } from "./types.js";

/**
 * Configuration factory implementation.
 *
 * @class ConfigFactory
 * @implements {IConfigFactory}
 * @description
 * The ConfigFactory class is responsible for creating configuration loaders and validators.
 * It utilizes caching mechanisms to store and retrieve configurations efficiently,
 * and ensures that configurations conform to specified JSON schemas through validation.
 */
export class ConfigFactory implements IConfigFactory {
  /**
   * Creates an instance of ConfigFactory.
   *
   * @constructor
   * @param {ISchema} schema - The schema manager used to handle JSON schemas for validation.
   * @param {IConfigCache<BaseConfig>} [cache] - Optional cache instance to store and retrieve configurations.
   * @description
   * Initializes the ConfigFactory with the provided schema manager and an optional cache.
   * If a cache is provided, it will be used to store loaded configurations for faster retrieval.
   */
  constructor(
    private readonly schema: ISchema,
    private readonly cache?: IConfigCache<BaseConfig>
  ) {}

  /**
   * Creates a configuration loader based on the provided options.
   *
   * @method createLoader
   * @template T - The type of the configuration object, extending BaseConfig.
   * @param {Object} options - Configuration options for creating the loader.
   * @param {string} options.type - The type identifier for the configuration.
   * @param {string} options.version - The version identifier for the configuration.
   * @param {JsonSchema} options.schema - The JSON schema used to validate the configuration.
   * @returns {IConfigLoader<T>} - An instance of IConfigLoader for the specified configuration.
   * @description
   * Creates a new configuration loader based on the provided options. It ensures that the
   * corresponding JSON schema is registered with the schema manager and utilizes the
   * CachedConfigLoader to enable caching of loaded configurations. The loader is configured
   * to load configurations from JSON files following a specific naming convention based on type and version.
   */
  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T> {
    const { type, version, schema } = options;

    // Register schema if not already registered
    if (!this.schema.hasSchema(schema.$id ?? type)) {
      this.schema.registerSchema(type, schema);
    }

    return new CachedConfigLoader(
      new JsonLoader<T>(
        `config/${type}-${version}.json`,
        this.schema,
        schema.$id ?? type
      ),
      this.cache
    );
  }

  /**
   * Creates a configuration validator based on the provided schema.
   *
   * @method createValidator
   * @template T - The type of the configuration object, extending BaseConfig.
   * @param {JsonSchema} schema - The JSON schema used to validate the configuration.
   * @returns {IConfigValidator<T>} - An instance of IConfigValidator for the specified configuration.
   * @description
   * Creates a new configuration validator using the provided JSON schema. The validator
   * ensures that configurations adhere to the defined schema by performing validation checks.
   */
  createValidator<T extends BaseConfig>(
    schema: JsonSchema
  ): IConfigValidator<T> {
    return new SchemaValidator<T>(this.schema, schema);
  }
}

```

#### EnvLoader.ts

```typescript
/**
 * @fileoverview
 * @module EnvLoader
 *
 * @description
 * This module defines the EnvLoader class, which extends BaseLoader to load configurations
 * from environment files. It provides functionality to read, parse, validate, and monitor environment
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-25
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

/// <reference types="node" />

import { BaseLoader } from "./BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "./types.js";
import { ISchema } from "./IConfig.js";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "./errors.js";
import type { FSWatcher } from "node:fs";
import { watch } from "node:fs";

export class EnvLoader<
  T extends BaseConfig & Record<string, string | undefined>,
> extends BaseLoader<T> {
  private readonly options: EnvOptions;
  private refreshTimer?: NodeJS.Timeout;
  private fileWatchers: FSWatcher[] = [];

  constructor(
    private readonly schema: ISchema,
    private readonly schemaId: string,
    options: EnvOptions = {}
  ) {
    super();
    this.options = {
      override: false,
      extraFiles: [],
      required: false,
      watch: false,
      refreshInterval: undefined,
      ...options,
    };
  }

  protected initializeWatcher(): void {
    if (!this.options.watch) return;

    if (this.options.path) {
      const mainWatcher = watch(this.options.path, async (eventType) => {
        if (eventType === "change") {
          await this.load();
        }
      });
      this.fileWatchers.push(mainWatcher);

      this.options.extraFiles?.forEach((file) => {
        const watcher = watch(file, async (eventType) => {
          if (eventType === "change") {
            await this.load();
          }
        });
        this.fileWatchers.push(watcher);
      });
    }

    if (this.options.refreshInterval != null) {
      this.refreshTimer = setInterval(
        () => void this.load(),
        this.options.refreshInterval
      );
    }
  }

  override unwatch(): void {
    super.unwatch();

    // Close all file watchers
    for (const watcher of this.fileWatchers) {
      watcher.close();
    }
    this.fileWatchers = [];

    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  async load(): Promise<T> {
    try {
      const vars = await this.loadFromEnvFiles();
      this.schema.validate(vars, this.schemaId);

      const config = vars as T;
      if (this.currentConfig) {
        this.notifyChange(
          this.currentConfig,
          config,
          this.options.path || "process.env"
        );
      }
      this.currentConfig = config;

      return config;
    } catch (error) {
      throw ConfigLoaderError.fromError(
        error,
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        {
          source: this.options.path || "process.env",
        }
      );
    }
  }

  private async loadFromEnvFiles(): Promise<
    Record<string, string | undefined>
  > {
    if (!this.options?.path) return process.env;

    try {
      const mainEnvVars = await loadEnv(this.options.path, {
        override: this.options?.override ?? false,
      });

      if (!mainEnvVars && this.options?.required) {
        throw ConfigLoaderError.create(
          "Required environment file not found",
          CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
          this.options.path
        );
      }

      for (const file of this.options?.extraFiles ?? []) {
        const extraVars = await loadEnv(file, {
          override: this.options?.override ?? false,
        });

        if (!extraVars && this.options?.required) {
          throw ConfigLoaderError.create(
            "Required extra environment file not found",
            CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
            file
          );
        }
      }

      return process.env;
    } catch (error) {
      throw ConfigLoaderError.fromError(
        error,
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        {
          source: this.options?.path,
        }
      );
    }
  }
}

```

#### errors.ts

```typescript
/**
 * @fileoverview
 * @module errors
 *
 * @description
 * This module defines configuration-specific error classes and error codes.
 * It extends base error classes to provide a structured error hierarchy
 * for configuration management, including schema validation, environment
 * variable loading, and configuration parsing.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-23
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorCode } from "@qi/core/errors";
import { ErrorObject } from "ajv";

export const CONFIG_LOADER_CODES = {
  INVALID_SCHEMA: ErrorCode.INVALID_SCHEMA,
  SCHEMA_NOT_FOUND: ErrorCode.SCHEMA_NOT_FOUND,
  SCHEMA_EXISTS: ErrorCode.CONFIGURATION_ERROR,
  SCHEMA_VALIDATION_FAILED: ErrorCode.SCHEMA_VALIDATION_FAILED,
  READ_ERROR: ErrorCode.READ_ERROR,
  PARSE_ERROR: ErrorCode.CONFIG_PARSE_ERROR,
  WATCH_ERROR: ErrorCode.WATCH_ERROR,
  ENV_LOAD_ERROR: ErrorCode.ENV_LOAD_ERROR,
  ENV_MISSING_ERROR: ErrorCode.ENV_MISSING_ERROR,
  CONFIG_LOAD_ERROR: ErrorCode.CONFIG_LOAD_ERROR,
  CONFIG_PARSE_ERROR: ErrorCode.CONFIG_PARSE_ERROR,
} as const;

export type ConfigLoaderCode = ErrorCode;

export interface SchemaValidationError {
  field?: string;
  message: string;
  value?: unknown;
  path?: string;
}

export interface ConfigLoaderErrorDetails extends ErrorDetails {
  source?: string;
  filePath?: string;
  schemaId?: string;
  content?: string;
  parseError?: string;
  watchError?: string;
  errors?: ErrorObject[] | SchemaValidationError[];
  existingSchema?: boolean;
  existingId?: boolean;
}

export class ConfigLoaderError extends ApplicationError {
  constructor(
    message: string,
    code: ConfigLoaderCode = ErrorCode.CONFIGURATION_ERROR,
    details?: ConfigLoaderErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "ConfigLoaderError";
  }

  static create(
    message: string,
    code: ConfigLoaderCode,
    source: string,
    details?: ConfigLoaderErrorDetails
  ): ConfigLoaderError {
    return new ConfigLoaderError(message, code, { source, ...details });
  }

  static schemaError(
    message: string,
    schemaId: string,
    details?: ConfigLoaderErrorDetails
  ): ConfigLoaderError {
    return ConfigLoaderError.create(
      message,
      ErrorCode.INVALID_SCHEMA,
      schemaId,
      details
    );
  }

  static validationError(
    message: string,
    schemaId: string,
    errors: ErrorObject[]
  ): ConfigLoaderError {
    return ConfigLoaderError.create(
      message,
      ErrorCode.SCHEMA_VALIDATION_FAILED,
      schemaId,
      { errors }
    );
  }

  static fromError(
    error: unknown,
    code: ConfigLoaderCode,
    context: ConfigLoaderErrorDetails
  ): ConfigLoaderError {
    const message = error instanceof Error ? error.message : String(error);
    return new ConfigLoaderError(message, code, context);
  }
}

```

#### IConfig.ts

```typescript
/**
 * @fileoverview
 * @module IConfig
 *
 * @description
 * This module defines interfaces for configuration management, including
 * configuration loaders, validators, handlers, schema management, and caching.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { BaseConfig, ConfigChangeEvent, JsonSchema } from "./types.js";

/**
 * Configuration factory interface
 */
export interface IConfigFactory {
  /**
   * Create a new configuration loader
   */
  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T>;

  /**
   * Create a new configuration validator
   */
  createValidator<T extends BaseConfig>(
    schema: JsonSchema
  ): IConfigValidator<T>;
}

/**
 * Configuration handler interface.
 *
 * @interface IConfigHandler
 * @template T - The type of the configuration object.
 * @template R - The type of the result returned by the handler.
 * @description
 * Defines a handler for processing configuration objects.
 */
export interface IConfigHandler<T, R> {
  /**
   * Handle the configuration object.
   *
   * @param {T} config - The configuration object to handle.
   * @returns {R | Promise<R>} - The result of handling the configuration.
   */
  handle(config: T): R | Promise<R>;
}

/**
 * Enhanced configuration loader interface.
 *
 * @interface IConfigLoader
 * @template T - The type of the configuration object.
 * @description
 * Defines a loader for loading and watching configuration objects.
 */
export interface IConfigLoader<T extends BaseConfig> {
  /**
   * Load the configuration object.
   *
   * @returns {Promise<T>} - A promise that resolves to the loaded configuration object.
   */
  load(): Promise<T>;

  /**
   * Watch for configuration changes.
   *
   * @param {function(ConfigChangeEvent<T>): void} callback - The callback to invoke on configuration changes.
   */
  watch?(callback: (event: ConfigChangeEvent<T>) => void): void;

  /**
   * Stop watching for configuration changes.
   */
  unwatch?(): void;
}

/**
 * Configuration validator interface.
 *
 * @interface IConfigValidator
 * @template T - The type of the configuration object.
 * @description
 * Defines a validator for validating configuration objects.
 */
export interface IConfigValidator<T extends BaseConfig> {
  /**
   * Validate the configuration object.
   *
   * @param {unknown} config - The configuration object to validate.
   * @throws {Error} - Throws an error if the configuration is invalid.
   */
  validate(config: unknown): asserts config is T;

  /**
   * Get the validation schema.
   *
   * @returns {JsonSchema} - The JSON Schema used for validation.
   */
  getSchema(): JsonSchema;
}

/**
 * Schema validator interface.
 *
 * @interface ISchemaValidator
 * @description
 * Defines a validator for validating JSON Schemas.
 */
export interface ISchemaValidator {
  /**
   * Validate a configuration object against a schema.
   *
   * @param {unknown} config - The configuration object to validate.
   * @param {string} schemaId - The identifier of the schema to validate against.
   * @throws {Error} - Throws an error if the configuration is invalid.
   */
  validate(config: unknown, schemaId: string): void;

  /**
   * Validate a JSON Schema.
   *
   * @param {JsonSchema} schema - The JSON Schema to validate.
   * @throws {Error} - Throws an error if the schema is invalid.
   */
  validateSchema(schema: JsonSchema): void;
}

/**
 * Enhanced schema management interface.
 *
 * @interface ISchema
 * @extends ISchemaValidator
 * @description
 * Defines methods for managing JSON Schemas.
 */
export interface ISchema extends ISchemaValidator {
  /**
   * Get a registered schema by name.
   *
   * @param {string} name - The name of the schema to retrieve.
   * @returns {JsonSchema | undefined} - The retrieved schema, or undefined if not found.
   */
  getSchema(name: string): JsonSchema | undefined;

  /**
   * Register a new schema.
   *
   * @param {string} name - The name of the schema to register.
   * @param {JsonSchema} schema - The schema to register.
   */
  registerSchema(name: string, schema: JsonSchema): void;

  /**
   * Remove a registered schema by name.
   *
   * @param {string} name - The name of the schema to remove.
   */
  removeSchema(name: string): void;

  /**
   * Check if a schema is registered.
   *
   * @param {string} name - The name of the schema to check.
   * @returns {boolean} - True if the schema is registered, false otherwise.
   */
  hasSchema(name: string): boolean;
}

/**
 * Configuration cache interface.
 *
 * @interface IConfigCache
 * @template T - The type of the configuration object.
 * @description
 * Defines methods for caching configuration objects.
 */
export interface IConfigCache<T extends BaseConfig> {
  /**
   * Get a cached configuration object by key.
   *
   * @param {string} key - The key of the cached configuration object.
   * @returns {Promise<T | undefined>} - A promise that resolves to the cached configuration object, or undefined if not found.
   */
  get(key: string): Promise<T | undefined>;

  /**
   * Set a configuration object in the cache.
   *
   * @param {string} key - The key of the configuration object.
   * @param {T} value - The configuration object to cache.
   * @returns {Promise<void>} - A promise that resolves when the configuration object is cached.
   */
  set(key: string, value: T): Promise<void>;

  /**
   * Check if a configuration object is cached.
   *
   * @param {string} key - The key of the configuration object.
   * @returns {Promise<boolean>} - A promise that resolves to true if the configuration object is cached, false otherwise.
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a cached configuration object by key.
   *
   * @param {string} key - The key of the cached configuration object.
   * @returns {Promise<boolean>} - A promise that resolves to true if the configuration object was deleted, false otherwise.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cached configuration objects.
   *
   * @returns {Promise<void>} - A promise that resolves when all cached configuration objects are cleared.
   */
  clear(): Promise<void>;
}

```

#### index.ts

```typescript
/**
 * @fileoverview Configuration system exports for managing application configurations.
 * Provides comprehensive configuration management including loading, validation,
 * caching, and monitoring capabilities.
 * @module @qi/core/config
 *
 * Key features:
 * - Configuration loading from JSON files and environment variables
 * - JSON Schema validation with custom validators
 * - In-memory caching with TTL support
 * - Real-time configuration change monitoring
 * - Type-safe configuration handling
 *
 * @example
 * ```typescript
 * // Initialize configuration factory
 * const factory = new ConfigFactory(schema, cache);
 *
 * // Create loader with schema validation
 * const loader = factory.createLoader({
 *   type: 'app',
 *   version: '1.0',
 *   schema: appSchema
 * });
 *
 * // Load and validate configuration
 * const config = await loader.load();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-25
 */

// Configuration factory for creating loaders and validators
export { ConfigFactory } from "./ConfigFactory.js";

// Cache implementation for configuration storage
export { ConfigCache } from "./ConfigCache.js";

// Configuration loaders for different sources
export { BaseLoader } from "./BaseLoader.js"; // Base loader class
export { JsonLoader } from "./JsonLoader.js"; // JSON file loader
export { EnvLoader } from "./EnvLoader.js"; // Environment variables loader
export { CachedConfigLoader } from "./CachedConfigLoader.js"; // Cached loader wrapper

// Schema validation components
export { SchemaValidator } from "./SchemaValidator.js";
export { Schema } from "./schema.js";

// Error handling
export { ConfigLoaderError, CONFIG_LOADER_CODES } from "./errors.js";
export type {
  ConfigLoaderErrorDetails,
  SchemaValidationError,
} from "./errors.js";

/**
 * Configuration type definitions:
 * - BaseConfig: Base interface for all configuration objects
 * - JsonSchema: JSON Schema type definitions for validation
 * - EnvOptions: Options for environment variable loading
 * - CacheOptions: Configuration cache settings
 */
export {
  BaseConfig,
  JsonSchema,
  EnvOptions,
  CacheOptions,
  ConfigChangeEvent,
} from "./types.js";

/**
 * Core configuration interfaces:
 * - IConfigFactory: Factory for creating configuration loaders/validators
 * - IConfigLoader: Generic configuration loader interface
 * - IConfigValidator: Configuration validation interface
 * - ISchema: Schema management interface
 * - IConfigCache: Configuration caching interface
 * - IConfigHandler: Configuration processing interface
 */
export {
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
  IConfigCache,
  IConfigHandler,
} from "./IConfig.js";

```

#### JsonLoader.ts

```typescript
/**
 * @fileoverview
 * @module JsonLoader
 *
 * @description
 * This module defines the JsonLoader class, which extends BaseLoader to load configurations
 * from JSON sources. It provides functionality to read, parse, validate, and monitor JSON
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-23
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { watch } from "fs";
import { readFile } from "fs/promises";
import { ISchema } from "./IConfig.js";
import { BaseConfig } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_LOADER_CODES, ConfigLoaderError } from "./errors.js";
import { BaseLoader } from "./BaseLoader.js";

export class JsonLoader<T extends BaseConfig> extends BaseLoader<T> {
  constructor(
    private readonly source: string | Record<string, unknown>,
    private readonly schema: ISchema,
    private readonly schemaId: string
  ) {
    super();
  }

  async load(): Promise<T> {
    try {
      const config =
        typeof this.source === "string"
          ? await this.loadFromFile(this.source)
          : this.source;

      this.schema.validate(config, this.schemaId);
      this.currentConfig = config as T;
      return this.currentConfig;
    } catch (error) {
      // If it's already a ConfigLoaderError, re-throw it directly
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      // Otherwise, wrap it as a CONFIG_LOAD_ERROR
      throw new ConfigLoaderError(
        error instanceof Error ? error.message : String(error),
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        {
          source: typeof this.source === "string" ? this.source : "object",
          error: String(error),
        }
      );
    }
  }

  protected initializeWatcher(): void {
    if (typeof this.source !== "string") return;

    if (!this.watcher) {
      this.watcher = watch(this.source, async () => {
        try {
          const previous = this.currentConfig;
          const current = await this.load();

          if (previous && current) {
            this.notifyChange(previous, current, this.source as string);
          }
        } catch (error) {
          logger.error("Error during configuration reload", { error });
        }
      });
    }
  }

  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }

  private async loadFromFile(path: string): Promise<unknown> {
    try {
      const content = await readFile(path, "utf-8");
      try {
        return JSON.parse(content);
      } catch (error) {
        // Use CONFIG_PARSE_ERROR (2010) instead of PARSE_ERROR (1002)
        throw new ConfigLoaderError(
          "Invalid JSON syntax",
          CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
          {
            source: path,
            content,
            parseError: String(error),
          }
        );
      }
    } catch (error) {
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      throw new ConfigLoaderError(
        "Failed to read file",
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        {
          source: path,
          error: String(error),
        }
      );
    }
  }
}

```

#### schema.ts

```typescript
/**
 * @fileoverview
 * @module schema
 *
 * @description
 * This module implements the Schema class which provides methods for
 * managing and validating JSON Schemas using the AJV library.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { Ajv, ValidateFunction } from "ajv";
import { ISchema } from "./IConfig.js";
import { JsonSchema } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_LOADER_CODES, ConfigLoaderError } from "./errors.js";
import addFormats from "ajv-formats";

/**
 * Class representing a schema manager.
 *
 * @class Schema
 * @implements {ISchema}
 * @description
 * Provides methods for managing and validating JSON Schemas using the AJV library.
 */
export class Schema implements ISchema {
  private readonly ajv: Ajv;
  private readonly schemas = new Map<string, JsonSchema>();
  private readonly validators = new Map<string, ValidateFunction>();

  /**
   * Creates an instance of Schema.
   *
   * @param {Object} [options] - The options for the schema manager.
   * @param {boolean} [options.strict=true] - Whether to enable strict mode.
   * @param {boolean} [options.formats=true] - Whether to add format validations.
   */
  constructor(options: { strict?: boolean; formats?: boolean } = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? true,
      validateSchema: true,
      validateFormats: true,
    });

    if (options.formats) {
      addFormats.default(this.ajv);
    }
  }

  /**
   * Validates a configuration object against a registered schema.
   *
   * @param {unknown} config - The configuration object to validate.
   * @param {string} schemaId - The identifier of the schema to validate against.
   * @throws {ConfigError} - Throws an error if the schema is not found or validation fails.
   */
  validate(config: unknown, schemaId: string): void {
    const validator = this.validators.get(schemaId);
    if (!validator) {
      throw ConfigLoaderError.create(
        "Schema not found",
        CONFIG_LOADER_CODES.SCHEMA_NOT_FOUND,
        schemaId
      );
    }

    if (!validator(config)) {
      throw ConfigLoaderError.validationError(
        "Schema validation failed",
        schemaId,
        validator.errors || []
      );
    }
  }

  /**
   * Validates a JSON Schema.
   *
   * @param {JsonSchema} schema - The JSON Schema to validate.
   * @throws {ConfigError} - Throws an error if the schema is invalid.
   */
  validateSchema(schema: JsonSchema): void {
    if (!this.ajv.validateSchema(schema)) {
      throw ConfigLoaderError.schemaError(
        "Invalid schema definition",
        schema.$id ?? "unknown",
        { errors: this.ajv.errors || [] }
      );
    }
  }

  /**
   * Registers a new JSON Schema.
   *
   * @param {string} name - The name of the schema to register.
   * @param {JsonSchema} schema - The schema to register.
   * @throws {ConfigError} - Throws an error if the schema already exists or is invalid.
   */
  registerSchema(name: string, schema: JsonSchema): void {
    try {
      if (this.schemas.has(name)) {
        throw ConfigLoaderError.create(
          "Schema name already exists",
          CONFIG_LOADER_CODES.SCHEMA_EXISTS,
          name,
          { existingSchema: true }
        );
      }

      if (schema.$id && this.ajv.getSchema(schema.$id)) {
        throw ConfigLoaderError.create(
          "Schema ID already exists",
          CONFIG_LOADER_CODES.SCHEMA_EXISTS,
          schema.$id,
          { existingId: true }
        );
      }

      this.validateSchema(schema);
      this.schemas.set(name, schema);
      const validator = this.ajv.compile(schema);
      this.validators.set(schema.$id ?? name, validator);
      logger.info("Registered schema", { name, schemaId: schema.$id });
    } catch (error) {
      logger.error("Failed to register schema", {
        name,
        schemaId: schema.$id,
        error,
      });
      throw error;
    }
  }

  /**
   * Retrieves a registered schema by name.
   *
   * @param {string} name - The name of the schema to retrieve.
   * @returns {JsonSchema | undefined} - The retrieved schema, or undefined if not found.
   */
  getSchema(name: string): JsonSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Removes a registered schema by name.
   *
   * @param {string} name - The name of the schema to remove.
   */
  removeSchema(name: string): void {
    this.schemas.delete(name);
    this.validators.delete(name);
    logger.info("Removed schema", { name });
  }

  /**
   * Checks if a schema is registered.
   *
   * @param {string} name - The name of the schema to check.
   * @returns {boolean} - True if the schema is registered, false otherwise.
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }
}

```

#### SchemaValidator.ts

```typescript
/**
 * @fileoverview
 * @module SchemaValidator
 *
 * @description
 * This module defines the SchemaValidator class, which implements the IConfigValidator interface.
 * It provides functionality to validate configuration objects against a provided JSON schema using
 * a schema validator. The class ensures that configurations conform to the defined schema,
 * throwing errors if validation fails.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { IConfigValidator, ISchemaValidator } from "./IConfig.js";
import { BaseConfig, JsonSchema } from "./types.js";

/**
 * SchemaValidator class.
 *
 * @class SchemaValidator
 * @implements {IConfigValidator<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Validates configuration objects against a specified JSON schema using a provided schema validator.
 * Ensures that configurations adhere to the defined schema, throwing validation errors when necessary.
 */
export class SchemaValidator<T extends BaseConfig>
  implements IConfigValidator<T>
{
  /**
   * Creates an instance of SchemaValidator.
   *
   * @constructor
   * @param {ISchemaValidator} schemaValidator - The schema validator to use for validation.
   * @param {JsonSchema} schema - The JSON schema to validate configurations against.
   * @description
   * Initializes the SchemaValidator with a schema validator and a specific JSON schema.
   * Validates the provided schema upon instantiation to ensure it is well-formed.
   */
  constructor(
    private readonly schemaValidator: ISchemaValidator,
    private readonly schema: JsonSchema
  ) {
    this.schemaValidator.validateSchema(this.schema);
  }

  /**
   * Validates a configuration object against the provided JSON schema.
   *
   * @param {unknown} config - The configuration object to validate.
   * @throws {ConfigError} - Throws an error if validation fails according to the schema.
   * @description
   * Asserts that the provided configuration object conforms to the defined JSON schema.
   * If validation fails, a ConfigError is thrown with details about the validation failure.
   */
  validate(config: unknown): asserts config is T {
    this.schemaValidator.validate(config, this.schema.$id ?? "default");
  }

  /**
   * Retrieves the JSON schema used for validation.
   *
   * @returns {JsonSchema} - The JSON schema associated with this validator.
   * @description
   * Returns the JSON schema that the validator uses to validate configuration objects.
   */
  getSchema(): JsonSchema {
    return this.schema;
  }
}

```

#### types.ts

```typescript
/**
 * @fileoverview
 * @module types
 *
 * @description
 * This module contains type definitions for configuration management.
 * It includes types for JSON Schema validation, configuration change events,
 * environment variable loading options, and base configuration interfaces.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

/**
 * JSON Schema version identifier.
 *
 * @typedef {("2019-09" | "2020-12")} SchemaVersion
 * @description
 * Represents the supported versions of JSON Schema.
 */
export type SchemaVersion = "2019-09" | "2020-12";

/**
 * Configuration change event type.
 *
 * @typedef {Object} ConfigChangeEvent
 * @template T
 * @property {T} previous - The previous configuration state.
 * @property {T} current - The current configuration state.
 * @property {number} timestamp - The timestamp of the change event.
 * @property {string} source - The source of the change event.
 * @description
 * Represents an event that occurs when a configuration changes.
 */
export type ConfigChangeEvent<T> = {
  previous: T;
  current: T;
  timestamp: number;
  source: string;
};

/**
 * Base interface for all configuration objects.
 *
 * @interface BaseConfig
 * @property {string} type - The type of the configuration.
 * @property {string} version - The version of the configuration.
 * @property {SchemaVersion} [schemaVersion] - The JSON Schema version used for validation.
 * @description
 * Defines the basic structure that all configuration objects must adhere to.
 */
export interface BaseConfig {
  readonly type: string;
  readonly version: string;
  readonly schemaVersion?: SchemaVersion;
}

/**
 * Options for environment variable loading.
 *
 * @interface EnvOptions
 * @property {string} [path] - The path to the environment file.
 * @property {boolean} [override] - Whether to override existing environment variables.
 * @property {string[]} [extraFiles] - Additional files to load environment variables from.
 * @property {boolean} [required] - Whether the environment file is required.
 * @property {boolean} [watch] - Whether to watch the environment file for changes.
 * @property {number} [refreshInterval] - The interval (in milliseconds) to refresh the environment variables.
 * @description
 * Defines the options for loading environment variables.
 */
export interface EnvOptions {
  path?: string;
  override?: boolean;
  extraFiles?: string[];
  required?: boolean;
  watch?: boolean;
  refreshInterval?: number;
}

/**
 * Defines the validation properties for JSON Schema.
 *
 * @interface JsonSchemaValidation
 * @property {number} [minLength] - The minimum length for a string.
 * @property {number} [maxLength] - The maximum length for a string.
 * @property {string} [pattern] - The regex pattern that a string must match.
 * @property {string} [format] - The format that a string must conform to.
 * @property {number} [minimum] - The minimum value for a number.
 * @property {number} [maximum] - The maximum value for a number.
 * @property {number} [exclusiveMinimum] - The exclusive minimum value for a number.
 * @property {number} [exclusiveMaximum] - The exclusive maximum value for a number.
 * @property {number} [multipleOf] - The number must be a multiple of this value.
 * @property {number} [minItems] - The minimum number of items in an array.
 * @property {number} [maxItems] - The maximum number of items in an array.
 * @property {boolean} [uniqueItems] - Whether the items in an array must be unique.
 * @property {number} [minProperties] - The minimum number of properties in an object.
 * @property {number} [maxProperties] - The maximum number of properties in an object.
 * @description
 * Defines the validation properties for JSON Schema.
 */
export interface JsonSchemaValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
}

/**
 * JSON Schema definition.
 *
 * @interface JsonSchema
 * @extends JsonSchemaValidation
 * @property {string} [$id] - The unique identifier for the schema.
 * @property {string} [$schema] - The schema version.
 * @property {string} [$ref] - A reference to another schema.
 * @property {string} [title] - The title of the schema.
 * @property {string} [description] - The description of the schema.
 * @property {(string | string[])} [type] - The type(s) of the schema.
 * @property {unknown[]} [enum] - The allowed values for the schema.
 * @property {unknown} [const] - A constant value for the schema.
 * @property {Record<string, JsonSchema | { type: string }>} [properties] - The properties of the schema.
 * @property {string[]} [required] - The required properties of the schema.
 * @property {(boolean | JsonSchema)} [additionalProperties] - Whether additional properties are allowed.
 * @property {(JsonSchema | JsonSchema[])} [items] - The items of the schema.
 * @property {JsonSchema[]} [anyOf] - The schema must match any of the provided schemas.
 * @property {JsonSchema[]} [allOf] - The schema must match all of the provided schemas.
 * @property {JsonSchema[]} [oneOf] - The schema must match exactly one of the provided schemas.
 * @property {JsonSchema} [not] - The schema must not match the provided schema.
 * @property {JsonSchema} [if] - The schema to validate if the condition is met.
 * @property {JsonSchema} [then] - The schema to validate if the "if" condition is met.
 * @property {JsonSchema} [else] - The schema to validate if the "if" condition is not met.
 * @property {Record<string, JsonSchema>} [definitions] - The definitions for reusable schemas.
 * @property {Record<string, JsonSchema>} [$defs] - The definitions for reusable schemas (alternative).
 * @property {unknown} [default] - The default value for the schema.
 * @description
 * Defines the structure of a JSON Schema, including validation properties and schema definitions.
 */
export interface JsonSchema extends JsonSchemaValidation {
  $id?: string;
  $schema?: string;
  $ref?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JsonSchema | { type: string }>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
  definitions?: Record<string, JsonSchema>;
  $defs?: Record<string, JsonSchema>;
  default?: unknown;
}

/**
 * Configuration cache options.
 *
 * @interface CacheOptions
 * @property {number} ttl - Time to live for cached items in milliseconds.
 * @property {boolean} [refreshOnAccess] - Whether to refresh the cached item upon access.
 * @property {(key: string) => void} [onExpire] - Callback function invoked when an item expires.
 * @description
 * Specifies the options for configuring the behavior of the configuration cache,
 * including the duration items are stored, whether to refresh items on access,
 * and handling cache expiration events.
 */
export interface CacheOptions {
  ttl: number;
  refreshOnAccess?: boolean;
  onExpire?: (key: string) => void;
}

```

### errors

#### ApplicationError.ts

```typescript
/**
 * @fileoverview
 * @module ApplicationError
 *
 * @description
 * This module defines the base `ApplicationError` class, which serves as the foundational
 * error type for all application-specific errors. It encapsulates common error properties
 * and provides a standardized method for handling errors, including logging and response
 * preparation.
 *
 * @created 2024-11-21
 * @modified 2024-12-07
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { ErrorCode, StatusCode } from "./ErrorCodes.js";
import { logger } from "@qi/core/logger";

/**
 * Interface for error details providing additional context.
 */
export interface ErrorDetails {
  [key: string]: unknown;
}

/**
 * Base error class for all application-specific errors.
 *
 * @class
 * @extends Error
 *
 * @property {ErrorCode} code - The specific error code representing the error type.
 * @property {number} statusCode - HTTP status code associated with the error.
 * @property {ErrorDetails} [details] - Additional details providing context about the error.
 *
 * @example
 * ```typescript
 * throw new ApplicationError("An unexpected error occurred.", ErrorCode.UNEXPECTED_ERROR, 500, { debugInfo: "Stack trace..." });
 * ```
 */
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: ErrorCode = ErrorCode.APPLICATION_ERROR,
    public statusCode: number = StatusCode.INTERNAL_SERVER_ERROR,
    public details?: ErrorDetails
  ) {
    super(message);
    this.name = "ApplicationError";
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Handles the error by logging it and preparing a standardized response.
   *
   * @returns {object} Standardized error response containing status and error details.
   *
   * @example
   * ```typescript
   * try {
   *   // Some operation that may throw an error
   * } catch (error) {
   *   if (error instanceof ApplicationError) {
   *     const response = error.handle();
   *     // Send response to client
   *     res.status(response.status).json(response.error);
   *   }
   * }
   * ```
   */
  handle() {
    // Log the error details
    logger.error(`${this.name} [${this.code}]: ${this.message}`, {
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    });

    // Prepare standardized response (example for an HTTP API)
    return {
      status: this.statusCode,
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === "development" && {
          details: this.details,
        }),
      },
    };
  }
}

```

#### ErrorCodes.ts

```typescript
/**
 * @fileoverview Error Codes and Status Codes Enumeration
 * @module @qi/core/errors/ErrorCodes
 *
 * @description
 * Centralized error codes and HTTP status codes for the application.
 * Organized by category with reserved ranges for different types of errors.
 *
 * ErrorCode Ranges:
 * 1000-1999: Generic/Base errors
 * 2000-2999: Configuration errors
 * 3000-3999: Service lifecycle errors
 * 4000-4999: CLI errors
 * 5000-5999: Service configuration errors
 * 6000-6999: Data/Cache errors
 * 7000-7099: General market data errors
 * 7100-7199: Provider-specific errors
 * 7200-7299: Data validation errors
 * 7300-7399: Storage errors
 * 7400-7499: Query errors
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-12-11
 */

export enum ErrorCode {
  // === Generic Errors (1000-1999) ===
  // Base errors
  APPLICATION_ERROR = 1000,
  INITIALIZATION_ERROR = 1001,
  NOT_INITIALIZED = 1002,

  // IO errors
  READ_ERROR = 1100,
  WRITE_ERROR = 1101,
  PARSE_ERROR = 1102,
  WATCH_ERROR = 1103,

  // Connection errors
  CONNECTION_ERROR = 1200,
  TIMEOUT_ERROR = 1201,
  PING_ERROR = 1202,
  WEBSOCKET_ERROR = 1203,

  // Operation errors
  OPERATION_ERROR = 1300,
  INVALID_OPERATION = 1301,
  OPERATION_TIMEOUT = 1302,

  // Authentication errors
  AUTH_ERROR = 1401, // 401 related errors
  RATE_LIMIT_ERROR = 1429, // 429 related errors
  NETWORK_ERROR = 1500, // Network connectivity issues
  NOT_FOUND_ERROR = 1404, // Resource not found

  // === Configuration Errors (2000-2999) ===
  // Basic config errors
  CONFIGURATION_ERROR = 2000,
  CONFIG_NOT_FOUND = 2001,
  CONFIG_LOAD_ERROR = 2002,
  CONFIG_PARSE_ERROR = 2003,

  // Schema errors
  SCHEMA_ERROR = 2100,
  INVALID_SCHEMA = 2101,
  SCHEMA_NOT_FOUND = 2102,
  SCHEMA_VALIDATION_FAILED = 2103,

  // Environment errors
  ENV_ERROR = 2200,
  ENV_LOAD_ERROR = 2201,
  ENV_MISSING_ERROR = 2202,
  ENV_VALIDATION_ERROR = 2203,

  // === Service Lifecycle Errors (3000-3999) ===
  // Service management
  SERVICE_ERROR = 3000,
  SERVICE_INITIALIZATION_ERROR = 3001,
  SERVICE_NOT_INITIALIZED = 3002,
  SERVICE_ALREADY_INITIALIZED = 3003,
  SERVICE_SHUTDOWN_ERROR = 3004,

  // Redis lifecycle
  REDIS_ERROR = 3100,
  REDIS_CONNECTION_ERROR = 3101,
  REDIS_OPERATION_ERROR = 3102,

  // Future service lifecycle (reserve ranges)
  POSTGRES_ERROR = 3200,
  QUESTDB_ERROR = 3300,
  MESSAGE_QUEUE_ERROR = 3400,

  // === CLI Errors (4000-4999) ===
  CLI_ERROR = 4000,
  CLI_INVALID_ARGUMENT = 4001,
  CLI_MISSING_ARGUMENT = 4002,

  // === Service Configuration Errors (5000-5999) ===
  // General service config
  SERVICE_CONFIG_ERROR = 5000,
  SERVICE_CONFIG_INVALID = 5001,
  SERVICE_CONFIG_MISSING = 5002,

  // Database config
  DB_CONFIG_ERROR = 5100,
  POSTGRES_CONFIG_INVALID = 5101,
  QUESTDB_CONFIG_INVALID = 5102,
  REDIS_CONFIG_INVALID = 5103,

  // Message queue config
  QUEUE_CONFIG_ERROR = 5200,
  REDPANDA_CONFIG_INVALID = 5201,

  // Monitoring config
  MONITORING_CONFIG_ERROR = 5300,
  GRAFANA_CONFIG_INVALID = 5301,
  PGADMIN_CONFIG_INVALID = 5302,

  // Network config
  NETWORK_CONFIG_ERROR = 5400,
  NETWORK_CONFIG_INVALID = 5401,

  // === Data/Cache Errors (6000-6999) ===
  DATA_ERROR = 6000,
  CACHE_ERROR = 6001,
  CACHE_MISS = 6002,
  CACHE_INVALIDATION_ERROR = 6003,

  // === Market Data Errors (7000-7499) ===

  // General market data errors (7000-7099)
  MARKET_DATA_ERROR = 7000,
  INVALID_INTERVAL = 7001,
  INVALID_SYMBOL = 7002,
  INVALID_EXCHANGE = 7003,
  INVALID_TIMERANGE = 7004,

  // Provider-specific errors (7100-7199)
  PROVIDER_ERROR = 7100,
  PROVIDER_NOT_FOUND = 7101,
  PROVIDER_INITIALIZATION_ERROR = 7102,
  API_ERROR = 7103,
  RATE_LIMIT_EXCEEDED = 7104,
  REQUEST_TIMEOUT = 7105,

  // Data validation errors (7200-7299)
  VALIDATION_ERROR = 7200,
  INVALID_OHLCV = 7201,
  MISSING_REQUIRED_FIELD = 7202,
  INVALID_TIMESTAMP = 7203,

  // Storage errors (7300-7399)
  STORAGE_ERROR = 7300,
  STORAGE_WRITE_ERROR = 7301,
  STORAGE_READ_ERROR = 7302,
  STORAGE_CONNECTION_ERROR = 7303,

  // Query errors (7400-7499)
  QUERY_ERROR = 7400,
  INVALID_QUERY_PARAMS = 7401,
  QUERY_TIMEOUT = 7402,
  EXCEEDED_LIMIT = 7403,
}

export enum StatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

```

#### index.ts

```typescript
/**
 * @fileoverview Core error handling system providing strongly-typed error classes
 * for different categories of application failures. Includes detailed error tracking,
 * type-safe error details, and standardized error codes.
 * @module @qi/core/errors
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-12-07
 */

export { ErrorDetails, ApplicationError } from "./ApplicationError.js";
export { ErrorCode, StatusCode } from "./ErrorCodes.js";

```

### logger

#### index.ts

```typescript
/**
 * @fileoverview Configurable logging system based on Winston providing structured
 * logging with customizable formatting, multiple transports, and environment-aware configuration.
 * @module @qi/core/logger
 *
 * @description
 * Provides a flexible, structured logging system with support for multiple environments,
 * custom formatting, and comprehensive error handling. Key features include:
 * - JSON-structured logging with pretty-printing
 * - Environment-aware configuration
 * - Multiple transport targets (console, file)
 * - Color-coded output by log level
 * - Error object handling with stack traces
 * - Millisecond precision timestamps
 * - Consistent metadata formatting
 *
 * Configuration:
 * - LOG_LEVEL: Set via environment variable (default: 'info')
 * - NODE_ENV: Controls file logging (enabled in non-production)
 *
 * Log Levels (in order of severity):
 * - error: Critical errors requiring immediate attention
 * - warn: Warning conditions that should be reviewed
 * - info: Normal but significant events (default)
 * - debug: Detailed debugging information
 *
 * @example Basic Usage
 * ```typescript
 * // Simple logging
 * logger.info('Operation successful');
 *
 * // Logging with metadata
 * logger.info('User action', {
 *   userId: '123',
 *   action: 'login',
 *   duration: 150
 * });
 *
 * // Error logging
 * try {
 *   await someOperation();
 * } catch (error) {
 *   logger.error('Operation failed', {
 *     error,
 *     operation: 'someOperation',
 *     context: { id: 123 }
 *   });
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-12-04
 */

import winston from "winston";

const { combine, timestamp, printf, colorize, align } = winston.format;

/**
 * Interface representing a log entry structure.
 * Extends Winston's TransformableInfo with stricter typing.
 *
 * @interface LogEntry
 * @since 1.0.0
 *
 * @property {string} level - Log level (error, warn, info, debug)
 * @property {unknown} message - Primary log message
 * @property {string} [timestamp] - ISO timestamp with millisecond precision
 * @property {unknown} [key: string] - Additional metadata fields
 */
interface LogEntry extends winston.Logform.TransformableInfo {
  level: string;
  message: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Formats metadata objects for logging output.
 * Handles special cases and provides consistent formatting for complex objects.
 *
 * @since 1.0.0
 * @private
 *
 * @param {Record<string, unknown>} metadata - Object containing log metadata
 * @returns {string} Formatted metadata string ready for output
 *
 * Features:
 * - Handles Error objects with stack traces
 * - Filters out Winston internal properties
 * - Pretty-prints nested objects
 * - Handles undefined/null values
 * - Prevents circular reference issues
 *
 * @example
 * ```typescript
 * const metadata = {
 *   error: new Error('Failed'),
 *   context: { id: 123 }
 * };
 * const formatted = formatMetadata(metadata);
 * // Output:
 * // {
 * //   "error": {
 * //     "message": "Failed",
 * //     "stack": "Error: Failed\n    at ..."
 * //   },
 * //   "context": {
 * //     "id": 123
 * //   }
 * // }
 * ```
 */
function formatMetadata(metadata: Record<string, unknown>): string {
  const cleaned = Object.entries(metadata).reduce(
    (acc, [key, value]) => {
      // Skip Winston internal properties
      if (key === "level" || key === "message" || key === "timestamp") {
        return acc;
      }

      // Handle Error objects comprehensively
      if (value instanceof Error) {
        const errorInfo: Record<string, unknown> = {
          message: value.message,
          stack: value.stack,
        };

        // Add any custom properties from the error
        const errorObj = value as unknown as Record<string, unknown>;
        for (const prop in errorObj) {
          if (prop !== "message" && prop !== "stack") {
            errorInfo[prop] = errorObj[prop];
          }
        }

        acc[key] = errorInfo;
        return acc;
      }

      // Handle undefined/null
      if (value === undefined) {
        acc[key] = "undefined";
        return acc;
      }

      if (value === null) {
        acc[key] = "null";
        return acc;
      }

      acc[key] = value;
      return acc;
    },
    {} as Record<string, unknown>
  );

  return Object.keys(cleaned).length > 0
    ? JSON.stringify(cleaned, null, 2)
    : "";
}

/**
 * Custom log format function that creates a structured, readable log message.
 * Combines timestamp, log level, message, and formatted metadata.
 *
 * @since 1.0.0
 * @private
 *
 * Features:
 * - Consistent spacing and alignment
 * - Metadata on separate lines for readability
 * - Uppercase log levels for visibility
 * - Preserved message formatting
 *
 * @example Output Formats
 * ```
 * // Basic log
 * 2024-03-14 12:34:56.789 [INFO]    User logged in
 *
 * // Log with metadata
 * 2024-03-14 12:34:56.789 [ERROR]   Database connection failed
 * {
 *   "error": {
 *     "message": "Connection timeout",
 *     "code": "ETIMEDOUT"
 *   },
 *   "database": "users",
 *   "attemptCount": 3
 * }
 * ```
 */
const customFormat = printf((info: LogEntry) => {
  const { level, message, timestamp, ...metadata } = info;

  // Build base log message with consistent spacing
  const baseMessage = [
    timestamp,
    `[${level.toUpperCase()}]`.padEnd(7),
    String(message), // Ensure message is converted to string
  ].join(" ");

  // Format and append metadata if present
  const formattedMetadata = formatMetadata(metadata);
  return formattedMetadata
    ? `${baseMessage}\n${formattedMetadata}`
    : baseMessage;
});

/**
 * Winston logger instance configured for the application's needs.
 *
 * @since 1.0.0
 *
 * Features:
 * - Color-coded output in console
 * - Millisecond-precision timestamps
 * - JSON metadata support
 * - File logging in development
 * - Error-specific file logging
 * - Console logging to stderr for errors
 *
 * Configuration is environment-aware:
 * - Production: Console-only logging
 * - Development: Additional file logging
 *
 * @example Basic Usage
 * ```typescript
 * // Info logging
 * logger.info('Process started', { processId: 123 });
 *
 * // Error logging with stack trace
 * try {
 *   throw new Error('Process failed');
 * } catch (error) {
 *   logger.error('Process error', { error, processId: 123 });
 * }
 *
 * // Debug logging with context
 * logger.debug('Cache operation', {
 *   operation: 'set',
 *   key: 'user:123',
 *   duration: 45
 * });
 * ```
 */
const logger = winston.createLogger({
  // Log level from environment or default to 'info'
  level: process.env.LOG_LEVEL || "info",

  // Combine multiple formatting options
  format: combine(
    colorize({ all: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    align(),
    customFormat
  ),

  // Define log transports
  transports: [
    // Console transport
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

// Add file transports in development environment
if (process.env.NODE_ENV !== "production") {
  // Error-specific log file
  logger.add(
    new winston.transports.File({
      filename: "error.log",
      level: "error",
      format: combine(timestamp(), customFormat),
    })
  );

  // Combined log file for all levels
  logger.add(
    new winston.transports.File({
      filename: "combined.log",
      format: combine(timestamp(), customFormat),
    })
  );
}

export { logger };

```

### networks

#### index.ts

```typescript
/**
 * @fileoverview
 * @module index.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

export * from "./http/client.js";
export * from "./websocket/client.js";

```

#### http

##### client.ts

```typescript
/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { retryOperation } from "@qi/core/utils";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Extend Axios request config to include startTime
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface RequestConfig extends AxiosRequestConfig {
  retry?: boolean;
}

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly config: Required<HttpConfig>;

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const duration = response.config.startTime
          ? Date.now() - response.config.startTime
          : undefined;

        logger.debug("HTTP Response", {
          url: response.config.url,
          status: response.status,
          duration,
        });
        return response;
      },
      (error) => {
        const duration = error.config?.startTime
          ? Date.now() - error.config.startTime
          : undefined;

        logger.error("HTTP Error", {
          url: error.config?.url,
          status: error.response?.status,
          error: error.message,
          duration,
        });
        throw error;
      }
    );

    // Add request interceptor for timing
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.startTime = Date.now();
        return config;
      }
    );
  }

  private async executeRequest<T>(
    config: RequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      if (config.retry === false) {
        return await this.client.request<T>(config);
      }

      return await retryOperation(() => this.client.request<T>(config), {
        retries: this.config.retries,
        minTimeout: this.config.retryDelay,
        onRetry: (times) => {
          logger.warn("Retrying HTTP request", {
            url: config.url,
            attempt: times,
          });
        },
      });
    } catch (error) {
      // Type guard for axios error
      if (axios.isAxiosError(error)) {
        throw new ApplicationError(
          "HTTP request failed",
          ErrorCode.NETWORK_ERROR, // Use existing error code
          error.response?.status || 500,
          {
            url: config.url,
            method: config.method,
            error: error.message,
          }
        );
      }
      // Handle non-axios errors
      throw new ApplicationError(
        "HTTP request failed",
        ErrorCode.NETWORK_ERROR,
        500,
        {
          url: config.url,
          method: config.method,
          error: error instanceof Error ? error.message : String(error),
        }
      );
    }
  }

  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "GET",
      url,
    });
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "POST",
      url,
      data,
    });
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
    return response.data;
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "DELETE",
      url,
    });
    return response.data;
  }
}

```

#### websocket

##### client.ts

```typescript
/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";

export interface WebSocketConfig {
  pingInterval?: number;
  pongTimeout?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private readonly config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;
  private readonly subscriptions = new Map<string, Set<MessageHandler>>();

  constructor(config: WebSocketConfig = {}) {
    super();
    this.config = {
      pingInterval: config.pingInterval || 30000,
      pongTimeout: config.pongTimeout || 5000,
      reconnect: config.reconnect ?? true,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
    };
  }

  async connect(url: string): Promise<void> {
    if (this.ws) {
      throw new ApplicationError(
        "WebSocket already connected",
        ErrorCode.WEBSOCKET_ERROR,
        500
      );
    }

    try {
      await this.establishConnection(url);
      this.setupHeartbeat();
      logger.info("WebSocket connected", { url });
    } catch (error) {
      throw new ApplicationError(
        "WebSocket connection failed",
        ErrorCode.WEBSOCKET_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  private async establishConnection(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        this.reconnectAttempts = 0;
        this.emit("connected");
        resolve();
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.channel && this.subscriptions.has(parsed.channel)) {
            const handlers = this.subscriptions.get(parsed.channel)!;
            handlers.forEach((handler) => {
              try {
                handler(parsed.data);
              } catch (error) {
                logger.error("Message handler error", {
                  error,
                  channel: parsed.channel,
                });
              }
            });
          }
          this.emit("message", parsed);
        } catch (error) {
          logger.error("WebSocket message parse error", { error, data });
        }
      });

      this.ws.on("close", () => {
        this.cleanup();
        this.emit("disconnected");
        if (
          this.config.reconnect &&
          this.reconnectAttempts < this.config.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          setTimeout(() => {
            logger.info("Attempting WebSocket reconnection", {
              attempt: this.reconnectAttempts,
              maxAttempts: this.config.maxReconnectAttempts,
            });
            this.connect(url).catch((error) => {
              logger.error("WebSocket reconnection failed", { error });
            });
          }, this.config.reconnectInterval);
        }
      });

      this.ws.on("error", (error) => {
        logger.error("WebSocket error", { error });
        this.emit("error", error);
        reject(error);
      });

      this.ws.on("pong", () => {
        this.clearPongTimer();
      });
    });
  }

  private setupHeartbeat(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
        this.setPongTimer();
      }
    }, this.config.pingInterval);
  }

  private setPongTimer(): void {
    this.pongTimer = setTimeout(() => {
      logger.warn("WebSocket pong timeout");
      this.ws?.terminate();
    }, this.config.pongTimeout);
  }

  private clearPongTimer(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
    this.clearPongTimer();
    this.ws = null;
  }

  subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "subscribe", channel }).catch((error) => {
        logger.error("Subscription request failed", { error, channel });
      });
    }
  }

  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (!this.subscriptions.has(channel)) return;

    const handlers = this.subscriptions.get(channel)!;
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      this.subscriptions.delete(channel);
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: "unsubscribe", channel }).catch((error) => {
        logger.error("Unsubscription request failed", { error, channel });
      });
    }
  }

  async send(data: unknown): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new ApplicationError(
        "WebSocket not connected",
        ErrorCode.WEBSOCKET_ERROR,
        500
      );
    }

    return new Promise((resolve, reject) => {
      this.ws!.send(JSON.stringify(data), (error) => {
        if (error) {
          reject(
            new ApplicationError(
              "WebSocket send failed",
              ErrorCode.WEBSOCKET_ERROR,
              500,
              { error: String(error) }
            )
          );
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.config.reconnect = false;
      this.ws.close();
      this.cleanup();
      this.subscriptions.clear();
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

```

### services

#### base

##### client.ts

```typescript
/**
 * @fileoverview Base service client abstract implementation
 * @module @qi/core/services/base/client
 *
 * @description
 * Provides the foundation for all service client implementations in the system.
 * This abstract class defines the core functionality and contracts that all
 * service implementations must fulfill, including:
 *
 * Key features:
 * - Standardized service lifecycle management
 * - Health check infrastructure
 * - Configuration validation
 * - Status tracking
 * - Error handling patterns
 *
 * Services that extend this base include:
 * - Database services (TimescaleDB, QuestDB)
 * - Cache services (Redis)
 * - Message queue services (Redpanda)
 *
 * @example Implementing a custom service
 * ```typescript
 * class MyService extends BaseServiceClient<MyConfig> {
 *   constructor(config: MyConfig) {
 *     super(config, 'MyService');
 *   }
 *
 *   async connect(): Promise<void> {
 *     // Connection implementation
 *   }
 *
 *   async disconnect(): Promise<void> {
 *     // Disconnection implementation
 *   }
 *
 *   protected async checkHealth(): Promise<HealthCheckResult> {
 *     // Health check implementation
 *   }
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */

import { logger } from "@qi/core/logger";
import {
  ServiceConfig,
  ServiceClient,
  ServiceStatus,
  HealthCheckResult,
} from "./types.js";

/**
 * Abstract base class for service client implementations
 * @abstract
 * @class BaseServiceClient
 * @implements {ServiceClient<T>}
 * @template T - Service configuration type extending ServiceConfig
 */
export abstract class BaseServiceClient<T extends ServiceConfig>
  implements ServiceClient<T>
{
  /**
   * Current service status
   * @protected
   */
  protected status: ServiceStatus = ServiceStatus.INITIALIZING;

  /**
   * Result of the last health check
   * @protected
   */
  protected lastHealthCheck?: HealthCheckResult;

  /**
   * Creates an instance of BaseServiceClient
   *
   * @param {T} config - Service configuration
   * @param {string} serviceName - Name of the service for logging
   *
   * @throws {Error} When configuration validation fails
   *
   * @example
   * ```typescript
   * super(config, 'MyService');
   * ```
   */
  constructor(
    protected readonly config: T,
    protected readonly serviceName: string
  ) {
    this.validateConfig();
  }

  /**
   * Checks if the service is enabled
   *
   * @returns {boolean} True if service is enabled
   *
   * @example
   * ```typescript
   * if (service.isEnabled()) {
   *   await service.connect();
   * }
   * ```
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Establishes connection to the service
   * @abstract
   * @returns {Promise<void>}
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnects from the service
   * @abstract
   * @returns {Promise<void>}
   */
  abstract disconnect(): Promise<void>;

  /**
   * Performs service-specific health check
   * @abstract
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected abstract checkHealth(): Promise<HealthCheckResult>;

  /**
   * Checks if the service is healthy
   *
   * @returns {Promise<boolean>} True if service is healthy
   *
   * @example
   * ```typescript
   * const healthy = await service.isHealthy();
   * console.log(`Service is ${healthy ? 'healthy' : 'unhealthy'}`);
   * ```
   */
  async isHealthy(): Promise<boolean> {
    try {
      this.lastHealthCheck = await this.checkHealth();
      return this.lastHealthCheck.status === "healthy";
    } catch (error) {
      logger.error(`Health check failed for ${this.serviceName}`, { error });
      return false;
    }
  }

  /**
   * Gets the current service configuration
   *
   * @returns {T} Service configuration
   *
   * @example
   * ```typescript
   * const config = service.getConfig();
   * console.log(`Service TTL: ${config.ttl}`);
   * ```
   */
  getConfig(): T {
    return this.config;
  }

  /**
   * Updates service status and logs the change
   *
   * @protected
   * @param {ServiceStatus} status - New service status
   *
   * @example
   * ```typescript
   * this.setStatus('connected');
   * ```
   */
  protected setStatus(status: ServiceStatus): void {
    this.status = status;
    logger.info(`${this.serviceName} status changed to ${status}`);
  }

  /**
   * Validates service configuration
   *
   * @protected
   * @throws {Error} When configuration is invalid
   *
   * @example
   * ```typescript
   * protected validateConfig(): void {
   *   super.validateConfig();
   *   if (!this.config.customField) {
   *     throw new Error('customField is required');
   *   }
   * }
   * ```
   */
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error(`${this.serviceName} configuration is required`);
    }

    if (this.config.healthCheck?.enabled) {
      if (
        !this.config.healthCheck.interval ||
        !this.config.healthCheck.timeout
      ) {
        throw new Error(
          `Invalid health check configuration for ${this.serviceName}`
        );
      }
    }
  }

  /**
   * Initiates periodic health checks if enabled in configuration
   *
   * @protected
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await this.startHealthCheck();
   * ```
   */
  protected async startHealthCheck(): Promise<void> {
    if (!this.config.healthCheck?.enabled) {
      return;
    }

    const interval = this.config.healthCheck.interval;
    setInterval(async () => {
      try {
        await this.isHealthy();
      } catch (error) {
        logger.error(`Health check failed for ${this.serviceName}`, { error });
      }
    }, interval);
  }
}

```

##### index.ts

```typescript
/**
 * @fileoverview Service base module exports
 * @module @qi/core/services/base
 *
 * @description
 * Exports all base service components including:
 * - Type definitions
 * - Base service client
 * - Service manager
 *
 * This module serves as the foundation for all service implementations
 * in the system.
 *
 * @example
 * ```typescript
 * import { BaseServiceClient, ServiceConfig, ServiceConnectionManager } from '@qi/core/services/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */

export * from "./types.js";
export * from "./client.js";
export * from "./manager.js";

```

##### manager.ts

```typescript
/**
 * @fileoverview Service connection manager implementation
 * @module @qi/core/services/base/manager
 *
 * @description
 * Provides centralized management of service connections and health monitoring.
 * This manager handles:
 * - Service registration
 * - Connection lifecycle
 * - Health status monitoring
 * - Coordinated startup/shutdown
 *
 * Used to manage all service types including:
 * - Database services
 * - Cache services
 * - Message queue services
 *
 * @example Basic Usage
 * ```typescript
 * const manager = new ServiceConnectionManager();
 *
 * // Register services
 * manager.registerService('redis', redisService);
 * manager.registerService('db', dbService);
 *
 * // Start all services
 * await manager.connectAll();
 *
 * // Monitor health
 * const status = await manager.getHealthStatus();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */

import { logger } from "@qi/core/logger";
import { ServiceClient, ServiceConfig } from "./types.js";

/**
 * Manages service connections and lifecycle
 * @class ServiceConnectionManager
 */
export class ServiceConnectionManager {
  /**
   * Map of registered services
   * @private
   */
  private services: Map<string, ServiceClient<ServiceConfig>> = new Map();

  /**
   * Registers a new service with the manager
   *
   * @param {string} name - Unique service identifier
   * @param {ServiceClient<ServiceConfig>} service - Service instance
   * @throws {Error} If service name is already registered
   *
   * @example
   * ```typescript
   * manager.registerService('redis', new RedisService(config));
   * ```
   */
  registerService(name: string, service: ServiceClient<ServiceConfig>): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    this.services.set(name, service);
    logger.info(`Service ${name} registered`);
  }

  /**
   * Connects all enabled services
   *
   * @returns {Promise<void>}
   * @throws {Error} If any service connection fails
   *
   * @example
   * ```typescript
   * try {
   *   await manager.connectAll();
   *   console.log('All services connected');
   * } catch (error) {
   *   console.error('Service startup failed', error);
   * }
   * ```
   */
  async connectAll(): Promise<void> {
    const services = Array.from(this.services.entries());

    for (const [name, service] of services) {
      if (!service.isEnabled()) {
        logger.info(`Skipping disabled service: ${name}`);
        continue;
      }

      try {
        await service.connect();
        logger.info(`Successfully connected to ${name}`);
      } catch (error) {
        logger.error(`Failed to connect to ${name}`, { error });
        throw error;
      }
    }
  }

  /**
   * Disconnects all services
   *
   * @returns {Promise<void>}
   * Continues even if individual services fail to disconnect
   *
   * @example
   * ```typescript
   * await manager.disconnectAll();
   * console.log('All services disconnected');
   * ```
   */
  async disconnectAll(): Promise<void> {
    const services = Array.from(this.services.entries());

    for (const [name, service] of services) {
      try {
        await service.disconnect();
        logger.info(`Successfully disconnected from ${name}`);
      } catch (error) {
        logger.error(`Failed to disconnect from ${name}`, { error });
      }
    }
  }

  /**
   * Gets health status for all enabled services
   *
   * @returns {Promise<Record<string, boolean>>} Map of service names to health status
   *
   * @example
   * ```typescript
   * const status = await manager.getHealthStatus();
   * for (const [service, healthy] of Object.entries(status)) {
   *   console.log(`${service}: ${healthy ? 'healthy' : 'unhealthy'}`);
   * }
   * ```
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};

    for (const [name, service] of this.services) {
      if (!service.isEnabled()) {
        continue;
      }
      status[name] = await service.isHealthy();
    }

    return status;
  }
}

```

##### types.ts

```typescript
/**
 * @fileoverview Base service type definitions and interfaces
 * @module @qi/core/services/base/types
 *
 * @description
 * Defines core type definitions and interfaces for the service infrastructure.
 * These types provide the foundation for implementing service wrappers around
 * various backends like databases, message queues, and caches.
 *
 * Features:
 * - Common service configuration interfaces
 * - Health check types and status enums
 * - Base service client interface
 * - Connection configuration
 * - Error handling types
 *
 * This module is used as the basis for implementing specific services like:
 * - Database services (TimescaleDB, QuestDB)
 * - Cache services (Redis)
 * - Message queue services (Redpanda)
 *
 * @example
 * ```typescript
 * // Implementing a custom service
 * class MyService extends BaseServiceClient<MyConfig> {
 *   constructor(config: MyConfig) {
 *     super(config, 'MyService');
 *   }
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */

/**
 * Base configuration interface for all services
 * @interface ServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {Object} [healthCheck] - Optional health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between health checks in ms
 * @property {number} healthCheck.timeout - Timeout for health checks in ms
 * @property {number} healthCheck.retries - Number of retries for failed health checks
 */
export interface ServiceConfig {
  enabled: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

/**
 * Common connection properties shared across services
 * @interface ConnectionConfig
 *
 * @property {string} host - Service host address
 * @property {number} port - Service port number
 * @property {string} [username] - Optional username for authentication
 * @property {string} [password] - Optional password for authentication
 */
export interface ConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/**
 * Base interface for service clients
 * @interface ServiceClient
 * @template T - Service configuration type extending ServiceConfig
 *
 * @property {function} isEnabled - Check if service is enabled
 * @property {function} isHealthy - Check service health status
 * @property {function} getConfig - Get service configuration
 * @property {function} connect - Establish service connection
 * @property {function} disconnect - Close service connection
 */
export interface ServiceClient<T extends ServiceConfig> {
  isEnabled(): boolean;
  isHealthy(): Promise<boolean>;
  getConfig(): T;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Health check result interface
 * @interface HealthCheckResult
 *
 * @property {('healthy'|'unhealthy')} status - Health check status
 * @property {string} [message] - Optional status message
 * @property {Object} [details] - Optional detailed status information
 * @property {Date} timestamp - Time when health check was performed
 */
export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  message?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Service status enumeration
 * @enum {string}
 *
 * @property {string} INITIALIZING - Service is initializing
 * @property {string} CONNECTED - Service is connected and ready
 * @property {string} DISCONNECTED - Service is disconnected
 * @property {string} ERROR - Service encountered an error
 */
export enum ServiceStatus {
  INITIALIZING = "initializing",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

/**
 * Base service error class
 * @class ServiceError
 * @extends Error
 *
 * @property {string} service - Name of the service where error occurred
 * @property {string} code - Error code for categorization
 * @property {Object} [details] - Additional error details
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

```

#### config

##### dsl.ts

```typescript
/**
 * @fileoverview Service Configuration Domain-Specific Language (DSL)
 * @module @qi/core/services/config/dsl
 *
 * @description
 * Defines the domain-specific interfaces for service configuration management.
 * These interfaces provide a type-safe and intuitive API for accessing service
 * configurations including databases, message queues, monitoring tools, and
 * network settings.
 *
 * Key features:
 * - Type-safe service access
 * - Clear interface definitions
 * - Connection string generation
 * - Endpoint URL construction
 *
 * @example
 * ```typescript
 * // Type-safe service access
 * const postgres = services.databases.postgres;
 * const connString = postgres.getConnectionString();
 *
 * // Generate service endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-04
 * @created 2024-11-29
 */

/**
 * Base interface for database connections
 *
 * @interface DatabaseConnection
 */
export interface DatabaseConnection {
  getDatabase(): string;
  getUser(): string;
  getPassword(): string;
  getHost(): string;
  getPort(): number;
}

/**
 * PostgreSQL database connection interface
 *
 * @interface PostgresConnection
 * @extends {DatabaseConnection}
 */
export interface PostgresConnection extends DatabaseConnection {
  getConnectionString(): string;
  getMaxConnections(): number;
}

/**
 * QuestDB time-series database connection interface
 *
 * @interface QuestDBConnection
 * @extends {DatabaseConnection}
 */
export interface QuestDBConnection extends DatabaseConnection {
  getHttpEndpoint(): string;
  getPgEndpoint(): string;
  getInfluxEndpoint(): string;
}

/**
 * Redis cache connection interface
 *
 * @interface RedisConnection
 * @extends {DatabaseConnection}
 */
export interface RedisConnection extends DatabaseConnection {
  getConnectionString(): string;
  getMaxRetries(): number;
}

/**
 * Message queue connection interface
 *
 * @interface MessageQueueConnection
 */
export interface MessageQueueConnection {
  getBrokerEndpoint(): string;
  getSchemaRegistryEndpoint(): string;
  getAdminEndpoint(): string;
  getProxyEndpoint(): string;
  getBrokerId(): number | undefined;
}

/**
 * Monitoring service endpoint interface
 *
 * @interface MonitoringEndpoint
 */
export interface MonitoringEndpoint {
  getEndpoint(): string;
  getCredentials(): { username?: string; password: string };
}

/**
 * Grafana monitoring interface extending base monitoring
 *
 * @interface GrafanaEndpoint
 * @extends {MonitoringEndpoint}
 */
export interface GrafanaEndpoint extends MonitoringEndpoint {
  getPlugins(): string[];
}

/**
 * Network configuration interface
 *
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  getNetworkName(service: "db" | "redis" | "redpanda"): string;
  getAllNetworks(): Record<string, string>;
}

/**
 * Complete service connections interface
 *
 * @interface ServiceConnections
 */
export interface ServiceConnections {
  databases: {
    postgres: PostgresConnection;
    questdb: QuestDBConnection;
    redis: RedisConnection;
  };
  messageQueue: MessageQueueConnection;
  monitoring: {
    grafana: GrafanaEndpoint;
    pgAdmin: MonitoringEndpoint;
  };
  networking: NetworkConfig;
}

```

##### handlers.ts

```typescript
/**
 * @fileoverview Service Configuration Connection Handlers
 * @module @qi/core/services/config/handlers
 *
 * @description
 * Implements handlers for various service connections including databases,
 * message queues, and monitoring endpoints. These handlers provide clean interfaces
 * for accessing configuration data and generating connection strings while handling
 * edge cases like special characters and IPv6 addresses.
 *
 * Key features:
 * - Safe handling of connection credentials
 * - Support for IPv6 addresses
 * - Custom port configurations
 * - URL-safe character encoding
 * - Validation of required fields
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 * @modified 2024-12-04
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { ServiceConfig } from "./types.js";
import {
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl.js";

/**
 * PostgreSQL connection handler implementation.
 * @implements {PostgresConnection}
 */
export class PostgresConnectionHandler implements PostgresConnection {
  constructor(
    private config: ServiceConfig["databases"]["postgres"],
    private credentials: { user: string; password: string }
  ) {
    if (!config.host || !config.port || !config.database) {
      throw new ApplicationError(
        "Invalid PostgreSQL configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "postgres", config }
      );
    }
    logger.debug("Initialized PostgreSQL connection handler", {
      host: config.host,
    });
  }

  private formatHost(host: string): string {
    // Check if the host is an IPv6 address (contains colons but is not a hostname:port)
    if (host.includes(":") && !host.includes("]") && !host.includes("/")) {
      return `[${host}]`;
    }
    return host;
  }

  getDatabase(): string {
    return this.config.database;
  }

  getUser(): string {
    return this.credentials.user;
  }

  getPassword(): string {
    return this.credentials.password;
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.port;
  }

  getConnectionString(): string {
    const formattedHost = this.formatHost(this.config.host);
    return `postgresql://${this.credentials.user}:${this.credentials.password}@${formattedHost}:${this.config.port}/${this.config.database}`;
  }

  getMaxConnections(): number {
    return this.config.maxConnections;
  }
}

/**
 * QuestDB connection handler implementation.
 * @implements {QuestDBConnection}
 */
export class QuestDBConnectionHandler implements QuestDBConnection {
  constructor(private config: ServiceConfig["databases"]["questdb"]) {
    if (
      !config.host ||
      !config.httpPort ||
      !config.pgPort ||
      !config.influxPort
    ) {
      throw new ApplicationError(
        "Invalid QuestDB configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "questdb", config }
      );
    }
    logger.debug("Initialized QuestDB connection handler", {
      host: config.host,
    });
  }

  getDatabase(): string {
    return "questdb";
  }

  getUser(): string {
    return "admin";
  }

  getPassword(): string {
    return "quest";
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.pgPort;
  }

  getHttpEndpoint(): string {
    return `http://${this.config.host}:${this.config.httpPort}`;
  }

  getPgEndpoint(): string {
    return `postgresql://${this.config.host}:${this.config.pgPort}/questdb`;
  }

  getInfluxEndpoint(): string {
    return `http://${this.config.host}:${this.config.influxPort}`;
  }
}

/**
 * Redis connection handler implementation.
 * @implements {RedisConnection}
 */
export class RedisConnectionHandler implements RedisConnection {
  constructor(
    private config: ServiceConfig["databases"]["redis"],
    private password: string
  ) {
    if (!config.host || !config.port) {
      throw new ApplicationError(
        "Invalid Redis configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "redis", config }
      );
    }
    logger.debug("Initialized Redis connection handler", { host: config.host });
  }

  getDatabase(): string {
    return "default";
  }

  getUser(): string {
    return "default";
  }

  getPassword(): string {
    return this.password;
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.port;
  }

  getConnectionString(): string {
    // Properly encode the password to handle special characters
    const encodedPassword = encodeURIComponent(this.password);
    return `redis://:${encodedPassword}@${this.config.host}:${this.config.port}`;
  }

  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}

/**
 * Message queue (Redpanda) connection handler implementation.
 * @implements {MessageQueueConnection}
 */
export class MessageQueueConnectionHandler implements MessageQueueConnection {
  constructor(
    private config: ServiceConfig["messageQueue"]["redpanda"],
    private advertised: {
      kafka?: string;
      schemaRegistry?: string;
      proxy?: string;
      brokerId?: string;
    }
  ) {
    if (!config.kafkaPort || !config.schemaRegistryPort || !config.adminPort) {
      throw new ApplicationError(
        "Invalid message queue configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "redpanda", config }
      );
    }
    logger.debug("Initialized message queue connection handler");
  }

  getBrokerEndpoint(): string {
    if (this.advertised.kafka) {
      // Check if advertised address already includes port
      if (this.advertised.kafka.includes(":")) {
        return this.advertised.kafka;
      }
      return `${this.advertised.kafka}:${this.config.kafkaPort}`;
    }
    return `localhost:${this.config.kafkaPort}`;
  }

  getSchemaRegistryEndpoint(): string {
    if (this.advertised.schemaRegistry) {
      // Check if advertised address already includes port
      if (this.advertised.schemaRegistry.includes(":")) {
        return `http://${this.advertised.schemaRegistry}`;
      }
      return `http://${this.advertised.schemaRegistry}:${this.config.schemaRegistryPort}`;
    }
    return `http://localhost:${this.config.schemaRegistryPort}`;
  }

  getAdminEndpoint(): string {
    return `http://localhost:${this.config.adminPort}`;
  }

  getProxyEndpoint(): string {
    if (this.advertised.proxy) {
      // Check if advertised address already includes port
      if (this.advertised.proxy.includes(":")) {
        return `http://${this.advertised.proxy}`;
      }
      return `http://${this.advertised.proxy}:${this.config.pandaproxyPort}`;
    }
    return `http://localhost:${this.config.pandaproxyPort}`;
  }

  getBrokerId(): number | undefined {
    return this.advertised.brokerId
      ? parseInt(this.advertised.brokerId, 10)
      : undefined;
  }
}

/**
 * Base monitoring endpoint handler implementation.
 * @implements {MonitoringEndpoint}
 */
export class MonitoringEndpointHandler implements MonitoringEndpoint {
  constructor(
    private config: { host: string; port: number },
    private credentials: { username?: string; password: string }
  ) {
    if (!config.host || !config.port) {
      throw new ApplicationError(
        "Invalid monitoring endpoint configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "monitoring", config }
      );
    }
  }

  getEndpoint(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  getCredentials(): { username?: string; password: string } {
    return this.credentials;
  }
}

/**
 * Grafana-specific monitoring endpoint handler implementation.
 * @implements {GrafanaEndpoint}
 */
export class GrafanaEndpointHandler
  extends MonitoringEndpointHandler
  implements GrafanaEndpoint
{
  constructor(
    config: ServiceConfig["monitoring"]["grafana"],
    credentials: { password: string },
    private plugins?: string
  ) {
    super(config, credentials);
    logger.debug("Initialized Grafana endpoint handler", {
      plugins: this.getPlugins(),
    });
  }

  getPlugins(): string[] {
    return this.plugins?.split(";").filter(Boolean) || [];
  }
}

/**
 * Network configuration handler implementation.
 * @implements {NetworkConfig}
 */
export class NetworkConfigHandler implements NetworkConfig {
  constructor(private config: ServiceConfig["networking"]["networks"]) {
    if (!config.db || !config.redis || !config.redpanda) {
      throw new ApplicationError(
        "Invalid network configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "network", config }
      );
    }
    logger.debug("Initialized network configuration handler");
  }

  getNetworkName(service: "db" | "redis" | "redpanda"): string {
    return this.config[service];
  }

  getAllNetworks(): Record<string, string> {
    return { ...this.config };
  }
}

```

##### index.ts

```typescript
/**
 * @fileoverview Service Configuration Module
 * @module @qi/core/services/config
 *
 * @description
 * Central module for managing service configurations in a distributed system.
 * Provides type-safe configuration loading, validation, and access through a DSL.
 *
 * Features:
 * - Type-safe configuration handling
 * - JSON Schema validation
 * - Environment variable integration
 * - Connection string generation
 * - Network configuration
 * - Comprehensive error handling
 *
 * @example Basic Usage
 * ```typescript
 * const services = await loadServiceConfig();
 *
 * // Database connections
 * const pgConn = services.databases.postgres.getConnectionString();
 * const redisConn = services.databases.redis.getConnectionString();
 *
 * // Message queue endpoints
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 *
 * // Monitoring endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * const services = await loadServiceConfig({
 *   configDir: "./custom/config",
 *   configFile: "services-prod.json",
 *   envFile: "services-prod.env"
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

// Core type definitions
export type { ServiceConfig, EnvConfig, LoadConfigResult } from "./types.js";

// Domain-specific interfaces
export type {
  ServiceConnections,
  DatabaseConnection,
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl.js";

// Schema definitions
export { serviceConfigSchema, envConfigSchema } from "./schema.js";

// Service handlers
export {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers.js";

// Configuration loader
export { loadServiceConfig, LoadConfigOptions } from "./loader.js";

// Re-export necessary types from core for convenience
export type { JsonSchema } from "@qi/core/config";

```

##### loader.ts

```typescript
/**
 * @fileoverview Service Configuration Loader
 * @module @qi/core/services/config/loader
 *
 * @description
 * Provides configuration loading functionality for services.
 * File paths and names are provided by the application layer.
 *
 * Improvements:
 * - Removed hardcoded file names
 * - Required paths in options
 * - Maximizes use of core ConfigFactory
 * - Simplified error handling
 * - Better environment handling
 * - Improved logging
 *
 * @example
 * ```typescript
 * // Application provides all paths
 * const services = await loadServiceConfig({
 *   configPath: "/app/config/services.json",
 *   envPath: "/app/config/services.env"
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { Schema, ConfigFactory } from "@qi/core/config";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";

import { serviceConfigSchema, envConfigSchema } from "./schema.js";
import { ServiceConfig, EnvConfig } from "./types.js";
import { ServiceConnections } from "./dsl.js";
import {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers.js";

/**
 * Configuration loading options
 */
export interface LoadConfigOptions {
  /** Path to service configuration file */
  configPath: string;
  /** Path to environment file */
  envPath: string;
}

/**
 * Loads service configuration and creates handlers
 *
 * @param options Configuration loading options
 * @returns Service connections interface
 * @throws {ApplicationError} When loading or validation fails
 */
export async function loadServiceConfig(
  options: LoadConfigOptions
): Promise<ServiceConnections> {
  const { configPath, envPath } = options;

  try {
    // Load environment using core utility
    const env = (await loadEnv(envPath, { override: true })) as EnvConfig;
    if (!env) {
      throw new ApplicationError(
        "Environment configuration not found",
        ErrorCode.ENV_MISSING_ERROR,
        500,
        { path: envPath }
      );
    }

    logger.info("Loaded environment configuration", {
      path: envPath,
      variables: Object.keys(env).length,
    });

    // Initialize schema and factory
    const schema = new Schema({ formats: true });
    schema.registerSchema(
      "qi://core/services/config/service.schema",
      serviceConfigSchema
    );
    schema.registerSchema(
      "qi://core/services/config/env.schema",
      envConfigSchema
    );

    // Create loader using core factory
    const factory = new ConfigFactory(schema);
    const loader = factory.createLoader<ServiceConfig>({
      type: "services",
      version: "1.0",
      schema: serviceConfigSchema,
    });

    // Set source path for loader
    const jsonLoader = loader as unknown as { source: string };
    jsonLoader.source = configPath;

    // Load and validate configuration
    const config = await loader.load();

    logger.info("Loaded service configuration", {
      path: configPath,
      services: Object.keys(config.databases).length,
    });

    // Create and return service connections
    return {
      databases: {
        postgres: new PostgresConnectionHandler(config.databases.postgres, {
          user: env.POSTGRES_USER,
          password: env.POSTGRES_PASSWORD,
        }),
        questdb: new QuestDBConnectionHandler(config.databases.questdb),
        redis: new RedisConnectionHandler(
          config.databases.redis,
          env.REDIS_PASSWORD
        ),
      },
      messageQueue: new MessageQueueConnectionHandler(
        config.messageQueue.redpanda,
        {
          kafka: env.REDPANDA_ADVERTISED_KAFKA_API,
          schemaRegistry: env.REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API,
          proxy: env.REDPANDA_ADVERTISED_PANDAPROXY_API,
          brokerId: env.REDPANDA_BROKER_ID,
        }
      ),
      monitoring: {
        grafana: new GrafanaEndpointHandler(
          config.monitoring.grafana,
          { password: env.GF_SECURITY_ADMIN_PASSWORD },
          env.GF_INSTALL_PLUGINS
        ),
        pgAdmin: new MonitoringEndpointHandler(config.monitoring.pgAdmin, {
          username: env.PGADMIN_DEFAULT_EMAIL,
          password: env.PGADMIN_DEFAULT_PASSWORD,
        }),
      },
      networking: new NetworkConfigHandler(config.networking.networks),
    };
  } catch (error) {
    // Re-throw ApplicationErrors directly
    if (error instanceof ApplicationError) {
      throw error;
    }

    // Wrap other errors
    throw new ApplicationError(
      "Failed to load service configuration",
      ErrorCode.SERVICE_INITIALIZATION_ERROR,
      500,
      {
        configPath,
        envPath,
        error: String(error),
      }
    );
  }
}

```

##### schema.ts

```typescript
/**
 * @fileoverview Service Configuration Schema
 * @module @qi/core/services/config/schema
 *
 * @description
 * Defines JSON Schema validation for services configuration.
 * Provides strict validation for configuration structure and values.
 *
 * Improvements:
 * - Single source of schema definitions
 * - Reusable schema components
 * - Strict port number validation
 * - Required field enforcement
 * - Clear field descriptions
 * - Format validations
 *
 * @example
 * ```typescript
 * import { Schema } from '@qi/core/config';
 * import { serviceConfigSchema } from './schema';
 *
 * const schema = new Schema({ formats: true });
 * schema.registerSchema('service-config', serviceConfigSchema);
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Port number validation schema
 * Reusable component for validating TCP/UDP ports
 */
const portSchema: JsonSchema = {
  type: "number",
  minimum: 1,
  maximum: 65535,
  description: "Valid TCP/UDP port number",
};

/**
 * Host validation schema
 * Reusable component for validating hostnames
 */
const hostSchema: JsonSchema = {
  type: "string",
  minLength: 1,
  description: "Hostname or IP address",
};

/**
 * Database schemas collection
 */
const databaseSchemas: Record<string, JsonSchema> = {
  postgres: {
    type: "object",
    required: ["host", "port", "database", "user", "maxConnections"],
    properties: {
      host: hostSchema,
      port: portSchema,
      database: {
        type: "string",
        minLength: 1,
        description: "Database name",
      },
      user: {
        type: "string",
        minLength: 1,
        description: "Database user",
      },
      maxConnections: {
        type: "number",
        minimum: 1,
        description: "Maximum number of connections",
      },
    },
    additionalProperties: false,
  },

  questdb: {
    type: "object",
    required: ["host", "httpPort", "pgPort", "influxPort"],
    properties: {
      host: hostSchema,
      httpPort: {
        ...portSchema,
        description: "HTTP API port",
      },
      pgPort: {
        ...portSchema,
        description: "PostgreSQL wire protocol port",
      },
      influxPort: {
        ...portSchema,
        description: "InfluxDB line protocol port",
      },
    },
    additionalProperties: false,
  },

  redis: {
    type: "object",
    required: ["host", "port", "maxRetries"],
    properties: {
      host: hostSchema,
      port: portSchema,
      maxRetries: {
        type: "number",
        minimum: 0,
        description: "Maximum number of connection retries",
      },
    },
    additionalProperties: false,
  },
};

/**
 * Message queue schema
 */
const messageQueueSchema: JsonSchema = {
  type: "object",
  required: ["redpanda"],
  properties: {
    redpanda: {
      type: "object",
      required: [
        "kafkaPort",
        "schemaRegistryPort",
        "adminPort",
        "pandaproxyPort",
      ],
      properties: {
        kafkaPort: {
          ...portSchema,
          description: "Kafka API port",
        },
        schemaRegistryPort: {
          ...portSchema,
          description: "Schema Registry port",
        },
        adminPort: {
          ...portSchema,
          description: "Admin API port",
        },
        pandaproxyPort: {
          ...portSchema,
          description: "REST Proxy port",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Monitoring schema
 */
const monitoringSchema: JsonSchema = {
  type: "object",
  required: ["grafana", "pgAdmin"],
  properties: {
    grafana: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: hostSchema,
        port: portSchema,
      },
      additionalProperties: false,
    },
    pgAdmin: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: hostSchema,
        port: portSchema,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Complete service configuration schema
 */
export const serviceConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/service.schema",
  type: "object",
  required: [
    "type",
    "version",
    "databases",
    "messageQueue",
    "monitoring",
    "networking",
  ],
  properties: {
    type: {
      const: "services",
      description: "Configuration type identifier",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+$",
      description: "Configuration version (semver format)",
    },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: databaseSchemas,
      additionalProperties: false,
    },
    messageQueue: messageQueueSchema,
    monitoring: monitoringSchema,
    networking: {
      type: "object",
      required: ["networks"],
      properties: {
        networks: {
          type: "object",
          required: ["db", "redis", "redpanda"],
          properties: {
            db: {
              type: "string",
              minLength: 1,
              description: "Database network name",
            },
            redis: {
              type: "string",
              minLength: 1,
              description: "Redis network name",
            },
            redpanda: {
              type: "string",
              minLength: 1,
              description: "Message queue network name",
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Environment configuration schema
 */
export const envConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/env.schema",
  type: "object",
  required: [
    "POSTGRES_PASSWORD",
    "POSTGRES_USER",
    "POSTGRES_DB",
    "REDIS_PASSWORD",
    "GF_SECURITY_ADMIN_PASSWORD",
    "PGADMIN_DEFAULT_EMAIL",
    "PGADMIN_DEFAULT_PASSWORD",
  ],
  properties: {
    POSTGRES_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL password",
    },
    POSTGRES_USER: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL username",
    },
    POSTGRES_DB: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL database name",
    },
    REDIS_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Redis password",
    },
    GF_SECURITY_ADMIN_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Grafana admin password",
    },
    GF_INSTALL_PLUGINS: {
      type: "string",
      description: "Semicolon-separated list of Grafana plugins",
    },
    PGADMIN_DEFAULT_EMAIL: {
      type: "string",
      format: "email",
      description: "pgAdmin administrator email",
    },
    PGADMIN_DEFAULT_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "pgAdmin administrator password",
    },
    QDB_TELEMETRY_ENABLED: {
      type: "string",
      enum: ["true", "false"],
      description: "QuestDB telemetry setting",
    },
    REDPANDA_BROKER_ID: {
      type: "string",
      pattern: "^\\d+$",
      description: "Redpanda broker ID",
    },
    REDPANDA_ADVERTISED_KAFKA_API: {
      type: "string",
      description: "Advertised Kafka API address",
    },
    REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: {
      type: "string",
      description: "Advertised Schema Registry address",
    },
    REDPANDA_ADVERTISED_PANDAPROXY_API: {
      type: "string",
      description: "Advertised REST Proxy address",
    },
  },
  additionalProperties: true,
};

```

##### types.ts

```typescript
/**
 * @fileoverview Service Configuration Types
 * @module @qi/core/services/config/types
 *
 * @description
 * Core type definitions for service configuration objects and schemas.
 * These types define the structure of configuration data for various services
 * including databases, message queues, monitoring tools, and networking.
 *
 * This module:
 * - Extends BaseConfig from core
 * - Defines service-specific configuration interfaces
 * - Defines environment variable interface
 * - Ensures type safety for configuration objects
 *
 * @example
 * ```typescript
 * const config: ServiceConfig = {
 *   type: "services",
 *   version: "1.0",
 *   databases: {
 *     postgres: { host: "localhost", port: 5432 }
 *   }
 * };
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

import { BaseConfig } from "@qi/core/config";

/**
 * Service configuration interface matching services-1.0.json schema
 *
 * @interface ServiceConfig
 * @extends {BaseConfig}
 */
export interface ServiceConfig extends BaseConfig {
  type: "services";
  version: string;
  databases: {
    postgres: {
      host: string;
      port: number;
      database: string;
      user: string;
      maxConnections: number;
    };
    questdb: {
      host: string;
      httpPort: number;
      pgPort: number;
      influxPort: number;
    };
    redis: {
      host: string;
      port: number;
      maxRetries: number;
    };
  };
  messageQueue: {
    redpanda: {
      kafkaPort: number;
      schemaRegistryPort: number;
      adminPort: number;
      pandaproxyPort: number;
    };
  };
  monitoring: {
    grafana: {
      host: string;
      port: number;
    };
    pgAdmin: {
      host: string;
      port: number;
    };
  };
  networking: {
    networks: {
      db: string;
      redis: string;
      redpanda: string;
    };
  };
}

/**
 * Environment configuration interface matching services.env
 *
 * @interface EnvConfig
 */
export interface EnvConfig extends Record<string, string | undefined> {
  // Database credentials
  POSTGRES_PASSWORD: string;
  POSTGRES_USER: string;
  POSTGRES_DB: string;

  // Redis configuration
  REDIS_PASSWORD: string;

  // Monitoring credentials
  GF_SECURITY_ADMIN_PASSWORD: string;
  GF_INSTALL_PLUGINS?: string;
  PGADMIN_DEFAULT_EMAIL: string;
  PGADMIN_DEFAULT_PASSWORD: string;

  // QuestDB configuration
  QDB_TELEMETRY_ENABLED?: string;

  // Redpanda configuration
  REDPANDA_BROKER_ID?: string;
  REDPANDA_ADVERTISED_KAFKA_API?: string;
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API?: string;
  REDPANDA_ADVERTISED_PANDAPROXY_API?: string;
}

/**
 * Service configuration result interface
 *
 * @interface LoadConfigResult
 */
export interface LoadConfigResult {
  config: ServiceConfig;
  env: EnvConfig;
}

```

#### questdb

##### index.ts

```typescript
/**
 * @fileoverview QuestDB service wrapper with PostgreSQL wire protocol support
 * @module @qi/core/services/questdb
 */

import type { Pool, PoolConfig, QueryResult } from "pg";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { PostgresConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Gets the Pool constructor from pg module
 * Handles both ESM and CommonJS module systems
 */
async function getPoolConstructor(): Promise<typeof Pool> {
  try {
    const pg = await import("pg");
    return pg.Pool || (pg.default && pg.default.Pool);
  } catch (error) {
    throw new ApplicationError(
      "Failed to load pg module",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      { error: String(error) }
    );
  }
}

interface QuestDBServiceConfig {
  enabled: boolean;
  connection: PostgresConnection;
  pool: {
    max: number;
    min: number;
    acquireTimeout: number;
    idleTimeout: number;
    connectionTimeoutMillis?: number;
    statementTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

type QuestDBParameterValue = string | number | boolean | Date | Buffer | null;

export class QuestDBService extends BaseServiceClient<QuestDBServiceConfig> {
  private pool: Pool | null = null;

  constructor(config: QuestDBServiceConfig) {
    super(config, "QuestDB");
  }

  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("QuestDB service is disabled");
      return;
    }

    try {
      const Pool = await getPoolConstructor();
      const poolConfig = this.createPoolConfig();
      this.pool = new Pool(poolConfig);

      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();

      logger.info("QuestDB connection established", {
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
      });

      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }

      this.pool.on("error", (err: Error) => {
        logger.error("Unexpected QuestDB pool error", { error: err.message });
      });
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to QuestDB",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from QuestDB",
          ErrorCode.CONNECTION_ERROR,
          500,
          { error: String(error) }
        );
      }
    }
  }

  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.pool) {
      return {
        status: "unhealthy",
        message: "QuestDB connection not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();

      return {
        status: "healthy",
        message: "QuestDB is responsive",
        details: {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
          database: this.config.connection.getDatabase(),
          poolSize: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingClients: this.pool.waitingCount,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  getPool(): Pool {
    if (!this.pool) {
      throw new ApplicationError(
        "QuestDB connection not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.pool;
  }

  async query(
    sql: string,
    params?: QuestDBParameterValue[]
  ): Promise<QueryResult> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  private createPoolConfig(): PoolConfig {
    const conn = this.config.connection;
    return {
      host: conn.getHost(),
      port: conn.getPort(),
      database: conn.getDatabase(),
      user: conn.getUser(),
      password: conn.getPassword(),
      max: this.config.pool.max,
      min: this.config.pool.min,
      idleTimeoutMillis: this.config.pool.idleTimeout,
      connectionTimeoutMillis: this.config.pool.connectionTimeoutMillis,
      statement_timeout: this.config.pool.statementTimeout,
    };
  }
}

export default QuestDBService;

```

#### redis

##### index.ts

```typescript
/**
 * @fileoverview Redis service implementation with full client compatibility
 * @module @qi/core/services/redis
 *
 * @description
 * Provides a Redis service implementation that wraps the ioredis client while
 * integrating with the service infrastructure. Key features include:
 * - Base service infrastructure integration
 * - Full compatibility with existing cache module
 * - Health monitoring and reporting
 * - Connection lifecycle management
 * - Event handling and logging
 * - Error handling with ApplicationError
 * - Password extraction from connection strings
 *
 * This service maintains API compatibility with modules that expect direct
 * Redis client access while providing additional service-level features.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection,
 *   options: {
 *     keyPrefix: 'app:',
 *     commandTimeout: 5000
 *   }
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * ```
 *
 * @example With Health Checks
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection,
 *   healthCheck: {
 *     enabled: true,
 *     interval: 30000,
 *     timeout: 5000,
 *     retries: 3
 *   }
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 * @modified 2024-12-05
 */

import { Redis } from "ioredis";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { RedisConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Redis service configuration interface
 *
 * @interface RedisServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {RedisConnection} connection - Redis connection configuration
 * @property {Object} [options] - Optional Redis-specific settings
 * @property {string} [options.keyPrefix] - Prefix for all Redis keys
 * @property {number} [options.commandTimeout] - Timeout for Redis commands in ms
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between checks in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for failed checks
 *
 * @example
 * ```typescript
 * const config: RedisServiceConfig = {
 *   enabled: true,
 *   connection: redisConnection,
 *   options: {
 *     keyPrefix: 'myapp:',
 *     commandTimeout: 5000
 *   },
 *   healthCheck: {
 *     enabled: true,
 *     interval: 30000,
 *     timeout: 5000,
 *     retries: 3
 *   }
 * };
 * ```
 */
interface RedisServiceConfig {
  enabled: boolean;
  connection: RedisConnection;
  options?: {
    keyPrefix?: string;
    commandTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

/**
 * Redis service implementation that maintains compatibility with the Cache module
 * while providing service-level features.
 *
 * @class RedisService
 * @extends {BaseServiceClient<RedisServiceConfig>}
 *
 * @example
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * await client.set('key', 'value');
 * ```
 */
export class RedisService extends BaseServiceClient<RedisServiceConfig> {
  /**
   * Underlying Redis client instance
   * @private
   */
  private client: Redis | null = null;

  /**
   * Creates a new Redis service instance
   *
   * @param {RedisServiceConfig} config - Service configuration
   */
  constructor(config: RedisServiceConfig) {
    super(config, "Redis");
  }

  /**
   * Establishes connection to Redis server
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   *
   * @example
   * ```typescript
   * await service.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("Redis service is disabled");
      return;
    }

    try {
      this.client = new Redis({
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
        password: this.getPassword(),
        maxRetriesPerRequest: 3,
        keyPrefix: this.config.options?.keyPrefix,
        commandTimeout: this.config.options?.commandTimeout,
        retryStrategy: (times) => {
          const delay = Math.min(times * 1000, 3000);
          logger.debug("Redis retry", { attempt: times, delay });
          return delay;
        },
      });

      // Set up event handlers
      this.client.on("connect", () => {
        logger.info("Redis connected", {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        });
      });

      this.client.on("error", (error) => {
        logger.error("Redis error", {
          error: error.message,
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        });
      });

      await this.client.ping();
      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to Redis",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Gracefully disconnects from Redis server
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   *
   * @example
   * ```typescript
   * await service.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from Redis",
          ErrorCode.CONNECTION_ERROR,
          500,
          { error: String(error) }
        );
      }
    }
  }

  /**
   * Performs Redis health check
   *
   * @protected
   * @returns {Promise<HealthCheckResult>} Health check result
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.client) {
      return {
        status: "unhealthy",
        message: "Redis client not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const isPing = (await this.client.ping()) === "PONG";
      return {
        status: isPing ? "healthy" : "unhealthy",
        message: isPing ? "Redis is responsive" : "Redis ping failed",
        details: {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gets the Redis client instance
   * This method maintains compatibility with the Cache module
   *
   * @returns {Redis} Redis client instance
   * @throws {ApplicationError} If client is not initialized
   *
   * @example
   * ```typescript
   * const client = service.getClient();
   * await client.set('key', 'value');
   * ```
   */
  getClient(): Redis {
    if (!this.client) {
      throw new ApplicationError(
        "Redis client not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.client;
  }

  /**
   * Extracts password from connection string or returns direct password
   *
   * @private
   * @returns {string} Redis password
   *
   * @example
   * ```typescript
   * // From connection string: redis://:password123@localhost:6379
   * const password = this.getPassword(); // Returns 'password123'
   * ```
   */
  private getPassword(): string {
    const connectionString = this.config.connection.getConnectionString();
    try {
      const matches = connectionString.match(/redis:\/\/:([^@]+)@/);
      if (matches && matches[1]) {
        return decodeURIComponent(matches[1]);
      }
      const url = new URL(connectionString);
      if (url.password) {
        return decodeURIComponent(url.password);
      }
      return this.config.connection.getPassword();
    } catch {
      return this.config.connection.getPassword();
    }
  }
}

export default RedisService;

```

#### redpanda

##### index.ts

```typescript
/**
 * @fileoverview RedPanda service wrapper with Kafka protocol support
 * @module @qi/core/services/redpanda
 *
 * @description
 * Provides a service wrapper around RedPanda using the Kafka protocol for:
 * - Message production and consumption
 * - Topic management
 * - Consumer group coordination
 * - Schema registry integration
 * - Health monitoring
 *
 * Key features:
 * - Full Kafka protocol compatibility
 * - Consumer group management
 * - Configurable compression
 * - Batch processing
 * - Schema registry support
 * - Health monitoring
 *
 * Configuration is handled through the standard service configuration system,
 * utilizing the KafkaConnection interface which extends MessageQueueConnection.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new RedPandaService({
 *   enabled: true,
 *   connection: redpandaConnection,
 *   clientId: 'my-service',
 *   consumer: {
 *     groupId: 'my-consumer-group',
 *     sessionTimeout: 30000
 *   }
 * });
 *
 * await service.connect();
 * const producer = service.getProducer();
 * const consumer = service.getConsumer();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */

import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  ConsumerConfig,
  ProducerConfig,
  SASLOptions,
  Mechanism,
} from "kafkajs";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import { MessageQueueConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Extended Kafka connection interface for RedPanda configuration
 *
 * @interface KafkaConnection
 * @extends {MessageQueueConnection}
 *
 * @property {function} getBrokers - Returns array of broker addresses
 * @property {function} getSSLConfig - Returns SSL configuration
 * @property {function} getSASLConfig - Returns SASL authentication configuration
 * @property {function} getConnectionTimeout - Returns connection timeout in ms
 * @property {function} getRequestTimeout - Returns request timeout in ms
 */
interface KafkaConnection extends MessageQueueConnection {
  getBrokers(): string[];
  getSSLConfig(): Record<string, unknown>;
  getSASLConfig(): SASLOptions | Mechanism | undefined;
  getConnectionTimeout(): number;
  getRequestTimeout(): number;
}

/**
 * Message content interface for producing messages
 *
 * @interface MessageContent
 * @property {string} [key] - Optional message key for partitioning
 * @property {string | Buffer} value - Message content as string or buffer
 */
interface MessageContent {
  key?: string;
  value: string | Buffer;
}

/**
 * RedPanda service configuration interface
 *
 * @interface RedPandaServiceConfig
 * @property {boolean} enabled - Whether the service is enabled
 * @property {KafkaConnection} connection - RedPanda/Kafka connection configuration
 * @property {string} clientId - Unique identifier for this client
 * @property {Object} [consumer] - Consumer configuration
 * @property {string} consumer.groupId - Consumer group identifier
 * @property {number} [consumer.sessionTimeout] - Session timeout in ms
 * @property {number} [consumer.rebalanceTimeout] - Rebalance timeout in ms
 * @property {number} [consumer.heartbeatInterval] - Heartbeat interval in ms
 * @property {number} [consumer.maxBytesPerPartition] - Max bytes per partition
 * @property {number} [consumer.maxWaitTimeInMs] - Max wait time for fetch requests
 * @property {Object} [producer] - Producer configuration
 * @property {number} [producer.acks] - Required acks for produced messages
 * @property {CompressionTypes} [producer.compression] - Message compression type
 * @property {number} [producer.maxBatchSize] - Maximum size of message batches
 * @property {boolean} [producer.allowAutoTopicCreation] - Auto create topics
 * @property {number} [producer.transactionTimeout] - Transaction timeout in ms
 * @property {boolean} [producer.idempotent] - Enable idempotent producer
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Enable health checks
 * @property {number} healthCheck.interval - Health check interval in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for health checks
 */
interface RedPandaServiceConfig {
  enabled: boolean;
  connection: KafkaConnection;
  clientId: string;
  consumer?: {
    groupId: string;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
    maxBytesPerPartition?: number;
    maxWaitTimeInMs?: number;
  };
  producer?: {
    allowAutoTopicCreation?: boolean;
    maxInFlightRequests?: number;
    idempotent?: boolean;
    transactionalId?: string;
    transactionTimeout?: number;
    metadataMaxAge?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

/**
 * RedPanda service implementation providing Kafka protocol compatibility
 * and message streaming capabilities.
 *
 * @class RedPandaService
 * @extends {BaseServiceClient<RedPandaServiceConfig>}
 */
export class RedPandaService extends BaseServiceClient<RedPandaServiceConfig> {
  /**
   * Kafka client instance
   * @private
   */
  private kafka: Kafka | null = null;

  /**
   * Kafka producer instance
   * @private
   */
  private producer: Producer | null = null;

  /**
   * Kafka consumer instance
   * @private
   */
  private consumer: Consumer | null = null;

  /**
   * Default producer configuration
   * @private
   */
  private readonly defaultProducerConfig: ProducerConfig = {
    allowAutoTopicCreation: true,
    maxInFlightRequests: 5,
    idempotent: false,
  };

  /**
   * Default consumer configuration
   * @private
   */
  private readonly defaultConsumerConfig: Partial<ConsumerConfig> = {
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    maxWaitTimeInMs: 5000,
  };

  /**
   * Creates a new RedPanda service instance
   * @param {RedPandaServiceConfig} config - Service configuration
   */
  constructor(config: RedPandaServiceConfig) {
    super(config, "RedPanda");
  }

  /**
   * Establishes connections to RedPanda cluster
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("RedPanda service is disabled");
      return;
    }

    try {
      const kafkaConfig = this.createKafkaConfig();
      this.kafka = new Kafka(kafkaConfig);

      // Initialize and connect producer
      this.producer = this.kafka.producer(this.createProducerConfig());
      await this.producer.connect();
      logger.info("RedPanda producer connected", {
        clientId: this.config.clientId,
        endpoint: this.config.connection.getBrokerEndpoint(),
      });

      // Initialize and connect consumer if configured
      if (this.config.consumer?.groupId) {
        this.consumer = this.kafka.consumer(this.createConsumerConfig());
        await this.consumer.connect();
        logger.info("RedPanda consumer connected", {
          groupId: this.config.consumer.groupId,
          clientId: this.config.clientId,
        });
      }

      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to RedPanda",
        ErrorCode.MESSAGE_QUEUE_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Closes all connections and performs cleanup
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   */
  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }

      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      this.kafka = null;
      this.setStatus(ServiceStatus.DISCONNECTED);
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to disconnect from RedPanda",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Performs health check on RedPanda connections
   * @returns {Promise<HealthCheckResult>}
   * @protected
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.kafka) {
      return {
        status: "unhealthy",
        message: "RedPanda client not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const admin = this.kafka.admin();
      await admin.listTopics();
      await admin.disconnect();

      return {
        status: "healthy",
        message: "RedPanda is responsive",
        details: {
          brokerEndpoint: this.config.connection.getBrokerEndpoint(),
          schemaRegistryEndpoint:
            this.config.connection.getSchemaRegistryEndpoint(),
          clientId: this.config.clientId,
          producerConnected: Boolean(this.producer),
          consumerConnected: Boolean(this.consumer),
          consumerGroupId: this.config.consumer?.groupId,
          brokerId: this.config.connection.getBrokerId(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gets the Kafka producer instance
   * @returns {Producer}
   * @throws {ApplicationError} If producer is not initialized
   */
  getProducer(): Producer {
    if (!this.producer) {
      throw new ApplicationError(
        "RedPanda producer not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.producer;
  }

  /**
   * Gets the Kafka consumer instance
   * @returns {Consumer}
   * @throws {ApplicationError} If consumer is not initialized
   */
  getConsumer(): Consumer {
    if (!this.consumer) {
      throw new ApplicationError(
        "RedPanda consumer not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.consumer;
  }

  /**
   * Creates Kafka client configuration
   * @returns {KafkaConfig}
   * @private
   */
  private createKafkaConfig(): KafkaConfig {
    return {
      clientId: this.config.clientId,
      brokers: [this.config.connection.getBrokerEndpoint()],
      ssl: this.config.connection.getSSLConfig(),
      sasl: this.config.connection.getSASLConfig(),
      connectionTimeout: this.config.connection.getConnectionTimeout(),
      requestTimeout: this.config.connection.getRequestTimeout(),
    };
  }

  /**
   * Creates producer configuration
   * @returns {ProducerConfig}
   * @private
   */
  private createProducerConfig(): ProducerConfig {
    // Only include properties that exist in ProducerConfig
    const config: ProducerConfig = {
      allowAutoTopicCreation:
        this.config.producer?.allowAutoTopicCreation ??
        this.defaultProducerConfig.allowAutoTopicCreation,
      maxInFlightRequests: this.defaultProducerConfig.maxInFlightRequests,
      idempotent:
        this.config.producer?.idempotent ??
        this.defaultProducerConfig.idempotent,
    };

    return config;
  }

  /**
   * Creates consumer configuration
   * @returns {ConsumerConfig}
   * @throws {ApplicationError} If consumer group ID is missing
   * @private
   */
  private createConsumerConfig(): ConsumerConfig {
    if (!this.config.consumer?.groupId) {
      throw new ApplicationError(
        "Consumer group ID is required",
        ErrorCode.REDPANDA_CONFIG_INVALID,
        500
      );
    }

    return {
      ...this.defaultConsumerConfig,
      ...this.config.consumer,
      groupId: this.config.consumer.groupId, // Ensure groupId is applied last
    };
  }

  /**
   * Subscribes to specified topics
   * @param {string[]} topics - Array of topics to subscribe to
   * @returns {Promise<void>}
   * @throws {ApplicationError} If subscription fails
   */
  async subscribe(topics: string[]): Promise<void> {
    const consumer = this.getConsumer();
    try {
      await Promise.all(
        topics.map((topic) =>
          consumer.subscribe({ topic, fromBeginning: false })
        )
      );
      logger.info("Subscribed to topics", { topics });
    } catch (error) {
      throw new ApplicationError(
        "Failed to subscribe to topics",
        ErrorCode.OPERATION_ERROR,
        500,
        { error: String(error), topics }
      );
    }
  }

  /**
   * Sends messages to specified topic
   * @param {string} topic - Topic to send message to
   * @param {MessageContent[]} messages - Array of messages to send
   * @param {number} [partition] - Optional partition number
   * @returns {Promise<void>}
   * @throws {ApplicationError} If sending fails
   */
  async send(
    topic: string,
    messages: MessageContent[],
    partition?: number
  ): Promise<void> {
    const producer = this.getProducer();
    try {
      await producer.send({
        topic,
        messages: messages.map((msg) => ({
          partition,
          key: msg.key,
          value: msg.value,
        })),
      });
    } catch (error) {
      throw new ApplicationError(
        "Failed to send messages",
        ErrorCode.OPERATION_ERROR,
        500,
        { error: String(error), topic }
      );
    }
  }
}

export default RedPandaService;

```

#### timescaledb

##### index.ts

```typescript
/**
 * @fileoverview TimescaleDB service wrapper with Sequelize ORM integration
 * @module @qi/core/services/timescaledb
 *
 * @description
 * Provides a service wrapper around TimescaleDB using Sequelize ORM for:
 * - Database connection management
 * - Model synchronization
 * - Query interface
 * - Connection pooling
 * - Health monitoring
 *
 * Key features:
 * - Sequelize ORM integration
 * - Connection pool management
 * - Model synchronization options
 * - Health monitoring
 * - Configurable timeouts
 * - Detailed logging
 *
 * @example Basic Usage
 * ```typescript
 * const service = new TimescaleDBService({
 *   enabled: true,
 *   connection: postgresConnection,
 *   pool: {
 *     max: 20,
 *     min: 5,
 *     acquireTimeout: 30000,
 *     idleTimeout: 10000
 *   }
 * });
 *
 * await service.connect();
 * const sequelize = service.getSequelize();
 * ```
 *
 * @example With Model Synchronization
 * ```typescript
 * const service = new TimescaleDBService({
 *   enabled: true,
 *   connection: postgresConnection,
 *   sync: {
 *     force: false,
 *     alter: true
 *   }
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-03
 * @modified 2024-12-05
 */

import { Sequelize, Options as SequelizeOptions } from "sequelize";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { PostgresConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * TimescaleDB service configuration interface
 *
 * @interface TimescaleDBServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {PostgresConnection} connection - Database connection configuration
 * @property {Object} pool - Connection pool settings
 * @property {number} pool.max - Maximum number of connections in pool
 * @property {number} pool.min - Minimum number of connections in pool
 * @property {number} pool.acquireTimeout - Maximum time (ms) to acquire connection
 * @property {number} pool.idleTimeout - Maximum time (ms) connection can be idle
 * @property {number} [pool.connectionTimeoutMillis] - Connection timeout in milliseconds
 * @property {number} [pool.statementTimeout] - Statement timeout in milliseconds
 * @property {number} [pool.idleInTransactionSessionTimeout] - Transaction idle timeout
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between checks in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for failed checks
 * @property {Object} [sync] - Model synchronization options
 * @property {boolean} [sync.force] - Drop tables before sync
 * @property {boolean} [sync.alter] - Alter tables to fit models
 */
interface TimescaleDBServiceConfig {
  enabled: boolean;
  connection: PostgresConnection;
  pool: {
    max: number;
    min: number;
    acquireTimeout: number;
    idleTimeout: number;
    connectionTimeoutMillis?: number;
    statementTimeout?: number;
    idleInTransactionSessionTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
  sync?: {
    force?: boolean;
    alter?: boolean;
  };
}

/**
 * TimescaleDB service implementation providing Sequelize ORM integration
 * and health monitoring capabilities.
 *
 * @class TimescaleDBService
 * @extends {BaseServiceClient<TimescaleDBServiceConfig>}
 */
export class TimescaleDBService extends BaseServiceClient<TimescaleDBServiceConfig> {
  /**
   * Sequelize instance for database operations
   * @private
   */
  private sequelize: Sequelize | null = null;

  /**
   * Creates a new TimescaleDB service instance
   *
   * @param {TimescaleDBServiceConfig} config - Service configuration
   */
  constructor(config: TimescaleDBServiceConfig) {
    super(config, "TimescaleDB");
  }

  /**
   * Establishes database connection and initializes Sequelize
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   *
   * @example
   * ```typescript
   * await service.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("TimescaleDB service is disabled");
      return;
    }

    try {
      const sequelizeOptions = this.createSequelizeOptions();
      this.sequelize = new Sequelize(sequelizeOptions);

      // Test connection
      await this.sequelize.authenticate();
      logger.info("TimescaleDB connection established");

      // Sync models if configured
      if (this.config.sync) {
        await this.sequelize.sync(this.config.sync);
        logger.info("TimescaleDB models synchronized", this.config.sync);
      }

      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to TimescaleDB",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Closes database connection and performs cleanup
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   *
   * @example
   * ```typescript
   * await service.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (this.sequelize) {
      try {
        await this.sequelize.close();
        this.sequelize = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from TimescaleDB",
          ErrorCode.CONNECTION_ERROR,
          500,
          { error: String(error) }
        );
      }
    }
  }

  /**
   * Performs health check on the database connection
   *
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.sequelize) {
      return {
        status: "unhealthy",
        message: "TimescaleDB connection not initialized",
        timestamp: new Date(),
      };
    }

    try {
      await this.sequelize.authenticate();
      return {
        status: "healthy",
        message: "TimescaleDB is responsive",
        details: {
          database: this.config.connection.getDatabase(),
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gets the Sequelize instance for database operations
   *
   * @returns {Sequelize} Sequelize instance
   * @throws {ApplicationError} If Sequelize is not initialized
   *
   * @example
   * ```typescript
   * const sequelize = service.getSequelize();
   * const users = await sequelize.model('User').findAll();
   * ```
   */
  getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new ApplicationError(
        "TimescaleDB connection not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.sequelize;
  }

  /**
   * Creates Sequelize configuration options from service config
   *
   * @private
   * @returns {SequelizeOptions} Sequelize configuration options
   */
  private createSequelizeOptions(): SequelizeOptions {
    const conn = this.config.connection;
    return {
      dialect: "postgres",
      host: conn.getHost(),
      port: conn.getPort(),
      database: conn.getDatabase(),
      username: conn.getUser(),
      password: conn.getPassword(),
      logging: (msg: string) => logger.debug(msg),
      pool: {
        max: this.config.pool.max,
        min: this.config.pool.min,
        acquire: this.config.pool.acquireTimeout,
        idle: this.config.pool.idleTimeout,
      },
      dialectOptions: {
        connectTimeout: this.config.pool.connectionTimeoutMillis,
        statement_timeout: this.config.pool.statementTimeout,
        idle_in_transaction_session_timeout:
          this.config.pool.idleInTransactionSessionTimeout,
      },
    };
  }
}

export default TimescaleDBService;

```

### types

#### avsc.d.ts

```typescript
declare module "*.avsc" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export default value;
}

```

### utils

#### index.ts

```typescript
/**
 * @fileoverview Core utility functions providing common operations, environment handling,
 * data formatting, and enhanced error handling capabilities.
 * @module @qi/core/utils
 *
 * Key Features:
 * - Environment file loading and parsing
 * - Secure cryptographic hashing
 * - Data formatting (bytes, JSON, truncation)
 * - Retry mechanisms for operations
 * - Lodash utility re-exports
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-28
 */

import {
  debounce,
  throttle,
  merge as deepMerge,
  isPlainObject,
  uniqBy as uniqueBy,
} from "lodash-es";
import { createHash } from "crypto";
import bytes from "bytes";
import retry from "retry";
import { promises as fs } from "fs";
import chalk from "chalk";

// Re-export lodash utilities
export { debounce, throttle, deepMerge, isPlainObject, uniqueBy };

/**
 * Handles file not found errors by returning a fallback value.
 * Used for graceful handling of missing config/env files.
 *
 * @param promise - Promise that might reject with ENOENT/ENOTDIR
 * @param fallbackValue - Value to return if file not found
 * @returns Promise resolving to either the original value or fallback
 *
 * @example
 * ```typescript
 * const content = await orIfFileNotExist(
 *   fs.readFile('config.json'),
 *   '{}'
 * );
 * ```
 */
async function orIfFileNotExist<T>(
  promise: Promise<T>,
  fallbackValue: T
): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    if (
      (e as NodeJS.ErrnoException).code === "ENOENT" ||
      (e as NodeJS.ErrnoException).code === "ENOTDIR"
    ) {
      return fallbackValue;
    }
    throw e;
  }
}

/**
 * Parses environment file content in KEY=VALUE format.
 * Handles comments, empty lines, and quoted values.
 *
 * @param content - Raw content of environment file
 * @returns Object mapping environment variable names to values
 *
 * @example
 * ```typescript
 * const vars = parseEnvFile(`
 *   # Database config
 *   DB_HOST=localhost
 *   DB_PORT=5432
 *   DB_NAME="my_app"
 * `);
 * ```
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  content.split("\n").forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith("#")) return;

    const [key, ...valueParts] = line.split("=");
    if (!key || valueParts.length === 0) return;

    const value = valueParts.join("=").trim();
    result[key.trim()] = value.replace(/^["']|["']$/g, "");
  });

  return result;
}

/**
 * Loads and parses environment variables from a file.
 * Supports optional overriding of existing variables.
 *
 * @param envFile - Path to environment file
 * @param options - Configuration options
 *        - override: Whether to override existing variables
 * @returns Parsed environment variables or null if file doesn't exist
 *
 * @example
 * ```typescript
 * // Load without overriding existing vars
 * const vars = await loadEnv('.env');
 *
 * // Load and override existing vars
 * const vars = await loadEnv('.env.local', { override: true });
 * ```
 */
export async function loadEnv(
  envFile: string,
  options: { override?: boolean } = {}
): Promise<Record<string, string> | null> {
  const data = await orIfFileNotExist(fs.readFile(envFile, "utf8"), null);
  if (data === null) return null;

  const parsed = parseEnvFile(data);

  if (options.override) {
    Object.entries(parsed).forEach(([key, value]) => {
      process.env[key] = value;
    });
  } else {
    Object.entries(parsed).forEach(([key, value]) => {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = value;
      }
    });
  }

  return parsed;
}

/**
 * Creates a SHA-256 hash of the input string.
 *
 * @param input - String to hash
 * @returns Hexadecimal hash string
 *
 * @example
 * ```typescript
 * const hashedPassword = hash('user-password');
 * ```
 */
export function hash(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Formats byte sizes into human-readable strings.
 *
 * @param byteCount - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with units (e.g., "1.5 MB")
 *
 * @example
 * ```typescript
 * console.log(formatBytes(1536)); // "1.5 KB"
 * console.log(formatBytes(1048576, 1)); // "1.0 MB"
 * ```
 */
export function formatBytes(byteCount: number, decimals = 2): string {
  return bytes.format(byteCount, {
    unitSeparator: " ",
    decimalPlaces: decimals,
  });
}

/**
 * Truncates a string to specified length, adding ellipsis if needed.
 *
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string with ellipsis if needed
 *
 * @example
 * ```typescript
 * console.log(truncate("Long text here", 8)); // "Long ..."
 * ```
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

/**
 * Retries an asynchronous operation with exponential backoff.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 *        - retries: Maximum number of attempts
 *        - minTimeout: Initial timeout in milliseconds
 * @returns Promise resolving to function result
 *
 * @example
 * ```typescript
 * const data = await retryOperation(
 *   () => fetchData(),
 *   { retries: 3, minTimeout: 1000 }
 * );
 * ```
 */
export async function retryOperation<T>(
  fn: () => Promise<T>,
  options: {
    retries: number;
    minTimeout: number;
    onRetry?: (times: number) => void;
  } = { retries: 3, minTimeout: 1000 }
): Promise<T> {
  const operation = retry.operation({
    ...options,
    randomize: false,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        if (!operation.retry(err as Error)) {
          reject(operation.mainError());
        } else if (options.onRetry) {
          options.onRetry(operation.attempts());
        }
      }
    });
  });
}

/**
 * Formats a JSON object with color-coded syntax highlighting.
 * Color scheme:
 * - Blue: Property keys
 * - Green: String values
 * - Yellow: Numbers, booleans, null
 * - White: Structural characters
 *
 * @param obj - Object to format
 * @returns Color-formatted JSON string
 *
 * @example
 * ```typescript
 * console.log(formatJsonWithColor({
 *   name: "test",
 *   count: 42,
 *   active: true
 * }));
 * ```
 */
export const formatJsonWithColor = (obj: unknown): string => {
  const colorizeValue = (value: unknown): string => {
    if (typeof value === "string") {
      return chalk.green(`"${value}"`);
    }
    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      return chalk.yellow(String(value));
    }
    return String(value);
  };

  const formatWithIndent = (data: unknown, indent = 0): string => {
    const spaces = " ".repeat(indent * 2);

    if (Array.isArray(data)) {
      if (data.length === 0) return "[]";
      const items = data
        .map((item) => `${spaces}  ${formatWithIndent(item, indent + 1)}`)
        .join(",\n");
      return `[\n${items}\n${spaces}]`;
    }

    if (data && typeof data === "object" && data !== null) {
      if (Object.keys(data).length === 0) return "{}";
      const entries = Object.entries(data)
        .map(([key, value]) => {
          const coloredKey = chalk.blue(`"${key}"`);
          const formattedValue = formatWithIndent(value, indent + 1);
          return `${spaces}  ${coloredKey}: ${formattedValue}`;
        })
        .join(",\n");
      return `{\n${entries}\n${spaces}}`;
    }

    return colorizeValue(data);
  };

  return formatWithIndent(obj);
};

```

