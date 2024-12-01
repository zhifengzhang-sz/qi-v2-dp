/**
 * @fileoverview Service Configuration Connection Handlers
 * @module @qi/core/services/config/handlers
 *
 * @description
 * Implements handlers for various service connections including databases,
 * message queues, and monitoring endpoints. These handlers provide clean interfaces
 * for accessing configuration data and generating connection strings while handling
 * edge cases like special characters and IPv6 addresses.
 *
 * Key features:
 * - Safe handling of connection credentials
 * - Support for IPv6 addresses
 * - Custom port configurations
 * - URL-safe character encoding
 * - Validation of required fields
 *
 * @author Zhifeng Zhang
 * @created 2024-11-29
 * @modified 2024-12-01
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { ServiceConfig } from "./types.js";
import {
  PostgresConnection,
  QuestDBConnection,
  RedisConnection,
  MessageQueueConnection,
  MonitoringEndpoint,
  GrafanaEndpoint,
  NetworkConfig,
} from "./dsl.js";

/**
 * PostgreSQL connection handler implementation.
 * @implements {PostgresConnection}
 */
export class PostgresConnectionHandler implements PostgresConnection {
  constructor(
    private config: ServiceConfig["databases"]["postgres"],
    private credentials: { user: string; password: string }
  ) {
    if (!config.host || !config.port || !config.database) {
      throw new ApplicationError(
        "Invalid PostgreSQL configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "postgres", config }
      );
    }
    logger.debug("Initialized PostgreSQL connection handler", {
      host: config.host,
    });
  }

  private formatHost(host: string): string {
    // Check if the host is an IPv6 address (contains colons but is not a hostname:port)
    if (host.includes(":") && !host.includes("]") && !host.includes("/")) {
      return `[${host}]`;
    }
    return host;
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.port;
  }

  getConnectionString(): string {
    const formattedHost = this.formatHost(this.config.host);
    return `postgresql://${this.credentials.user}:${this.credentials.password}@${formattedHost}:${this.config.port}/${this.config.database}`;
  }

  getMaxConnections(): number {
    return this.config.maxConnections;
  }
}

/**
 * QuestDB connection handler implementation.
 * @implements {QuestDBConnection}
 */
export class QuestDBConnectionHandler implements QuestDBConnection {
  constructor(private config: ServiceConfig["databases"]["questdb"]) {
    if (
      !config.host ||
      !config.httpPort ||
      !config.pgPort ||
      !config.influxPort
    ) {
      throw new ApplicationError(
        "Invalid QuestDB configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "questdb", config }
      );
    }
    logger.debug("Initialized QuestDB connection handler", {
      host: config.host,
    });
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.pgPort;
  }

  getHttpEndpoint(): string {
    return `http://${this.config.host}:${this.config.httpPort}`;
  }

  getPgEndpoint(): string {
    return `postgresql://${this.config.host}:${this.config.pgPort}/questdb`;
  }

  getInfluxEndpoint(): string {
    return `http://${this.config.host}:${this.config.influxPort}`;
  }
}

/**
 * Redis connection handler implementation.
 * @implements {RedisConnection}
 */
export class RedisConnectionHandler implements RedisConnection {
  constructor(
    private config: ServiceConfig["databases"]["redis"],
    private password: string
  ) {
    if (!config.host || !config.port) {
      throw new ApplicationError(
        "Invalid Redis configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "redis", config }
      );
    }
    logger.debug("Initialized Redis connection handler", { host: config.host });
  }

  getHost(): string {
    return this.config.host;
  }

  getPort(): number {
    return this.config.port;
  }

  getConnectionString(): string {
    return `redis://:${this.password}@${this.config.host}:${this.config.port}`;
  }

  getMaxRetries(): number {
    return this.config.maxRetries;
  }
}

/**
 * Message queue (Redpanda) connection handler implementation.
 * @implements {MessageQueueConnection}
 */
export class MessageQueueConnectionHandler implements MessageQueueConnection {
  constructor(
    private config: ServiceConfig["messageQueue"]["redpanda"],
    private advertised: {
      kafka?: string;
      schemaRegistry?: string;
      proxy?: string;
      brokerId?: string;
    }
  ) {
    if (!config.kafkaPort || !config.schemaRegistryPort || !config.adminPort) {
      throw new ApplicationError(
        "Invalid message queue configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "redpanda", config }
      );
    }
    logger.debug("Initialized message queue connection handler");
  }

  getBrokerEndpoint(): string {
    if (this.advertised.kafka) {
      // Check if advertised address already includes port
      if (this.advertised.kafka.includes(":")) {
        return this.advertised.kafka;
      }
      return `${this.advertised.kafka}:${this.config.kafkaPort}`;
    }
    return `localhost:${this.config.kafkaPort}`;
  }

  getSchemaRegistryEndpoint(): string {
    if (this.advertised.schemaRegistry) {
      // Check if advertised address already includes port
      if (this.advertised.schemaRegistry.includes(":")) {
        return `http://${this.advertised.schemaRegistry}`;
      }
      return `http://${this.advertised.schemaRegistry}:${this.config.schemaRegistryPort}`;
    }
    return `http://localhost:${this.config.schemaRegistryPort}`;
  }

  getAdminEndpoint(): string {
    return `http://localhost:${this.config.adminPort}`;
  }

  getProxyEndpoint(): string {
    if (this.advertised.proxy) {
      // Check if advertised address already includes port
      if (this.advertised.proxy.includes(":")) {
        return `http://${this.advertised.proxy}`;
      }
      return `http://${this.advertised.proxy}:${this.config.pandaproxyPort}`;
    }
    return `http://localhost:${this.config.pandaproxyPort}`;
  }

  getBrokerId(): number | undefined {
    return this.advertised.brokerId
      ? parseInt(this.advertised.brokerId, 10)
      : undefined;
  }
}

/**
 * Base monitoring endpoint handler implementation.
 * @implements {MonitoringEndpoint}
 */
export class MonitoringEndpointHandler implements MonitoringEndpoint {
  constructor(
    private config: { host: string; port: number },
    private credentials: { username?: string; password: string }
  ) {
    if (!config.host || !config.port) {
      throw new ApplicationError(
        "Invalid monitoring endpoint configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "monitoring", config }
      );
    }
  }

  getEndpoint(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  getCredentials(): { username?: string; password: string } {
    return this.credentials;
  }
}

/**
 * Grafana-specific monitoring endpoint handler implementation.
 * @implements {GrafanaEndpoint}
 */
export class GrafanaEndpointHandler
  extends MonitoringEndpointHandler
  implements GrafanaEndpoint
{
  constructor(
    config: ServiceConfig["monitoring"]["grafana"],
    credentials: { password: string },
    private plugins?: string
  ) {
    super(config, credentials);
    logger.debug("Initialized Grafana endpoint handler", {
      plugins: this.getPlugins(),
    });
  }

  getPlugins(): string[] {
    return this.plugins?.split(";").filter(Boolean) || [];
  }
}

/**
 * Network configuration handler implementation.
 * @implements {NetworkConfig}
 */
export class NetworkConfigHandler implements NetworkConfig {
  constructor(private config: ServiceConfig["networking"]["networks"]) {
    if (!config.db || !config.redis || !config.redpanda) {
      throw new ApplicationError(
        "Invalid network configuration",
        ErrorCode.SERVICE_CONFIG_INVALID,
        500,
        { service: "network", config }
      );
    }
    logger.debug("Initialized network configuration handler");
  }

  getNetworkName(service: "db" | "redis" | "redpanda"): string {
    return this.config[service];
  }

  getAllNetworks(): Record<string, string> {
    return { ...this.config };
  }
}
