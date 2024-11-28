/**
 * @fileoverview Redis schema validation implementation
 * @module @qi/core/services/redis/config/validator
 *
 * @description
 * Provides schema validation for Redis service configurations using the base configuration module.
 * This implementation delegates actual schema validation to the core config module while
 * handling Redis-specific validation needs and error handling.
 *
 * Key features:
 * - Redis-specific schema registration and validation
 * - Integration with core config validation system
 * - Custom error handling for Redis configuration issues
 * - Type-safe validation assertions
 *
 * @example
 * ```typescript
 * // Create validator
 * const validator = new RedisSchemaValidator();
 *
 * // Validate config
 * const config = {
 *   pools: {
 *     default: { min: 1, max: 10 }
 *   }
 * };
 * validator.validate(config); // throws RedisError if invalid
 *
 * // Access schema
 * const schema = validator.getSchema();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-26
 * @modified 2024-11-28
 */

import { Schema, ISchema, JsonSchema } from "@qi/core/config";
import {
  redisConfigSchema,
  poolConfigSchema,
  retryStrategySchema,
} from "./schema.js";
import { RedisConfig } from "./types.js";
import { RedisError, SchemaValidationError } from "../errors.js";
import { logger } from "@qi/core/logger";

/**
 * Type to ensure schema has required $id property
 * Used internally for schema validation and registration
 *
 * @internal
 */
type SchemaWithId = JsonSchema & { $id: string };

/**
 * Interface for validation error structure from core config module
 *
 * @internal
 */
interface ValidationError {
  path?: string;
  message: string;
  value?: unknown;
}

/**
 * Extended Error interface with validation errors
 *
 * @internal
 */
interface SchemaValidationErrorObject extends Error {
  validationErrors: ValidationError[];
}

/**
 * Validates Redis configurations against a defined JSON schema.
 * Uses the core configuration module's validation system while providing
 * Redis-specific validation handling.
 *
 * @class
 * @description
 * Provides Redis-specific schema validation by leveraging the core configuration
 * validation system. Handles schema registration, validation, and error mapping
 * for Redis configurations.
 */
export class RedisSchemaValidator {
  private readonly schema: ISchema;

  /**
   * Creates a new Redis schema validator
   *
   * @param {ISchema} [schema] - Optional custom schema validator
   * @throws {RedisError} If schema registration fails
   */
  constructor(schema?: ISchema) {
    this.schema = schema || new Schema({ formats: true });
    this.registerSchemas();
  }

  /**
   * Ensures a schema has an $id property
   *
   * @private
   * @param {JsonSchema} schema - Schema to check
   * @param {string} name - Schema name for error messages
   * @returns {SchemaWithId} Schema with verified ID
   * @throws {RedisError} If schema is missing $id
   */
  private ensureSchemaId(schema: JsonSchema, name: string): SchemaWithId {
    if (!schema.$id) {
      throw RedisError.configurationError(
        `Schema ${name} missing $id property`,
        {
          schemaName: name,
        }
      );
    }
    return schema as SchemaWithId;
  }

  /**
   * Registers all Redis schemas with the validator
   * Handles registration of component schemas in correct dependency order
   *
   * @private
   * @throws {RedisError} If schema registration fails
   */
  private registerSchemas(): void {
    try {
      const pool = this.ensureSchemaId(poolConfigSchema, "pool");
      const retry = this.ensureSchemaId(retryStrategySchema, "retry");
      const config = this.ensureSchemaId(redisConfigSchema, "config");

      if (!this.schema.hasSchema(pool.$id)) {
        this.schema.registerSchema(pool.$id, pool);
        logger.debug("Registered Redis pool schema", { schemaId: pool.$id });
      }

      if (!this.schema.hasSchema(retry.$id)) {
        this.schema.registerSchema(retry.$id, retry);
        logger.debug("Registered Redis retry schema", { schemaId: retry.$id });
      }

      if (!this.schema.hasSchema(config.$id)) {
        this.schema.registerSchema(config.$id, config);
        logger.debug("Registered Redis config schema", {
          schemaId: config.$id,
        });
      }
    } catch (error) {
      throw RedisError.configurationError("Failed to register Redis schemas", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Type guard for schema validation errors
   *
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean} True if error contains validation errors
   */
  private isSchemaError(error: Error): error is SchemaValidationErrorObject {
    return (
      "validationErrors" in error &&
      Array.isArray((error as SchemaValidationErrorObject).validationErrors)
    );
  }

  /**
   * Maps core validation errors to Redis validation errors
   *
   * @private
   * @param {ValidationError[]} errors - Core validation errors
   * @returns {SchemaValidationError[]} Redis validation errors
   */
  private mapValidationErrors(
    errors: ValidationError[]
  ): SchemaValidationError[] {
    return errors.map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));
  }

  /**
   * Validates Redis configuration against registered schema
   *
   * @param {unknown} config - Configuration to validate
   * @throws {RedisError} If validation fails
   */
  public validate(config: unknown): asserts config is RedisConfig {
    const schemaId = this.ensureSchemaId(redisConfigSchema, "config").$id;

    try {
      this.schema.validate(config, schemaId);
    } catch (error) {
      if (error instanceof Error && this.isSchemaError(error)) {
        throw RedisError.validationError(
          schemaId,
          this.mapValidationErrors(error.validationErrors)
        );
      }

      throw RedisError.configurationError(
        "Redis configuration validation failed",
        {
          error: error instanceof Error ? error.message : String(error),
          schemaId,
        }
      );
    }
  }

  /**
   * Gets the underlying Redis configuration schema
   *
   * @returns {JsonSchema} JSON Schema used for Redis configuration validation
   */
  public getSchema(): JsonSchema {
    return redisConfigSchema;
  }
}
