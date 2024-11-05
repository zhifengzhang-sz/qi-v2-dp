import { DataTypes, Sequelize } from 'sequelize';
import { BaseModel } from '../base.js';

export class Instrument extends BaseModel {
  public symbol!: string;        // Trading pair symbol (e.g., BTC-USD)
  public marketId!: number;      // Reference to market table
  public baseAsset!: string;     // Base currency (e.g., BTC)
  public quoteAsset!: string;    // Quote currency (e.g., USD)
  public isActive?: boolean;     // Whether the instrument is currently tradeable

  declare static init: any; // TypeScript type fix for sequelize-typescript
}

export const initInstrument = (sequelize: Sequelize) => {
  Instrument.init({
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Trading pair symbol'
    },
    marketId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'markets',
        key: 'id'
      },
      comment: 'Reference to market'
    },
    baseAsset: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Base currency symbol'
    },
    quoteAsset: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Quote currency symbol'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Trading pair status'
    }
  }, {
    sequelize,
    tableName: 'instruments',
    paranoid: true,
    indexes: [
      { fields: ['symbol', 'marketId'], unique: true },
      { fields: ['baseAsset', 'quoteAsset'] }
    ]
  });
};