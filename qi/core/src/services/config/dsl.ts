/**
 * @fileoverview Service Configuration Domain-Specific Language (DSL)
 * @module @qi/core/services/config/dsl
 *
 * @description
 * Defines the domain-specific interfaces for service configuration management.
 * These interfaces provide a type-safe and intuitive API for accessing service
 * configurations including databases, message queues, monitoring tools, and
 * network settings.
 *
 * Key features:
 * - Type-safe service access
 * - Clear interface definitions
 * - Connection string generation
 * - Endpoint URL construction
 *
 * @example
 * ```typescript
 * // Type-safe service access
 * const postgres = services.databases.postgres;
 * const connString = postgres.getConnectionString();
 *
 * // Generate service endpoints
 * const grafanaUrl = services.monitoring.grafana.getEndpoint();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-04
 * @created 2024-11-29
 */

/**
 * Base interface for database connections
 *
 * @interface DatabaseConnection
 */
export interface DatabaseConnection {
  getDatabase(): string;
  getUser(): string;
  getPassword(): string;
  getHost(): string;
  getPort(): number;
}

/**
 * PostgreSQL database connection interface
 *
 * @interface PostgresConnection
 * @extends {DatabaseConnection}
 */
export interface PostgresConnection extends DatabaseConnection {
  getConnectionString(): string;
  getMaxConnections(): number;
}

/**
 * QuestDB time-series database connection interface
 *
 * @interface QuestDBConnection
 * @extends {DatabaseConnection}
 */
export interface QuestDBConnection extends DatabaseConnection {
  getHttpEndpoint(): string;
  getPgEndpoint(): string;
  getInfluxEndpoint(): string;
}

/**
 * Redis cache connection interface
 *
 * @interface RedisConnection
 * @extends {DatabaseConnection}
 */
export interface RedisConnection extends DatabaseConnection {
  getConnectionString(): string;
  getMaxRetries(): number;
}

/**
 * Message queue connection interface
 *
 * @interface MessageQueueConnection
 */
export interface MessageQueueConnection {
  getBrokerEndpoint(): string;
  getSchemaRegistryEndpoint(): string;
  getAdminEndpoint(): string;
  getProxyEndpoint(): string;
  getBrokerId(): number | undefined;
}

/**
 * Monitoring service endpoint interface
 *
 * @interface MonitoringEndpoint
 */
export interface MonitoringEndpoint {
  getEndpoint(): string;
  getCredentials(): { username?: string; password: string };
}

/**
 * Grafana monitoring interface extending base monitoring
 *
 * @interface GrafanaEndpoint
 * @extends {MonitoringEndpoint}
 */
export interface GrafanaEndpoint extends MonitoringEndpoint {
  getPlugins(): string[];
}

/**
 * Network configuration interface
 *
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  getNetworkName(service: "db" | "redis" | "redpanda"): string;
  getAllNetworks(): Record<string, string>;
}

/**
 * Complete service connections interface
 *
 * @interface ServiceConnections
 */
export interface ServiceConnections {
  databases: {
    postgres: PostgresConnection;
    questdb: QuestDBConnection;
    redis: RedisConnection;
  };
  messageQueue: MessageQueueConnection;
  monitoring: {
    grafana: GrafanaEndpoint;
    pgAdmin: MonitoringEndpoint;
  };
  networking: NetworkConfig;
}
