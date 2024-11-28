/**
 * @fileoverview Base Redis service types
 * @module @qi/core/services/redis/base/types
 * @description Defines core interfaces for Redis service functionality including
 * connection management, events, and operations.
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-28
 * @created 2024-11-21
 */

import type { Redis as RedisClient } from "ioredis";

/**
 * Redis service event handler types
 * Maps event names to handler function signatures
 *
 * @interface
 */
export interface RedisServiceEvents {
  connect: () => void;
  error: (error: Error) => void;
  close: () => void;
  reconnecting: (attempt: number) => void;
}

/**
 * Core Redis service interface
 * Defines base functionality required by all Redis clients
 *
 * @interface
 */
export interface RedisBaseService {
  getClient(): RedisClient;
  ping(): Promise<boolean>;
  close(): Promise<void>;
  on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void;
}
