/**
 * @fileoverview QuestDB service wrapper with PostgreSQL wire protocol support
 * @module @qi/core/services/questdb
 */

import type { Pool, PoolConfig, QueryResult } from "pg";
import { BaseServiceClient } from "../base/client.js";
import { HealthCheckResult, ServiceStatus } from "../base/types.js";
import type { PostgresConnection } from "@qi/core/services/config";
import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Gets the Pool constructor from pg module
 * Handles both ESM and CommonJS module systems
 */
async function getPoolConstructor(): Promise<typeof Pool> {
  try {
    const pg = await import("pg");
    return pg.Pool || (pg.default && pg.default.Pool);
  } catch (error) {
    throw new ApplicationError(
      "Failed to load pg module",
      ErrorCode.INITIALIZATION_ERROR,
      500,
      { error: String(error) }
    );
  }
}

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

type QuestDBParameterValue = string | number | boolean | Date | Buffer | null;

export class QuestDBService extends BaseServiceClient<QuestDBServiceConfig> {
  private pool: Pool | null = null;

  constructor(config: QuestDBServiceConfig) {
    super(config, "QuestDB");
  }

  async connect(): Promise<void> {
    if (!this.isEnabled()) {
      logger.info("QuestDB service is disabled");
      return;
    }

    try {
      const Pool = await getPoolConstructor();
      const poolConfig = this.createPoolConfig();
      this.pool = new Pool(poolConfig);

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

      this.pool.on("error", (err: Error) => {
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
