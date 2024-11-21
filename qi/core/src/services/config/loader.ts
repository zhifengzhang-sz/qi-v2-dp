/**
 * @fileoverview Service configuration loading helper
 * @module services/config/loader
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-21
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
  ConfigCache,
  JsonLoader,
  EnvLoader,
} from "@qi/core/config";
import { ServiceConfigHandler } from "./handler.js";
import {
  serviceConfigSchema,
  envConfigSchema,
  mergedConfigSchema,
} from "./schemas.js";
import { logger } from "@qi/core/logger";
import { formatJsonWithColor } from "@qi/core/utils";
import { ServiceConfig, EnvConfig, ServiceDSL } from "./types.js";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "@qi/core/config";
import { existsSync } from "fs";

export interface LoadServiceConfigOptions {
  serviceConfigPath: string;
  envConfigPath: string;
  cacheTTL?: number;
}

export interface LoadServiceConfigResult {
  serviceConfig: ServiceConfig;
  envConfig: EnvConfig;
  mergedConfig: ServiceConfig;
  dsl: ServiceDSL;
}

export class ServiceConfigLoader {
  private factory: ConfigFactory;
  private schema: Schema;

  constructor(cacheTTL: number = 5 * 60 * 1000) {
    this.schema = new Schema({ formats: true, strict: false });
    this.initializeSchemas();
    this.factory = this.createConfigFactory(cacheTTL);
  }

  private initializeSchemas() {
    try {
      this.schema.registerSchema("service-config", serviceConfigSchema);
      this.schema.registerSchema("env-config", envConfigSchema);
      this.schema.registerSchema("merged-config", mergedConfigSchema);
    } catch (error) {
      throw ConfigLoaderError.create(
        "Failed to register schemas",
        CONFIG_LOADER_CODES.INVALID_SCHEMA,
        "schema-registration",
        { error: String(error) }
      );
    }
  }

  private createConfigFactory(cacheTTL: number): ConfigFactory {
    const cache = new ConfigCache({
      ttl: cacheTTL,
      refreshOnAccess: true,
      onExpire: (key) => logger.info("Config cache expired", { key }),
    });
    return new ConfigFactory(this.schema, cache);
  }

  async load({
    serviceConfigPath,
    envConfigPath,
    cacheTTL = 5 * 60 * 1000,
  }: LoadServiceConfigOptions): Promise<LoadServiceConfigResult> {
    this.validateConfigPaths(serviceConfigPath, envConfigPath);

    const [serviceConfig, envConfig] = await Promise.all([
      this.loadServiceConfig(serviceConfigPath),
      this.loadEnvConfig(envConfigPath, cacheTTL),
    ]);

    this.logConfigs(serviceConfig, envConfig);

    const mergedConfig = this.mergeConfigs(serviceConfig, envConfig);
    const dsl = new ServiceConfigHandler().handle(mergedConfig);

    return { serviceConfig, envConfig, mergedConfig, dsl };
  }

  private validateConfigPaths(
    serviceConfigPath: string,
    envConfigPath: string
  ) {
    if (!existsSync(serviceConfigPath) || !existsSync(envConfigPath)) {
      throw ConfigLoaderError.create(
        "Configuration files not found",
        CONFIG_LOADER_CODES.READ_ERROR,
        "file-check",
        {
          serviceConfigPath: existsSync(serviceConfigPath),
          envConfigPath: existsSync(envConfigPath),
        }
      );
    }
  }

  private async loadServiceConfig(path: string): Promise<ServiceConfig> {
    try {
      return await new JsonLoader<ServiceConfig>(
        path,
        this.schema,
        "service-config"
      ).load();
    } catch (error) {
      if (error instanceof ConfigLoaderError) throw error;
      throw ConfigLoaderError.create(
        "Failed to load service config",
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        path,
        { error: String(error) }
      );
    }
  }

  private async loadEnvConfig(
    path: string,
    refreshInterval: number
  ): Promise<EnvConfig> {
    try {
      return await new EnvLoader<EnvConfig>(this.schema, "env-config", {
        path,
        required: true,
        watch: true,
        refreshInterval,
      }).load();
    } catch (error) {
      if (error instanceof ConfigLoaderError) throw error;
      throw ConfigLoaderError.create(
        "Failed to load environment config",
        CONFIG_LOADER_CODES.ENV_LOAD_ERROR,
        path,
        { error: String(error) }
      );
    }
  }

  private logConfigs(serviceConfig: ServiceConfig, envConfig: EnvConfig) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\nLoaded Configs:");
      console.log(formatJsonWithColor({ serviceConfig, envConfig }));
    }
  }

  private mergeConfigs(
    serviceConfig: ServiceConfig,
    envConfig: EnvConfig
  ): ServiceConfig {
    try {
      return {
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
    } catch (error) {
      throw ConfigLoaderError.create(
        "Failed to merge configurations",
        CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
        "config-merge",
        { error: String(error) }
      );
    }
  }

  static async createAndLoad(
    options: LoadServiceConfigOptions
  ): Promise<LoadServiceConfigResult> {
    const loader = new ServiceConfigLoader(options.cacheTTL);
    return loader.load(options);
  }
}

export const loadServiceConfig = ServiceConfigLoader.createAndLoad;
