## The Structures

```
services/config module:
qi/core/src/services/config/
├── errors.ts           # Service-specific error handling
├── types.ts           # Core type definitions
├── schema.ts          # JSON schema definitions
├── dsl.ts            # Domain-specific language interfaces
├── handlers.ts        # Service handlers implementation
├── loader.ts         # Configuration loading logic
└── index.ts          # Module exports and documentation

Tests:
qi/core/test/unit/services/config
├── errors.test.ts
├── handlers.test.ts
├── loader.test.ts
└── integration.test.ts
```

---

## The `qi/core/src/services/config` module

### `qi/core/src/services/config/errors.ts`
```typescript
/**
 * @fileoverview Service Configuration Error Handling
 * @module @qi/core/services/config/errors
 * 
 * @description
 * Defines service configuration specific error types and error handling utilities.
 * Extends the base application error system with service-specific error details
 * and helper methods for common error scenarios.
 *
 * @see {@link @qi/core/errors}
 * 
 * @example
 * ```typescript
 * throw ServiceConfigError.invalid("Invalid database configuration", {
 *   service: "postgres",
 *   validation: { missing: ["host", "port"] }
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { ApplicationError, ErrorCode, ErrorDetails } from "@qi/core/errors";

/**
 * Extended error details specific to service configuration errors.
 * 
 * @interface ServiceConfigErrorDetails
 * @extends ErrorDetails
 */
export interface ServiceConfigErrorDetails extends ErrorDetails {
  /** The service identifier where the error occurred */
  service?: string;
  /** The configuration file path */
  configPath?: string;
  /** The environment file path */
  envPath?: string;
  /** Validation details or error context */
  validation?: unknown;
}

/**
 * Service configuration specific error class.
 * Provides context-aware error creation for service configuration issues.
 * 
 * @class ServiceConfigError
 * @extends ApplicationError
 */
export class ServiceConfigError extends ApplicationError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SERVICE_CONFIG_INVALID,
    details?: ServiceConfigErrorDetails
  ) {
    super(message, code, 500, details);
    this.name = "ServiceConfigError";
  }

  /**
   * Creates an error for invalid configuration scenarios
   * 
   * @static
   * @param {string} message - Error message
   * @param {ServiceConfigErrorDetails} [details] - Additional error context
   * @returns {ServiceConfigError} Configuration validation error
   */
  static invalid(message: string, details?: ServiceConfigErrorDetails): ServiceConfigError {
    return new ServiceConfigError(message, ErrorCode.SERVICE_CONFIG_INVALID, details);
  }

  /**
   * Creates an error for missing configuration scenarios
   * 
   * @static
   * @param {string} message - Error message
   * @param {ServiceConfigErrorDetails} [details] - Additional error context
   * @returns {ServiceConfigError} Configuration missing error
   */
  static missing(message: string, details?: ServiceConfigErrorDetails): ServiceConfigError {
    return new ServiceConfigError(message, ErrorCode.SERVICE_CONFIG_MISSING, details);
  }
}
```

### `qi/core/src/services/config/types.ts`
```typescript
/**
 * @fileoverview Service Configuration Types
 * @module @qi/core/services/config/types
 * 
 * @description
 * Core type definitions for service configuration objects and schemas.
 * These types define the structure of configuration data for various services
 * including databases, message queues, monitoring tools, and networking.
 * 
 * @example
 * ```typescript
 * const config: ServiceConfig = {
 *   type: "services",
 *   version: "1.0",
 *   databases: {
 *     postgres: { host: "localhost", port: 5432 }
 *   }
 * };
 * ```
 */

import { BaseConfig } from "@qi/core/config";

/**
 * Environment configuration with base properties
 * 
 * @interface EnvConfigWithBase
 */
export interface EnvConfigWithBase extends Record<string, string | undefined> {
  /** Configuration type identifier */
  type: string;
  /** Configuration version */
  version: string;
  /** PostgreSQL password */
  POSTGRES_PASSWORD: string;
  /** PostgreSQL username */
  POSTGRES_USER: string;
  /** PostgreSQL database name */
  POSTGRES_DB: string;
  /** Redis password */
  REDIS_PASSWORD: string;
  /** Grafana admin password */
  GF_SECURITY_ADMIN_PASSWORD: string;
  /** Grafana plugins to install */
  GF_INSTALL_PLUGINS?: string;
  /** pgAdmin email */
  PGADMIN_DEFAULT_EMAIL: string;
  /** pgAdmin password */
  PGADMIN_DEFAULT_PASSWORD: string;
  /** QuestDB telemetry setting */
  QDB_TELEMETRY_ENABLED?: string;
  /** Redpanda broker ID */
  REDPANDA_BROKER_ID?: string;
  /** Redpanda Kafka API host */
  REDPANDA_ADVERTISED_KAFKA_API?: string;
  /** Redpanda Schema Registry API host */
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API?: string;
  /** Redpanda proxy API host */
  REDPANDA_ADVERTISED_PANDAPROXY_API?: string;
}

/**
 * Complete service configuration interface
 * 
 * @interface ServiceConfig
 * @extends {BaseConfig}
 */
export interface ServiceConfig extends BaseConfig {
  /** Service configuration type identifier */
  type: "services";
  /** Configuration version */
  version: string;
  /** Database service configurations */
  databases: {
    /** PostgreSQL configuration */
    postgres: {
      host: string;
      port: number;
      database: string;
      user: string;
      maxConnections: number;
    };
    /** QuestDB configuration */
    questdb: {
      host: string;
      httpPort: number;
      pgPort: number;
      influxPort: number;
    };
    /** Redis configuration */
    redis: {
      host: string;
      port: number;
      maxRetries: number;
    };
  };
  /** Message queue service configuration */
  messageQueue: {
    /** Redpanda configuration */
    redpanda: {
      kafkaPort: number;
      schemaRegistryPort: number;
      adminPort: number;
      pandaproxyPort: number;
    };
  };
  /** Monitoring service configuration */
  monitoring: {
    /** Grafana configuration */
    grafana: {
      host: string;
      port: number;
    };
    /** pgAdmin configuration */
    pgAdmin: {
      host: string;
      port: number;
    };
  };
  /** Network configuration */
  networking: {
    networks: {
      /** Database network name */
      db: string;
      /** Redis network name */
      redis: string;
      /** Redpanda network name */
      redpanda: string;
    };
  };
}
```

### `qi/core/src/services/config/schema.ts`

```typescript
/**
 * @fileoverview Service Configuration Schema Definitions
 * @module @qi/core/services/config/schema
 *
 * @description
 * Defines JSON Schema validations for service configurations and environment variables.
 * These schemas ensure configuration correctness and type safety at runtime.
 *
 * Features:
 * - Service configuration validation
 * - Environment variable validation
 * - Strict type checking
 * - Required field enforcement
 * - Value constraints
 *
 * @example Schema Usage
 * ```typescript
 * import { Schema } from '@qi/core/config';
 * import { serviceConfigSchema } from './schema';
 *
 * const schema = new Schema({ formats: true });
 * schema.registerSchema('service-config', serviceConfigSchema);
 * schema.validate(config, 'service-config');
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Database configuration schema definitions
 *
 * @const {JsonSchema}
 */
const databaseSchemas = {
  postgres: {
    type: "object",
    required: ["host", "port", "database", "user", "maxConnections"],
    properties: {
      host: { 
        type: "string",
        minLength: 1,
        description: "PostgreSQL server hostname or IP address"
      },
      port: {
        type: "number",
        minimum: 1,
        maximum: 65535,
        description: "PostgreSQL server port number"
      },
      database: {
        type: "string",
        minLength: 1,
        description: "Database name to connect to"
      },
      user: {
        type: "string",
        minLength: 1,
        description: "Database user for authentication"
      },
      maxConnections: {
        type: "number",
        minimum: 1,
        description: "Maximum number of connections in the pool"
      }
    },
    additionalProperties: false
  },

  questdb: {
    type: "object",
    required: ["host", "httpPort", "pgPort", "influxPort"],
    properties: {
      host: {
        type: "string",
        minLength: 1,
        description: "QuestDB server hostname or IP address"
      },
      httpPort: {
        type: "number",
        minimum: 1,
        maximum: 65535,
        description: "QuestDB HTTP API port"
      },
      pgPort: {
        type: "number",
        minimum: 1,
        maximum: 65535,
        description: "QuestDB PostgreSQL wire protocol port"
      },
      influxPort: {
        type: "number",
        minimum: 1,
        maximum: 65535,
        description: "QuestDB InfluxDB line protocol port"
      }
    },
    additionalProperties: false
  },

  redis: {
    type: "object",
    required: ["host", "port", "maxRetries"],
    properties: {
      host: {
        type: "string",
        minLength: 1,
        description: "Redis server hostname or IP address"
      },
      port: {
        type: "number",
        minimum: 1,
        maximum: 65535,
        description: "Redis server port number"
      },
      maxRetries: {
        type: "number",
        minimum: 0,
        description: "Maximum number of connection retry attempts"
      }
    },
    additionalProperties: false
  }
};

/**
 * Message queue configuration schema definitions
 *
 * @const {JsonSchema}
 */
const messageQueueSchema = {
  type: "object",
  required: ["redpanda"],
  properties: {
    redpanda: {
      type: "object",
      required: [
        "kafkaPort",
        "schemaRegistryPort",
        "adminPort",
        "pandaproxyPort"
      ],
      properties: {
        kafkaPort: {
          type: "number",
          minimum: 1,
          maximum: 65535,
          description: "Redpanda Kafka API port"
        },
        schemaRegistryPort: {
          type: "number",
          minimum: 1,
          maximum: 65535,
          description: "Schema Registry HTTP port"
        },
        adminPort: {
          type: "number",
          minimum: 1,
          maximum: 65535,
          description: "Redpanda Admin API port"
        },
        pandaproxyPort: {
          type: "number",
          minimum: 1,
          maximum: 65535,
          description: "Pandaproxy REST API port"
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

/**
 * Monitoring services configuration schema definitions
 *
 * @const {JsonSchema}
 */
const monitoringSchema = {
  type: "object",
  required: ["grafana", "pgAdmin"],
  properties: {
    grafana: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: {
          type: "string",
          minLength: 1,
          description: "Grafana server hostname or IP address"
        },
        port: {
          type: "number",
          minimum: 1,
          maximum: 65535,
          description: "Grafana HTTP port"
        }
      },
      additionalProperties: false
    },
    pgAdmin: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: {
          type: "string",
          minLength: 1,
          description: "pgAdmin server hostname or IP address"
        },
        port: {
          type: "number",
          minimum: 1,
          maximum: 65535,
          description: "pgAdmin HTTP port"
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

/**
 * Network configuration schema definition
 *
 * @const {JsonSchema}
 */
const networkingSchema = {
  type: "object",
  required: ["networks"],
  properties: {
    networks: {
      type: "object",
      required: ["db", "redis", "redpanda"],
      properties: {
        db: {
          type: "string",
          minLength: 1,
          description: "Database network name"
        },
        redis: {
          type: "string",
          minLength: 1,
          description: "Redis network name"
        },
        redpanda: {
          type: "string",
          minLength: 1,
          description: "Redpanda network name"
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

/**
 * Complete service configuration schema
 *
 * @const {JsonSchema}
 * @description
 * Defines the complete schema for validating service configurations.
 * Includes validation for all service types: databases, message queues,
 * monitoring tools, and networking.
 */
export const serviceConfigSchema: JsonSchema = {
  $id: "service-config",
  type: "object",
  required: [
    "type",
    "version",
    "databases",
    "messageQueue",
    "monitoring",
    "networking"
  ],
  properties: {
    type: { 
      type: "string",
      const: "services",
      description: "Configuration type identifier"
    },
    version: { 
      type: "string",
      pattern: "^\\d+\\.\\d+$",
      description: "Configuration version in semver format"
    },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: databaseSchemas,
      additionalProperties: false
    },
    messageQueue: messageQueueSchema,
    monitoring: monitoringSchema,
    networking: networkingSchema
  },
  additionalProperties: false
};

/**
 * Environment configuration schema
 *
 * @const {JsonSchema}
 * @description
 * Defines the schema for validating environment variables.
 * Includes required credentials and optional configuration settings.
 */
export const envConfigSchema: JsonSchema = {
  $id: "env-config",
  type: "object",
  required: [
    "type",
    "version",
    "POSTGRES_PASSWORD",
    "POSTGRES_USER",
    "POSTGRES_DB",
    "REDIS_PASSWORD",
    "GF_SECURITY_ADMIN_PASSWORD",
    "PGADMIN_DEFAULT_EMAIL",
    "PGADMIN_DEFAULT_PASSWORD"
  ],
  properties: {
    type: { 
      type: "string",
      const: "env",
      description: "Environment configuration type identifier"
    },
    version: { 
      type: "string",
      description: "Environment configuration version"
    },
    // Database credentials
    POSTGRES_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL password"
    },
    POSTGRES_USER: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL username"
    },
    POSTGRES_DB: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL database name"
    },
    // Redis credentials
    REDIS_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Redis password"
    },
    // Grafana configuration
    GF_SECURITY_ADMIN_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Grafana admin password"
    },
    GF_INSTALL_PLUGINS: {
      type: "string",
      description: "Semicolon-separated list of Grafana plugins to install"
    },
    // pgAdmin credentials
    PGADMIN_DEFAULT_EMAIL: {
      type: "string",
      format: "email",
      description: "pgAdmin admin email"
    },
    PGADMIN_DEFAULT_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "pgAdmin admin password"
    },
    // QuestDB configuration
    QDB_TELEMETRY_ENABLED: {
      type: "string",
      enum: ["true", "false"],
      description: "QuestDB telemetry setting"
    },
    // Redpanda configuration
    REDPANDA_BROKER_ID: {
      type: "string",
      pattern: "^\\d+$",
      description: "Redpanda broker ID"
    },
    REDPANDA_ADVERTISED_KAFKA_API: {
      type: "string",
      description: "Redpanda Kafka API advertised host"
    },
    REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: {
      type: "string",
      description: "Redpanda Schema Registry API advertised host"
    },
    REDPANDA_ADVERTISED_PANDAPROXY_API: {
      type: "string",
      description: "Redpanda proxy API advertised host"
    }
  },
  additionalProperties: true
};
```

### `qi/core/src/services/config/dsl.ts`

```typescript
/**
 * @fileoverview Service Configuration Domain-Specific Language (DSL)
 * @module @qi/core/services/config/dsl
 * 
 * @description
 * Defines the domain-specific interfaces for service configuration management.
 * This DSL provides a type-safe, intuitive API for accessing service configurations
 * including databases, message queues, monitoring tools, and network settings.
 * 
 * The interfaces are designed to:
 * - Provide clear, semantic access to configuration values
 * - Hide implementation details of configuration storage
 * - Ensure type safety through TypeScript interfaces
 * - Standardize configuration access patterns across applications
 * 
 * @example
 * ```typescript
 * // Example usage of the DSL
 * const services = await loadConfig();
 * 
 * // Get database connection strings
 * const pgConn = services.postgres.getConnectionString();
 * const redisConn = services.redis.getConnectionString();
 * 
 * // Access monitoring endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * const grafanaPlugins = services.monitoring.grafana.getPlugins();
 * ```
 */

/**
 * Base interface for database connections.
 * Provides common methods for accessing database connection details.
 * 
 * @interface DatabaseConnection
 */
export interface DatabaseConnection {
  /**
   * Get the hostname or IP address of the database server
   * @returns {string} The database host
   */
  getHost(): string;

  /**
   * Get the port number the database is listening on
   * @returns {number} The database port
   */
  getPort(): number;

  /**
   * Get the name of the database if applicable
   * @returns {string | undefined} The database name or undefined if not applicable
   */
  getDatabaseName(): string | undefined;

  /**
   * Get the credentials for database authentication
   * @returns {Object | undefined} The credentials object or undefined if not available
   */
  getCredentials(): { username: string; password: string } | undefined;

  /**
   * Get the maximum number of connections if applicable
   * @returns {number | undefined} The max connections or undefined if not applicable
   */
  getMaxConnections(): number | undefined;

  /**
   * Get the complete connection string for the database
   * @returns {string} A properly formatted connection string
   */
  getConnectionString(): string;
}

/**
 * Redis-specific database connection interface.
 * Extends DatabaseConnection with Redis-specific functionality.
 * 
 * @interface RedisConnection
 * @extends {DatabaseConnection}
 */
export interface RedisConnection extends DatabaseConnection {
  /**
   * Get the maximum number of connection retries
   * @returns {number} The maximum number of retries
   */
  getMaxRetries(): number;
}

/**
 * PostgreSQL-specific database connection interface.
 * Extends DatabaseConnection with PostgreSQL-specific functionality.
 * 
 * @interface PostgresConnection
 * @extends {DatabaseConnection}
 */
export interface PostgresConnection extends DatabaseConnection {
  /**
   * Get the connection pool configuration
   * @returns {Object} The pool configuration object
   * @property {number} max - Maximum number of clients in the pool
   * @property {number} idleTimeoutMillis - How long a client can stay idle
   */
  getConnectionPoolConfig(): {
    max: number;
    idleTimeoutMillis: number;
  };
}

/**
 * QuestDB-specific database connection interface.
 * Extends DatabaseConnection with QuestDB-specific functionality.
 * 
 * @interface QuestDBConnection
 * @extends {DatabaseConnection}
 */
export interface QuestDBConnection extends DatabaseConnection {
  /**
   * Get the HTTP API endpoint
   * @returns {string} The complete HTTP endpoint URL
   */
  getHttpEndpoint(): string;

  /**
   * Get the PostgreSQL wire protocol endpoint
   * @returns {string} The PostgreSQL endpoint
   */
  getPgEndpoint(): string;

  /**
   * Get the InfluxDB line protocol endpoint
   * @returns {string} The InfluxDB endpoint URL
   */
  getInfluxEndpoint(): string;

  /**
   * Check if telemetry is enabled
   * @returns {boolean} Whether telemetry is enabled
   */
  isTelemetryEnabled(): boolean;
}

/**
 * Message queue connection interface for Redpanda/Kafka services.
 * 
 * @interface MessageQueueConnection
 */
export interface MessageQueueConnection {
  /**
   * Get the Kafka-compatible broker endpoint
   * @returns {string} The broker endpoint
   */
  getBrokerEndpoint(): string;

  /**
   * Get the Schema Registry HTTP endpoint
   * @returns {string} The complete Schema Registry URL
   */
  getSchemaRegistryEndpoint(): string;

  /**
   * Get the admin API endpoint
   * @returns {string} The complete admin API URL
   */
  getAdminEndpoint(): string;

  /**
   * Get the Pandaproxy REST endpoint
   * @returns {string} The complete proxy URL
   */
  getProxyEndpoint(): string;

  /**
   * Get the broker ID if configured
   * @returns {number | undefined} The broker ID or undefined if not set
   */
  getBrokerId(): number | undefined;
}

/**
 * Base interface for monitoring service endpoints.
 * 
 * @interface MonitoringEndpoint
 */
export interface MonitoringEndpoint {
  /**
   * Get the complete endpoint URL
   * @returns {string} The service endpoint URL
   */
  getEndpoint(): string;

  /**
   * Get the service credentials
   * @returns {Object} The credentials object
   */
  getCredentials(): { username?: string; password: string };
}

/**
 * Network configuration interface for managing service networks.
 * 
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  /**
   * Get the network name for a specific service
   * @param {('db' | 'redis' | 'redpanda')} service - The service identifier
   * @returns {string} The network name
   */
  getNetworkName(service: 'db' | 'redis' | 'redpanda'): string;

  /**
   * Get all network configurations
   * @returns {Record<string, string>} Map of service to network name
   */
  getAllNetworks(): Record<string, string>;
}

/**
 * Complete service connections interface combining all service types.
 * This is the main interface that applications will interact with.
 * 
 * @interface ServiceConnections
 */
export interface ServiceConnections {
  /** PostgreSQL database connection */
  postgres: PostgresConnection;
  /** QuestDB time-series database connection */
  questdb: QuestDBConnection;
  /** Redis cache connection */
  redis: RedisConnection;
  /** Message queue connection (Redpanda/Kafka) */
  messageQueue: MessageQueueConnection;
  /** Monitoring service endpoints */
  monitoring: {
    /** Grafana monitoring interface */
    grafana: MonitoringEndpoint & {
      /** Get installed Grafana plugins
       * @returns {string[]} List of plugin identifiers
       */
      getPlugins(): string[];
    };
    /** pgAdmin database management interface */
    pgAdmin: MonitoringEndpoint;
  };
  /** Network configuration */
  networking: NetworkConfig;
}
```

### `qi/core/src/services/config/handlers.ts`

```typescript
/**
 * @fileoverview Service Configuration Handlers
 * @module @qi/core/services/config/handlers
 *
 * @description
 * Implements the domain-specific handlers for service configurations. These handlers
 * provide a type-safe interface for accessing and managing service configurations,
 * including connection strings, credentials, and service-specific settings.
 *
 * Features:
 * - Type-safe configuration access
 * - Connection string generation
 * - Credential management
 * - Connection validation
 * - Retry mechanisms
 * - Development mode debugging
 *
 * @example Basic Usage
 * ```typescript
 * const handler = new PostgresConnectionHandler(config, credentials);
 * const connString = handler.getConnectionString();
 * await handler.testConnection();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { logger } from "@qi/core/logger";
import { retryOperation, formatJsonWithColor } from "@qi/core/utils";
import { ServiceConfigError } from "./errors";
import type { ServiceConfig, EnvConfigWithBase } from "./types";
import type { 
  ServiceConnections,
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  NetworkConfig
} from "./dsl";

/**
 * Base handler providing common functionality for service handlers.
 * 
 * @abstract
 * @class BaseServiceHandler
 */
export abstract class BaseServiceHandler {
  /**
   * Execute an operation with retry logic
   * 
   * @protected
   * @template T Result type
   * @param {() => Promise<T>} operation Operation to execute
   * @param {string} service Service identifier for logging
   * @param {number} [retries=3] Maximum retry attempts
   * @returns {Promise<T>} Operation result
   * 
   * @throws {ServiceConfigError} When all retries fail
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    service: string,
    retries = 3
  ): Promise<T> {
    return retryOperation(
      operation,
      {
        retries,
        minTimeout: 1000,
        onRetry: (attempt) => {
          logger.warn(`Retrying ${service} connection`, { attempt });
        },
      }
    );
  }

  /**
   * Log service configuration in development mode
   * 
   * @protected
   * @param {string} service Service identifier
   * @param {unknown} config Configuration object to log
   */
  protected logConfiguration(service: string, config: unknown): void {
    if (process.env.NODE_ENV === "development") {
      logger.debug(`${service} configuration:`, {
        config: formatJsonWithColor(config),
      });
    }
  }

  /**
   * Validate service connection configuration
   * 
   * @protected
   * @param {string} service Service identifier
   * @param {boolean} isValid Validation result
   * @param {unknown} [details] Additional validation details
   * @throws {ServiceConfigError} When validation fails
   */
  protected validateConnection(service: string, isValid: boolean, details?: unknown): void {
    if (!isValid) {
      throw ServiceConfigError.invalid(`Invalid ${service} configuration`, {
        service,
        validation: details,
      });
    }
  }
}

/**
 * PostgreSQL connection handler implementation
 * 
 * @class PostgresConnectionHandler
 * @extends {BaseServiceHandler}
 * @implements {PostgresConnection}
 */
export class PostgresConnectionHandler extends BaseServiceHandler implements PostgresConnection {
  /**
   * Creates a new PostgreSQL connection handler
   * 
   * @constructor
   * @param {ServiceConfig["databases"]["postgres"]} config PostgreSQL configuration
   * @param {{ username: string; password: string }} [credentials] Optional credentials
   * @throws {ServiceConfigError} When configuration is invalid
   */
  constructor(
    private readonly config: ServiceConfig["databases"]["postgres"],
    private readonly credentials?: { username: string; password: string }
  ) {
    super();
    this.logConfiguration("PostgreSQL", { ...config, credentials });
    this.validateConnection("PostgreSQL", 
      Boolean(config.host && config.port && config.database),
      config
    );
  }

  // ... implement all interface methods with detailed JSDoc
}

// ... similar implementations for other handlers

/**
 * Main service configuration handler that composes all service handlers
 * 
 * @class ServiceConfigHandler
 * @implements {IConfigHandler<ServiceConfig, ServiceConnections>}
 */
export class ServiceConfigHandler implements IConfigHandler<ServiceConfig, ServiceConnections> {
  /**
   * Creates service connections from configuration and environment
   * 
   * @method handle
   * @param {ServiceConfig} config Raw service configuration
   * @param {EnvConfigWithBase} [env] Optional environment configuration
   * @returns {ServiceConnections} Composed service connections
   * @throws {ServiceConfigError} When handler creation fails
   */
  handle(config: ServiceConfig, env?: EnvConfigWithBase): ServiceConnections {
    try {
      return {
        postgres: new PostgresConnectionHandler(
          config.databases.postgres,
          env && {
            username: env.POSTGRES_USER,
            password: env.POSTGRES_PASSWORD
          }
        ),
        // ... create other handlers
      };
    } catch (error) {
      throw error instanceof ServiceConfigError 
        ? error 
        : ServiceConfigError.invalid(
            "Failed to create service handlers",
            { error: String(error) }
          );
    }
  }
}
```

### `qi/core/src/services/config/loader.ts`

```typescript
/**
 * @fileoverview Service Configuration Loader
 * @module @qi/core/services/config/loader
 *
 * @description
 * Provides functionality for loading and validating service configurations.
 * Handles both JSON configuration files and environment variables, ensuring
 * type safety and validation throughout the loading process.
 *
 * Features:
 * - JSON configuration loading
 * - Environment variable handling
 * - Schema validation
 * - Type safety
 * - Error handling
 * - Development mode logging
 *
 * @example Basic Usage
 * ```typescript
 * const { loadConfig } = await createServiceConfigLoader();
 * const services = await loadConfig();
 * ```
 *
 * @example Custom Paths
 * ```typescript
 * const { loadConfig } = await createServiceConfigLoader(
 *   './custom/services.json',
 *   './custom/services.env'
 * );
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { deepMerge, loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";
import { Schema, ConfigFactory } from "@qi/core/config";
import { ServiceConfigError } from "./errors";
import { serviceConfigSchema } from "./schema";
import type { ServiceConfig, ServiceConnections } from "./types";

/**
 * Creates and configures a service configuration loader
 * 
 * @async
 * @function createServiceConfigLoader
 * @param {string} [configPath="./config/services.json"] Path to JSON config
 * @param {string} [envPath="./config/services.env"] Path to env file
 * @returns {Promise<{
 *   schema: Schema,
 *   configFactory: ConfigFactory,
 *   loader: IConfigLoader<ServiceConfig>,
 *   handler: ServiceConfigHandler,
 *   loadConfig(): Promise<ServiceConnections>
 * }>} Configured loader and utilities
 * 
 * @throws {ServiceConfigError} When initialization fails
 */
export async function createServiceConfigLoader(
  configPath: string = "./config/services.json",
  envPath: string = "./config/services.env"
) {
  try {
    // Initialize schema and factory
    const schema = new Schema({ formats: true });
    const configFactory = new ConfigFactory(schema);
    const handler = new ServiceConfigHandler();

    // Load and validate environment
    const env = await loadEnv(envPath, { override: true });
    if (!env) {
      throw ServiceConfigError.missing("Environment configuration not found", { 
        envPath 
      });
    }

    logger.info("Loaded service environment configuration", { 
      path: envPath,
      variables: Object.keys(env).length 
    });

    // Register schemas if needed
    if (!schema.hasSchema("env-config")) {
      schema.registerSchema("env-config", envConfigSchema);
    }

    // Create and configure loader
    const loader = configFactory.createLoader<ServiceConfig>({
      type: "service",
      version: "1.0",
      schema: serviceConfigSchema,
    });

    // Configure loader source
    const jsonLoader = loader as unknown as { source: string };
    jsonLoader.source = configPath;

    return {
      schema,
      configFactory,
      loader,
      handler,
      /**
       * Loads and validates service configuration
       * 
       * @async
       * @method loadConfig
       * @returns {Promise<ServiceConnections>} Service connections
       * @throws {ServiceConfigError} When loading or validation fails
       */
      async loadConfig(): Promise<ServiceConnections> {
        try {
          const config = await loader.load();
          
          logger.info("Loaded service configuration", { 
            path: configPath,
            services: Object.keys(config.databases).length 
          });

          return handler.handle(config, env);
        } catch (error) {
          throw ServiceConfigError.invalid(
            "Failed to load service configuration",
            { 
              configPath,
              error: error instanceof Error ? error.message : String(error)
            }
          );
        }
      }
    };
  } catch (error) {
    const details = {
      configPath,
      envPath,
      error: error instanceof Error ? error.message : String(error)
    };
    logger.error("Service configuration initialization failed", details);
    throw error instanceof ServiceConfigError 
      ? error 
      : new ServiceConfigError(
          "Failed to initialize service configuration", 
          ErrorCode.SERVICE_CONFIG_INVALID, 
          details
        );
  }
}
```

### `qi/core/src/services/config/index.ts`
```typescript
/**
 * @fileoverview Service Configuration Module
 * @module @qi/core/services/config
 * 
 * @description
 * Central module for managing service configurations in a distributed system.
 * Provides type-safe configuration loading, validation, and access through a DSL.
 * 
 * Features:
 * - Type-safe configuration handling
 * - Environment variable integration
 * - Schema validation
 * - Connection testing
 * - Retry mechanisms
 * - Comprehensive error handling
 * 
 * @example Basic Usage
 * ```typescript
 * const { loadConfig } = await createServiceConfigLoader();
 * const services = await loadConfig();
 * 
 * // Type-safe access to configurations
 * const pgConnString = services.postgres.getConnectionString();
 * const redisRetries = services.redis.getMaxRetries();
 * ```
 * 
 * @example Custom Configuration Paths
 * ```typescript
 * const { loadConfig } = await createServiceConfigLoader(
 *   "./custom/services.json",
 *   "./custom/services.env"
 * );
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   const services = await loadConfig();
 * } catch (error) {
 *   if (error instanceof ServiceConfigError) {
 *     logger.error("Configuration error", error.details);
 *   }
 * }
 * ```
 */

export { ServiceConfigError } from './errors.js';
export { serviceConfigSchema } from './schema.js';
export { createServiceConfigLoader } from './loader.js';
export { ServiceConfigHandler } from './handlers.js';
export type { 
  ServiceConfig,
  EnvConfigWithBase,
  ServiceConnections,
  DatabaseConnection,
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  NetworkConfig
} from './types.js';
```

---

## Unit tests

### `qi/core/tests/unit/services/config/errors.test.ts`

```typescript
/**
 * @fileoverview Service Configuration Error Tests
 * 
 * Tests error handling, error types, and error details for service configuration.
 */

import { describe, it, expect } from 'vitest';
import { ErrorCode } from '@qi/core/errors';
import { ServiceConfigError } from '@qi/core/services/config';

describe('ServiceConfigError', () => {
  it('should create an invalid configuration error', () => {
    const error = ServiceConfigError.invalid('Invalid postgres config', {
      service: 'postgres',
      validation: { missing: ['host'] }
    });

    expect(error).toBeInstanceOf(ServiceConfigError);
    expect(error.code).toBe(ErrorCode.SERVICE_CONFIG_INVALID);
    expect(error.details).toEqual({
      service: 'postgres',
      validation: { missing: ['host'] }
    });
  });

  it('should create a missing configuration error', () => {
    const error = ServiceConfigError.missing('Config file not found', {
      configPath: './config/services.json'
    });

    expect(error).toBeInstanceOf(ServiceConfigError);
    expect(error.code).toBe(ErrorCode.SERVICE_CONFIG_MISSING);
    expect(error.details).toEqual({
      configPath: './config/services.json'
    });
  });

  it('should include status code and name', () => {
    const error = new ServiceConfigError('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('ServiceConfigError');
  });
});
```

### `qi/core/tests/unit/services/config/handlers.test.ts`

```typescript
/**
 * @fileoverview Service Configuration Handlers Tests
 * 
 * Tests the configuration handlers for different services including
 * connection string generation, validation, and error cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  ServiceConfigHandler,
  ServiceConfigError 
} from '@qi/core/services/config';
import { logger } from '@qi/core/logger';

// Mock logger
vi.mock('@qi/core/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}));

describe('PostgresConnectionHandler', () => {
  const validConfig = {
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    user: 'testuser',
    maxConnections: 100
  };

  const credentials = {
    username: 'admin',
    password: 'secret'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate valid connection string', () => {
    const handler = new PostgresConnectionHandler(validConfig, credentials);
    const connString = handler.getConnectionString();
    
    expect(connString).toBe(
      'postgresql://admin:secret@localhost:5432/testdb'
    );
  });

  it('should throw on invalid configuration', () => {
    const invalidConfig = { ...validConfig, host: '' };
    
    expect(() => new PostgresConnectionHandler(invalidConfig, credentials))
      .toThrow(ServiceConfigError);
  });

  it('should log configuration in development', () => {
    process.env.NODE_ENV = 'development';
    new PostgresConnectionHandler(validConfig, credentials);

    expect(logger.debug).toHaveBeenCalledWith(
      'PostgreSQL configuration:',
      expect.any(Object)
    );
  });

  it('should not log configuration in production', () => {
    process.env.NODE_ENV = 'production';
    new PostgresConnectionHandler(validConfig, credentials);

    expect(logger.debug).not.toHaveBeenCalled();
  });
});
```

### `qi/core/tests/unit/services/config/loader.test.ts`

```typescript
/**
 * @fileoverview Service Configuration Loader Tests
 * 
 * Tests configuration loading, environment handling, and validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServiceConfigLoader } from '@qi/core/services/config';
import { loadEnv } from '@qi/core/utils';
import { logger } from '@qi/core/logger';
import fs from 'node:fs/promises';

// Mock dependencies
vi.mock('@qi/core/utils', () => ({
  loadEnv: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn()
  }
}));

describe('createServiceConfigLoader', () => {
  const mockConfig = {
    type: 'services',
    version: '1.0',
    databases: {
      postgres: {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        maxConnections: 100
      },
      // ... other required config
    }
  };

  const mockEnv = {
    POSTGRES_PASSWORD: 'testpass',
    POSTGRES_USER: 'testuser',
    POSTGRES_DB: 'testdb',
    // ... other required env vars
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadEnv).mockResolvedValue(mockEnv);
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockConfig));
  });

  it('should load valid configuration', async () => {
    const { loadConfig } = await createServiceConfigLoader();
    const services = await loadConfig();

    expect(services.postgres.getConnectionString()).toContain('localhost:5432');
    expect(loadEnv).toHaveBeenCalled();
  });

  it('should throw when env file is missing', async () => {
    vi.mocked(loadEnv).mockResolvedValue(null);

    await expect(createServiceConfigLoader()).rejects
      .toThrow(/Environment configuration not found/);
  });

  it('should throw on invalid configuration', async () => {
    const invalidConfig = { ...mockConfig, type: 'invalid' };
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

    const { loadConfig } = await createServiceConfigLoader();
    await expect(loadConfig()).rejects.toThrow();
  });
});
```

### `qi/core/tests/unit/services/config/integration.test.ts`

```typescript
/**
 * @fileoverview Service Configuration Integration Tests
 * 
 * Tests the complete configuration flow from loading to using services.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServiceConfigLoader } from '@qi/core/services/config';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Service Configuration Integration', () => {
  const testDir = join(process.cwd(), 'test-config');
  const configPath = join(testDir, 'service-1.0.json');
  const envPath = join(testDir, 'services.env');

  beforeAll(async () => {
    await mkdir(testDir, { recursive: true });

    // Create test configuration files
    await writeFile(configPath, JSON.stringify({
      type: 'services',
      version: '1.0',
      databases: {
        postgres: {
          host: 'testhost',
          port: 5432,
          database: 'testdb',
          user: 'testuser',
          maxConnections: 100
        },
        // ... other required config
      }
    }));

    await writeFile(envPath, 
      'POSTGRES_PASSWORD=testpass\n' +
      'POSTGRES_USER=testuser\n' +
      'POSTGRES_DB=testdb\n' +
      // ... other required env vars
    );
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load and validate complete configuration', async () => {
    const { loadConfig } = await createServiceConfigLoader(configPath, envPath);
    const services = await loadConfig();

    // Test database configurations
    expect(services.postgres.getHost()).toBe('testhost');
    expect(services.postgres.getConnectionString()).toContain('testpass');

    // Test monitoring endpoints
    const grafanaEndpoint = services.monitoring.grafana.getEndpoint();
    expect(grafanaEndpoint).toMatch(/^http:\/\//);

    // Test network configuration
    const networks = services.networking.getAllNetworks();
    expect(networks).toHaveProperty('db');
  });
});
```

---

Key aspects of these tests:

1. Using Vitest's features:
   - Proper use of `describe`, `it`, `expect`
   - Mocking with `vi`
   - Lifecycle hooks (`beforeEach`, `beforeAll`, etc.)
   - Async test handling

2. Test organization:
   - Unit tests for each major component
   - Integration tests for end-to-end flows
   - Clear test descriptions
   - Logical grouping of related tests

3. Mock strategies:
   - File system operations
   - Environment variables
   - Logging
   - External dependencies

4. Test coverage:
   - Happy paths
   - Error cases
   - Environment-specific behavior
   - Validation logic
   - Configuration parsing
   - Connection string generation

5. Best practices:
   - Cleanup after tests
   - Isolation between tests
   - Clear assertions
   - Meaningful test data
   - Proper error checking

Further tests:
1. Add more specific test cases?
2. Add test configuration files?
3. Expand the integration tests?
4. Add performance tests?