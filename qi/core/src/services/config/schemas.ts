/**
 * @fileoverview Service Configuration Schema Definitions
 * @module @qi/core/services/config/schema
 * @description
 * Defines JSON Schema for validating service configurations across different components.
 * The schema is structured in a hierarchical manner with separate definitions for:
 * - Base service configuration (without sensitive data)
 * - Environment variables configuration
 * - Merged configuration (combining base and environment configs)
 *
 * Each component (databases, message queues, monitoring tools) has its own sub-schema
 * that can be referenced and reused. This enables modular validation and configuration
 * management.
 *
 * @example Basic Schema Usage
 * ```typescript
 * import { serviceConfigSchema, envConfigSchema } from './schema';
 * import Ajv from 'ajv';
 *
 * const ajv = new Ajv();
 * const validate = ajv.compile(serviceConfigSchema);
 * const isValid = validate(configData);
 * ```
 *
 * @example Config Reference Structure
 * ```typescript
 * const config = {
 *   type: "service",
 *   version: "1.0.0",
 *   databases: {
 *     redis: {
 *       host: "localhost",
 *       port: 6379,
 *       maxRetries: 3
 *     }
 *   }
 * };
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2024-11-28
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Database connection configuration schemas
 * @namespace DatabaseSchemas
 */

/**
 * PostgreSQL database configuration schema
 * Defines required fields and constraints for Postgres connections
 *
 * @type {JsonSchema}
 * @memberof DatabaseSchemas
 */
const postgresSchema: JsonSchema = {
  $id: "qi://core/services/config/postgres.schema",
  type: "object",
  required: ["host", "port", "database", "user", "maxConnections"],
  properties: {
    host: {
      type: "string",
      description: "PostgreSQL server hostname",
    },
    port: {
      type: "integer",
      description: "PostgreSQL server port number",
      default: 5432,
    },
    database: {
      type: "string",
      description: "Database name",
    },
    user: {
      type: "string",
      description: "Database user",
    },
    maxConnections: {
      type: "integer",
      minimum: 1,
      description: "Maximum number of concurrent connections",
      default: 10,
    },
  },
};

/**
 * QuestDB database configuration schema
 * Defines required fields and constraints for QuestDB connections
 *
 * @type {JsonSchema}
 * @memberof DatabaseSchemas
 */
const questdbSchema: JsonSchema = {
  $id: "qi://core/services/config/questdb.schema",
  type: "object",
  required: ["host", "httpPort", "pgPort", "influxPort"],
  properties: {
    host: {
      type: "string",
      description: "QuestDB server hostname",
    },
    httpPort: {
      type: "integer",
      description: "HTTP API port",
      default: 9000,
    },
    pgPort: {
      type: "integer",
      description: "PostgreSQL wire protocol port",
      default: 8812,
    },
    influxPort: {
      type: "integer",
      description: "InfluxDB line protocol port",
      default: 9009,
    },
  },
};

/**
 * Redis database configuration schema
 * Defines required fields and constraints for Redis connections
 *
 * @type {JsonSchema}
 * @memberof DatabaseSchemas
 */
const redisSchema: JsonSchema = {
  $id: "qi://core/services/config/redis.schema",
  type: "object",
  required: ["host", "port", "maxRetries"],
  properties: {
    host: {
      type: "string",
      description: "Redis server hostname",
    },
    port: {
      type: "integer",
      description: "Redis server port",
      default: 6379,
    },
    maxRetries: {
      type: "integer",
      minimum: 0,
      description: "Maximum number of connection retries",
      default: 3,
    },
  },
};

/**
 * Message queue configuration schemas
 * @namespace MessageQueueSchemas
 */

/**
 * Redpanda message queue configuration schema
 * Defines required fields and constraints for Redpanda connections
 *
 * @type {JsonSchema}
 * @memberof MessageQueueSchemas
 */
const redpandaSchema: JsonSchema = {
  $id: "qi://core/services/config/redpanda.schema",
  type: "object",
  required: ["kafkaPort", "schemaRegistryPort", "adminPort", "pandaproxyPort"],
  properties: {
    kafkaPort: {
      type: "integer",
      description: "Kafka API port",
      default: 9092,
    },
    schemaRegistryPort: {
      type: "integer",
      description: "Schema Registry port",
      default: 8081,
    },
    adminPort: {
      type: "integer",
      description: "Admin API port",
      default: 9644,
    },
    pandaproxyPort: {
      type: "integer",
      description: "Pandaproxy port",
      default: 8082,
    },
  },
};

/**
 * Monitoring configuration schemas
 * @namespace MonitoringSchemas
 */

/**
 * Grafana monitoring configuration schema
 *
 * @type {JsonSchema}
 * @memberof MonitoringSchemas
 */
const grafanaSchema: JsonSchema = {
  $id: "qi://core/services/config/grafana.schema",
  type: "object",
  required: ["host", "port"],
  properties: {
    host: {
      type: "string",
      description: "Grafana server hostname",
    },
    port: {
      type: "integer",
      description: "Grafana web interface port",
      default: 3000,
    },
  },
};

/**
 * pgAdmin monitoring configuration schema
 *
 * @type {JsonSchema}
 * @memberof MonitoringSchemas
 */
const pgAdminSchema: JsonSchema = {
  $id: "qi://core/services/config/pgadmin.schema",
  type: "object",
  required: ["host", "port"],
  properties: {
    host: {
      type: "string",
      description: "pgAdmin server hostname",
    },
    port: {
      type: "integer",
      description: "pgAdmin web interface port",
      default: 5050,
    },
  },
};

/**
 * Networking configuration schema
 * Defines network names and configurations
 *
 * @type {JsonSchema}
 */
const networkingSchema: JsonSchema = {
  $id: "qi://core/services/config/networks.schema",
  type: "object",
  required: ["networks"],
  properties: {
    networks: {
      type: "object",
      required: ["db", "redis", "redpanda"],
      properties: {
        db: {
          type: "string",
          description: "Database network name",
        },
        redis: {
          type: "string",
          description: "Redis network name",
        },
        redpanda: {
          type: "string",
          description: "Redpanda network name",
        },
      },
    },
  },
};

/**
 * Base service configuration schema
 * Combines all component schemas into a complete service configuration
 * Does not include sensitive data (passwords, keys, etc.)
 *
 * @type {JsonSchema}
 */
export const serviceConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/service.schema",
  type: "object",
  required: [
    "type",
    "version",
    "databases",
    "messageQueue",
    "monitoring",
    "networking",
  ],
  properties: {
    type: {
      const: "service",
      description: "Service type identifier",
    },
    version: {
      type: "string",
      description: "Service configuration version",
    },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: {
        postgres: { $ref: "qi://core/services/config/postgres.schema#" },
        questdb: { $ref: "qi://core/services/config/questdb.schema#" },
        redis: { $ref: "qi://core/services/config/redis.schema#" },
      },
    },
    messageQueue: {
      type: "object",
      required: ["redpanda"],
      properties: {
        redpanda: { $ref: "qi://core/services/config/redpanda.schema#" },
      },
    },
    monitoring: {
      type: "object",
      required: ["grafana", "pgAdmin"],
      properties: {
        grafana: { $ref: "qi://core/services/config/grafana.schema#" },
        pgAdmin: { $ref: "qi://core/services/config/pgadmin.schema#" },
      },
    },
    networking: { $ref: "qi://core/services/config/networks.schema#" },
  },
};

/**
 * Environment variables configuration schema
 * Defines validation rules for environment variables
 *
 * @type {JsonSchema}
 */
export const envConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/env.schema",
  type: "object",
  required: [
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
    "GF_SECURITY_ADMIN_PASSWORD",
    "PGADMIN_DEFAULT_EMAIL",
    "PGADMIN_DEFAULT_PASSWORD",
  ],
  properties: {
    POSTGRES_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL database password",
    },
    REDIS_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Redis password",
    },
    GF_SECURITY_ADMIN_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "Grafana admin password",
    },
    PGADMIN_DEFAULT_EMAIL: {
      type: "string",
      format: "email",
      description: "pgAdmin default admin email",
    },
    PGADMIN_DEFAULT_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "pgAdmin default admin password",
    },
    QDB_TELEMETRY_ENABLED: {
      type: "string",
      description: "QuestDB telemetry enable flag",
    },
    GF_INSTALL_PLUGINS: {
      type: "string",
      description: "Grafana plugins to install",
    },
    REDPANDA_BROKER_ID: {
      type: "string",
      description: "Redpanda broker ID",
    },
    REDPANDA_ADVERTISED_KAFKA_API: {
      type: "string",
      description: "Advertised Kafka API address",
    },
    REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: {
      type: "string",
      description: "Advertised Schema Registry API address",
    },
    REDPANDA_ADVERTISED_PANDAPROXY_API: {
      type: "string",
      description: "Advertised Pandaproxy API address",
    },
  },
  additionalProperties: true,
};

/**
 * Merged configuration schema
 * Combines service config and environment variables
 * Includes all sensitive data and complete configuration
 *
 * @type {JsonSchema}
 */
export const mergedConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/merged.schema",
  type: "object",
  required: [
    "type",
    "version",
    "databases",
    "messageQueue",
    "monitoring",
    "networking",
  ],
  properties: {
    type: { const: "service" },
    version: { type: "string" },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: {
        postgres: {
          type: "object", // Add type here
          allOf: [
            { $ref: "qi://core/services/config/postgres.schema#" },
            {
              type: "object", // Add type here
              required: ["password"],
              properties: {
                password: { type: "string", minLength: 1 },
              },
            },
          ],
        },
        questdb: {
          type: "object",
          allOf: [
            { $ref: "qi://core/services/config/questdb.schema#" },
            {
              type: "object",
              required: ["telemetryEnabled"],
              properties: {
                telemetryEnabled: { type: "boolean" },
              },
            },
          ],
        },
        redis: {
          type: "object",
          allOf: [
            { $ref: "qi://core/services/config/redis.schema#" },
            {
              type: "object",
              required: ["password"],
              properties: {
                password: { type: "string", minLength: 1 },
              },
            },
          ],
        },
      },
    },
    messageQueue: {
      type: "object",
      required: ["redpanda"],
      properties: {
        redpanda: {
          type: "object",
          allOf: [
            { $ref: "qi://core/services/config/redpanda.schema#" },
            {
              type: "object",
              required: [
                "brokerId",
                "advertisedKafkaApi",
                "advertisedSchemaRegistryApi",
                "advertisedPandaproxyApi",
              ],
              properties: {
                brokerId: { type: "integer" },
                advertisedKafkaApi: { type: "string" },
                advertisedSchemaRegistryApi: { type: "string" },
                advertisedPandaproxyApi: { type: "string" },
              },
            },
          ],
        },
      },
    },
    monitoring: {
      type: "object",
      required: ["grafana", "pgAdmin"],
      properties: {
        grafana: {
          type: "object",
          allOf: [
            { $ref: "qi://core/services/config/grafana.schema#" },
            {
              type: "object",
              required: ["adminPassword", "plugins"],
              properties: {
                adminPassword: { type: "string", minLength: 1 },
                plugins: { type: "string" },
              },
            },
          ],
        },
        pgAdmin: {
          type: "object",
          allOf: [
            { $ref: "qi://core/services/config/pgadmin.schema#" },
            {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 1 },
              },
            },
          ],
        },
      },
    },
    networking: { $ref: "qi://core/services/config/networks.schema#" },
  },
};

/**
 * Export all schemas for registration
 * Enables modular schema registration and management
 *
 * @example Registration
 * ```typescript
 * import { schemas } from './schema';
 *
 * // Register all schemas
 * Object.entries(schemas).forEach(([name, schema]) => {
 *   ajv.addSchema(schema, name);
 * });
 * ```
 */
export const schemas = {
  // Component Schemas
  postgres: postgresSchema,
  questdb: questdbSchema,
  redis: redisSchema,
  redpanda: redpandaSchema,
  grafana: grafanaSchema,
  pgAdmin: pgAdminSchema,
  networks: networkingSchema,

  // Main Schemas
  service: serviceConfigSchema,
  env: envConfigSchema,
  merged: mergedConfigSchema,
} as const;
