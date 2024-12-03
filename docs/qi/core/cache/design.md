<blockquote>
we need a cache helper module in qi/core/src/cache:

1. must be a helper, which means it is not implementing fancy caching mechenism
2. it uses redis or file for actual storage
3. to utilize available tools to avoid heaving devlopment
4. it is a raw cache, which means just a key and content type of information is cached
5. it is easy to use for the domain specific cache (which is developed in the domain level)

</blockquote>

---

I'll help create a simple cache helper module that meets these requirements. This will be a lightweight wrapper around Redis or file-based storage that provides basic caching functionality.



```typescript
/**
 * @fileoverview Cache Helper Module
 * @module qi/core/src/cache
 *
 * @description
 * Provides a simple caching interface that can use either Redis or file system
 * as the underlying storage mechanism. This is a raw caching implementation
 * meant to be used as a building block for domain-specific caching solutions.
 *
 * Features:
 * - Simple key-value storage interface
 * - Support for both Redis and file-based storage
 * - Configurable TTL (Time To Live)
 * - Basic operations: get, set, delete, clear
 * - Optional JSON serialization
 *
 * @example Basic Usage
 * ```typescript
 * import { createCache } from '@qi/core/src/cache';
 *
 * // Create Redis-based cache
 * const cache = await createCache({
 *   storage: 'redis',
 *   prefix: 'myapp:',
 *   ttl: 3600
 * });
 *
 * await cache.set('key', 'value');
 * const value = await cache.get('key');
 * ```
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { RedisClient } from '../services/redis';

/**
 * Cache storage options
 */
export type CacheStorage = 'redis' | 'file';

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Storage mechanism to use */
  storage: CacheStorage;
  /** Key prefix for namespacing */
  prefix: string;
  /** Default TTL in seconds (0 = no expiry) */
  ttl?: number;
  /** Redis client (required for redis storage) */
  redis?: RedisClient;
  /** Base directory for file storage */
  baseDir?: string;
}

/**
 * Cache implementation
 */
export interface Cache {
  /** Get a value from cache */
  get<T = unknown>(key: string): Promise<T | null>;
  /** Set a value in cache */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  /** Delete a value from cache */
  delete(key: string): Promise<boolean>;
  /** Clear all values with this cache's prefix */
  clear(): Promise<void>;
  /** Check if key exists */
  exists(key: string): Promise<boolean>;
}

/**
 * Creates a cache instance with the specified storage backend
 */
export async function createCache(options: CacheOptions): Promise<Cache> {
  const {
    storage,
    prefix,
    ttl = 0,
    redis,
    baseDir = join(process.cwd(), '.cache')
  } = options;

  // Validate options
  if (storage === 'redis' && !redis) {
    throw new Error('Redis client is required for redis storage');
  }

  // Ensure cache directory exists for file storage
  if (storage === 'file') {
    await fs.mkdir(baseDir, { recursive: true });
  }

  /**
   * Generate consistent filename from key
   */
  const getFilePath = (key: string): string => {
    const hash = createHash('md5').update(key).digest('hex');
    return join(baseDir, `${prefix}${hash}.json`);
  };

  /**
   * Format full Redis key with prefix
   */
  const getRedisKey = (key: string): string => {
    return `${prefix}${key}`;
  };

  if (storage === 'redis') {
    return {
      async get<T>(key: string): Promise<T | null> {
        const value = await redis!.get(getRedisKey(key));
        if (!value) return null;
        return JSON.parse(value) as T;
      },

      async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
        const redisKey = getRedisKey(key);
        const serialized = JSON.stringify(value);
        const finalTtl = customTtl ?? ttl;
        
        if (finalTtl > 0) {
          await redis!.setex(redisKey, finalTtl, serialized);
        } else {
          await redis!.set(redisKey, serialized);
        }
      },

      async delete(key: string): Promise<boolean> {
        const result = await redis!.del(getRedisKey(key));
        return result > 0;
      },

      async clear(): Promise<void> {
        const keys = await redis!.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redis!.del(...keys);
        }
      },

      async exists(key: string): Promise<boolean> {
        return await redis!.exists(getRedisKey(key)) === 1;
      }
    };
  }

  // File-based storage implementation
  return {
    async get<T>(key: string): Promise<T | null> {
      try {
        const filePath = getFilePath(key);
        const content = await fs.readFile(filePath, 'utf-8');
        const { value, expires } = JSON.parse(content);

        if (expires && Date.now() > expires) {
          await fs.unlink(filePath);
          return null;
        }

        return value as T;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return null;
        }
        throw error;
      }
    },

    async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
      const finalTtl = customTtl ?? ttl;
      const expires = finalTtl > 0 ? Date.now() + finalTtl * 1000 : null;
      
      await fs.writeFile(
        getFilePath(key),
        JSON.stringify({ value, expires }),
        'utf-8'
      );
    },

    async delete(key: string): Promise<boolean> {
      try {
        await fs.unlink(getFilePath(key));
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return false;
        }
        throw error;
      }
    },

    async clear(): Promise<void> {
      const files = await fs.readdir(baseDir);
      await Promise.all(
        files
          .filter(file => file.startsWith(prefix))
          .map(file => fs.unlink(join(baseDir, file)))
      );
    },

    async exists(key: string): Promise<boolean> {
      try {
        await fs.access(getFilePath(key));
        return true;
      } catch {
        return false;
      }
    }
  };
}

// Export types
export type { RedisClient };

```

This cache helper module provides:

1. Simple interface with basic operations (get, set, delete, clear, exists)
2. Support for both Redis and file-based storage backends
3. Automatic JSON serialization/deserialization
4. TTL support for both storage types
5. Key prefixing for namespacing
6. Type-safe operations with generics

Key features:

1. Lightweight: Uses existing Redis client or file system
2. Flexible: Can switch between Redis and file storage
3. Simple: Just key-value storage with TTL
4. Type-safe: TypeScript generics for value types
5. Domain-friendly: Prefix support for domain separation

Usage examples for domain-specific caches:

```typescript
// Create a domain-specific user cache
const userCache = await createCache({
  storage: 'redis',
  prefix: 'users:',
  ttl: 3600,
  redis: redisClient
});

// Cache user data
await userCache.set('user:123', { name: 'Alice', role: 'admin' });
const user = await userCache.get('user:123');

// Create a file-based cache for temporary data
const tempCache = await createCache({
  storage: 'file',
  prefix: 'temp:',
  ttl: 300,
  baseDir: './cache'
});
```
