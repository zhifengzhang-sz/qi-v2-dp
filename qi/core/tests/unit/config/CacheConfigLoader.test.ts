/**
 * @fileoverview
 * @module CacheConfigLoader.test
 *
 * @description
 * This module contains unit tests for the CachedConfigLoader class.
 * It verifies the caching behavior, configuration loading, and watch functionality.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-25
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CachedConfigLoader,
  IConfigLoader,
  IConfigCache,
  BaseConfig,
  ConfigChangeEvent,
} from "@qi/core/config";

interface TestConfig extends BaseConfig {
  name: string;
  port: number;
  features: string[];
}

type WatchCallback = (event: ConfigChangeEvent<TestConfig>) => void;

describe("CachedConfigLoader", () => {
  let innerLoader: IConfigLoader<TestConfig>;
  let cache: IConfigCache<BaseConfig>;
  let cachedLoader: CachedConfigLoader<TestConfig>;

  const mockConfig: TestConfig = {
    type: "test",
    version: "1.0.0",
    name: "test-config",
    port: 8080,
    features: ["feature1"],
  };

  beforeEach(() => {
    // Setup inner loader with required watch method
    const watchFn = vi.fn();
    innerLoader = {
      load: vi.fn().mockResolvedValue(mockConfig),
      watch: watchFn,
      unwatch: vi.fn(),
    };

    // Setup cache
    cache = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
      delete: vi.fn().mockResolvedValue(true),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    cachedLoader = new CachedConfigLoader(innerLoader, cache);
  });

  describe("load", () => {
    it("should return cached config if available", async () => {
      vi.mocked(cache.get).mockResolvedValue(mockConfig);

      const result = await cachedLoader.load();
      expect(result).toBe(mockConfig);
      expect(innerLoader.load).not.toHaveBeenCalled();
      expect(cache.get).toHaveBeenCalledWith(`Object`);
    });

    it("should load and cache config if not cached", async () => {
      vi.mocked(cache.get).mockResolvedValue(undefined);
      vi.mocked(innerLoader.load).mockResolvedValue(mockConfig);

      const result = await cachedLoader.load();

      expect(result).toBe(mockConfig);
      expect(innerLoader.load).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalledWith(`Object`, mockConfig);
    });

    it("should work without cache", async () => {
      const loaderWithoutCache = new CachedConfigLoader(innerLoader);
      vi.mocked(innerLoader.load).mockResolvedValue(mockConfig);

      const result = await loaderWithoutCache.load();
      expect(result).toBe(mockConfig);
      expect(innerLoader.load).toHaveBeenCalled();
    });
  });

  describe("watch", () => {
    it("should delegate watch to inner loader", () => {
      const callback = vi.fn();
      cachedLoader.watch(callback);
      expect(innerLoader.watch).toHaveBeenCalled();
    });

    it("should update cache on config changes", () => {
      const watchCallbacks: WatchCallback[] = [];

      if (innerLoader.watch) {
        vi.mocked(innerLoader.watch).mockImplementation((callback) => {
          watchCallbacks.push(callback);
        });

        const newConfig: TestConfig = {
          ...mockConfig,
          port: 9090,
        };

        cachedLoader.watch(vi.fn());

        const lastCallback = watchCallbacks[watchCallbacks.length - 1];
        if (lastCallback) {
          lastCallback({
            previous: mockConfig,
            current: newConfig,
            timestamp: Date.now(),
            source: "test",
          });

          expect(cache.set).toHaveBeenCalledWith(`Object`, newConfig);
        }
      }
    });

    it("should propagate change events to watchers", () => {
      const callback = vi.fn();
      const watchCallbacks: WatchCallback[] = [];

      if (innerLoader.watch) {
        vi.mocked(innerLoader.watch).mockImplementation((cb) => {
          watchCallbacks.push(cb);
        });

        cachedLoader.watch(callback);

        const event: ConfigChangeEvent<TestConfig> = {
          previous: mockConfig,
          current: { ...mockConfig, port: 9090 },
          timestamp: Date.now(),
          source: "test",
        };

        const lastCallback = watchCallbacks[watchCallbacks.length - 1];
        if (lastCallback) {
          lastCallback(event);
          expect(callback).toHaveBeenCalledWith(event);
        }
      }
    });
  });

  describe("unwatch", () => {
    it("should delegate unwatch to inner loader", () => {
      cachedLoader.unwatch();
      expect(innerLoader.unwatch).toHaveBeenCalled();
    });

    it("should clear internal watchers", () => {
      const callback = vi.fn();
      const watchCallbacks: WatchCallback[] = [];

      if (innerLoader.watch) {
        vi.mocked(innerLoader.watch).mockImplementation((cb) => {
          watchCallbacks.push(cb);
        });

        cachedLoader.watch(callback);
        cachedLoader.unwatch();

        const lastCallback = watchCallbacks[watchCallbacks.length - 1];
        if (lastCallback) {
          lastCallback({
            previous: mockConfig,
            current: { ...mockConfig, port: 9090 },
            timestamp: Date.now(),
            source: "test",
          });
        }

        expect(callback).not.toHaveBeenCalled();
      }
    });
  });
});
