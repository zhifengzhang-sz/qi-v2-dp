/**
 * @fileoverview
 * @module tick.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// data/models/storage/sequelize/cryptocompare/tick.ts
import { Model, DataTypes, Sequelize } from "sequelize";
import { CryptoCompareTickData } from "../../../sources/cryptocompare/response.js";
import { TradeSide } from "../../../sources/cryptocompare/types.js";
import { baseModelConfig } from "./base.js";

export class CryptoCompareTickModel
  extends Model
  implements
    Omit<
      CryptoCompareTickData,
      | "TOP_OF_BOOK"
      | "CURRENT_HOUR"
      | "CURRENT_DAY"
      | "CURRENT_WEEK"
      | "CURRENT_MONTH"
      | "CURRENT_YEAR"
      | "MOVING_24_HOUR"
      | "MOVING_7_DAY"
      | "MOVING_30_DAY"
      | "MOVING_90_DAY"
      | "MOVING_180_DAY"
      | "MOVING_365_DAY"
      | "LIFETIME"
    >
{
  // Base response fields
  declare TYPE: string;
  declare MARKET: string;
  declare INSTRUMENT: string;
  declare MAPPED_INSTRUMENT?: string;
  declare BASE?: string;
  declare QUOTE?: string;
  declare BASE_ID?: number;
  declare QUOTE_ID?: number;
  declare TRANSFORM_FUNCTION?: string;

  // Tick specific fields
  declare CCSEQ: number;
  declare PRICE: number;
  declare PRICE_FLAG: string;
  declare PRICE_LAST_UPDATE_TS: number;
  declare PRICE_LAST_UPDATE_TS_NS: number;

  // Last trade information
  declare LAST_TRADE_QUANTITY: number;
  declare LAST_TRADE_QUOTE_QUANTITY: number;
  declare LAST_TRADE_ID: string;
  declare LAST_TRADE_CCSEQ: number;
  declare LAST_TRADE_SIDE: TradeSide;

  // Last processed trade
  declare LAST_PROCESSED_TRADE_TS: number;
  declare LAST_PROCESSED_TRADE_TS_NS: number;
  declare LAST_PROCESSED_TRADE_PRICE: number;
  declare LAST_PROCESSED_TRADE_QUANTITY: number;
  declare LAST_PROCESSED_TRADE_QUOTE_QUANTITY: number;
  declare LAST_PROCESSED_TRADE_SIDE: TradeSide;
  declare LAST_PROCESSED_TRADE_CCSEQ: number;

  static initialize(sequelize: Sequelize) {
    CryptoCompareTickModel.init(
      {
        ...baseModelConfig,

        // Tick specific fields
        CCSEQ: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        PRICE: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        PRICE_FLAG: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        PRICE_LAST_UPDATE_TS: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        PRICE_LAST_UPDATE_TS_NS: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },

        // Last trade information
        LAST_TRADE_QUANTITY: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        LAST_TRADE_QUOTE_QUANTITY: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        LAST_TRADE_ID: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        LAST_TRADE_CCSEQ: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        LAST_TRADE_SIDE: {
          type: DataTypes.ENUM("buy", "sell", "unknown"),
          allowNull: false,
          validate: {
            isIn: [["buy", "sell", "unknown"]],
          },
        },

        // Last processed trade
        LAST_PROCESSED_TRADE_TS: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        LAST_PROCESSED_TRADE_TS_NS: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        LAST_PROCESSED_TRADE_PRICE: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        LAST_PROCESSED_TRADE_QUANTITY: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        LAST_PROCESSED_TRADE_QUOTE_QUANTITY: {
          type: DataTypes.DECIMAL(18, 8),
          allowNull: false,
        },
        LAST_PROCESSED_TRADE_SIDE: {
          type: DataTypes.ENUM("buy", "sell", "unknown"),
          allowNull: false,
          validate: {
            isIn: [["buy", "sell", "unknown"]],
          },
        },
        LAST_PROCESSED_TRADE_CCSEQ: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "cryptocompare_ticks",
        timestamps: false,
        indexes: [
          {
            name: "idx_market_instrument_timestamp",
            fields: ["MARKET", "INSTRUMENT", "PRICE_LAST_UPDATE_TS"],
          },
          {
            name: "idx_ccseq",
            fields: ["CCSEQ"],
          },
          {
            name: "idx_timestamp",
            fields: ["PRICE_LAST_UPDATE_TS"],
          },
        ],
      }
    );
  }
}
