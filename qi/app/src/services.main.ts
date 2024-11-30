/**
 * @fileoverview Configuration Module Example Application
 * @module app/services.main
 *
 * @description
 * Demonstrates loading and using service configurations from JSON and environment
 * files using the @qi/core/services/config module.
 */

import { Schema, ConfigFactory, JsonSchema, EnvLoader } from "@qi/core/config";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { ServiceConfig } from "@qi/core/services/config";

/**
 * Environment configuration with base config properties
 */
interface EnvConfigWithBase extends Record<string, string | undefined> {
  type: string;
  version: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_USER: string;
  POSTGRES_DB: string;
  REDIS_PASSWORD: string;
  GF_SECURITY_ADMIN_PASSWORD: string;
  PGADMIN_DEFAULT_EMAIL: string;
  PGADMIN_DEFAULT_PASSWORD: string;
  GF_INSTALL_PLUGINS?: string;
  QDB_TELEMETRY_ENABLED?: string;
  REDPANDA_BROKER_ID?: string;
  REDPANDA_ADVERTISED_KAFKA_API?: string;
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API?: string;
  REDPANDA_ADVERTISED_PANDAPROXY_API?: string;
}

/**
 * Configuration example application class
 */
export class ConfigExampleApp {
  private readonly schema: Schema;
  private readonly configFactory: ConfigFactory;
  private config: ServiceConfig | null = null;

  constructor() {
    this.schema = new Schema({ formats: true });
    this.configFactory = new ConfigFactory(this.schema);
  }

  /**
   * Loads configuration and demonstrates usage
   */
  async run(
    configPath: string = "./config/services.json",
    envPath: string = "./config/services.env"
  ): Promise<void> {
    try {
      // Initialize base environment properties
      process.env.type = "env";
      process.env.version = "1.0";

      // Create service schema
      const serviceSchema: JsonSchema = {
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
          type: { type: "string", const: "services" },
          version: { type: "string" },
          databases: {
            type: "object",
            required: ["postgres", "questdb", "redis"],
            properties: {
              postgres: {
                type: "object",
                required: [
                  "host",
                  "port",
                  "database",
                  "user",
                  "maxConnections",
                ],
                properties: {
                  host: { type: "string" },
                  port: { type: "number" },
                  database: { type: "string" },
                  user: { type: "string" },
                  maxConnections: { type: "number" },
                },
              },
              questdb: {
                type: "object",
                required: ["host", "httpPort", "pgPort", "influxPort"],
                properties: {
                  host: { type: "string" },
                  httpPort: { type: "number" },
                  pgPort: { type: "number" },
                  influxPort: { type: "number" },
                },
              },
              redis: {
                type: "object",
                required: ["host", "port", "maxRetries"],
                properties: {
                  host: { type: "string" },
                  port: { type: "number" },
                  maxRetries: { type: "number" },
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
                  kafkaPort: { type: "number" },
                  schemaRegistryPort: { type: "number" },
                  adminPort: { type: "number" },
                  pandaproxyPort: { type: "number" },
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
                  port: { type: "number" },
                },
              },
              pgAdmin: {
                type: "object",
                required: ["host", "port"],
                properties: {
                  host: { type: "string" },
                  port: { type: "number" },
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

      // Create environment schema
      const envSchema: JsonSchema = {
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
          "PGADMIN_DEFAULT_PASSWORD",
        ],
        properties: {
          type: { type: "string", const: "env" },
          version: { type: "string" },
          POSTGRES_PASSWORD: { type: "string" },
          POSTGRES_USER: { type: "string" },
          POSTGRES_DB: { type: "string" },
          REDIS_PASSWORD: { type: "string" },
          GF_SECURITY_ADMIN_PASSWORD: { type: "string" },
          GF_INSTALL_PLUGINS: { type: "string" },
          PGADMIN_DEFAULT_EMAIL: { type: "string" },
          PGADMIN_DEFAULT_PASSWORD: { type: "string" },
          QDB_TELEMETRY_ENABLED: { type: "string" },
          REDPANDA_BROKER_ID: { type: "string" },
          REDPANDA_ADVERTISED_KAFKA_API: { type: "string" },
          REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: { type: "string" },
          REDPANDA_ADVERTISED_PANDAPROXY_API: { type: "string" },
        },
      };

      // Register schemas
      if (!this.schema.hasSchema("env-config")) {
        this.schema.registerSchema("env-config", envSchema);
      }

      // Load environment variables
      const envLoader = new EnvLoader<EnvConfigWithBase>(
        this.schema,
        "env-config",
        {
          path: envPath,
          required: true,
          override: true,
        }
      );

      await envLoader.load();

      // Create and use config loader with specific path
      const loader = this.configFactory.createLoader<ServiceConfig>({
        type: "services",
        version: "1.0",
        schema: serviceSchema,
      });

      // Configure loader to use the provided config path
      const jsonLoader = loader as unknown as { source: string };
      jsonLoader.source = configPath;

      // Load configuration
      this.config = await loader.load();

      // Display loaded configuration
      this.displayConfig();

      logger.info("Configuration example completed successfully");
    } catch (error) {
      this.handleError("run", error);
    }
  }

  /**
   * Displays the loaded configuration
   */
  private displayConfig(): void {
    if (!this.config) {
      throw new ApplicationError(
        "Configuration not loaded",
        ErrorCode.CONFIGURATION_ERROR,
        500
      );
    }

    // Basic configuration access
    logger.info("Service Version", { version: this.config.version });

    // Database configurations
    const { postgres, redis, questdb } = this.config.databases;
    logger.info("Database Configurations", {
      postgresHost: postgres.host,
      postgresPort: postgres.port,
      redisHost: redis.host,
      redisPort: redis.port,
      questdbPorts: {
        http: questdb.httpPort,
        postgresql: questdb.pgPort,
        influx: questdb.influxPort,
      },
    });

    // Message queue configuration
    const { redpanda } = this.config.messageQueue;
    logger.info("Message Queue Configuration", {
      kafkaPort: redpanda.kafkaPort,
      schemaRegistryPort: redpanda.schemaRegistryPort,
    });

    // Monitoring configuration
    const { grafana, pgAdmin } = this.config.monitoring;
    logger.info("Monitoring Configuration", {
      grafanaHost: grafana.host,
      grafanaPort: grafana.port,
      pgAdminHost: pgAdmin.host,
      pgAdminPort: pgAdmin.port,
    });

    // Network configuration
    logger.info("Network Configuration", {
      networks: this.config.networking.networks,
    });
  }

  /**
   * Handles errors consistently
   */
  private handleError(operation: string, error: unknown): void {
    if (error instanceof ApplicationError) {
      logger.error("Application error in config example", {
        operation,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    } else {
      logger.error("Unexpected error in config example", {
        operation,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new ConfigExampleApp();
  app.run().catch((error) => {
    console.error("Failed to run config example:", error);
    process.exit(1);
  });
}
