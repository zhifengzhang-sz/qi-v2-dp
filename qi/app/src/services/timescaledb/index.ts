/**
 * @fileoverview
 * @module index.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-04
 * @modified 2024-12-04
 */

import {
  TimescaleDBClient,
  type TimescaleDBConfig,
} from "@qi/core/services/timescaledb";
import { initializeConfig } from "../config/index.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import { Sequelize } from "sequelize";

const DEFAULT_POOL_CONFIG = {
  max: 20,
  min: 5,
  acquireTimeout: 30000,
  idleTimeout: 10000,
} as const;

export const DEFAULT_TIMESCALEDB_OPTIONS = {
  pool: DEFAULT_POOL_CONFIG,
} as const;

let timescaleClient: TimescaleDBClient | undefined;
let sequelize: Sequelize | undefined;

export async function initialize(
  options: Partial<typeof DEFAULT_TIMESCALEDB_OPTIONS> = {}
): Promise<TimescaleDBClient> {
  try {
    if (timescaleClient) {
      return timescaleClient;
    }

    const services = await initializeConfig();

    const config: TimescaleDBConfig = {
      connection: services.databases.postgres,
      pool: {
        ...DEFAULT_TIMESCALEDB_OPTIONS.pool,
        ...options.pool,
      },
    };

    timescaleClient = new TimescaleDBClient(config);
    // In initialize function, before sequelize.authenticate():
    logger.debug("Attempting authentication with details:", {
      user: services.databases.postgres.getUser(),
      password: "*".repeat(
        services.databases.postgres.getPassword()?.length || 0
      ),
      host: services.databases.postgres.getHost(),
      port: services.databases.postgres.getPort(),
    });
    sequelize = new Sequelize(timescaleClient.getConnectionDetails());

    await sequelize.authenticate();

    logger.info("TimescaleDB service initialized", {
      host: services.databases.postgres.getHost(),
      database: services.databases.postgres.getDatabase(),
      maxConnections: config.pool.max,
    });

    return timescaleClient;
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

export function getClient(): TimescaleDBClient {
  if (!timescaleClient) {
    throw new ApplicationError(
      "TimescaleDB service not initialized. Call initialize() first.",
      ErrorCode.NOT_INITIALIZED,
      500
    );
  }
  return timescaleClient;
}

export function getSequelize(): Sequelize {
  if (!sequelize) {
    throw new ApplicationError(
      "TimescaleDB service not initialized. Call initialize() first.",
      ErrorCode.NOT_INITIALIZED,
      500
    );
  }
  return sequelize;
}

export async function close(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = undefined;
  }
  if (timescaleClient) {
    timescaleClient = undefined;
  }
}

export type { TimescaleDBConfig } from "@qi/core/services/timescaledb";
