/**
 * @module db/models/base
 * @description Base model class providing common functionality for all database models
 */

import { Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

/**
 * @class BaseModel
 * @description Base model class that all other models extend from
 * Provides common fields and functionality like timestamps and soft delete
 * 
 * @example
 * export class MyModel extends BaseModel {
 *   declare name: string;
 *   // ... other fields
 * }
 */
export class BaseModel extends Model<InferAttributes<BaseModel>, InferCreationAttributes<BaseModel>> {
  /** Auto-incremented primary key */
  declare id: CreationOptional<number>;
  /** Record creation timestamp */
  declare createdAt: CreationOptional<Date>;
  /** Record last update timestamp */
  declare updatedAt: CreationOptional<Date>;
  /** Soft delete timestamp */
  declare deletedAt?: CreationOptional<Date | null>;

  /** TypeScript fix for sequelize-typescript static methods */
  declare static init: any;

  /**
   * Converts model instance to a plain object
   * Removes sensitive or unnecessary fields
   * @returns Plain JavaScript object representation of the model
   */
  toJSON(): object {
    const values = { ...this.get() };
    
    // Remove sensitive or unnecessary fields if they exist
    if ('deletedAt' in values) {
      delete values.deletedAt;
    }
    
    return values;
  }

  /**
   * Sanitizes input data by removing undefined values
   * Use this when creating or updating model instances
   * @param data Raw input data
   * @returns Sanitized data object
   * 
   * @example
   * const sanitized = MyModel.sanitizeInput({
   *   name: 'test',
   *   description: undefined
   * });
   * // Result: { name: 'test' }
   */
  static sanitizeInput(data: any): any {
    const sanitized = { ...data };
    
    // Remove any undefined values
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] === undefined) {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  }

  /**
   * Validates model instance data
   * Extends Sequelize's built-in validation
   * Override this method in specific models to add custom validation
   * @throws Will throw an error if validation fails
   */
  async validate(): Promise<void> {
    await super.validate();
  }
}