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
