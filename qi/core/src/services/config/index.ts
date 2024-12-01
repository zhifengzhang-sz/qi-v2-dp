/**
 * @fileoverview Service Configuration Module
 * @module @qi/core/services/config
 *
 * @description
 * Central module for managing service configurations in a distributed system.
 * Provides type-safe configuration loading, validation, and access through a DSL.
 *
 * Features:
 * - Type-safe configuration handling
 * - JSON Schema validation
 * - Environment variable integration
 * - Connection string generation
 * - Network configuration
 * - Comprehensive error handling
 *
 * @example Basic Usage
 * ```typescript
 * const services = await loadServiceConfig();
 *
 * // Database connections
 * const pgConn = services.databases.postgres.getConnectionString();
 * const redisConn = services.databases.redis.getConnectionString();
 *
 * // Message queue endpoints
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 *
 * // Monitoring endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * const services = await loadServiceConfig({
 *   configDir: "./custom/config",
 *   configFile: "services-prod.json",
 *   envFile: "services-prod.env"
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

// Core type definitions
export type { ServiceConfig, EnvConfig, LoadConfigResult } from "./types.js";

// Domain-specific interfaces
export type {
  ServiceConnections,
  DatabaseConnection,
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl.js";

// Schema definitions
export { serviceConfigSchema, envConfigSchema } from "./schema.js";

// Service handlers
export {
  PostgresConnectionHandler,
  QuestDBConnectionHandler,
  RedisConnectionHandler,
  MessageQueueConnectionHandler,
  GrafanaEndpointHandler,
  MonitoringEndpointHandler,
  NetworkConfigHandler,
} from "./handlers.js";

// Configuration loader
export { loadServiceConfig, LoadConfigOptions } from "./loader.js";

// Re-export necessary types from core for convenience
export type { JsonSchema } from "@qi/core/config";
