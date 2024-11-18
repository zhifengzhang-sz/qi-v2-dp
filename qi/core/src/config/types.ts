/**
 * @fileoverview
 * @module types
 *
 * @description
 * This module contains type definitions for configuration management.
 * It includes types for JSON Schema validation, configuration change events,
 * environment variable loading options, and base configuration interfaces.
 *
 * @created 2024-11-16
 * @modified 2024-11-19
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
