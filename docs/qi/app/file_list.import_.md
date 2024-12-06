1. `qi/app/src/services/config/index.ts`:
```ts
/**
 * @fileoverview Service Configuration Application
 * @module qi/app/src/services/config
 *
 * @description
 * Provides service configuration management for the application. This module is responsible for:
 * - Loading and validating configuration from JSON files
 * - Loading and validating environment variables
 * - Providing typed access to service connection details
 * - Managing configuration for databases, message queues, monitoring, and networking
 *
 * The configuration files should be placed in the application's config directory:
 * - config/services-1.0.json: Main service configuration
 * - config/services.env: Environment variables
 *
 * Configuration structure:
 * - Databases: PostgreSQL, QuestDB, Redis
 * - Message Queue: Redpanda (Kafka API)
 * - Monitoring: Grafana, pgAdmin
 * - Networking: Service network mappings
 *
 * @example Basic Usage
 * ```typescript
 * import { initializeConfig } from './services/config/index.js';
 *
 * // Initialize configuration
 * const services = await initializeConfig();
 *
 * // Access service configurations
 * const pgConnString = services.databases.postgres.getConnectionString();
 * const redisConnString = services.databases.redis.getConnectionString();
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-01
 * @created 2024-12-01
 */
  
import { resolve } from "path";
import {
  loadServiceConfig,
  type ServiceConnections,
} from "@qi/core/services/config";
  
/**
 * Default configuration file paths
 *
 * @const
 * @type {Object}
 * @property {string} CONFIG_PATH - Path to the service configuration JSON file
 * @property {string} ENV_PATH - Path to the environment variable file
 */
export const CONFIG_PATHS = {
  CONFIG_PATH: resolve(process.cwd(), "config/services-1.0.json"),
  ENV_PATH: resolve(process.cwd(), "config/services.env"),
} as const;
  
/**
 * Initializes the service configuration.
 *
 * @async
 * @function
 * @returns {Promise<ServiceConnections>} Service connections interface providing access to all service configurations
 * @throws {ApplicationError} If configuration files cannot be loaded or validated
 *
 * @description
 * This function:
 * 1. Loads the service configuration JSON file
 * 2. Loads and validates environment variables
 * 3. Creates connection handlers for all services
 * 4. Validates service configurations against their schemas
 *
 * The returned ServiceConnections interface provides access to:
 * - Database connections (PostgreSQL, QuestDB, Redis)
 * - Message queue endpoints (Redpanda/Kafka)
 * - Monitoring service endpoints (Grafana, pgAdmin)
 * - Network configurations
 *
 * @example
 * ```typescript
 * // Initialize configuration
 * const services = await initializeConfig();
 *
 * // Access PostgreSQL configuration
 * const { host, port } = services.databases.postgres;
 * const connString = services.databases.postgres.getConnectionString();
 *
 * // Access Redpanda/Kafka configuration
 * const kafkaEndpoint = services.messageQueue.getBrokerEndpoint();
 * const schemaRegistry = services.messageQueue.getSchemaRegistryEndpoint();
 *
 * // Access network configuration
 * const dbNetwork = services.networking.getNetworkName("db");
 * ```
 */
export async function initializeConfig(): Promise<ServiceConnections> {
  return await loadServiceConfig({
    configPath: CONFIG_PATHS.CONFIG_PATH,
    envPath: CONFIG_PATHS.ENV_PATH,
  });
}
  
// Re-export types for convenience
export type { ServiceConnections } from "@qi/core/services/config";
  
```  
  
2. `qi/app/src/services/redis/index.ts`:
```ts
/**
 * @fileoverview Redis Service Application
 * @module qi/app/src/services/redis
 *
 * @description
 * Application integration for Redis service. Provides a high-level interface
 * for Redis operations with features like health monitoring and connection management.
 *
 * Features:
 * - Integration with service configuration
 * - Singleton Redis service management
 * - Health monitoring
 * - Connection lifecycle management
 * - Type-safe Redis operations
 *
 * @example Basic Usage
 * ```typescript
 * import { initialize } from 'qi/app/src/services/redis';
 *
 * // Initialize Redis
 * const service = await initialize();
 * const client = service.getClient();
 * await client.set('key', 'value');
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-01
 */
  
import { RedisService } from "@qi/core/services/redis";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { Redis } from "ioredis";
  
// Extract config type from RedisService using TypeScript utility types
type RedisServiceConfig = ConstructorParameters<typeof RedisService>[0];
  
const DEFAULT_OPTIONS = {
  keyPrefix: "qi:",
  commandTimeout: 5000,
} as const;
  
const DEFAULT_HEALTH_CHECK_CONFIG = {
  enabled: true,
  interval: 30000,
  timeout: 5000,
  retries: 3,
} as const;
  
export const DEFAULT_REDIS_OPTIONS = {
  enabled: true,
  options: DEFAULT_OPTIONS,
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
} as const;
  
/**
 * Redis service singleton instance
 * @private
 */
let redisService: RedisService | undefined;
  
/**
 * Initializes Redis service using application configuration.
 *
 * @async
 * @function
 * @param {Partial<typeof DEFAULT_REDIS_OPTIONS>} [options] - Optional Redis configuration
 * @returns {Promise<RedisService>} Initialized Redis service
 * @throws {ApplicationError} If initialization fails
 */
export async function initialize(
  options: Partial<typeof DEFAULT_REDIS_OPTIONS> = {}
): Promise<RedisService> {
  try {
    if (redisService) {
      return redisService;
    }
  
    const services = await initializeConfig();
  
    const config: RedisServiceConfig = {
      enabled: options.enabled ?? DEFAULT_REDIS_OPTIONS.enabled,
      connection: services.databases.redis,
      options: {
        ...DEFAULT_REDIS_OPTIONS.options,
        ...options.options,
      },
      healthCheck: {
        ...DEFAULT_REDIS_OPTIONS.healthCheck,
        ...options.healthCheck,
      },
    };
  
    redisService = new RedisService(config);
  
    logger.debug("Initializing Redis service with configuration:", {
      host: services.databases.redis.getHost(),
      port: services.databases.redis.getPort(),
      keyPrefix: config.options?.keyPrefix,
      healthCheckEnabled: config.healthCheck?.enabled,
    });
  
    await redisService.connect();
  
    logger.info("Redis service initialized successfully", {
      host: services.databases.redis.getHost(),
      port: services.databases.redis.getPort(),
    });
  
    return redisService;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize Redis service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
  
/**
 * Gets the Redis service instance.
 *
 * @function
 * @returns {RedisService} The Redis service instance
 * @throws {ApplicationError} If service is not initialized
 */
export function getService(): RedisService {
  if (!redisService) {
    throw new ApplicationError(
      "Redis service not initialized. Call initialize() first.",
      ErrorCode.SERVICE_NOT_INITIALIZED,
      500
    );
  }
  return redisService;
}
  
/**
 * Gets the Redis client instance from the service.
 *
 * @function
 * @returns {Redis} Redis client instance
 * @throws {ApplicationError} If service is not initialized
 */
export function getClient(): Redis {
  return getService().getClient();
}
  
/**
 * Closes the Redis service.
 *
 * @async
 * @function
 */
export async function close(): Promise<void> {
  if (redisService) {
    await redisService.disconnect();
    redisService = undefined;
  }
}
  
export type { RedisService };
  
```  
  
3. `qi/app/src/services/timescaledb/index.ts`
```ts
/**
 * @fileoverview TimescaleDB service initialization and management
 * @module @qi/app/services/timescaledb
 *
 * @description
 * Provides TimescaleDB service initialization and management using the core TimescaleDB service.
 * Handles connection lifecycle, configuration, and service access.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-04
 * @modified 2024-12-05
 */
  
import { TimescaleDBService } from "@qi/core/services/timescaledb";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { Sequelize } from "sequelize";
  
// Extract config type from TimescaleDBService using TypeScript utility types
type TimescaleDBServiceConfig = ConstructorParameters<
  typeof TimescaleDBService
>[0];
  
const DEFAULT_POOL_CONFIG = {
  max: 20,
  min: 5,
  acquireTimeout: 30000,
  idleTimeout: 10000,
  connectionTimeoutMillis: 5000,
  statementTimeout: 30000,
  idleInTransactionSessionTimeout: 60000,
} as const;
  
const DEFAULT_HEALTH_CHECK_CONFIG = {
  enabled: true,
  interval: 30000,
  timeout: 5000,
  retries: 3,
} as const;
  
export const DEFAULT_TIMESCALEDB_OPTIONS = {
  enabled: true,
  pool: DEFAULT_POOL_CONFIG,
  healthCheck: DEFAULT_HEALTH_CHECK_CONFIG,
} as const;
  
let timescaleService: TimescaleDBService | undefined;
  
/**
 * Initializes the TimescaleDB service with provided options
 *
 * @param {Partial<typeof DEFAULT_TIMESCALEDB_OPTIONS>} options - Service configuration options
 * @returns {Promise<TimescaleDBService>} Initialized TimescaleDB service
 * @throws {ApplicationError} If initialization fails
 */
export async function initialize(
  options: Partial<typeof DEFAULT_TIMESCALEDB_OPTIONS> = {}
): Promise<TimescaleDBService> {
  try {
    if (timescaleService) {
      return timescaleService;
    }
  
    const services = await initializeConfig();
  
    const config: TimescaleDBServiceConfig = {
      enabled: options.enabled ?? DEFAULT_TIMESCALEDB_OPTIONS.enabled,
      connection: services.databases.postgres,
      pool: {
        ...DEFAULT_TIMESCALEDB_OPTIONS.pool,
        ...options.pool,
      },
      healthCheck: {
        ...DEFAULT_TIMESCALEDB_OPTIONS.healthCheck,
        ...options.healthCheck,
      },
    };
  
    timescaleService = new TimescaleDBService(config);
  
    logger.debug("Initializing TimescaleDB service with configuration:", {
      host: services.databases.postgres.getHost(),
      database: services.databases.postgres.getDatabase(),
      user: services.databases.postgres.getUser(),
      maxConnections: config.pool.max,
      healthCheckEnabled: config.healthCheck?.enabled,
    });
  
    await timescaleService.connect();
  
    logger.info("TimescaleDB service initialized successfully", {
      host: services.databases.postgres.getHost(),
      database: services.databases.postgres.getDatabase(),
      maxConnections: config.pool.max,
    });
  
    return timescaleService;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize TimescaleDB service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
  }
}
  
/**
 * Gets the initialized TimescaleDB service instance
 *
 * @returns {TimescaleDBService} TimescaleDB service instance
 * @throws {ApplicationError} If service is not initialized
 */
export function getService(): TimescaleDBService {
  if (!timescaleService) {
    throw new ApplicationError(
      "TimescaleDB service not initialized. Call initialize() first.",
      ErrorCode.SERVICE_NOT_INITIALIZED,
      500
    );
  }
  return timescaleService;
}
  
/**
 * Gets the Sequelize instance from the TimescaleDB service
 *
 * @returns {Sequelize} Sequelize instance
 * @throws {ApplicationError} If service is not initialized
 */
export function getSequelize(): Sequelize {
  return getService().getSequelize();
}
  
/**
 * Closes the TimescaleDB service connection
 *
 * @returns {Promise<void>}
 */
export async function close(): Promise<void> {
  if (timescaleService) {
    await timescaleService.disconnect();
    timescaleService = undefined;
  }
}
  
export type { TimescaleDBService };
  
```  
  
4. `qi/app/src/services/cache/index.ts`:
```ts
/**
 * @fileoverview Cache Service Application
 * @module qi/app/src/services/cache
 *
 * @description
 * Application integration for Cache service. Provides a high-level interface
 * for caching operations by combining service configuration with the Cache
 * implementation from @qi/core.
 *
 * Features:
 * - Automatic storage selection based on environment
 * - Redis integration for production environments
 * - In-memory storage for development
 * - Configurable TTL and key prefixing
 * - Type-safe cache operations
 *
 * @example Basic Usage
 * ```typescript
 * import { initialize } from 'qi/app/src/services/cache';
 *
 * const cache = await initialize();
 * await cache.set('key', 'value');
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 */
  
import { Cache, type CacheOptions } from "@qi/core/cache";
import { getService as getRedisService } from "../redis/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { initializeConfig } from "../config/index.js";
import { logger } from "@qi/core/logger";
  
/**
 * Default cache configuration
 * @const
 */
export const DEFAULT_CACHE_OPTIONS = {
  prefix: "qi:",
  ttl: 3600, // 1 hour default TTL
  maxRetries: 3,
} as const;
  
/**
 * Cache client singleton instance
 * @private
 */
let cacheClient: Cache | undefined;
  
/**
 * Initializes Cache service using application configuration.
 *
 * @async
 * @function
 * @param {Partial<typeof DEFAULT_CACHE_OPTIONS>} [options] - Optional cache configuration
 * @returns {Promise<Cache>} Initialized cache client
 * @throws {ApplicationError} If initialization fails
 */
export async function initialize(
  options: Partial<typeof DEFAULT_CACHE_OPTIONS> = {}
): Promise<Cache> {
  try {
    if (cacheClient) {
      return cacheClient;
    }
  
    const services = await initializeConfig();
    const isProduction = process.env.NODE_ENV === "production";
    const storage = isProduction ? "redis" : "memory";
  
    logger.debug("Initializing cache service", {
      storage,
      prefix: options.prefix || DEFAULT_CACHE_OPTIONS.prefix,
      ttl: options.ttl || DEFAULT_CACHE_OPTIONS.ttl,
    });
  
    const config: CacheOptions = {
      storage,
      prefix: options.prefix || DEFAULT_CACHE_OPTIONS.prefix,
      ttl: options.ttl || DEFAULT_CACHE_OPTIONS.ttl,
    };
  
    if (config.storage === "redis") {
      if (!services.databases.redis) {
        throw new ApplicationError(
          "Redis configuration missing",
          ErrorCode.CONFIGURATION_ERROR,
          500
        );
      }
  
      // Get Redis service and its client
      const redisService = getRedisService();
      config.redis = redisService.getClient();
  
      logger.debug("Using Redis storage for cache", {
        host: services.databases.redis.getHost(),
        port: services.databases.redis.getPort(),
      });
    }
  
    cacheClient = new Cache(config);
  
    // Verify cache is working
    if (config.storage === "redis") {
      await cacheClient.set("__test__", "test");
      await cacheClient.delete("__test__");
    }
  
    logger.info("Cache service initialized successfully", {
      storage,
      prefix: config.prefix,
    });
  
    return cacheClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize Cache service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      {
        error: error instanceof Error ? error.message : String(error),
        storage: process.env.NODE_ENV === "production" ? "redis" : "memory",
      }
    );
  }
}
  
/**
 * Gets the Cache client instance.
 *
 * @function
 * @returns {Cache} The Cache client instance
 * @throws {ApplicationError} If client is not initialized
 */
export function getClient(): Cache {
  if (!cacheClient) {
    throw new ApplicationError(
      "Cache service not initialized. Call initialize() first.",
      ErrorCode.SERVICE_NOT_INITIALIZED,
      500
    );
  }
  return cacheClient;
}
  
/**
 * Closes the Cache service.
 * For memory cache, this clears all entries.
 * For Redis cache, this is a no-op as Redis connection is managed separately.
 *
 * @async
 * @function
 */
export async function close(): Promise<void> {
  if (cacheClient) {
    await cacheClient.clear();
    cacheClient = undefined;
  }
}
  
export type { CacheOptions } from "@qi/core/cache";
  
```  
  
5. `qi/app/src/services/redpanda/index.ts`:
```ts
// services/redpanda/index.ts
import { Kafka, Producer, Consumer, ConsumerConfig } from "kafkajs";
import { RedPandaConfig, toKafkaConfig } from "./config.js";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
  
let redpandaClient: RedPandaService | undefined;
  
interface RedPandaOptions {
  enabled?: boolean;
  consumer?: {
    groupId?: string;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
  };
  producer?: {
    allowAutoTopicCreation?: boolean;
    maxInFlightRequests?: number;
    idempotent?: boolean;
  };
  healthCheck?: {
    enabled?: boolean;
    interval?: number;
    timeout?: number;
    retries?: number;
  };
}
  
export class RedPandaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private config: RedPandaConfig;
  
  constructor(config: RedPandaConfig) {
    this.config = config;
    this.kafka = new Kafka(toKafkaConfig(config));
  }
  
  async connect(): Promise<void> {
    try {
      this.producer = this.kafka.producer(this.config.producer || {});
      await this.producer.connect();
  
      if (this.config.consumer) {
        const consumerConfig = {
          groupId: this.config.consumer.groupId,
          ...this.config.consumer,
        };
        // Type assertion to satisfy TypeScript
        this.consumer = this.kafka.consumer(consumerConfig as ConsumerConfig);
        await this.consumer.connect();
      }
      logger.info("RedPanda service connected successfully");
    } catch (error) {
      logger.error("Failed to connect RedPanda service", { error });
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        this.consumer = null;
      }
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }
      logger.info("RedPanda service disconnected successfully");
    } catch (error) {
      logger.error("Error disconnecting RedPanda service", { error });
      throw error;
    }
  }
  
  getProducer(): Producer {
    if (!this.producer) throw new Error("Producer not initialized");
    return this.producer;
  }
  
  getConsumer(): Consumer {
    if (!this.consumer) throw new Error("Consumer not initialized");
    return this.consumer;
  }
}
  
export async function initialize(
  options: RedPandaOptions = {}
): Promise<RedPandaService> {
  try {
    if (redpandaClient) return redpandaClient;
  
    const services = await initializeConfig();
    if (!services.messageQueue) {
      throw new ApplicationError(
        "RedPanda configuration missing",
        ErrorCode.CONFIGURATION_ERROR,
        500
      );
    }
  
    logger.debug("Initializing RedPanda service with configuration:", {
      brokerEndpoint: services.messageQueue.getBrokerEndpoint(),
      schemaRegistry: services.messageQueue.getSchemaRegistryEndpoint(),
      ...options,
    });
  
    const config: RedPandaConfig = {
      type: "redpanda",
      version: "1.0",
      kafka: {
        brokers: [services.messageQueue.getBrokerEndpoint()],
        clientId: process.env.SERVICE_NAME || "qi-service",
      },
      consumer: {
        groupId: process.env.CONSUMER_GROUP_ID || "qi-consumer-group",
        ...options.consumer,
      },
      producer: options.producer,
    };
  
    redpandaClient = new RedPandaService(config);
    await redpandaClient.connect();
    return redpandaClient;
  } catch (error) {
    throw new ApplicationError(
      "Failed to initialize RedPanda service",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}
  
export function getService(): RedPandaService {
  if (!redpandaClient) {
    throw new ApplicationError(
      "RedPanda service not initialized. Call initialize() first.",
      ErrorCode.SERVICE_NOT_INITIALIZED,
      500
    );
  }
  return redpandaClient;
}
  
export async function close(): Promise<void> {
  if (redpandaClient) {
    await redpandaClient.disconnect();
    redpandaClient = undefined;
  }
}
  
export type { RedPandaConfig };
  
```  
  