/**
 * @fileoverview Base repository implementation
 * @module @qi/core/data/access/db/BaseRepository
 *
 * @description
 * Provides base implementation of the repository interface with:
 * - CRUD operations
 * - Transaction support
 * - Error handling
 * - Type safety
 *
 * Serves as the base class for all concrete repository implementations.
 *
 * @author Zhifeng Zhang
 * @created 2024-12-09
 * @modified 2024-12-11
 */

import {
  Model,
  ModelStatic,
  CreationAttributes,
  UpdateOptions as SequelizeUpdateOptions,
  FindOptions as SequelizeFindOptions,
  CreateOptions as SequelizeCreateOptions,
  DestroyOptions,
} from "sequelize";
import {
  IRepository,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
} from "./types.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";

/**
 * Base repository implementation providing common CRUD operations
 */
export abstract class BaseRepository<T extends Model>
  implements IRepository<T>
{
  constructor(protected readonly model: ModelStatic<T>) {}

  /**
   * Create a new record
   */
  async create(data: Partial<T>, options?: CreateOptions<T>): Promise<T> {
    try {
      const sequelizeOptions: SequelizeCreateOptions<T> = {
        transaction: options?.transaction,
        returning: options?.returning !== false,
      };

      return await this.model.create(
        data as CreationAttributes<T>,
        sequelizeOptions
      );
    } catch (error) {
      throw new ApplicationError(
        "Failed to create record",
        ErrorCode.STORAGE_WRITE_ERROR,
        500,
        {
          model: this.model.name,
          error: String(error),
        }
      );
    }
  }

  /**
   * Create multiple records in bulk
   */
  async createBulk(
    data: Partial<T>[],
    options?: CreateOptions<T>
  ): Promise<T[]> {
    try {
      return await this.model.bulkCreate(data as CreationAttributes<T>[], {
        transaction: options?.transaction,
        returning: options?.returning !== false,
      });
    } catch (error) {
      throw new ApplicationError(
        "Failed to bulk create records",
        ErrorCode.STORAGE_WRITE_ERROR,
        500,
        {
          model: this.model.name,
          count: data.length,
          error: String(error),
        }
      );
    }
  }

  /**
   * Find a single record
   */
  async findOne(options: FindOptions<T>): Promise<T | null> {
    try {
      const sequelizeOptions: SequelizeFindOptions<T> = {
        where: options.where,
        transaction: options.transaction,
      };

      if (options.order) {
        sequelizeOptions.order = options.order;
      }

      return await this.model.findOne(sequelizeOptions);
    } catch (error) {
      throw new ApplicationError(
        "Failed to find record",
        ErrorCode.STORAGE_READ_ERROR,
        500,
        {
          model: this.model.name,
          error: String(error),
        }
      );
    }
  }

  /**
   * Find multiple records
   */
  async findMany(options: FindOptions<T>): Promise<T[]> {
    try {
      const sequelizeOptions: SequelizeFindOptions<T> = {
        where: options.where,
        transaction: options.transaction,
      };

      if (options.limit) {
        sequelizeOptions.limit = options.limit;
      }

      if (options.offset) {
        sequelizeOptions.offset = options.offset;
      }

      if (options.order) {
        sequelizeOptions.order = options.order;
      }

      return await this.model.findAll(sequelizeOptions);
    } catch (error) {
      throw new ApplicationError(
        "Failed to find records",
        ErrorCode.STORAGE_READ_ERROR,
        500,
        {
          model: this.model.name,
          error: String(error),
        }
      );
    }
  }

  /**
   * Update records that match the criteria
   */
  async update(
    data: Partial<T>,
    options: UpdateOptions<T>
  ): Promise<[number, T[]]> {
    try {
      const sequelizeOptions: SequelizeUpdateOptions<T> = {
        where: options.where || {},
        transaction: options.transaction,
        returning: true,
      };

      const [affectedCount] = await this.model.update(
        data as CreationAttributes<T>,
        sequelizeOptions
      );
      return [affectedCount, [] as T[]];
    } catch (error) {
      throw new ApplicationError(
        "Failed to update records",
        ErrorCode.STORAGE_WRITE_ERROR,
        500,
        {
          model: this.model.name,
          error: String(error),
        }
      );
    }
  }

  /**
   * Delete records that match the criteria
   */
  async delete(options: DeleteOptions<T>): Promise<number> {
    try {
      const sequelizeOptions: DestroyOptions<T> = {
        where: options.where || {},
        transaction: options.transaction,
        force: options.force,
      };

      return await this.model.destroy(sequelizeOptions);
    } catch (error) {
      throw new ApplicationError(
        "Failed to delete records",
        ErrorCode.STORAGE_WRITE_ERROR,
        500,
        {
          model: this.model.name,
          error: String(error),
        }
      );
    }
  }

  /**
   * Count records that match the criteria
   */
  async count(options?: FindOptions<T>): Promise<number> {
    try {
      return await this.model.count({
        where: options?.where,
        transaction: options?.transaction,
      });
    } catch (error) {
      throw new ApplicationError(
        "Failed to count records",
        ErrorCode.STORAGE_READ_ERROR,
        500,
        {
          model: this.model.name,
          error: String(error),
        }
      );
    }
  }

  /**
   * Get the underlying model
   */
  getModel(): ModelStatic<T> {
    return this.model;
  }
}
