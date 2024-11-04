/**
 * @module db/models/cryptocompare/market
 * @description Market model for cryptocurrency exchanges
 */

import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

/**
 * @interface MarketAttributes
 * @description Interface describing all attributes of a market
 */
export interface MarketAttributes {
  /** Unique identifier */
  id: number;
  /** Market name (e.g., 'Binance', 'Kraken') */
  name: string;
  /** Market status */
  isActive: boolean;
  /** Record creation timestamp */
  createdAt?: Date;
  /** Record update timestamp */
  updatedAt?: Date;
  /** Soft delete timestamp */
  deletedAt?: Date | null;
}

/**
 * @class Market
 * @extends Model
 * @description Sequelize model for cryptocurrency markets/exchanges
 * 
 * @example
 * const market = await Market.create({
 *   name: 'Binance',
 *   isActive: true
 * });
 */
export class Market extends Model<InferAttributes<Market>, InferCreationAttributes<Market>> {
  /** Unique identifier */
  declare id: CreationOptional<number>;
  /** Market name */
  declare name: string;
  /** Market status */
  declare isActive: boolean;
  /** Creation timestamp */
  declare createdAt: CreationOptional<Date>;
  /** Update timestamp */
  declare updatedAt: CreationOptional<Date>;
  /** Deletion timestamp */
  declare deletedAt: CreationOptional<Date> | null;

  /** TypeScript fix for sequelize-typescript static methods */
  declare static init: any;

  /**
   * Finds an active market by name
   * @param name Market name to search for
   * @returns Promise resolving to the market or null if not found
   */
  static async findByName(name: string): Promise<Market | null> {
    return this.findOne({
      where: {
        name,
        isActive: true
      }
    });
  }

  /**
   * Lists all active markets
   * @returns Promise resolving to array of active markets
   */
  static async listActive(): Promise<Market[]> {
    return this.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
  }
}

/**
 * Initializes the Market model in Sequelize
 * @param sequelize Sequelize instance
 */
export const initMarket = (sequelize: Sequelize) => {
  Market.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Market name cannot be empty' }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    tableName: 'markets',
    paranoid: true,
    indexes: [{ fields: ['name'] }]
  });
};
