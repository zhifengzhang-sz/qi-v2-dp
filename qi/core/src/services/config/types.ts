/**
 * @fileoverview Defines the configuration types for the service module
 * @module types
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2024-11-19
 */

import { BaseConfig } from "@qi/core/config";

/**
 * Represents the configuration for a service
 */
export interface ServiceConfig extends BaseConfig {
  type: "service";
  version: string;
  databases: {
    postgres: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
      maxConnections: number;
    };
    questdb: {
      host: string;
      httpPort: number;
      pgPort: number;
      influxPort: number;
      telemetryEnabled: boolean;
    };
    redis: {
      host: string;
      port: number;
      password: string;
      maxRetries: number;
    };
  };
  messageQueue: {
    redpanda: {
      brokerId: number;
      advertisedKafkaApi: string;
      advertisedSchemaRegistryApi: string;
      advertisedPandaproxyApi: string;
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
      adminPassword: string;
      plugins: string;
    };
    pgAdmin: {
      host: string;
      port: number;
      email: string;
      password: string;
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
 * Defines the domain-specific language (DSL) for service configuration
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
 * Represents the configuration that will be loaded from environment variables.
 * It extends BaseConfig and allows for string | undefined values.
 */
export interface EnvConfig
  extends BaseConfig,
    Record<string, string | undefined> {
  type: "service";
  version: string;
  // Environment variables
  POSTGRES_PASSWORD: string;
  REDIS_PASSWORD: string;
  QDB_PG_PASSWORD: string;
  GF_SECURITY_ADMIN_PASSWORD: string;
  PGADMIN_DEFAULT_EMAIL: string;
  PGADMIN_DEFAULT_PASSWORD: string;
  REDPANDA_SUPERUSER_PASSWORD: string;
  REDPANDA_ADMIN_API_KEY: string;
  REDPANDA_SCHEMA_REGISTRY_API_KEY: string;
  JWT_SECRET: string;
}
