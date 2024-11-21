## Redis service

### Types: `qi/core/src/services/redis/types.ts`
```typescript
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
```

### Client: `qi/core/src/services/redis/client.ts`

```typescript
// src/services/redis/client.ts
import { Redis } from "ioredis";
import { logger } from "@qi/core/logger";
import { CacheError } from "@qi/core/errors";
import { retryOperation } from "@qi/core/utils";
import type { ServiceDSL } from "@qi/core/services/config/types";
import type { RedisService, RedisServiceOptions } from "./types.js";

export class RedisClientService implements RedisService {
  private static instance: RedisClientService;
  private client: Redis;
  private isConnected: boolean = false;

  private constructor(
    config: ServiceDSL["databases"]["redis"],
    options?: RedisServiceOptions
  ) {
    this.client = this.createClient(config, options);
    this.setupEventHandlers();
  }

  public static async initialize(
    config: ServiceDSL["databases"]["redis"],
    options?: RedisServiceOptions
  ): Promise<RedisClientService> {
    if (!RedisClientService.instance) {
      RedisClientService.instance = new RedisClientService(config, options);
      await RedisClientService.instance.waitForConnection();
    }
    return RedisClientService.instance;
  }

  private createClient(
    config: ServiceDSL["databases"]["redis"],
    options?: RedisServiceOptions
  ): Redis {
    try {
      const redisOptions: RedisOptions = {
        retryStrategy: (times: number) => {
          const { maxRetries, retryDelayMs, maxRetryDelayMs } = config.options;
          
          if (times > maxRetries) {
            logger.error("Max redis retry attempts reached", { attempts: times });
            return null;
          }

          const delay = Math.min(times * retryDelayMs, maxRetryDelayMs);
          logger.debug("Redis retry attempt", { attempt: times, delay });
          return delay;
        },
        enableReadyCheck: options?.enableReadyCheck ?? true,
        maxRetriesPerRequest: options?.maxRetriesPerRequest ?? config.options.maxRetries,
        keyPrefix: options?.keyPrefix,
      };

      return new Redis(config.connectionString, redisOptions);
    } catch (error) {
      throw new CacheError("Failed to create Redis client", {
        error: error instanceof Error ? error.message : String(error),
        connection: config.connectionString.replace(/:[^:@]+@/, ':***@'),
      });
    }
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      this.isConnected = true;
      logger.info("Redis client connected");
    });

    this.client.on("error", (error) => {
      logger.error("Redis client error", {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    this.client.on("close", () => {
      this.isConnected = false;
      logger.warn("Redis connection closed");
    });

    this.client.on("reconnecting", (attempt) => {
      logger.info("Redis client reconnecting", { attempt });
    });
  }

  private async waitForConnection(): Promise<void> {
    if (this.isConnected) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new CacheError("Redis connection timeout", {
          operation: "connect",
          timeout: 5000,
        }));
      }, 5000);

      this.client.once("connect", () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.once("error", (error) => {
        clearTimeout(timeout);
        reject(new CacheError("Redis connection failed", {
          error: error instanceof Error ? error.message : String(error),
        }));
      });
    });
  }

  public getClient(): Redis {
    if (!this.isConnected) {
      throw new CacheError("Redis client not connected", {
        operation: "getClient",
      });
    }
    return this.client;
  }

  public async ping(): Promise<boolean> {
    try {
      const result = await retryOperation(
        async () => this.client.ping(),
        { retries: 3, minTimeout: 1000 }
      );
      return result === "PONG";
    } catch (error) {
      throw new CacheError("Redis ping failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public async close(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      logger.info("Redis connection closed gracefully");
    } catch (error) {
      throw new CacheError("Failed to close Redis connection", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  public on<E extends keyof RedisServiceEvents>(
    event: E,
    listener: RedisServiceEvents[E]
  ): void {
    this.client.on(event, listener as any);
  }
}
```

### Index: `qi/core/src/services/redis/index.ts`

```typescript
// src/services/redis/index.ts
export { RedisClientService } from "./client.js";
export type { RedisService, RedisServiceOptions } from "./types.js";
```