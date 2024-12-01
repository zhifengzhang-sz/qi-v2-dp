/**
 * @fileoverview Redis Service Unit Tests
 * @module @qi/core/tests/unit/services/redis/client.test
 *
 * @description
 * Unit tests for the Redis client implementation using Vitest.
 * Tests connection handling, operations, error scenarios, and retry logic.
 *
 * @author Claude AI
 * @modified 2024-12-01
 * @created 2024-12-01
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { Redis } from "ioredis";
import { RedisClient } from "@qi/core/services/redis";
import { ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { retryOperation } from "@qi/core/utils";

// Mock external dependencies
vi.mock("ioredis");
vi.mock("@qi/core/logger");
vi.mock("@qi/core/utils");

// Test configuration setup
const mockConfig = {
  connection: {
    getHost: vi.fn().mockReturnValue("localhost"),
    getPort: vi.fn().mockReturnValue(6379),
    getConnectionString: vi
      .fn()
      .mockReturnValue("redis://:password@localhost:6379"),
    getMaxRetries: vi.fn().mockReturnValue(3),
  },
  options: {
    keyPrefix: "test:",
    commandTimeout: 1000,
  },
};

describe("RedisClient", () => {
  let client: RedisClient;
  let mockRedis: Redis;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Redis mock
    mockRedis = {
      on: vi.fn(),
      ping: vi.fn(),
      quit: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
    } as unknown as Redis;

    vi.mocked(Redis).mockImplementation(() => mockRedis);

    // Create new client instance
    client = new RedisClient(mockConfig);
  });

  describe("initialization", () => {
    it("should create client with correct configuration", () => {
      expect(Redis).toHaveBeenCalledWith({
        host: "localhost",
        port: 6379,
        password: "password",
        maxRetriesPerRequest: 3,
        retryStrategy: expect.any(Function),
        keyPrefix: "test:",
        commandTimeout: 1000,
      });
    });

    it("should setup required event listeners", () => {
      expect(mockRedis.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function)
      );
      expect(mockRedis.on).toHaveBeenCalledWith("error", expect.any(Function));
      expect(mockRedis.on).toHaveBeenCalledWith("close", expect.any(Function));
    });

    /**
     * For the connection string parsing test:
     */
    it("should parse connection string correctly", () => {
      const config = {
        ...mockConfig,
        connection: {
          ...mockConfig.connection,
          getConnectionString: vi
            .fn()
            .mockReturnValue("redis://:complex%23password@localhost:6379"),
          getHost: vi.fn().mockReturnValue("localhost"),
          getPort: vi.fn().mockReturnValue(6379),
          getMaxRetries: vi.fn().mockReturnValue(3),
        },
      };

      new RedisClient(config);

      // Use lastCalledWith instead of toHaveBeenCalledWith
      expect(Redis).lastCalledWith({
        host: "localhost",
        port: 6379,
        password: "complex%23password",
        maxRetriesPerRequest: 3,
        retryStrategy: expect.any(Function),
        keyPrefix: "test:",
        commandTimeout: 1000,
      });
    });
  });

  describe("health check", () => {
    it("should return true on successful ping", async () => {
      vi.mocked(retryOperation).mockResolvedValueOnce("PONG");

      const result = await client.ping();

      expect(result).toBe(true);
      expect(retryOperation).toHaveBeenCalledWith(expect.any(Function), {
        retries: 3,
        minTimeout: 1000,
        onRetry: expect.any(Function),
      });
    });

    it("should throw ApplicationError on ping failure", async () => {
      const error = new Error("Connection failed");
      vi.mocked(retryOperation).mockRejectedValueOnce(error);

      const promise = client.ping();

      await expect(promise).rejects.toEqual(
        expect.objectContaining({
          code: ErrorCode.PING_ERROR,
          details: expect.objectContaining({
            operation: "ping",
            error: expect.any(String),
          }),
        })
      );
    });
  });

  describe("connection management", () => {
    it("should close connection gracefully", async () => {
      vi.mocked(mockRedis.quit).mockResolvedValueOnce("OK");

      await client.close();

      expect(mockRedis.quit).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        "Redis connection closed gracefully"
      );
    });

    it("should handle connection close failure", async () => {
      const error = new Error("Failed to close");
      vi.mocked(mockRedis.quit).mockRejectedValueOnce(error);

      const promise = client.close();

      await expect(promise).rejects.toEqual(
        expect.objectContaining({
          code: ErrorCode.CONNECTION_ERROR,
          details: expect.objectContaining({
            operation: "close",
            error: expect.any(String),
          }),
        })
      );
    });
  });

  describe("data operations", () => {
    describe("get", () => {
      it("should retrieve existing value", async () => {
        vi.mocked(mockRedis.get).mockResolvedValueOnce("value");

        const result = await client.get("test-key");

        expect(result).toBe("value");
        expect(mockRedis.get).toHaveBeenCalledWith("test-key");
      });

      it("should return null for non-existent key", async () => {
        vi.mocked(mockRedis.get).mockResolvedValueOnce(null);

        const result = await client.get("missing-key");

        expect(result).toBeNull();
        expect(mockRedis.get).toHaveBeenCalledWith("missing-key");
      });

      it("should handle get operation failure", async () => {
        vi.mocked(mockRedis.get).mockRejectedValueOnce(new Error("Get failed"));

        const promise = client.get("test-key");

        await expect(promise).rejects.toEqual(
          expect.objectContaining({
            code: ErrorCode.OPERATION_ERROR,
            details: expect.objectContaining({
              operation: "get",
              key: "test-key",
              error: expect.any(String),
            }),
          })
        );
      });
    });

    describe("set", () => {
      it("should set value successfully", async () => {
        vi.mocked(mockRedis.set).mockResolvedValueOnce("OK");

        const result = await client.set("test-key", "test-value");

        expect(result).toBe("OK");
        expect(mockRedis.set).toHaveBeenCalledWith("test-key", "test-value");
      });

      it("should handle set operation failure", async () => {
        vi.mocked(mockRedis.set).mockRejectedValueOnce(new Error("Set failed"));

        const promise = client.set("test-key", "test-value");

        await expect(promise).rejects.toEqual(
          expect.objectContaining({
            code: ErrorCode.OPERATION_ERROR,
            details: expect.objectContaining({
              operation: "set",
              key: "test-key",
              error: expect.any(String),
            }),
          })
        );
      });
    });

    describe("del", () => {
      it("should delete existing key", async () => {
        vi.mocked(mockRedis.del).mockResolvedValueOnce(1);

        const result = await client.del("test-key");

        expect(result).toBe(1);
        expect(mockRedis.del).toHaveBeenCalledWith("test-key");
      });

      it("should return 0 for non-existent key", async () => {
        vi.mocked(mockRedis.del).mockResolvedValueOnce(0);

        const result = await client.del("missing-key");

        expect(result).toBe(0);
        expect(mockRedis.del).toHaveBeenCalledWith("missing-key");
      });

      it("should handle delete operation failure", async () => {
        vi.mocked(mockRedis.del).mockRejectedValueOnce(
          new Error("Delete failed")
        );

        const promise = client.del("test-key");

        await expect(promise).rejects.toEqual(
          expect.objectContaining({
            code: ErrorCode.OPERATION_ERROR,
            details: expect.objectContaining({
              operation: "del",
              key: "test-key",
              error: expect.any(String),
            }),
          })
        );
      });
    });
  });

  describe("event handling", () => {
    it("should log connection events", () => {
      // Get connect handler
      const connectHandler = vi
        .mocked(mockRedis.on)
        .mock.calls.find((call) => call[0] === "connect")?.[1];

      // Get close handler
      const closeHandler = vi
        .mocked(mockRedis.on)
        .mock.calls.find((call) => call[0] === "close")?.[1];

      // Trigger events
      connectHandler?.();
      closeHandler?.();

      expect(logger.info).toHaveBeenCalledWith("Redis connected", {
        host: "localhost",
        port: 6379,
      });
      expect(logger.info).toHaveBeenCalledWith("Redis connection closed");
    });

    it("should log errors", () => {
      const error = new Error("Connection error");

      const errorHandler = vi
        .mocked(mockRedis.on)
        .mock.calls.find((call) => call[0] === "error")?.[1];

      errorHandler?.(error);

      expect(logger.error).toHaveBeenCalledWith("Redis error", {
        error: "Connection error",
        host: "localhost",
        port: 6379,
      });
    });
  });
});
