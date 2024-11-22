/**
 * @fileoverview
 * @module ErrorCodes.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-22
 */

// src/errors/ErrorCodes.ts

/**
 * Centralized Error Codes Enumeration.
 * Each error code is a unique integer.
 */
export enum ErrorCode {
  // Generic Errors
  APPLICATION_ERROR = 1000,
  READ_ERROR = 1001,
  PARSE_ERROR = 1002,
  WATCH_ERROR = 1003,
  OPERATION_ERROR = 1004,
  CONNECTION_ERROR = 1101,
  TIMEOUT_ERROR = 1102,
  CLIENT_ERROR = 1103,
  PING_ERROR = 1104,

  // Configuration Errors
  CONFIGURATION_ERROR = 2000,
  INVALID_SCHEMA = 2001,
  SCHEMA_NOT_FOUND = 2002,
  SCHEMA_VALIDATION_FAILED = 2003,
  ENV_LOAD_ERROR = 2007,
  ENV_MISSING_ERROR = 2008,
  CONFIG_LOAD_ERROR = 2009,
  CONFIG_PARSE_ERROR = 2010,

  // Redis Errors
  REDIS_ERROR = 3000,

  // CLI Configuration Errors
  CLI_INVALID_ARGUMENT = 4000,
  CLI_MISSING_ARGUMENT = 4001,

  // Services Configuration Errors
  SERVICE_CONFIG_INVALID = 5000,
  SERVICE_CONFIG_MISSING = 5001,

  // Cache Errors
  CACHE_ERROR = 6001,

  // Add more categories and error codes as needed
}
