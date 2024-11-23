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
