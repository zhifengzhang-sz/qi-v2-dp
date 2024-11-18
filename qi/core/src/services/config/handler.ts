/**
 * @fileoverview Handles transformation of raw service configuration into a structured domain-specific language (DSL)
 * @module handler
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-19
 */

// js/core/src/services/config/handler.ts
import { IConfigHandler } from "@qi/core/config";
import { ServiceConfig } from "./types.js";

/**
 * Domain-specific language (DSL) for service configuration.
 *
 * @description
 * Provides strongly-typed configuration structure for:
 * - Database connections (PostgreSQL, QuestDB, Redis)
 * - Message queues (Redpanda)
 * - Monitoring tools (Grafana, pgAdmin)
 * - Network settings
 *
 * @example
 * ```typescript
 * const dsl: ServiceDSL = {
 *   databases: {
 *     postgres: {
 *       connectionString: "postgresql://user:pass@localhost:5432/db",
 *       maxConnections: 20,
 *       poolConfig: { max: 20, idleTimeoutMs: 10000, connectionTimeoutMs: 3000 }
 *     },
 *     questdb: {
 *       endpoints: {
 *         http: "http://localhost:9000",
 *         postgresql: "postgresql://localhost:8812/questdb",
 *         influx: "http://localhost:9009"
 *       },
 *       options: { telemetryEnabled: false }
 *     }
 *   }
 * };
 * ```
 */
export interface ServiceDSL {
  databases: {
    postgres: {
      connectionString: string;
      maxConnections: number;
      poolConfig: {
        max: number;
        idleTimeoutMs: number;
        connectionTimeoutMs: number;
      };
    };
    questdb: {
      endpoints: {
        http: string;
        postgresql: string;
        influx: string;
      };
      options: {
        telemetryEnabled: boolean;
      };
    };
    redis: {
      connectionString: string;
      options: {
        maxRetries: number;
        retryDelayMs: number;
        maxRetryDelayMs: number;
      };
    };
  };
  messageQueue: {
    redpanda: {
      brokers: string[];
      clientId: string;
      options: {
        schemaRegistry: {
          endpoint: string;
          timeout: number;
        };
        adminApi: {
          endpoint: string;
          timeout: number;
        };
        proxy: {
          endpoint: string;
          timeout: number;
        };
      };
    };
  };
  monitoring: {
    endpoints: {
      grafana: {
        url: string;
        auth: {
          username: string;
          password: string;
        };
        options: {
          plugins: string[];
          datasources: {
            questdb: boolean;
            postgresql: boolean;
          };
        };
      };
      pgAdmin: {
        url: string;
        auth: {
          email: string;
          password: string;
        };
        options: {
          defaultDatabase: string;
        };
      };
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
 * Handler that transforms raw configuration into a domain-specific language.
 *
 * @description
 * Processes raw configuration into structured, type-safe format following DSL specification.
 * Implements IConfigHandler interface to provide consistent configuration handling.
 *
 * @example
 * ```typescript
 * const handler = new ServiceConfigHandler();
 * const dsl = handler.handle({
 *   databases: {
 *     postgres: {
 *       host: "localhost",
 *       port: 5432,
 *       user: "admin",
 *       password: "password",
 *       database: "mydb",
 *       maxConnections: 20
 *     }
 *   }
 * });
 * console.log(dsl.databases.postgres.connectionString);
 * // Output: postgresql://admin:password@localhost:5432/mydb
 * ```
 */
export class ServiceConfigHandler
  implements IConfigHandler<ServiceConfig, ServiceDSL>
{
  /**
   * Transforms raw service configuration into structured DSL format.
   *
   * @param config - Raw service configuration object
   * @returns Processed configuration in ServiceDSL format
   */
  handle(config: ServiceConfig): ServiceDSL {
    return {
      databases: this.buildDatabasesConfig(config),
      messageQueue: this.buildMessageQueueConfig(config),
      monitoring: this.buildMonitoringConfig(config),
      networking: this.buildNetworkingConfig(config),
    };
  }

  /**
   * Builds database configuration section.
   *
   * @param config - Raw service configuration
   * @returns Database configuration in DSL format
   */
  private buildDatabasesConfig(config: ServiceConfig): ServiceDSL["databases"] {
    const { databases } = config;

    return {
      postgres: {
        connectionString: this.buildPostgresConnectionString(
          databases.postgres
        ),
        maxConnections: databases.postgres.maxConnections,
        poolConfig: {
          max: databases.postgres.maxConnections,
          idleTimeoutMs: 10000,
          connectionTimeoutMs: 3000,
        },
      },
      questdb: {
        endpoints: {
          http: `http://${databases.questdb.host}:${databases.questdb.httpPort}`,
          postgresql: `postgresql://${databases.questdb.host}:${databases.questdb.pgPort}/questdb`,
          influx: `http://${databases.questdb.host}:${databases.questdb.influxPort}`,
        },
        options: {
          telemetryEnabled: databases.questdb.telemetryEnabled,
        },
      },
      redis: {
        connectionString: this.buildRedisConnectionString(databases.redis),
        options: {
          maxRetries: databases.redis.maxRetries,
          retryDelayMs: 1000,
          maxRetryDelayMs: 5000,
        },
      },
    };
  }

  /**
   * Builds message queue configuration section.
   *
   * @param config - Raw service configuration
   * @returns Message queue configuration in DSL format
   */
  private buildMessageQueueConfig(
    config: ServiceConfig
  ): ServiceDSL["messageQueue"] {
    const { redpanda } = config.messageQueue;

    return {
      redpanda: {
        brokers: [`${redpanda.advertisedKafkaApi}:${redpanda.kafkaPort}`],
        clientId: "qi-service",
        options: {
          schemaRegistry: {
            endpoint: `http://${redpanda.advertisedSchemaRegistryApi}:${redpanda.schemaRegistryPort}`,
            timeout: 5000,
          },
          adminApi: {
            endpoint: `http://${redpanda.advertisedKafkaApi}:${redpanda.adminPort}`,
            timeout: 5000,
          },
          proxy: {
            endpoint: `http://${redpanda.advertisedPandaproxyApi}:${redpanda.pandaproxyPort}`,
            timeout: 5000,
          },
        },
      },
    };
  }

  /**
   * Builds monitoring configuration section.
   *
   * @param config - Raw service configuration
   * @returns Monitoring configuration in DSL format
   */
  private buildMonitoringConfig(
    config: ServiceConfig
  ): ServiceDSL["monitoring"] {
    const { monitoring } = config;

    return {
      endpoints: {
        grafana: {
          url: `http://${monitoring.grafana.host}:${monitoring.grafana.port}`,
          auth: {
            username: "admin",
            password: monitoring.grafana.adminPassword,
          },
          options: {
            plugins: monitoring.grafana.plugins.split(";"),
            datasources: {
              questdb: monitoring.grafana.plugins.includes(
                "questdb-questdb-datasource"
              ),
              postgresql: monitoring.grafana.plugins.includes(
                "grafana-postgresql-datasource"
              ),
            },
          },
        },
        pgAdmin: {
          url: `http://${monitoring.pgAdmin.host}:${monitoring.pgAdmin.port}`,
          auth: {
            email: monitoring.pgAdmin.email,
            password: monitoring.pgAdmin.password,
          },
          options: {
            defaultDatabase: "postgres",
          },
        },
      },
    };
  }

  /**
   * Builds networking configuration section.
   *
   * @param config - Raw service configuration
   * @returns Networking configuration in DSL format
   */
  private buildNetworkingConfig(
    config: ServiceConfig
  ): ServiceDSL["networking"] {
    return {
      networks: config.networking.networks,
    };
  }

  /**
   * Builds PostgreSQL connection string from config parameters.
   *
   * @param config - PostgreSQL configuration object
   * @returns Formatted connection string
   */
  private buildPostgresConnectionString(
    config: ServiceConfig["databases"]["postgres"]
  ): string {
    return `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Builds Redis connection string from config parameters.
   *
   * @param config - Redis configuration object
   * @returns Formatted connection string
   */
  private buildRedisConnectionString(
    config: ServiceConfig["databases"]["redis"]
  ): string {
    return `redis://:${config.password}@${config.host}:${config.port}`;
  }
}
