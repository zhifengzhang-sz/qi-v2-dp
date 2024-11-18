/**
 * @fileoverview Defines the configuration schemas for the service module
 * @module schemas
 *
 * @author Zhifeng Zhang
 * @created 2023-11-18
 * @modified 2024-11-19
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Base configuration schema for the service, excluding sensitive data
 */
export const serviceConfigSchema: JsonSchema = {
  $id: "service-config",
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
          type: "object",
          required: ["host", "port", "database", "user", "maxConnections"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            database: { type: "string" },
            user: { type: "string" },
            maxConnections: { type: "integer", minimum: 1 },
          },
        },
        questdb: {
          type: "object",
          required: ["host", "httpPort", "pgPort", "influxPort"],
          properties: {
            host: { type: "string" },
            httpPort: { type: "integer" },
            pgPort: { type: "integer" },
            influxPort: { type: "integer" },
          },
        },
        redis: {
          type: "object",
          required: ["host", "port", "maxRetries"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            maxRetries: { type: "integer", minimum: 0 },
          },
        },
      },
    },
    messageQueue: {
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
            kafkaPort: { type: "integer" },
            schemaRegistryPort: { type: "integer" },
            adminPort: { type: "integer" },
            pandaproxyPort: { type: "integer" },
          },
        },
      },
    },
    monitoring: {
      type: "object",
      required: ["grafana", "pgAdmin"],
      properties: {
        grafana: {
          type: "object",
          required: ["host", "port"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
          },
        },
        pgAdmin: {
          type: "object",
          required: ["host", "port"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
          },
        },
      },
    },
    networking: {
      type: "object",
      required: ["networks"],
      properties: {
        networks: {
          type: "object",
          required: ["db", "redis", "redpanda"],
          properties: {
            db: { type: "string" },
            redis: { type: "string" },
            redpanda: { type: "string" },
          },
        },
      },
    },
  },
};

/**
 * Configuration schema for environment variables
 */
export const envConfigSchema: JsonSchema = {
  $id: "env-config",
  type: "object",
  required: [
    "POSTGRES_PASSWORD",
    "REDIS_PASSWORD",
    "GF_SECURITY_ADMIN_PASSWORD",
    "PGADMIN_DEFAULT_EMAIL",
    "PGADMIN_DEFAULT_PASSWORD",
  ],
  properties: {
    POSTGRES_PASSWORD: { type: "string", minLength: 1 },
    REDIS_PASSWORD: { type: "string", minLength: 1 },
    GF_SECURITY_ADMIN_PASSWORD: { type: "string", minLength: 1 },
    PGADMIN_DEFAULT_EMAIL: { type: "string", format: "email" },
    PGADMIN_DEFAULT_PASSWORD: { type: "string", minLength: 1 },
    QDB_TELEMETRY_ENABLED: { type: "string" },
    GF_INSTALL_PLUGINS: { type: "string" },
    REDPANDA_BROKER_ID: { type: "string" },
    REDPANDA_ADVERTISED_KAFKA_API: { type: "string" },
    REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API: { type: "string" },
    REDPANDA_ADVERTISED_PANDAPROXY_API: { type: "string" },
  },
  additionalProperties: true,
};

/**
 * Complete configuration schema for the merged service configuration
 */
export const mergedConfigSchema: JsonSchema = {
  $id: "merged-config",
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
          type: "object",
          required: [
            "host",
            "port",
            "database",
            "user",
            "maxConnections",
            "password",
          ],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            database: { type: "string" },
            user: { type: "string" },
            password: { type: "string", minLength: 1 },
            maxConnections: { type: "integer", minimum: 1 },
          },
        },
        questdb: {
          type: "object",
          required: [
            "host",
            "httpPort",
            "pgPort",
            "influxPort",
            "telemetryEnabled",
          ],
          properties: {
            host: { type: "string" },
            httpPort: { type: "integer" },
            pgPort: { type: "integer" },
            influxPort: { type: "integer" },
            telemetryEnabled: { type: "boolean" },
          },
        },
        redis: {
          type: "object",
          required: ["host", "port", "maxRetries", "password"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            maxRetries: { type: "integer", minimum: 0 },
            password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    messageQueue: {
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
            "brokerId",
            "advertisedKafkaApi",
            "advertisedSchemaRegistryApi",
            "advertisedPandaproxyApi",
          ],
          properties: {
            kafkaPort: { type: "integer" },
            schemaRegistryPort: { type: "integer" },
            adminPort: { type: "integer" },
            pandaproxyPort: { type: "integer" },
            brokerId: { type: "integer" },
            advertisedKafkaApi: { type: "string" },
            advertisedSchemaRegistryApi: { type: "string" },
            advertisedPandaproxyApi: { type: "string" },
          },
        },
      },
    },
    monitoring: {
      type: "object",
      required: ["grafana", "pgAdmin"],
      properties: {
        grafana: {
          type: "object",
          required: ["host", "port", "adminPassword", "plugins"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            adminPassword: { type: "string", minLength: 1 },
            plugins: { type: "string" },
          },
        },
        pgAdmin: {
          type: "object",
          required: ["host", "port", "email", "password"],
          properties: {
            host: { type: "string" },
            port: { type: "integer" },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    networking: {
      type: "object",
      required: ["networks"],
      properties: {
        networks: {
          type: "object",
          required: ["db", "redis", "redpanda"],
          properties: {
            db: { type: "string" },
            redis: { type: "string" },
            redpanda: { type: "string" },
          },
        },
      },
    },
  },
};
