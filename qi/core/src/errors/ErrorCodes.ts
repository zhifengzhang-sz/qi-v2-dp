/**
 * @fileoverview
 * @module ErrorCodes.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

// src/errors/ErrorCodes.ts

/**
 * Centralized Error Codes Enumeration.
 * Each error code is a unique integer.
 */
export enum ErrorCode {
  // Generic Errors
  APPLICATION_ERROR = 1000,
  CACHE_ERROR = 1001,

  // Configuration Errors
  CONFIGURATION_ERROR = 2000,
  INVALID_SCHEMA = 2001,
  SCHEMA_NOT_FOUND = 2002,
  SCHEMA_VALIDATION_FAILED = 2003,
  READ_ERROR = 2004,
  PARSE_ERROR = 2005,
  WATCH_ERROR = 2006,
  ENV_LOAD_ERROR = 2007,
  ENV_MISSING_ERROR = 2008,
  CONFIG_LOAD_ERROR = 2009,
  CONFIG_PARSE_ERROR = 2010,

  // Redis Errors
  REDIS_ERROR = 3000,
  CONNECTION_ERROR = 3001,
  TIMEOUT_ERROR = 3002,
  OPERATION_ERROR = 3003,
  CLIENT_ERROR = 3004,
  PING_ERROR = 3005,

  // CLI Configuration Errors
  CLI_INVALID_ARGUMENT = 4000,
  CLI_MISSING_ARGUMENT = 4001,

  // Services Configuration Errors
  SERVICE_CONFIG_INVALID = 5000,
  SERVICE_CONFIG_MISSING = 5001,

  // Add more categories and error codes as needed
}
