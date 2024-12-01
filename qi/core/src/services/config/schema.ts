/**
 * @fileoverview Service Configuration Schema
 * @module @qi/core/services/config/schema
 *
 * @description
 * Defines JSON Schema validation for services configuration.
 * Provides strict validation for configuration structure and values.
 *
 * Improvements:
 * - Single source of schema definitions
 * - Reusable schema components
 * - Strict port number validation
 * - Required field enforcement
 * - Clear field descriptions
 * - Format validations
 *
 * @example
 * ```typescript
 * import { Schema } from '@qi/core/config';
 * import { serviceConfigSchema } from './schema';
 *
 * const schema = new Schema({ formats: true });
 * schema.registerSchema('service-config', serviceConfigSchema);
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-11-29
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Port number validation schema
 * Reusable component for validating TCP/UDP ports
 */
const portSchema: JsonSchema = {
  type: "number",
  minimum: 1,
  maximum: 65535,
  description: "Valid TCP/UDP port number",
};

/**
 * Host validation schema
 * Reusable component for validating hostnames
 */
const hostSchema: JsonSchema = {
  type: "string",
  minLength: 1,
  description: "Hostname or IP address",
};

/**
 * Database schemas collection
 */
const databaseSchemas: Record<string, JsonSchema> = {
  postgres: {
    type: "object",
    required: ["host", "port", "database", "user", "maxConnections"],
    properties: {
      host: hostSchema,
      port: portSchema,
      database: {
        type: "string",
        minLength: 1,
        description: "Database name",
      },
      user: {
        type: "string",
        minLength: 1,
        description: "Database user",
      },
      maxConnections: {
        type: "number",
        minimum: 1,
        description: "Maximum number of connections",
      },
    },
    additionalProperties: false,
  },

  questdb: {
    type: "object",
    required: ["host", "httpPort", "pgPort", "influxPort"],
    properties: {
      host: hostSchema,
      httpPort: {
        ...portSchema,
        description: "HTTP API port",
      },
      pgPort: {
        ...portSchema,
        description: "PostgreSQL wire protocol port",
      },
      influxPort: {
        ...portSchema,
        description: "InfluxDB line protocol port",
      },
    },
    additionalProperties: false,
  },

  redis: {
    type: "object",
    required: ["host", "port", "maxRetries"],
    properties: {
      host: hostSchema,
      port: portSchema,
      maxRetries: {
        type: "number",
        minimum: 0,
        description: "Maximum number of connection retries",
      },
    },
    additionalProperties: false,
  },
};

/**
 * Message queue schema
 */
const messageQueueSchema: JsonSchema = {
  type: "object",
  required: ["redpanda"],
  properties: {
    redpanda: {
      type: "object",
      required: [
        "kafkaPort",
        "schemaRegistryPort",
        "adminPort",
        "pandaproxyPort",
      ],
      properties: {
        kafkaPort: {
          ...portSchema,
          description: "Kafka API port",
        },
        schemaRegistryPort: {
          ...portSchema,
          description: "Schema Registry port",
        },
        adminPort: {
          ...portSchema,
          description: "Admin API port",
        },
        pandaproxyPort: {
          ...portSchema,
          description: "REST Proxy port",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Monitoring schema
 */
const monitoringSchema: JsonSchema = {
  type: "object",
  required: ["grafana", "pgAdmin"],
  properties: {
    grafana: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: hostSchema,
        port: portSchema,
      },
      additionalProperties: false,
    },
    pgAdmin: {
      type: "object",
      required: ["host", "port"],
      properties: {
        host: hostSchema,
        port: portSchema,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Complete service configuration schema
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
      const: "services",
      description: "Configuration type identifier",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+$",
      description: "Configuration version (semver format)",
    },
    databases: {
      type: "object",
      required: ["postgres", "questdb", "redis"],
      properties: databaseSchemas,
      additionalProperties: false,
    },
    messageQueue: messageQueueSchema,
    monitoring: monitoringSchema,
    networking: {
      type: "object",
      required: ["networks"],
      properties: {
        networks: {
          type: "object",
          required: ["db", "redis", "redpanda"],
          properties: {
            db: {
              type: "string",
              minLength: 1,
              description: "Database network name",
            },
            redis: {
              type: "string",
              minLength: 1,
              description: "Redis network name",
            },
            redpanda: {
              type: "string",
              minLength: 1,
              description: "Message queue network name",
            },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

/**
 * Environment configuration schema
 */
export const envConfigSchema: JsonSchema = {
  $id: "qi://core/services/config/env.schema",
  type: "object",
  required: [
    "POSTGRES_PASSWORD",
    "POSTGRES_USER",
    "POSTGRES_DB",
    "REDIS_PASSWORD",
    "GF_SECURITY_ADMIN_PASSWORD",
    "PGADMIN_DEFAULT_EMAIL",
    "PGADMIN_DEFAULT_PASSWORD",
  ],
  properties: {
    POSTGRES_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL password",
    },
    POSTGRES_USER: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL username",
    },
    POSTGRES_DB: {
      type: "string",
      minLength: 1,
      description: "PostgreSQL database name",
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
    GF_INSTALL_PLUGINS: {
      type: "string",
      description: "Semicolon-separated list of Grafana plugins",
    },
    PGADMIN_DEFAULT_EMAIL: {
      type: "string",
      format: "email",
      description: "pgAdmin administrator email",
    },
    PGADMIN_DEFAULT_PASSWORD: {
      type: "string",
      minLength: 1,
      description: "pgAdmin administrator password",
    },
    QDB_TELEMETRY_ENABLED: {
      type: "string",
      enum: ["true", "false"],
      description: "QuestDB telemetry setting",
    },
    REDPANDA_BROKER_ID: {
      type: "string",
      pattern: "^\\d+$",
      description: "Redpanda broker ID",
    },
    REDPANDA_ADVERTISED_KAFKA_API: {
      type: "string",
      description: "Advertised Kafka API address",
    },
    REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: {
      type: "string",
      description: "Advertised Schema Registry address",
    },
    REDPANDA_ADVERTISED_PANDAPROXY_API: {
      type: "string",
      description: "Advertised REST Proxy address",
    },
  },
  additionalProperties: true,
};
