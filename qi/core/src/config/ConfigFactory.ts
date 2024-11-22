/**
 * @fileoverview
 * @module ConfigFactory
 *
 * @description
 * This module defines the ConfigFactory class, which implements the IConfigFactory interface.
 * It provides methods to create configuration loaders and validators based on specified options
 * and schemas. The factory leverages caching mechanisms to optimize configuration retrieval
 * and ensures that configurations adhere to defined schemas through validation processes.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { CachedConfigLoader } from "./CachedConfigLoader.js";
import {
  IConfigCache,
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
} from "./IConfig.js";
import { JsonLoader } from "./JsonLoader.js";
import { SchemaValidator } from "./SchemaValidator.js";
import { BaseConfig, JsonSchema } from "./types.js";

/**
 * Configuration factory implementation.
 *
 * @class ConfigFactory
 * @implements {IConfigFactory}
 * @description
 * The ConfigFactory class is responsible for creating configuration loaders and validators.
 * It utilizes caching mechanisms to store and retrieve configurations efficiently,
 * and ensures that configurations conform to specified JSON schemas through validation.
 */
export class ConfigFactory implements IConfigFactory {
  /**
   * Creates an instance of ConfigFactory.
   *
   * @constructor
   * @param {ISchema} schema - The schema manager used to handle JSON schemas for validation.
   * @param {IConfigCache<BaseConfig>} [cache] - Optional cache instance to store and retrieve configurations.
   * @description
   * Initializes the ConfigFactory with the provided schema manager and an optional cache.
   * If a cache is provided, it will be used to store loaded configurations for faster retrieval.
   */
  constructor(
    private readonly schema: ISchema,
    private readonly cache?: IConfigCache<BaseConfig>
  ) {}

  /**
   * Creates a configuration loader based on the provided options.
   *
   * @method createLoader
   * @template T - The type of the configuration object, extending BaseConfig.
   * @param {Object} options - Configuration options for creating the loader.
   * @param {string} options.type - The type identifier for the configuration.
   * @param {string} options.version - The version identifier for the configuration.
   * @param {JsonSchema} options.schema - The JSON schema used to validate the configuration.
   * @returns {IConfigLoader<T>} - An instance of IConfigLoader for the specified configuration.
   * @description
   * Creates a new configuration loader based on the provided options. It ensures that the
   * corresponding JSON schema is registered with the schema manager and utilizes the
   * CachedConfigLoader to enable caching of loaded configurations. The loader is configured
   * to load configurations from JSON files following a specific naming convention based on type and version.
   */
  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T> {
    const { type, version, schema } = options;

    // Register schema if not already registered
    if (!this.schema.hasSchema(schema.$id ?? type)) {
      this.schema.registerSchema(type, schema);
    }

    return new CachedConfigLoader(
      new JsonLoader<T>(
        `config/${type}-${version}.json`,
        this.schema,
        schema.$id ?? type
      ),
      this.cache
    );
  }

  /**
   * Creates a configuration validator based on the provided schema.
   *
   * @method createValidator
   * @template T - The type of the configuration object, extending BaseConfig.
   * @param {JsonSchema} schema - The JSON schema used to validate the configuration.
   * @returns {IConfigValidator<T>} - An instance of IConfigValidator for the specified configuration.
   * @description
   * Creates a new configuration validator using the provided JSON schema. The validator
   * ensures that configurations adhere to the defined schema by performing validation checks.
   */
  createValidator<T extends BaseConfig>(
    schema: JsonSchema
  ): IConfigValidator<T> {
    return new SchemaValidator<T>(this.schema, schema);
  }
}
