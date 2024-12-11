/**
 * @fileoverview
 * @module ohlcv.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// data/models/storage/sequelize/cryptocompare/ohlcv.ts

import { Model, DataTypes, Sequelize } from "sequelize";
import { CryptoCompareOHLCVData } from "../../../sources/cryptocompare/response.js";
import { baseModelConfig } from "./base.js";

export class CryptoCompareOHLCVModel
  extends Model
  implements CryptoCompareOHLCVData
{
  declare TYPE: string;
  declare MARKET: string;
  declare INSTRUMENT: string;
  declare MAPPED_INSTRUMENT?: string;
  declare BASE?: string;
  declare QUOTE?: string;
  declare BASE_ID?: number;
  declare QUOTE_ID?: number;
  declare TRANSFORM_FUNCTION?: string;
  declare UNIT: "MINUTE" | "HOUR" | "DAY";
  declare TIMESTAMP: number;
  declare OPEN: number;
  declare HIGH: number;
  declare LOW: number;
  declare CLOSE: number;
  declare VOLUME: number;
  declare QUOTE_VOLUME: number;
  declare VOLUME_BUY: number;
  declare VOLUME_SELL: number;
  declare VOLUME_UNKNOWN: number;
  declare QUOTE_VOLUME_BUY: number;
  declare QUOTE_VOLUME_SELL: number;
  declare QUOTE_VOLUME_UNKNOWN: number;
  declare TOTAL_TRADES: number;
  declare TOTAL_TRADES_BUY: number;
  declare TOTAL_TRADES_SELL: number;
  declare TOTAL_TRADES_UNKNOWN: number;
  declare FIRST_TRADE_TIMESTAMP?: number;
  declare LAST_TRADE_TIMESTAMP?: number;
  declare FIRST_TRADE_PRICE?: number;
  declare LAST_TRADE_PRICE?: number;

  static initialize(sequelize: Sequelize) {
    CryptoCompareOHLCVModel.init(
      {
        ...baseModelConfig,
        UNIT: {
          type: DataTypes.ENUM("MINUTE", "HOUR", "DAY"),
          allowNull: false,
        },
        TIMESTAMP: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        OPEN: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        HIGH: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        LOW: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        CLOSE: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        VOLUME: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        QUOTE_VOLUME: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        VOLUME_BUY: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        VOLUME_SELL: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        VOLUME_UNKNOWN: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        QUOTE_VOLUME_BUY: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        QUOTE_VOLUME_SELL: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        QUOTE_VOLUME_UNKNOWN: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        TOTAL_TRADES: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        TOTAL_TRADES_BUY: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        TOTAL_TRADES_SELL: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        TOTAL_TRADES_UNKNOWN: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        FIRST_TRADE_TIMESTAMP: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        LAST_TRADE_TIMESTAMP: {
          type: DataTypes.BIGINT,
          allowNull: true,
        },
        FIRST_TRADE_PRICE: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: true,
        },
        LAST_TRADE_PRICE: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "cryptocompare_ohlcv",
        timestamps: false,
        indexes: [
          {
            name: "idx_market_instrument_timestamp",
            fields: ["MARKET", "INSTRUMENT", "TIMESTAMP"],
            unique: true,
          },
          {
            name: "idx_timestamp",
            fields: ["TIMESTAMP"],
          },
          {
            name: "idx_market_instrument",
            fields: ["MARKET", "INSTRUMENT"],
          },
        ],
      }
    );
  }
}
