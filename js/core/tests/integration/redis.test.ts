/**
 * @module tests/integration/redis
 * @description Integration tests for Redis cache functionality
 */

import { RedisCache } from "@qi/core/cache";

describe("Redis Cache Integration Tests", () => {
  let cache: RedisCache;

  beforeAll(async () => {
    cache = RedisCache.getInstance();
    await cache.connect();
  });

  afterAll(async () => {
    await cache.disconnect();
  });

  beforeEach(async () => {
    await cache.flush();
  });

  describe("Basic Operations", () => {
    it("should set and get a value", async () => {
      await cache.set("test-key", "test-value");
      const value = await cache.get("test-key");
      expect(value).toBe("test-value");
    });

    it("should return null for non-existent key", async () => {
      const value = await cache.get("non-existent");
      expect(value).toBeNull();
    });

    it("should delete a key", async () => {
      await cache.set("test-key", "test-value");
      await cache.del("test-key");
      const value = await cache.get("test-key");
      expect(value).toBeNull();
    });

    it("should check if key exists", async () => {
      await cache.set("test-key", "test-value");
      const exists = await cache.exists("test-key");
      expect(exists).toBe(true);
    });

    it("should confirm key does not exist", async () => {
      const exists = await cache.exists("non-existent");
      expect(exists).toBe(false);
    });
  });

  describe("TTL Operations", () => {
    it("should set value with TTL", async () => {
      await cache.set("ttl-key", "ttl-value", 1);

      // Value should exist initially
      const value1 = await cache.get("ttl-key");
      expect(value1).toBe("ttl-value");

      // Value should expire after TTL
      await new Promise((resolve) => setTimeout(resolve, 1100));
      const value2 = await cache.get("ttl-key");
      expect(value2).toBeNull();
    });

    it("should get TTL of a key", async () => {
      await cache.set("ttl-key", "ttl-value", 60);
      const ttl = await cache.ttl("ttl-key");
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it("should return -2 TTL for non-existent key", async () => {
      const ttl = await cache.ttl("non-existent");
      expect(ttl).toBe(-2);
    });

    it("should return -1 TTL for key without expiry", async () => {
      await cache.set("no-ttl-key", "value");
      const ttl = await cache.ttl("no-ttl-key");
      expect(ttl).toBe(-1);
    });
  });

  describe("Data Types", () => {
    it("should handle string values", async () => {
      await cache.set("string-key", "Hello, World!");
      const value = await cache.get("string-key");
      expect(value).toBe("Hello, World!");
    });

    it("should handle numeric values as strings", async () => {
      await cache.set("number-key", "123.45");
      const value = await cache.get("number-key");
      expect(value).toBe("123.45");
    });

    it("should handle JSON strings", async () => {
      const data = {
        id: 1,
        name: "Test",
        tags: ["a", "b", "c"],
      };

      await cache.set("json-key", JSON.stringify(data));
      const value = await cache.get("json-key");
      expect(JSON.parse(value!)).toEqual(data);
    });
  });

  describe("Error Handling", () => {
    it("should handle set operation with invalid TTL", async () => {
      await expect(cache.set("error-key", "value", -1)).rejects.toThrow();
    });

    it("should handle deletion of non-existent key", async () => {
      await expect(cache.del("non-existent")).resolves.not.toThrow();
    });
  });

  describe("Bulk Operations", () => {
    it("should handle multiple operations", async () => {
      // Set multiple keys
      await Promise.all([
        cache.set("key1", "value1"),
        cache.set("key2", "value2"),
        cache.set("key3", "value3"),
      ]);

      // Get multiple values
      const values = await Promise.all([
        cache.get("key1"),
        cache.get("key2"),
        cache.get("key3"),
      ]);

      expect(values).toEqual(["value1", "value2", "value3"]);

      // Delete multiple keys
      await Promise.all([
        cache.del("key1"),
        cache.del("key2"),
        cache.del("key3"),
      ]);

      // Verify deletion
      const exists = await Promise.all([
        cache.exists("key1"),
        cache.exists("key2"),
        cache.exists("key3"),
      ]);

      expect(exists).toEqual([false, false, false]);
    });
  });

  describe("Flush Operations", () => {
    it("should clear all keys", async () => {
      // Set multiple keys
      await Promise.all([
        cache.set("key1", "value1"),
        cache.set("key2", "value2"),
        cache.set("key3", "value3"),
      ]);

      // Verify keys exist
      const exists1 = await Promise.all([
        cache.exists("key1"),
        cache.exists("key2"),
        cache.exists("key3"),
      ]);

      expect(exists1).toEqual([true, true, true]);

      // Flush cache
      await cache.flush();

      // Verify keys are gone
      const exists2 = await Promise.all([
        cache.exists("key1"),
        cache.exists("key2"),
        cache.exists("key3"),
      ]);

      expect(exists2).toEqual([false, false, false]);
    });
  });
});
