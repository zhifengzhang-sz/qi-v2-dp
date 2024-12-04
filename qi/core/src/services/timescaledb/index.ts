/**
 * @fileoverview TimescaleDB service wrapper with Sequelize ORM integration
 * @module @qi/core/services/timescaledb
 *
 * @description
 * Provides a service wrapper around TimescaleDB using Sequelize ORM for:
 * - Database connection management
 * - Model synchronization
 * - Query interface
 * - Connection pooling
 * - Health monitoring
 *
 * Key features:
 * - Sequelize ORM integration
 * - Connection pool management
 * - Model synchronization options
 * - Health monitoring
 * - Configurable timeouts
 * - Detailed logging
 *
 * @example Basic Usage
 * ```typescript
 * const service = new TimescaleDBService({
 *   enabled: true,
 *   connection: postgresConnection,
 *   pool: {
 *     max: 20,
 *     min: 5,
 *     acquireTimeout: 30000,
 *     idleTimeout: 10000
 *   }
 * });
 *
 * await service.connect();
 * const sequelize = service.getSequelize();
 * ```
 *
 * @example With Model Synchronization
 * ```typescript
 * const service = new TimescaleDBService({
 *   enabled: true,
 *   connection: postgresConnection,
 *   sync: {
 *     force: false,
 *     alter: true
 *   }
 * });
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-03
 * @modified 2024-12-05
 */

import { Sequelize, Options as SequelizeOptions } from "sequelize";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { PostgresConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * TimescaleDB service configuration interface
 *
 * @interface TimescaleDBServiceConfig
 *
 * @property {boolean} enabled - Whether the service is enabled
 * @property {PostgresConnection} connection - Database connection configuration
 * @property {Object} pool - Connection pool settings
 * @property {number} pool.max - Maximum number of connections in pool
 * @property {number} pool.min - Minimum number of connections in pool
 * @property {number} pool.acquireTimeout - Maximum time (ms) to acquire connection
 * @property {number} pool.idleTimeout - Maximum time (ms) connection can be idle
 * @property {number} [pool.connectionTimeoutMillis] - Connection timeout in milliseconds
 * @property {number} [pool.statementTimeout] - Statement timeout in milliseconds
 * @property {number} [pool.idleInTransactionSessionTimeout] - Transaction idle timeout
 * @property {Object} [healthCheck] - Health check configuration
 * @property {boolean} healthCheck.enabled - Whether health checks are enabled
 * @property {number} healthCheck.interval - Interval between checks in ms
 * @property {number} healthCheck.timeout - Health check timeout in ms
 * @property {number} healthCheck.retries - Number of retries for failed checks
 * @property {Object} [sync] - Model synchronization options
 * @property {boolean} [sync.force] - Drop tables before sync
 * @property {boolean} [sync.alter] - Alter tables to fit models
 */
interface TimescaleDBServiceConfig {
  enabled: boolean;
  connection: PostgresConnection;
  pool: {
    max: number;
    min: number;
    acquireTimeout: number;
    idleTimeout: number;
    connectionTimeoutMillis?: number;
    statementTimeout?: number;
    idleInTransactionSessionTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
  sync?: {
    force?: boolean;
    alter?: boolean;
  };
}

/**
 * TimescaleDB service implementation providing Sequelize ORM integration
 * and health monitoring capabilities.
 *
 * @class TimescaleDBService
 * @extends {BaseServiceClient<TimescaleDBServiceConfig>}
 */
export class TimescaleDBService extends BaseServiceClient<TimescaleDBServiceConfig> {
  /**
   * Sequelize instance for database operations
   * @private
   */
  private sequelize: Sequelize | null = null;

  /**
   * Creates a new TimescaleDB service instance
   *
   * @param {TimescaleDBServiceConfig} config - Service configuration
   */
  constructor(config: TimescaleDBServiceConfig) {
    super(config, "TimescaleDB");
  }

  /**
   * Establishes database connection and initializes Sequelize
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   *
   * @example
   * ```typescript
   * await service.connect();
   * ```
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("TimescaleDB service is disabled");
      return;
    }

    try {
      const sequelizeOptions = this.createSequelizeOptions();
      this.sequelize = new Sequelize(sequelizeOptions);

      // Test connection
      await this.sequelize.authenticate();
      logger.info("TimescaleDB connection established");

      // Sync models if configured
      if (this.config.sync) {
        await this.sequelize.sync(this.config.sync);
        logger.info("TimescaleDB models synchronized", this.config.sync);
      }

      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to TimescaleDB",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Closes database connection and performs cleanup
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   *
   * @example
   * ```typescript
   * await service.disconnect();
   * ```
   */
  async disconnect(): Promise<void> {
    if (this.sequelize) {
      try {
        await this.sequelize.close();
        this.sequelize = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from TimescaleDB",
          ErrorCode.CONNECTION_ERROR,
          500,
          { error: String(error) }
        );
      }
    }
  }

  /**
   * Performs health check on the database connection
   *
   * @protected
   * @returns {Promise<HealthCheckResult>}
   */
  protected async checkHealth(): Promise<HealthCheckResult> {
    if (!this.sequelize) {
      return {
        status: "unhealthy",
        message: "TimescaleDB connection not initialized",
        timestamp: new Date(),
      };
    }

    try {
      await this.sequelize.authenticate();
      return {
        status: "healthy",
        message: "TimescaleDB is responsive",
        details: {
          database: this.config.connection.getDatabase(),
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Gets the Sequelize instance for database operations
   *
   * @returns {Sequelize} Sequelize instance
   * @throws {ApplicationError} If Sequelize is not initialized
   *
   * @example
   * ```typescript
   * const sequelize = service.getSequelize();
   * const users = await sequelize.model('User').findAll();
   * ```
   */
  getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new ApplicationError(
        "TimescaleDB connection not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.sequelize;
  }

  /**
   * Creates Sequelize configuration options from service config
   *
   * @private
   * @returns {SequelizeOptions} Sequelize configuration options
   */
  private createSequelizeOptions(): SequelizeOptions {
    const conn = this.config.connection;
    return {
      dialect: "postgres",
      host: conn.getHost(),
      port: conn.getPort(),
      database: conn.getDatabase(),
      username: conn.getUser(),
      password: conn.getPassword(),
      logging: (msg: string) => logger.debug(msg),
      pool: {
        max: this.config.pool.max,
        min: this.config.pool.min,
        acquire: this.config.pool.acquireTimeout,
        idle: this.config.pool.idleTimeout,
      },
      dialectOptions: {
        connectTimeout: this.config.pool.connectionTimeoutMillis,
        statement_timeout: this.config.pool.statementTimeout,
        idle_in_transaction_session_timeout:
          this.config.pool.idleInTransactionSessionTimeout,
      },
    };
  }
}

export default TimescaleDBService;
