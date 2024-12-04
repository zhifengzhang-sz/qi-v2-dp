/**
 * @fileoverview TimescaleDB service type definitions
 * @module @qi/core/services/timescaledb/types
 *
 * @description
 * Defines TypeScript interfaces for TimescaleDB client configuration.
 * These types ensure type safety and proper configuration for the
 * TimescaleDB client implementation.
 *
 * Features:
 * - Type-safe configuration interface
 * - Integration with base service config
 *
 * @example
 * ```typescript
 * const config: TimescaleDBConfig = {
 *   connection: postgresConnection
 * };
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-04
 * @created 2024-12-03
 */

import type { PostgresConnection } from "../config/dsl.js";

/**
 * Configuration options for TimescaleDB pool settings
 *
 * @interface PoolConfig
 *
 * @property {number} [max] - Maximum number of connections in pool
 * @property {number} [min] - Minimum number of connections in pool
 * @property {number} [acquireTimeout] - Maximum time (ms) to acquire connection
 * @property {number} [idleTimeout] - Maximum time (ms) connection can be idle
 * @property {number} [connectionTimeoutMillis] - Connection timeout in milliseconds
 * @property {number} [statementTimeout] - Statement timeout in milliseconds
 * @property {number} [idleInTransactionSessionTimeout] - Idle in transaction timeout
 */
export interface PoolConfig {
  max?: number;
  min?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  connectionTimeoutMillis?: number;
  statementTimeout?: number;
  idleInTransactionSessionTimeout?: number;
}

/**
 * TimescaleDB client configuration interface
 *
 * @interface TimescaleDBConfig
 *
 * @property {PostgresConnection} connection - Base database connection configuration
 * @property {PoolConfig} [pool] - Optional connection pool configuration
 */
export interface TimescaleDBConfig {
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
}
