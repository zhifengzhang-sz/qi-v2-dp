### `qi/core/src/services/config/types.ts`

````typescript
/**
 * @fileoverview Service Configuration Types
 * @module @qi/core/services/config/types
 *
 * @description
 * Core type definitions for service configuration objects and schemas.
 * These types define the structure of configuration data for various services
 * including databases, message queues, monitoring tools, and networking.
 *
 * This module:
 * - Extends BaseConfig from core
 * - Defines service-specific configuration interfaces
 * - Defines environment variable interface
 * - Ensures type safety for configuration objects
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
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { BaseConfig } from "@qi/core/config";

/**
 * Service configuration interface matching services-1.0.json schema
 *
 * @interface ServiceConfig
 * @extends {BaseConfig}
 */
export interface ServiceConfig extends BaseConfig {
  type: "services";
  version: string;
  databases: {
    postgres: {
      host: string;
      port: number;
      database: string;
      user: string;
      maxConnections: number;
    };
    questdb: {
      host: string;
      httpPort: number;
      pgPort: number;
      influxPort: number;
    };
    redis: {
      host: string;
      port: number;
      maxRetries: number;
    };
  };
  messageQueue: {
    redpanda: {
      kafkaPort: number;
      schemaRegistryPort: number;
      adminPort: number;
      pandaproxyPort: number;
    };
  };
  monitoring: {
    grafana: {
      host: string;
      port: number;
    };
    pgAdmin: {
      host: string;
      port: number;
    };
  };
  networking: {
    networks: {
      db: string;
      redis: string;
      redpanda: string;
    };
  };
}

/**
 * Environment configuration interface matching services.env
 *
 * @interface EnvConfig
 */
export interface EnvConfig extends Record<string, string | undefined> {
  // Database credentials
  POSTGRES_PASSWORD: string;
  POSTGRES_USER: string;
  POSTGRES_DB: string;

  // Redis configuration
  REDIS_PASSWORD: string;

  // Monitoring credentials
  GF_SECURITY_ADMIN_PASSWORD: string;
  GF_INSTALL_PLUGINS?: string;
  PGADMIN_DEFAULT_EMAIL: string;
  PGADMIN_DEFAULT_PASSWORD: string;

  // QuestDB configuration
  QDB_TELEMETRY_ENABLED?: string;

  // Redpanda configuration
  REDPANDA_BROKER_ID?: string;
  REDPANDA_ADVERTISED_KAFKA_API?: string;
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API?: string;
  REDPANDA_ADVERTISED_PANDAPROXY_API?: string;
}

/**
 * Service configuration result interface
 *
 * @interface LoadConfigResult
 */
export interface LoadConfigResult {
  config: ServiceConfig;
  env: EnvConfig;
}
````

Improvements:

1. Simplified to pure type definitions without any logic
2. Direct mapping to actual config files (services-1.0.json and services.env)
3. Removed redundant interfaces and types
4. Clear separation between service config and env config
5. Added LoadConfigResult interface to make config loading results explicit
6. Strong typing for all configuration objects

---

### `qi/core/src/services/config/dsl.ts`

````typescript
/**
 * @fileoverview Service Configuration Domain-Specific Language (DSL)
 * @module @qi/core/services/config/dsl
 *
 * @description
 * Defines the domain-specific interfaces for service configuration management.
 * These interfaces provide a type-safe and intuitive API for accessing service
 * configurations including databases, message queues, monitoring tools, and
 * network settings.
 *
 * Key features:
 * - Type-safe service access
 * - Clear interface definitions
 * - Connection string generation
 * - Endpoint URL construction
 *
 * @example
 * ```typescript
 * // Type-safe service access
 * const postgres = services.databases.postgres;
 * const connString = postgres.getConnectionString();
 *
 * // Generate service endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

/**
 * Base interface for database connections
 *
 * @interface DatabaseConnection
 */
export interface DatabaseConnection {
  getHost(): string;
  getPort(): number;
}

/**
 * PostgreSQL database connection interface
 *
 * @interface PostgresConnection
 * @extends {DatabaseConnection}
 */
export interface PostgresConnection extends DatabaseConnection {
  getConnectionString(): string;
  getMaxConnections(): number;
}

/**
 * QuestDB time-series database connection interface
 *
 * @interface QuestDBConnection
 * @extends {DatabaseConnection}
 */
export interface QuestDBConnection extends DatabaseConnection {
  getHttpEndpoint(): string;
  getPgEndpoint(): string;
  getInfluxEndpoint(): string;
}

/**
 * Redis cache connection interface
 *
 * @interface RedisConnection
 * @extends {DatabaseConnection}
 */
export interface RedisConnection extends DatabaseConnection {
  getConnectionString(): string;
  getMaxRetries(): number;
}

/**
 * Message queue connection interface
 *
 * @interface MessageQueueConnection
 */
export interface MessageQueueConnection {
  getBrokerEndpoint(): string;
  getSchemaRegistryEndpoint(): string;
  getAdminEndpoint(): string;
  getProxyEndpoint(): string;
  getBrokerId(): number | undefined;
}

/**
 * Monitoring service endpoint interface
 *
 * @interface MonitoringEndpoint
 */
export interface MonitoringEndpoint {
  getEndpoint(): string;
  getCredentials(): { username?: string; password: string };
}

/**
 * Grafana monitoring interface extending base monitoring
 *
 * @interface GrafanaEndpoint
 * @extends {MonitoringEndpoint}
 */
export interface GrafanaEndpoint extends MonitoringEndpoint {
  getPlugins(): string[];
}

/**
 * Network configuration interface
 *
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  getNetworkName(service: "db" | "redis" | "redpanda"): string;
  getAllNetworks(): Record<string, string>;
}

/**
 * Complete service connections interface
 *
 * @interface ServiceConnections
 */
export interface ServiceConnections {
  databases: {
    postgres: PostgresConnection;
    questdb: QuestDBConnection;
    redis: RedisConnection;
  };
  messageQueue: MessageQueueConnection;
  monitoring: {
    grafana: GrafanaEndpoint;
    pgAdmin: MonitoringEndpoint;
  };
  networking: NetworkConfig;
}
````

Improvements:

1. Focused purely on interface definitions without implementations
2. Simplified interface hierarchy
3. Clear separation between different service types
4. Removed base classes in favor of interfaces
5. Added GrafanaEndpoint interface for Grafana-specific functionality
6. Better organized network configuration interface

---

### `qi/core/src/services/config/schema.ts`

````typescript
/**
 * @fileoverview Service Configuration Schema
 * @module @qi/core/services/config/schema
 *
 * @description
 * Defines JSON Schema validation for services configuration.
 * Provides strict validation for configuration structure and values.
 *
 * Improvements:
 * - Single source of schema definitions
 * - Reusable schema components
 * - Strict port number validation
 * - Required field enforcement
 * - Clear field descriptions
 * - Format validations
 *
 * @example
 * ```typescript
 * import { Schema } from '@qi/core/config';
 * import { serviceConfigSchema } from './schema';
 *
 * const schema = new Schema({ formats: true });
 * schema.registerSchema('service-config', serviceConfigSchema);
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Port number validation schema
 * Reusable component for validating TCP/UDP ports
 */
const portSchema: JsonSchema = {
  type: "number",
  minimum: 1,
  maximum: 65535,
  description: "Valid TCP/UDP port number",
};

/**
 * Host validation schema
 * Reusable component for validating hostnames
 */
const hostSchema: JsonSchema = {
  type: "string",
  minLength: 1,
  description: "Hostname or IP address",
};

/**
 * Database schemas collection
 */
const databaseSchemas: Record<string, JsonSchema> = {
  postgres: {
    type: "object",
    required: ["host", "port", "database", "user", "maxConnections"],
    properties: {
      host: hostSchema,
      port: portSchema,
      database: {
        type: "string",
        minLength: 1,
        description: "Database name",
      },
      user: {
        type: "string",
        minLength: 1,
        description: "Database user",
      },
      maxConnections: {
        type: "number",
        minimum: 1,
        description: "Maximum number of connections",
      },
    },
    additionalProperties: false,
  },

  questdb: {
    type: "object",
    required: ["host", "httpPort", "pgPort", "influxPort"],
    properties: {
      host: hostSchema,
      httpPort: {
        ...portSchema,
        description: "HTTP API port",
      },
      pgPort: {
        ...portSchema,
        description: "PostgreSQL wire protocol port",
      },
      influxPort: {
        ...portSchema,
        description: "InfluxDB line protocol port",
      },
    },
    additionalProperties: false,
  },

  redis: {
    type: "object",
    required: ["host", "port", "maxRetries"],
    properties: {
      host: hostSchema,
      port: portSchema,
      maxRetries: {
        type: "number",
        minimum: 0,
        description: "Maximum number of connection retries",
      },
    },
    additionalProperties: false,
  },
};

/**
 * Message queue schema
 */
const messageQueueSchema: JsonSchema = {
  type: "object",
  required: ["redpanda"],
  properties: {
    redpanda: {
      type: "object",
      required: [
        "kafkaPort",
        "schemaRegistryPort",
        "adminPort",
        "pandaproxyPort",
      ],
      properties: {
        kafkaPort: {
          ...portSchema,
          description: "Kafka API port",
        },
        schemaRegistryPort: {
          ...portSchema,
          description: "Schema Registry port",
        },
        adminPort: {
          ...portSchema,
          description: "Admin API port",
        },
        pandaproxyPort: {
          ...portSchema,
          description: "REST Proxy port",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Monitoring schema
 */
const monitoringSchema: JsonSchema = {
  type: "object",
  required: ["grafana", "pgAdmin"],
  properties: {
    grafana: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: hostSchema,
        port: portSchema,
      },
      additionalProperties: false,
    },
    pgAdmin: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: hostSchema,
        port: portSchema,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Complete service configuration schema
 */
export const serviceConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/service.schema",
  type: "object",
  required: [
    "type",
    "version",
    "databases",
    "messageQueue",
    "monitoring",
    "networking",
  ],
  properties: {
    type: {
      const: "services",
      description: "Configuration type identifier",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+$",
      description: "Configuration version (semver format)",
    },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: databaseSchemas,
      additionalProperties: false,
    },
    messageQueue: messageQueueSchema,
    monitoring: monitoringSchema,
    networking: {
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
              description: "Database network name",
            },
            redis: {
              type: "string",
              minLength: 1,
              description: "Redis network name",
            },
            redpanda: {
              type: "string",
              minLength: 1,
              description: "Message queue network name",
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Environment configuration schema
 */
export const envConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/env.schema",
  type: "object",
  required: [
    "POSTGRES_PASSWORD",
    "POSTGRES_USER",
    "POSTGRES_DB",
    "REDIS_PASSWORD",
    "GF_SECURITY_ADMIN_PASSWORD",
    "PGADMIN_DEFAULT_EMAIL",
    "PGADMIN_DEFAULT_PASSWORD",
  ],
  properties: {
    POSTGRES_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL password",
    },
    POSTGRES_USER: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL username",
    },
    POSTGRES_DB: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL database name",
    },
    REDIS_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Redis password",
    },
    GF_SECURITY_ADMIN_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Grafana admin password",
    },
    GF_INSTALL_PLUGINS: {
      type: "string",
      description: "Semicolon-separated list of Grafana plugins",
    },
    PGADMIN_DEFAULT_EMAIL: {
      type: "string",
      format: "email",
      description: "pgAdmin administrator email",
    },
    PGADMIN_DEFAULT_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "pgAdmin administrator password",
    },
    QDB_TELEMETRY_ENABLED: {
      type: "string",
      enum: ["true", "false"],
      description: "QuestDB telemetry setting",
    },
    REDPANDA_BROKER_ID: {
      type: "string",
      pattern: "^\\d+$",
      description: "Redpanda broker ID",
    },
    REDPANDA_ADVERTISED_KAFKA_API: {
      type: "string",
      description: "Advertised Kafka API address",
    },
    REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: {
      type: "string",
      description: "Advertised Schema Registry address",
    },
    REDPANDA_ADVERTISED_PANDAPROXY_API: {
      type: "string",
      description: "Advertised REST Proxy address",
    },
  },
  additionalProperties: true,
};
````

Improvements:

1. Move schema definitions from index.ts to dedicated file
2. Use JSON Schema validation more effectively
3. Add descriptions and constraints for each field
4. Better organize schema structure to match config files
5. Add format validations where appropriate

---

### `qi/core/src/services/config/handlers.ts`

````typescript
/**
 * @fileoverview Service Configuration Handlers
 * @module @qi/core/services/config/handlers
 *
 * @description
 * Implements service-specific configuration handlers.
 *
 * Improvements:
 * - Direct interface implementations instead of inheritance
 * - Constructor validation
 * - Secure credential handling
 * - Clear separation of concerns
 * - Improved error messages
 * - Type-safe implementations
 *
 * @example
 * ```typescript
 * const pgHandler = new PostgresConnectionHandler(config.databases.postgres, {
 *   user: "postgres",
 *   password: "secret"
 * });
 * const connString = pgHandler.getConnectionString();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { ServiceConfig } from "./types";
import {
  DatabaseConnection,
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl";

/**
 * PostgreSQL connection handler
 *
 * @implements {PostgresConnection}
 */
export class PostgresConnectionHandler implements PostgresConnection {
  constructor(
    private config: ServiceConfig["databases"]["postgres"],
    private credentials: { user: string; password: string }
  ) {
    if (!config.host || !config.port || !config.database) {
      throw new ApplicationError(
        "Invalid PostgreSQL configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "postgres", config }
      );
    }
    logger.debug("Initialized PostgreSQL connection handler", {
      host: config.host,
    });
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.port;
  }

  getConnectionString(): string {
    return `postgresql://${this.credentials.user}:${this.credentials.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
  }

  getMaxConnections(): number {
    return this.config.maxConnections;
  }
}

/**
 * QuestDB connection handler
 *
 * @implements {QuestDBConnection}
 */
export class QuestDBConnectionHandler implements QuestDBConnection {
  constructor(private config: ServiceConfig["databases"]["questdb"]) {
    if (
      !config.host ||
      !config.httpPort ||
      !config.pgPort ||
      !config.influxPort
    ) {
      throw new ApplicationError(
        "Invalid QuestDB configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "questdb", config }
      );
    }
    logger.debug("Initialized QuestDB connection handler", {
      host: config.host,
    });
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.pgPort;
  }

  getHttpEndpoint(): string {
    return `http://${this.config.host}:${this.config.httpPort}`;
  }

  getPgEndpoint(): string {
    return `postgresql://${this.config.host}:${this.config.pgPort}/questdb`;
  }

  getInfluxEndpoint(): string {
    return `http://${this.config.host}:${this.config.influxPort}`;
  }
}

/**
 * Redis connection handler
 *
 * @implements {RedisConnection}
 */
export class RedisConnectionHandler implements RedisConnection {
  constructor(
    private config: ServiceConfig["databases"]["redis"],
    private password: string
  ) {
    if (!config.host || !config.port) {
      throw new ApplicationError(
        "Invalid Redis configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "redis", config }
      );
    }
    logger.debug("Initialized Redis connection handler", { host: config.host });
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.port;
  }

  getConnectionString(): string {
    return `redis://:${this.password}@${this.config.host}:${this.config.port}`;
  }

  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}

/**
 * Message queue (Redpanda) connection handler
 *
 * @implements {MessageQueueConnection}
 */
export class MessageQueueConnectionHandler implements MessageQueueConnection {
  constructor(
    private config: ServiceConfig["messageQueue"]["redpanda"],
    private advertised: {
      kafka?: string;
      schemaRegistry?: string;
      proxy?: string;
      brokerId?: string;
    }
  ) {
    if (!config.kafkaPort || !config.schemaRegistryPort || !config.adminPort) {
      throw new ApplicationError(
        "Invalid message queue configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "redpanda", config }
      );
    }
    logger.debug("Initialized message queue connection handler");
  }

  getBrokerEndpoint(): string {
    const host = this.advertised.kafka || "localhost";
    return `${host}:${this.config.kafkaPort}`;
  }

  getSchemaRegistryEndpoint(): string {
    const host = this.advertised.schemaRegistry || "localhost";
    return `http://${host}:${this.config.schemaRegistryPort}`;
  }

  getAdminEndpoint(): string {
    return `http://localhost:${this.config.adminPort}`;
  }

  getProxyEndpoint(): string {
    const host = this.advertised.proxy || "localhost";
    return `http://${host}:${this.config.pandaproxyPort}`;
  }

  getBrokerId(): number | undefined {
    return this.advertised.brokerId
      ? parseInt(this.advertised.brokerId, 10)
      : undefined;
  }
}

/**
 * Base monitoring endpoint handler
 *
 * @implements {MonitoringEndpoint}
 */
export class MonitoringEndpointHandler implements MonitoringEndpoint {
  constructor(
    private config: { host: string; port: number },
    private credentials: { username?: string; password: string }
  ) {
    if (!config.host || !config.port) {
      throw new ApplicationError(
        "Invalid monitoring endpoint configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "monitoring", config }
      );
    }
  }

  getEndpoint(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  getCredentials(): { username?: string; password: string } {
    return this.credentials;
  }
}

/**
 * Grafana-specific monitoring endpoint handler
 *
 * @implements {GrafanaEndpoint}
 */
export class GrafanaEndpointHandler
  extends MonitoringEndpointHandler
  implements GrafanaEndpoint
{
  constructor(
    config: ServiceConfig["monitoring"]["grafana"],
    credentials: { password: string },
    private plugins?: string
  ) {
    super(config, credentials);
    logger.debug("Initialized Grafana endpoint handler", {
      plugins: this.getPlugins(),
    });
  }

  getPlugins(): string[] {
    return this.plugins?.split(";").filter(Boolean) || [];
  }
}

/**
 * Network configuration handler
 *
 * @implements {NetworkConfig}
 */
export class NetworkConfigHandler implements NetworkConfig {
  constructor(private config: ServiceConfig["networking"]["networks"]) {
    if (!config.db || !config.redis || !config.redpanda) {
      throw new ApplicationError(
        "Invalid network configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "network", config }
      );
    }
    logger.debug("Initialized network configuration handler");
  }

  getNetworkName(service: "db" | "redis" | "redpanda"): string {
    return this.config[service];
  }

  getAllNetworks(): Record<string, string> {
    return { ...this.config };
  }
}
````

Improvements:

1. Direct interface implementations without complex inheritance
2. Constructor validation for each handler
3. Secure credential handling
4. Clear logging of initialization
5. Strong typing throughout
6. Consistent error handling

---

### `qi/core/src/services/config/loader.ts`

````typescript
/**
 * @fileoverview Service Configuration Loader
 * @module @qi/core/services/config/loader
 *
 * @description
 * Provides configuration loading functionality for services.
 *
 * Improvements:
 * - Maximizes use of core ConfigFactory
 * - Simplified error handling
 * - Better environment handling
 * - Improved logging
 * - Robust path handling
 * - Clear error messages
 *
 * @example
 * ```typescript
 * const services = await loadServiceConfig();
 * const pgConn = services.databases.postgres.getConnectionString();
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { Schema, ConfigFactory } from "@qi/core/config";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";
import { join } from "path";

import { serviceConfigSchema, envConfigSchema } from "./schema";
import { ServiceConfig, EnvConfig } from "./types";
import { ServiceConnections } from "./dsl";
import {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers";

/**
 * Configuration loading options
 */
export interface LoadConfigOptions {
  /** Path to configuration directory */
  configDir?: string;
  /** Configuration file name */
  configFile?: string;
  /** Environment file name */
  envFile?: string;
}

/**
 * Loads service configuration and creates handlers
 *
 * @param options Configuration loading options
 * @returns Service connections interface
 * @throws {ApplicationError} When loading or validation fails
 */
export async function loadServiceConfig(
  options: LoadConfigOptions = {}
): Promise<ServiceConnections> {
  const {
    configDir = "./config",
    configFile = "services-1.0.json",
    envFile = "services.env",
  } = options;

  const configPath = join(configDir, configFile);
  const envPath = join(configDir, envFile);

  try {
    // Load environment using core utility
    const env = (await loadEnv(envPath, { override: true })) as EnvConfig;
    if (!env) {
      throw new ApplicationError(
        "Environment configuration not found",
        ErrorCode.ENV_MISSING_ERROR,
        500,
        { path: envPath }
      );
    }

    logger.info("Loaded environment configuration", {
      path: envPath,
      variables: Object.keys(env).length,
    });

    // Initialize schema and factory
    const schema = new Schema({ formats: true });
    schema.registerSchema("service-config", serviceConfigSchema);
    schema.registerSchema("env-config", envConfigSchema);

    // Create loader using core factory
    const factory = new ConfigFactory(schema);
    const loader = factory.createLoader<ServiceConfig>({
      type: "services",
      version: "1.0",
      schema: serviceConfigSchema,
    });

    // Load and validate configuration
    const config = await loader.load();

    logger.info("Loaded service configuration", {
      path: configPath,
      services: Object.keys(config.databases).length,
    });

    // Create and return service connections
    return {
      databases: {
        postgres: new PostgresConnectionHandler(config.databases.postgres, {
          user: env.POSTGRES_USER,
          password: env.POSTGRES_PASSWORD,
        }),
        questdb: new QuestDBConnectionHandler(config.databases.questdb),
        redis: new RedisConnectionHandler(
          config.databases.redis,
          env.REDIS_PASSWORD
        ),
      },
      messageQueue: new MessageQueueConnectionHandler(
        config.messageQueue.redpanda,
        {
          kafka: env.REDPANDA_ADVERTISED_KAFKA_API,
          schemaRegistry: env.REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API,
          proxy: env.REDPANDA_ADVERTISED_PANDAPROXY_API,
          brokerId: env.REDPANDA_BROKER_ID,
        }
      ),
      monitoring: {
        grafana: new GrafanaEndpointHandler(
          config.monitoring.grafana,
          { password: env.GF_SECURITY_ADMIN_PASSWORD },
          env.GF_INSTALL_PLUGINS
        ),
        pgAdmin: new MonitoringEndpointHandler(config.monitoring.pgAdmin, {
          username: env.PGADMIN_DEFAULT_EMAIL,
          password: env.PGADMIN_DEFAULT_PASSWORD,
        }),
      },
      networking: new NetworkConfigHandler(config.networking.networks),
    };
  } catch (error) {
    // Re-throw ApplicationErrors directly
    if (error instanceof ApplicationError) {
      throw error;
    }

    // Wrap other errors
    throw new ApplicationError(
      "Failed to load service configuration",
      ErrorCode.SERVICE_CONFIG_INVALID,
      500,
      {
        configPath,
        envPath,
        error: String(error),
      }
    );
  }
}
````

Improvements:

1. Maximum use of core ConfigFactory
2. Clean options interface
3. Proper path handling
4. Comprehensive logging
5. Clear error handling strategy
6. Structured configuration loading process

---

Fixing loading logic:

```typescript
/**
 * @fileoverview Service Configuration Loader
 * @module @qi/core/services/config/loader
 * 
 * @description
 * Provides configuration loading functionality for services.
 * File paths and names are provided by the application layer.
 * 
 * Improvements:
 * - Removed hardcoded file names
 * - Required paths in options
 * - Maximizes use of core ConfigFactory
 * - Simplified error handling
 * - Better environment handling
 * - Improved logging
 * 
 * @example
 * ```typescript
 * // Application provides all paths
 * const services = await loadServiceConfig({
 *   configPath: "/app/config/services.json",
 *   envPath: "/app/config/services.env"
 * });
 * ```
 * 
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { Schema, ConfigFactory } from "@qi/core/config";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";

import { serviceConfigSchema, envConfigSchema } from "./schema";
import { ServiceConfig, EnvConfig } from "./types";
import { ServiceConnections } from "./dsl";
import {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler
} from "./handlers";

/**
 * Configuration loading options
 */
export interface LoadConfigOptions {
  /** Path to service configuration file */
  configPath: string;
  /** Path to environment file */
  envPath: string;
}

/**
 * Loads service configuration and creates handlers
 * 
 * @param options Configuration loading options
 * @returns Service connections interface
 * @throws {ApplicationError} When loading or validation fails
 */
export async function loadServiceConfig(options: LoadConfigOptions): Promise<ServiceConnections> {
  const { configPath, envPath } = options;

  try {
    // Load environment using core utility
    const env = await loadEnv(envPath, { override: true }) as EnvConfig;
    if (!env) {
      throw new ApplicationError(
        "Environment configuration not found",
        ErrorCode.ENV_MISSING_ERROR,
        500,
        { path: envPath }
      );
    }

    logger.info("Loaded environment configuration", {
      path: envPath,
      variables: Object.keys(env).length
    });

    // Initialize schema and factory
    const schema = new Schema({ formats: true });
    schema.registerSchema("qi://core/services/config/service.schema", serviceConfigSchema);
    schema.registerSchema("qi://core/services/config/env.schema", envConfigSchema);
    
    // Create loader using core factory
    const factory = new ConfigFactory(schema);
    const loader = factory.createLoader<ServiceConfig>({
      type: "services",
      version: "1.0",
      schema: serviceConfigSchema
    });

    // Set source path for loader
    const jsonLoader = loader as unknown as { source: string };
    jsonLoader.source = configPath;

    // Load and validate configuration
    const config = await loader.load();

    logger.info("Loaded service configuration", {
      path: configPath,
      services: Object.keys(config.databases).length
    });

    // Create and return service connections
    return {
      databases: {
        postgres: new PostgresConnectionHandler(
          config.databases.postgres,
          {
            user: env.POSTGRES_USER,
            password: env.POSTGRES_PASSWORD
          }
        ),
        questdb: new QuestDBConnectionHandler(
          config.databases.questdb
        ),
        redis: new RedisConnectionHandler(
          config.databases.redis,
          env.REDIS_PASSWORD
        )
      },
      messageQueue: new MessageQueueConnectionHandler(
        config.messageQueue.redpanda,
        {
          kafka: env.REDPANDA_ADVERTISED_KAFKA_API,
          schemaRegistry: env.REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API,
          proxy: env.REDPANDA_ADVERTISED_PANDAPROXY_API,
          brokerId: env.REDPANDA_BROKER_ID
        }
      ),
      monitoring: {
        grafana: new GrafanaEndpointHandler(
          config.monitoring.grafana,
          { password: env.GF_SECURITY_ADMIN_PASSWORD },
          env.GF_INSTALL_PLUGINS
        ),
        pgAdmin: new MonitoringEndpointHandler(
          config.monitoring.pgAdmin,
          {
            username: env.PGADMIN_DEFAULT_EMAIL,
            password: env.PGADMIN_DEFAULT_PASSWORD
          }
        )
      },
      networking: new NetworkConfigHandler(
        config.networking.networks
      )
    };
  } catch (error) {
    // Re-throw ApplicationErrors directly
    if (error instanceof ApplicationError) {
      throw error;
    }

    // Wrap other errors
    throw new ApplicationError(
      "Failed to load service configuration",
      ErrorCode.SERVICE_CONFIG_INVALID,
      500,
      {
        configPath,
        envPath,
        error: String(error)
      }
    );
  }
}
```

Improvements:
1. Removed all hardcoded file paths and names
2. Made config paths required in options
3. Removed unnecessary path joining logic
4. Cleaned up the options interface
5. Better error messages around file paths
6. Proper schema IDs in registration

---

### `qi/core/src/services/config/index.ts`

````typescript
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
 * - JSON Schema validation
 * - Environment variable integration
 * - Connection string generation
 * - Network configuration
 * - Comprehensive error handling
 *
 * @example Basic Usage
 * ```typescript
 * const services = await loadServiceConfig();
 *
 * // Database connections
 * const pgConn = services.databases.postgres.getConnectionString();
 * const redisConn = services.databases.redis.getConnectionString();
 *
 * // Message queue endpoints
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 *
 * // Monitoring endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * const services = await loadServiceConfig({
 *   configDir: "./custom/config",
 *   configFile: "services-prod.json",
 *   envFile: "services-prod.env"
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 */

// Core type definitions
export type { ServiceConfig, EnvConfig, LoadConfigResult } from "./types";

// Domain-specific interfaces
export type {
  ServiceConnections,
  DatabaseConnection,
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl";

// Schema definitions
export { serviceConfigSchema, envConfigSchema } from "./schema";

// Service handlers
export {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers";

// Configuration loader
export { loadServiceConfig, LoadConfigOptions } from "./loader";

// Re-export necessary types from core for convenience
export type { JsonSchema } from "@qi/core/config";
````

Improvements:

1. Clear module documentation with examples
2. Organized exports by category
3. Complete type exports for external use
4. Re-export of necessary core types
5. Full JSDoc documentation with examples
6. Clear authorship and creation date
