/**
 * @fileoverview Service configuration loading helper
 * @module services/config/loader
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-28
 *
 * @description
 * This module provides functionality to load, validate, and merge service and environment configurations.
 * It ensures that the necessary configuration files exist, applies schema validations, and caches the configurations
 * for optimized performance. The loader handles merging of service-specific settings with environment variables
 * to produce a consolidated configuration for the application.
 *
 * @example
 * ```typescript
 * import { loadServiceConfig } from './services/config/loader';
 *
 * const configOptions = {
 *   serviceConfigPath: './config/service.json',
 *   envConfigPath: './config/.env',
 *   cacheTTL: 300000, // Optional: Cache time-to-live in milliseconds
 * };
 *
 * loadServiceConfig(configOptions)
 *   .then(({ serviceConfig, envConfig, mergedConfig, dsl }) => {
 *     console.log('Service Configuration:', serviceConfig);
 *     console.log('Environment Configuration:', envConfig);
 *     console.log('Merged Configuration:', mergedConfig);
 *     console.log('DSL:', dsl);
 *   })
 *   .catch((error) => {
 *     console.error('Failed to load configurations:', error);
 *   });
 * ```
 */

import {
  Schema,
  ConfigFactory,
  IConfigFactory,
  ConfigCache,
  IConfigCache,
  BaseConfig,
  IConfigValidator,
  JsonLoader,
  EnvLoader,
} from "@qi/core/config";

import { logger } from "@qi/core/logger";
import { formatJsonWithColor } from "@qi/core/utils";
import { ServiceConfig, EnvConfig, ServiceDSL } from "./types.js";
import {
  serviceConfigSchema,
  envConfigSchema,
  mergedConfigSchema,
} from "./schemas.js";
import { ServiceConfigHandler } from "./handler.js";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "@qi/core/config";

/**
 * Configuration loading options
 */
export interface LoadServiceConfigOptions {
  /** Path to the service configuration file */
  serviceConfigPath: string;
  /** Path to the environment configuration file */
  envConfigPath: string;
  /** Optional cache time-to-live in milliseconds */
  cacheTTL?: number;
}

/**
 * Configuration loading result
 */
export interface LoadServiceConfigResult {
  /** Raw service configuration */
  serviceConfig: ServiceConfig;
  /** Environment configuration */
  envConfig: EnvConfig;
  /** Merged configuration combining service and environment settings */
  mergedConfig: ServiceConfig;
  /** Domain-specific language representation */
  dsl: ServiceDSL;
}

/**
 * Manages service configuration loading, validation, and transformation.
 * Uses the core configuration module for loading and validation while
 * providing service-specific merging and transformation logic.
 */
export class ServiceConfigLoader {
  private readonly factory: IConfigFactory;
  private readonly cache: IConfigCache<BaseConfig>;
  private readonly schema: Schema;

  /**
   * Creates a new service config loader
   * @param cacheTTL Cache duration in milliseconds
   */
  constructor(cacheTTL: number = 5 * 60 * 1000) {
    // Initialize cache with optional expiration callback
    this.cache = new ConfigCache({
      ttl: cacheTTL,
      refreshOnAccess: true,
      onExpire: (key) => logger.info("Config cache expired", { key }),
    });

    // Create schema manager and register schemas
    this.schema = new Schema({ formats: true });
    try {
      this.schema.registerSchema("service-config", serviceConfigSchema);
      this.schema.registerSchema("env-config", envConfigSchema);
      this.schema.registerSchema("merged-config", mergedConfigSchema);
    } catch (error) {
      throw ConfigLoaderError.create(
        "Failed to register schemas",
        CONFIG_LOADER_CODES.INVALID_SCHEMA,
        "schema-registration",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }

    // Initialize factory with schema and cache
    this.factory = new ConfigFactory(this.schema, this.cache);
  }

  /**
   * Loads and processes service configuration
   * @param options Loading options
   * @returns Promise resolving to the loaded configurations and DSL
   */
  async load({
    serviceConfigPath,
    envConfigPath,
    cacheTTL = 5 * 60 * 1000,
  }: LoadServiceConfigOptions): Promise<LoadServiceConfigResult> {
    try {
      // Create configs separately
      const serviceConfig = await this.loadServiceConfig(serviceConfigPath);
      const envConfig = await this.loadEnvConfig(envConfigPath, cacheTTL);

      this.logConfigs(serviceConfig, envConfig);
      const mergedConfig = this.mergeConfigs(serviceConfig, envConfig);
      const dsl = new ServiceConfigHandler().handle(mergedConfig);

      return { serviceConfig, envConfig, mergedConfig, dsl };
    } catch (error) {
      if (error instanceof ConfigLoaderError) throw error;
      throw ConfigLoaderError.create(
        "Failed to load service configuration",
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        serviceConfigPath,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Loads service configuration from file
   * @private
   */
  private async loadServiceConfig(path: string): Promise<ServiceConfig> {
    this.factory.createLoader<ServiceConfig>({
      type: "service",
      version: "1.0",
      schema: serviceConfigSchema,
    });
    return new JsonLoader<ServiceConfig>(
      path,
      this.schema,
      "service-config"
    ).load();
  }

  /**
   * Loads environment configuration
   * @private
   */
  private async loadEnvConfig(
    path: string,
    refreshInterval: number
  ): Promise<EnvConfig> {
    this.factory.createLoader<EnvConfig>({
      type: "env",
      version: "1.0",
      schema: envConfigSchema,
    });
    return new EnvLoader<EnvConfig>(this.schema, "env-config", {
      path,
      required: true,
      watch: true,
      refreshInterval,
    }).load();
  }

  /**
   * Logs loaded configurations in development
   * @private
   */
  private logConfigs(serviceConfig: ServiceConfig, envConfig: EnvConfig): void {
    if (process.env.NODE_ENV !== "production") {
      console.log("\nLoaded Configs:");
      console.log(formatJsonWithColor({ serviceConfig, envConfig }));
    }
  }

  /**
   * Merges service and environment configurations
   * @private
   */
  private mergeConfigs(
    serviceConfig: ServiceConfig,
    envConfig: EnvConfig
  ): ServiceConfig {
    try {
      const mergedConfig = {
        ...serviceConfig,
        databases: {
          ...serviceConfig.databases,
          postgres: {
            ...serviceConfig.databases.postgres,
            password: envConfig.POSTGRES_PASSWORD,
          },
          questdb: {
            ...serviceConfig.databases.questdb,
            telemetryEnabled: envConfig.QDB_TELEMETRY_ENABLED === "true",
          },
          redis: {
            ...serviceConfig.databases.redis,
            password: envConfig.REDIS_PASSWORD,
          },
        },
        monitoring: {
          ...serviceConfig.monitoring,
          grafana: {
            ...serviceConfig.monitoring.grafana,
            adminPassword: envConfig.GF_SECURITY_ADMIN_PASSWORD,
            plugins: envConfig.GF_INSTALL_PLUGINS || "",
          },
          pgAdmin: {
            ...serviceConfig.monitoring.pgAdmin,
            email: envConfig.PGADMIN_DEFAULT_EMAIL,
            password: envConfig.PGADMIN_DEFAULT_PASSWORD,
          },
        },
      };

      // Validate merged config
      const validator: IConfigValidator<ServiceConfig> =
        this.factory.createValidator<ServiceConfig>(mergedConfigSchema);
      validator.validate(mergedConfig);

      return mergedConfig;
    } catch (error) {
      throw ConfigLoaderError.create(
        "Failed to merge configurations",
        CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
        "config-merge",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Creates loader instance and loads configuration
   * @static
   * @param options Loading options
   * @returns Promise resolving to the loaded configurations and DSL
   */
  static async createAndLoad(
    options: LoadServiceConfigOptions
  ): Promise<LoadServiceConfigResult> {
    const loader = new ServiceConfigLoader(options.cacheTTL);
    return loader.load(options);
  }
}

/**
 * Convenience function for loading service configuration
 */
export const loadServiceConfig = ServiceConfigLoader.createAndLoad;
