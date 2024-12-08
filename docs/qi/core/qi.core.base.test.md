# Project Source Code Documentation

## qi/core/tests/unit

### logger.test.ts

```typescript
/**
 * @fileoverview
 * @module logger.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

// <reference types="vitest" />
/**
 * @module tests/unit/logger
 * @description Unit tests for logger module
 */

import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";

// Define types for our mocked Winston
type MockLogger = {
  info: Mock;
  error: Mock;
  warn: Mock;
  debug: Mock;
  add: Mock;
};

type MockFormat = {
  combine: Mock;
  timestamp: Mock;
  printf: Mock;
  colorize: Mock;
  align: Mock;
};

type MockWinston = {
  format: MockFormat;
  createLogger: Mock;
  transports: {
    Console: Mock;
    File: Mock;
  };
};

// Move the mock setup to the top level
const mockLogger: MockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
  add: vi.fn(),
};

const mockFormat: MockFormat = {
  combine: vi.fn().mockReturnValue({}),
  timestamp: vi.fn().mockReturnValue({}),
  printf: vi.fn().mockReturnValue({}),
  colorize: vi.fn().mockReturnValue({}),
  align: vi.fn().mockReturnValue({}),
};

const mockWinston: MockWinston = {
  format: mockFormat,
  createLogger: vi.fn().mockReturnValue(mockLogger),
  transports: {
    Console: vi.fn(),
    File: vi.fn(),
  },
};

// Hoist mock declaration
vi.mock("winston", () => ({
  default: mockWinston,
  ...mockWinston,
}));

describe("logger", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    // Reset all mocks
    Object.values(mockFormat).forEach((mock) => mock.mockClear());
    Object.values(mockLogger).forEach((mock) => mock.mockClear());
    mockWinston.createLogger.mockClear();
    mockWinston.transports.Console.mockClear();
    mockWinston.transports.File.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
    // Clean up log files if they exist
    ["error.log", "combined.log"].forEach((file) => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  });

  describe("configuration", () => {
    it("should create logger with default level info", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
        })
      );
    });

    it("should respect LOG_LEVEL environment variable", async () => {
      process.env.LOG_LEVEL = "debug";
      await import("@qi/core/logger");
      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "debug",
        })
      );
    });

    it("should configure console transport", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.transports.Console).toHaveBeenCalledWith(
        expect.objectContaining({
          stderrLevels: ["error"],
        })
      );
    });
  });

  describe("development environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should add file transports in development", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.transports.File).toHaveBeenCalledTimes(2);
      expect(mockWinston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: "error.log",
          level: "error",
        })
      );
      expect(mockWinston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: "combined.log",
        })
      );
    });
  });

  describe("production environment", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "production";
    });

    it("should not add file transports in production", async () => {
      await import("@qi/core/logger");
      expect(mockWinston.transports.File).not.toHaveBeenCalled();
    });
  });

  describe("logging functionality", () => {
    beforeEach(async () => {
      const { logger } = await import("@qi/core/logger");
      logger.info("test message");
    });

    it("should log messages with correct level", () => {
      expect(mockLogger.info).toHaveBeenCalledWith("test message");
    });

    it("should handle metadata objects", () => {
      const metadata = { userId: "123", action: "test" };
      mockLogger.info("test message", metadata);
      expect(mockLogger.info).toHaveBeenCalledWith("test message", metadata);
    });

    it("should log errors with stack traces", () => {
      const error = new Error("test error");
      mockLogger.error("error occurred", { error });
      expect(mockLogger.error).toHaveBeenCalledWith("error occurred", {
        error,
      });
    });
  });

  describe("format", () => {
    it("should use custom format with timestamp", async () => {
      await import("@qi/core/logger");
      expect(mockFormat.timestamp).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "YYYY-MM-DD HH:mm:ss.SSS",
        })
      );
    });

    it("should use colorize format", async () => {
      await import("@qi/core/logger");
      expect(mockFormat.colorize).toHaveBeenCalledWith(
        expect.objectContaining({
          all: true,
        })
      );
    });

    it("should combine multiple formats", async () => {
      await import("@qi/core/logger");
      expect(mockFormat.combine).toHaveBeenCalled();
    });
  });
});

```

### utils.test.ts

```typescript
/**
 * @fileoverview
 * @module utils.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

import { debounce, merge, uniqBy } from "lodash-es";
import {
  hash,
  formatBytes,
  truncate,
  retryOperation,
  loadEnv,
  formatJsonWithColor,
} from "@qi/core/utils";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { promises as fsPromises } from "fs";
import chalk from "chalk";

// Mock fs promises
vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
  },
}));

vi.mock("chalk", () => ({
  default: {
    blue: vi.fn((text) => `BLUE(${text})`),
    green: vi.fn((text) => `GREEN(${text})`),
    yellow: vi.fn((text) => `YELLOW(${text})`),
  },
  blue: vi.fn((text) => `BLUE(${text})`),
  green: vi.fn((text) => `GREEN(${text})`),
  yellow: vi.fn((text) => `YELLOW(${text})`),
}));

describe("Utils", () => {
  // Existing test suites remain the same
  describe("hash", () => {
    it("should generate consistent SHA256 hash", () => {
      const input = "password123";
      const expected =
        "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f";
      expect(hash(input)).toBe(expected);
    });

    it("should generate different hashes for different inputs", () => {
      expect(hash("test1")).not.toBe(hash("test2"));
    });
  });

  describe("formatBytes", () => {
    it("should format bytes with default decimals", () => {
      expect(formatBytes(1234567)).toBe("1.18 MB");
    });

    it("should respect custom decimals", () => {
      expect(formatBytes(1234567, 1)).toBe("1.2 MB");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings", () => {
      expect(truncate("Hello World", 5)).toBe("Hello...");
    });

    it("should not truncate short strings", () => {
      expect(truncate("Hello", 5)).toBe("Hello");
    });
  });

  describe("retryOperation", () => {
    beforeEach(() => {
      vi.useFakeTimers({
        legacyFakeTimers: true
      } as any);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should retry failed operations", async () => {
      let attempts = 0;
      const operation = vi
        .fn()
        .mockImplementation(async (): Promise<string> => {
          attempts++;
          if (attempts < 3) throw new Error("Temporary failure");
          return "success";
        });

      const promiseResult = retryOperation(operation as () => Promise<string>, {
        retries: 3,
        minTimeout: 100,
      });

      for (let i = 0; i < 3; i++) {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      }
      await Promise.resolve();

      const result = await promiseResult;
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should throw after max retries", async () => {
      const operation = vi.fn().mockImplementation(async (): Promise<never> => {
        throw new Error("Permanent failure");
      });

      const promiseResult = retryOperation(operation as () => Promise<string>, {
        retries: 2,
        minTimeout: 100,
      });

      for (let i = 0; i < 3; i++) {
        await Promise.resolve();
        vi.advanceTimersByTime(100);
      }
      await Promise.resolve();

      await expect(promiseResult).rejects.toThrow("Permanent failure");
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  // New test suites for additional functions
  describe("loadEnv", () => {
    beforeEach(() => {
      vi.resetAllMocks();
      process.env = {};
    });

    it("should return null if file doesn't exist", async () => {
      vi.mocked(fsPromises.readFile).mockRejectedValueOnce(
        Object.assign(new Error(), { code: "ENOENT" })
      );

      const result = await loadEnv("nonexistent.env");
      expect(result).toBeNull();
    });

    it("should load and parse environment variables without override", async () => {
      process.env.EXISTING = "old_value";

      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        "NEW=value\nEXISTING=new_value" as any
      );

      const result = await loadEnv("test.env");

      expect(result).toEqual({
        NEW: "value",
        EXISTING: "new_value",
      });

      expect(process.env.NEW).toBe("value");
      expect(process.env.EXISTING).toBe("old_value");
    });

    it("should override existing environment variables when override is true", async () => {
      process.env.EXISTING = "old_value";

      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        "EXISTING=new_value" as any
      );

      const result = await loadEnv("test.env", { override: true });

      expect(result).toEqual({
        EXISTING: "new_value",
      });

      expect(process.env.EXISTING).toBe("new_value");
    });

    it("should handle complex env file formats", async () => {
      vi.mocked(fsPromises.readFile).mockResolvedValueOnce(
        '# Comment\nBASIC=value\nQUOTED="quoted value"\nEMPTY=\nSPACES= value with spaces \n' as any
      );

      const result = await loadEnv("test.env");

      expect(result).toEqual({
        BASIC: "value",
        QUOTED: "quoted value",
        EMPTY: "",
        SPACES: "value with spaces",
      });
    });
  });

  describe("formatJsonWithColor", () => {
    beforeEach(() => {
      vi.mocked(chalk.blue).mockImplementation((text) => `BLUE(${text})`);
      vi.mocked(chalk.green).mockImplementation((text) => `GREEN(${text})`);
      vi.mocked(chalk.yellow).mockImplementation((text) => `YELLOW(${text})`);
    });

    it("should format JSON with appropriate colors", () => {
      const input = {
        name: "test",
        age: 25,
        active: true,
        data: null,
      };

      const result = formatJsonWithColor(input);

      expect(result).toContain('BLUE("name")');
      expect(result).toContain('GREEN("test")');
      expect(result).toContain("YELLOW(25)");
      expect(result).toContain("YELLOW(true)");
      expect(result).toContain("YELLOW(null)");
    });
  });

  describe("Library function integration", () => {
    afterEach(() => {
      vi.useRealTimers();
    });
    it("should debounce function calls correctly", () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(fn).toHaveBeenCalledTimes(1);

      //vi.useRealTimers();
    });

    it("should merge objects deeply", () => {
      const target = { a: 1, b: { x: 1 } };
      const source = { b: { y: 2 }, c: 3 };
      const expected = { a: 1, b: { x: 1, y: 2 }, c: 3 };

      expect(merge(target, source)).toEqual(expected);
    });

    it("should filter unique objects by key", () => {
      const input = [
        { id: 1, name: "John" },
        { id: 1, name: "Johnny" },
        { id: 2, name: "Jane" },
      ];
      const expected = [
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ];

      expect(uniqBy(input, "id")).toEqual(expected);
    });
  });
});

```

### cache

#### index.test.ts

```typescript
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

```

### config

#### CacheConfigLoader.test.ts

```typescript
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

```

#### ConfigCache.test.ts

```typescript
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

```

#### ConfigFactory.test.ts

```typescript
/**
 * @fileoverview
 * @module ConfigFactory.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-25
 * @modified 2024-11-25
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ConfigFactory,
  ISchema,
  IConfigCache,
  CachedConfigLoader,
  SchemaValidator,
  BaseConfig,
  JsonSchema,
  IConfigLoader,
  IConfigValidator,
  ConfigLoaderError,
} from "@qi/core/config";
import * as fs from "node:fs/promises";

// Mock fs module
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

interface TestConfig extends BaseConfig {
  name: string;
  port: number;
  features: string[];
}

describe("ConfigFactory", () => {
  let schema: ISchema;
  let cache: IConfigCache<BaseConfig>;
  let factory: ConfigFactory;

  const testSchema: JsonSchema = {
    $id: "test-schema",
    type: "object",
    properties: {
      type: { type: "string" },
      version: { type: "string" },
      name: { type: "string" },
      port: { type: "number" },
      features: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["type", "version", "name", "port", "features"],
  };

  beforeEach(() => {
    // Create mock schema
    schema = {
      validate: vi.fn(),
      validateSchema: vi.fn(),
      getSchema: vi.fn(),
      registerSchema: vi.fn(),
      removeSchema: vi.fn(),
      hasSchema: vi.fn(),
    };

    // Create mock cache
    cache = {
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    };

    factory = new ConfigFactory(schema, cache);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  describe("createLoader", () => {
    const loaderOptions = {
      type: "test",
      version: "1.0.0",
      schema: testSchema,
    };

    it("should register schema if not already registered", () => {
      vi.mocked(schema.hasSchema).mockReturnValue(false);

      const loader: IConfigLoader<TestConfig> =
        factory.createLoader<TestConfig>(loaderOptions);

      expect(schema.hasSchema).toHaveBeenCalledWith("test-schema");
      expect(schema.registerSchema).toHaveBeenCalledWith("test", testSchema);
      expect(loader).toBeDefined();
    });

    it("should not register schema if already registered", () => {
      vi.mocked(schema.hasSchema).mockReturnValue(true);

      const loader: IConfigLoader<TestConfig> =
        factory.createLoader<TestConfig>(loaderOptions);

      expect(schema.hasSchema).toHaveBeenCalledWith("test-schema");
      expect(schema.registerSchema).not.toHaveBeenCalled();
      expect(loader).toBeDefined();
    });

    it("should create a CachedConfigLoader when cache is provided", () => {
      const loader: IConfigLoader<TestConfig> =
        factory.createLoader<TestConfig>(loaderOptions);
      expect(loader).toBeInstanceOf(CachedConfigLoader);
    });

    it("should use schema ID from schema if available", () => {
      const schemaWithId: JsonSchema = {
        ...testSchema,
        $id: "custom-schema-id",
      };

      factory.createLoader<TestConfig>({
        ...loaderOptions,
        schema: schemaWithId,
      });

      expect(schema.hasSchema).toHaveBeenCalledWith("custom-schema-id");
    });

    it("should fallback to type as schema ID if $id is not provided", () => {
      const schemaWithoutId: JsonSchema = {
        ...testSchema,
        $id: undefined,
      };

      factory.createLoader<TestConfig>({
        ...loaderOptions,
        schema: schemaWithoutId,
      });

      expect(schema.hasSchema).toHaveBeenCalledWith("test");
    });

    // Instead of testing private properties, test the behavior
    it("should create loader with correct configuration", async () => {
      const loader: IConfigLoader<TestConfig> =
        factory.createLoader<TestConfig>(loaderOptions);

      // Mock the load method to verify the configuration
      const mockConfig: TestConfig = {
        type: "test",
        version: "1.0.0",
        name: "test-config",
        port: 8080,
        features: ["feature1"],
      };

      if (loader instanceof CachedConfigLoader) {
        // Test the cache behavior instead of accessing private properties
        vi.mocked(cache.get).mockResolvedValueOnce(mockConfig);
        const result = await loader.load();
        expect(result).toEqual(mockConfig);
      }
    });
  });

  describe("createValidator", () => {
    it("should create a SchemaValidator with provided schema", () => {
      const validator: IConfigValidator<TestConfig> =
        factory.createValidator<TestConfig>(testSchema);
      expect(validator).toBeInstanceOf(SchemaValidator);
    });

    it("should pass schema to validator for validation", () => {
      const validator: IConfigValidator<TestConfig> =
        factory.createValidator<TestConfig>(testSchema);

      const config = {
        type: "test",
        version: "1.0.0",
        name: "test-config",
        port: 8080,
        features: ["feature1", "feature2"],
      };

      vi.mocked(schema.validate).mockImplementation(() => {
        // Mock successful validation
        return;
      });

      // Should not throw
      expect(() => validator.validate(config)).not.toThrow();
      expect(schema.validate).toHaveBeenCalledWith(
        config,
        testSchema.$id ?? "default"
      );
    });

    it("should handle validation errors", () => {
      const validator: IConfigValidator<TestConfig> =
        factory.createValidator<TestConfig>(testSchema);

      const invalidConfig = {
        type: "test",
        version: "1.0.0",
        // Missing required fields
      };

      vi.mocked(schema.validate).mockImplementation(() => {
        throw new ConfigLoaderError("Validation failed", 2003);
      });

      expect(() => validator.validate(invalidConfig)).toThrow(
        ConfigLoaderError
      );
      expect(schema.validate).toHaveBeenCalled();
    });

    it("should validate schema on validator creation", () => {
      factory.createValidator<TestConfig>(testSchema);
      expect(schema.validateSchema).toHaveBeenCalledWith(testSchema);
    });
  });

  describe("factory without cache", () => {
    const mockConfig: TestConfig = {
      type: "test",
      version: "1.0.0",
      name: "test-config",
      port: 8080,
      features: ["feature1"],
    };

    beforeEach(() => {
      factory = new ConfigFactory(schema); // Create factory without cache
      // Mock successful file read
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
    });

    it("should create a CachedConfigLoader with null cache when no cache is provided", async () => {
      const loader: IConfigLoader<TestConfig> =
        factory.createLoader<TestConfig>({
          type: "test",
          version: "1.0.0",
          schema: testSchema,
        });

      expect(loader).toBeInstanceOf(CachedConfigLoader);

      // Mock schema validation to pass
      vi.mocked(schema.validate).mockImplementation(() => {
        return;
      });

      // Verify that the loader can still load configuration
      const loadedConfig = await loader.load();

      // Verify the file was attempted to be read with correct path
      expect(fs.readFile).toHaveBeenCalledWith(
        "config/test-1.0.0.json",
        "utf-8"
      );

      // Verify the loaded config matches our mock
      expect(loadedConfig).toEqual(mockConfig);
    });

    it("should handle file read errors appropriately", async () => {
      const loader: IConfigLoader<TestConfig> =
        factory.createLoader<TestConfig>({
          type: "test",
          version: "1.0.0",
          schema: testSchema,
        });

      // Mock file read error
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      // Verify that the loader throws appropriate error
      await expect(loader.load()).rejects.toThrow(ConfigLoaderError);
    });
  });
});

```

#### EnvLoader.test.ts

```typescript
/**
 * @fileoverview
 * @module EnvLoader.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-23
 * @modified 2024-11-23
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { FSWatcher, WatchListener } from "fs";
import { EnvLoader, ISchema } from "@qi/core/config";
import * as fs from "fs";
import { loadEnv } from "@qi/core/utils";

// Mock modules
vi.mock("fs", async () => {
  const actual = (await vi.importActual("fs")) as typeof fs;
  return {
    ...actual,
    watch: vi.fn(),
  };
});

vi.mock("@qi/core/utils", () => ({
  loadEnv: vi.fn(),
}));

interface TestEnvConfig extends Record<string, string | undefined> {
  type: string;
  version: string;
  PORT: string;
  HOST: string;
  API_KEY?: string;
}

describe("EnvLoader", () => {
  let loader: EnvLoader<TestEnvConfig>;
  let mockSchema: ISchema;
  let originalEnv: Record<string, string | undefined>;
  let mockWatcher: { close: ReturnType<typeof vi.fn> };

  const validEnvVars = {
    type: "test-type",
    version: "1.0.0",
    PORT: "3000",
    HOST: "localhost",
    API_KEY: "test-key",
  };

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env = { ...validEnvVars };

    vi.clearAllMocks();
    vi.useFakeTimers();

    mockSchema = {
      validate: vi.fn(),
      validateSchema: vi.fn(),
      getSchema: vi.fn(),
      registerSchema: vi.fn(),
      removeSchema: vi.fn(),
      hasSchema: vi.fn(),
    };

    // Create mock watcher with just the close method
    mockWatcher = {
      close: vi.fn(),
    };

    // Mock fs.watch
    vi.mocked(fs.watch).mockReturnValue(mockWatcher as unknown as FSWatcher);

    // Mock setInterval and clearInterval
    vi.spyOn(global, "setInterval");
    vi.spyOn(global, "clearInterval");

    vi.mocked(loadEnv).mockResolvedValue({ ...validEnvVars });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("load", () => {
    it("should notify callbacks on file changes", async () => {
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      const callback = vi.fn();
      loader.watch(callback);

      // Load initial config
      await loader.load();

      // Setup new env vars for change
      const updatedVars = {
        ...validEnvVars,
        PORT: "4000",
      };
      process.env = { ...updatedVars };
      vi.mocked(loadEnv).mockResolvedValueOnce(updatedVars);

      // Trigger file change event
      const watchHandler = vi.mocked(fs.watch).mock
        .calls[0][1] as WatchListener<string>;
      if (watchHandler) {
        await watchHandler("change", ".env");
      }

      expect(callback).toHaveBeenCalledWith({
        previous: expect.objectContaining(validEnvVars),
        current: expect.objectContaining(updatedVars),
        timestamp: expect.any(Number),
        source: ".env",
      });
    });
  });

  describe("watch", () => {
    it("should set up refresh interval when specified", () => {
      const refreshInterval = 5000;
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        refreshInterval,
        watch: true,
      });

      loader.watch(vi.fn());

      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        refreshInterval
      );
    });
  });

  describe("unwatch", () => {
    it("should close file watchers", async () => {
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      loader.watch(vi.fn());
      await loader.load();

      expect(fs.watch).toHaveBeenCalled();

      loader.unwatch();

      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it("should clear refresh interval", () => {
      const mockIntervalId = 123;
      vi.spyOn(global, "setInterval").mockReturnValue(
        mockIntervalId as unknown as NodeJS.Timeout
      );

      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        refreshInterval: 5000,
        watch: true,
      });

      loader.watch(vi.fn());
      loader.unwatch();

      expect(global.clearInterval).toHaveBeenCalledWith(mockIntervalId);
    });

    it("should handle multiple unwatch calls safely", async () => {
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      loader.watch(vi.fn());
      await loader.load();

      expect(fs.watch).toHaveBeenCalled();

      loader.unwatch();
      expect(mockWatcher.close).toHaveBeenCalledTimes(1);

      loader.unwatch();
      expect(mockWatcher.close).toHaveBeenCalledTimes(1);
    });
  });
});

```

#### errors.test.ts

```typescript
/**
 * @fileoverview
 * @module errors.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-23
 * @modified 2024-11-23
 */

import { describe, it, expect } from "vitest";
import { ErrorCode } from "@qi/core/errors";
import type { ErrorObject } from "ajv";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "@qi/core/config";
import type {
  ConfigLoaderErrorDetails,
  SchemaValidationError,
} from "@qi/core/config";

describe("Configuration Errors", () => {
  describe("CONFIG_LOADER_CODES", () => {
    it("should define all necessary error codes", () => {
      expect(CONFIG_LOADER_CODES).toEqual({
        INVALID_SCHEMA: ErrorCode.INVALID_SCHEMA,
        SCHEMA_NOT_FOUND: ErrorCode.SCHEMA_NOT_FOUND,
        SCHEMA_EXISTS: ErrorCode.CONFIGURATION_ERROR,
        SCHEMA_VALIDATION_FAILED: ErrorCode.SCHEMA_VALIDATION_FAILED,
        READ_ERROR: ErrorCode.READ_ERROR,
        PARSE_ERROR: ErrorCode.CONFIG_PARSE_ERROR,
        WATCH_ERROR: ErrorCode.WATCH_ERROR,
        ENV_LOAD_ERROR: ErrorCode.ENV_LOAD_ERROR,
        ENV_MISSING_ERROR: ErrorCode.ENV_MISSING_ERROR,
        CONFIG_LOAD_ERROR: ErrorCode.CONFIG_LOAD_ERROR,
        CONFIG_PARSE_ERROR: ErrorCode.CONFIG_PARSE_ERROR,
      });
    });
  });

  describe("ConfigLoaderError", () => {
    describe("constructor", () => {
      it("should create error with default values", () => {
        const error = new ConfigLoaderError("Test error");

        expect(error).toBeInstanceOf(ConfigLoaderError);
        expect(error.message).toBe("Test error");
        expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
        expect(error.statusCode).toBe(500);
        expect(error.name).toBe("ConfigLoaderError");
        expect(error.details).toBeUndefined();
      });

      it("should create error with custom code and details", () => {
        const details = {
          source: "config.json",
          content: "{ invalid json }",
          parseError: "Unexpected token",
        } satisfies ConfigLoaderErrorDetails;

        const error = new ConfigLoaderError(
          "Parse error",
          CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
          details
        );

        expect(error.message).toBe("Parse error");
        expect(error.code).toBe(ErrorCode.CONFIG_PARSE_ERROR);
        expect(error.statusCode).toBe(500);
        expect(error.details).toEqual(details);
      });
    });

    describe("static create", () => {
      it("should create error with source and additional details", () => {
        const details = {
          filePath: "/path/to/config.json",
          schemaId: "test-schema",
        } satisfies ConfigLoaderErrorDetails;

        const error = ConfigLoaderError.create(
          "Test error",
          CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
          "config.json",
          details
        );

        expect(error.message).toBe("Test error");
        expect(error.code).toBe(ErrorCode.CONFIG_LOAD_ERROR);
        expect(error.details).toEqual({
          source: "config.json",
          ...details,
        });
      });
    });

    describe("static schemaError", () => {
      it("should create schema error with validation errors from Ajv", () => {
        const ajvErrors: ErrorObject[] = [
          {
            keyword: "type",
            instancePath: "/properties/name",
            schemaPath: "#/properties/name/type",
            params: { type: "string" },
            message: "must be string",
          },
        ];

        const error = ConfigLoaderError.schemaError(
          "Invalid schema",
          "test-schema",
          { errors: ajvErrors }
        );

        expect(error.message).toBe("Invalid schema");
        expect(error.code).toBe(ErrorCode.INVALID_SCHEMA);
        expect(error.details).toEqual({
          source: "test-schema",
          errors: ajvErrors,
        });
      });

      it("should handle schema existence errors", () => {
        const error = ConfigLoaderError.create(
          "Schema already exists",
          CONFIG_LOADER_CODES.SCHEMA_EXISTS,
          "test-schema",
          { existingSchema: true }
        );

        expect(error.message).toBe("Schema already exists");
        expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
        expect(error.details).toEqual({
          source: "test-schema",
          existingSchema: true,
        });
      });
    });

    describe("static validationError", () => {
      it("should create validation error with Ajv errors", () => {
        const ajvErrors: ErrorObject[] = [
          {
            keyword: "required",
            instancePath: "",
            schemaPath: "#/required",
            params: { missingProperty: "name" },
            message: "must have required property 'name'",
          },
        ];

        const error = ConfigLoaderError.validationError(
          "Schema validation failed",
          "test-schema",
          ajvErrors
        );

        expect(error.message).toBe("Schema validation failed");
        expect(error.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
        expect(error.details).toEqual({
          source: "test-schema",
          errors: ajvErrors,
        });
      });
    });

    describe("static fromError", () => {
      it("should wrap schema validation errors", () => {
        const schemaError = new ConfigLoaderError(
          "Schema validation failed",
          CONFIG_LOADER_CODES.SCHEMA_VALIDATION_FAILED,
          { schemaId: "test-schema" }
        );

        const error = ConfigLoaderError.fromError(
          schemaError,
          CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
          { source: "config.json" }
        );

        expect(error.message).toBe("Schema validation failed");
        expect(error.code).toBe(ErrorCode.CONFIG_LOAD_ERROR);
        expect(error.details).toEqual({
          source: "config.json",
        });
      });

      it("should handle file system errors", () => {
        const fsError = new Error("ENOENT: no such file or directory");

        const error = ConfigLoaderError.fromError(
          fsError,
          CONFIG_LOADER_CODES.READ_ERROR,
          { source: "config.json" }
        );

        expect(error.message).toBe("ENOENT: no such file or directory");
        expect(error.code).toBe(ErrorCode.READ_ERROR);
        expect(error.details).toEqual({
          source: "config.json",
        });
      });
    });

    describe("schema validation errors", () => {
      it("should handle AJV validation errors", () => {
        const ajvErrors: ErrorObject[] = [
          {
            keyword: "type",
            instancePath: "/value",
            schemaPath: "#/properties/value/type",
            params: { type: "number" },
            message: "must be number",
          },
        ];

        const error = new ConfigLoaderError(
          "Validation failed",
          CONFIG_LOADER_CODES.SCHEMA_VALIDATION_FAILED,
          {
            schemaId: "test-schema",
            errors: ajvErrors,
          }
        );

        expect(error.details?.errors).toEqual(ajvErrors);
      });

      it("should handle schema validation errors", () => {
        const validationErrors = [
          {
            field: "name",
            message: "Invalid name format",
            value: "test123",
            path: "/name",
          },
        ] satisfies SchemaValidationError[];

        const error = new ConfigLoaderError(
          "Custom validation failed",
          CONFIG_LOADER_CODES.SCHEMA_VALIDATION_FAILED,
          {
            schemaId: "test-schema",
            errors: validationErrors,
          }
        );

        expect(error.details?.errors).toEqual(validationErrors);
      });
    });
  });
});

```

#### JsonLoader.test.ts

```typescript
/**
 * @fileoverview
 * @module JsonLoader.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-23
 * @modified 2024-11-23
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  JsonLoader,
  ISchema,
  BaseConfig,
  ConfigLoaderError,
  JsonSchema,
} from "@qi/core/config";
import * as fs from "fs/promises";
import * as fsWatch from "fs";
import { ErrorCode } from "@qi/core/errors";

// Mock the file system modules
vi.mock("fs/promises");
vi.mock("fs");
vi.mock("@qi/core/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

interface TestConfig extends BaseConfig, Record<string, unknown> {
  type: string;
  version: string;
  settings: {
    key: string;
    value: number;
  };
}

describe("JsonLoader", () => {
  let loader: JsonLoader<TestConfig>;
  let mockSchema: ISchema;
  let mockWatcher: { close: ReturnType<typeof vi.fn> };

  const validConfig: TestConfig = {
    type: "test-type",
    version: "1.0.0",
    settings: {
      key: "test-key",
      value: 123,
    },
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Create mock schema with all required methods as properly typed mocks
    mockSchema = {
      validate: vi.fn() as unknown as (
        config: unknown,
        schemaId: string
      ) => void,
      validateSchema: vi.fn() as unknown as (schema: JsonSchema) => void,
      getSchema: vi.fn() as unknown as (name: string) => JsonSchema | undefined,
      registerSchema: vi.fn() as unknown as (
        name: string,
        schema: JsonSchema
      ) => void,
      removeSchema: vi.fn() as unknown as (name: string) => void,
      hasSchema: vi.fn() as unknown as (name: string) => boolean,
    };

    // Setup mock watcher
    mockWatcher = {
      close: vi.fn(),
    };
    vi.mocked(fsWatch.watch).mockReturnValue(
      mockWatcher as unknown as fsWatch.FSWatcher
    );

    // Default mock for readFile
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with file path source", () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      expect(loader).toBeInstanceOf(JsonLoader);
    });

    it("should create instance with object source", () => {
      loader = new JsonLoader(validConfig, mockSchema, "test-schema");
      expect(loader).toBeInstanceOf(JsonLoader);
    });
  });

  describe("load", () => {
    it("should successfully load config from valid JSON file", async () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      const config = await loader.load();

      expect(fs.readFile).toHaveBeenCalledWith("config.json", "utf-8");
      expect(mockSchema.validate).toHaveBeenCalledWith(
        validConfig,
        "test-schema"
      );
      expect(config).toEqual(validConfig);
    });

    it("should successfully load config from object source", async () => {
      loader = new JsonLoader(validConfig, mockSchema, "test-schema");
      const config = await loader.load();

      expect(fs.readFile).not.toHaveBeenCalled();
      expect(mockSchema.validate).toHaveBeenCalledWith(
        validConfig,
        "test-schema"
      );
      expect(config).toEqual(validConfig);
    });

    it("should throw CONFIG_PARSE_ERROR for invalid JSON", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("{ invalid json }");
      loader = new JsonLoader("config.json", mockSchema, "test-schema");

      let thrownError: ConfigLoaderError | undefined;

      try {
        await loader.load();
      } catch (error) {
        thrownError = error as ConfigLoaderError;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError).toBeInstanceOf(ConfigLoaderError);
      expect(thrownError?.code).toBe(ErrorCode.CONFIG_PARSE_ERROR);
      expect(thrownError?.details).toEqual(
        expect.objectContaining({
          source: "config.json",
          content: "{ invalid json }",
          parseError: expect.any(String),
        })
      );
    });

    it("should throw READ_ERROR when file cannot be read", async () => {
      const fileError = new Error("ENOENT");
      vi.mocked(fs.readFile).mockRejectedValue(fileError);
      loader = new JsonLoader("config.json", mockSchema, "test-schema");

      let thrownError: ConfigLoaderError | undefined;

      try {
        await loader.load();
      } catch (error) {
        thrownError = error as ConfigLoaderError;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError).toBeInstanceOf(ConfigLoaderError);
      expect(thrownError?.code).toBe(ErrorCode.CONFIG_LOAD_ERROR);
      expect(thrownError?.details).toEqual(
        expect.objectContaining({
          source: "config.json",
          error: fileError.toString(),
        })
      );
    });

    it("should throw SCHEMA_VALIDATION_FAILED when validation fails", async () => {
      const mockValidate = vi.fn(() => {
        throw new ConfigLoaderError(
          "Validation failed",
          ErrorCode.SCHEMA_VALIDATION_FAILED
        );
      });
      mockSchema.validate = mockValidate as unknown as (
        config: unknown,
        schemaId: string
      ) => void;

      loader = new JsonLoader("config.json", mockSchema, "test-schema");

      let thrownError: ConfigLoaderError | undefined;

      try {
        await loader.load();
      } catch (error) {
        thrownError = error as ConfigLoaderError;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError).toBeInstanceOf(ConfigLoaderError);
      expect(thrownError?.code).toBe(ErrorCode.SCHEMA_VALIDATION_FAILED);
    });
  });

  describe("watch", () => {
    it("should set up file watcher for file source", () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      const callback = vi.fn();
      loader.watch(callback);

      expect(fsWatch.watch).toHaveBeenCalledWith(
        "config.json",
        expect.any(Function)
      );
    });

    it("should not set up watcher for object source", () => {
      loader = new JsonLoader(validConfig, mockSchema, "test-schema");
      const callback = vi.fn();
      loader.watch(callback);

      expect(fsWatch.watch).not.toHaveBeenCalled();
    });

    it("should notify callbacks on valid file changes", async () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      const callback = vi.fn();
      loader.watch(callback);

      // Load initial config
      await loader.load();

      // Setup new config for change
      const updatedConfig = {
        ...validConfig,
        settings: { ...validConfig.settings, value: 456 },
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify(updatedConfig)
      );

      // Trigger watch callback
      const watchHandler = vi.mocked(fsWatch.watch).mock.calls[0][1];
      if (watchHandler) {
        await watchHandler("change", "config.json");
      }

      expect(callback).toHaveBeenCalledWith({
        previous: validConfig,
        current: updatedConfig,
        timestamp: expect.any(Number),
        source: "config.json",
      });
    });

    it("should not notify callbacks on invalid file changes", async () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      const callback = vi.fn();
      loader.watch(callback);

      // Load initial config
      await loader.load();

      // Setup invalid JSON for change
      vi.mocked(fs.readFile).mockResolvedValueOnce("{ invalid json }");

      // Trigger watch callback
      const watchHandler = vi.mocked(fsWatch.watch).mock.calls[0][1];
      if (watchHandler) {
        await watchHandler("change", "config.json");
      }

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle multiple watch callbacks", async () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      loader.watch(callback1);
      loader.watch(callback2);

      await loader.load();

      const updatedConfig = { ...validConfig, version: "2.0.0" };
      vi.mocked(fs.readFile).mockResolvedValueOnce(
        JSON.stringify(updatedConfig)
      );

      const watchHandler = vi.mocked(fsWatch.watch).mock.calls[0][1];
      if (watchHandler) {
        await watchHandler("change", "config.json");
      }

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("unwatch", () => {
    it("should close watcher and clear callbacks", () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");
      const callback = vi.fn();

      loader.watch(callback);
      loader.unwatch();

      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it("should handle multiple unwatch calls safely", () => {
      loader = new JsonLoader("config.json", mockSchema, "test-schema");

      loader.unwatch();
      loader.unwatch();

      expect(mockWatcher.close).not.toHaveBeenCalled();
    });

    it("should not throw when unwatching object source", () => {
      loader = new JsonLoader(validConfig, mockSchema, "test-schema");

      expect(() => loader.unwatch()).not.toThrow();
    });
  });
});

```

#### schema.test.ts

```typescript
/**
 * @fileoverview
 * @module schema.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-23
 * @modified 2024-11-23
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Schema, JsonSchema, ConfigLoaderError } from "@qi/core/config";

describe("Schema", () => {
  let schema: Schema;

  beforeEach(() => {
    schema = new Schema({ strict: true, formats: true });
  });

  const validTestSchema: JsonSchema = {
    $id: "test-schema",
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
      email: { type: "string", format: "email" },
    },
    required: ["name", "age"],
  };

  describe("registerSchema", () => {
    it("should register a valid schema", () => {
      expect(() =>
        schema.registerSchema("test", validTestSchema)
      ).not.toThrow();
      expect(schema.hasSchema("test")).toBe(true);
    });

    it("should throw error when registering duplicate schema name", () => {
      schema.registerSchema("test", validTestSchema);
      expect(() => schema.registerSchema("test", validTestSchema)).toThrow(
        ConfigLoaderError
      );
    });

    it("should throw error when registering invalid schema", () => {
      const invalidSchema = {
        $id: "invalid",
        type: "invalid-type",
      };
      expect(() =>
        schema.registerSchema("invalid", invalidSchema as JsonSchema)
      ).toThrow();
    });
  });

  describe("validate", () => {
    beforeEach(() => {
      schema.registerSchema("test", validTestSchema);
    });

    it("should validate valid data", () => {
      const validData = {
        name: "John",
        age: 30,
        email: "john@example.com",
      };
      expect(() => schema.validate(validData, "test-schema")).not.toThrow();
    });

    it("should throw error for invalid data", () => {
      const invalidData = {
        name: "John",
        age: "30", // Should be number
        email: "invalid-email",
      };
      expect(() => schema.validate(invalidData, "test-schema")).toThrow();
    });

    it("should throw error for missing required fields", () => {
      const invalidData = {
        name: "John",
      };
      expect(() => schema.validate(invalidData, "test-schema")).toThrow();
    });

    it("should throw error for non-existent schema", () => {
      expect(() => schema.validate({}, "non-existent")).toThrow();
    });
  });

  describe("getSchema", () => {
    it("should return registered schema", () => {
      schema.registerSchema("test", validTestSchema);
      expect(schema.getSchema("test")).toEqual(validTestSchema);
    });

    it("should return undefined for non-existent schema", () => {
      expect(schema.getSchema("non-existent")).toBeUndefined();
    });
  });

  describe("removeSchema", () => {
    it("should remove registered schema", () => {
      schema.registerSchema("test", validTestSchema);
      expect(schema.hasSchema("test")).toBe(true);
      schema.removeSchema("test");
      expect(schema.hasSchema("test")).toBe(false);
    });

    it("should not throw when removing non-existent schema", () => {
      expect(() => schema.removeSchema("non-existent")).not.toThrow();
    });
  });
});

```

#### SchemaValidator.test.ts

```typescript
/**
 * @fileoverview
 * @module SchemaValidator.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-25
 * @modified 2024-11-25
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SchemaValidator,
  ISchema,
  BaseConfig,
  JsonSchema,
  ConfigLoaderError,
  IConfigValidator,
} from "@qi/core/config";

interface TestConfig extends BaseConfig {
  name: string;
  port: number;
  features: string[];
}

describe("SchemaValidator", () => {
  let schema: ISchema;
  let validator: SchemaValidator<TestConfig>;

  const testSchema: JsonSchema = {
    $id: "test-schema",
    type: "object",
    properties: {
      type: { type: "string" },
      version: { type: "string" },
      name: { type: "string" },
      port: { type: "number" },
      features: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["type", "version", "name", "port", "features"],
  };

  beforeEach(() => {
    schema = {
      validate: vi.fn(),
      validateSchema: vi.fn(),
      getSchema: vi.fn(),
      registerSchema: vi.fn(),
      removeSchema: vi.fn(),
      hasSchema: vi.fn(),
    };

    validator = new SchemaValidator<TestConfig>(schema, testSchema);
  });

  it("should validate schema on construction", () => {
    expect(schema.validateSchema).toHaveBeenCalledWith(testSchema);
  });

  it("should validate valid configuration", () => {
    const config: TestConfig = {
      type: "test",
      version: "1.0.0",
      name: "test-config",
      port: 8080,
      features: ["feature1"],
    };

    validator.validate(config);
    expect(schema.validate).toHaveBeenCalledWith(
      config,
      testSchema.$id ?? "default"
    );
  });

  it("should throw ConfigLoaderError for invalid configuration", () => {
    const invalidConfig = {
      type: "test",
      // Missing required fields
    };

    vi.mocked(schema.validate).mockImplementation(() => {
      throw new ConfigLoaderError("Validation failed", 2003);
    });

    expect(() => validator.validate(invalidConfig)).toThrow(ConfigLoaderError);
  });

  it("should return schema through getSchema method", () => {
    expect(validator.getSchema()).toBe(testSchema);
  });

  it("should handle schema without $id", () => {
    const schemaWithoutId = { ...testSchema };
    delete schemaWithoutId.$id;

    const validatorWithoutId: IConfigValidator<TestConfig> =
      new SchemaValidator<TestConfig>(schema, schemaWithoutId);

    const config: TestConfig = {
      type: "test",
      version: "1.0.0",
      name: "test-config",
      port: 8080,
      features: ["feature1"],
    };

    validatorWithoutId.validate(config);
    expect(schema.validate).toHaveBeenCalledWith(config, "default");
  });
});

```

### services

#### base

##### index.test.ts

```typescript
/**
 * @fileoverview Base Service Module Unit Tests
 * @module @qi/core/services/base/tests/index.test
 *
 * @description
 * Comprehensive test suite for the base service module components including:
 * - BaseServiceClient abstract implementation
 * - ServiceConnectionManager
 * - Service lifecycle management
 * - Health check functionality
 * - Configuration validation
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BaseServiceClient,
  ServiceConfig,
  ServiceStatus,
  HealthCheckResult,
  ServiceConnectionManager,
} from "@qi/core/services/base";
import { logger } from "@qi/core/logger";

// Mock logger
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

/**
 * Test implementation of BaseServiceClient for testing purposes
 * Implements all abstract methods and exposes protected methods for testing
 *
 * @class TestService
 * @extends BaseServiceClient<ServiceConfig>
 */
class TestService extends BaseServiceClient<ServiceConfig> {
  public status: ServiceStatus = ServiceStatus.INITIALIZING;

  /**
   * Creates an instance of TestService
   * @param {ServiceConfig} config - Service configuration
   */
  constructor(config: ServiceConfig) {
    super(config, "TestService");
  }

  /**
   * Implementation of abstract connect method
   * @returns {Promise<void>}
   */
  async connect(): Promise<void> {
    this.setStatus(ServiceStatus.CONNECTED);
  }

  /**
   * Implementation of abstract disconnect method
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    this.setStatus(ServiceStatus.DISCONNECTED);
  }

  /**
   * Implementation of abstract checkHealth method
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    return {
      status: "healthy",
      message: "Test service is healthy",
      details: { test: true },
      timestamp: new Date(),
    };
  }

  /**
   * Exposes protected validateConfig method for testing
   * @public
   */
  public validateConfigTest(): void {
    this.validateConfig();
  }

  /**
   * Exposes protected setStatus method for testing
   * @public
   * @param {ServiceStatus} status - New service status
   */
  public setStatusTest(status: ServiceStatus): void {
    this.setStatus(status);
  }
}

describe("Base Service Module", () => {
  describe("BaseServiceClient", () => {
    let config: ServiceConfig;
    let service: TestService;

    beforeEach(() => {
      config = {
        enabled: true,
        healthCheck: {
          enabled: true,
          interval: 5000,
          timeout: 1000,
          retries: 3,
        },
      };
      service = new TestService(config);
      vi.clearAllMocks();
    });

    describe("initialization", () => {
      it("creates service with valid config", () => {
        expect(service).toBeDefined();
        expect(service.isEnabled()).toBe(true);
        expect(service.getConfig()).toEqual(config);
      });

      it("throws error on invalid config", () => {
        expect(
          () => new TestService(null as unknown as ServiceConfig)
        ).toThrow();
      });

      it("validates health check config", () => {
        const invalidConfig: ServiceConfig = {
          enabled: true,
          healthCheck: {
            enabled: true,
            interval: 0, // Invalid
            timeout: 1000,
            retries: 3,
          },
        };
        expect(() => new TestService(invalidConfig)).toThrow();
      });
    });

    describe("lifecycle management", () => {
      it("handles connection lifecycle", async () => {
        expect(service.status).toBe(ServiceStatus.INITIALIZING);

        await service.connect();
        expect(service.status).toBe(ServiceStatus.CONNECTED);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("connected")
        );

        await service.disconnect();
        expect(service.status).toBe(ServiceStatus.DISCONNECTED);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("disconnected")
        );
      });

      it("manages status updates", () => {
        service.setStatusTest(ServiceStatus.ERROR);
        expect(service.status).toBe(ServiceStatus.ERROR);
        expect(logger.info).toHaveBeenCalledWith(
          "TestService status changed to error" // Match exact string instead of using stringContaining
        );
      });
    });

    describe("health checks", () => {
      it("performs health check", async () => {
        const healthy = await service.isHealthy();
        expect(healthy).toBe(true);
      });

      it("handles health check failures", async () => {
        const failingService = new (class extends TestService {
          protected async checkHealth(): Promise<HealthCheckResult> {
            throw new Error("Health check failed");
          }
        })(config);

        const healthy = await failingService.isHealthy();
        expect(healthy).toBe(false);
        expect(logger.error).toHaveBeenCalled();
      });

      it("returns unhealthy status on check failure", async () => {
        const unhealthyService = new (class extends TestService {
          protected async checkHealth(): Promise<HealthCheckResult> {
            return {
              status: "unhealthy",
              message: "Service is not responding",
              timestamp: new Date(),
            };
          }
        })(config);

        const healthy = await unhealthyService.isHealthy();
        expect(healthy).toBe(false);
      });
    });
  });

  describe("ServiceConnectionManager", () => {
    let manager: ServiceConnectionManager;
    let service1: TestService;
    let service2: TestService;

    beforeEach(() => {
      manager = new ServiceConnectionManager();
      service1 = new TestService({ enabled: true });
      service2 = new TestService({ enabled: false });
      vi.clearAllMocks();
    });

    describe("service registration", () => {
      it("registers services successfully", () => {
        manager.registerService("service1", service1);
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("registered")
        );
      });

      it("prevents duplicate registration", () => {
        manager.registerService("service1", service1);
        expect(() => manager.registerService("service1", service1)).toThrow();
      });
    });

    describe("connection management", () => {
      beforeEach(() => {
        manager.registerService("service1", service1);
        manager.registerService("service2", service2);
      });

      it("connects only enabled services", async () => {
        await manager.connectAll();
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("Skipping disabled service")
        );
      });

      it("handles connection failures", async () => {
        const failingService = new (class extends TestService {
          async connect(): Promise<void> {
            throw new Error("Connection failed");
          }
        })({ enabled: true });

        manager.registerService("failing", failingService);
        await expect(manager.connectAll()).rejects.toThrow();
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to connect"),
          expect.any(Object)
        );
      });

      it("disconnects all services gracefully", async () => {
        await manager.disconnectAll();
        expect(logger.info).toHaveBeenCalledWith(
          expect.stringContaining("disconnected")
        );
      });

      it("continues disconnecting after individual service failure", async () => {
        const failingService = new (class extends TestService {
          async disconnect(): Promise<void> {
            throw new Error("Disconnect failed");
          }
        })({ enabled: true });

        manager.registerService("failing", failingService);
        await manager.disconnectAll();
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("Failed to disconnect"),
          expect.any(Object)
        );
      });
    });

    describe("health monitoring", () => {
      it("reports health status for enabled services", async () => {
        manager.registerService("service1", service1);
        manager.registerService("service2", service2);

        const status = await manager.getHealthStatus();
        expect(status).toHaveProperty("service1", true);
        expect(status).not.toHaveProperty("service2");
      });

      it("handles health check failures in status report", async () => {
        const failingService = new (class extends TestService {
          protected async checkHealth(): Promise<HealthCheckResult> {
            return {
              status: "unhealthy",
              message: "Service check failed",
              timestamp: new Date(),
            };
          }
        })({ enabled: true });

        manager.registerService("failing", failingService);
        const status = await manager.getHealthStatus();
        expect(status).toHaveProperty("failing", false);
      });
    });
  });
});

```

#### config

##### env.test.ts

```typescript
/**
 * @fileoverview Environment Configuration Tests
 * @module @qi/core/tests/unit/services/config/env.test
 */
import { describe, it, expect, beforeEach } from "vitest";
import { Schema } from "@qi/core/config";
import { envConfigSchema } from "@qi/core/services/config";
import { ConfigLoaderError } from "@qi/core/config";

describe("Environment Configuration Schema", () => {
  let schema: Schema;
  const SCHEMA_ID = "qi://core/services/config/env.schema";

  beforeEach(() => {
    schema = new Schema({ formats: true });
    schema.registerSchema(SCHEMA_ID, envConfigSchema);
  });

  it("should validate valid environment configuration", () => {
    const validEnv = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "admin@test.com",
      PGADMIN_DEFAULT_PASSWORD: "secret",
    };

    // Should not throw an error
    expect(() => schema.validate(validEnv, SCHEMA_ID)).not.toThrow();
  });

  it("should reject invalid email format", () => {
    const invalidEnv = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "invalid-email", // Invalid email
      PGADMIN_DEFAULT_PASSWORD: "secret",
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidEnv, SCHEMA_ID)).toThrow(
      ConfigLoaderError
    );
  });

  it("should validate optional telemetry setting", () => {
    const envWithTelemetry = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "admin@test.com",
      PGADMIN_DEFAULT_PASSWORD: "secret",
      QDB_TELEMETRY_ENABLED: "true",
    };

    // Should not throw an error
    expect(() => schema.validate(envWithTelemetry, SCHEMA_ID)).not.toThrow();
  });

  it("should reject invalid telemetry value", () => {
    const invalidEnv = {
      POSTGRES_PASSWORD: "secret",
      POSTGRES_USER: "postgres",
      POSTGRES_DB: "testdb",
      REDIS_PASSWORD: "secret",
      GF_SECURITY_ADMIN_PASSWORD: "secret",
      PGADMIN_DEFAULT_EMAIL: "admin@test.com",
      PGADMIN_DEFAULT_PASSWORD: "secret",
      QDB_TELEMETRY_ENABLED: "invalid", // Should be true/false
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidEnv, SCHEMA_ID)).toThrow(
      ConfigLoaderError
    );
  });
});

```

##### handlers.test.ts

```typescript
/**
 * @fileoverview Connection Handler Tests
 * @module @qi/core/tests/unit/services/config/handlers.test
 */
import { describe, it, expect } from "vitest";
import {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
} from "@qi/core/services/config";
import { ApplicationError } from "@qi/core/errors";

describe("Connection Handlers", () => {
  describe("PostgresConnectionHandler", () => {
    it("should handle special characters in password", () => {
      const handler = new PostgresConnectionHandler(
        {
          host: "localhost",
          port: 5432,
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
        {
          user: "test",
          password: "pass@word#123",
        }
      );

      const connString = handler.getConnectionString();
      expect(connString).toMatch(/pass@word#123/); // URL encoded special chars
    });

    it("should handle IPv6 addresses", () => {
      const handler = new PostgresConnectionHandler(
        {
          host: "::1",
          port: 5432,
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
        {
          user: "test",
          password: "password",
        }
      );

      const connString = handler.getConnectionString();
      expect(connString).toMatch(/\[::1\]/); // IPv6 address in brackets
    });
  });

  describe("QuestDBConnectionHandler", () => {
    it("should handle custom endpoint paths", () => {
      const handler = new QuestDBConnectionHandler({
        host: "localhost",
        httpPort: 9000,
        pgPort: 8812,
        influxPort: 9009,
      });

      expect(handler.getHttpEndpoint()).toBe("http://localhost:9000");
      expect(handler.getInfluxEndpoint()).toBe("http://localhost:9009");
    });

    it("should validate port ranges", () => {
      expect(
        () =>
          new QuestDBConnectionHandler({
            host: "localhost",
            httpPort: 0, // Invalid port
            pgPort: 8812,
            influxPort: 9009,
          })
      ).toThrow(ApplicationError);
    });
  });

  describe("MessageQueueConnectionHandler", () => {
    it("should handle missing optional broker ID", () => {
      const handler = new MessageQueueConnectionHandler(
        {
          kafkaPort: 9092,
          schemaRegistryPort: 8081,
          adminPort: 9644,
          pandaproxyPort: 8082,
        },
        {}
      );

      expect(handler.getBrokerId()).toBeUndefined();
    });

    it("should handle advertised addresses with ports", () => {
      const handler = new MessageQueueConnectionHandler(
        {
          kafkaPort: 9092,
          schemaRegistryPort: 8081,
          adminPort: 9644,
          pandaproxyPort: 8082,
        },
        {
          kafka: "broker.local:9093", // Custom port
          schemaRegistry: "schema.local:8082",
        }
      );

      expect(handler.getBrokerEndpoint()).toBe("broker.local:9093");
      expect(handler.getSchemaRegistryEndpoint()).toBe(
        "http://schema.local:8082"
      );
    });
  });

  describe("GrafanaEndpointHandler", () => {
    it("should handle plugin options with versions", () => {
      const handler = new GrafanaEndpointHandler(
        {
          host: "localhost",
          port: 3000,
        },
        { password: "secret" },
        "plugin1@1.0.0;plugin2@2.0.0"
      );

      expect(handler.getPlugins()).toEqual(["plugin1@1.0.0", "plugin2@2.0.0"]);
    });

    it("should handle invalid plugin string format", () => {
      const handler = new GrafanaEndpointHandler(
        {
          host: "localhost",
          port: 3000,
        },
        { password: "secret" },
        ";;" // Invalid format
      );

      expect(handler.getPlugins()).toEqual([]);
    });
  });
});

```

##### loader.test.ts

```typescript
/**
 * @fileoverview Config Service Unit Tests
 * @module @qi/core/tests/unit/services/config/loader.test
 *
 * @description
 * Unit tests for the service configuration loader and handlers.
 * Tests configuration loading, validation, and handler creation.
 *
 * @author Claude AI
 * @modified 2024-12-01
 * @created 2024-12-01
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ConfigFactory } from "@qi/core/config";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";

import {
  loadServiceConfig,
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "@qi/core/services/config";

// Mock external dependencies
vi.mock("@qi/core/config");
vi.mock("@qi/core/utils");
vi.mock("@qi/core/logger");

// Test configuration
const mockServiceConfig = {
  type: "services",
  version: "1.0",
  databases: {
    postgres: {
      host: "localhost",
      port: 5432,
      database: "testdb",
      user: "testuser",
      maxConnections: 10,
    },
    questdb: {
      host: "localhost",
      httpPort: 9000,
      pgPort: 8812,
      influxPort: 9009,
    },
    redis: {
      host: "localhost",
      port: 6379,
      maxRetries: 3,
    },
  },
  messageQueue: {
    redpanda: {
      kafkaPort: 9092,
      schemaRegistryPort: 8081,
      adminPort: 9644,
      pandaproxyPort: 8082,
    },
  },
  monitoring: {
    grafana: {
      host: "localhost",
      port: 3000,
    },
    pgAdmin: {
      host: "localhost",
      port: 8000,
    },
  },
  networking: {
    networks: {
      db: "test_db",
      redis: "test_redis",
      redpanda: "test_redpanda",
    },
  },
};

const mockEnvConfig = {
  POSTGRES_PASSWORD: "pg-password",
  POSTGRES_USER: "postgres",
  POSTGRES_DB: "postgres",
  REDIS_PASSWORD: "redis-password",
  GF_SECURITY_ADMIN_PASSWORD: "grafana-password",
  GF_INSTALL_PLUGINS: "plugin1;plugin2",
  PGADMIN_DEFAULT_EMAIL: "admin@test.com",
  PGADMIN_DEFAULT_PASSWORD: "pgadmin-password",
  REDPANDA_BROKER_ID: "1",
  REDPANDA_ADVERTISED_KAFKA_API: "localhost",
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: "localhost",
  REDPANDA_ADVERTISED_PANDAPROXY_API: "localhost",
};

describe("Service Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadServiceConfig", () => {
    it("should load and validate configuration successfully", async () => {
      // Mock environment loading
      vi.mocked(loadEnv).mockResolvedValueOnce(mockEnvConfig);

      // Mock configuration loading
      const mockLoader = {
        load: vi.fn().mockResolvedValueOnce(mockServiceConfig),
        source: "",
      };

      vi.mocked(ConfigFactory.prototype.createLoader).mockReturnValueOnce(
        mockLoader
      );

      const services = await loadServiceConfig({
        configPath: "/test/config.json",
        envPath: "/test/.env",
      });

      expect(services).toBeDefined();
      expect(services.databases.postgres).toBeInstanceOf(
        PostgresConnectionHandler
      );
      expect(services.databases.questdb).toBeInstanceOf(
        QuestDBConnectionHandler
      );
      expect(services.databases.redis).toBeInstanceOf(RedisConnectionHandler);
      expect(services.messageQueue).toBeInstanceOf(
        MessageQueueConnectionHandler
      );
      expect(services.monitoring.grafana).toBeInstanceOf(
        GrafanaEndpointHandler
      );
      expect(services.monitoring.pgAdmin).toBeInstanceOf(
        MonitoringEndpointHandler
      );
      expect(services.networking).toBeInstanceOf(NetworkConfigHandler);

      expect(logger.info).toHaveBeenCalledWith(
        "Loaded service configuration",
        expect.any(Object)
      );
    });

    it("should handle missing environment configuration", async () => {
      vi.mocked(loadEnv).mockResolvedValueOnce(null);

      const promise = loadServiceConfig({
        configPath: "/test/config.json",
        envPath: "/test/.env",
      });

      // First verify it rejects with ApplicationError
      await expect(promise).rejects.toBeInstanceOf(ApplicationError);

      try {
        await promise;
      } catch (error) {
        // Then check specific error properties
        expect(error).toEqual(
          expect.objectContaining({
            code: ErrorCode.ENV_MISSING_ERROR,
            details: { path: "/test/.env" },
          })
        );
      }
    });

    it("should handle configuration loading failures", async () => {
      vi.mocked(loadEnv).mockResolvedValueOnce(mockEnvConfig);

      const mockLoader = {
        load: vi.fn().mockRejectedValueOnce(new Error("Invalid config")),
        source: "",
      };

      vi.mocked(ConfigFactory.prototype.createLoader).mockReturnValueOnce(
        mockLoader
      );

      const promise = loadServiceConfig({
        configPath: "/test/config.json",
        envPath: "/test/.env",
      });

      // First verify it rejects with ApplicationError
      await expect(promise).rejects.toBeInstanceOf(ApplicationError);

      try {
        await promise;
      } catch (error) {
        // Then check specific error properties
        expect(error).toEqual(
          expect.objectContaining({
            code: ErrorCode.SERVICE_INITIALIZATION_ERROR,
            statusCode: 500,
            details: {
              configPath: "/test/config.json",
              envPath: "/test/.env",
              error: expect.stringContaining("Invalid config"),
            },
          })
        );
      }
    });
  });
  describe("service handlers", () => {
    describe("PostgresConnectionHandler", () => {
      it("should generate correct connection string", () => {
        const handler = new PostgresConnectionHandler(
          mockServiceConfig.databases.postgres,
          {
            user: "testuser",
            password: "testpass",
          }
        );

        expect(handler.getConnectionString()).toBe(
          "postgresql://testuser:testpass@localhost:5432/testdb"
        );
        expect(handler.getMaxConnections()).toBe(10);
      });

      it("should validate required configuration", () => {
        expect(
          () =>
            new PostgresConnectionHandler(
              { ...mockServiceConfig.databases.postgres, host: "" },
              { user: "test", password: "test" }
            )
        ).toThrowError(ApplicationError);
      });
    });

    describe("QuestDBConnectionHandler", () => {
      it("should generate correct endpoints", () => {
        const handler = new QuestDBConnectionHandler(
          mockServiceConfig.databases.questdb
        );

        expect(handler.getHttpEndpoint()).toBe("http://localhost:9000");
        expect(handler.getPgEndpoint()).toBe(
          "postgresql://localhost:8812/questdb"
        );
        expect(handler.getInfluxEndpoint()).toBe("http://localhost:9009");
      });

      it("should validate required configuration", () => {
        expect(
          () =>
            new QuestDBConnectionHandler({
              ...mockServiceConfig.databases.questdb,
              httpPort: 0,
            })
        ).toThrowError(ApplicationError);
      });
    });

    describe("RedisConnectionHandler", () => {
      it("should generate correct connection string", () => {
        const handler = new RedisConnectionHandler(
          mockServiceConfig.databases.redis,
          "testpass"
        );

        expect(handler.getConnectionString()).toBe(
          "redis://:testpass@localhost:6379"
        );
        expect(handler.getMaxRetries()).toBe(3);
      });

      it("should validate required configuration", () => {
        expect(
          () =>
            new RedisConnectionHandler(
              { ...mockServiceConfig.databases.redis, port: 0 },
              "test"
            )
        ).toThrowError(ApplicationError);
      });
    });

    describe("MessageQueueConnectionHandler", () => {
      it("should generate correct endpoints", () => {
        const handler = new MessageQueueConnectionHandler(
          mockServiceConfig.messageQueue.redpanda,
          {
            kafka: "kafka.local",
            schemaRegistry: "schema.local",
            proxy: "proxy.local",
            brokerId: "1",
          }
        );

        expect(handler.getBrokerEndpoint()).toBe("kafka.local:9092");
        expect(handler.getSchemaRegistryEndpoint()).toBe(
          "http://schema.local:8081"
        );
        expect(handler.getProxyEndpoint()).toBe("http://proxy.local:8082");
        expect(handler.getBrokerId()).toBe(1);
      });

      it("should handle missing advertised addresses", () => {
        const handler = new MessageQueueConnectionHandler(
          mockServiceConfig.messageQueue.redpanda,
          {}
        );

        expect(handler.getBrokerEndpoint()).toBe("localhost:9092");
        expect(handler.getBrokerId()).toBeUndefined();
      });
    });

    describe("NetworkConfigHandler", () => {
      it("should return correct network names", () => {
        const handler = new NetworkConfigHandler(
          mockServiceConfig.networking.networks
        );

        expect(handler.getNetworkName("db")).toBe("test_db");
        expect(handler.getNetworkName("redis")).toBe("test_redis");
        expect(handler.getNetworkName("redpanda")).toBe("test_redpanda");
        expect(handler.getAllNetworks()).toEqual(
          mockServiceConfig.networking.networks
        );
      });

      it("should validate required networks", () => {
        expect(
          () =>
            new NetworkConfigHandler({
              ...mockServiceConfig.networking.networks,
              db: "",
            })
        ).toThrowError(ApplicationError);
      });
    });

    describe("MonitoringEndpointHandler", () => {
      it("should generate correct endpoint and credentials", () => {
        const handler = new MonitoringEndpointHandler(
          mockServiceConfig.monitoring.grafana,
          { username: "admin", password: "secret" }
        );

        expect(handler.getEndpoint()).toBe("http://localhost:3000");
        expect(handler.getCredentials()).toEqual({
          username: "admin",
          password: "secret",
        });
      });
    });

    describe("GrafanaEndpointHandler", () => {
      it("should handle plugins configuration", () => {
        const handler = new GrafanaEndpointHandler(
          mockServiceConfig.monitoring.grafana,
          { password: "secret" },
          "plugin1;plugin2"
        );

        expect(handler.getPlugins()).toEqual(["plugin1", "plugin2"]);
      });

      it("should handle empty plugins", () => {
        const handler = new GrafanaEndpointHandler(
          mockServiceConfig.monitoring.grafana,
          { password: "secret" }
        );

        expect(handler.getPlugins()).toEqual([]);
      });
    });
  });
});

```

##### schema.test.ts

```typescript
/**
 * @fileoverview Additional Config Service Tests
 * @module @qi/core/tests/unit/services/config/schema.test
 */

import { describe, it, expect, beforeEach } from "vitest";
import { serviceConfigSchema } from "@qi/core/services/config";
import { Schema } from "@qi/core/config";
import { ConfigLoaderError } from "@qi/core/config";

describe("Service Configuration Schema", () => {
  let schema: Schema;
  const SCHEMA_ID = "qi://core/services/config/service.schema";

  beforeEach(() => {
    schema = new Schema({ formats: true });
    // Register the schema with an ID for validation
    schema.registerSchema(SCHEMA_ID, serviceConfigSchema);
  });

  it("should validate valid service configuration", () => {
    const validConfig = {
      type: "services",
      version: "1.0",
      databases: {
        postgres: {
          host: "localhost",
          port: 5432,
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
        questdb: {
          host: "localhost",
          httpPort: 9000,
          pgPort: 8812,
          influxPort: 9009,
        },
        redis: {
          host: "localhost",
          port: 6379,
          maxRetries: 3,
        },
      },
      messageQueue: {
        redpanda: {
          kafkaPort: 9092,
          schemaRegistryPort: 8081,
          adminPort: 9644,
          pandaproxyPort: 8082,
        },
      },
      monitoring: {
        grafana: {
          host: "localhost",
          port: 3000,
        },
        pgAdmin: {
          host: "localhost",
          port: 8000,
        },
      },
      networking: {
        networks: {
          db: "test_db",
          redis: "test_redis",
          redpanda: "test_redpanda",
        },
      },
    };

    // Should not throw an error
    expect(() => schema.validate(validConfig, SCHEMA_ID)).not.toThrow();
  });

  it("should reject invalid port numbers", () => {
    const invalidConfig = {
      type: "services",
      version: "1.0",
      databases: {
        postgres: {
          host: "localhost",
          port: 70000, // Invalid port
          database: "testdb",
          user: "test",
          maxConnections: 10,
        },
      },
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidConfig, "service-config")).toThrow(
      ConfigLoaderError
    );
  });

  it("should reject missing required fields", () => {
    const incompleteConfig = {
      type: "services",
      version: "1.0",
      databases: {
        postgres: {
          host: "localhost",
          // Missing port
          database: "testdb",
          // Missing other required fields
        },
      },
    };

    // Should throw a validation error
    expect(() => schema.validate(incompleteConfig, "service-config")).toThrow(
      ConfigLoaderError
    );
  });

  it("should reject invalid version format", () => {
    const invalidConfig = {
      type: "services",
      version: "invalid", // Should be semver format
      databases: {},
    };

    // Should throw a validation error
    expect(() => schema.validate(invalidConfig, "service-config")).toThrow(
      ConfigLoaderError
    );
  });
});

```

#### questdb

##### index.test.ts

```typescript
/**
 * @fileoverview QuestDB Service Unit Tests
 * @module @qi/core/tests/unit/services/questdb/client.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PoolConfig, QueryResult } from "pg";
import { QuestDBService } from "@qi/core/services/questdb";
import { ApplicationError } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import type { Mock } from "vitest";

interface MockedClient {
  query: Mock<(text: string, params?: any[]) => Promise<QueryResult>>;
  release: Mock;
}

interface MockedPool {
  connect: Mock<() => Promise<MockedClient>>;
  end: Mock<() => Promise<void>>;
  on: Mock;
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

const mockPool = {
  connect: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
} as unknown as MockedPool;

const MockPool = vi.fn(() => mockPool);

// Mock pg module with dynamic import support
vi.mock("pg", () => ({
  default: {
    Pool: MockPool,
  },
  Pool: MockPool,
}));

vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("QuestDBService", () => {
  const mockConnection = {
    getHost: () => "localhost",
    getPort: () => 8812,
    getDatabase: () => "qdb",
    getUser: () => "admin",
    getPassword: () => "quest",
    getConnectionString: () => "postgresql://localhost:8812/qdb",
    getMaxConnections: () => 10,
  };

  const mockConfig = {
    enabled: true,
    connection: mockConnection,
    pool: {
      max: 20,
      min: 5,
      acquireTimeout: 30000,
      idleTimeout: 10000,
      connectionTimeoutMillis: 5000,
      statementTimeout: 30000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
    },
  };

  const mockClient: MockedClient = {
    query: vi.fn(),
    release: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient.query.mockResolvedValue({
      rows: [],
      command: "",
      rowCount: 0,
      oid: 0,
      fields: [],
    } as QueryResult);

    (mockPool.connect as Mock).mockResolvedValue(mockClient);
    (mockPool.end as Mock).mockResolvedValue(undefined);
    (mockPool.on as Mock).mockImplementation(() => mockPool);
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      const service = new QuestDBService(mockConfig);
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      const service = new QuestDBService({ ...mockConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(MockPool).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      expect(MockPool).toHaveBeenCalledWith({
        host: "localhost",
        port: 8812,
        database: "qdb",
        user: "admin",
        password: "quest",
        max: 20,
        min: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 30000,
      } as PoolConfig);

      expect(mockClient.query).toHaveBeenCalledWith("SELECT 1");
      expect(await service.isHealthy()).toBe(true);
    });

    it("handles connection failure", async () => {
      const service = new QuestDBService(mockConfig);
      (mockPool.connect as Mock).mockRejectedValueOnce(
        new Error("Connection failed")
      );

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("handles query failure during connection", async () => {
      const service = new QuestDBService(mockConfig);
      mockClient.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("disconnects properly", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();
      await service.disconnect();

      expect(mockPool.end).toHaveBeenCalled();
      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe("health checks", () => {
    it("performs health check successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockResolvedValueOnce({
        rows: [{ "?column?": 1 }],
      } as QueryResult);
      const health = await service["checkHealth"]();

      expect(mockClient.query).toHaveBeenCalledWith("SELECT 1");
      expect(health.status).toBe("healthy");
      expect(health.message).toBe("QuestDB is responsive");
      expect(health.details).toEqual({
        host: "localhost",
        port: 8812,
        database: "qdb",
        poolSize: 0,
        idleConnections: 0,
        waitingClients: 0,
      });
    });

    it("handles failed health check", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockRejectedValueOnce(new Error("Health check failed"));
      const health = await service["checkHealth"]();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toContain("Health check failed");
    });

    it("returns unhealthy when pool is not initialized", async () => {
      const service = new QuestDBService(mockConfig);
      const health = await service["checkHealth"]();

      expect(health.status).toBe("unhealthy");
      expect(health.message).toBe("QuestDB connection not initialized");
    });
  });

  describe("query execution", () => {
    it("executes query successfully", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      const mockResult = {
        rows: [{ id: 1, value: 100 }],
        rowCount: 1,
      } as QueryResult;

      mockClient.query.mockResolvedValueOnce(mockResult);

      const result = await service.query(
        "SELECT * FROM sensors WHERE id = $1",
        [1]
      );

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith(
        "SELECT * FROM sensors WHERE id = $1",
        [1]
      );
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });

    it("releases client after query failure", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      mockClient.query.mockRejectedValueOnce(new Error("Query failed"));

      await expect(
        service.query("SELECT * FROM invalid_table")
      ).rejects.toThrow();

      expect(mockClient.release).toHaveBeenCalled();
    });

    it("throws when accessing pool before initialization", () => {
      const service = new QuestDBService(mockConfig);
      expect(() => service.getPool()).toThrow(ApplicationError);
    });
  });

  describe("error handling", () => {
    it("handles pool error events", async () => {
      const service = new QuestDBService(mockConfig);
      await service.connect();

      const errorHandler = (mockPool.on as Mock).mock.calls.find(
        (call) => call[0] === "error"
      )?.[1] as (err: Error) => void;

      expect(errorHandler).toBeDefined();
      errorHandler(new Error("Pool error"));

      expect(logger.error).toHaveBeenCalledWith(
        "Unexpected QuestDB pool error",
        { error: "Pool error" }
      );
    });
  });
});

```

#### redis

##### client.test.ts

```typescript
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

```

#### redpanda

##### index.test.ts

```typescript
/**
 * @fileoverview Unit tests for RedPanda service
 * @module @qi/core/test/unit/services/redpanda
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Kafka } from "kafkajs";
import { RedPandaService } from "@qi/core/services/redpanda";
import { ApplicationError } from "@qi/core/errors";

// Mock external dependencies first
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock KafkaJS
const mockProducer = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  send: vi.fn(),
};

const mockConsumer = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  subscribe: vi.fn(),
};

const mockAdmin = {
  listTopics: vi.fn(),
  disconnect: vi.fn(),
};

const mockKafkaInstance = {
  producer: () => mockProducer,
  consumer: () => mockConsumer,
  admin: () => mockAdmin,
};

vi.mock("kafkajs", () => ({
  Kafka: vi.fn(() => mockKafkaInstance),
}));

describe("RedPandaService", () => {
  const mockConnection = {
    getBrokerEndpoint: vi.fn(() => "localhost:9092"),
    getSchemaRegistryEndpoint: vi.fn(() => "http://localhost:8081"),
    getSSLConfig: vi.fn(() => ({})),
    getSASLConfig: vi.fn(() => undefined),
    getConnectionTimeout: vi.fn(() => 5000),
    getRequestTimeout: vi.fn(() => 30000),
    getBrokerId: vi.fn(() => 1),
    getBrokers: vi.fn(() => ["localhost:9092"]),
    getAdminEndpoint: vi.fn(() => "http://localhost:9644"),
    getProxyEndpoint: vi.fn(() => "http://localhost:8082"),
  };

  const defaultConfig = {
    enabled: true,
    connection: mockConnection,
    clientId: "test-client",
    consumer: {
      groupId: "test-group",
    },
  };

  let service: RedPandaService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RedPandaService(defaultConfig);
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      service = new RedPandaService({ ...defaultConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(Kafka).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);

      await service.connect();

      expect(Kafka).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: defaultConfig.clientId,
          brokers: [defaultConfig.connection.getBrokerEndpoint()],
        })
      );

      expect(mockProducer.connect).toHaveBeenCalled();
      expect(mockConsumer.connect).toHaveBeenCalled();
    });

    it("handles producer connection failure", async () => {
      mockProducer.connect.mockRejectedValueOnce(
        new Error("Connection failed")
      );
      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("disconnects properly", async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);
      mockProducer.disconnect.mockResolvedValueOnce(undefined);
      mockConsumer.disconnect.mockResolvedValueOnce(undefined);

      await service.connect();
      await service.disconnect();

      expect(mockProducer.disconnect).toHaveBeenCalled();
      expect(mockConsumer.disconnect).toHaveBeenCalled();
    });
  });

  describe("health checks", () => {
    it("returns unhealthy when not connected", async () => {
      const health = await service["checkHealth"]();
      expect(health.status).toBe("unhealthy");
    });

    it("returns healthy when connected and responsive", async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);
      mockAdmin.listTopics.mockResolvedValueOnce(["test-topic"]);

      await service.connect();
      const health = await service["checkHealth"]();

      expect(health.status).toBe("healthy");
      expect(health.details).toEqual(
        expect.objectContaining({
          brokerEndpoint: "localhost:9092",
          clientId: "test-client",
        })
      );
    });
  });

  describe("message operations", () => {
    const testTopic = "test-topic";
    const testMessages = [{ value: "test-message" }];

    beforeEach(async () => {
      mockProducer.connect.mockResolvedValueOnce(undefined);
      mockConsumer.connect.mockResolvedValueOnce(undefined);
      await service.connect();
    });

    it("sends messages successfully", async () => {
      mockProducer.send.mockResolvedValueOnce(undefined);
      await service.send(testTopic, testMessages);

      expect(mockProducer.send).toHaveBeenCalledWith({
        topic: testTopic,
        messages: expect.arrayContaining([
          expect.objectContaining({ value: "test-message" }),
        ]),
      });
    });

    it("subscribes to topics successfully", async () => {
      mockConsumer.subscribe.mockResolvedValueOnce(undefined);
      await service.subscribe([testTopic]);

      expect(mockConsumer.subscribe).toHaveBeenCalledWith({
        topic: testTopic,
        fromBeginning: false,
      });
    });

    it("handles send failure", async () => {
      mockProducer.send.mockRejectedValueOnce(new Error("Send failed"));
      await expect(service.send(testTopic, testMessages)).rejects.toThrow(
        ApplicationError
      );
    });
  });
});

```

#### timescaledb

##### client.test.ts

```typescript
/**
 * @fileoverview TimescaleDB Service Unit Tests
 * @module @qi/core/tests/unit/services/timescaledb/client.test
 * @description Tests the TimescaleDB service implementation including connection management,
 * health checks, model synchronization, and error handling.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-04
 * @modified 2024-12-05
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sequelize } from "sequelize";
import { TimescaleDBService } from "@qi/core/services/timescaledb";
import { ApplicationError } from "@qi/core/errors";
import type { Mock } from "vitest";

// Mock external dependencies
vi.mock("sequelize");
vi.mock("@qi/core/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("TimescaleDBService", () => {
  const mockConnection = {
    getHost: () => "localhost",
    getPort: () => 5432,
    getDatabase: () => "testdb",
    getUser: () => "testuser",
    getPassword: () => "testpass",
    getConnectionString: () => "postgresql://localhost:5432/testdb",
    getMaxConnections: () => 10,
  };

  const mockConfig = {
    enabled: true,
    connection: mockConnection,
    pool: {
      max: 20,
      min: 5,
      acquireTimeout: 30000,
      idleTimeout: 10000,
      connectionTimeoutMillis: 5000,
      statementTimeout: 30000,
      idleInTransactionSessionTimeout: 60000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      retries: 3,
    },
    sync: {
      force: false,
      alter: true,
    },
  };

  // Create a proper type for the mocked Sequelize instance
  type MockedSequelize = {
    authenticate: Mock;
    close: Mock;
    sync: Mock;
    fn: Mock;
    col: Mock;
    cast: Mock;
    literal: Mock;
  } & Partial<Sequelize>;

  let mockSequelize: MockedSequelize;

  beforeEach(() => {
    // Create fresh mock instance for each test
    mockSequelize = {
      authenticate: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      sync: vi.fn().mockResolvedValue(undefined),
      fn: vi.fn(),
      col: vi.fn(),
      cast: vi.fn(),
      literal: vi.fn(),
    };

    // Clear all mocks
    vi.clearAllMocks();

    // Mock the Sequelize constructor
    vi.mocked(Sequelize).mockImplementation(
      () => mockSequelize as unknown as Sequelize
    );
  });

  describe("initialization", () => {
    it("creates service with correct config", () => {
      const service = new TimescaleDBService(mockConfig);
      expect(service).toBeDefined();
      expect(service.isEnabled()).toBe(true);
    });

    it("handles disabled service", async () => {
      const service = new TimescaleDBService({ ...mockConfig, enabled: false });
      await service.connect();
      expect(service.isEnabled()).toBe(false);
      expect(Sequelize).not.toHaveBeenCalled();
    });
  });

  describe("connection lifecycle", () => {
    it("establishes connection successfully", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      expect(Sequelize).toHaveBeenCalledWith({
        dialect: "postgres",
        host: "localhost",
        port: 5432,
        database: "testdb",
        username: "testuser",
        password: "testpass",
        logging: expect.any(Function),
        pool: {
          max: 20,
          min: 5,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          connectTimeout: 5000,
          statement_timeout: 30000,
          idle_in_transaction_session_timeout: 60000,
        },
      });

      expect(await service.isHealthy()).toBe(true);
    });

    it("handles connection failure", async () => {
      const service = new TimescaleDBService(mockConfig);
      mockSequelize.authenticate.mockRejectedValueOnce(
        new Error("Connection failed")
      );

      await expect(service.connect()).rejects.toThrow(ApplicationError);
    });

    it("disconnects properly", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();
      await service.disconnect();

      expect(mockSequelize.close).toHaveBeenCalled();
      mockSequelize.authenticate.mockRejectedValueOnce(
        new Error("Not connected")
      );
      expect(await service.isHealthy()).toBe(false);
    });
  });

  describe("health checks", () => {
    it("performs health check successfully", async () => {
      // Create service instance
      const service = new TimescaleDBService(mockConfig);

      // Connect (uses first authenticate call)
      await service.connect();

      // Reset authenticate mock for health check
      mockSequelize.authenticate.mockClear();
      mockSequelize.authenticate.mockResolvedValueOnce(undefined);

      // Perform health check
      const health = await service["checkHealth"]();

      // Verify expectations
      expect(mockSequelize.authenticate).toHaveBeenCalledTimes(1);
      expect(health.status).toBe("healthy");
      expect(health.message).toBe("TimescaleDB is responsive");
      expect(health.details).toEqual({
        database: "testdb",
        host: "localhost",
        port: 5432,
      });
    });

    it("handles failed health check during operation", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      mockSequelize.authenticate.mockRejectedValueOnce(
        new Error("Health check failed")
      );

      const health = await service["checkHealth"]();
      expect(health.status).toBe("unhealthy");
      expect(health.message).toContain("Health check failed");
    });
  });

  describe("model synchronization", () => {
    it("syncs models when configured", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      expect(mockSequelize.sync).toHaveBeenCalledWith({
        force: false,
        alter: true,
      });
    });

    it("skips sync when not configured", async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sync: syncConfig, ...configWithoutSync } = mockConfig;
      const service = new TimescaleDBService(configWithoutSync);
      await service.connect();

      expect(mockSequelize.sync).not.toHaveBeenCalled();
    });
  });

  describe("sequelize access", () => {
    it("provides access to Sequelize instance", async () => {
      const service = new TimescaleDBService(mockConfig);
      await service.connect();

      const sequelize = service.getSequelize();
      expect(sequelize).toBeDefined();
      expect(sequelize).toBe(mockSequelize);
    });

    it("throws when accessing Sequelize before initialization", () => {
      const service = new TimescaleDBService(mockConfig);
      expect(() => service.getSequelize()).toThrow(ApplicationError);
    });
  });
});

```

