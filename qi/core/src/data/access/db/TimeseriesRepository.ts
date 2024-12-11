/**
 * @fileoverview Time series repository implementation
 * @module @qi/core/data/access/db/TimeseriesRepository
 *
 * @description
 * Extends the base repository with time series specific functionality:
 * - Time range queries
 * - Latest record retrieval
 * - Before/After timestamp queries
 * - Custom time field support
 *
 * Used for all time series data access in the system, particularly
 * for market data like OHLCV and trades.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-09
 * @modified 2024-12-11
 */

import { Model, ModelStatic, Op, WhereOptions } from "sequelize";
import { BaseRepository } from "./BaseRepository.js";
import { ITimeSeriesRepository, FindOptions } from "./types.js";

/**
 * Base repository implementation for time series data
 * Extends base repository with time-specific operations
 */
export abstract class TimeSeriesRepository<T extends Model>
  extends BaseRepository<T>
  implements ITimeSeriesRepository<T>
{
  constructor(
    model: ModelStatic<T>,
    protected readonly timeField: string = "timestamp"
  ) {
    super(model);
  }

  /**
   * Find records within a time range
   */
  async findInTimeRange(
    startTime: number,
    endTime: number,
    options?: Omit<FindOptions<T>, "where">
  ): Promise<T[]> {
    const whereClause = {
      [this.timeField]: {
        [Op.between]: [startTime, endTime],
      },
    } as WhereOptions<T>;

    return this.findMany({
      ...options,
      where: whereClause,
      order: [[this.timeField, "ASC"]],
    });
  }

  /**
   * Find the latest record
   */
  async findLatest(options?: Omit<FindOptions<T>, "order">): Promise<T | null> {
    return this.findOne({
      ...options,
      order: [[this.timeField, "DESC"]],
      limit: 1,
    });
  }

  /**
   * Find records after a specific timestamp
   */
  async findAfter(
    timestamp: number,
    options?: Omit<FindOptions<T>, "where">
  ): Promise<T[]> {
    const whereClause = {
      [this.timeField]: {
        [Op.gt]: timestamp,
      },
    } as WhereOptions<T>;

    return this.findMany({
      ...options,
      where: whereClause,
      order: [[this.timeField, "ASC"]],
    });
  }

  /**
   * Find records before a specific timestamp
   */
  async findBefore(
    timestamp: number,
    options?: Omit<FindOptions<T>, "where">
  ): Promise<T[]> {
    const whereClause = {
      [this.timeField]: {
        [Op.lt]: timestamp,
      },
    } as WhereOptions<T>;

    return this.findMany({
      ...options,
      where: whereClause,
      order: [[this.timeField, "DESC"]],
    });
  }
}
