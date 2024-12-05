/**
 * @fileoverview QuestDB service wrapper with PostgreSQL wire protocol support
 * @module @qi/core/services/questdb
 *
 * @description
 * Provides a service wrapper around QuestDB using the PostgreSQL wire protocol for:
 * - Time series data operations
 * - High-performance ingestion
 * - SQL query interface
 * - Connection management
 * - Health monitoring
 *
 * Key features:
 * - PostgreSQL wire protocol compatibility
 * - Connection pool management
 * - Configurable timeouts
 * - Health monitoring
 * - ILP support for high-speed ingestion
 *
 * @example Basic Usage
 * ```typescript
 * const service = new QuestDBService({
 *   enabled: true,
 *   connection: questdbConnection,
 *   pool: {
 *     max: 20,
 *     min: 5,
 *     acquireTimeout: 30000
 *   }
 * });
 *
 * await service.connect();
 * const client = service.getClient();
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-05
 * @created 2024-12-05
 */

import { Pool, PoolConfig, QueryResult } from "pg";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { PostgresConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * QuestDB service configuration interface
 *
 * @interface QuestDBServiceConfig
 */
interface QuestDBServiceConfig {
  enabled: boolean;
  connection: PostgresConnection;
  pool: {
    max: number;
    min: number;
    acquireTimeout: number;
    idleTimeout: number;
    connectionTimeoutMillis?: number;
    statementTimeout?: number;
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

/**
 * PostgreSQL parameter value types that QuestDB supports
 */
type QuestDBParameterValue = string | number | boolean | Date | Buffer | null;

/**
 * QuestDB service implementation providing PostgreSQL wire protocol compatibility
 * and connection pool management.
 *
 * @class QuestDBService
 * @extends {BaseServiceClient<QuestDBServiceConfig>}
 */
export class QuestDBService extends BaseServiceClient<QuestDBServiceConfig> {
  private pool: Pool | null = null;

  constructor(config: QuestDBServiceConfig) {
    super(config, "QuestDB");
  }

  /**
   * Establishes connection pool to QuestDB
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If connection fails
   */
  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("QuestDB service is disabled");
      return;
    }

    try {
      const poolConfig = this.createPoolConfig();
      this.pool = new Pool(poolConfig);

      // Test connection
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();

      logger.info("QuestDB connection established", {
        host: this.config.connection.getHost(),
        port: this.config.connection.getPort(),
      });

      this.setStatus(ServiceStatus.CONNECTED);

      if (this.config.healthCheck?.enabled) {
        await this.startHealthCheck();
      }

      // Set up event handlers
      this.pool.on("error", (err) => {
        logger.error("Unexpected QuestDB pool error", { error: err.message });
      });
    } catch (error) {
      this.setStatus(ServiceStatus.ERROR);
      throw new ApplicationError(
        "Failed to connect to QuestDB",
        ErrorCode.CONNECTION_ERROR,
        500,
        { error: String(error) }
      );
    }
  }

  /**
   * Closes connection pool and performs cleanup
   *
   * @returns {Promise<void>}
   * @throws {ApplicationError} If disconnection fails
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
        this.pool = null;
        this.setStatus(ServiceStatus.DISCONNECTED);
      } catch (error) {
        this.setStatus(ServiceStatus.ERROR);
        throw new ApplicationError(
          "Failed to disconnect from QuestDB",
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
    if (!this.pool) {
      return {
        status: "unhealthy",
        message: "QuestDB connection not initialized",
        timestamp: new Date(),
      };
    }

    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      client.release();

      return {
        status: "healthy",
        message: "QuestDB is responsive",
        details: {
          host: this.config.connection.getHost(),
          port: this.config.connection.getPort(),
          database: this.config.connection.getDatabase(),
          poolSize: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingClients: this.pool.waitingCount,
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
   * Gets the connection pool for database operations
   *
   * @returns {Pool} Connection pool instance
   * @throws {ApplicationError} If pool is not initialized
   */
  getPool(): Pool {
    if (!this.pool) {
      throw new ApplicationError(
        "QuestDB connection not initialized",
        ErrorCode.SERVICE_NOT_INITIALIZED,
        500
      );
    }
    return this.pool;
  }

  /**
   * Executes a SQL query
   *
   * @param {string} sql - SQL query to execute
   * @param {QuestDBParameterValue[]} [params] - Query parameters
   * @returns {Promise<QueryResult>} Query result
   *
   * @example
   * ```typescript
   * // Simple query
   * const result = await questdb.query('SELECT * FROM mytable WHERE id = $1', [123]);
   *
   * // Query with multiple parameters
   * const result = await questdb.query(
   *   'SELECT * FROM sensors WHERE timestamp > $1 AND value > $2',
   *   [new Date('2024-01-01'), 100]
   * );
   * ```
   */
  async query(
    sql: string,
    params?: QuestDBParameterValue[]
  ): Promise<QueryResult> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      return await client.query(sql, params);
    } finally {
      client.release();
    }
  }

  /**
   * Creates connection pool configuration from service config
   *
   * @private
   * @returns {PoolConfig} Connection pool configuration
   */
  private createPoolConfig(): PoolConfig {
    const conn = this.config.connection;
    return {
      host: conn.getHost(),
      port: conn.getPort(),
      database: conn.getDatabase(),
      user: conn.getUser(),
      password: conn.getPassword(),
      max: this.config.pool.max,
      min: this.config.pool.min,
      idleTimeoutMillis: this.config.pool.idleTimeout,
      connectionTimeoutMillis: this.config.pool.connectionTimeoutMillis,
      statement_timeout: this.config.pool.statementTimeout,
    };
  }
}

export default QuestDBService;
