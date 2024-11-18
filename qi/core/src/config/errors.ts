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
 * @created 2024-11-16
 * @modified 2024-11-19
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { ValidationError } from "@qi/core/errors";

/**
 * Configuration error codes.
 *
 * @constant
 * @type {Object<string, string>}
 * @property {string} INVALID_SCHEMA - Indicates an invalid JSON schema.
 * @property {string} SCHEMA_NOT_FOUND - Indicates that the specified schema was not found.
 * @property {string} VALIDATION_FAILED - Indicates that validation against the schema failed.
 * @property {string} ENV_LOAD_ERROR - Indicates an error occurred while loading environment variables.
 * @property {string} ENV_MISSING_ERROR - Indicates that a required environment variable is missing.
 * @property {string} CONFIG_LOAD_ERROR - Indicates an error occurred while loading the configuration.
 * @property {string} CONFIG_PARSE_ERROR - Indicates an error occurred while parsing the configuration.
 */
export const CONFIG_ERROR_CODES = {
  INVALID_SCHEMA: "INVALID_SCHEMA",
  SCHEMA_NOT_FOUND: "SCHEMA_NOT_FOUND",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  ENV_LOAD_ERROR: "ENV_LOAD_ERROR",
  ENV_MISSING_ERROR: "ENV_MISSING_ERROR",
  CONFIG_LOAD_ERROR: "CONFIG_LOAD_ERROR",
  CONFIG_PARSE_ERROR: "CONFIG_PARSE_ERROR",
} as const;

/**
 * Type representing all possible configuration error codes.
 *
 * @typedef {(typeof CONFIG_ERROR_CODES)[keyof typeof CONFIG_ERROR_CODES]} ConfigErrorCode
 */
export type ConfigErrorCode =
  (typeof CONFIG_ERROR_CODES)[keyof typeof CONFIG_ERROR_CODES];

/**
 * Configuration-specific error class.
 * Extends ValidationError to maintain error hierarchy.
 *
 * @class ConfigError
 * @extends {ValidationError}
 * @description
 * Represents errors specific to configuration management, providing additional
 * context and structured error codes for better error handling and debugging.
 */
export class ConfigError extends ValidationError {
  /**
   * Creates an instance of ConfigError.
   *
   * @constructor
   * @param {string} message - The error message.
   * @param {ConfigErrorCode} code - The specific configuration error code.
   * @param {Record<string, unknown>} context - Additional context related to the error.
   */
  constructor(
    message: string,
    code: ConfigErrorCode,
    context: Record<string, unknown>
  ) {
    super(message, {
      constraint: code,
      ...context,
    });
    this.name = "ConfigError";
  }

  /**
   * Creates a ConfigError instance from an existing error.
   *
   * @static
   * @param {unknown} error - The original error object.
   * @param {ConfigErrorCode} code - The specific configuration error code.
   * @param {Record<string, unknown>} context - Additional context related to the error.
   * @returns {ConfigError} - A new ConfigError instance.
   */
  static fromError(
    error: unknown,
    code: ConfigErrorCode,
    context: Record<string, unknown>
  ): ConfigError {
    const message = error instanceof Error ? error.message : String(error);
    return new ConfigError(message, code, context);
  }

  /**
   * Helper method to create schema-related errors.
   *
   * @static
   * @param {string} message - The error message.
   * @param {string} schemaId - The identifier of the schema related to the error.
   * @param {Record<string, unknown>} [details] - Additional details about the error.
   * @returns {ConfigError} - A new ConfigError instance for schema errors.
   */
  static schemaError(
    message: string,
    schemaId: string,
    details?: Record<string, unknown>
  ): ConfigError {
    return new ConfigError(message, CONFIG_ERROR_CODES.INVALID_SCHEMA, {
      key: schemaId,
      ...details,
    });
  }

  /**
   * Helper method to create validation errors.
   *
   * @static
   * @param {string} message - The error message.
   * @param {string} schemaId - The identifier of the schema that failed validation.
   * @param {Record<string, unknown>} [details] - Additional details about the error.
   * @returns {ConfigError} - A new ConfigError instance for validation errors.
   */
  static validationError(
    message: string,
    schemaId: string,
    details?: Record<string, unknown>
  ): ConfigError {
    return new ConfigError(message, CONFIG_ERROR_CODES.VALIDATION_FAILED, {
      key: schemaId,
      ...details,
    });
  }

  /**
   * Helper method to create environment variable loading errors.
   *
   * @static
   * @param {string} message - The error message.
   * @param {string} path - The path to the environment file.
   * @param {Record<string, unknown>} [details] - Additional details about the error.
   * @returns {ConfigError} - A new ConfigError instance for environment loading errors.
   */
  static envError(
    message: string,
    path: string,
    details?: Record<string, unknown>
  ): ConfigError {
    return new ConfigError(message, CONFIG_ERROR_CODES.ENV_LOAD_ERROR, {
      key: path,
      ...details,
    });
  }

  /**
   * Helper method to create configuration loading errors.
   *
   * @static
   * @param {string} message - The error message.
   * @param {string} configPath - The path to the configuration file.
   * @param {Record<string, unknown>} [details] - Additional details about the error.
   * @returns {ConfigError} - A new ConfigError instance for configuration loading errors.
   */
  static loadError(
    message: string,
    configPath: string,
    details?: Record<string, unknown>
  ): ConfigError {
    return new ConfigError(message, CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR, {
      key: configPath,
      ...details,
    });
  }

  /**
   * Helper method to create configuration parsing errors.
   *
   * @static
   * @param {string} message - The error message.
   * @param {string} configPath - The path to the configuration file.
   * @param {Record<string, unknown>} [details] - Additional details about the error.
   * @returns {ConfigError} - A new ConfigError instance for configuration parsing errors.
   */
  static parseError(
    message: string,
    configPath: string,
    details?: Record<string, unknown>
  ): ConfigError {
    return new ConfigError(message, CONFIG_ERROR_CODES.CONFIG_PARSE_ERROR, {
      key: configPath,
      ...details,
    });
  }
}
