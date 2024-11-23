/**
 * @fileoverview
 * @module ConfigCache.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-23
 * @modified 2024-11-23
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ConfigCache, BaseConfig, CacheOptions } from "@qi/core/config";

interface TestConfig extends BaseConfig {
  type: string;
  version: string;
  value: string;
}

describe("ConfigCache", () => {
  let cache: ConfigCache<TestConfig>;
  const testConfig: TestConfig = {
    type: "test",
    version: "1.0",
    value: "test-value",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    const options: CacheOptions = {
      ttl: 1000,
      refreshOnAccess: false,
      onExpire: vi.fn(),
    };
    cache = new ConfigCache(options);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("set and get", () => {
    it("should store and retrieve config", async () => {
      await cache.set("test-key", testConfig);
      const result = await cache.get("test-key");
      expect(result).toEqual(testConfig);
    });

    it("should return undefined for non-existent key", async () => {
      const result = await cache.get("non-existent");
      expect(result).toBeUndefined();
    });

    it("should expire items after TTL", async () => {
      await cache.set("test-key", testConfig);
      vi.advanceTimersByTime(1001); // Just past TTL
      const result = await cache.get("test-key");
      expect(result).toBeUndefined();
    });
  });

  describe("refreshOnAccess", () => {
    beforeEach(() => {
      cache = new ConfigCache({
        ttl: 1000,
        refreshOnAccess: true,
      });
    });

    it("should reset expiration on access when refreshOnAccess is true", async () => {
      await cache.set("test-key", testConfig);
      vi.advanceTimersByTime(900); // Almost expired
      await cache.get("test-key"); // Should refresh TTL
      vi.advanceTimersByTime(900); // Would expire if not refreshed
      const result = await cache.get("test-key");
      expect(result).toEqual(testConfig);
    });
  });

  describe("onExpire callback", () => {
    let onExpire: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onExpire = vi.fn();
      cache = new ConfigCache({
        ttl: 1000,
        onExpire,
      });
    });

    it("should call onExpire when item expires", async () => {
      await cache.set("test-key", testConfig);
      vi.advanceTimersByTime(1001);
      await cache.get("test-key"); // Trigger expiration check
      expect(onExpire).toHaveBeenCalledWith("test-key");
    });
  });

  describe("has", () => {
    it("should return true for existing non-expired item", async () => {
      await cache.set("test-key", testConfig);
      expect(await cache.has("test-key")).toBe(true);
    });

    it("should return false for expired item", async () => {
      await cache.set("test-key", testConfig);
      vi.advanceTimersByTime(1001);
      expect(await cache.has("test-key")).toBe(false);
    });

    it("should return false for non-existent item", async () => {
      expect(await cache.has("non-existent")).toBe(false);
    });
  });

  describe("delete", () => {
    it("should remove item from cache", async () => {
      await cache.set("test-key", testConfig);
      expect(await cache.has("test-key")).toBe(true);
      await cache.delete("test-key");
      expect(await cache.has("test-key")).toBe(false);
    });

    it("should return true when item was deleted", async () => {
      await cache.set("test-key", testConfig);
      expect(await cache.delete("test-key")).toBe(true);
    });

    it("should return false when item did not exist", async () => {
      expect(await cache.delete("non-existent")).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all items from cache", async () => {
      await cache.set("key1", testConfig);
      await cache.set("key2", { ...testConfig, value: "test-value-2" });
      await cache.clear();
      expect(await cache.has("key1")).toBe(false);
      expect(await cache.has("key2")).toBe(false);
    });
  });
});
