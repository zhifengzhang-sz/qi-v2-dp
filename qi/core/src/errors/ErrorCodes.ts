/**
 * @fileoverview Error Codes Enumeration
 * @module @qi/core/errors/ErrorCodes
 *
 * @description
 * Centralized error codes for the application. Organized by category with
 * reserved ranges for different types of errors.
 *
 * Ranges:
 * 1000-1999: Generic/Base errors
 * 2000-2999: Configuration errors
 * 3000-3999: Service lifecycle errors
 * 4000-4999: CLI errors
 * 5000-5999: Service configuration errors
 * 6000-6999: Data/Cache errors
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-12-01
 */

export enum ErrorCode {
  // === Generic Errors (1000-1999) ===
  // Base errors
  APPLICATION_ERROR = 1000,
  INITIALIZATION_ERROR = 1001,
  NOT_INITIALIZED = 1002,

  // IO errors
  READ_ERROR = 1100,
  WRITE_ERROR = 1101,
  PARSE_ERROR = 1102,
  WATCH_ERROR = 1103,

  // Connection errors
  CONNECTION_ERROR = 1200,
  TIMEOUT_ERROR = 1201,
  PING_ERROR = 1202,

  // Operation errors
  OPERATION_ERROR = 1300,
  INVALID_OPERATION = 1301,
  OPERATION_TIMEOUT = 1302,

  // === Configuration Errors (2000-2999) ===
  // Basic config errors
  CONFIGURATION_ERROR = 2000,
  CONFIG_NOT_FOUND = 2001,
  CONFIG_LOAD_ERROR = 2002,
  CONFIG_PARSE_ERROR = 2003,

  // Schema errors
  SCHEMA_ERROR = 2100,
  INVALID_SCHEMA = 2101,
  SCHEMA_NOT_FOUND = 2102,
  SCHEMA_VALIDATION_FAILED = 2103,

  // Environment errors
  ENV_ERROR = 2200,
  ENV_LOAD_ERROR = 2201,
  ENV_MISSING_ERROR = 2202,
  ENV_VALIDATION_ERROR = 2203,

  // === Service Lifecycle Errors (3000-3999) ===
  // Service management
  SERVICE_ERROR = 3000,
  SERVICE_INITIALIZATION_ERROR = 3001,
  SERVICE_NOT_INITIALIZED = 3002,
  SERVICE_ALREADY_INITIALIZED = 3003,
  SERVICE_SHUTDOWN_ERROR = 3004,

  // Redis lifecycle
  REDIS_ERROR = 3100,
  REDIS_CONNECTION_ERROR = 3101,
  REDIS_OPERATION_ERROR = 3102,

  // Future service lifecycle (reserve ranges)
  POSTGRES_ERROR = 3200,
  QUESTDB_ERROR = 3300,
  MESSAGE_QUEUE_ERROR = 3400,

  // === CLI Errors (4000-4999) ===
  CLI_ERROR = 4000,
  CLI_INVALID_ARGUMENT = 4001,
  CLI_MISSING_ARGUMENT = 4002,

  // === Service Configuration Errors (5000-5999) ===
  // General service config
  SERVICE_CONFIG_ERROR = 5000,
  SERVICE_CONFIG_INVALID = 5001,
  SERVICE_CONFIG_MISSING = 5002,

  // Database config
  DB_CONFIG_ERROR = 5100,
  POSTGRES_CONFIG_INVALID = 5101,
  QUESTDB_CONFIG_INVALID = 5102,
  REDIS_CONFIG_INVALID = 5103,

  // Message queue config
  QUEUE_CONFIG_ERROR = 5200,
  REDPANDA_CONFIG_INVALID = 5201,

  // Monitoring config
  MONITORING_CONFIG_ERROR = 5300,
  GRAFANA_CONFIG_INVALID = 5301,
  PGADMIN_CONFIG_INVALID = 5302,

  // Network config
  NETWORK_CONFIG_ERROR = 5400,
  NETWORK_CONFIG_INVALID = 5401,

  // === Data/Cache Errors (6000-6999) ===
  DATA_ERROR = 6000,
  CACHE_ERROR = 6001,
  CACHE_MISS = 6002,
  CACHE_INVALIDATION_ERROR = 6003,
}
