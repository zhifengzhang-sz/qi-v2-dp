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
