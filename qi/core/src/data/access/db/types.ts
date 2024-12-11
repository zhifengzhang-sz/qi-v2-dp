/**
 * @fileoverview Repository interface definitions
 * @module @qi/core/data/access/db/types
 *
 * @description
 * Defines the core repository interfaces for database access including:
 * - Base repository interface for CRUD operations
 * - Time series specific repository interface
 * - Type-safe options for all operations
 * - Transaction support
 *
 * Used as the foundation for all data access repositories in the system.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-09
 * @modified 2024-12-11
 */

import { Model, ModelStatic, Transaction, WhereOptions } from "sequelize";

/**
 * Base options for repository operations
 */
export interface BaseRepositoryOptions {
  transaction?: Transaction;
}

/**
 * Options for finding records
 */
export interface FindOptions<T> extends BaseRepositoryOptions {
  where?: WhereOptions<T>;
  limit?: number;
  offset?: number;
  order?: [string, "ASC" | "DESC"][];
}

/**
 * Options for creating records
 */
export interface CreateOptions<T> extends BaseRepositoryOptions {
  returning?: boolean;
  defaults?: Partial<T>;
}

/**
 * Options for updating records
 */
export interface UpdateOptions<T> extends BaseRepositoryOptions {
  where?: WhereOptions<T>;
  returning?: boolean;
}

/**
 * Options for deleting records
 */
export interface DeleteOptions<T> extends BaseRepositoryOptions {
  where?: WhereOptions<T>;
  force?: boolean;
}

/**
 * Base repository interface for CRUD operations
 */
export interface IRepository<T extends Model> {
  /**
   * Create a new record
   */
  create(data: Partial<T>, options?: CreateOptions<T>): Promise<T>;

  /**
   * Create multiple records in bulk
   */
  createBulk(data: Partial<T>[], options?: CreateOptions<T>): Promise<T[]>;

  /**
   * Find a single record
   */
  findOne(options: FindOptions<T>): Promise<T | null>;

  /**
   * Find multiple records
   */
  findMany(options: FindOptions<T>): Promise<T[]>;

  /**
   * Update records that match the criteria
   */
  update(data: Partial<T>, options: UpdateOptions<T>): Promise<[number, T[]]>;

  /**
   * Delete records that match the criteria
   */
  delete(options: DeleteOptions<T>): Promise<number>;

  /**
   * Count records that match the criteria
   */
  count(options?: FindOptions<T>): Promise<number>;

  /**
   * Get the underlying model
   */
  getModel(): ModelStatic<T>;
}

/**
 * Base repository interface for time series data
 * Extends base repository with time-specific operations
 */
export interface ITimeSeriesRepository<T extends Model> extends IRepository<T> {
  /**
   * Find records within a time range
   */
  findInTimeRange(
    startTime: number,
    endTime: number,
    options?: Omit<FindOptions<T>, "where">
  ): Promise<T[]>;

  /**
   * Find the latest record
   */
  findLatest(options?: Omit<FindOptions<T>, "order">): Promise<T | null>;

  /**
   * Find records after a specific timestamp
   */
  findAfter(
    timestamp: number,
    options?: Omit<FindOptions<T>, "where">
  ): Promise<T[]>;

  /**
   * Find records before a specific timestamp
   */
  findBefore(
    timestamp: number,
    options?: Omit<FindOptions<T>, "where">
  ): Promise<T[]>;
}
