// src/config/schemas/ServiceSchema.ts

import { Ajv, ValidateFunction } from "ajv";
import { BaseConfig } from "@qi/core/config";

/**
 * @fileoverview Defines JSON schema validation for Service configurations
 * @module ServiceSchema
 */

/**
 * Interfaces for Service Configuration
 */
export interface DatabaseConfig {
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  pgData?: string;
}

export interface RedisConfig {
  redisHost: string;
  redisPort: number;
  redisPassword: string;
}

export interface KafkaConfig {
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaGroupId: string;
}

export interface AppConfig {
  nodeEnv: "development" | "production" | "test";
  logLevel: "error" | "warn" | "info" | "debug";
  apiPort: number;
}

interface ServiceConfig extends BaseConfig {
  type: "service";
  database: DatabaseConfig;
  redis: RedisConfig;
  kafka: KafkaConfig;
  app: AppConfig;
}

/**
 * Define schemas in a consistent and structured manner
 */
const schemas = {
  AppSchema: {
    $id: "qi://core/config/app.schema",
    type: "object",
    properties: {
      nodeEnv: { type: "string", enum: ["development", "production", "test"] },
      logLevel: { type: "string", enum: ["error", "warn", "info", "debug"] },
      apiPort: { type: "number" },
    },
    required: ["nodeEnv", "logLevel", "apiPort"],
    additionalProperties: false,
  },
  DatabaseSchema: {
    $id: "qi://core/config/database.schema",
    type: "object",
    properties: {
      dbHost: { type: "string" },
      dbPort: { type: "number" },
      dbName: { type: "string" },
      dbUser: { type: "string" },
      dbPassword: { type: "string" },
      pgData: { type: "string" },
    },
    required: ["dbHost", "dbPort", "dbName", "dbUser", "dbPassword"],
    additionalProperties: false,
  },
  RedisSchema: {
    $id: "qi://core/config/redis.schema",
    type: "object",
    properties: {
      redisHost: { type: "string" },
      redisPort: { type: "number" },
      redisPassword: { type: "string" },
    },
    required: ["redisHost", "redisPort", "redisPassword"],
    additionalProperties: false,
  },
  KafkaSchema: {
    $id: "qi://core/config/kafka.schema",
    type: "object",
    properties: {
      kafkaBrokers: { type: "array", items: { type: "string" } },
      kafkaClientId: { type: "string" },
      kafkaGroupId: { type: "string" },
    },
    required: ["kafkaBrokers", "kafkaClientId", "kafkaGroupId"],
    additionalProperties: false,
  },
  ServiceConfig: {
    $id: "qi://core/config/service.schema",
    type: "object",
    required: ["type", "database", "redis", "kafka", "app"],
    properties: {
      type: { type: "string", const: "service" },
      database: { $ref: "qi://core/config/database.schema" },
      redis: { $ref: "qi://core/config/redis.schema" },
      kafka: { $ref: "qi://core/config/kafka.schema" },
      app: { $ref: "qi://core/config/app.schema" },
    },
    additionalProperties: false,
  },
};

/**
 * Function to compile and install a schema
 * @param {Object} schema - The schema to compile
 * @returns {ValidateFunction} The compiled validator function
 */
export const install = (schema: object): ValidateFunction => {
  const ajv = new Ajv({ allErrors: true, useDefaults: true, coerceTypes: true });
  Object.values(schemas).forEach((sch) => ajv.addSchema(sch));
  return ajv.compile(schema);
};

/**
 * Initialize all schemas and return compiled validators
 * @returns {Record<string, ValidateFunction>} Object containing all compiled validators
 */
export const init = (): Record<string, ValidateFunction> =>
  Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [name, install(schema)])
  );

export { schemas };

export type { ServiceConfig }; // Export the interface