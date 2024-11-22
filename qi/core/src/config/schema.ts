/**
 * @fileoverview
 * @module schema
 *
 * @description
 * This module implements the Schema class which provides methods for
 * managing and validating JSON Schemas using the AJV library.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { Ajv, ValidateFunction } from "ajv";
import { ISchema } from "./IConfig.js";
import { JsonSchema } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_LOADER_CODES, ConfigLoaderError } from "./errors.js";
import addFormats from "ajv-formats";

/**
 * Class representing a schema manager.
 *
 * @class Schema
 * @implements {ISchema}
 * @description
 * Provides methods for managing and validating JSON Schemas using the AJV library.
 */
export class Schema implements ISchema {
  private readonly ajv: Ajv;
  private readonly schemas = new Map<string, JsonSchema>();
  private readonly validators = new Map<string, ValidateFunction>();

  /**
   * Creates an instance of Schema.
   *
   * @param {Object} [options] - The options for the schema manager.
   * @param {boolean} [options.strict=true] - Whether to enable strict mode.
   * @param {boolean} [options.formats=true] - Whether to add format validations.
   */
  constructor(options: { strict?: boolean; formats?: boolean } = {}) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: options.strict ?? true,
      validateSchema: true,
      validateFormats: true,
    });

    if (options.formats) {
      addFormats.default(this.ajv);
    }
  }

  /**
   * Validates a configuration object against a registered schema.
   *
   * @param {unknown} config - The configuration object to validate.
   * @param {string} schemaId - The identifier of the schema to validate against.
   * @throws {ConfigError} - Throws an error if the schema is not found or validation fails.
   */
  validate(config: unknown, schemaId: string): void {
    const validator = this.validators.get(schemaId);
    if (!validator) {
      throw ConfigLoaderError.create(
        "Schema not found",
        CONFIG_LOADER_CODES.SCHEMA_NOT_FOUND,
        schemaId
      );
    }

    if (!validator(config)) {
      throw ConfigLoaderError.validationError(
        "Schema validation failed",
        schemaId,
        validator.errors || []
      );
    }
  }

  /**
   * Validates a JSON Schema.
   *
   * @param {JsonSchema} schema - The JSON Schema to validate.
   * @throws {ConfigError} - Throws an error if the schema is invalid.
   */
  validateSchema(schema: JsonSchema): void {
    if (!this.ajv.validateSchema(schema)) {
      throw ConfigLoaderError.schemaError(
        "Invalid schema definition",
        schema.$id ?? "unknown",
        { errors: this.ajv.errors || [] }
      );
    }
  }

  /**
   * Registers a new JSON Schema.
   *
   * @param {string} name - The name of the schema to register.
   * @param {JsonSchema} schema - The schema to register.
   * @throws {ConfigError} - Throws an error if the schema already exists or is invalid.
   */
  registerSchema(name: string, schema: JsonSchema): void {
    try {
      if (this.schemas.has(name)) {
        throw ConfigLoaderError.create(
          "Schema name already exists",
          CONFIG_LOADER_CODES.SCHEMA_EXISTS,
          name,
          { existingSchema: true }
        );
      }

      if (schema.$id && this.ajv.getSchema(schema.$id)) {
        throw ConfigLoaderError.create(
          "Schema ID already exists",
          CONFIG_LOADER_CODES.SCHEMA_EXISTS,
          schema.$id,
          { existingId: true }
        );
      }

      this.validateSchema(schema);
      this.schemas.set(name, schema);
      const validator = this.ajv.compile(schema);
      this.validators.set(schema.$id ?? name, validator);
      logger.info("Registered schema", { name, schemaId: schema.$id });
    } catch (error) {
      logger.error("Failed to register schema", {
        name,
        schemaId: schema.$id,
        error,
      });
      throw error;
    }
  }

  /**
   * Retrieves a registered schema by name.
   *
   * @param {string} name - The name of the schema to retrieve.
   * @returns {JsonSchema | undefined} - The retrieved schema, or undefined if not found.
   */
  getSchema(name: string): JsonSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * Removes a registered schema by name.
   *
   * @param {string} name - The name of the schema to remove.
   */
  removeSchema(name: string): void {
    this.schemas.delete(name);
    this.validators.delete(name);
    logger.info("Removed schema", { name });
  }

  /**
   * Checks if a schema is registered.
   *
   * @param {string} name - The name of the schema to check.
   * @returns {boolean} - True if the schema is registered, false otherwise.
   */
  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }
}
