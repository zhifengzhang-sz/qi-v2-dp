# Project Source Code Documentation

## models

### base

#### enums.ts

```typescript
// data/models/base/enums.ts

/**
 * Standardized time intervals for market data queries
 */
export type TimeInterval =
  | "1m"
  | "5m"
  | "15m"
  | "30m" // Minutes
  | "1h"
  | "4h" // Hours
  | "1d"
  | "1w"
  | "1M"; // Days/Weeks/Months

/**
 * Maps TimeInterval to CryptoCompare TimeUnit and interval value
 * @param interval TimeInterval to convert
 * @returns [unit, value] tuple for CryptoCompare API
 */
export function mapTimeInterval(interval: TimeInterval): [string, number] {
  switch (interval) {
    case "1m":
      return ["MINUTE", 1];
    case "5m":
      return ["MINUTE", 5];
    case "15m":
      return ["MINUTE", 15];
    case "30m":
      return ["MINUTE", 30];
    case "1h":
      return ["HOUR", 1];
    case "4h":
      return ["HOUR", 4];
    case "1d":
      return ["DAY", 1];
    case "1w":
      return ["DAY", 7];
    case "1M":
      return ["DAY", 30];
    default:
      throw new Error(`Unsupported time interval: ${interval}`);
  }
}

/**
 * Maps CryptoCompare TimeUnit and value back to TimeInterval
 * @param unit CryptoCompare TimeUnit
 * @param value Interval value
 * @returns Corresponding TimeInterval
 */
export function mapTimeUnit(unit: string, value: number): TimeInterval {
  const key = `${unit}_${value}`;
  switch (key) {
    case "MINUTE_1":
      return "1m";
    case "MINUTE_5":
      return "5m";
    case "MINUTE_15":
      return "15m";
    case "MINUTE_30":
      return "30m";
    case "HOUR_1":
      return "1h";
    case "HOUR_4":
      return "4h";
    case "DAY_1":
      return "1d";
    case "DAY_7":
      return "1w";
    case "DAY_30":
      return "1M";
    default:
      throw new Error(`Unsupported time unit combination: ${unit}_${value}`);
  }
}

```

#### index.ts

```typescript
/**
 * @fileoverview Base market data type definitions and interfaces
 * @module @qi/core/data/models/base
 *
 * @description
 * Core market data model types and interfaces used throughout the system for data representation.
 * Provides foundational data structures that all market data implementations must follow.
 *
 * @example Import Types
 * ```typescript
 * import { BaseMarketData, OHLCV, Tick } from '@qi/core/data/models/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-10
 * @version 1.0.0
 * @license MIT
 */

export { BaseMarketData } from "./types.js";
export { TimeInterval } from "./enums.js";
export { OHLCV } from "./ohlcv.js";
export { Tick } from "./tick.js";

```

#### ohlcv.ts

```typescript
import { BaseMarketData } from "./types.js";

/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick data.
 * Represents price and volume data for a specific time period.
 *
 * @interface OHLCV
 * @extends {BaseMarketData}
 *
 * @property {number} open - Opening price of the period
 * @property {number} high - Highest price during the period
 * @property {number} low - Lowest price during the period
 * @property {number} close - Closing price of the period
 * @property {number} volume - Trading volume in base currency
 * @property {number} [quoteVolume] - Optional trading volume in quote currency
 * @property {number} [trades] - Optional number of trades in the period
 *
 * @example
 * ```typescript
 * const ohlcv: OHLCV = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   timestamp: 1701936000000,
 *   open: 43250.5,
 *   high: 43500.0,
 *   low: 43100.0,
 *   close: 43300.5,
 *   volume: 123.45,
 *   quoteVolume: 5342917.25,
 *   trades: 1250
 * };
 * ```
 */
export interface OHLCV extends BaseMarketData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

```

#### tick.ts

```typescript
import { BaseMarketData } from "./types.js";

/**
 * @interface Tick
 * @extends {BaseMarketData}
 * @description Real-time market tick data
 *
 * @property {number} price - Trade price
 * @property {number} quantity - Trade quantity
 * @property {'buy'|'sell'|'unknown'} side - Trade direction
 */
export interface Tick extends BaseMarketData {
  price: number;
  quantity: number;
  side: "buy" | "sell" | "unknown";
}

```

#### types.ts

```typescript
/**
 * @fileoverview Base market data type definitions and interfaces
 * @module @qi/core/data/models/base
 *
 * @description
 * Core market data model types and interfaces used throughout the system for data representation.
 * Provides foundational data structures that all market data implementations must follow.
 *
 * @example Import Types
 * ```typescript
 * import { BaseMarketData, OHLCV, Tick } from '@qi/core/data/models/base';
 * ```
 *
 * @author Zhifeng Zhang
 * @created 2024-12-07
 * @modified 2024-12-10
 */

/**
 * Base interface for all market data.
 * Provides common fields that all market data types must implement.
 *
 * @interface BaseMarketData
 *
 * @property {string} exchange - Exchange identifier (e.g., "binance", "kraken")
 * @property {string} symbol - Trading pair symbol (e.g., "BTC-USD", "ETH-USDT")
 * @property {number} timestamp - Unix timestamp in milliseconds
 *
 * @example
 * ```typescript
 * const marketData: BaseMarketData = {
 *   exchange: "kraken",
 *   symbol: "BTC-USD",
 *   timestamp: Date.now()
 * };
 * ```
 */
export interface BaseMarketData {
  exchange: string;
  symbol: string;
  timestamp: number;
}

```

### sources

#### cryptocompare

##### index.ts

```typescript
// data/models/sources/cryptocompare/index.ts
export * from "./response.js";
export * from "./ohlcv.js";
export * from "./tick.js";
export * from "./types.js";

```

##### ohlcv.ts

```typescript
// data/models/sources/cryptocompare/ohlcv.ts
import { OHLCV } from "../../base/ohlcv.js";
import { CryptoCompareOHLCVData } from "./response.js";
import { TradeBreakdown, VolumeBreakdown } from "./types.js";

export class CryptoCompareOHLCV implements OHLCV {
  public readonly exchange: string;
  public readonly symbol: string;
  public readonly timestamp: number;
  public readonly open: number;
  public readonly high: number;
  public readonly low: number;
  public readonly close: number;
  public readonly volume: number;
  public readonly quoteVolume: number;
  public readonly trades: number;

  private readonly data: CryptoCompareOHLCVData;

  constructor(data: CryptoCompareOHLCVData) {
    this.data = data;

    this.exchange = data.MARKET;
    this.symbol = data.MAPPED_INSTRUMENT ?? data.INSTRUMENT;
    this.timestamp = data.TIMESTAMP * 1000;
    this.open = data.OPEN;
    this.high = data.HIGH;
    this.low = data.LOW;
    this.close = data.CLOSE;
    this.volume = data.VOLUME;
    this.quoteVolume = data.QUOTE_VOLUME;
    this.trades = data.TOTAL_TRADES;
  }

  getTradeBreakdown(): TradeBreakdown {
    return {
      buy: this.data.TOTAL_TRADES_BUY,
      sell: this.data.TOTAL_TRADES_SELL,
      unknown: this.data.TOTAL_TRADES_UNKNOWN,
    };
  }

  getVolumeBreakdown(): VolumeBreakdown {
    return {
      buy: this.data.VOLUME_BUY,
      sell: this.data.VOLUME_SELL,
      unknown: this.data.VOLUME_UNKNOWN,
      quoteBuy: this.data.QUOTE_VOLUME_BUY,
      quoteSell: this.data.QUOTE_VOLUME_SELL,
      quoteUnknown: this.data.QUOTE_VOLUME_UNKNOWN,
    };
  }

  getRawData(): CryptoCompareOHLCVData {
    return { ...this.data };
  }

  static fromResponse(data: CryptoCompareOHLCVData[]): CryptoCompareOHLCV[] {
    return data.map((item) => new CryptoCompareOHLCV(item));
  }
}

```

##### response.ts

```typescript
// data/models/sources/cryptocompare/response.ts

import {
  TimeUnit,
  BaseResponseFields,
  VolumeData,
  TradeCountData,
  OHLCData,
  TimeframeData,
  TopOfBookData,
  LifetimeData,
} from "./types.js";

export interface CryptoCompareResponse<T> {
  Response: string;
  Message?: string;
  Data: T;
  Err?: CryptoCompareResponseError;
}

export interface CryptoCompareResponseError {
  type: number;
  message: string;
  other_info?: {
    param?: string;
    values?: string[];
  };
}

export interface CryptoCompareOHLCVData
  extends BaseResponseFields,
    VolumeData,
    TradeCountData,
    OHLCData {
  UNIT: TimeUnit;
  TIMESTAMP: number;
  FIRST_TRADE_TIMESTAMP?: number;
  LAST_TRADE_TIMESTAMP?: number;
  FIRST_TRADE_PRICE?: number;
  LAST_TRADE_PRICE?: number;
}

export interface CryptoCompareTickData extends BaseResponseFields {
  CCSEQ: number;
  PRICE: number;
  PRICE_FLAG: string;
  PRICE_LAST_UPDATE_TS: number;
  PRICE_LAST_UPDATE_TS_NS: number;

  // Last trade info
  LAST_TRADE_QUANTITY: number;
  LAST_TRADE_QUOTE_QUANTITY: number;
  LAST_TRADE_ID: string;
  LAST_TRADE_CCSEQ: number;
  LAST_TRADE_SIDE: string;

  // Last processed trade
  LAST_PROCESSED_TRADE_TS: number;
  LAST_PROCESSED_TRADE_TS_NS: number;
  LAST_PROCESSED_TRADE_PRICE: number;
  LAST_PROCESSED_TRADE_QUANTITY: number;
  LAST_PROCESSED_TRADE_QUOTE_QUANTITY: number;
  LAST_PROCESSED_TRADE_SIDE: string;
  LAST_PROCESSED_TRADE_CCSEQ: number;

  // Book data
  TOP_OF_BOOK: TopOfBookData;

  // Timeframe data
  CURRENT_HOUR: TimeframeData;
  CURRENT_DAY: TimeframeData;
  CURRENT_WEEK: TimeframeData;
  CURRENT_MONTH: TimeframeData;
  CURRENT_YEAR: TimeframeData;
  MOVING_24_HOUR: TimeframeData;
  MOVING_7_DAY: TimeframeData;
  MOVING_30_DAY: TimeframeData;
  MOVING_90_DAY: TimeframeData;
  MOVING_180_DAY: TimeframeData;
  MOVING_365_DAY: TimeframeData;

  // Lifetime stats
  LIFETIME: LifetimeData;
}

export type CryptoCompareOHLCVResponse = CryptoCompareResponse<{
  Aggregated: boolean;
  TimeFrom: number;
  TimeTo: number;
  Data: CryptoCompareOHLCVData[];
}>;

export type CryptoCompareTickResponse = CryptoCompareResponse<{
  Data: CryptoCompareTickData[];
}>;

```

##### tick.ts

```typescript
// data/models/sources/cryptocompare/tick.ts
import { Tick } from "../../base/tick.js";
import { CryptoCompareTickData } from "./response.js";
import { TradeSide } from "./types.js";

export interface ProcessedTrade {
  timestamp: number;
  timestampNs: number;
  price: number;
  quantity: number;
  quoteQuantity: number;
  side: TradeSide;
}

export class CryptoCompareTick implements Tick {
  public readonly exchange: string;
  public readonly symbol: string;
  public readonly timestamp: number;
  public readonly price: number;
  public readonly quantity: number;
  public readonly side: TradeSide;

  private readonly data: CryptoCompareTickData;

  constructor(data: CryptoCompareTickData) {
    this.data = data;

    this.exchange = data.MARKET;
    this.symbol = data.MAPPED_INSTRUMENT ?? data.INSTRUMENT;
    this.timestamp = data.PRICE_LAST_UPDATE_TS * 1000;
    this.price = data.PRICE;
    this.quantity = data.LAST_TRADE_QUANTITY;
    // Convert string to TradeSide type
    this.side = this.normalizeTradeSide(data.LAST_TRADE_SIDE);
  }

  private normalizeTradeSide(side: string): TradeSide {
    const normalizedSide = side.toLowerCase();
    if (normalizedSide === "buy" || normalizedSide === "sell") {
      return normalizedSide;
    }
    return "unknown";
  }

  getTimestampNs(): number {
    return this.data.PRICE_LAST_UPDATE_TS_NS;
  }

  getQuoteQuantity(): number {
    return this.data.LAST_TRADE_QUOTE_QUANTITY;
  }

  getSequence(): number {
    return this.data.CCSEQ;
  }

  getProcessedTrade(): ProcessedTrade {
    return {
      timestamp: this.data.LAST_PROCESSED_TRADE_TS * 1000,
      timestampNs: this.data.LAST_PROCESSED_TRADE_TS_NS,
      price: this.data.LAST_PROCESSED_TRADE_PRICE,
      quantity: this.data.LAST_PROCESSED_TRADE_QUANTITY,
      quoteQuantity: this.data.LAST_PROCESSED_TRADE_QUOTE_QUANTITY,
      side: this.normalizeTradeSide(this.data.LAST_PROCESSED_TRADE_SIDE),
    };
  }

  getRawData(): CryptoCompareTickData {
    return { ...this.data };
  }

  static fromResponse(data: CryptoCompareTickData[]): CryptoCompareTick[] {
    return data.map((item) => new CryptoCompareTick(item));
  }
}

```

##### types.ts

```typescript
// data/models/sources/cryptocompare/types.ts

export type TimeUnit = "MINUTE" | "HOUR" | "DAY";
export type TradeSide = "buy" | "sell" | "unknown";

// Add missing TradeBreakdown interface
export interface TradeBreakdown {
  buy: number;
  sell: number;
  unknown: number;
}

// Add missing VolumeBreakdown interface
export interface VolumeBreakdown extends TradeBreakdown {
  quoteBuy: number;
  quoteSell: number;
  quoteUnknown: number;
}

export interface BaseResponseFields {
  TYPE: string;
  MARKET: string;
  INSTRUMENT: string;
  MAPPED_INSTRUMENT?: string;
  BASE?: string;
  QUOTE?: string;
  BASE_ID?: number;
  QUOTE_ID?: number;
  TRANSFORM_FUNCTION?: string;
}

export interface VolumeData {
  VOLUME: number;
  QUOTE_VOLUME: number;
  VOLUME_BUY: number;
  VOLUME_SELL: number;
  VOLUME_UNKNOWN: number;
  QUOTE_VOLUME_BUY: number;
  QUOTE_VOLUME_SELL: number;
  QUOTE_VOLUME_UNKNOWN: number;
}

export interface TradeCountData {
  TOTAL_TRADES: number;
  TOTAL_TRADES_BUY: number;
  TOTAL_TRADES_SELL: number;
  TOTAL_TRADES_UNKNOWN: number;
}

export interface OHLCData {
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
}

export interface TradeTimestampData {
  FIRST_TRADE_TIMESTAMP?: number;
  LAST_TRADE_TIMESTAMP?: number;
  FIRST_TRADE_PRICE?: number;
  LAST_TRADE_PRICE?: number;
}

export interface TimeframeData {
  VOLUME: number;
  QUOTE_VOLUME: number;
  VOLUME_BUY: number;
  VOLUME_SELL: number;
  VOLUME_UNKNOWN: number;
  QUOTE_VOLUME_BUY: number;
  QUOTE_VOLUME_SELL: number;
  QUOTE_VOLUME_UNKNOWN: number;
  OPEN: number;
  HIGH: number;
  LOW: number;
  TOTAL_TRADES: number;
  TOTAL_TRADES_BUY: number;
  TOTAL_TRADES_SELL: number;
  TOTAL_TRADES_UNKNOWN: number;
  CHANGE: number;
  CHANGE_PERCENTAGE: number;
}

export interface TopOfBookData {
  BEST_BID: number;
  BEST_BID_QUANTITY: number;
  BEST_BID_QUOTE_QUANTITY: number;
  BEST_BID_LAST_UPDATE_TS: number;
  BEST_BID_LAST_UPDATE_TS_NS: number;
  BEST_BID_POSITION_IN_BOOK_UPDATE_TS: number;
  BEST_BID_POSITION_IN_BOOK_UPDATE_TS_NS: number;
  BEST_ASK: number;
  BEST_ASK_QUANTITY: number;
  BEST_ASK_QUOTE_QUANTITY: number;
  BEST_ASK_LAST_UPDATE_TS: number;
  BEST_ASK_LAST_UPDATE_TS_NS: number;
  BEST_ASK_POSITION_IN_BOOK_UPDATE_TS: number;
  BEST_ASK_POSITION_IN_BOOK_UPDATE_TS_NS: number;
}

export interface LifetimeData {
  LIFETIME_FIRST_TRADE_TS: number;
  LIFETIME_VOLUME: number;
  LIFETIME_VOLUME_BUY: number;
  LIFETIME_VOLUME_SELL: number;
  LIFETIME_VOLUME_UNKNOWN: number;
  LIFETIME_QUOTE_VOLUME: number;
  LIFETIME_QUOTE_VOLUME_BUY: number;
  LIFETIME_QUOTE_VOLUME_SELL: number;
  LIFETIME_QUOTE_VOLUME_UNKNOWN: number;
  LIFETIME_OPEN: number;
  LIFETIME_HIGH: number;
  LIFETIME_HIGH_TS: number;
  LIFETIME_LOW: number;
  LIFETIME_LOW_TS: number;
  LIFETIME_TOTAL_TRADES: number;
  LIFETIME_TOTAL_TRADES_BUY: number;
  LIFETIME_TOTAL_TRADES_SELL: number;
  LIFETIME_TOTAL_TRADES_UNKNOWN: number;
  LIFETIME_CHANGE: number;
  LIFETIME_CHANGE_PERCENTAGE: number;
}

```

### storage

#### sequelize

##### cryptocompare

###### base.ts

```typescript
// data/models/storage/sequelize/cryptocompare/base.ts

import { DataTypes, Model, ModelAttributes } from "sequelize";
import { BaseResponseFields } from "../../../sources/cryptocompare/types.js";

// Define a type for the Sequelize attribute configuration
export const baseModelConfig: ModelAttributes<Model, BaseResponseFields> = {
  TYPE: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  MARKET: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  INSTRUMENT: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  MAPPED_INSTRUMENT: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  BASE: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  QUOTE: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  BASE_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  QUOTE_ID: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  TRANSFORM_FUNCTION: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
};

```

###### ohlcv.ts

```typescript
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

```

###### tick.ts

```typescript
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

  // Note: Complex data structures (TOP_OF_BOOK, timeframes, LIFETIME) are stored in separate tables
  // and retrieved through associations

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

```

