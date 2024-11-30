1. `qi/core/src/services/config/types.ts`:
```ts
/**
 * @fileoverview Service configuration type definitions
 * @module @qi/core/services/config/types
 *
 * @description
 * Defines TypeScript interfaces for service configuration including databases,
 * message queues, monitoring tools, and networking. These types are used to
 * ensure type safety when working with configuration data loaded from JSON
 * and environment files.
 *
 * @example
 * ```typescript
 * import { ServiceConfig } from './types';
 *
 * const config: ServiceConfig = {
 *   type: 'service',
 *   version: '1.0',
 *   databases: {
 *     redis: {
 *       host: 'localhost',
 *       port: 6379,
 *       maxRetries: 3
 *     }
 *   }
 * };
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
import { BaseConfig } from "@qi/core/config";
  
/**
 * Database service configurations
 */
export interface DatabaseConfigs {
  postgres: {
    host: string;
    port: number;
    database: string;
    user: string;
    password?: string;
    maxConnections: number;
  };
  questdb: {
    host: string;
    httpPort: number;
    pgPort: number;
    influxPort: number;
    telemetryEnabled?: boolean;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    maxRetries: number;
  };
}
  
/**
 * Message queue service configurations
 */
export interface MessageQueueConfigs {
  redpanda: {
    kafkaPort: number;
    schemaRegistryPort: number;
    adminPort: number;
    pandaproxyPort: number;
    brokerId?: number;
    advertisedKafkaApi?: string;
    advertisedSchemaRegistryApi?: string;
    advertisedPandaproxyApi?: string;
  };
}
  
/**
 * Monitoring service configurations
 */
export interface MonitoringConfigs {
  grafana: {
    host: string;
    port: number;
    adminPassword?: string;
    plugins?: string;
  };
  pgAdmin: {
    host: string;
    port: number;
    email?: string;
    password?: string;
  };
}
  
/**
 * Network configurations
 */
export interface NetworkingConfigs {
  networks: {
    db: string;
    redis: string;
    redpanda: string;
  };
}
  
/**
 * Complete service configuration
 */
export interface ServiceConfig extends BaseConfig {
  type: "service";
  version: string;
  databases: DatabaseConfigs;
  messageQueue: MessageQueueConfigs;
  monitoring: MonitoringConfigs;
  networking: NetworkingConfigs;
}
  
/**
 * Environment variables configuration
 */
export interface EnvConfig {
  POSTGRES_PASSWORD: string;
  POSTGRES_USER: string;
  POSTGRES_DB: string;
  REDIS_PASSWORD: string;
  GF_SECURITY_ADMIN_PASSWORD: string;
  GF_INSTALL_PLUGINS?: string;
  PGADMIN_DEFAULT_EMAIL: string;
  PGADMIN_DEFAULT_PASSWORD: string;
  QDB_TELEMETRY_ENABLED?: string;
  REDPANDA_BROKER_ID?: string;
  REDPANDA_ADVERTISED_KAFKA_API?: string;
  REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API?: string;
  REDPANDA_ADVERTISED_PANDAPROXY_API?: string;
}
  
```  
  
2. `qi/core/src/services/config/loader.ts`:
```ts
/**
 * @fileoverview Service configuration loader
 * @module @qi/core/services/config/loader
 *
 * @description
 * Provides functionality to load and merge service configurations from JSON
 * and environment files. Handles loading, parsing, and merging of configuration
 * data while providing type safety and error handling.
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
  
```  
  
3. `qi/core/src/services/config/index.ts`:
```ts
/**
 * @fileoverview Service configuration module entry point
 * @module @qi/core/services/config
 *
 * @description
 * Exports service configuration types and loader functionality.
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 *
 * @note
 * This file is automatically processed by a pre-commit script to ensure
 * that file headers are up-to-date with the author's name and modification date.
 */
  
export { ConfigLoader } from "./loader.js";
export type {
  ServiceConfig,
  EnvConfig,
  DatabaseConfigs,
  MessageQueueConfigs,
  MonitoringConfigs,
  NetworkingConfigs,
} from "./types.js";
  
```  
  