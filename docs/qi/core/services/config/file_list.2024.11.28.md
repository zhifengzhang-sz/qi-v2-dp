## The `qi/core/src/services/config` module
  
1. `qi/core/src/services/config/types.ts`
```ts
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
  
```  
  
2. `qi/core/src/services/config/schema.ts`
```ts
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
 * @modified 2024-11-27
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/postgres.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[&quot;host&quot;,%20&quot;port&quot;,%20&quot;database&quot;,%20&quot;user&quot;,%20&quot;maxConnections&quot;],%20%20properties:%20{%20%20%20%20host:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20description:%20&quot;PostgreSQL%20server%20hostname&quot;,%20%20%20%20},%20%20%20%20port:%20{%20%20%20%20%20%20type:%20&quot;integer&quot;,%20%20%20%20%20%20description:%20&quot;PostgreSQL%20server%20port%20number&quot;,%20%20%20%20%20%20default:%205432,%20%20%20%20},%20%20%20%20database:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20description:%20&quot;Database%20name&quot;,%20%20%20%20},%20%20%20%20user:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20description:%20&quot;Database%20user&quot;,%20%20%20%20},%20%20%20%20maxConnections:%20{%20%20%20%20%20%20type:%20&quot;integer&quot;,%20%20%20%20%20%20minimum:%201,%20%20%20%20%20%20description:%20&quot;Maximum%20number%20of%20concurrent%20connections&quot;,%20%20%20%20%20%20default:%2010,%20%20%20%20},%20%20},};/**%20*%20QuestDB%20database%20configuration%20schema%20*%20Defines%20required%20fields%20and%20constraints%20for%20QuestDB%20connections%20*%20*%20@type%20{JsonSchema}%20*%20@memberof%20DatabaseSchemas%20*/const%20questdbSchema:%20JsonSchema%20=%20{"/>id: "qi://core/services/config/questdb.schema",
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/redis.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[&quot;host&quot;,%20&quot;port&quot;,%20&quot;maxRetries&quot;],%20%20properties:%20{%20%20%20%20host:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20description:%20&quot;Redis%20server%20hostname&quot;,%20%20%20%20},%20%20%20%20port:%20{%20%20%20%20%20%20type:%20&quot;integer&quot;,%20%20%20%20%20%20description:%20&quot;Redis%20server%20port&quot;,%20%20%20%20%20%20default:%206379,%20%20%20%20},%20%20%20%20maxRetries:%20{%20%20%20%20%20%20type:%20&quot;integer&quot;,%20%20%20%20%20%20minimum:%200,%20%20%20%20%20%20description:%20&quot;Maximum%20number%20of%20connection%20retries&quot;,%20%20%20%20%20%20default:%203,%20%20%20%20},%20%20},};/**%20*%20Message%20queue%20configuration%20schemas%20*%20@namespace%20MessageQueueSchemas%20*//**%20*%20Redpanda%20message%20queue%20configuration%20schema%20*%20Defines%20required%20fields%20and%20constraints%20for%20Redpanda%20connections%20*%20*%20@type%20{JsonSchema}%20*%20@memberof%20MessageQueueSchemas%20*/const%20redpandaSchema:%20JsonSchema%20=%20{"/>id: "qi://core/services/config/redpanda.schema",
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/grafana.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[&quot;host&quot;,%20&quot;port&quot;],%20%20properties:%20{%20%20%20%20host:%20{%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20description:%20&quot;Grafana%20server%20hostname&quot;,%20%20%20%20},%20%20%20%20port:%20{%20%20%20%20%20%20type:%20&quot;integer&quot;,%20%20%20%20%20%20description:%20&quot;Grafana%20web%20interface%20port&quot;,%20%20%20%20%20%20default:%203000,%20%20%20%20},%20%20},};/**%20*%20pgAdmin%20monitoring%20configuration%20schema%20*%20*%20@type%20{JsonSchema}%20*%20@memberof%20MonitoringSchemas%20*/const%20pgAdminSchema:%20JsonSchema%20=%20{"/>id: "qi://core/services/config/pgadmin.schema",
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/networks.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[&quot;networks&quot;],%20%20properties:%20{%20%20%20%20networks:%20{%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20required:%20[&quot;db&quot;,%20&quot;redis&quot;,%20&quot;redpanda&quot;],%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20db:%20{%20%20%20%20%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20%20%20%20%20description:%20&quot;Database%20network%20name&quot;,%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20redis:%20{%20%20%20%20%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20%20%20%20%20description:%20&quot;Redis%20network%20name&quot;,%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20redpanda:%20{%20%20%20%20%20%20%20%20%20%20type:%20&quot;string&quot;,%20%20%20%20%20%20%20%20%20%20description:%20&quot;Redpanda%20network%20name&quot;,%20%20%20%20%20%20%20%20},%20%20%20%20%20%20},%20%20%20%20},%20%20},};/**%20*%20Base%20service%20configuration%20schema%20*%20Combines%20all%20component%20schemas%20into%20a%20complete%20service%20configuration%20*%20Does%20not%20include%20sensitive%20data%20(passwords,%20keys,%20etc.)%20*%20*%20@type%20{JsonSchema}%20*/export%20const%20serviceConfigSchema:%20JsonSchema%20=%20{"/>id: "qi://core/services/config/service.schema",
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
        postgres: { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/postgres.schema#&quot;%20},%20%20%20%20%20%20%20%20questdb:%20{"/>ref: "qi://core/services/config/questdb.schema#" },
        redis: { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/redis.schema#&quot;%20},%20%20%20%20%20%20},%20%20%20%20},%20%20%20%20messageQueue:%20{%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20required:%20[&quot;redpanda&quot;],%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20redpanda:%20{"/>ref: "qi://core/services/config/redpanda.schema#" },
      },
    },
    monitoring: {
      type: "object",
      required: ["grafana", "pgAdmin"],
      properties: {
        grafana: { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/grafana.schema#&quot;%20},%20%20%20%20%20%20%20%20pgAdmin:%20{"/>ref: "qi://core/services/config/pgadmin.schema#" },
      },
    },
    networking: { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/networks.schema#&quot;%20},%20%20},};/**%20*%20Environment%20variables%20configuration%20schema%20*%20Defines%20validation%20rules%20for%20environment%20variables%20*%20*%20@type%20{JsonSchema}%20*/export%20const%20envConfigSchema:%20JsonSchema%20=%20{"/>id: "qi://core/services/config/env.schema",
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
  <img src="https://latex.codecogs.com/gif.latex?id:%20&quot;qi://core/services/config/merged.schema&quot;,%20%20type:%20&quot;object&quot;,%20%20required:%20[%20%20%20%20&quot;type&quot;,%20%20%20%20&quot;version&quot;,%20%20%20%20&quot;databases&quot;,%20%20%20%20&quot;messageQueue&quot;,%20%20%20%20&quot;monitoring&quot;,%20%20%20%20&quot;networking&quot;,%20%20],%20%20properties:%20{%20%20%20%20type:%20{%20const:%20&quot;service&quot;%20},%20%20%20%20version:%20{%20type:%20&quot;string&quot;%20},%20%20%20%20databases:%20{%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20required:%20[&quot;postgres&quot;,%20&quot;questdb&quot;,%20&quot;redis&quot;],%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20postgres:%20{%20%20%20%20%20%20%20%20%20%20type:%20&quot;object&quot;,%20//%20Add%20type%20here%20%20%20%20%20%20%20%20%20%20allOf:%20[%20%20%20%20%20%20%20%20%20%20%20%20{"/>ref: "qi://core/services/config/postgres.schema#" },
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
            { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/questdb.schema#&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20{%20%20%20%20%20%20%20%20%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20required:%20[&quot;telemetryEnabled&quot;],%20%20%20%20%20%20%20%20%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20telemetryEnabled:%20{%20type:%20&quot;boolean&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20%20%20],%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20redis:%20{%20%20%20%20%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20%20%20%20%20allOf:%20[%20%20%20%20%20%20%20%20%20%20%20%20{"/>ref: "qi://core/services/config/redis.schema#" },
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
            { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/redpanda.schema#&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20{%20%20%20%20%20%20%20%20%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20required:%20[%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20&quot;brokerId&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20&quot;advertisedKafkaApi&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20&quot;advertisedSchemaRegistryApi&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20&quot;advertisedPandaproxyApi&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20],%20%20%20%20%20%20%20%20%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20brokerId:%20{%20type:%20&quot;integer&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20advertisedKafkaApi:%20{%20type:%20&quot;string&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20advertisedSchemaRegistryApi:%20{%20type:%20&quot;string&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20advertisedPandaproxyApi:%20{%20type:%20&quot;string&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20%20%20],%20%20%20%20%20%20%20%20},%20%20%20%20%20%20},%20%20%20%20},%20%20%20%20monitoring:%20{%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20required:%20[&quot;grafana&quot;,%20&quot;pgAdmin&quot;],%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20grafana:%20{%20%20%20%20%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20%20%20%20%20allOf:%20[%20%20%20%20%20%20%20%20%20%20%20%20{"/>ref: "qi://core/services/config/grafana.schema#" },
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
            { <img src="https://latex.codecogs.com/gif.latex?ref:%20&quot;qi://core/services/config/pgadmin.schema#&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20{%20%20%20%20%20%20%20%20%20%20%20%20%20%20type:%20&quot;object&quot;,%20%20%20%20%20%20%20%20%20%20%20%20%20%20required:%20[&quot;email&quot;,%20&quot;password&quot;],%20%20%20%20%20%20%20%20%20%20%20%20%20%20properties:%20{%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20email:%20{%20type:%20&quot;string&quot;,%20format:%20&quot;email&quot;%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20password:%20{%20type:%20&quot;string&quot;,%20minLength:%201%20},%20%20%20%20%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20%20%20%20%20},%20%20%20%20%20%20%20%20%20%20],%20%20%20%20%20%20%20%20},%20%20%20%20%20%20},%20%20%20%20},%20%20%20%20networking:%20{"/>ref: "qi://core/services/config/networks.schema#" },
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
  
```  
  
3. `qi/core/src/services/config/handler.ts`
```ts
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
          http: `http://<img src="https://latex.codecogs.com/gif.latex?{databases.questdb.host}:"/>{databases.questdb.httpPort}`,
          postgresql: `postgresql://<img src="https://latex.codecogs.com/gif.latex?{databases.questdb.host}:"/>{databases.questdb.pgPort}/questdb`,
          influx: `http://<img src="https://latex.codecogs.com/gif.latex?{databases.questdb.host}:"/>{databases.questdb.influxPort}`,
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
        brokers: [`<img src="https://latex.codecogs.com/gif.latex?{redpanda.advertisedKafkaApi}:"/>{redpanda.kafkaPort}`],
        clientId: "qi-service",
        options: {
          schemaRegistry: {
            endpoint: `http://<img src="https://latex.codecogs.com/gif.latex?{redpanda.advertisedSchemaRegistryApi}:"/>{redpanda.schemaRegistryPort}`,
            timeout: 5000,
          },
          adminApi: {
            endpoint: `http://<img src="https://latex.codecogs.com/gif.latex?{redpanda.advertisedKafkaApi}:"/>{redpanda.adminPort}`,
            timeout: 5000,
          },
          proxy: {
            endpoint: `http://<img src="https://latex.codecogs.com/gif.latex?{redpanda.advertisedPandaproxyApi}:"/>{redpanda.pandaproxyPort}`,
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
          url: `http://<img src="https://latex.codecogs.com/gif.latex?{monitoring.grafana.host}:"/>{monitoring.grafana.port}`,
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
          url: `http://<img src="https://latex.codecogs.com/gif.latex?{monitoring.pgAdmin.host}:"/>{monitoring.pgAdmin.port}`,
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
    return `postgresql://<img src="https://latex.codecogs.com/gif.latex?{config.user}:"/>{config.password}@<img src="https://latex.codecogs.com/gif.latex?{config.host}:"/>{config.port}/<img src="https://latex.codecogs.com/gif.latex?{config.database}`;%20%20}%20%20/**%20%20%20*%20Builds%20Redis%20connection%20string%20from%20config%20parameters.%20%20%20*%20%20%20*%20@param%20config%20-%20Redis%20configuration%20object%20%20%20*%20@returns%20Formatted%20connection%20string%20%20%20*/%20%20private%20buildRedisConnectionString(%20%20%20%20config:%20ServiceConfig[&quot;databases&quot;][&quot;redis&quot;]%20%20):%20string%20{%20%20%20%20return%20`redis://:"/>{config.password}@<img src="https://latex.codecogs.com/gif.latex?{config.host}:"/>{config.port}`;
  }
}
  
```  
  
4. `qi/core/src/services/config/loader.ts`
```ts
/**
 * @fileoverview Service configuration loading helper
 * @module services/config/loader
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-11-28
 *
 * @description
 * This module provides functionality to load, validate, and merge service and environment configurations.
 * It ensures that the necessary configuration files exist, applies schema validations, and caches the configurations
 * for optimized performance. The loader handles merging of service-specific settings with environment variables
 * to produce a consolidated configuration for the application.
 *
 * @example
 * ```typescript
 * import { loadServiceConfig } from './services/config/loader';
 *
 * const configOptions = {
 *   serviceConfigPath: './config/service.json',
 *   envConfigPath: './config/.env',
 *   cacheTTL: 300000, // Optional: Cache time-to-live in milliseconds
 * };
 *
 * loadServiceConfig(configOptions)
 *   .then(({ serviceConfig, envConfig, mergedConfig, dsl }) => {
 *     console.log('Service Configuration:', serviceConfig);
 *     console.log('Environment Configuration:', envConfig);
 *     console.log('Merged Configuration:', mergedConfig);
 *     console.log('DSL:', dsl);
 *   })
 *   .catch((error) => {
 *     console.error('Failed to load configurations:', error);
 *   });
 * ```
 */
  
import {
  Schema,
  ConfigFactory,
  IConfigFactory,
  ConfigCache,
  IConfigCache,
  BaseConfig,
  IConfigValidator,
  JsonLoader,
  EnvLoader,
} from "@qi/core/config";
  
import { logger } from "@qi/core/logger";
import { formatJsonWithColor } from "@qi/core/utils";
import { ServiceConfig, EnvConfig, ServiceDSL } from "./types.js";
import {
  serviceConfigSchema,
  envConfigSchema,
  mergedConfigSchema,
} from "./schemas.js";
import { ServiceConfigHandler } from "./handler.js";
import { ConfigLoaderError, CONFIG_LOADER_CODES } from "@qi/core/config";
  
/**
 * Configuration loading options
 */
export interface LoadServiceConfigOptions {
  /** Path to the service configuration file */
  serviceConfigPath: string;
  /** Path to the environment configuration file */
  envConfigPath: string;
  /** Optional cache time-to-live in milliseconds */
  cacheTTL?: number;
}
  
/**
 * Configuration loading result
 */
export interface LoadServiceConfigResult {
  /** Raw service configuration */
  serviceConfig: ServiceConfig;
  /** Environment configuration */
  envConfig: EnvConfig;
  /** Merged configuration combining service and environment settings */
  mergedConfig: ServiceConfig;
  /** Domain-specific language representation */
  dsl: ServiceDSL;
}
  
/**
 * Manages service configuration loading, validation, and transformation.
 * Uses the core configuration module for loading and validation while
 * providing service-specific merging and transformation logic.
 */
export class ServiceConfigLoader {
  private readonly factory: IConfigFactory;
  private readonly cache: IConfigCache<BaseConfig>;
  private readonly schema: Schema;
  
  /**
   * Creates a new service config loader
   * @param cacheTTL Cache duration in milliseconds
   */
  constructor(cacheTTL: number = 5 * 60 * 1000) {
    // Initialize cache with optional expiration callback
    this.cache = new ConfigCache({
      ttl: cacheTTL,
      refreshOnAccess: true,
      onExpire: (key) => logger.info("Config cache expired", { key }),
    });
  
    // Create schema manager and register schemas
    this.schema = new Schema({ formats: true });
    try {
      this.schema.registerSchema("service-config", serviceConfigSchema);
      this.schema.registerSchema("env-config", envConfigSchema);
      this.schema.registerSchema("merged-config", mergedConfigSchema);
    } catch (error) {
      throw ConfigLoaderError.create(
        "Failed to register schemas",
        CONFIG_LOADER_CODES.INVALID_SCHEMA,
        "schema-registration",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  
    // Initialize factory with schema and cache
    this.factory = new ConfigFactory(this.schema, this.cache);
  }
  
  /**
   * Loads and processes service configuration
   * @param options Loading options
   * @returns Promise resolving to the loaded configurations and DSL
   */
  async load({
    serviceConfigPath,
    envConfigPath,
    cacheTTL = 5 * 60 * 1000,
  }: LoadServiceConfigOptions): Promise<LoadServiceConfigResult> {
    try {
      // Create configs separately
      const serviceConfig = await this.loadServiceConfig(serviceConfigPath);
      const envConfig = await this.loadEnvConfig(envConfigPath, cacheTTL);
  
      this.logConfigs(serviceConfig, envConfig);
      const mergedConfig = this.mergeConfigs(serviceConfig, envConfig);
      const dsl = new ServiceConfigHandler().handle(mergedConfig);
  
      return { serviceConfig, envConfig, mergedConfig, dsl };
    } catch (error) {
      if (error instanceof ConfigLoaderError) throw error;
      throw ConfigLoaderError.create(
        "Failed to load service configuration",
        CONFIG_LOADER_CODES.CONFIG_LOAD_ERROR,
        serviceConfigPath,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * Loads service configuration from file
   * @private
   */
  private async loadServiceConfig(path: string): Promise<ServiceConfig> {
    this.factory.createLoader<ServiceConfig>({
      type: "service",
      version: "1.0",
      schema: serviceConfigSchema,
    });
    return new JsonLoader<ServiceConfig>(
      path,
      this.schema,
      "service-config"
    ).load();
  }
  
  /**
   * Loads environment configuration
   * @private
   */
  private async loadEnvConfig(
    path: string,
    refreshInterval: number
  ): Promise<EnvConfig> {
    this.factory.createLoader<EnvConfig>({
      type: "env",
      version: "1.0",
      schema: envConfigSchema,
    });
    return new EnvLoader<EnvConfig>(this.schema, "env-config", {
      path,
      required: true,
      watch: true,
      refreshInterval,
    }).load();
  }
  
  /**
   * Logs loaded configurations in development
   * @private
   */
  private logConfigs(serviceConfig: ServiceConfig, envConfig: EnvConfig): void {
    if (process.env.NODE_ENV !== "production") {
      console.log("\nLoaded Configs:");
      console.log(formatJsonWithColor({ serviceConfig, envConfig }));
    }
  }
  
  /**
   * Merges service and environment configurations
   * @private
   */
  private mergeConfigs(
    serviceConfig: ServiceConfig,
    envConfig: EnvConfig
  ): ServiceConfig {
    try {
      const mergedConfig = {
        ...serviceConfig,
        databases: {
          ...serviceConfig.databases,
          postgres: {
            ...serviceConfig.databases.postgres,
            password: envConfig.POSTGRES_PASSWORD,
          },
          questdb: {
            ...serviceConfig.databases.questdb,
            telemetryEnabled: envConfig.QDB_TELEMETRY_ENABLED === "true",
          },
          redis: {
            ...serviceConfig.databases.redis,
            password: envConfig.REDIS_PASSWORD,
          },
        },
        monitoring: {
          ...serviceConfig.monitoring,
          grafana: {
            ...serviceConfig.monitoring.grafana,
            adminPassword: envConfig.GF_SECURITY_ADMIN_PASSWORD,
            plugins: envConfig.GF_INSTALL_PLUGINS || "",
          },
          pgAdmin: {
            ...serviceConfig.monitoring.pgAdmin,
            email: envConfig.PGADMIN_DEFAULT_EMAIL,
            password: envConfig.PGADMIN_DEFAULT_PASSWORD,
          },
        },
      };
  
      // Validate merged config
      const validator: IConfigValidator<ServiceConfig> =
        this.factory.createValidator<ServiceConfig>(mergedConfigSchema);
      validator.validate(mergedConfig);
  
      return mergedConfig;
    } catch (error) {
      throw ConfigLoaderError.create(
        "Failed to merge configurations",
        CONFIG_LOADER_CODES.CONFIG_PARSE_ERROR,
        "config-merge",
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  /**
   * Creates loader instance and loads configuration
   * @static
   * @param options Loading options
   * @returns Promise resolving to the loaded configurations and DSL
   */
  static async createAndLoad(
    options: LoadServiceConfigOptions
  ): Promise<LoadServiceConfigResult> {
    const loader = new ServiceConfigLoader(options.cacheTTL);
    return loader.load(options);
  }
}
  
/**
 * Convenience function for loading service configuration
 */
export const loadServiceConfig = ServiceConfigLoader.createAndLoad;
  
```  
  
  