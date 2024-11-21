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
 * @modified 2024-11-21
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { ApplicationError, ErrorDetails } from "@qi/core/errors";
import { ErrorObject } from "ajv";

export const CONFIG_LOADER_CODES = {
  // Schema errors
  INVALID_SCHEMA: "INVALID_SCHEMA",
  SCHEMA_NOT_FOUND: "SCHEMA_NOT_FOUND",
  SCHEMA_EXISTS: "SCHEMA_EXISTS",
  SCHEMA_VALIDATION_FAILED: "SCHEMA_VALIDATION_FAILED",

  // File operations
  READ_ERROR: "READ_ERROR",
  PARSE_ERROR: "PARSE_ERROR",
  WATCH_ERROR: "WATCH_ERROR",

  // Environment
  ENV_LOAD_ERROR: "ENV_LOAD_ERROR",
  ENV_MISSING_ERROR: "ENV_MISSING_ERROR",

  // General
  CONFIG_LOAD_ERROR: "CONFIG_LOAD_ERROR",
  CONFIG_PARSE_ERROR: "CONFIG_PARSE_ERROR",
} as const;

export type ConfigLoaderCode =
  (typeof CONFIG_LOADER_CODES)[keyof typeof CONFIG_LOADER_CODES];

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
    code: ConfigLoaderCode,
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
      CONFIG_LOADER_CODES.INVALID_SCHEMA,
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
      CONFIG_LOADER_CODES.SCHEMA_VALIDATION_FAILED,
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
