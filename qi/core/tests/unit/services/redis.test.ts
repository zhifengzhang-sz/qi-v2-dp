/**
 * @fileoverview Redis Service Unit Tests
 * @module @qi/core/tests/unit/services/redis
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-28
 * @created 2024-11-26
 */

import { describe, it, beforeEach, expect, vi, afterEach } from "vitest";
import { Redis as RedisClient } from "ioredis";
import { Logger } from "winston";
import {
  RedisBaseClient,
  RedisAppClient,
  RedisError,
  REDIS_ERROR_CODES,
  redisConfigSchema,
  RedisConfig,
} from "@qi/core/services/redis";
import { Schema } from "@qi/core/config";
import { retryOperation } from "@qi/core/utils";

// Mock dependencies
vi.mock("ioredis");
vi.mock("winston");
vi.mock("@qi/core/utils", () => ({
  retryOperation: vi.fn(),
}));

describe("Redis Error Handling", () => {
  it("should create RedisError with correct properties", () => {
    const error = new RedisError(
      "Test error",
      REDIS_ERROR_CODES.CONNECTION_ERROR,
      {
        operation: "connect",
        timeout: 5000,
      }
    );

    expect(error.name).toBe("RedisError");
    expect(error.message).toBe("Test error");
    expect(error.code).toBe(REDIS_ERROR_CODES.CONNECTION_ERROR);
    expect(error.details).toEqual({
      operation: "connect",
      timeout: 5000,
    });
  });

  it("should create RedisError using factory method", () => {
    const error = RedisError.create(
      "Test error",
      REDIS_ERROR_CODES.TIMEOUT_ERROR,
      { operation: "ping" }
    );

    expect(error).toBeInstanceOf(RedisError);
    expect(error.code).toBe(REDIS_ERROR_CODES.TIMEOUT_ERROR);
  });
});

describe("Redis Config Schema", () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({ formats: true });
  });

  it("should validate valid Redis config", () => {
    const validConfig = {
      pools: {
        default: {
          min: 1,
          max: 10,
          acquireTimeoutMillis: 30000,
        },
      },
      retry: {
        maxAttempts: 3,
        initialDelayMs: 1000,
      },
      features: {
        enableAutoPipelining: true,
        keyPrefix: "app:",
      },
      monitoring: {
        enableMetrics: true,
        metricsInterval: 15000,
      },
    };

    expect(() => {
      schema.registerSchema("redis-config", redisConfigSchema);
      schema.validate(validConfig, "redis-config");
    }).not.toThrow();
  });

  it("should reject invalid Redis config", () => {
    const invalidConfig = {
      pools: {
        default: {
          min: -1, // Invalid: minimum must be >= 0
          max: 5,
        },
      },
    };

    expect(() => {
      schema.registerSchema("redis-config", redisConfigSchema);
      schema.validate(invalidConfig, "redis-config");
    }).toThrow();
  });
});

describe("RedisBaseClient", () => {
  let mockRedisClient: ReturnType<typeof vi.mocked<RedisClient>>;
  let mockLogger: ReturnType<typeof vi.mocked<Logger>>;
  let baseClient: RedisBaseClient;

  beforeEach(() => {
    mockRedisClient = {
      on: vi.fn(),
      once: vi.fn(),
      ping: vi.fn(),
      quit: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<RedisClient>>;

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<Logger>>;

    baseClient = new RedisBaseClient(mockRedisClient, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection Management", () => {
    it("should setup event listeners on construction", () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "error",
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "close",
        expect.any(Function)
      );
      expect(mockRedisClient.on).toHaveBeenCalledWith(
        "reconnecting",
        expect.any(Function)
      );
    });

    it("should handle successful connection", async () => {
      // Simulate successful connection
      const connectHandler = mockRedisClient.on.mock.calls.find(
        (call) => call[0] === "connect"
      )?.[1];
      connectHandler?.();

      const client = baseClient.getClient();
      expect(client).toBe(mockRedisClient);
    });

    it("should throw error when getting client before connection", () => {
      expect(() => baseClient.getClient()).toThrow(RedisError);
    });
  });

  describe("Health Checks", () => {
    it("should perform ping with retries", async () => {
      mockRedisClient.ping.mockResolvedValue("PONG");
      (retryOperation as ReturnType<typeof vi.fn>).mockImplementation((fn) =>
        fn()
      );

      const result = await baseClient.ping();

      expect(result).toBe(true);
      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(retryOperation).toHaveBeenCalled();
    });

    it("should handle ping failure", async () => {
      const error = new Error("Ping failed");
      (retryOperation as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      await expect(baseClient.ping()).rejects.toThrow(RedisError);
      expect(mockLogger.debug).toHaveBeenCalledWith("Ping attempt 1");
    });
  });

  describe("Graceful Shutdown", () => {
    it("should close connection successfully", async () => {
      mockRedisClient.quit.mockResolvedValue("OK");

      await baseClient.close();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Connection closed gracefully"
      );
    });

    it("should handle close failure", async () => {
      mockRedisClient.quit.mockRejectedValue(new Error("Close failed"));

      await expect(baseClient.close()).rejects.toThrow(RedisError);
    });
  });
});

describe("RedisAppClient", () => {
  let mockBaseClient: ReturnType<typeof vi.mocked<RedisBaseClient>>;
  let mockRedisClient: ReturnType<typeof vi.mocked<RedisClient>>;
  let appClient: RedisAppClient;

  const config: RedisConfig = {
    type: "redis",
    version: "1.0.0",
    features: {
      keyPrefix: "test:",
      enableAutoPipelining: true,
      enableOfflineQueue: true,
      enableReadyCheck: true,
      commandTimeout: 5000,
      keepAlive: 30000,
    },
    pools: {
      default: {
        min: 1,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 5000,
        idleTimeoutMillis: 60000,
        evictionRunIntervalMillis: 30000,
        softIdleTimeoutMillis: 30000,
      },
    },
    retry: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      factorMultiplier: 2,
    },
    monitoring: {
      enableMetrics: true,
      metricsInterval: 15000,
      enableHealthCheck: true,
      healthCheckInterval: 30000,
    },
  };

  beforeEach(() => {
    mockRedisClient = {
      get: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<RedisClient>>;

    mockBaseClient = {
      getClient: vi.fn().mockReturnValue(mockRedisClient),
      ping: vi.fn(),
      close: vi.fn(),
      on: vi.fn(),
    } as unknown as ReturnType<typeof vi.mocked<RedisBaseClient>>;

    appClient = new RedisAppClient(mockBaseClient, config);
  });
  describe("Key Operations", () => {
    it("should get value with prefix", async () => {
      mockRedisClient.get.mockResolvedValue("value");

      const result = await appClient.get("key");

      expect(result).toBe("value");
      expect(mockRedisClient.get).toHaveBeenCalledWith("test:key");
    });

    it("should handle null response", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await appClient.get("key");

      expect(result).toBeNull();
    });

    it("should work without configured prefix", async () => {
      appClient = new RedisAppClient(mockBaseClient, {});
      mockRedisClient.get.mockResolvedValue("value");

      const result = await appClient.get("key");

      expect(mockRedisClient.get).toHaveBeenCalledWith("key");
    });
  });

  describe("Pool Configuration", () => {
    it("should return pool config for default pool", () => {
      const poolConfig = appClient.getPoolConfig();

      expect(poolConfig).toEqual({
        min: 1,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 5000,
        idleTimeoutMillis: 60000,
        evictionRunIntervalMillis: 30000,
        softIdleTimeoutMillis: 30000,
      });
    });

    it("should return undefined for non-existent pool", () => {
      appClient = new RedisAppClient(mockBaseClient, config, "nonexistent");

      const poolConfig = appClient.getPoolConfig();

      expect(poolConfig).toBeUndefined();
    });
  });

  describe("Key Operations", () => {
    it("should get value with prefix", async () => {
      mockRedisClient.get.mockResolvedValue("value");

      const result = await appClient.get("key");

      expect(result).toBe("value");
      expect(mockRedisClient.get).toHaveBeenCalledWith("test:key");
    });

    it("should handle null response", async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await appClient.get("key");

      expect(result).toBeNull();
    });

    it("should work without configured prefix", async () => {
      const configWithoutPrefix: RedisConfig = {
        ...config,
        features: { ...config.features, keyPrefix: "" },
      };
      appClient = new RedisAppClient(mockBaseClient, configWithoutPrefix);
      mockRedisClient.get.mockResolvedValue("value");

      const result = await appClient.get("key");

      expect(mockRedisClient.get).toHaveBeenCalledWith("key");
    });
  });

  describe("Delegation", () => {
    it("should delegate ping to base client", async () => {
      mockBaseClient.ping.mockResolvedValue(true);

      const result = await appClient.ping();

      expect(result).toBe(true);
      expect(mockBaseClient.ping).toHaveBeenCalled();
    });

    it("should delegate close to base client", async () => {
      await appClient.close();

      expect(mockBaseClient.close).toHaveBeenCalled();
    });

    it("should delegate event registration to base client", () => {
      const listener = () => {};
      appClient.on("connect", listener);

      expect(mockBaseClient.on).toHaveBeenCalledWith("connect", listener);
    });
  });
});
