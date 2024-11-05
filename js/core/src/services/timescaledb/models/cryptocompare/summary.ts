/**
 * @module models/cryptocompare/summary
 * @description Asset summary model for storing cryptocurrency asset information
 */

import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional, ModelStatic } from 'sequelize';

/**
 * @interface AssetSummaryAttributes
 * @description Interface describing all attributes of an asset summary
 */
export interface AssetSummaryAttributes {
  /** Unique identifier for the asset summary */
  id: number;
  /** Unique symbol identifier for the asset (e.g., 'BTC') */
  symbol: string;
  /** External identifier for the asset (e.g., from CryptoCompare) */
  assetId: number;
  /** Type of the asset (e.g., 'CRYPTO', 'TOKEN') */
  assetType: string;
  /** Full name of the asset (e.g., 'Bitcoin') */
  name: string;
  /** URL to the asset's logo image */
  logoUrl?: string;
  /** Official launch date of the asset */
  launchDate?: Date;
  /** Data source identifier (e.g., 'cryptocompare') */
  source: string;
  /** Additional metadata stored as JSON */
  metadata?: Record<string, any>;
  /** Record creation timestamp */
  createdAt?: Date;
  /** Record last update timestamp */
  updatedAt?: Date;
  /** Soft delete timestamp */
  deletedAt?: Date | null;
}

/**
 * @class AssetSummary
 * @extends Model
 * @description Sequelize model for cryptocurrency asset summaries
 */
export class AssetSummary extends Model<
  InferAttributes<AssetSummary>,
  InferCreationAttributes<AssetSummary>
> {
  /** Unique identifier */
  declare id: CreationOptional<number>;
  /** Asset symbol */
  declare symbol: string;
  /** External asset ID */
  declare assetId: number;
  /** Asset type */
  declare assetType: string;
  /** Asset name */
  declare name: string;
  /** Logo URL */
  declare logoUrl?: string;
  /** Launch date */
  declare launchDate?: Date;
  /** Data source */
  declare source: string;
  /** Additional metadata */
  declare metadata?: Record<string, any>;
  /** Creation timestamp */
  declare createdAt: CreationOptional<Date>;
  /** Update timestamp */
  declare updatedAt: CreationOptional<Date>;
  /** Deletion timestamp */
  declare deletedAt: CreationOptional<Date> | null;

  /**
   * Retrieves an asset summary by its symbol
   * @param symbol Asset symbol to search for
   * @returns Promise resolving to the asset summary or null if not found
   */
  static async getBySymbol(
    this: ModelStatic<AssetSummary>,
    symbol: string
  ): Promise<AssetSummary | null> {
    return this.findOne({
      where: { symbol }
    });
  }

  /**
   * Retrieves an asset summary by its external ID
   * @param assetId External asset ID to search for
   * @returns Promise resolving to the asset summary or null if not found
   */
  static async getById(
    this: ModelStatic<AssetSummary>,
    assetId: number
  ): Promise<AssetSummary | null> {
    return this.findOne({
      where: { assetId }
    });
  }

  /**
   * Creates a new asset summary or updates an existing one
   * @param symbol Asset symbol
   * @param data Asset data
   * @returns Promise resolving to a tuple containing the asset summary and a boolean indicating if it was created
   */
  static async createOrUpdate(
    this: ModelStatic<AssetSummary>,
    symbol: string,
    data: { 
      assetId: number;
      assetType: string;
      name: string;
      logoUrl?: string;
      launchDate?: Date;
      source: string;
      metadata?: Record<string, any>;
    }
  ): Promise<[AssetSummary, boolean]> {
    const [asset, created] = await this.findOrCreate({
      where: { symbol },
      defaults: {
        symbol,
        ...data
      }
    });

    if (!created && Object.keys(data).length > 0) {
      await asset.update(data);
    }

    return [asset, created];
  }
}

/**
 * Initializes the AssetSummary model in Sequelize
 * @param sequelize Sequelize instance
 */
export const initAssetSummary = (sequelize: Sequelize) => {
  AssetSummary.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    assetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    assetType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    logoUrl: {
      type: DataTypes.STRING
    },
    launchDate: {
      type: DataTypes.DATE
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    tableName: 'asset_summaries',
    paranoid: true,
    indexes: [
      { fields: ['symbol'] },
      { fields: ['assetId'] },
      { fields: ['assetType'] },
      { fields: ['source'] }
    ]
  });
};
