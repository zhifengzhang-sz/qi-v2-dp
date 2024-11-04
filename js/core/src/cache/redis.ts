/**
 * @module cache/redis
 * @description Redis cache implementation using singleton pattern
 */

import { createClient } from 'redis';
import { logger } from '../logger/index.js';

/**
 * @class RedisCache
 * @description Manages Redis cache connections and operations
 * 
 * @example
 * const cache = RedisCache.getInstance();
 * await cache.connect();
 * await cache.set('key', 'value', 3600); // with 1 hour TTL
 * const value = await cache.get('key');
 * await cache.disconnect();
 */
export class RedisCache {
  /** Singleton instance */
  private static instance: RedisCache;
  /** Redis client instance */
  private client: ReturnType<typeof createClient>;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes Redis client and sets up event handlers
   */
  private constructor() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    this.client.on('error', error => {
      logger.error('Redis Client Error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
    });
  }

  /**
   * Gets the singleton instance of RedisCache
   * @returns RedisCache instance
   */
  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  /**
   * Connects to Redis server
   * @throws Will throw an error if connection fails
   */
  public async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Disconnects from Redis server
   * @throws Will throw an error if disconnection fails
   */
  public async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * Gets a value from cache by key
   * @param key Cache key
   * @returns Promise resolving to the cached value or null if not found
   * 
   * @example
   * const value = await cache.get('user:123');
   * if (value) {
   *   console.log('Found cached user:', value);
   * }
   */
  public async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Sets a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Optional time-to-live in seconds
   * 
   * @example
   * // Cache user data for 1 hour
   * await cache.set('user:123', JSON.stringify(userData), 3600);
   */
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Deletes a value from cache
   * @param key Cache key to delete
   */
  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Checks if a key exists in cache
   * @param key Cache key to check
   * @returns Promise resolving to boolean indicating if key exists
   */
  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Gets the remaining time-to-live for a key
   * @param key Cache key
   * @returns Promise resolving to remaining TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  public async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  /**
   * Deletes all keys from cache
   * @throws Will throw an error if flush fails
   * @warning Use with caution - this will clear all data
   */
  public async flush(): Promise<void> {
    await this.client.flushAll();
  }
}