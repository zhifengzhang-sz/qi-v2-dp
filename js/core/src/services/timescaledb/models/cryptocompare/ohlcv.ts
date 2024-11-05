/**
 * @module db/models/cryptocompare/ohlcv
 * @description OHLCV (Open, High, Low, Close, Volume) model for cryptocurrency price data
 */

import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

/**
 * @interface OHLCVAttributes
 * @description Interface describing all attributes of OHLCV data
 */
export interface OHLCVAttributes {
  /** Unique identifier */
  id: number;
  /** Reference to the instrument this data belongs to */
  instrumentId: number;
  /** Time period this candle represents */
  timestamp: Date;
  /** Opening price for the period */
  open: number;
  /** Highest price during the period */
  high: number;
  /** Lowest price during the period */
  low: number;
  /** Closing price for the period */
  close: number;
  /** Trading volume during the period */
  volume: number;
  /** Data source identifier */
  source: string;
  /** Record creation timestamp */
  createdAt?: Date;
  /** Record update timestamp */
  updatedAt?: Date;
  /** Soft delete timestamp */
  deletedAt?: Date | null;
}

/**
 * @class OHLCV
 * @extends Model
 * @description Sequelize model for cryptocurrency OHLCV data
 * 
 * @example
 * const data = await OHLCV.create({
 *   instrumentId: 1,
 *   timestamp: new Date(),
 *   open: 50000,
 *   high: 51000,
 *   low: 49000,
 *   close: 50500,
 *   volume: 100,
 *   source: 'cryptocompare'
 * });
 */
export class OHLCV extends Model<InferAttributes<OHLCV>, InferCreationAttributes<OHLCV>> {
  /** Unique identifier */
  declare id: CreationOptional<number>;
  /** Reference to instrument */
  declare instrumentId: number;
  /** Candle timestamp */
  declare timestamp: Date;
  /** Opening price */
  declare open: number;
  /** Highest price */
  declare high: number;
  /** Lowest price */
  declare low: number;
  /** Closing price */
  declare close: number;
  /** Trading volume */
  declare volume: number;
  /** Data source */
  declare source: string;
  /** Creation timestamp */
  declare createdAt: CreationOptional<Date>;
  /** Update timestamp */
  declare updatedAt: CreationOptional<Date>;
  /** Deletion timestamp */
  declare deletedAt: CreationOptional<Date> | null;

  /** TypeScript fix for sequelize-typescript static methods */
  declare static init: any;

  /**
   * Gets the most recent OHLCV data for an instrument
   * @param instrumentId Instrument identifier
   * @returns Promise resolving to the latest OHLCV data or null if not found
   */
  static async getLatestByInstrumentId(instrumentId: number): Promise<OHLCV | null> {
    return this.findOne({
      where: {
        instrumentId: instrumentId
      },
      order: [['timestamp', 'DESC']]
    });
  }

  /**
   * Gets OHLCV data for an instrument within a time range
   * @param instrumentId Instrument identifier
   * @param startTime Range start time
   * @param endTime Range end time
   * @param limit Maximum number of records to return (default: 1000)
   * @returns Promise resolving to array of OHLCV data
   */
  static async getByTimeRange(
    instrumentId: number,
    startTime: Date,
    endTime: Date,
    limit: number = 1000
  ): Promise<OHLCV[]> {
    return this.findAll({
      where: {
        instrumentId: instrumentId,
        timestamp: {
          $between: [startTime, endTime]
        }
      },
      limit,
      order: [['timestamp', 'ASC']]
    });
  }
}

/**
 * Initializes the OHLCV model in Sequelize
 * @param sequelize Sequelize instance
 */
export const initOHLCV = (sequelize: Sequelize) => {
  OHLCV.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    instrumentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'instruments',
        key: 'id'
      },
      comment: 'Reference to instruments table'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Time period this candle represents'
    },
    open: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      comment: 'Opening price'
    },
    high: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      comment: 'Highest price'
    },
    low: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      comment: 'Lowest price'
    },
    close: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      comment: 'Closing price'
    },
    volume: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false,
      comment: 'Trading volume'
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Data source identifier'
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    tableName: 'ohlcv',
    paranoid: true,
    indexes: [
      { fields: ['instrumentId', 'timestamp'] },
      { fields: ['timestamp'] },
      { fields: ['source'] }
    ],
    comment: 'Stores OHLCV (Open, High, Low, Close, Volume) data for cryptocurrency prices'
  });
};
