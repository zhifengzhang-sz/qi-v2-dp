/**
 * @fileoverview TimescaleDB client implementation for database configuration and connectivity
 * @module @qi/core/services/timescaledb/client
 *
 * @description
 * Provides TimescaleDB client implementation integrating with Sequelize ORM.
 * Handles configuration management and connection setup while delegating ORM
 * functionality to Sequelize.
 *
 * Features:
 * - Type-safe configuration management
 * - Sequelize ORM integration
 * - Connection validation
 * - Pool configuration
 * - Error handling with ApplicationError
 *
 * @example Basic Usage
 * ```typescript
 * const client = new TimescaleDBClient({
 *   connection: postgresConnection,
 *   pool: {
 *     max: 20,
 *     min: 5
 *   }
 * });
 *
 * const sequelize = new Sequelize(client.getConnectionDetails());
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-04
 * @created 2024-12-03
 */

import { ApplicationError, ErrorCode, ErrorDetails } from "@qi/core/errors";
import { logger } from "@qi/core/logger";
import type { Options as SequelizeOptions } from "sequelize";
import type { TimescaleDBConfig } from "./types.js";

/**
 * TimescaleDB client class providing configuration management and
 * Sequelize-compatible connection details.
 *
 * @class TimescaleDBClient
 *
 * @example
 * ```typescript
 * const client = new TimescaleDBClient({
 *   connection: postgresConnection,
 *   pool: { max: 20 }
 * });
 * ```
 */
export class TimescaleDBClient {
  private readonly config: TimescaleDBConfig;

  /**
   * Creates a new TimescaleDB client instance
   *
   * @param {TimescaleDBConfig} config - Client configuration object
   * @throws {ApplicationError} When configuration is invalid
   *
   * @example
   * ```typescript
   * const client = new TimescaleDBClient({
   *   connection: postgresConnection
   * });
   * ```
   */
  constructor(config: TimescaleDBConfig) {
    try {
      this.config = config;
      // Validate connection by attempting to parse
      this.config.connection.getConnectionString();

      logger.info("TimescaleDB client initialized", {
        host: config.connection.getHost(),
        port: config.connection.getPort(),
        database: config.connection.getDatabase(),
      });
    } catch (error) {
      const details: ErrorDetails = {
        error: error instanceof Error ? error.message : String(error),
        host: config.connection.getHost(),
        port: config.connection.getPort(),
      };

      logger.error("Failed to initialize TimescaleDB client", details);

      throw new ApplicationError(
        "Invalid TimescaleDB configuration",
        ErrorCode.POSTGRES_CONFIG_INVALID,
        500,
        details
      );
    }
  }

  /**
   * Gets connection configuration compatible with Sequelize constructor
   *
   * @returns {SequelizeOptions} Sequelize-compatible connection configuration
   *
   * @example
   * ```typescript
   * const sequelize = new Sequelize(client.getConnectionDetails());
   * ```
   */
  getConnectionDetails(): SequelizeOptions {
    const conn = this.config.connection;
    return {
      dialect: "postgres",
      logging: (msg: string) => logger.debug(msg),
      pool: {
        max: this.config.pool?.max ?? 5,
        min: this.config.pool?.min ?? 0,
        acquire: this.config.pool?.acquireTimeout ?? 30000,
        idle: this.config.pool?.idleTimeout ?? 10000,
      },
      database: conn.getDatabase(),
      username: conn.getUser(),
      password: conn.getPassword(),
      host: conn.getHost(),
      port: conn.getPort(),
      dialectOptions: {
        connectTimeout: this.config.pool?.connectionTimeoutMillis,
        statement_timeout: this.config.pool?.statementTimeout,
        idle_in_transaction_session_timeout:
          this.config.pool?.idleInTransactionSessionTimeout,
      },
    };
  }
}
