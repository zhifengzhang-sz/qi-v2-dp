/**
 * @fileoverview Redis Service Unit Tests
 * @module @qi/core/tests/unit/services/redis/service
 * @description Tests Redis service implementation
 *
 * @author Zhifeng Zhang
 * @created 2024-12-04
 * @modified 2024-12-05
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { RedisService } from "@qi/core/services/redis";

vi.mock("ioredis");
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("RedisService", () => {
  const mockRedis = {
    on: vi.fn(),
    ping: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
    scan: vi.fn(),
  };

  const mockConnection = {
    getHost: () => "localhost",
    getPort: () => 6379,
    getConnectionString: () => "redis://:password123@localhost:6379",
    getPassword: () => "password123",
    getDatabase: () => "0",
    getUser: () => "default",
    getMaxRetries: () => 3,
  };

  const mockConfig = {
    enabled: true,
    connection: mockConnection,
    options: {
      keyPrefix: "test:",
      commandTimeout: 1000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Redis).mockImplementation(() => mockRedis as unknown as Redis);
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      const service = new RedisService(mockConfig);
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      const service = new RedisService({ ...mockConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(Redis).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      const service = new RedisService(mockConfig);
      mockRedis.ping.mockResolvedValue("PONG");

      await service.connect();
      expect(Redis).toHaveBeenCalledWith({
        host: "localhost",
        port: 6379,
        password: "password123",
        maxRetriesPerRequest: 3,
        retryStrategy: expect.any(Function),
        keyPrefix: "test:",
        commandTimeout: 1000,
      });
      expect(await service.isHealthy()).toBe(true);
    });

    it("handles connection failure", async () => {
      const service = new RedisService(mockConfig);
      mockRedis.ping.mockRejectedValue(new Error("Connection failed"));

      await expect(service.connect()).rejects.toThrow(
        "Failed to connect to Redis"
      );
    });

    it("disconnects properly", async () => {
      const service = new RedisService(mockConfig);
      mockRedis.ping.mockResolvedValue("PONG");
      mockRedis.quit.mockResolvedValue("OK");

      await service.connect();
      await service.disconnect();

      expect(mockRedis.quit).toHaveBeenCalled();
      mockRedis.ping.mockRejectedValue(new Error("Not connected"));
      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe("health checks", () => {
    it("performs health check successfully", async () => {
      const service = new RedisService(mockConfig);
      mockRedis.ping.mockResolvedValue("PONG");
      await service.connect();

      const health = await service["checkHealth"]();
      expect(health.status).toBe("healthy");
      expect(health.message).toBe("Redis is responsive");
    });

    it("handles failed health check during operation", async () => {
      const service = new RedisService(mockConfig);
      // First allow connection to succeed
      mockRedis.ping.mockResolvedValueOnce("PONG");
      await service.connect();

      // Then simulate a health check failure
      mockRedis.ping.mockRejectedValueOnce(new Error("Health check failed"));

      const health = await service["checkHealth"]();
      expect(health.status).toBe("unhealthy");
      expect(health.message).toContain("Health check failed");
    });
  });

  describe("client operations", () => {
    it("provides access to Redis client", async () => {
      const service = new RedisService(mockConfig);
      mockRedis.ping.mockResolvedValue("PONG");
      await service.connect();

      const client = service.getClient();
      expect(client).toBeDefined();
      expect(client).toBe(mockRedis);
    });

    it("throws when accessing client before initialization", () => {
      const service = new RedisService(mockConfig);
      expect(() => service.getClient()).toThrow("Redis client not initialized");
    });
  });

  describe("password extraction", () => {
    it("extracts password from connection string", () => {
      const service = new RedisService(mockConfig);
      expect(service["getPassword"]()).toBe("password123");
    });

    it("falls back to direct password", () => {
      const configWithoutConnString = {
        ...mockConfig,
        connection: {
          ...mockConnection,
          getConnectionString: () => "invalid://url",
        },
      };
      const service = new RedisService(configWithoutConnString);
      expect(service["getPassword"]()).toBe("password123");
    });
  });
});
