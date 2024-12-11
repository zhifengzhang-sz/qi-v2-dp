/**
 * @fileoverview Error Codes and Status Codes Enumeration
 * @module @qi/core/errors/ErrorCodes
 *
 * @description
 * Centralized error codes and HTTP status codes for the application.
 * Organized by category with reserved ranges for different types of errors.
 *
 * ErrorCode Ranges:
 * 1000-1999: Generic/Base errors
 * 2000-2999: Configuration errors
 * 3000-3999: Service lifecycle errors
 * 4000-4999: CLI errors
 * 5000-5999: Service configuration errors
 * 6000-6999: Data/Cache errors
 * 7000-7099: General market data errors
 * 7100-7199: Provider-specific errors
 * 7200-7299: Data validation errors
 * 7300-7399: Storage errors
 * 7400-7499: Query errors
 *
 * @author Zhifeng Zhang
 * @created 2024-11-21
 * @modified 2024-12-11
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
  WEBSOCKET_ERROR = 1203,

  // Operation errors
  OPERATION_ERROR = 1300,
  INVALID_OPERATION = 1301,
  OPERATION_TIMEOUT = 1302,

  // Authentication errors
  AUTH_ERROR = 1401, // 401 related errors
  RATE_LIMIT_ERROR = 1429, // 429 related errors
  NETWORK_ERROR = 1500, // Network connectivity issues
  NOT_FOUND_ERROR = 1404, // Resource not found

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

  // === Market Data Errors (7000-7499) ===

  // General market data errors (7000-7099)
  MARKET_DATA_ERROR = 7000,
  INVALID_INTERVAL = 7001,
  INVALID_SYMBOL = 7002,
  INVALID_EXCHANGE = 7003,
  INVALID_TIMERANGE = 7004,

  // Provider-specific errors (7100-7199)
  PROVIDER_ERROR = 7100,
  PROVIDER_NOT_FOUND = 7101,
  PROVIDER_INITIALIZATION_ERROR = 7102,
  API_ERROR = 7103,
  RATE_LIMIT_EXCEEDED = 7104,
  REQUEST_TIMEOUT = 7105,

  // Data validation errors (7200-7299)
  VALIDATION_ERROR = 7200,
  INVALID_OHLCV = 7201,
  MISSING_REQUIRED_FIELD = 7202,
  INVALID_TIMESTAMP = 7203,

  // Storage errors (7300-7399)
  STORAGE_ERROR = 7300,
  STORAGE_WRITE_ERROR = 7301,
  STORAGE_READ_ERROR = 7302,
  STORAGE_CONNECTION_ERROR = 7303,

  // Query errors (7400-7499)
  QUERY_ERROR = 7400,
  INVALID_QUERY_PARAMS = 7401,
  QUERY_TIMEOUT = 7402,
  EXCEEDED_LIMIT = 7403,
}

export enum StatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}
