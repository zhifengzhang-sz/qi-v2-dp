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
