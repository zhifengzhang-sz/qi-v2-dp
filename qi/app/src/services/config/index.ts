/**
 * @fileoverview Service Configuration Application
 * @module qi/app/src/services/config
 *
 * @description
 * Provides service configuration management for the application. This module is responsible for:
 * - Loading and validating configuration from JSON files
 * - Loading and validating environment variables
 * - Providing typed access to service connection details
 * - Managing configuration for databases, message queues, monitoring, and networking
 *
 * The configuration files should be placed in the application's config directory:
 * - config/services-1.0.json: Main service configuration
 * - config/services.env: Environment variables
 *
 * Configuration structure:
 * - Databases: PostgreSQL, QuestDB, Redis
 * - Message Queue: Redpanda (Kafka API)
 * - Monitoring: Grafana, pgAdmin
 * - Networking: Service network mappings
 *
 * @example Basic Usage
 * ```typescript
 * import { initializeConfig } from './services/config/index.js';
 *
 * // Initialize configuration
 * const services = await initializeConfig();
 *
 * // Access service configurations
 * const pgConnString = services.databases.postgres.getConnectionString();
 * const redisConnString = services.databases.redis.getConnectionString();
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-12-01
 */

import { resolve } from "path";
import {
  loadServiceConfig,
  type ServiceConnections,
} from "@qi/core/services/config";

/**
 * Default configuration file paths
 *
 * @const
 * @type {Object}
 * @property {string} CONFIG_PATH - Path to the service configuration JSON file
 * @property {string} ENV_PATH - Path to the environment variable file
 */
export const CONFIG_PATHS = {
  CONFIG_PATH: resolve(process.cwd(), "config/services-1.0.json"),
  ENV_PATH: resolve(process.cwd(), "config/services.env"),
} as const;

/**
 * Initializes the service configuration.
 *
 * @async
 * @function
 * @returns {Promise<ServiceConnections>} Service connections interface providing access to all service configurations
 * @throws {ApplicationError} If configuration files cannot be loaded or validated
 *
 * @description
 * This function:
 * 1. Loads the service configuration JSON file
 * 2. Loads and validates environment variables
 * 3. Creates connection handlers for all services
 * 4. Validates service configurations against their schemas
 *
 * The returned ServiceConnections interface provides access to:
 * - Database connections (PostgreSQL, QuestDB, Redis)
 * - Message queue endpoints (Redpanda/Kafka)
 * - Monitoring service endpoints (Grafana, pgAdmin)
 * - Network configurations
 *
 * @example
 * ```typescript
 * // Initialize configuration
 * const services = await initializeConfig();
 *
 * // Access PostgreSQL configuration
 * const { host, port } = services.databases.postgres;
 * const connString = services.databases.postgres.getConnectionString();
 *
 * // Access Redpanda/Kafka configuration
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 * const schemaRegistry = services.messageQueue.getSchemaRegistryEndpoint();
 *
 * // Access network configuration
 * const dbNetwork = services.networking.getNetworkName("db");
 * ```
 */
export async function initializeConfig(): Promise<ServiceConnections> {
  return await loadServiceConfig({
    configPath: CONFIG_PATHS.CONFIG_PATH,
    envPath: CONFIG_PATHS.ENV_PATH,
  });
}

// Re-export types for convenience
export type { ServiceConnections } from "@qi/core/services/config";
