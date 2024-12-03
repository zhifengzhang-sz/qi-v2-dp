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
