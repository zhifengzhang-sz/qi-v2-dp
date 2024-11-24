## The `qi/core/src/config`
  
### `types.ts`
  
```ts
/**
 * @fileoverview
 * @module types
 *
 * @description
 * This module contains type definitions for configuration management.
 * It includes types for JSON Schema validation, configuration change events,
 * environment variable loading options, and base configuration interfaces.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
/**
 * JSON Schema version identifier.
 *
 * @typedef {("2019-09" | "2020-12")} SchemaVersion
 * @description
 * Represents the supported versions of JSON Schema.
 */
export type SchemaVersion = "2019-09" | "2020-12";
  
/**
 * Configuration change event type.
 *
 * @typedef {Object} ConfigChangeEvent
 * @template T
 * @property {T} previous - The previous configuration state.
 * @property {T} current - The current configuration state.
 * @property {number} timestamp - The timestamp of the change event.
 * @property {string} source - The source of the change event.
 * @description
 * Represents an event that occurs when a configuration changes.
 */
export type ConfigChangeEvent<T> = {
  previous: T;
  current: T;
  timestamp: number;
  source: string;
};
  
/**
 * Base interface for all configuration objects.
 *
 * @interface BaseConfig
 * @property {string} type - The type of the configuration.
 * @property {string} version - The version of the configuration.
 * @property {SchemaVersion} [schemaVersion] - The JSON Schema version used for validation.
 * @description
 * Defines the basic structure that all configuration objects must adhere to.
 */
export interface BaseConfig {
  readonly type: string;
  readonly version: string;
  readonly schemaVersion?: SchemaVersion;
}
  
/**
 * Options for environment variable loading.
 *
 * @interface EnvOptions
 * @property {string} [path] - The path to the environment file.
 * @property {boolean} [override] - Whether to override existing environment variables.
 * @property {string[]} [extraFiles] - Additional files to load environment variables from.
 * @property {boolean} [required] - Whether the environment file is required.
 * @property {boolean} [watch] - Whether to watch the environment file for changes.
 * @property {number} [refreshInterval] - The interval (in milliseconds) to refresh the environment variables.
 * @description
 * Defines the options for loading environment variables.
 */
export interface EnvOptions {
  path?: string;
  override?: boolean;
  extraFiles?: string[];
  required?: boolean;
  watch?: boolean;
  refreshInterval?: number;
}
  
/**
 * Defines the validation properties for JSON Schema.
 *
 * @interface JsonSchemaValidation
 * @property {number} [minLength] - The minimum length for a string.
 * @property {number} [maxLength] - The maximum length for a string.
 * @property {string} [pattern] - The regex pattern that a string must match.
 * @property {string} [format] - The format that a string must conform to.
 * @property {number} [minimum] - The minimum value for a number.
 * @property {number} [maximum] - The maximum value for a number.
 * @property {number} [exclusiveMinimum] - The exclusive minimum value for a number.
 * @property {number} [exclusiveMaximum] - The exclusive maximum value for a number.
 * @property {number} [multipleOf] - The number must be a multiple of this value.
 * @property {number} [minItems] - The minimum number of items in an array.
 * @property {number} [maxItems] - The maximum number of items in an array.
 * @property {boolean} [uniqueItems] - Whether the items in an array must be unique.
 * @property {number} [minProperties] - The minimum number of properties in an object.
 * @property {number} [maxProperties] - The maximum number of properties in an object.
 * @description
 * Defines the validation properties for JSON Schema.
 */
export interface JsonSchemaValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
}
  
/**
 * JSON Schema definition.
 *
 * @interface JsonSchema
 * @extends JsonSchemaValidation
 * @property {string} [$id] - The unique identifier for the schema.
 * @property {string} [$schema] - The schema version.
 * @property {string} [$ref] - A reference to another schema.
 * @property {string} [title] - The title of the schema.
 * @property {string} [description] - The description of the schema.
 * @property {(string | string[])} [type] - The type(s) of the schema.
 * @property {unknown[]} [enum] - The allowed values for the schema.
 * @property {unknown} [const] - A constant value for the schema.
 * @property {Record<string, JsonSchema | { type: string }>} [properties] - The properties of the schema.
 * @property {string[]} [required] - The required properties of the schema.
 * @property {(boolean | JsonSchema)} [additionalProperties] - Whether additional properties are allowed.
 * @property {(JsonSchema | JsonSchema[])} [items] - The items of the schema.
 * @property {JsonSchema[]} [anyOf] - The schema must match any of the provided schemas.
 * @property {JsonSchema[]} [allOf] - The schema must match all of the provided schemas.
 * @property {JsonSchema[]} [oneOf] - The schema must match exactly one of the provided schemas.
 * @property {JsonSchema} [not] - The schema must not match the provided schema.
 * @property {JsonSchema} [if] - The schema to validate if the condition is met.
 * @property {JsonSchema} [then] - The schema to validate if the "if" condition is met.
 * @property {JsonSchema} [else] - The schema to validate if the "if" condition is not met.
 * @property {Record<string, JsonSchema>} [definitions] - The definitions for reusable schemas.
 * @property {Record<string, JsonSchema>} [$defs] - The definitions for reusable schemas (alternative).
 * @property {unknown} [default] - The default value for the schema.
 * @description
 * Defines the structure of a JSON Schema, including validation properties and schema definitions.
 */
export interface JsonSchema extends JsonSchemaValidation {
  $id?: string;
  $schema?: string;
  $ref?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, JsonSchema | { type: string }>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  if?: JsonSchema;
  then?: JsonSchema;
  else?: JsonSchema;
  definitions?: Record<string, JsonSchema>;
  $defs?: Record<string, JsonSchema>;
  default?: unknown;
}
  
/**
 * Configuration cache options.
 *
 * @interface CacheOptions
 * @property {number} ttl - Time to live for cached items in milliseconds.
 * @property {boolean} [refreshOnAccess] - Whether to refresh the cached item upon access.
 * @property {(key: string) => void} [onExpire] - Callback function invoked when an item expires.
 * @description
 * Specifies the options for configuring the behavior of the configuration cache,
 * including the duration items are stored, whether to refresh items on access,
 * and handling cache expiration events.
 */
export interface CacheOptions {
  ttl: number;
  refreshOnAccess?: boolean;
  onExpire?: (key: string) => void;
}
  
```  
  
### `IConfig.ts`
  
```ts
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
  
```  
  
### `errors.ts`
  
```ts
/**
 * @fileoverview
 * @module errors
 *
 * @description
 * This module defines configuration-specific error classes and error codes.
 * It extends base error classes to provide a structured error hierarchy
 * for configuration management, including schema validation, environment
 * variable loading, and configuration parsing.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-23
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorCode } from "@qi/core/errors";
import { ErrorObject } from "ajv";
  
export const CONFIG_LOADER_CODES = {
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
} as const;
  
export type ConfigLoaderCode = ErrorCode;
  
export interface SchemaValidationError {
  field?: string;
  message: string;
  value?: unknown;
  path?: string;
}
  
export interface ConfigLoaderErrorDetails extends ErrorDetails {
  source?: string;
  filePath?: string;
  schemaId?: string;
  content?: string;
  parseError?: string;
  watchError?: string;
  errors?: ErrorObject[] | SchemaValidationError[];
  existingSchema?: boolean;
  existingId?: boolean;
}
  
export class ConfigLoaderError extends ApplicationError {
  constructor(
    message: string,
    code: ConfigLoaderCode = ErrorCode.CONFIGURATION_ERROR,
    details?: ConfigLoaderErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "ConfigLoaderError";
  }
  
  static create(
    message: string,
    code: ConfigLoaderCode,
    source: string,
    details?: ConfigLoaderErrorDetails
  ): ConfigLoaderError {
    return new ConfigLoaderError(message, code, { source, ...details });
  }
  
  static schemaError(
    message: string,
    schemaId: string,
    details?: ConfigLoaderErrorDetails
  ): ConfigLoaderError {
    return ConfigLoaderError.create(
      message,
      ErrorCode.INVALID_SCHEMA,
      schemaId,
      details
    );
  }
  
  static validationError(
    message: string,
    schemaId: string,
    errors: ErrorObject[]
  ): ConfigLoaderError {
    return ConfigLoaderError.create(
      message,
      ErrorCode.SCHEMA_VALIDATION_FAILED,
      schemaId,
      { errors }
    );
  }
  
  static fromError(
    error: unknown,
    code: ConfigLoaderCode,
    context: ConfigLoaderErrorDetails
  ): ConfigLoaderError {
    const message = error instanceof Error ? error.message : String(error);
    return new ConfigLoaderError(message, code, context);
  }
}
  
```  
  
### `schema.ts`
  
```ts
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
  
```  
  
### `SchemaValidator.ts`
  
```ts
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
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
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
  
```  
  
### `ConfigCache.ts`
  
```ts
/**
 * @fileoverview
 * @module ConfigCache
 *
 * @description
 * This module implements the ConfigCache class, which provides a cache mechanism
 * for configuration objects. It handles storing, retrieving, and managing the
 * lifecycle of cached configurations, including expiration and optional callbacks
 * upon cache item expiration.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { IConfigCache } from "./IConfig.js";
import { BaseConfig, CacheOptions } from "./types.js";
  
/**
 * Configuration cache implementation.
 *
 * @class ConfigCache
 * @implements {IConfigCache<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides a caching mechanism for configuration objects, allowing storage with
 * time-to-live (TTL) settings, optional refresh-on-access behavior, and expiration
 * callbacks. This implementation ensures efficient retrieval and management of
 * configurations in memory.
 */
export class ConfigCache<T extends BaseConfig> implements IConfigCache<T> {
  /**
   * Internal map to store cached configurations along with their expiration timestamps.
   *
   * @private
   * @type {Map<string, { value: T; expires: number }>}
   */
  private cache: Map<string, { value: T; expires: number }> = new Map();
  
  /**
   * Configuration cache options with all required properties.
   *
   * @private
   * @type {Required<CacheOptions>}
   */
  private options: Required<CacheOptions>;
  
  /**
   * Creates an instance of ConfigCache.
   *
   * @constructor
   * @param {CacheOptions} options - The options to configure the cache behavior.
   * @param {number} options.ttl - Time to live for cached items in milliseconds.
   * @param {boolean} [options.refreshOnAccess=false] - Whether to refresh the cached item upon access.
   * @param {(key: string) => void} [options.onExpire=() => {}] - Callback function invoked when an item expires.
   * @description
   * Initializes the ConfigCache with the provided options, setting default values
   * for optional properties if they are not supplied.
   */
  constructor(options: CacheOptions) {
    this.options = {
      refreshOnAccess: false,
      onExpire: () => {},
      ...options,
    };
  }
  
  /**
   * Determines if a cached item has expired based on the current time.
   *
   * @private
   * @method isExpired
   * @param {number} expires - The expiration timestamp of the cached item.
   * @returns {boolean} - True if the item has expired, false otherwise.
   * @description
   * Compares the current time with the provided expiration timestamp to determine
   * if the cached item should be considered expired.
   */
  private isExpired(expires: number): boolean {
    return Date.now() > expires;
  }
  
  /**
   * Calculates the expiration timestamp for a cached item based on the TTL.
   *
   * @private
   * @method setExpiry
   * @returns {number} - The calculated expiration timestamp in milliseconds.
   * @description
   * Adds the configured TTL to the current time to set the expiration time for a cached item.
   */
  private setExpiry(): number {
    return Date.now() + this.options.ttl;
  }
  
  /**
   * Retrieves a configuration object from the cache by its key.
   *
   * @async
   * @method get
   * @param {string} key - The key associated with the cached configuration.
   * @returns {Promise<T | undefined>} - A promise that resolves to the cached configuration or undefined if not found or expired.
   * @description
   * Attempts to retrieve the configuration from the cache. If the item is expired,
   * it is removed from the cache, and the onExpire callback is invoked. If refreshOnAccess
   * is enabled, the item's expiration timestamp is updated upon access.
   */
  async get(key: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
  
    if (this.isExpired(entry.expires)) {
      this.cache.delete(key);
      this.options.onExpire(key);
      return undefined;
    }
  
    if (this.options.refreshOnAccess) {
      entry.expires = this.setExpiry();
    }
  
    return entry.value;
  }
  
  /**
   * Stores a configuration object in the cache with the specified key.
   *
   * @async
   * @method set
   * @param {string} key - The key to associate with the cached configuration.
   * @param {T} value - The configuration object to cache.
   * @returns {Promise<void>} - A promise that resolves once the configuration is cached.
   * @description
   * Adds the configuration object to the cache with an expiration timestamp based
   * on the configured TTL.
   */
  async set(key: string, value: T): Promise<void> {
    this.cache.set(key, {
      value,
      expires: this.setExpiry(),
    });
  }
  
  /**
   * Checks if a configuration object exists in the cache and is not expired.
   *
   * @async
   * @method has
   * @param {string} key - The key associated with the cached configuration.
   * @returns {Promise<boolean>} - A promise that resolves to true if the configuration exists and is valid, false otherwise.
   * @description
   * Verifies the presence of a valid (non-expired) configuration in the cache.
   * If the item is expired, it is removed, and the onExpire callback is invoked.
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
  
    if (this.isExpired(entry.expires)) {
      this.cache.delete(key);
      this.options.onExpire(key);
      return false;
    }
  
    return true;
  }
  
  /**
   * Removes a configuration object from the cache by its key.
   *
   * @async
   * @method delete
   * @param {string} key - The key associated with the cached configuration to remove.
   * @returns {Promise<boolean>} - A promise that resolves to true if the item was successfully removed, false otherwise.
   * @description
   * Deletes the specified configuration from the cache, if it exists.
   */
  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }
  
  /**
   * Clears all configuration objects from the cache.
   *
   * @async
   * @method clear
   * @returns {Promise<void>} - A promise that resolves once the cache is cleared.
   * @description
   * Removes all entries from the cache, effectively resetting it.
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}
  
```  
  
### `BaseLoader.ts`
  
```ts
/**
 * @fileoverview
 * @module BaseLoader
 *
 * @description
 * This module defines the abstract BaseLoader class, which provides a foundational
 * implementation for configuration loaders. It handles configuration watching and
 * change notifications, ensuring that derived classes implement the specific loading
 * and watcher initialization logic.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { FSWatcher } from "fs";
import { BaseConfig, ConfigChangeEvent } from "./types.js";
import { IConfigLoader } from "./IConfig.js";
  
/**
 * Abstract class representing a base configuration loader.
 *
 * @abstract
 * @class BaseLoader
 * @implements {IConfigLoader<T>}
 * @template T - The type of the configuration object, extending BaseConfig.
 * @description
 * Provides a foundational implementation for configuration loaders, including methods
 * for watching configuration changes and notifying registered callbacks. Derived classes
 * must implement the specific loading logic and watcher initialization.
 */
export abstract class BaseLoader<T extends BaseConfig>
  implements IConfigLoader<T>
{
  /**
   * The file system watcher for monitoring configuration changes.
   *
   * @protected
   * @type {FSWatcher | undefined}
   */
  protected watcher?: FSWatcher;
  
  /**
   * A set of callback functions to be invoked when a configuration change event occurs.
   *
   * @protected
   * @type {Set<(event: ConfigChangeEvent<T>) => void>}
   */
  protected callbacks = new Set<(event: ConfigChangeEvent<T>) => void>();
  
  /**
   * The current configuration object.
   *
   * @protected
   * @type {T | undefined}
   */
  protected currentConfig?: T;
  
  /**
   * Abstract method to load the configuration.
   *
   * @abstract
   * @method load
   * @returns {Promise<T>} - A promise that resolves to the loaded configuration object.
   * @throws {Error} - Throws an error if the configuration fails to load.
   * @description
   * Derived classes must implement this method to define the specific logic
   * for loading the configuration from the desired source (e.g., file, database).
   */
  abstract load(): Promise<T>;
  
  /**
   * Registers a callback to be invoked on configuration changes and initializes the watcher.
   *
   * @method watch
   * @param {(event: ConfigChangeEvent<T>) => void} callback - The callback function to handle configuration change events.
   * @returns {void}
   * @description
   * Adds the provided callback to the set of callbacks and initializes the file system watcher
   * if it hasn't been initialized already. This ensures that any changes to the configuration
   * are detected and the callbacks are notified accordingly.
   */
  watch(callback: (event: ConfigChangeEvent<T>) => void): void {
    this.callbacks.add(callback);
    this.initializeWatcher();
  }
  
  /**
   * Unregisters all callbacks and stops watching for configuration changes.
   *
   * @method unwatch
   * @returns {void}
   * @description
   * Closes the file system watcher if it exists, clears all registered callbacks,
   * and disables further notifications of configuration changes.
   */
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }
  
  /**
   * Abstract method to initialize the file system watcher.
   *
   * @protected
   * @abstract
   * @method initializeWatcher
   * @returns {void}
   * @description
   * Derived classes must implement this method to define how the configuration
   * should be watched for changes (e.g., watching a specific file or directory).
   * This method is responsible for setting up the FSWatcher and handling its events.
   */
  protected abstract initializeWatcher(): void;
  
  /**
   * Notifies all registered callbacks of a configuration change event.
   *
   * @protected
   * @method notifyChange
   * @param {T} previous - The previous state of the configuration.
   * @param {T} current - The current state of the configuration.
   * @param {string} source - The source identifier where the change originated.
   * @returns {void}
   * @description
   * Constructs a configuration change event object and invokes each registered callback
   * with this event. This facilitates reactive updates based on configuration changes.
   */
  protected notifyChange(previous: T, current: T, source: string): void {
    const event: ConfigChangeEvent<T> = {
      previous,
      current,
      timestamp: Date.now(),
      source,
    };
    this.callbacks.forEach((cb) => cb(event));
  }
}
  
```  
  
### `JsonLoader.ts`
  
```ts
/**
 * @fileoverview
 * @module JsonLoader
 *
 * @description
 * This module defines the JsonLoader class, which extends BaseLoader to load configurations
 * from JSON sources. It provides functionality to read, parse, validate, and monitor JSON
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-23
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { watch } from "fs";
import { readFile } from "fs/promises";
import { ISchema } from "./IConfig.js";
import { BaseConfig } from "./types.js";
import { logger } from "@qi/core/logger";
import { CONFIG_LOADER_CODES, ConfigLoaderError } from "./errors.js";
import { BaseLoader } from "./BaseLoader.js";
  
export class JsonLoader<T extends BaseConfig> extends BaseLoader<T> {
  constructor(
    private readonly source: string | Record<string, unknown>,
    private readonly schema: ISchema,
    private readonly schemaId: string
  ) {
    super();
  }
  
  async load(): Promise<T> {
    try {
      const config =
        typeof this.source === "string"
          ? await this.loadFromFile(this.source)
          : this.source;
  
      this.schema.validate(config, this.schemaId);
      this.currentConfig = config as T;
      return this.currentConfig;
    } catch (error) {
      // If it's already a ConfigLoaderError, re-throw it directly
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      // Otherwise, wrap it as a CONFIG_LOAD_ERROR
      throw new ConfigLoaderError(
        error instanceof Error ? error.message : String(error),
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        {
          source: typeof this.source === "string" ? this.source : "object",
          error: String(error),
        }
      );
    }
  }
  
  protected initializeWatcher(): void {
    if (typeof this.source !== "string") return;
  
    if (!this.watcher) {
      this.watcher = watch(this.source, async () => {
        try {
          const previous = this.currentConfig;
          const current = await this.load();
  
          if (previous && current) {
            this.notifyChange(previous, current, this.source as string);
          }
        } catch (error) {
          logger.error("Error during configuration reload", { error });
        }
      });
    }
  }
  
  unwatch(): void {
    this.watcher?.close();
    this.watcher = undefined;
    this.callbacks.clear();
  }
  
  private async loadFromFile(path: string): Promise<unknown> {
    try {
      const content = await readFile(path, "utf-8");
      try {
        return JSON.parse(content);
      } catch (error) {
        // Use CONFIG_PARSE_ERROR (2010) instead of PARSE_ERROR (1002)
        throw new ConfigLoaderError(
          "Invalid JSON syntax",
          CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
          {
            source: path,
            content,
            parseError: String(error),
          }
        );
      }
    } catch (error) {
      if (error instanceof ConfigLoaderError) {
        throw error;
      }
      throw new ConfigLoaderError(
        "Failed to read file",
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        {
          source: path,
          error: String(error),
        }
      );
    }
  }
}
  
```  
  
### `EnvLoader.ts`
  
```ts
/**
 * @fileoverview
 * @module EnvLoader
 *
 * @description
 * This module defines the EnvLoader class, which extends BaseLoader to load configurations
 * from environment files. It provides functionality to read, parse, validate, and monitor environment
 * configuration files for changes, ensuring that configurations adhere to the defined schema.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-16
 * @modified 2024-11-22
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
/// <reference types="node" />
  
import { BaseLoader } from "./BaseLoader.js";
import { loadEnv } from "@qi/core/utils";
import { EnvOptions, BaseConfig } from "./types.js";
import { ISchema } from "./IConfig.js";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "./errors.js";
import type { FSWatcher } from "node:fs";
import { watch } from "node:fs";
  
export class EnvLoader<
  T extends BaseConfig & Record<string, string | undefined>,
> extends BaseLoader<T> {
  private readonly options: EnvOptions;
  private refreshTimer?: NodeJS.Timeout;
  private fileWatchers: FSWatcher[] = [];
  
  constructor(
    private readonly schema: ISchema,
    private readonly schemaId: string,
    options: EnvOptions = {}
  ) {
    super();
    this.options = {
      override: false,
      extraFiles: [],
      required: false,
      watch: false,
      refreshInterval: undefined,
      ...options,
    };
  }
  
  protected initializeWatcher(): void {
    if (!this.options.watch) return;
  
    if (this.options.path) {
      const mainWatcher = watch(this.options.path, async (eventType) => {
        if (eventType === "change") {
          await this.load();
        }
      });
      this.fileWatchers.push(mainWatcher);
  
      this.options.extraFiles?.forEach((file) => {
        const watcher = watch(file, async (eventType) => {
          if (eventType === "change") {
            await this.load();
          }
        });
        this.fileWatchers.push(watcher);
      });
    }
  
    if (this.options.refreshInterval != null) {
      this.refreshTimer = setInterval(
        () => void this.load(),
        this.options.refreshInterval
      );
    }
  }
  
  override unwatch(): void {
    super.unwatch();
  
    // Close all file watchers
    for (const watcher of this.fileWatchers) {
      watcher.close();
    }
    this.fileWatchers = [];
  
    // Clear refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
  
  async load(): Promise<T> {
    try {
      const vars = await this.loadFromEnvFiles();
      this.schema.validate(vars, this.schemaId);
  
      const config = vars as T;
      if (this.currentConfig) {
        this.notifyChange(
          this.currentConfig,
          config,
          this.options.path || "process.env"
        );
      }
      this.currentConfig = config;
  
      return config;
    } catch (error) {
      throw ConfigLoaderError.fromError(
        error,
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        {
          source: this.options.path || "process.env",
        }
      );
    }
  }
  
  private async loadFromEnvFiles(): Promise<
    Record<string, string | undefined>
  > {
    if (!this.options?.path) return process.env;
  
    try {
      const mainEnvVars = await loadEnv(this.options.path, {
        override: this.options?.override ?? false,
      });
  
      if (!mainEnvVars && this.options?.required) {
        throw ConfigLoaderError.create(
          "Required environment file not found",
          CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
          this.options.path
        );
      }
  
      for (const file of this.options?.extraFiles ?? []) {
        const extraVars = await loadEnv(file, {
          override: this.options?.override ?? false,
        });
  
        if (!extraVars && this.options?.required) {
          throw ConfigLoaderError.create(
            "Required extra environment file not found",
            CONFIG_LOADER_CODES.ENV_MISSING_ERROR,
            file
          );
        }
      }
  
      return process.env;
    } catch (error) {
      throw ConfigLoaderError.fromError(
        error,
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        {
          source: this.options?.path,
        }
      );
    }
  }
}
  
```  
  
### `CacheConfigLoader.ts`
  
<pre class="language-text"><code>EntryNotFound (FileSystemError): Error: ENOENT: no such file or directory, open &#39;/home/zzhang/qi/core/src/config/CacheConfigLoader.ts&#39;</code></pre>  
  
### `ConfigFactory.ts`
  
```ts
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
  
```  
  
### `index.ts`
  
```ts
/**
 * @fileoverview Configuration system exports for managing application configurations.
 * Provides comprehensive configuration management including loading, validation,
 * caching, and monitoring capabilities.
 * @module @qi/core/config
 *
 * Key features:
 * - Configuration loading from JSON files and environment variables
 * - JSON Schema validation with custom validators
 * - In-memory caching with TTL support
 * - Real-time configuration change monitoring
 * - Type-safe configuration handling
 *
 * @example
 * ```typescript
 * // Initialize configuration factory
 * const factory = new ConfigFactory(schema, cache);
 *
 * // Create loader with schema validation
 * const loader = factory.createLoader({
 *   type: 'app',
 *   version: '1.0',
 *   schema: appSchema
 * });
 *
 * // Load and validate configuration
 * const config = await loader.load();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-11-23
 */
  
// Configuration factory for creating loaders and validators
export { ConfigFactory } from "./ConfigFactory.js";
  
// Cache implementation for configuration storage
export { ConfigCache } from "./ConfigCache.js";
  
// Configuration loaders for different sources
export { BaseLoader } from "./BaseLoader.js"; // Base loader class
export { JsonLoader } from "./JsonLoader.js"; // JSON file loader
export { EnvLoader } from "./EnvLoader.js"; // Environment variables loader
export { CachedConfigLoader } from "./CachedConfigLoader.js"; // Cached loader wrapper
  
// Schema validation components
export { SchemaValidator } from "./SchemaValidator.js";
export { Schema } from "./schema.js";
  
// Error handling
export { ConfigLoaderError, CONFIG_LOADER_CODES } from "./errors.js";
export type {
  ConfigLoaderErrorDetails,
  SchemaValidationError,
} from "./errors.js";
  
/**
 * Configuration type definitions:
 * - BaseConfig: Base interface for all configuration objects
 * - JsonSchema: JSON Schema type definitions for validation
 * - EnvOptions: Options for environment variable loading
 * - CacheOptions: Configuration cache settings
 */
export { BaseConfig, JsonSchema, EnvOptions, CacheOptions } from "./types.js";
  
/**
 * Core configuration interfaces:
 * - IConfigFactory: Factory for creating configuration loaders/validators
 * - IConfigLoader: Generic configuration loader interface
 * - IConfigValidator: Configuration validation interface
 * - ISchema: Schema management interface
 * - IConfigCache: Configuration caching interface
 * - IConfigHandler: Configuration processing interface
 */
export {
  IConfigFactory,
  IConfigLoader,
  IConfigValidator,
  ISchema,
  IConfigCache,
  IConfigHandler,
} from "./IConfig.js";
  
```  
  