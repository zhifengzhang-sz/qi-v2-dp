/**
 * @fileoverview
 * @module EnvLoader.test.ts
 *
 * This file tests the EnvLoader class, ensuring environment variables are loaded,
 * watched for changes, and properly validated.
 *
 * @author zhifengzhang-sz
 * @created 2024-11-23
 * @modified 2024-12-25
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { FSWatcher, PathLike } from "node:fs";
import fs from "node:fs"; // Default import
import { EnvLoader, ISchema } from "@qi/core/config";
import { loadEnv } from "@qi/core/utils";
import { EventEmitter } from "events";

// Define WatchListener type
type WatchListener = (eventType: string, filename: string | Buffer) => void;

// Create a MockFSWatcher class
class MockFSWatcher extends EventEmitter implements FSWatcher {
  close = vi.fn();
  ref = vi.fn().mockReturnThis();
  unref = vi.fn().mockReturnThis();
}

// Mock "node:fs" with a default export
vi.mock("node:fs", () => {
  // Import the actual fs module
  const actualFs = vi.importActual<typeof fs>("node:fs");
  return {
    // Include all actual exports
    ...actualFs,
    // Provide a default export
    default: {
      ...actualFs,
      // Override the methods you need to mock
      watch: vi
        .fn()
        .mockImplementation((path: PathLike, options?: any, listener?: any) => {
          const watcher = new MockFSWatcher();
          const watchListener =
            typeof options === "function" ? options : listener;
          if (watchListener) {
            watcher.on("change", watchListener);
          }
          fileWatchers.push(watcher);
          return watcher;
        }),
      existsSync: vi.fn().mockReturnValue(true),
    },
    // Optionally override named exports as well
    watch: vi
      .fn()
      .mockImplementation((path: PathLike, options?: any, listener?: any) => {
        const watcher = new MockFSWatcher();
        const watchListener =
          typeof options === "function" ? options : listener;
        if (watchListener) {
          watcher.on("change", watchListener);
        }
        fileWatchers.push(watcher);
        return watcher;
      }),
    existsSync: vi.fn().mockReturnValue(true),
  };
});

// Mock @qi/core/utils
vi.mock("@qi/core/utils", () => ({
  loadEnv: vi.fn(),
}));

// Types and test configuration
interface TestEnvConfig extends Record<string, string | undefined> {
  type: string;
  version: string;
  PORT: string;
  HOST: string;
  API_KEY?: string;
}

// Initial valid environment variables
const validEnvVars = {
  type: "test-type",
  version: "1.0.0",
  PORT: "3000",
  HOST: "localhost",
  API_KEY: "test-key",
};

let fileWatchers: FSWatcher[] = [];
let loader: EnvLoader<TestEnvConfig>;
let mockSchema: ISchema;
let originalEnv: Record<string, string | undefined>;

// Update beforeEach block
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env = { ...validEnvVars };

  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.spyOn(global, "setInterval");

  mockSchema = {
    validate: vi.fn(),
    validateSchema: vi.fn(),
    getSchema: vi.fn(),
    registerSchema: vi.fn(),
    removeSchema: vi.fn(),
    hasSchema: vi.fn(),
  };

  fileWatchers = [];

  // Setup consistent fs.watch mock
  vi.mocked(fs.watch).mockImplementation((path, listener) => {
    const watcher = new MockFSWatcher();
    if (typeof listener === "function") {
      watcher.on("change", listener);
    }
    fileWatchers.push(watcher);
    return watcher;
  });
});

afterEach(() => {
  process.env = originalEnv;
  vi.clearAllTimers();
  vi.useRealTimers();
  // Clear any created watchers
  fileWatchers.forEach((w) => {
    w.removeAllListeners();
    w.close();
  });
  fileWatchers = [];
  vi.clearAllMocks();
});

describe("EnvLoader", () => {
  describe("load", () => {
    it("should notify callbacks on file changes", async () => {
      // Reset mocks
      vi.clearAllMocks();
      vi.mocked(loadEnv).mockReset();

      // Define states
      const state1 = { ...validEnvVars };
      const state2 = { ...validEnvVars, PORT: "4000" };

      // Setup loadEnv sequence
      vi.mocked(loadEnv)
        .mockResolvedValueOnce(state1)
        .mockResolvedValueOnce(state2);

      // Create loader
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      const stateChanges: any[] = [];
      const callback = vi.fn((change) => {
        console.log("State transition:", change);
        stateChanges.push(change);
      });

      // Initial setup
      await loader.watch(callback);
      const initial = await loader.load();
      console.log("Initial state:", initial);

      // Trigger change
      const watcher = fileWatchers[0];
      watcher.emit("change", "change", ".env");
      await loader.load();

      // Verify first state change
      expect(stateChanges[0]).toEqual(
        expect.objectContaining({
          previous: state1,
          current: state2,
          source: ".env",
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe("watch", () => {
    it("should set up refresh interval when specified", async () => {
      const refreshInterval = 5000;
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        refreshInterval,
        watch: true,
      });

      await loader.watch(vi.fn());

      // Instead of running all timers, just advance once by the interval
      await vi.advanceTimersByTimeAsync(refreshInterval);

      expect(setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        refreshInterval
      );
    });

    it("should set up file watcher", async () => {
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      await loader.watch(vi.fn());

      expect(fs.watch).toHaveBeenCalledWith(".env", expect.any(Function));
    });
  });

  describe("unwatch", () => {
    it("should close file watchers", async () => {
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      await loader.watch(vi.fn());
      await loader.unwatch();

      expect(fileWatchers[0].close).toHaveBeenCalled();
    });

    it("should clear refresh interval", async () => {
      const mockIntervalId = 123;
      vi.spyOn(global, "setInterval").mockReturnValue(
        mockIntervalId as unknown as NodeJS.Timeout
      );
      vi.spyOn(global, "clearInterval");

      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        refreshInterval: 5000,
        watch: true,
      });

      await loader.watch(vi.fn());
      await loader.unwatch();

      expect(clearInterval).toHaveBeenCalledWith(mockIntervalId);
    });

    it("should handle multiple unwatch calls safely", async () => {
      loader = new EnvLoader(mockSchema, "test-schema", {
        path: ".env",
        watch: true,
      });

      await loader.watch(vi.fn());
      await loader.unwatch();
      await loader.unwatch(); // second call should not throw errors

      // If no error is thrown, the test passes
      expect(true).toBe(true);
    });
  });
});
