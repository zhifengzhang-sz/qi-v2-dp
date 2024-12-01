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
