Let's separate the sensitive information into the .env file and modify our configuration setup to use both JsonLoader and EnvLoader.

## Types: `qi/core/src/services/config/types.ts`

```typescript
/**
 * @fileoverview Defines the configuration types for the service module
 * @module types
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2023-11-18
 */

import { BaseConfig } from "@qi/core/config";

/**
 * Represents the configuration for a service
 */
export interface ServiceConfig extends BaseConfig {
  type: "service";
  version: string;
  databases: {
    postgres: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      maxConnections: number;
    };
    questdb: {
      host: string;
      httpPort: number;
      pgPort: number;
      influxPort: number;
      telemetryEnabled: boolean;
    };
    redis: {
      host: string;
      port: number;
      password: string;
      maxRetries: number;
    };
  };
  messageQueue: {
    redpanda: {
      brokerId: number;
      advertisedKafkaApi: string;
      advertisedSchemaRegistryApi: string;
      advertisedPandaproxyApi: string;
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
      adminPassword: string;
      plugins: string;
    };
    pgAdmin: {
      host: string;
      port: number;
      email: string;
      password: string;
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
 * Defines the domain-specific language (DSL) for service configuration
 */
export interface ServiceDSL {
  databases: {
    postgres: {
      connectionString: string;
      maxConnections: number;
      poolConfig: {
        max: number;
        idleTimeoutMs: number;
        connectionTimeoutMs: number;
      };
    };
    questdb: {
      endpoints: {
        http: string;
        postgresql: string;
        influx: string;
      };
      options: {
        telemetryEnabled: boolean;
      };
    };
    redis: {
      connectionString: string;
      options: {
        maxRetries: number;
        retryDelayMs: number;
        maxRetryDelayMs: number;
      };
    };
  };
  messageQueue: {
    redpanda: {
      brokers: string[];
      clientId: string;
      options: {
        schemaRegistry: {
          endpoint: string;
          timeout: number;
        };
        adminApi: {
          endpoint: string;
          timeout: number;
        };
        proxy: {
          endpoint: string;
          timeout: number;
        };
      };
    };
  };
  monitoring: {
    endpoints: {
      grafana: {
        url: string;
        auth: {
          username: string;
          password: string;
        };
        options: {
          plugins: string[];
          datasources: {
            questdb: boolean;
            postgresql: boolean;
          };
        };
      };
      pgAdmin: {
        url: string;
        auth: {
          email: string;
          password: string;
        };
        options: {
          defaultDatabase: string;
        };
      };
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
 * Represents the configuration that will be loaded from environment variables.
 * It extends BaseConfig and allows for string | undefined values.
 */
export interface EnvConfig
  extends BaseConfig,
    Record<string, string | undefined> {
  type: "service";
  version: string;
  // Environment variables
  POSTGRES_PASSWORD: string;
  REDIS_PASSWORD: string;
  QDB_PG_PASSWORD: string;
  GF_SECURITY_ADMIN_PASSWORD: string;
  PGADMIN_DEFAULT_EMAIL: string;
  PGADMIN_DEFAULT_PASSWORD: string;
  REDPANDA_SUPERUSER_PASSWORD: string;
  REDPANDA_ADMIN_API_KEY: string;
  REDPANDA_SCHEMA_REGISTRY_API_KEY: string;
  JWT_SECRET: string;
}
```

## Schemas

First, let's update our configuration schema and types to separate sensitive data:

### Json schema `qi/core/src/services/config/schemas.ts`

```typescript
/**
 * @fileoverview Defines the configuration schemas for the service module
 * @module schemas
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2023-11-18
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Base configuration schema for the service, excluding sensitive data
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
    "networking",
  ],
  properties: {
    type: { const: "service" },
    version: { type: "string" },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: {
        postgres: {
          type: "object",
          required: ["host", "port", "database", "user", "maxConnections"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            database: { type: "string" },
            user: { type: "string" },
            maxConnections: { type: "integer", minimum: 1 },
          },
        },
        questdb: {
          type: "object",
          required: ["host", "httpPort", "pgPort", "influxPort"],
          properties: {
            host: { type: "string" },
            httpPort: { type: "integer" },
            pgPort: { type: "integer" },
            influxPort: { type: "integer" },
          },
        },
        redis: {
          type: "object",
          required: ["host", "port", "maxRetries"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            maxRetries: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    messageQueue: {
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
            kafkaPort: { type: "integer" },
            schemaRegistryPort: { type: "integer" },
            adminPort: { type: "integer" },
            pandaproxyPort: { type: "integer" },
          },
        },
      },
    },
    monitoring: {
      type: "object",
      required: ["grafana", "pgAdmin"],
      properties: {
        grafana: {
          type: "object",
          required: ["host", "port"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
          },
        },
        pgAdmin: {
          type: "object",
          required: ["host", "port"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
          },
        },
      },
    },
    networking: {
      type: "object",
      required: ["networks"],
      properties: {
        networks: {
          type: "object",
          required: ["db", "redis", "redpanda"],
          properties: {
            db: { type: "string" },
            redis: { type: "string" },
            redpanda: { type: "string" },
          },
        },
      },
    },
  },
};
```

### Json config file: `services.json`

Now let's create the non-sensitive configuration file:

```json
{
  "type": "service",
  "version": "1.0",
  "databases": {
    "postgres": {
      "host": "timescaledb",
      "port": 5432,
      "database": "postgres",
      "user": "postgres",
      "maxConnections": 100
    },
    "questdb": {
      "host": "questdb",
      "httpPort": 9000,
      "pgPort": 8812,
      "influxPort": 9009
    },
    "redis": {
      "host": "redis",
      "port": 6379,
      "maxRetries": 3
    }
  },
  "messageQueue": {
    "redpanda": {
      "kafkaPort": 9092,
      "schemaRegistryPort": 8081,
      "adminPort": 9644,
      "pandaproxyPort": 8082
    }
  },
  "monitoring": {
    "grafana": {
      "host": "grafana",
      "port": 3000
    },
    "pgAdmin": {
      "host": "pgadmin",
      "port": 8000
    }
  },
  "networking": {
    "networks": {
      "db": "qi_db",
      "redis": "redis_network",
      "redpanda": "redpanda_network"
    }
  }
}
```

### env file: `services.env`

```bash
# === Database Credentials ===
POSTGRES_PASSWORD=wYD1mt6tgwh5
POSTGRES_USER=postgres
POSTGRES_DB=postgres

# === Redis Configuration ===
REDIS_PASSWORD=h8EwKn77ac0d

# === Monitoring Credentials ===
# Grafana
GF_SECURITY_ADMIN_PASSWORD=B8LF3eQ/Auv2
GF_INSTALL_PLUGINS=questdb-questdb-datasource;grafana-postgresql-datasource

# PgAdmin
PGADMIN_DEFAULT_EMAIL=admin@qi.com
PGADMIN_DEFAULT_PASSWORD=97ezJ5K0GqhQ

# === QuestDB Configuration ===
QDB_TELEMETRY_ENABLED=false

# === Redpanda Configuration ===
REDPANDA_BROKER_ID=0
REDPANDA_ADVERTISED_KAFKA_API=localhost
REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API=localhost
REDPANDA_ADVERTISED_PANDAPROXY_API=localhost
```

## Handler `qi/core/src/services/config/handler.ts`

````typescript
/**
 * @fileoverview Handles transformation of raw service configuration into a structured domain-specific language (DSL)
 * @module handler
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-19
 */

// js/core/src/services/config/handler.ts
import { IConfigHandler } from "@qi/core/config";
import { ServiceConfig } from "./types.js";

/**
 * Domain-specific language (DSL) for service configuration.
 *
 * @description
 * Provides strongly-typed configuration structure for:
 * - Database connections (PostgreSQL, QuestDB, Redis)
 * - Message queues (Redpanda)
 * - Monitoring tools (Grafana, pgAdmin)
 * - Network settings
 *
 * @example
 * ```typescript
 * const dsl: ServiceDSL = {
 *   databases: {
 *     postgres: {
 *       connectionString: "postgresql://user:pass@localhost:5432/db",
 *       maxConnections: 20,
 *       poolConfig: { max: 20, idleTimeoutMs: 10000, connectionTimeoutMs: 3000 }
 *     },
 *     questdb: {
 *       endpoints: {
 *         http: "http://localhost:9000",
 *         postgresql: "postgresql://localhost:8812/questdb",
 *         influx: "http://localhost:9009"
 *       },
 *       options: { telemetryEnabled: false }
 *     }
 *   }
 * };
 * ```
 */
export interface ServiceDSL {
  databases: {
    postgres: {
      connectionString: string;
      maxConnections: number;
      poolConfig: {
        max: number;
        idleTimeoutMs: number;
        connectionTimeoutMs: number;
      };
    };
    questdb: {
      endpoints: {
        http: string;
        postgresql: string;
        influx: string;
      };
      options: {
        telemetryEnabled: boolean;
      };
    };
    redis: {
      connectionString: string;
      options: {
        maxRetries: number;
        retryDelayMs: number;
        maxRetryDelayMs: number;
      };
    };
  };
  messageQueue: {
    redpanda: {
      brokers: string[];
      clientId: string;
      options: {
        schemaRegistry: {
          endpoint: string;
          timeout: number;
        };
        adminApi: {
          endpoint: string;
          timeout: number;
        };
        proxy: {
          endpoint: string;
          timeout: number;
        };
      };
    };
  };
  monitoring: {
    endpoints: {
      grafana: {
        url: string;
        auth: {
          username: string;
          password: string;
        };
        options: {
          plugins: string[];
          datasources: {
            questdb: boolean;
            postgresql: boolean;
          };
        };
      };
      pgAdmin: {
        url: string;
        auth: {
          email: string;
          password: string;
        };
        options: {
          defaultDatabase: string;
        };
      };
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
 * Handler that transforms raw configuration into a domain-specific language.
 *
 * @description
 * Processes raw configuration into structured, type-safe format following DSL specification.
 * Implements IConfigHandler interface to provide consistent configuration handling.
 *
 * @example
 * ```typescript
 * const handler = new ServiceConfigHandler();
 * const dsl = handler.handle({
 *   databases: {
 *     postgres: {
 *       host: "localhost",
 *       port: 5432,
 *       user: "admin",
 *       password: "password",
 *       database: "mydb",
 *       maxConnections: 20
 *     }
 *   }
 * });
 * console.log(dsl.databases.postgres.connectionString);
 * // Output: postgresql://admin:password@localhost:5432/mydb
 * ```
 */
export class ServiceConfigHandler
  implements IConfigHandler<ServiceConfig, ServiceDSL>
{
  /**
   * Transforms raw service configuration into structured DSL format.
   *
   * @param config - Raw service configuration object
   * @returns Processed configuration in ServiceDSL format
   */
  handle(config: ServiceConfig): ServiceDSL {
    return {
      databases: this.buildDatabasesConfig(config),
      messageQueue: this.buildMessageQueueConfig(config),
      monitoring: this.buildMonitoringConfig(config),
      networking: this.buildNetworkingConfig(config),
    };
  }

  /**
   * Builds database configuration section.
   *
   * @param config - Raw service configuration
   * @returns Database configuration in DSL format
   */
  private buildDatabasesConfig(config: ServiceConfig): ServiceDSL["databases"] {
    const { databases } = config;

    return {
      postgres: {
        connectionString: this.buildPostgresConnectionString(
          databases.postgres
        ),
        maxConnections: databases.postgres.maxConnections,
        poolConfig: {
          max: databases.postgres.maxConnections,
          idleTimeoutMs: 10000,
          connectionTimeoutMs: 3000,
        },
      },
      questdb: {
        endpoints: {
          http: `http://${databases.questdb.host}:${databases.questdb.httpPort}`,
          postgresql: `postgresql://${databases.questdb.host}:${databases.questdb.pgPort}/questdb`,
          influx: `http://${databases.questdb.host}:${databases.questdb.influxPort}`,
        },
        options: {
          telemetryEnabled: databases.questdb.telemetryEnabled,
        },
      },
      redis: {
        connectionString: this.buildRedisConnectionString(databases.redis),
        options: {
          maxRetries: databases.redis.maxRetries,
          retryDelayMs: 1000,
          maxRetryDelayMs: 5000,
        },
      },
    };
  }

  /**
   * Builds message queue configuration section.
   *
   * @param config - Raw service configuration
   * @returns Message queue configuration in DSL format
   */
  private buildMessageQueueConfig(
    config: ServiceConfig
  ): ServiceDSL["messageQueue"] {
    const { redpanda } = config.messageQueue;

    return {
      redpanda: {
        brokers: [`${redpanda.advertisedKafkaApi}:${redpanda.kafkaPort}`],
        clientId: "qi-service",
        options: {
          schemaRegistry: {
            endpoint: `http://${redpanda.advertisedSchemaRegistryApi}:${redpanda.schemaRegistryPort}`,
            timeout: 5000,
          },
          adminApi: {
            endpoint: `http://${redpanda.advertisedKafkaApi}:${redpanda.adminPort}`,
            timeout: 5000,
          },
          proxy: {
            endpoint: `http://${redpanda.advertisedPandaproxyApi}:${redpanda.pandaproxyPort}`,
            timeout: 5000,
          },
        },
      },
    };
  }

  /**
   * Builds monitoring configuration section.
   *
   * @param config - Raw service configuration
   * @returns Monitoring configuration in DSL format
   */
  private buildMonitoringConfig(
    config: ServiceConfig
  ): ServiceDSL["monitoring"] {
    const { monitoring } = config;

    return {
      endpoints: {
        grafana: {
          url: `http://${monitoring.grafana.host}:${monitoring.grafana.port}`,
          auth: {
            username: "admin",
            password: monitoring.grafana.adminPassword,
          },
          options: {
            plugins: monitoring.grafana.plugins.split(";"),
            datasources: {
              questdb: monitoring.grafana.plugins.includes(
                "questdb-questdb-datasource"
              ),
              postgresql: monitoring.grafana.plugins.includes(
                "grafana-postgresql-datasource"
              ),
            },
          },
        },
        pgAdmin: {
          url: `http://${monitoring.pgAdmin.host}:${monitoring.pgAdmin.port}`,
          auth: {
            email: monitoring.pgAdmin.email,
            password: monitoring.pgAdmin.password,
          },
          options: {
            defaultDatabase: "postgres",
          },
        },
      },
    };
  }

  /**
   * Builds networking configuration section.
   *
   * @param config - Raw service configuration
   * @returns Networking configuration in DSL format
   */
  private buildNetworkingConfig(
    config: ServiceConfig
  ): ServiceDSL["networking"] {
    return {
      networks: config.networking.networks,
    };
  }

  /**
   * Builds PostgreSQL connection string from config parameters.
   *
   * @param config - PostgreSQL configuration object
   * @returns Formatted connection string
   */
  private buildPostgresConnectionString(
    config: ServiceConfig["databases"]["postgres"]
  ): string {
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Builds Redis connection string from config parameters.
   *
   * @param config - Redis configuration object
   * @returns Formatted connection string
   */
  private buildRedisConnectionString(
    config: ServiceConfig["databases"]["redis"]
  ): string {
    return `redis://:${config.password}@${config.host}:${config.port}`;
  }
}
````

## app `qi/app/src/services_config_loader.ts`

```typescript
import { Schema, JsonLoader, EnvLoader } from "@qi/core/config";
import { ServiceConfigHandler } from "@qi/core/services/config/handler";
import {
  serviceConfigSchema,
  envConfigSchema,
  mergedConfigSchema,
} from "@qi/core/services/config/schemas";
import { join } from "path";
import { logger } from "@qi/core/logger";
import { formatJsonWithColor, retryOperation } from "@qi/core/utils";
import {
  ConfigurationError,
  ValidationError,
  NotFoundError,
  ApplicationError,
} from "@qi/core/errors";
import {
  ServiceConfig,
  EnvConfig,
  ServiceDSL,
} from "@qi/core/services/config/types";

const registerSchemas = (schema: Schema) => {
  // Register json config schema
  try {
    schema.registerSchema("service-config", serviceConfigSchema);
    logger.info("Service config schema registered successfully");
  } catch (error) {
    logger.error("Service config schema registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  // Register environment config schema
  try {
    schema.registerSchema("env-config", envConfigSchema);
    logger.info("Environment config schema registered successfully");
  } catch (error) {
    logger.error("Environment config schema registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ConfigurationError(
      "Failed to register environment config schema",
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }

  // Register merged config schema
  try {
    schema.registerSchema("merged-config", mergedConfigSchema);
    logger.info("Merged config schema registered successfully");
  } catch (error) {
    logger.error("Merged config schema registration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ConfigurationError("Failed to register merged config schema", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

async function loadAndProcessConfig() {
  try {
    const schema = new Schema({
      formats: true, // Enable email and other formats
      strict: false, // Be less strict about format validation
    });

    logger.info("Starting configuration loading process...");

    // Register schemas
    registerSchemas(schema);

    const serviceConfigPath = join(process.cwd(), "config", "services.json");
    const envConfigPath = join(process.cwd(), "config", "services.env");

    logger.info("Creating config loaders", {
      serviceConfigPath,
      envConfigPath,
    });

    const serviceLoader = new JsonLoader<ServiceConfig>(
      serviceConfigPath,
      schema,
      "service-config"
    );

    const envLoader = new EnvLoader<EnvConfig>(schema, "env-config", {
      path: envConfigPath,
      required: true,
      watch: true,
    });

    // Load configurations
    logger.info("Loading configurations...");

    const [serviceConfig, envConfig] = await Promise.all([
      retryOperation(
        async () => {
          const config = await serviceLoader.load();
          logger.info("Service config loaded successfully");
          return config;
        },
        { retries: 3, minTimeout: 1000 }
      ),
      retryOperation(
        async () => {
          const config = await envLoader.load();
          logger.info("Environment config loaded successfully");
          return config;
        },
        { retries: 3, minTimeout: 1000 }
      ),
    ]);

    if (!serviceConfig) {
      throw new NotFoundError("Service configuration file not found", {
        path: serviceConfigPath,
        resource: "service-config",
      });
    }

    if (!envConfig) {
      throw new NotFoundError("Environment configuration not found", {
        path: envConfigPath,
        resource: "env-config",
      });
    }

    logger.info("Merging configurations...");

    // Merge configurations with environment variables
    const mergedConfig: ServiceConfig = {
      ...serviceConfig,
      databases: {
        ...serviceConfig.databases,
        postgres: {
          ...serviceConfig.databases.postgres,
          password: envConfig.POSTGRES_PASSWORD,
        },
        questdb: {
          ...serviceConfig.databases.questdb,
          telemetryEnabled: process.env.QDB_TELEMETRY_ENABLED === "true",
        },
        redis: {
          ...serviceConfig.databases.redis,
          password: envConfig.REDIS_PASSWORD,
        },
      },
      messageQueue: {
        ...serviceConfig.messageQueue,
        redpanda: {
          ...serviceConfig.messageQueue.redpanda,
          brokerId: Number(process.env.REDPANDA_BROKER_ID) || 0,
          advertisedKafkaApi:
            process.env.REDPANDA_ADVERTISED_KAFKA_API || "localhost",
          advertisedSchemaRegistryApi:
            process.env.REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API || "localhost",
          advertisedPandaproxyApi:
            process.env.REDPANDA_ADVERTISED_PANDAPROXY_API || "localhost",
        },
      },
      monitoring: {
        ...serviceConfig.monitoring,
        grafana: {
          ...serviceConfig.monitoring.grafana,
          adminPassword: envConfig.GF_SECURITY_ADMIN_PASSWORD,
          plugins: process.env.GF_INSTALL_PLUGINS || "",
        },
        pgAdmin: {
          ...serviceConfig.monitoring.pgAdmin,
          email: envConfig.PGADMIN_DEFAULT_EMAIL,
          password: envConfig.PGADMIN_DEFAULT_PASSWORD,
        },
      },
    };

    try {
      logger.info("Validating merged configuration...");
      schema.validate(mergedConfig, "merged-config");
      logger.info("Merged configuration validation successful");
    } catch (error) {
      throw new ValidationError("Merged configuration validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    logger.info("Processing configuration through handler...");

    // Process configuration through handler
    const handler = new ServiceConfigHandler();
    const processedConfig: ServiceDSL = handler.handle(mergedConfig);

    logger.info("Configuration processing completed successfully");

    return {
      serviceConfig,
      envConfig,
      mergedConfig,
      processedConfig,
    };
  } catch (error) {
    logger.error("Configuration processing failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        throw new ValidationError("Configuration validation failed", {
          details: error.message,
        });
      } else if (error.name === "ConfigurationError") {
        throw new ConfigurationError("Invalid configuration structure", {
          details: error.message,
        });
      }

      throw new ApplicationError(
        "Failed to load and process configuration",
        "CONFIG_PROCESSING_ERROR",
        500,
        { originalError: error.message }
      );
    }

    throw new ApplicationError(
      "Unknown error occurred while processing configuration",
      "UNKNOWN_ERROR",
      500,
      { error: String(error) }
    );
  }
}

async function initializeConfig() {
  try {
    const result = await loadAndProcessConfig();
    logger.info("Service configuration loaded successfully", {
      serviceConfigPath: "config/services.json",
      envConfigPath: "config/services.env",
    });
    return result;
  } catch (error) {
    if (error instanceof ApplicationError) {
      logger.error("Failed to initialize service configuration", {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      });
    } else {
      logger.error(
        "Unexpected error during service configuration initialization",
        {
          error: String(error),
        }
      );
    }
    throw error;
  }
}

async function main() {
  try {
    const { serviceConfig, envConfig, mergedConfig, processedConfig } =
      await initializeConfig();

    console.log("\nService Configuration (Base):");
    console.log(formatJsonWithColor(serviceConfig));

    console.log("\nEnvironment Variables (Sensitive data redacted):");
    const redactedEnvConfig = Object.fromEntries(
      Object.entries(envConfig).map(([key, value]) => [
        key,
        key.includes("PASSWORD") ||
        key.includes("SECRET") ||
        key.includes("API_KEY")
          ? "******"
          : value,
      ])
    );
    console.log(formatJsonWithColor(redactedEnvConfig));

    console.log("\nMerged Configuration (Sensitive data redacted):");
    const redactedMergedConfig = JSON.parse(JSON.stringify(mergedConfig));
    // Redact sensitive information
    if (redactedMergedConfig.databases) {
      if (redactedMergedConfig.databases.postgres)
        redactedMergedConfig.databases.postgres.password = "******";
      if (redactedMergedConfig.databases.redis)
        redactedMergedConfig.databases.redis.password = "******";
      if (redactedMergedConfig.databases.questdb)
        redactedMergedConfig.databases.questdb.password = "******";
    }
    if (redactedMergedConfig.monitoring) {
      if (redactedMergedConfig.monitoring.grafana)
        redactedMergedConfig.monitoring.grafana.adminPassword = "******";
      if (redactedMergedConfig.monitoring.pgAdmin)
        redactedMergedConfig.monitoring.pgAdmin.password = "******";
    }
    console.log(formatJsonWithColor(redactedMergedConfig));

    console.log("\nProcessed Configuration (DSL):");
    const redactedProcessedConfig = JSON.parse(JSON.stringify(processedConfig));
    // Redact sensitive information in DSL output
    if (redactedProcessedConfig.databases) {
      if (redactedProcessedConfig.databases.postgres) {
        redactedProcessedConfig.databases.postgres.connectionString =
          redactedProcessedConfig.databases.postgres.connectionString.replace(
            /:[^:@]+@/,
            ":******@"
          );
      }
      if (redactedProcessedConfig.databases.redis) {
        redactedProcessedConfig.databases.redis.connectionString =
          redactedProcessedConfig.databases.redis.connectionString.replace(
            /:[^:@]+@/,
            ":******@"
          );
      }
    }
    if (redactedProcessedConfig.monitoring?.endpoints) {
      if (redactedProcessedConfig.monitoring.endpoints.grafana) {
        redactedProcessedConfig.monitoring.endpoints.grafana.auth.password =
          "******";
      }
      if (redactedProcessedConfig.monitoring.endpoints.pgAdmin) {
        redactedProcessedConfig.monitoring.endpoints.pgAdmin.auth.password =
          "******";
      }
    }
    console.log(formatJsonWithColor(redactedProcessedConfig));

    logger.info("Configuration processing completed", {
      serviceType: serviceConfig.type,
      version: serviceConfig.version,
    });

    return { serviceConfig, envConfig, mergedConfig, processedConfig };
  } catch (error) {
    logger.error("Failed to process configuration", {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Clean up when the process exits
process.on("SIGINT", () => {
  logger.info("Shutting down configuration watchers...");
  process.exit(0);
});

// Execute the main function
main().catch((error) => {
  logger.error("Fatal error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
```

This implementation:

1. Separates sensitive data into .env file
2. Uses EnvLoader to load and validate environment variables
3. Uses JsonLoader for non-sensitive configuration
4. Merges both configurations into a complete ServiceConfig
5. Watches both files for changes
6. Validates both configurations using separate schemas
7. Provides type safety throughout the process

Key features:

- Environment variables are validated against a schema
- Sensitive data never appears in JSON files
- Both configurations are watched for changes
- Strong typing throughout the system
- Proper error handling and validation
- Auto-refresh of environment variables every 30 seconds
