/**
 * @fileoverview
 * @module ConfigFactory.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-25
 * @modified 2024-12-25
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

// 1. Fix top-level mock for fs.readFile
vi.mock("node:fs/promises", () => {
  const mockReadFile = vi.fn();
  return {
    readFile: mockReadFile,
    default: {
      readFile: mockReadFile
    }
  };
});

// 2. Define test config after mock
const TEST_CONFIG = {
  type: "test",
  version: "1.0.0",
  name: "test-config",
  port: 3000,
  features: ["feature1"],
};

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

    beforeEach(() => {
      // Reset fs mock for each test
      vi.mocked(fs.readFile).mockReset();
    });

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

  // 3. Update test cases
  describe("factory without cache", () => {
    let testPath: string;

    beforeEach(() => {
      testPath = "config/test-1.0.0.json";
      factory = new ConfigFactory(schema);
      
      // Reset and setup mock with proper JSON string
      const mockData = JSON.stringify(TEST_CONFIG);
      vi.mocked(fs.readFile)
        .mockReset()
        .mockResolvedValue(mockData);
    });

    it("should create a CachedConfigLoader with null cache", async () => {
      const loader = factory.createLoader<TestConfig>({
        type: "test",
        version: "1.0.0",
        schema: testSchema,
      });

      const result = await loader.load();
      expect(fs.readFile).toHaveBeenCalledWith(testPath, "utf-8");
      expect(result).toEqual(TEST_CONFIG);
    });

    it("should handle file read errors", async () => {
      // Reset and setup error
      vi.mocked(fs.readFile)
        .mockReset()
        .mockRejectedValue(new Error("File not found"));

      const loader = factory.createLoader<TestConfig>({
        type: "test",
        version: "1.0.0",
        schema: testSchema,
      });

      await expect(loader.load()).rejects.toThrow(ConfigLoaderError);
    });
  });
});
