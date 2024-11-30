/**
 * @fileoverview Service configuration loader
 * @module @qi/core/services/config/loader
 *
 * @description
 * Provides functionality to load and merge service configurations from JSON
 * and environment files. Handles loading, parsing, and merging of configuration
 * data while providing type safety and error handling.
 *
 * @author Zhifeng Zhang
 * @modified 2024-11-30
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */

import { readFile } from "fs/promises";
import { ApplicationError, ErrorCode, ErrorDetails } from "@qi/core/errors";
import { loadEnv } from "@qi/core/utils";
import { logger } from "@qi/core/logger";
import { ServiceConfig, EnvConfig } from "./types.js";

/**
 * Service configuration loader class
 */
export class ConfigLoader {
  /**
   * Loads and merges service configuration from JSON and environment files
   *
   * @param jsonPath - Path to the JSON configuration file
   * @param envPath - Path to the environment file
   * @returns Promise resolving to merged ServiceConfig
   * @throws ApplicationError if loading or parsing fails
   */
  async loadConfig(jsonPath: string, envPath: string): Promise<ServiceConfig> {
    try {
      logger.info("Loading service configuration", { jsonPath, envPath });

      // Load base configuration
      const baseConfig = await this.loadJsonConfig(jsonPath);

      // Load environment variables
      const env = await this.loadEnvConfig(envPath);

      // Merge configurations
      const mergedConfig = this.mergeConfigs(baseConfig, env);
      logger.info("Service configuration loaded successfully");

      return mergedConfig;
    } catch (error) {
      const details: ErrorDetails = {
        operation: "loadConfig",
        jsonPath,
        envPath,
        error: error instanceof Error ? error.message : String(error),
      };

      logger.error("Failed to load service configuration", details);
      throw new ApplicationError(
        "Failed to load service configuration",
        ErrorCode.CONFIG_LOAD_ERROR,
        500,
        details
      );
    }
  }

  /**
   * Loads configuration from JSON file
   *
   * @private
   * @param path - Path to JSON file
   * @returns Promise resolving to ServiceConfig
   */
  private async loadJsonConfig(path: string): Promise<ServiceConfig> {
    try {
      const content = await readFile(path, "utf-8");
      return JSON.parse(content) as ServiceConfig;
    } catch (error) {
      const details: ErrorDetails = {
        operation: "loadJsonConfig",
        filePath: path,
        error: error instanceof Error ? error.message : String(error),
      };

      throw new ApplicationError(
        "Failed to load JSON configuration",
        ErrorCode.CONFIG_LOAD_ERROR,
        500,
        details
      );
    }
  }

  /**
   * Loads configuration from environment file
   *
   * @private
   * @param path - Path to environment file
   * @returns Promise resolving to environment variables
   */
  private async loadEnvConfig(path: string): Promise<EnvConfig> {
    const env = await loadEnv(path);
    if (!env) {
      const details: ErrorDetails = {
        operation: "loadEnvConfig",
        filePath: path,
      };

      throw new ApplicationError(
        "Environment file not found",
        ErrorCode.CONFIG_LOAD_ERROR,
        500,
        details
      );
    }
    return env as unknown as EnvConfig;
  }

  /**
   * Merges base configuration with environment variables
   *
   * @private
   * @param baseConfig - Base JSON configuration
   * @param env - Environment variables
   * @returns Merged ServiceConfig
   */
  private mergeConfigs(
    baseConfig: ServiceConfig,
    env: EnvConfig
  ): ServiceConfig {
    return {
      ...baseConfig,
      databases: {
        ...baseConfig.databases,
        postgres: {
          ...baseConfig.databases.postgres,
          password: env.POSTGRES_PASSWORD,
          user: env.POSTGRES_USER,
          database: env.POSTGRES_DB,
        },
        questdb: {
          ...baseConfig.databases.questdb,
          telemetryEnabled: env.QDB_TELEMETRY_ENABLED === "true",
        },
        redis: {
          ...baseConfig.databases.redis,
          password: env.REDIS_PASSWORD,
        },
      },
      monitoring: {
        ...baseConfig.monitoring,
        grafana: {
          ...baseConfig.monitoring.grafana,
          adminPassword: env.GF_SECURITY_ADMIN_PASSWORD,
          plugins: env.GF_INSTALL_PLUGINS,
        },
        pgAdmin: {
          ...baseConfig.monitoring.pgAdmin,
          email: env.PGADMIN_DEFAULT_EMAIL,
          password: env.PGADMIN_DEFAULT_PASSWORD,
        },
      },
      messageQueue: {
        ...baseConfig.messageQueue,
        redpanda: {
          ...baseConfig.messageQueue.redpanda,
          brokerId: env.REDPANDA_BROKER_ID
            ? parseInt(env.REDPANDA_BROKER_ID, 10)
            : undefined,
          advertisedKafkaApi: env.REDPANDA_ADVERTISED_KAFKA_API,
          advertisedSchemaRegistryApi:
            env.REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API,
          advertisedPandaproxyApi: env.REDPANDA_ADVERTISED_PANDAPROXY_API,
        },
      },
    };
  }
}
