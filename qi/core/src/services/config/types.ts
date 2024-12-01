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
