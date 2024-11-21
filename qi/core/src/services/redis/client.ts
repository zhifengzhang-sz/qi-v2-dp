/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

import { Redis } from "ioredis";
import { RedisError, REDIS_ERROR_CODES } from "./errors.js";
import { RedisServiceEvents, RedisService } from "./types.js";
import { retryOperation } from "@qi/core/utils";
import { Logger } from "winston";

export class RedisClient implements RedisService {
  private client: Redis;
  private isConnected: boolean = false;
  private logger: Logger;

  constructor(client: Redis, logger: Logger) {
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

  public getClient(): Redis {
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
          return this.client.ping();
        },
        {
          retries: 3,
          minTimeout: 1000,
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
