## The `services` module
  
### `config`
  
  
1. `qi/core/src/services/config/types.ts`:
```ts
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
 * @modified 2024-12-01
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
  
```  
  
2. `qi/core/src/services/config/dsl.ts`:
```ts
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
 * @modified 2024-12-04
 * @created 2024-11-29
 */
  
/**
 * Base interface for database connections
 *
 * @interface DatabaseConnection
 */
export interface DatabaseConnection {
  getDatabase(): string;
  getUser(): string;
  getPassword(): string;
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
  
```  
  
3. `qi/core/src/services/config/schema.ts`:
```ts
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
 * @modified 2024-12-01
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/service.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[%20%20%20%20&quot;type&quot;,%20%20%20%20&quot;version&quot;,%20%20%20%20&quot;databases&quot;,%20%20%20%20&quot;messageQueue&quot;,%20%20%20%20&quot;monitoring&quot;,%20%20%20%20&quot;networking&quot;,%20%20],%20%20properties:%20{%20%20%20%20type:%20{%20%20%20%20%20%20const:%20&quot;services&quot;,%20%20%20%20%20%20description:%20&quot;Configuration%20type%20identifier&quot;,%20%20%20%20},%20%20%20%20version:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20pattern:%20&quot;^\\d+\\.\\d+"/>",
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/env.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[%20%20%20%20&quot;POSTGRES_PASSWORD&quot;,%20%20%20%20&quot;POSTGRES_USER&quot;,%20%20%20%20&quot;POSTGRES_DB&quot;,%20%20%20%20&quot;REDIS_PASSWORD&quot;,%20%20%20%20&quot;GF_SECURITY_ADMIN_PASSWORD&quot;,%20%20%20%20&quot;PGADMIN_DEFAULT_EMAIL&quot;,%20%20%20%20&quot;PGADMIN_DEFAULT_PASSWORD&quot;,%20%20],%20%20properties:%20{%20%20%20%20POSTGRES_PASSWORD:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20minLength:%201,%20%20%20%20%20%20description:%20&quot;PostgreSQL%20password&quot;,%20%20%20%20},%20%20%20%20POSTGRES_USER:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20minLength:%201,%20%20%20%20%20%20description:%20&quot;PostgreSQL%20username&quot;,%20%20%20%20},%20%20%20%20POSTGRES_DB:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20minLength:%201,%20%20%20%20%20%20description:%20&quot;PostgreSQL%20database%20name&quot;,%20%20%20%20},%20%20%20%20REDIS_PASSWORD:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20minLength:%201,%20%20%20%20%20%20description:%20&quot;Redis%20password&quot;,%20%20%20%20},%20%20%20%20GF_SECURITY_ADMIN_PASSWORD:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20minLength:%201,%20%20%20%20%20%20description:%20&quot;Grafana%20admin%20password&quot;,%20%20%20%20},%20%20%20%20GF_INSTALL_PLUGINS:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20description:%20&quot;Semicolon-separated%20list%20of%20Grafana%20plugins&quot;,%20%20%20%20},%20%20%20%20PGADMIN_DEFAULT_EMAIL:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20format:%20&quot;email&quot;,%20%20%20%20%20%20description:%20&quot;pgAdmin%20administrator%20email&quot;,%20%20%20%20},%20%20%20%20PGADMIN_DEFAULT_PASSWORD:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20minLength:%201,%20%20%20%20%20%20description:%20&quot;pgAdmin%20administrator%20password&quot;,%20%20%20%20},%20%20%20%20QDB_TELEMETRY_ENABLED:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20enum:%20[&quot;true&quot;,%20&quot;false&quot;],%20%20%20%20%20%20description:%20&quot;QuestDB%20telemetry%20setting&quot;,%20%20%20%20},%20%20%20%20REDPANDA_BROKER_ID:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20pattern:%20&quot;^\\d+"/>",
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
  
```  
  
4. `qi/core/src/services/config/handlers.ts`:
```ts
/**
 * @fileoverview Service Configuration Connection Handlers
 * @module @qi/core/services/config/handlers
 *
 * @description
 * Implements handlers for various service connections including databases,
 * message queues, and monitoring endpoints. These handlers provide clean interfaces
 * for accessing configuration data and generating connection strings while handling
 * edge cases like special characters and IPv6 addresses.
 *
 * Key features:
 * - Safe handling of connection credentials
 * - Support for IPv6 addresses
 * - Custom port configurations
 * - URL-safe character encoding
 * - Validation of required fields
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 * @modified 2024-12-04
 */
  
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { ServiceConfig } from "./types.js";
import {
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl.js";
  
/**
 * PostgreSQL connection handler implementation.
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
  
  private formatHost(host: string): string {
    // Check if the host is an IPv6 address (contains colons but is not a hostname:port)
    if (host.includes(":") && !host.includes("]") && !host.includes("/")) {
      return `[${host}]`;
    }
    return host;
  }
  
  getDatabase(): string {
    return this.config.database;
  }
  
  getUser(): string {
    return this.credentials.user;
  }
  
  getPassword(): string {
    return this.credentials.password;
  }
  
  getHost(): string {
    return this.config.host;
  }
  
  getPort(): number {
    return this.config.port;
  }
  
  getConnectionString(): string {
    const formattedHost = this.formatHost(this.config.host);
    return `postgresql://${this.credentials.user}:${this.credentials.password}@${formattedHost}:${this.config.port}/${this.config.database}`;
  }
  
  getMaxConnections(): number {
    return this.config.maxConnections;
  }
}
  
/**
 * QuestDB connection handler implementation.
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
  
  getDatabase(): string {
    return "questdb";
  }
  
  getUser(): string {
    return "admin";
  }
  
  getPassword(): string {
    return "quest";
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
 * Redis connection handler implementation.
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
  
  getDatabase(): string {
    return "default";
  }
  
  getUser(): string {
    return "default";
  }
  
  getPassword(): string {
    return this.password;
  }
  
  getHost(): string {
    return this.config.host;
  }
  
  getPort(): number {
    return this.config.port;
  }
  
  getConnectionString(): string {
    // Properly encode the password to handle special characters
    const encodedPassword = encodeURIComponent(this.password);
    return `redis://:${encodedPassword}@${this.config.host}:${this.config.port}`;
  }
  
  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}
  
/**
 * Message queue (Redpanda) connection handler implementation.
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
    if (this.advertised.kafka) {
      // Check if advertised address already includes port
      if (this.advertised.kafka.includes(":")) {
        return this.advertised.kafka;
      }
      return `${this.advertised.kafka}:${this.config.kafkaPort}`;
    }
    return `localhost:${this.config.kafkaPort}`;
  }
  
  getSchemaRegistryEndpoint(): string {
    if (this.advertised.schemaRegistry) {
      // Check if advertised address already includes port
      if (this.advertised.schemaRegistry.includes(":")) {
        return `http://${this.advertised.schemaRegistry}`;
      }
      return `http://${this.advertised.schemaRegistry}:${this.config.schemaRegistryPort}`;
    }
    return `http://localhost:${this.config.schemaRegistryPort}`;
  }
  
  getAdminEndpoint(): string {
    return `http://localhost:${this.config.adminPort}`;
  }
  
  getProxyEndpoint(): string {
    if (this.advertised.proxy) {
      // Check if advertised address already includes port
      if (this.advertised.proxy.includes(":")) {
        return `http://${this.advertised.proxy}`;
      }
      return `http://${this.advertised.proxy}:${this.config.pandaproxyPort}`;
    }
    return `http://localhost:${this.config.pandaproxyPort}`;
  }
  
  getBrokerId(): number | undefined {
    return this.advertised.brokerId
      ? parseInt(this.advertised.brokerId, 10)
      : undefined;
  }
}
  
/**
 * Base monitoring endpoint handler implementation.
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
 * Grafana-specific monitoring endpoint handler implementation.
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
 * Network configuration handler implementation.
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
  
```  
  
5. `qi/core/src/services/config/loader.ts`:
```ts
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
 * @modified 2024-12-01
 * @created 2024-11-29
 */
  
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { Schema, ConfigFactory } from "@qi/core/config";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";
  
import { serviceConfigSchema, envConfigSchema } from "./schema.js";
import { ServiceConfig, EnvConfig } from "./types.js";
import { ServiceConnections } from "./dsl.js";
import {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers.js";
  
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
export async function loadServiceConfig(
  options: LoadConfigOptions
): Promise<ServiceConnections> {
  const { configPath, envPath } = options;
  
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
    schema.registerSchema(
      "qi://core/services/config/service.schema",
      serviceConfigSchema
    );
    schema.registerSchema(
      "qi://core/services/config/env.schema",
      envConfigSchema
    );
  
    // Create loader using core factory
    const factory = new ConfigFactory(schema);
    const loader = factory.createLoader<ServiceConfig>({
      type: "services",
      version: "1.0",
      schema: serviceConfigSchema,
    });
  
    // Set source path for loader
    const jsonLoader = loader as unknown as { source: string };
    jsonLoader.source = configPath;
  
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
      ErrorCode.SERVICE_INITIALIZATION_ERROR,
      500,
      {
        configPath,
        envPath,
        error: String(error),
      }
    );
  }
}
  
```  
  
6. `qi/core/src/services/config/index.ts`:
```ts
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
 * @modified 2024-12-01
 * @created 2024-11-29
 */
  
// Core type definitions
export type { ServiceConfig, EnvConfig, LoadConfigResult } from "./types.js";
  
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
} from "./dsl.js";
  
// Schema definitions
export { serviceConfigSchema, envConfigSchema } from "./schema.js";
  
// Service handlers
export {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers.js";
  
// Configuration loader
export { loadServiceConfig, LoadConfigOptions } from "./loader.js";
  
// Re-export necessary types from core for convenience
export type { JsonSchema } from "@qi/core/config";
  
```  
  
  
---
  
### `base`
  
  
1. `qi/core/src/services/base/types.ts`:
```ts
/**
 * @fileoverview Base service type definitions and interfaces
 * @module @qi/core/services/base/types
 *
 * @description
 * Defines core type definitions and interfaces for the service infrastructure.
 * These types provide the foundation for implementing service wrappers around
 * various backends like databases, message queues, and caches.
 *
 * Features:
 * - Common service configuration interfaces
 * - Health check types and status enums
 * - Base service client interface
 * - Connection configuration
 * - Error handling types
 *
 * This module is used as the basis for implementing specific services like:
 * - Database services (TimescaleDB, QuestDB)
 * - Cache services (Redis)
 * - Message queue services (Redpanda)
 *
 * @example
 * ```typescript
 * // Implementing a custom service
 * class MyService extends BaseServiceClient<MyConfig> {
 *   constructor(config: MyConfig) {
 *     super(config, 'MyService');
 *   }
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */
  
/**
 * Base configuration interface for all services
 * @interface ServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {Object} [healthCheck] - Optional health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between health checks in ms
 * @property {number} healthCheck.timeout - Timeout for health checks in ms
 * @property {number} healthCheck.retries - Number of retries for failed health checks
 */
export interface ServiceConfig {
  enabled: boolean;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}
  
/**
 * Common connection properties shared across services
 * @interface ConnectionConfig
 *
 * @property {string} host - Service host address
 * @property {number} port - Service port number
 * @property {string} [username] - Optional username for authentication
 * @property {string} [password] - Optional password for authentication
 */
export interface ConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}
  
/**
 * Base interface for service clients
 * @interface ServiceClient
 * @template T - Service configuration type extending ServiceConfig
 *
 * @property {function} isEnabled - Check if service is enabled
 * @property {function} isHealthy - Check service health status
 * @property {function} getConfig - Get service configuration
 * @property {function} connect - Establish service connection
 * @property {function} disconnect - Close service connection
 */
export interface ServiceClient<T extends ServiceConfig> {
  isEnabled(): boolean;
  isHealthy(): Promise<boolean>;
  getConfig(): T;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
  
/**
 * Health check result interface
 * @interface HealthCheckResult
 *
 * @property {('healthy'|'unhealthy')} status - Health check status
 * @property {string} [message] - Optional status message
 * @property {Object} [details] - Optional detailed status information
 * @property {Date} timestamp - Time when health check was performed
 */
export interface HealthCheckResult {
  status: "healthy" | "unhealthy";
  message?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}
  
/**
 * Service status enumeration
 * @enum {string}
 *
 * @property {string} INITIALIZING - Service is initializing
 * @property {string} CONNECTED - Service is connected and ready
 * @property {string} DISCONNECTED - Service is disconnected
 * @property {string} ERROR - Service encountered an error
 */
export enum ServiceStatus {
  INITIALIZING = "initializing",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}
  
/**
 * Base service error class
 * @class ServiceError
 * @extends Error
 *
 * @property {string} service - Name of the service where error occurred
 * @property {string} code - Error code for categorization
 * @property {Object} [details] - Additional error details
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
  
```  
  
2. `qi/core/src/services/base/client.ts`:
```ts
/**
 * @fileoverview Base service client abstract implementation
 * @module @qi/core/services/base/client
 *
 * @description
 * Provides the foundation for all service client implementations in the system.
 * This abstract class defines the core functionality and contracts that all
 * service implementations must fulfill, including:
 *
 * Key features:
 * - Standardized service lifecycle management
 * - Health check infrastructure
 * - Configuration validation
 * - Status tracking
 * - Error handling patterns
 *
 * Services that extend this base include:
 * - Database services (TimescaleDB, QuestDB)
 * - Cache services (Redis)
 * - Message queue services (Redpanda)
 *
 * @example Implementing a custom service
 * ```typescript
 * class MyService extends BaseServiceClient<MyConfig> {
 *   constructor(config: MyConfig) {
 *     super(config, 'MyService');
 *   }
 *
 *   async connect(): Promise<void> {
 *     // Connection implementation
 *   }
 *
 *   async disconnect(): Promise<void> {
 *     // Disconnection implementation
 *   }
 *
 *   protected async checkHealth(): Promise<HealthCheckResult> {
 *     // Health check implementation
 *   }
 * }
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */
  
import { logger } from "@qi/core/logger";
import {
  ServiceConfig,
  ServiceClient,
  ServiceStatus,
  HealthCheckResult,
} from "./types.js";
  
/**
 * Abstract base class for service client implementations
 * @abstract
 * @class BaseServiceClient
 * @implements {ServiceClient<T>}
 * @template T - Service configuration type extending ServiceConfig
 */
export abstract class BaseServiceClient<T extends ServiceConfig>
  implements ServiceClient<T>
{
  /**
   * Current service status
   * @protected
   */
  protected status: ServiceStatus = ServiceStatus.INITIALIZING;
  
  /**
   * Result of the last health check
   * @protected
   */
  protected lastHealthCheck?: HealthCheckResult;
  
  /**
   * Creates an instance of BaseServiceClient
   *
   * @param {T} config - Service configuration
   * @param {string} serviceName - Name of the service for logging
   *
   * @throws {Error} When configuration validation fails
   *
   * @example
   * ```typescript
   * super(config, 'MyService');
   * ```
   */
  constructor(
    protected readonly config: T,
    protected readonly serviceName: string
  ) {
    this.validateConfig();
  }
  
  /**
   * Checks if the service is enabled
   *
   * @returns {boolean} True if service is enabled
   *
   * @example
   * ```typescript
   * if (service.isEnabled()) {
   *   await service.connect();
   * }
   * ```
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
  
  /**
   * Establishes connection to the service
   * @abstract
   * @returns {Promise<void>}
   */
  abstract connect(): Promise<void>;
  
  /**
   * Disconnects from the service
   * @abstract
   * @returns {Promise<void>}
   */
  abstract disconnect(): Promise<void>;
  
  /**
   * Performs service-specific health check
   * @abstract
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected abstract checkHealth(): Promise<HealthCheckResult>;
  
  /**
   * Checks if the service is healthy
   *
   * @returns {Promise<boolean>} True if service is healthy
   *
   * @example
   * ```typescript
   * const healthy = await service.isHealthy();
   * console.log(`Service is ${healthy ? 'healthy' : 'unhealthy'}`);
   * ```
   */
  async isHealthy(): Promise<boolean> {
    try {
      this.lastHealthCheck = await this.checkHealth();
      return this.lastHealthCheck.status === "healthy";
    } catch (error) {
      logger.error(`Health check failed for <img src="https://latex.codecogs.com/gif.latex?{this.serviceName}`,%20{%20error%20});%20%20%20%20%20%20return%20false;%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Gets%20the%20current%20service%20configuration%20%20%20*%20%20%20*%20@returns%20{T}%20Service%20configuration%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20const%20config%20=%20service.getConfig();%20%20%20*%20console.log(`Service%20TTL:"/>{config.ttl}`);
   * ```
   */
  getConfig(): T {
    return this.config;
  }
  
  /**
   * Updates service status and logs the change
   *
   * @protected
   * @param {ServiceStatus} status - New service status
   *
   * @example
   * ```typescript
   * this.setStatus('connected');
   * ```
   */
  protected setStatus(status: ServiceStatus): void {
    this.status = status;
    logger.info(`<img src="https://latex.codecogs.com/gif.latex?{this.serviceName}%20status%20changed%20to"/>{status}`);
  }
  
  /**
   * Validates service configuration
   *
   * @protected
   * @throws {Error} When configuration is invalid
   *
   * @example
   * ```typescript
   * protected validateConfig(): void {
   *   super.validateConfig();
   *   if (!this.config.customField) {
   *     throw new Error('customField is required');
   *   }
   * }
   * ```
   */
  protected validateConfig(): void {
    if (!this.config) {
      throw new Error(`<img src="https://latex.codecogs.com/gif.latex?{this.serviceName}%20configuration%20is%20required`);%20%20%20%20}%20%20%20%20if%20(this.config.healthCheck?.enabled)%20{%20%20%20%20%20%20if%20(%20%20%20%20%20%20%20%20!this.config.healthCheck.interval%20||%20%20%20%20%20%20%20%20!this.config.healthCheck.timeout%20%20%20%20%20%20)%20{%20%20%20%20%20%20%20%20throw%20new%20Error(%20%20%20%20%20%20%20%20%20%20`Invalid%20health%20check%20configuration%20for"/>{this.serviceName}`
        );
      }
    }
  }
  
  /**
   * Initiates periodic health checks if enabled in configuration
   *
   * @protected
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await this.startHealthCheck();
   * ```
   */
  protected async startHealthCheck(): Promise<void> {
    if (!this.config.healthCheck?.enabled) {
      return;
    }
  
    const interval = this.config.healthCheck.interval;
    setInterval(async () => {
      try {
        await this.isHealthy();
      } catch (error) {
        logger.error(`Health check failed for <img src="https://latex.codecogs.com/gif.latex?{this.serviceName}`,%20{%20error%20});%20%20%20%20%20%20}%20%20%20%20},%20interval);%20%20}}```%20%203.%20`qi/core/src/services/base/manager.ts`:```ts%20block_code=true%20class=&quot;line-numbers&quot;%20%20/**%20*%20@fileoverview%20Service%20connection%20manager%20implementation%20*%20@module%20@qi/core/services/base/manager%20*%20*%20@description%20*%20Provides%20centralized%20management%20of%20service%20connections%20and%20health%20monitoring.%20*%20This%20manager%20handles:%20*%20-%20Service%20registration%20*%20-%20Connection%20lifecycle%20*%20-%20Health%20status%20monitoring%20*%20-%20Coordinated%20startup/shutdown%20*%20*%20Used%20to%20manage%20all%20service%20types%20including:%20*%20-%20Database%20services%20*%20-%20Cache%20services%20*%20-%20Message%20queue%20services%20*%20*%20@example%20Basic%20Usage%20*%20```typescript%20*%20const%20manager%20=%20new%20ServiceConnectionManager();%20*%20*%20//%20Register%20services%20*%20manager.registerService(&#39;redis&#39;,%20redisService);%20*%20manager.registerService(&#39;db&#39;,%20dbService);%20*%20*%20//%20Start%20all%20services%20*%20await%20manager.connectAll();%20*%20*%20//%20Monitor%20health%20*%20const%20status%20=%20await%20manager.getHealthStatus();%20*%20```%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@modified%202024-12-05%20*%20@created%202024-12-04%20*/import%20{%20logger%20}%20from%20&quot;@qi/core/logger&quot;;import%20{%20ServiceClient,%20ServiceConfig%20}%20from%20&quot;./types.js&quot;;/**%20*%20Manages%20service%20connections%20and%20lifecycle%20*%20@class%20ServiceConnectionManager%20*/export%20class%20ServiceConnectionManager%20{%20%20/**%20%20%20*%20Map%20of%20registered%20services%20%20%20*%20@private%20%20%20*/%20%20private%20services:%20Map&lt;string,%20ServiceClient&lt;ServiceConfig&gt;&gt;%20=%20new%20Map();%20%20/**%20%20%20*%20Registers%20a%20new%20service%20with%20the%20manager%20%20%20*%20%20%20*%20@param%20{string}%20name%20-%20Unique%20service%20identifier%20%20%20*%20@param%20{ServiceClient&lt;ServiceConfig&gt;}%20service%20-%20Service%20instance%20%20%20*%20@throws%20{Error}%20If%20service%20name%20is%20already%20registered%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20manager.registerService(&#39;redis&#39;,%20new%20RedisService(config));%20%20%20*%20```%20%20%20*/%20%20registerService(name:%20string,%20service:%20ServiceClient&lt;ServiceConfig&gt;):%20void%20{%20%20%20%20if%20(this.services.has(name))%20{%20%20%20%20%20%20throw%20new%20Error(`Service"/>{name} is already registered`);
    }
    this.services.set(name, service);
    logger.info(`Service <img src="https://latex.codecogs.com/gif.latex?{name}%20registered`);%20%20}%20%20/**%20%20%20*%20Connects%20all%20enabled%20services%20%20%20*%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20%20%20*%20@throws%20{Error}%20If%20any%20service%20connection%20fails%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20try%20{%20%20%20*%20%20%20await%20manager.connectAll();%20%20%20*%20%20%20console.log(&#39;All%20services%20connected&#39;);%20%20%20*%20}%20catch%20(error)%20{%20%20%20*%20%20%20console.error(&#39;Service%20startup%20failed&#39;,%20error);%20%20%20*%20}%20%20%20*%20```%20%20%20*/%20%20async%20connectAll():%20Promise&lt;void&gt;%20{%20%20%20%20const%20services%20=%20Array.from(this.services.entries());%20%20%20%20for%20(const%20[name,%20service]%20of%20services)%20{%20%20%20%20%20%20if%20(!service.isEnabled())%20{%20%20%20%20%20%20%20%20logger.info(`Skipping%20disabled%20service:"/>{name}`);
        continue;
      }
  
      try {
        await service.connect();
        logger.info(`Successfully connected to <img src="https://latex.codecogs.com/gif.latex?{name}`);%20%20%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20%20%20logger.error(`Failed%20to%20connect%20to"/>{name}`, { error });
        throw error;
      }
    }
  }
  
  /**
   * Disconnects all services
   *
   * @returns {Promise<void>}
   * Continues even if individual services fail to disconnect
   *
   * @example
   * ```typescript
   * await manager.disconnectAll();
   * console.log('All services disconnected');
   * ```
   */
  async disconnectAll(): Promise<void> {
    const services = Array.from(this.services.entries());
  
    for (const [name, service] of services) {
      try {
        await service.disconnect();
        logger.info(`Successfully disconnected from <img src="https://latex.codecogs.com/gif.latex?{name}`);%20%20%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20%20%20logger.error(`Failed%20to%20disconnect%20from"/>{name}`, { error });
      }
    }
  }
  
  /**
   * Gets health status for all enabled services
   *
   * @returns {Promise<Record<string, boolean>>} Map of service names to health status
   *
   * @example
   * ```typescript
   * const status = await manager.getHealthStatus();
   * for (const [service, healthy] of Object.entries(status)) {
   *   console.log(`${service}: ${healthy ? 'healthy' : 'unhealthy'}`);
   * }
   * ```
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    const status: Record<string, boolean> = {};
  
    for (const [name, service] of this.services) {
      if (!service.isEnabled()) {
        continue;
      }
      status[name] = await service.isHealthy();
    }
  
    return status;
  }
}
  
```  
  
4. `qi/core/src/services/base/index.ts`
```ts
/**
 * @fileoverview Service base module exports
 * @module @qi/core/services/base
 *
 * @description
 * Exports all base service components including:
 * - Type definitions
 * - Base service client
 * - Service manager
 *
 * This module serves as the foundation for all service implementations
 * in the system.
 *
 * @example
 * ```typescript
 * import { BaseServiceClient, ServiceConfig, ServiceConnectionManager } from '@qi/core/services/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-04
 */
  
export * from "./types.js";
export * from "./client.js";
export * from "./manager.js";
  
```  
  
  
---
  
### `redis`
  
```ts
/**
 * @fileoverview Redis service implementation with full client compatibility
 * @module @qi/core/services/redis
 *
 * @description
 * Provides a Redis service implementation that wraps the ioredis client while
 * integrating with the service infrastructure. Key features include:
 * - Base service infrastructure integration
 * - Full compatibility with existing cache module
 * - Health monitoring and reporting
 * - Connection lifecycle management
 * - Event handling and logging
 * - Error handling with ApplicationError
 * - Password extraction from connection strings
 *
 * This service maintains API compatibility with modules that expect direct
 * Redis client access while providing additional service-level features.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection,
 *   options: {
 *     keyPrefix: 'app:',
 *     commandTimeout: 5000
 *   }
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * ```
 *
 * @example With Health Checks
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection,
 *   healthCheck: {
 *     enabled: true,
 *     interval: 30000,
 *     timeout: 5000,
 *     retries: 3
 *   }
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 * @modified 2024-12-05
 */
  
import { Redis } from "ioredis";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { RedisConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
  
/**
 * Redis service configuration interface
 *
 * @interface RedisServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {RedisConnection} connection - Redis connection configuration
 * @property {Object} [options] - Optional Redis-specific settings
 * @property {string} [options.keyPrefix] - Prefix for all Redis keys
 * @property {number} [options.commandTimeout] - Timeout for Redis commands in ms
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between checks in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for failed checks
 *
 * @example
 * ```typescript
 * const config: RedisServiceConfig = {
 *   enabled: true,
 *   connection: redisConnection,
 *   options: {
 *     keyPrefix: 'myapp:',
 *     commandTimeout: 5000
 *   },
 *   healthCheck: {
 *     enabled: true,
 *     interval: 30000,
 *     timeout: 5000,
 *     retries: 3
 *   }
 * };
 * ```
 */
interface RedisServiceConfig {
  enabled: boolean;
  connection: RedisConnection;
  options?: {
    keyPrefix?: string;
    commandTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}
  
/**
 * Redis service implementation that maintains compatibility with the Cache module
 * while providing service-level features.
 *
 * @class RedisService
 * @extends {BaseServiceClient<RedisServiceConfig>}
 *
 * @example
 * ```typescript
 * const service = new RedisService({
 *   enabled: true,
 *   connection: redisConnection
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * await client.set('key', 'value');
 * ```
 */
export class RedisService extends BaseServiceClient<RedisServiceConfig> {
  /**
   * Underlying Redis client instance
   * @private
   */
  private client: Redis | null = null;
  
  /**
   * Creates a new Redis service instance
   *
   * @param {RedisServiceConfig} config - Service configuration
   */
  constructor(config: RedisServiceConfig) {
    super(config, "Redis");
  }
  
  /**
   * Establishes connection to Redis server
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   *
   * @example
   * ```typescript
   * await service.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("Redis service is disabled");
      return;
    }
  
    try {
      this.client = new Redis({
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
        password: this.getPassword(),
        maxRetriesPerRequest: 3,
        keyPrefix: this.config.options?.keyPrefix,
        commandTimeout: this.config.options?.commandTimeout,
        retryStrategy: (times) => {
          const delay = Math.min(times * 1000, 3000);
          logger.debug("Redis retry", { attempt: times, delay });
          return delay;
        },
      });
  
      // Set up event handlers
      this.client.on("connect", () => {
        logger.info("Redis connected", {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        });
      });
  
      this.client.on("error", (error) => {
        logger.error("Redis error", {
          error: error.message,
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        });
      });
  
      await this.client.ping();
      this.setStatus(ServiceStatus.CONNECTED);
  
      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to Redis",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }
  
  /**
   * Gracefully disconnects from Redis server
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   *
   * @example
   * ```typescript
   * await service.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from Redis",
          ErrorCode.CONNECTION_ERROR,
          500,
          { error: String(error) }
        );
      }
    }
  }
  
  /**
   * Performs Redis health check
   *
   * @protected
   * @returns {Promise<HealthCheckResult>} Health check result
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.client) {
      return {
        status: "unhealthy",
        message: "Redis client not initialized",
        timestamp: new Date(),
      };
    }
  
    try {
      const isPing = (await this.client.ping()) === "PONG";
      return {
        status: isPing ? "healthy" : "unhealthy",
        message: isPing ? "Redis is responsive" : "Redis ping failed",
        details: {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: <img src="https://latex.codecogs.com/gif.latex?{error%20instanceof%20Error%20?%20error.message%20:%20String(error)}`,%20%20%20%20%20%20%20%20timestamp:%20new%20Date(),%20%20%20%20%20%20};%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Gets%20the%20Redis%20client%20instance%20%20%20*%20This%20method%20maintains%20compatibility%20with%20the%20Cache%20module%20%20%20*%20%20%20*%20@returns%20{Redis}%20Redis%20client%20instance%20%20%20*%20@throws%20{ApplicationError}%20If%20client%20is%20not%20initialized%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20const%20client%20=%20service.getClient();%20%20%20*%20await%20client.set(&#39;key&#39;,%20&#39;value&#39;);%20%20%20*%20```%20%20%20*/%20%20getClient():%20Redis%20{%20%20%20%20if%20(!this.client)%20{%20%20%20%20%20%20throw%20new%20ApplicationError(%20%20%20%20%20%20%20%20&quot;Redis%20client%20not%20initialized&quot;,%20%20%20%20%20%20%20%20ErrorCode.SERVICE_NOT_INITIALIZED,%20%20%20%20%20%20%20%20500%20%20%20%20%20%20);%20%20%20%20}%20%20%20%20return%20this.client;%20%20}%20%20/**%20%20%20*%20Extracts%20password%20from%20connection%20string%20or%20returns%20direct%20password%20%20%20*%20%20%20*%20@private%20%20%20*%20@returns%20{string}%20Redis%20password%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20//%20From%20connection%20string:%20redis://:password123@localhost:6379%20%20%20*%20const%20password%20=%20this.getPassword();%20//%20Returns%20&#39;password123&#39;%20%20%20*%20```%20%20%20*/%20%20private%20getPassword():%20string%20{%20%20%20%20const%20connectionString%20=%20this.config.connection.getConnectionString();%20%20%20%20try%20{%20%20%20%20%20%20const%20matches%20=%20connectionString.match(/redis:\/\/:([^@]+)@/);%20%20%20%20%20%20if%20(matches%20&amp;&amp;%20matches[1])%20{%20%20%20%20%20%20%20%20return%20decodeURIComponent(matches[1]);%20%20%20%20%20%20}%20%20%20%20%20%20const%20url%20=%20new%20URL(connectionString);%20%20%20%20%20%20if%20(url.password)%20{%20%20%20%20%20%20%20%20return%20decodeURIComponent(url.password);%20%20%20%20%20%20}%20%20%20%20%20%20return%20this.config.connection.getPassword();%20%20%20%20}%20catch%20{%20%20%20%20%20%20return%20this.config.connection.getPassword();%20%20%20%20}%20%20}}export%20default%20RedisService;```%20%20---###%20`timescaledb````ts%20%20%20/**%20*%20@fileoverview%20TimescaleDB%20service%20wrapper%20with%20Sequelize%20ORM%20integration%20*%20@module%20@qi/core/services/timescaledb%20*%20*%20@description%20*%20Provides%20a%20service%20wrapper%20around%20TimescaleDB%20using%20Sequelize%20ORM%20for:%20*%20-%20Database%20connection%20management%20*%20-%20Model%20synchronization%20*%20-%20Query%20interface%20*%20-%20Connection%20pooling%20*%20-%20Health%20monitoring%20*%20*%20Key%20features:%20*%20-%20Sequelize%20ORM%20integration%20*%20-%20Connection%20pool%20management%20*%20-%20Model%20synchronization%20options%20*%20-%20Health%20monitoring%20*%20-%20Configurable%20timeouts%20*%20-%20Detailed%20logging%20*%20*%20@example%20Basic%20Usage%20*%20```typescript%20*%20const%20service%20=%20new%20TimescaleDBService({%20*%20%20%20enabled:%20true,%20*%20%20%20connection:%20postgresConnection,%20*%20%20%20pool:%20{%20*%20%20%20%20%20max:%2020,%20*%20%20%20%20%20min:%205,%20*%20%20%20%20%20acquireTimeout:%2030000,%20*%20%20%20%20%20idleTimeout:%2010000%20*%20%20%20}%20*%20});%20*%20*%20await%20service.connect();%20*%20const%20sequelize%20=%20service.getSequelize();%20*%20```%20*%20*%20@example%20With%20Model%20Synchronization%20*%20```typescript%20*%20const%20service%20=%20new%20TimescaleDBService({%20*%20%20%20enabled:%20true,%20*%20%20%20connection:%20postgresConnection,%20*%20%20%20sync:%20{%20*%20%20%20%20%20force:%20false,%20*%20%20%20%20%20alter:%20true%20*%20%20%20}%20*%20});%20*%20```%20*%20*%20@author%20Zhifeng%20Zhang%20*%20@created%202024-12-03%20*%20@modified%202024-12-05%20*/import%20{%20Sequelize,%20Options%20as%20SequelizeOptions%20}%20from%20&quot;sequelize&quot;;import%20{%20BaseServiceClient%20}%20from%20&quot;../base/client.js&quot;;import%20{%20HealthCheckResult,%20ServiceStatus%20}%20from%20&quot;../base/types.js&quot;;import%20type%20{%20PostgresConnection%20}%20from%20&quot;@qi/core/services/config&quot;;import%20{%20logger%20}%20from%20&quot;@qi/core/logger&quot;;import%20{%20ApplicationError,%20ErrorCode%20}%20from%20&quot;@qi/core/errors&quot;;/**%20*%20TimescaleDB%20service%20configuration%20interface%20*%20*%20@interface%20TimescaleDBServiceConfig%20*%20*%20@property%20{boolean}%20enabled%20-%20Whether%20the%20service%20is%20enabled%20*%20@property%20{PostgresConnection}%20connection%20-%20Database%20connection%20configuration%20*%20@property%20{Object}%20pool%20-%20Connection%20pool%20settings%20*%20@property%20{number}%20pool.max%20-%20Maximum%20number%20of%20connections%20in%20pool%20*%20@property%20{number}%20pool.min%20-%20Minimum%20number%20of%20connections%20in%20pool%20*%20@property%20{number}%20pool.acquireTimeout%20-%20Maximum%20time%20(ms)%20to%20acquire%20connection%20*%20@property%20{number}%20pool.idleTimeout%20-%20Maximum%20time%20(ms)%20connection%20can%20be%20idle%20*%20@property%20{number}%20[pool.connectionTimeoutMillis]%20-%20Connection%20timeout%20in%20milliseconds%20*%20@property%20{number}%20[pool.statementTimeout]%20-%20Statement%20timeout%20in%20milliseconds%20*%20@property%20{number}%20[pool.idleInTransactionSessionTimeout]%20-%20Transaction%20idle%20timeout%20*%20@property%20{Object}%20[healthCheck]%20-%20Health%20check%20configuration%20*%20@property%20{boolean}%20healthCheck.enabled%20-%20Whether%20health%20checks%20are%20enabled%20*%20@property%20{number}%20healthCheck.interval%20-%20Interval%20between%20checks%20in%20ms%20*%20@property%20{number}%20healthCheck.timeout%20-%20Health%20check%20timeout%20in%20ms%20*%20@property%20{number}%20healthCheck.retries%20-%20Number%20of%20retries%20for%20failed%20checks%20*%20@property%20{Object}%20[sync]%20-%20Model%20synchronization%20options%20*%20@property%20{boolean}%20[sync.force]%20-%20Drop%20tables%20before%20sync%20*%20@property%20{boolean}%20[sync.alter]%20-%20Alter%20tables%20to%20fit%20models%20*/interface%20TimescaleDBServiceConfig%20{%20%20enabled:%20boolean;%20%20connection:%20PostgresConnection;%20%20pool:%20{%20%20%20%20max:%20number;%20%20%20%20min:%20number;%20%20%20%20acquireTimeout:%20number;%20%20%20%20idleTimeout:%20number;%20%20%20%20connectionTimeoutMillis?:%20number;%20%20%20%20statementTimeout?:%20number;%20%20%20%20idleInTransactionSessionTimeout?:%20number;%20%20};%20%20healthCheck?:%20{%20%20%20%20enabled:%20boolean;%20%20%20%20interval:%20number;%20%20%20%20timeout:%20number;%20%20%20%20retries:%20number;%20%20};%20%20sync?:%20{%20%20%20%20force?:%20boolean;%20%20%20%20alter?:%20boolean;%20%20};}/**%20*%20TimescaleDB%20service%20implementation%20providing%20Sequelize%20ORM%20integration%20*%20and%20health%20monitoring%20capabilities.%20*%20*%20@class%20TimescaleDBService%20*%20@extends%20{BaseServiceClient&lt;TimescaleDBServiceConfig&gt;}%20*/export%20class%20TimescaleDBService%20extends%20BaseServiceClient&lt;TimescaleDBServiceConfig&gt;%20{%20%20/**%20%20%20*%20Sequelize%20instance%20for%20database%20operations%20%20%20*%20@private%20%20%20*/%20%20private%20sequelize:%20Sequelize%20|%20null%20=%20null;%20%20/**%20%20%20*%20Creates%20a%20new%20TimescaleDB%20service%20instance%20%20%20*%20%20%20*%20@param%20{TimescaleDBServiceConfig}%20config%20-%20Service%20configuration%20%20%20*/%20%20constructor(config:%20TimescaleDBServiceConfig)%20{%20%20%20%20super(config,%20&quot;TimescaleDB&quot;);%20%20}%20%20/**%20%20%20*%20Establishes%20database%20connection%20and%20initializes%20Sequelize%20%20%20*%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20%20%20*%20@throws%20{ApplicationError}%20If%20connection%20fails%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20await%20service.connect();%20%20%20*%20```%20%20%20*/%20%20async%20connect():%20Promise&lt;void&gt;%20{%20%20%20%20if%20(!this.isEnabled())%20{%20%20%20%20%20%20logger.info(&quot;TimescaleDB%20service%20is%20disabled&quot;);%20%20%20%20%20%20return;%20%20%20%20}%20%20%20%20try%20{%20%20%20%20%20%20const%20sequelizeOptions%20=%20this.createSequelizeOptions();%20%20%20%20%20%20this.sequelize%20=%20new%20Sequelize(sequelizeOptions);%20%20%20%20%20%20//%20Test%20connection%20%20%20%20%20%20await%20this.sequelize.authenticate();%20%20%20%20%20%20logger.info(&quot;TimescaleDB%20connection%20established&quot;);%20%20%20%20%20%20//%20Sync%20models%20if%20configured%20%20%20%20%20%20if%20(this.config.sync)%20{%20%20%20%20%20%20%20%20await%20this.sequelize.sync(this.config.sync);%20%20%20%20%20%20%20%20logger.info(&quot;TimescaleDB%20models%20synchronized&quot;,%20this.config.sync);%20%20%20%20%20%20}%20%20%20%20%20%20this.setStatus(ServiceStatus.CONNECTED);%20%20%20%20%20%20if%20(this.config.healthCheck?.enabled)%20{%20%20%20%20%20%20%20%20await%20this.startHealthCheck();%20%20%20%20%20%20}%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20this.setStatus(ServiceStatus.ERROR);%20%20%20%20%20%20throw%20new%20ApplicationError(%20%20%20%20%20%20%20%20&quot;Failed%20to%20connect%20to%20TimescaleDB&quot;,%20%20%20%20%20%20%20%20ErrorCode.CONNECTION_ERROR,%20%20%20%20%20%20%20%20500,%20%20%20%20%20%20%20%20{%20error:%20String(error)%20}%20%20%20%20%20%20);%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Closes%20database%20connection%20and%20performs%20cleanup%20%20%20*%20%20%20*%20@returns%20{Promise&lt;void&gt;}%20%20%20*%20@throws%20{ApplicationError}%20If%20disconnection%20fails%20%20%20*%20%20%20*%20@example%20%20%20*%20```typescript%20%20%20*%20await%20service.disconnect();%20%20%20*%20```%20%20%20*/%20%20async%20disconnect():%20Promise&lt;void&gt;%20{%20%20%20%20if%20(this.sequelize)%20{%20%20%20%20%20%20try%20{%20%20%20%20%20%20%20%20await%20this.sequelize.close();%20%20%20%20%20%20%20%20this.sequelize%20=%20null;%20%20%20%20%20%20%20%20this.setStatus(ServiceStatus.DISCONNECTED);%20%20%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20%20%20this.setStatus(ServiceStatus.ERROR);%20%20%20%20%20%20%20%20throw%20new%20ApplicationError(%20%20%20%20%20%20%20%20%20%20&quot;Failed%20to%20disconnect%20from%20TimescaleDB&quot;,%20%20%20%20%20%20%20%20%20%20ErrorCode.CONNECTION_ERROR,%20%20%20%20%20%20%20%20%20%20500,%20%20%20%20%20%20%20%20%20%20{%20error:%20String(error)%20}%20%20%20%20%20%20%20%20);%20%20%20%20%20%20}%20%20%20%20}%20%20}%20%20/**%20%20%20*%20Performs%20health%20check%20on%20the%20database%20connection%20%20%20*%20%20%20*%20@protected%20%20%20*%20@returns%20{Promise&lt;HealthCheckResult&gt;}%20%20%20*/%20%20protected%20async%20checkHealth():%20Promise&lt;HealthCheckResult&gt;%20{%20%20%20%20if%20(!this.sequelize)%20{%20%20%20%20%20%20return%20{%20%20%20%20%20%20%20%20status:%20&quot;unhealthy&quot;,%20%20%20%20%20%20%20%20message:%20&quot;TimescaleDB%20connection%20not%20initialized&quot;,%20%20%20%20%20%20%20%20timestamp:%20new%20Date(),%20%20%20%20%20%20};%20%20%20%20}%20%20%20%20try%20{%20%20%20%20%20%20await%20this.sequelize.authenticate();%20%20%20%20%20%20return%20{%20%20%20%20%20%20%20%20status:%20&quot;healthy&quot;,%20%20%20%20%20%20%20%20message:%20&quot;TimescaleDB%20is%20responsive&quot;,%20%20%20%20%20%20%20%20details:%20{%20%20%20%20%20%20%20%20%20%20database:%20this.config.connection.getDatabase(),%20%20%20%20%20%20%20%20%20%20host:%20this.config.connection.getHost(),%20%20%20%20%20%20%20%20%20%20port:%20this.config.connection.getPort(),%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20timestamp:%20new%20Date(),%20%20%20%20%20%20};%20%20%20%20}%20catch%20(error)%20{%20%20%20%20%20%20return%20{%20%20%20%20%20%20%20%20status:%20&quot;unhealthy&quot;,%20%20%20%20%20%20%20%20message:%20`Health%20check%20failed:"/>{error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Gets the Sequelize instance for database operations
   *
   * @returns {Sequelize} Sequelize instance
   * @throws {ApplicationError} If Sequelize is not initialized
   *
   * @example
   * ```typescript
   * const sequelize = service.getSequelize();
   * const users = await sequelize.model('User').findAll();
   * ```
   */
  getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new ApplicationError(
        "TimescaleDB connection not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.sequelize;
  }
  
  /**
   * Creates Sequelize configuration options from service config
   *
   * @private
   * @returns {SequelizeOptions} Sequelize configuration options
   */
  private createSequelizeOptions(): SequelizeOptions {
    const conn = this.config.connection;
    return {
      dialect: "postgres",
      host: conn.getHost(),
      port: conn.getPort(),
      database: conn.getDatabase(),
      username: conn.getUser(),
      password: conn.getPassword(),
      logging: (msg: string) => logger.debug(msg),
      pool: {
        max: this.config.pool.max,
        min: this.config.pool.min,
        acquire: this.config.pool.acquireTimeout,
        idle: this.config.pool.idleTimeout,
      },
      dialectOptions: {
        connectTimeout: this.config.pool.connectionTimeoutMillis,
        statement_timeout: this.config.pool.statementTimeout,
        idle_in_transaction_session_timeout:
          this.config.pool.idleInTransactionSessionTimeout,
      },
    };
  }
}
  
export default TimescaleDBService;
  
```  
  
---
  
### `redpaanda`
  
```ts
/**
 * @fileoverview RedPanda service wrapper with Kafka protocol support
 * @module @qi/core/services/redpanda
 *
 * @description
 * Provides a service wrapper around RedPanda using the Kafka protocol for:
 * - Message production and consumption
 * - Topic management
 * - Consumer group coordination
 * - Schema registry integration
 * - Health monitoring
 *
 * Key features:
 * - Full Kafka protocol compatibility
 * - Consumer group management
 * - Configurable compression
 * - Batch processing
 * - Schema registry support
 * - Health monitoring
 *
 * Configuration is handled through the standard service configuration system,
 * utilizing the KafkaConnection interface which extends MessageQueueConnection.
 *
 * @example Basic Usage
 * ```typescript
 * const service = new RedPandaService({
 *   enabled: true,
 *   connection: redpandaConnection,
 *   clientId: 'my-service',
 *   consumer: {
 *     groupId: 'my-consumer-group',
 *     sessionTimeout: 30000
 *   }
 * });
 *
 * await service.connect();
 * const producer = service.getProducer();
 * const consumer = service.getConsumer();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */
  
import {
  Kafka,
  Producer,
  Consumer,
  KafkaConfig,
  ConsumerConfig,
  ProducerConfig,
  SASLOptions,
  Mechanism,
} from "kafkajs";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import { MessageQueueConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
  
/**
 * Extended Kafka connection interface for RedPanda configuration
 *
 * @interface KafkaConnection
 * @extends {MessageQueueConnection}
 *
 * @property {function} getBrokers - Returns array of broker addresses
 * @property {function} getSSLConfig - Returns SSL configuration
 * @property {function} getSASLConfig - Returns SASL authentication configuration
 * @property {function} getConnectionTimeout - Returns connection timeout in ms
 * @property {function} getRequestTimeout - Returns request timeout in ms
 */
interface KafkaConnection extends MessageQueueConnection {
  getBrokers(): string[];
  getSSLConfig(): Record<string, unknown>;
  getSASLConfig(): SASLOptions | Mechanism | undefined;
  getConnectionTimeout(): number;
  getRequestTimeout(): number;
}
  
/**
 * Message content interface for producing messages
 *
 * @interface MessageContent
 * @property {string} [key] - Optional message key for partitioning
 * @property {string | Buffer} value - Message content as string or buffer
 */
interface MessageContent {
  key?: string;
  value: string | Buffer;
}
  
/**
 * RedPanda service configuration interface
 *
 * @interface RedPandaServiceConfig
 * @property {boolean} enabled - Whether the service is enabled
 * @property {KafkaConnection} connection - RedPanda/Kafka connection configuration
 * @property {string} clientId - Unique identifier for this client
 * @property {Object} [consumer] - Consumer configuration
 * @property {string} consumer.groupId - Consumer group identifier
 * @property {number} [consumer.sessionTimeout] - Session timeout in ms
 * @property {number} [consumer.rebalanceTimeout] - Rebalance timeout in ms
 * @property {number} [consumer.heartbeatInterval] - Heartbeat interval in ms
 * @property {number} [consumer.maxBytesPerPartition] - Max bytes per partition
 * @property {number} [consumer.maxWaitTimeInMs] - Max wait time for fetch requests
 * @property {Object} [producer] - Producer configuration
 * @property {number} [producer.acks] - Required acks for produced messages
 * @property {CompressionTypes} [producer.compression] - Message compression type
 * @property {number} [producer.maxBatchSize] - Maximum size of message batches
 * @property {boolean} [producer.allowAutoTopicCreation] - Auto create topics
 * @property {number} [producer.transactionTimeout] - Transaction timeout in ms
 * @property {boolean} [producer.idempotent] - Enable idempotent producer
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Enable health checks
 * @property {number} healthCheck.interval - Health check interval in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for health checks
 */
interface RedPandaServiceConfig {
  enabled: boolean;
  connection: KafkaConnection;
  clientId: string;
  consumer?: {
    groupId: string;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
    maxBytesPerPartition?: number;
    maxWaitTimeInMs?: number;
  };
  producer?: {
    allowAutoTopicCreation?: boolean;
    maxInFlightRequests?: number;
    idempotent?: boolean;
    transactionalId?: string;
    transactionTimeout?: number;
    metadataMaxAge?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}
  
/**
 * RedPanda service implementation providing Kafka protocol compatibility
 * and message streaming capabilities.
 *
 * @class RedPandaService
 * @extends {BaseServiceClient<RedPandaServiceConfig>}
 */
export class RedPandaService extends BaseServiceClient<RedPandaServiceConfig> {
  /**
   * Kafka client instance
   * @private
   */
  private kafka: Kafka | null = null;
  
  /**
   * Kafka producer instance
   * @private
   */
  private producer: Producer | null = null;
  
  /**
   * Kafka consumer instance
   * @private
   */
  private consumer: Consumer | null = null;
  
  /**
   * Default producer configuration
   * @private
   */
  private readonly defaultProducerConfig: ProducerConfig = {
    allowAutoTopicCreation: true,
    maxInFlightRequests: 5,
    idempotent: false,
  };
  
  /**
   * Default consumer configuration
   * @private
   */
  private readonly defaultConsumerConfig: Partial<ConsumerConfig> = {
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    maxWaitTimeInMs: 5000,
  };
  
  /**
   * Creates a new RedPanda service instance
   * @param {RedPandaServiceConfig} config - Service configuration
   */
  constructor(config: RedPandaServiceConfig) {
    super(config, "RedPanda");
  }
  
  /**
   * Establishes connections to RedPanda cluster
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("RedPanda service is disabled");
      return;
    }
  
    try {
      const kafkaConfig = this.createKafkaConfig();
      this.kafka = new Kafka(kafkaConfig);
  
      // Initialize and connect producer
      this.producer = this.kafka.producer(this.createProducerConfig());
      await this.producer.connect();
      logger.info("RedPanda producer connected", {
        clientId: this.config.clientId,
        endpoint: this.config.connection.getBrokerEndpoint(),
      });
  
      // Initialize and connect consumer if configured
      if (this.config.consumer?.groupId) {
        this.consumer = this.kafka.consumer(this.createConsumerConfig());
        await this.consumer.connect();
        logger.info("RedPanda consumer connected", {
          groupId: this.config.consumer.groupId,
          clientId: this.config.clientId,
        });
      }
  
      this.setStatus(ServiceStatus.CONNECTED);
  
      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to RedPanda",
        ErrorCode.MESSAGE_QUEUE_ERROR,
        500,
        { error: String(error) }
      );
    }
  }
  
  /**
   * Closes all connections and performs cleanup
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   */
  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }
  
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }
  
      this.kafka = null;
      this.setStatus(ServiceStatus.DISCONNECTED);
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to disconnect from RedPanda",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }
  
  /**
   * Performs health check on RedPanda connections
   * @returns {Promise<HealthCheckResult>}
   * @protected
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.kafka) {
      return {
        status: "unhealthy",
        message: "RedPanda client not initialized",
        timestamp: new Date(),
      };
    }
  
    try {
      const admin = this.kafka.admin();
      await admin.listTopics();
      await admin.disconnect();
  
      return {
        status: "healthy",
        message: "RedPanda is responsive",
        details: {
          brokerEndpoint: this.config.connection.getBrokerEndpoint(),
          schemaRegistryEndpoint:
            this.config.connection.getSchemaRegistryEndpoint(),
          clientId: this.config.clientId,
          producerConnected: Boolean(this.producer),
          consumerConnected: Boolean(this.consumer),
          consumerGroupId: this.config.consumer?.groupId,
          brokerId: this.config.connection.getBrokerId(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }
  
  /**
   * Gets the Kafka producer instance
   * @returns {Producer}
   * @throws {ApplicationError} If producer is not initialized
   */
  getProducer(): Producer {
    if (!this.producer) {
      throw new ApplicationError(
        "RedPanda producer not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.producer;
  }
  
  /**
   * Gets the Kafka consumer instance
   * @returns {Consumer}
   * @throws {ApplicationError} If consumer is not initialized
   */
  getConsumer(): Consumer {
    if (!this.consumer) {
      throw new ApplicationError(
        "RedPanda consumer not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.consumer;
  }
  
  /**
   * Creates Kafka client configuration
   * @returns {KafkaConfig}
   * @private
   */
  private createKafkaConfig(): KafkaConfig {
    return {
      clientId: this.config.clientId,
      brokers: [this.config.connection.getBrokerEndpoint()],
      ssl: this.config.connection.getSSLConfig(),
      sasl: this.config.connection.getSASLConfig(),
      connectionTimeout: this.config.connection.getConnectionTimeout(),
      requestTimeout: this.config.connection.getRequestTimeout(),
    };
  }
  
  /**
   * Creates producer configuration
   * @returns {ProducerConfig}
   * @private
   */
  private createProducerConfig(): ProducerConfig {
    // Only include properties that exist in ProducerConfig
    const config: ProducerConfig = {
      allowAutoTopicCreation:
        this.config.producer?.allowAutoTopicCreation ??
        this.defaultProducerConfig.allowAutoTopicCreation,
      maxInFlightRequests: this.defaultProducerConfig.maxInFlightRequests,
      idempotent:
        this.config.producer?.idempotent ??
        this.defaultProducerConfig.idempotent,
    };
  
    return config;
  }
  
  /**
   * Creates consumer configuration
   * @returns {ConsumerConfig}
   * @throws {ApplicationError} If consumer group ID is missing
   * @private
   */
  private createConsumerConfig(): ConsumerConfig {
    if (!this.config.consumer?.groupId) {
      throw new ApplicationError(
        "Consumer group ID is required",
        ErrorCode.REDPANDA_CONFIG_INVALID,
        500
      );
    }
  
    return {
      ...this.defaultConsumerConfig,
      ...this.config.consumer,
      groupId: this.config.consumer.groupId, // Ensure groupId is applied last
    };
  }
  
  /**
   * Subscribes to specified topics
   * @param {string[]} topics - Array of topics to subscribe to
   * @returns {Promise<void>}
   * @throws {ApplicationError} If subscription fails
   */
  async subscribe(topics: string[]): Promise<void> {
    const consumer = this.getConsumer();
    try {
      await Promise.all(
        topics.map((topic) =>
          consumer.subscribe({ topic, fromBeginning: false })
        )
      );
      logger.info("Subscribed to topics", { topics });
    } catch (error) {
      throw new ApplicationError(
        "Failed to subscribe to topics",
        ErrorCode.OPERATION_ERROR,
        500,
        { error: String(error), topics }
      );
    }
  }
  
  /**
   * Sends messages to specified topic
   * @param {string} topic - Topic to send message to
   * @param {MessageContent[]} messages - Array of messages to send
   * @param {number} [partition] - Optional partition number
   * @returns {Promise<void>}
   * @throws {ApplicationError} If sending fails
   */
  async send(
    topic: string,
    messages: MessageContent[],
    partition?: number
  ): Promise<void> {
    const producer = this.getProducer();
    try {
      await producer.send({
        topic,
        messages: messages.map((msg) => ({
          partition,
          key: msg.key,
          value: msg.value,
        })),
      });
    } catch (error) {
      throw new ApplicationError(
        "Failed to send messages",
        ErrorCode.OPERATION_ERROR,
        500,
        { error: String(error), topic }
      );
    }
  }
}
  
export default RedPandaService;
  
```  
  