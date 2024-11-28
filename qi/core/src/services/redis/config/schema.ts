/**
 * @fileoverview Redis Service Application Configuration Schema
 * @module @qi/core/services/redis/config/schema
 * @description Defines JSON Schema for Redis application configuration validation.
 * Uses AJV for validation with proper schema identification and referencing.
 *
 * @see {@link RedisConfig} for TypeScript interface
 * @see {@link JsonSchema} for schema type definition
 */

import { JsonSchema } from "@qi/core/config";

/**
 * Schema for Redis connection pool configuration
 * @type {JsonSchema}
 */
export const poolConfigSchema: JsonSchema = {
  $id: "qi://core/services/redis/pool.schema",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    min: {
      type: "integer",
      minimum: 0,
      default: 1,
      description: "Minimum number of connections to maintain",
    },
    max: {
      type: "integer",
      minimum: 1,
      default: 10,
      description: "Maximum number of connections allowed",
    },
    acquireTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 30000,
      description: "Maximum time to wait for connection acquisition",
    },
    createTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 5000,
      description: "Maximum time to wait for connection creation",
    },
    idleTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 60000,
      description: "Time before idle connection is destroyed",
    },
    evictionRunIntervalMillis: {
      type: "integer",
      minimum: 0,
      default: 30000,
      description: "Interval to check for idle connections",
    },
    softIdleTimeoutMillis: {
      type: "integer",
      minimum: 0,
      default: 30000,
      description: "Soft timeout for idle connections",
    },
  },
  additionalProperties: false,
  required: ["min", "max"],
};

/**
 * Schema for Redis retry strategy configuration
 * @type {JsonSchema}
 */
export const retryStrategySchema: JsonSchema = {
  $id: "qi://core/services/redis/retry.schema",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    maxAttempts: {
      type: "integer",
      minimum: 1,
      default: 3,
      description: "Maximum number of retry attempts",
    },
    initialDelayMs: {
      type: "integer",
      minimum: 0,
      default: 1000,
      description: "Initial delay between retries",
    },
    maxDelayMs: {
      type: "integer",
      minimum: 0,
      default: 5000,
      description: "Maximum delay between retries",
    },
    factorMultiplier: {
      type: "number",
      minimum: 1,
      default: 2,
      description: "Exponential backoff multiplier",
    },
  },
  additionalProperties: false,
  required: ["maxAttempts", "initialDelayMs"],
};

/**
 * Complete Redis application configuration schema
 * @type {JsonSchema}
 */
export const redisConfigSchema: JsonSchema = {
  $id: "qi://core/services/redis/config.schema",
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    pools: {
      type: "object",
      properties: {
        default: { $ref: "qi://core/services/redis/pool.schema" },
      },
      additionalProperties: { $ref: "qi://core/services/redis/pool.schema" },
      description: "Named connection pool configurations",
      required: ["default"],
    },
    retry: { $ref: "qi://core/services/redis/retry.schema" },
    features: {
      type: "object",
      properties: {
        enableAutoPipelining: {
          type: "boolean",
          default: true,
          description: "Enable automatic command pipelining",
        },
        enableOfflineQueue: {
          type: "boolean",
          default: true,
          description: "Queue commands when connection lost",
        },
        enableReadyCheck: {
          type: "boolean",
          default: true,
          description: "Check if Redis is ready before operations",
        },
        lazyConnect: {
          type: "boolean",
          default: false,
          description: "Delay connection until first command",
        },
        keyPrefix: {
          type: "string",
          description: "Prefix for all Redis keys",
        },
        commandTimeout: {
          type: "integer",
          minimum: 0,
          default: 5000,
          description: "Command execution timeout",
        },
        keepAlive: {
          type: "integer",
          minimum: 0,
          default: 30000,
          description: "TCP keepAlive time",
        },
      },
      additionalProperties: false,
    },
    monitoring: {
      type: "object",
      properties: {
        enableMetrics: {
          type: "boolean",
          default: true,
          description: "Enable performance metrics collection",
        },
        metricsInterval: {
          type: "integer",
          minimum: 1000,
          default: 15000,
          description: "Metrics collection interval",
        },
        enableHealthCheck: {
          type: "boolean",
          default: true,
          description: "Enable periodic health checks",
        },
        healthCheckInterval: {
          type: "integer",
          minimum: 1000,
          default: 30000,
          description: "Health check interval",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  required: ["pools"],
};
