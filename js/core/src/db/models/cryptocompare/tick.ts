import { DataTypes, Model, Sequelize, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import { BaseModel } from '../base.js';

export type TickSide = 'BUY' | 'SELL';
export type TickStatus = 'VALID' | 'INVALID' | 'PENDING';

export interface TickAttributes {
  id: number;
  instrumentId: number;
  timestamp: Date;
  side: TickSide;
  price: number;
  quantity: number;
  quoteQuantity: number;
  tradeId: string;
  source: string;
  ccseq: number;
  status: TickStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Tick extends Model<InferAttributes<Tick>, InferCreationAttributes<Tick>> {
  declare id: CreationOptional<number>;
  declare instrumentId: number;
  declare timestamp: Date;
  declare side: TickSide;
  declare price: number;
  declare quantity: number;
  declare quoteQuantity: number;
  declare tradeId: string;
  declare source: string;
  declare ccseq: number;
  declare status: TickStatus;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date> | null;

  declare static init: any;

  static async getByInstrumentId(instrumentId: number, limit: number = 100) {
    return this.findAll({
      where: {
        instrumentId: instrumentId
      },
      limit,
      order: [['timestamp', 'DESC']]
    });
  }

  static async getLatestByInstrumentId(instrumentId: number) {
    return this.findAll({
      where: {
        instrumentId: instrumentId
      },
      limit: 1,
      order: [['timestamp', 'DESC']]
    });
  }
}

export const initTick = (sequelize: Sequelize) => {
  Tick.init({
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
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false
    },
    side: {
      type: DataTypes.ENUM('BUY', 'SELL'),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    quoteQuantity: {
      type: DataTypes.DECIMAL(18, 8),
      allowNull: false
    },
    tradeId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ccseq: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('VALID', 'INVALID', 'PENDING'),
      allowNull: false,
      defaultValue: 'VALID'
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    tableName: 'ticks',
    paranoid: true,
    indexes: [
      { fields: ['instrumentId', 'timestamp'] },
      { fields: ['tradeId'], unique: true },
      { fields: ['timestamp'] },
      { fields: ['status'] }
    ]
  });
};
