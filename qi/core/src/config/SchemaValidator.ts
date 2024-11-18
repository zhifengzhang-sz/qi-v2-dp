/**
 * @fileoverview
 * @module SchemaValidator
 *
 * @description
 * This module defines the SchemaValidator class, which implements the IConfigValidator interface.
 * It provides functionality to validate configuration objects against a provided JSON schema using
 * a schema validator. The class ensures that configurations conform to the defined schema,
 * throwing errors if validation fails.
 *
 * @created 2024-11-16
 * @modified 2024-11-19
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { IConfigValidator, ISchemaValidator } from "./IConfig.js";
import { BaseConfig, JsonSchema } from "./types.js";

/**
 * SchemaValidator class.
 *
 * @class SchemaValidator
 * @implements {IConfigValidator<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Validates configuration objects against a specified JSON schema using a provided schema validator.
 * Ensures that configurations adhere to the defined schema, throwing validation errors when necessary.
 */
export class SchemaValidator<T extends BaseConfig>
  implements IConfigValidator<T>
{
  /**
   * Creates an instance of SchemaValidator.
   *
   * @constructor
   * @param {ISchemaValidator} schemaValidator - The schema validator to use for validation.
   * @param {JsonSchema} schema - The JSON schema to validate configurations against.
   * @description
   * Initializes the SchemaValidator with a schema validator and a specific JSON schema.
   * Validates the provided schema upon instantiation to ensure it is well-formed.
   */
  constructor(
    private readonly schemaValidator: ISchemaValidator,
    private readonly schema: JsonSchema
  ) {
    this.schemaValidator.validateSchema(this.schema);
  }

  /**
   * Validates a configuration object against the provided JSON schema.
   *
   * @param {unknown} config - The configuration object to validate.
   * @throws {ConfigError} - Throws an error if validation fails according to the schema.
   * @description
   * Asserts that the provided configuration object conforms to the defined JSON schema.
   * If validation fails, a ConfigError is thrown with details about the validation failure.
   */
  validate(config: unknown): asserts config is T {
    this.schemaValidator.validate(config, this.schema.$id ?? "default");
  }

  /**
   * Retrieves the JSON schema used for validation.
   *
   * @returns {JsonSchema} - The JSON schema associated with this validator.
   * @description
   * Returns the JSON schema that the validator uses to validate configuration objects.
   */
  getSchema(): JsonSchema {
    return this.schema;
  }
}
