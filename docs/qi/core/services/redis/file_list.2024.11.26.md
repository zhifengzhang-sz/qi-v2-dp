## The `qi/core/src/services/redis` module
  
### The `qi/core/src/services/redis/config`
  
1. `qi/core/src/services/redis/config/types.ts`:
   ```ts
    /**
    * @fileoverview
    * @module types.ts
    *
    * @author zhifengzhang-sz
    * @created 2024-11-21
    * @modified 2024-11-25
    */
      
    import { BaseConfig } from "@qi/core/config";
      
    export interface RedisPoolConfig {
      min?: number;
      max?: number;
      acquireTimeoutMillis?: number;
      createTimeoutMillis?: number;
      idleTimeoutMillis?: number;
      evictionRunIntervalMillis?: number;
      softIdleTimeoutMillis?: number;
    }
      
    export interface RedisRetryStrategy {
      maxAttempts?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      factorMultiplier?: number;
    }
      
    /**
    * Redis application configuration
    * Focuses on behavioral settings, not connection details
    */
    export interface RedisConfig extends BaseConfig {
      pools?: Record<string, RedisPoolConfig>;
      retry?: RedisRetryStrategy;
      features?: {
        enableAutoPipelining?: boolean;
        enableOfflineQueue?: boolean;
        enableReadyCheck?: boolean;
        lazyConnect?: boolean;
        keyPrefix?: string;
        commandTimeout?: number;
        keepAlive?: number;
      };
      monitoring?: {
        enableMetrics?: boolean;
        metricsInterval?: number;
        enableHealthCheck?: boolean;
        healthCheckInterval?: number;
      };
    }
      
    ```  
  
2. `qi/core/src/services/redis/config/schema.ts`:
   ```ts
    /**
    * @fileoverview Redis Service Application Configuration Schema
    * @module @qi/core/services/redis/config/schema
    *
    * @description
    * Defines JSON Schema for Redis application-level configuration, focusing on
    * behavior, pooling, and features. Infrastructure settings (host, port, credentials)
    * are managed by the service-level configuration.
    *
    * @author Zhifeng Zhang
    * @created 2024-11-25
    */
      
    import { JsonSchema } from "@qi/core/config";
      
    /**
    * Schema for Redis pool configuration
    */
    const poolConfigSchema: JsonSchema = {
      type: "object",
      properties: {
        min: { type: "integer", minimum: 0, default: 1 },
        max: { type: "integer", minimum: 1, default: 10 },
        acquireTimeoutMillis: { type: "integer", minimum: 0, default: 30000 },
        createTimeoutMillis: { type: "integer", minimum: 0, default: 5000 },
        idleTimeoutMillis: { type: "integer", minimum: 0, default: 60000 },
        evictionRunIntervalMillis: { type: "integer", minimum: 0, default: 30000 },
        softIdleTimeoutMillis: { type: "integer", minimum: 0, default: 30000 },
      },
    };
      
    /**
    * Schema for Redis retry strategy
    */
    const retryStrategySchema: JsonSchema = {
      type: "object",
      properties: {
        maxAttempts: { type: "integer", minimum: 1, default: 3 },
        initialDelayMs: { type: "integer", minimum: 0, default: 1000 },
        maxDelayMs: { type: "integer", minimum: 0, default: 5000 },
        factorMultiplier: { type: "number", minimum: 1, default: 2 },
      },
    };
      
    /**
    * Complete Redis application configuration schema
    * Focuses on behavior and features, not connection details
    */
    export const redisConfigSchema: JsonSchema = {
      $id: "redis-app-config",
      type: "object",
      properties: {
        pools: {
          type: "object",
          properties: {
            default: poolConfigSchema,
          },
          additionalProperties: poolConfigSchema, // Allows any named pool with poolConfigSchema
        },
        retry: retryStrategySchema,
        features: {
          type: "object",
          properties: {
            enableAutoPipelining: { type: "boolean", default: true },
            enableOfflineQueue: { type: "boolean", default: true },
            enableReadyCheck: { type: "boolean", default: true },
            lazyConnect: { type: "boolean", default: false },
            keyPrefix: { type: "string" },
            commandTimeout: { type: "integer", minimum: 0, default: 5000 },
            keepAlive: { type: "integer", minimum: 0, default: 30000 },
          },
        },
        monitoring: {
          type: "object",
          properties: {
            enableMetrics: { type: "boolean", default: true },
            metricsInterval: { type: "integer", minimum: 1000, default: 15000 },
            enableHealthCheck: { type: "boolean", default: true },
            healthCheckInterval: { type: "integer", minimum: 1000, default: 30000 },
          },
        },
      },
    };
      
    ```  
  
### The `qi/core/src/services/redis`
  
1. `qi/core/src/services/redis/errors.ts`:
   ```ts
    /**
    * @fileoverview
    * @module errors
    *
    * @description
    * This module defines Redis-specific error handling.
    * It extends the base ApplicationError class to provide structured
    * error handling for the Redis service.
    *
    * @author Zhifeng Zhang
    * @created 2024-11-21
    * @modified 2024-11-22
    */
      
    import { ApplicationError, ErrorDetails } from "@qi/core/errors";
    import { ErrorCode } from "@qi/core/errors";
      
    export interface RedisErrorDetails extends ErrorDetails {
      operation?: string;
      timeout?: number;
      attempt?: number;
      error?: string;
      [key: string]: unknown;
    }
      
    export const REDIS_ERROR_CODES = {
      CONNECTION_ERROR: ErrorCode.CONNECTION_ERROR,
      TIMEOUT_ERROR: ErrorCode.TIMEOUT_ERROR,
      OPERATION_ERROR: ErrorCode.OPERATION_ERROR,
      CLIENT_ERROR: ErrorCode.CLIENT_ERROR,
      PING_ERROR: ErrorCode.PING_ERROR,
    } as const;
      
    export type RedisErrorCode = ErrorCode;
      
    export class RedisError extends ApplicationError {
      constructor(
        message: string,
        code: RedisErrorCode = ErrorCode.REDIS_ERROR,
        details?: RedisErrorDetails
      ) {
        super(message, code, 500, details);
        this.name = "RedisError";
      }
      
      static create(
        message: string,
        code: RedisErrorCode,
        details?: RedisErrorDetails
      ): RedisError {
        return new RedisError(message, code, details);
      }
    }
      
    ```  
  
### The `qi/core/src/services/base`
  
1. `qi/core/src/services/base/types.ts`:
   ```ts
    import type { Redis as RedisClient } from "ioredis";
      
    export interface RedisServiceEvents {
      connect: () => void;
      error: (error: Error) => void;
      close: () => void;
      reconnecting: (attempt: number) => void;
    }
      
    export interface RedisBaseService {
      getClient(): RedisClient;
      ping(): Promise<boolean>;
      close(): Promise<void>;
      on<E extends keyof RedisServiceEvents>(
        event: E,
        listener: RedisServiceEvents[E]
      ): void;
    }
      
    ```  
  
2. `qi/core/src/services/base/client.ts`:
   ```ts
    import type { Redis as RedisClient } from "ioredis";
    import { RedisError, REDIS_ERROR_CODES } from "../errors.js";
    import { RedisServiceEvents, RedisBaseService } from "./types.js";
    import { retryOperation } from "@qi/core/utils";
    import { Logger } from "winston";
      
    export class RedisBaseClient implements RedisBaseService {
      private client: RedisClient;
      private isConnected: boolean = false;
      private readonly logger: Logger;
      
      constructor(client: RedisClient, logger: Logger) {
        this.client = client;
        this.logger = logger;
        this.setupListeners();
      }
      
      private setupListeners(): void {
        this.client.on("connect", () => {
          this.isConnected = true;
          this.logger.info("Redis connected.");
        });
      
        this.client.on("error", (error) => {
          this.logger.error("Redis error:", error);
        });
      
        this.client.on("close", () => {
          this.isConnected = false;
          this.logger.info("Redis connection closed.");
        });
      
        this.client.on("reconnecting", (attempt: number) => {
          this.logger.info(`Redis reconnecting. Attempt ${attempt}.`);
        });
      }
      
      private async waitForConnection(): Promise<void> {
        if (this.isConnected) return;
      
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(
              RedisError.create(
                "Connection timeout",
                REDIS_ERROR_CODES.TIMEOUT_ERROR,
                {
                  operation: "connect",
                  timeout: 5000,
                }
              )
            );
          }, 5000);
      
          this.client.once("connect", () => {
            clearTimeout(timeout);
            this.isConnected = true;
            resolve();
          });
      
          this.client.once("error", (error) => {
            clearTimeout(timeout);
            reject(
              RedisError.create(
                "Connection failed",
                REDIS_ERROR_CODES.CONNECTION_ERROR,
                {
                  operation: "connect",
                  error: error instanceof Error ? error.message : String(error),
                }
              )
            );
          });
        });
      }
      
      public getClient(): RedisClient {
        if (!this.isConnected) {
          throw RedisError.create(
            "Client not connected",
            REDIS_ERROR_CODES.CLIENT_ERROR,
            { operation: "getClient" }
          );
        }
        return this.client;
      }
      
      public async ping(): Promise<boolean> {
        let attemptCount = 0;
        try {
          const result = await retryOperation(
            async () => {
              attemptCount += 1;
              this.logger.debug(`Ping attempt ${attemptCount}`);
              return await this.client.ping();
            },
            {
              retries: 3,
              minTimeout: 1000,
              onRetry: (times: number) => {
                this.logger.debug(`Retry attempt ${times}`);
              },
            }
          );
          return result === "PONG";
        } catch (error) {
          throw RedisError.create("Ping failed", REDIS_ERROR_CODES.PING_ERROR, {
            attempt: attemptCount,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      
      public async close(): Promise<void> {
        try {
          await this.client.quit();
          this.isConnected = false;
          this.logger.info("Connection closed gracefully");
        } catch (error) {
          throw RedisError.create(
            "Failed to close connection",
            REDIS_ERROR_CODES.OPERATION_ERROR,
            {
              operation: "close",
              error: error instanceof Error ? error.message : String(error),
            }
          );
        }
      }
      
      public on<E extends keyof RedisServiceEvents>(
        event: E,
        listener: RedisServiceEvents[E]
      ): void {
        this.client.on(event, listener);
      }
    }
      
    ```  
  
### The `qi/core/src/services/app`
  
1. `qi/core/src/services/app/types.ts`:
   ```ts
    import { RedisBaseService } from "../base/types.js";
    import { RedisPoolConfig } from "../config/types.js";
      
    export interface RedisAppService extends RedisBaseService {
      get(key: string): Promise<string | null>;
      getPoolConfig(): RedisPoolConfig | undefined;
      // Add other application-level methods
    }
      
    ```  
  
2. `qi/core/src/services/app/client.ts`:
  ```ts
    import { RedisConfig } from "../config/types.js";
    import { RedisAppService } from "./types.js";
    import { RedisServiceEvents } from "../base/types.js";
    import { RedisBaseClient } from "../base/client.js";
      
    export class RedisAppClient implements RedisAppService {
      private readonly baseClient: RedisBaseClient;
      private readonly config: RedisConfig;
      private readonly poolName: string;
      
      constructor(
        baseClient: RedisBaseClient,
        config: RedisConfig,
        poolName: string = "default"
      ) {
        this.baseClient = baseClient;
        this.config = config;
        this.poolName = poolName;
      }
      
      public getClient() {
        return this.baseClient.getClient();
      }
      
      public async ping(): Promise<boolean> {
        return this.baseClient.ping();
      }
      
      public async close(): Promise<void> {
        return this.baseClient.close();
      }
      
      public on<E extends keyof RedisServiceEvents>(
        event: E,
        listener: RedisServiceEvents[E]
      ): void {
        this.baseClient.on(event, listener);
      }
      
      public async get(key: string): Promise<string | null> {
        const client = this.baseClient.getClient();
        const prefixedKey = this.getPrefixedKey(key);
        return client.get(prefixedKey);
      }
      
      private getPrefixedKey(key: string): string {
        const prefix = this.config.features?.keyPrefix ?? "";
        return `${prefix}${key}`;
      }
      
      public getPoolConfig() {
        return this.config.pools?.[this.poolName];
      }
    }
      
    ```  
  