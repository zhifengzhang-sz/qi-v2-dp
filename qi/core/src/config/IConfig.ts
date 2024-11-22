/**
 * @fileoverview
 * @module IConfig
 *
 * @description
 * This module defines interfaces for configuration management, including
 * configuration loaders, validators, handlers, schema management, and caching.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { BaseConfig, ConfigChangeEvent, JsonSchema } from "./types.js";

/**
 * Configuration factory interface
 */
export interface IConfigFactory {
  /**
   * Create a new configuration loader
   */
  createLoader<T extends BaseConfig>(options: {
    type: string;
    version: string;
    schema: JsonSchema;
  }): IConfigLoader<T>;

  /**
   * Create a new configuration validator
   */
  createValidator<T extends BaseConfig>(
    schema: JsonSchema
  ): IConfigValidator<T>;
}

/**
 * Configuration handler interface.
 *
 * @interface IConfigHandler
 * @template T - The type of the configuration object.
 * @template R - The type of the result returned by the handler.
 * @description
 * Defines a handler for processing configuration objects.
 */
export interface IConfigHandler<T, R> {
  /**
   * Handle the configuration object.
   *
   * @param {T} config - The configuration object to handle.
   * @returns {R | Promise<R>} - The result of handling the configuration.
   */
  handle(config: T): R | Promise<R>;
}

/**
 * Enhanced configuration loader interface.
 *
 * @interface IConfigLoader
 * @template T - The type of the configuration object.
 * @description
 * Defines a loader for loading and watching configuration objects.
 */
export interface IConfigLoader<T extends BaseConfig> {
  /**
   * Load the configuration object.
   *
   * @returns {Promise<T>} - A promise that resolves to the loaded configuration object.
   */
  load(): Promise<T>;

  /**
   * Watch for configuration changes.
   *
   * @param {function(ConfigChangeEvent<T>): void} callback - The callback to invoke on configuration changes.
   */
  watch?(callback: (event: ConfigChangeEvent<T>) => void): void;

  /**
   * Stop watching for configuration changes.
   */
  unwatch?(): void;
}

/**
 * Configuration validator interface.
 *
 * @interface IConfigValidator
 * @template T - The type of the configuration object.
 * @description
 * Defines a validator for validating configuration objects.
 */
export interface IConfigValidator<T extends BaseConfig> {
  /**
   * Validate the configuration object.
   *
   * @param {unknown} config - The configuration object to validate.
   * @throws {Error} - Throws an error if the configuration is invalid.
   */
  validate(config: unknown): asserts config is T;

  /**
   * Get the validation schema.
   *
   * @returns {JsonSchema} - The JSON Schema used for validation.
   */
  getSchema(): JsonSchema;
}

/**
 * Schema validator interface.
 *
 * @interface ISchemaValidator
 * @description
 * Defines a validator for validating JSON Schemas.
 */
export interface ISchemaValidator {
  /**
   * Validate a configuration object against a schema.
   *
   * @param {unknown} config - The configuration object to validate.
   * @param {string} schemaId - The identifier of the schema to validate against.
   * @throws {Error} - Throws an error if the configuration is invalid.
   */
  validate(config: unknown, schemaId: string): void;

  /**
   * Validate a JSON Schema.
   *
   * @param {JsonSchema} schema - The JSON Schema to validate.
   * @throws {Error} - Throws an error if the schema is invalid.
   */
  validateSchema(schema: JsonSchema): void;
}

/**
 * Enhanced schema management interface.
 *
 * @interface ISchema
 * @extends ISchemaValidator
 * @description
 * Defines methods for managing JSON Schemas.
 */
export interface ISchema extends ISchemaValidator {
  /**
   * Get a registered schema by name.
   *
   * @param {string} name - The name of the schema to retrieve.
   * @returns {JsonSchema | undefined} - The retrieved schema, or undefined if not found.
   */
  getSchema(name: string): JsonSchema | undefined;

  /**
   * Register a new schema.
   *
   * @param {string} name - The name of the schema to register.
   * @param {JsonSchema} schema - The schema to register.
   */
  registerSchema(name: string, schema: JsonSchema): void;

  /**
   * Remove a registered schema by name.
   *
   * @param {string} name - The name of the schema to remove.
   */
  removeSchema(name: string): void;

  /**
   * Check if a schema is registered.
   *
   * @param {string} name - The name of the schema to check.
   * @returns {boolean} - True if the schema is registered, false otherwise.
   */
  hasSchema(name: string): boolean;
}

/**
 * Configuration cache interface.
 *
 * @interface IConfigCache
 * @template T - The type of the configuration object.
 * @description
 * Defines methods for caching configuration objects.
 */
export interface IConfigCache<T extends BaseConfig> {
  /**
   * Get a cached configuration object by key.
   *
   * @param {string} key - The key of the cached configuration object.
   * @returns {Promise<T | undefined>} - A promise that resolves to the cached configuration object, or undefined if not found.
   */
  get(key: string): Promise<T | undefined>;

  /**
   * Set a configuration object in the cache.
   *
   * @param {string} key - The key of the configuration object.
   * @param {T} value - The configuration object to cache.
   * @returns {Promise<void>} - A promise that resolves when the configuration object is cached.
   */
  set(key: string, value: T): Promise<void>;

  /**
   * Check if a configuration object is cached.
   *
   * @param {string} key - The key of the configuration object.
   * @returns {Promise<boolean>} - A promise that resolves to true if the configuration object is cached, false otherwise.
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete a cached configuration object by key.
   *
   * @param {string} key - The key of the cached configuration object.
   * @returns {Promise<boolean>} - A promise that resolves to true if the configuration object was deleted, false otherwise.
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cached configuration objects.
   *
   * @returns {Promise<void>} - A promise that resolves when all cached configuration objects are cleared.
   */
  clear(): Promise<void>;
}
