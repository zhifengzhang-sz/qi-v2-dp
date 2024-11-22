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
 * @modified 2024-11-22
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
  PARSE_ERROR: ErrorCode.PARSE_ERROR,
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
