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
