/**
 * @fileoverview Cache Helper Unit Tests
 * @module qi/core/tests/unit/cache/index.test
 *
 * @description
 * Unit tests for the cache helper implementation.
 * Tests both Redis and in-memory storage backends.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-02
 * @modified 2024-12-03
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Cache } from "@qi/core/cache";
import { Redis } from "ioredis";
import NodeCache from "node-cache";

// Create a proper mock of Redis
class MockRedis
  implements Pick<Redis, "get" | "set" | "setex" | "del" | "scan">
{
  get = vi.fn();
  set = vi.fn();
  setex = vi.fn();
  del = vi.fn();
  scan = vi.fn();
}

// Mock NodeCache module
vi.mock("node-cache", () => {
  const NodeCacheMock = vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    flushAll: vi.fn(),
    getStats: vi.fn(),
  }));
  return { default: NodeCacheMock };
});

describe("Cache", () => {
  let mockRedis: MockRedis;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis = new MockRedis();
  });

  describe("Redis Cache", () => {
    it("handles basic operations", async () => {
      const cache = new Cache({
        storage: "redis",
        prefix: "test:",
        redis: mockRedis as unknown as Redis,
      });

      const value = { data: "test" };
      mockRedis.get.mockResolvedValue(JSON.stringify(value));
      mockRedis.set.mockResolvedValue("OK");
      mockRedis.del.mockResolvedValue(1);

      await cache.set("key", value);
      expect(await cache.get("key")).toEqual(value);
      expect(await cache.delete("key")).toBe(true);

      // Verify Redis calls
      expect(mockRedis.set).toHaveBeenCalledWith(
        "test:key",
        JSON.stringify(value)
      );
      expect(mockRedis.get).toHaveBeenCalledWith("test:key");
      expect(mockRedis.del).toHaveBeenCalledWith("test:key");
    });

    it("handles TTL operations", async () => {
      const cache = new Cache({
        storage: "redis",
        prefix: "test:",
        ttl: 100,
        redis: mockRedis as unknown as Redis,
      });

      const value = { data: "test" };
      mockRedis.setex.mockResolvedValue("OK");

      await cache.set("key", value);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        "test:key",
        100,
        JSON.stringify(value)
      );
    });

    it("handles clear operation", async () => {
      const cache = new Cache({
        storage: "redis",
        prefix: "test:",
        redis: mockRedis as unknown as Redis,
      });

      // Mock scan to return keys in batches
      mockRedis.scan
        .mockResolvedValueOnce(["1", ["test:key1", "test:key2"]])
        .mockResolvedValueOnce(["0", ["test:key3"]]);
      mockRedis.del.mockResolvedValue(3);

      await cache.clear();

      // Verify scan was called with correct pattern
      expect(mockRedis.scan).toHaveBeenCalledWith(
        "0",
        "MATCH",
        "test:*",
        "COUNT",
        100
      );

      // Verify all keys were deleted
      expect(mockRedis.del).toHaveBeenCalledWith(
        "test:key1",
        "test:key2",
        "test:key3"
      );
    });

    it("handles get operation with missing key", async () => {
      const cache = new Cache({
        storage: "redis",
        prefix: "test:",
        redis: mockRedis as unknown as Redis,
      });

      mockRedis.get.mockResolvedValue(null);
      expect(await cache.get("nonexistent")).toBeNull();
    });
  });

  describe("Memory Cache", () => {
    let cache: Cache;
    let mockNodeCache: NodeCache;

    beforeEach(() => {
      vi.clearAllMocks();
      cache = new Cache({
        storage: "memory",
        prefix: "test:",
        ttl: 100,
      });
      // Get the mock instance
      mockNodeCache = vi.mocked(NodeCache).mock.results[0].value;
    });

    it("handles basic operations", async () => {
      const value = { data: "test" };
      vi.mocked(mockNodeCache.get).mockReturnValue(value);
      vi.mocked(mockNodeCache.set).mockReturnValue(true);
      vi.mocked(mockNodeCache.del).mockReturnValue(1);

      await cache.set("key", value);
      expect(await cache.get("key")).toEqual(value);
      expect(await cache.delete("key")).toBe(true);

      // Verify NodeCache calls
      expect(mockNodeCache.set).toHaveBeenCalledWith("test:key", value);
      expect(mockNodeCache.get).toHaveBeenCalledWith("test:key");
      expect(mockNodeCache.del).toHaveBeenCalledWith("test:key");
    });

    it("handles get operation with missing key", async () => {
      vi.mocked(mockNodeCache.get).mockReturnValue(undefined);
      expect(await cache.get("nonexistent")).toBeNull();
    });

    it("handles clear operation", async () => {
      await cache.clear();
      expect(mockNodeCache.flushAll).toHaveBeenCalled();
    });

    it("provides cache statistics", () => {
      const mockStats = {
        hits: 10,
        misses: 2,
        keys: 5,
        ksize: 100,
        vsize: 1000,
      };
      vi.mocked(mockNodeCache.getStats).mockReturnValue(mockStats);

      const stats = cache.getStats();
      expect(stats).toEqual(mockStats);
    });
  });
});
