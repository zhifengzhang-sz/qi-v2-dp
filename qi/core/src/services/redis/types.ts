/**
 * @fileoverview
 * @module types.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

// src/services/redis/types.ts
import type { Redis, RedisOptions } from "ioredis";

/**
 * Events emitted by the Redis service.
 */
export interface RedisServiceEvents {
  connect: () => void;
  error: (error: Error) => void;
  close: () => void;
  reconnecting: (attempt: number) => void;
}

/**
 * Configuration options for the Redis service.
 * Extends the ioredis RedisOptions to include additional custom settings.
 */
export interface RedisServiceOptions extends RedisOptions {
  keyPrefix?: string;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
}

/**
 * Interface representing the Redis service.
 */
export interface RedisService {
  /**
   * Retrieves the Redis client instance.
   * @returns The Redis client.
   */
  getClient(): Redis;

  /**
   * Pings the Redis server to check connectivity.
   * @returns A promise that resolves to `true` if the ping is successful.
   */
  ping(): Promise<boolean>;

  /**
   * Closes the Redis connection.
   * @returns A promise that resolves when the connection is closed.
   */
  close(): Promise<void>;

  /**
   * Subscribes to a specific Redis service event.
   * @param event - The event name.
   * @param listener - The callback function for the event.
   */
  on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void;
}
