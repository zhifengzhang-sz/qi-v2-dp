/**
 * @fileoverview TimescaleDB Service Module
 * @module @qi/core/services/timescaledb
 *
 * @description
 * Central module for managing TimescaleDB configuration and connectivity.
 * Provides a clean interface for configuring TimescaleDB connections
 * that can be used with Sequelize ORM.
 *
 * Features:
 * - Configuration management
 * - Sequelize integration support
 * - Type-safe interfaces
 *
 * @example Basic Usage
 * ```typescript
 * const client = new TimescaleDBClient({
 *   connection: postgresConnection
 * });
 *
 * const sequelize = new Sequelize(client.getConnectionDetails());
 * ```
 *
 * @author Zhifeng Zhang
 * @modified 2024-12-04
 * @created 2024-12-03
 */

// Export main client and configuration types
export { TimescaleDBClient } from "./client.js";
export type { TimescaleDBConfig, PoolConfig } from "./types.js";
