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
