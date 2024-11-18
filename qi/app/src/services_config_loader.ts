/**
 * @fileoverview
 * @module services_config_loader.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

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
