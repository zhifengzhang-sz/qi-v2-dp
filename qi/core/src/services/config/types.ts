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
 * @modified 2024-11-30
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
