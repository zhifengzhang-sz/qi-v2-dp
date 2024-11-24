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
