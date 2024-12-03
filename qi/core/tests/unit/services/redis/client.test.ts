/**
 * @fileoverview Redis Client Unit Tests
 * @module @qi/core/tests/unit/services/redis/client
 * @description Tests Redis client implementation
 *
 * @author Zhifeng Zhang
 * @created 2024-12-02
 * @modified 2024-12-03
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Redis } from "ioredis";
import { RedisClient } from "@qi/core/services/redis";

vi.mock("ioredis");

describe("RedisClient", () => {
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

  const mockConfig = {
    connection: {
      getHost: () => "localhost",
      getPort: () => 6379,
      getConnectionString: () => "redis://:password123@localhost:6379",
      getMaxRetries: () => 3,
    },
    options: {
      keyPrefix: "test:",
      commandTimeout: 1000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Redis).mockImplementation(() => mockRedis as unknown as Redis);
  });

  it("creates client with correct config", () => {
    new RedisClient(mockConfig);
    expect(Redis).toHaveBeenCalledWith({
      host: "localhost",
      port: 6379,
      password: "password123",
      maxRetriesPerRequest: 3,
      retryStrategy: expect.any(Function),
      keyPrefix: "test:",
      commandTimeout: 1000,
    });
  });

  it("handles ping success", async () => {
    const client = new RedisClient(mockConfig);
    mockRedis.ping.mockResolvedValue("PONG");

    const result = await client.ping();
    expect(result).toBe(true);
  });

  it("handles basic operations", async () => {
    const client = new RedisClient(mockConfig);

    mockRedis.get.mockResolvedValue("value");
    mockRedis.set.mockResolvedValue("OK");
    mockRedis.del.mockResolvedValue(1);

    expect(await client.get("key")).toBe("value");
    expect(await client.set("key", "value")).toBe("OK");
    expect(await client.del("key")).toBe(1);
  });

  it("handles scan operation", async () => {
    const client = new RedisClient(mockConfig);
    mockRedis.scan.mockResolvedValue(["0", ["key1", "key2"]]);

    const [cursor, keys] = await client.scan(
      "0",
      "MATCH",
      "test*",
      "COUNT",
      100
    );
    expect(cursor).toBe("0");
    expect(keys).toEqual(["key1", "key2"]);
  });
});
