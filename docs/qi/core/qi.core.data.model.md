# Project Source Code Documentation

## models

### base

#### enums.ts

```typescript
/**
 * Time intervals for market data queries.
 * Represents standardized time periods for OHLCV data.
 *
 * @typedef {string} TimeInterval
 *
 * Available intervals:
 * - Minutes: "1m", "5m", "15m", "30m"
 * - Hours: "1h", "4h"
 * - Days/Weeks/Months: "1d", "1w", "1M"
 *
 * @example
 * ```typescript
 * const interval: TimeInterval = "15m";
 * const dailyInterval: TimeInterval = "1d";
 * ```
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
/**
 * @fileoverview CryptoCompare data models index
 * @module @qi/core/data/models/sources/cryptocompare
 */

export * from "./response.js";
export * from "./ohlcv.js";
export * from "./tick.js";
export * from "./types.js";

```

##### ohlcv.ts

```typescript
/**
 * @fileoverview CryptoCompare OHLCV domain model
 * @module @qi/core/data/models/sources/cryptocompare/ohlcv
 */

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
/**
 * @fileoverview CryptoCurrency Compare API response type definitions
 * @module @qi/core/data/models/sources/cryptocompare/response
 */

import { TimeUnit, TradeSide, BaseResponseFields } from "./types.js";

export interface CryptoCompareResponseError {
  type: number;
  message: string;
  other_info?: {
    param?: string;
    values?: string[];
  };
}

export interface CryptoCompareResponse<T> {
  Response: string;
  Message?: string;
  Data: T;
  Err?: CryptoCompareResponseError;
}

export interface CryptoCompareOHLCVData extends BaseResponseFields {
  UNIT: TimeUnit;
  TIMESTAMP: number;
  // OHLCV core data
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
  VOLUME: number;
  QUOTE_VOLUME: number;
  // Trade information
  TOTAL_TRADES: number;
  TOTAL_TRADES_BUY: number;
  TOTAL_TRADES_SELL: number;
  TOTAL_TRADES_UNKNOWN: number;
  // Volume breakdowns
  VOLUME_BUY: number;
  VOLUME_SELL: number;
  VOLUME_UNKNOWN: number;
  QUOTE_VOLUME_BUY: number;
  QUOTE_VOLUME_SELL: number;
  QUOTE_VOLUME_UNKNOWN: number;
  // Trade timestamps
  FIRST_TRADE_TIMESTAMP?: number;
  LAST_TRADE_TIMESTAMP?: number;
  FIRST_TRADE_PRICE?: number;
  LAST_TRADE_PRICE?: number;
}

export type CryptoCompareOHLCVResponse = CryptoCompareResponse<{
  Aggregated: boolean;
  TimeFrom: number;
  TimeTo: number;
  Data: CryptoCompareOHLCVData[];
}>;

export interface CryptoCompareTickData extends BaseResponseFields {
  CCSEQ: number;
  PRICE: number;
  PRICE_FLAG: string;
  PRICE_LAST_UPDATE_TS: number;
  PRICE_LAST_UPDATE_TS_NS: number;
  // Last trade information
  LAST_TRADE_QUANTITY: number;
  LAST_TRADE_QUOTE_QUANTITY: number;
  LAST_TRADE_ID: string;
  LAST_TRADE_CCSEQ: number;
  LAST_TRADE_SIDE: TradeSide;
  // Last processed trade
  LAST_PROCESSED_TRADE_TS: number;
  LAST_PROCESSED_TRADE_TS_NS: number;
  LAST_PROCESSED_TRADE_PRICE: number;
  LAST_PROCESSED_TRADE_QUANTITY: number;
  LAST_PROCESSED_TRADE_QUOTE_QUANTITY: number;
  LAST_PROCESSED_TRADE_SIDE: TradeSide;
}

export type CryptoCompareTickResponse = CryptoCompareResponse<{
  Data: CryptoCompareTickData[];
}>;

```

##### tick.ts

```typescript
/**
 * @fileoverview CryptoCompare tick data domain model
 * @module @qi/core/data/models/sources/cryptocompare/tick
 */

import { Tick } from "../../base/tick.js";
import { CryptoCompareTickData } from "./response.js";
import { ProcessedTrade } from "./types.js";

export class CryptoCompareTick implements Tick {
  public readonly exchange: string;
  public readonly symbol: string;
  public readonly timestamp: number;
  public readonly price: number;
  public readonly quantity: number;
  public readonly side: "buy" | "sell" | "unknown";

  private readonly data: CryptoCompareTickData;

  constructor(data: CryptoCompareTickData) {
    this.data = data;

    this.exchange = data.MARKET;
    this.symbol = data.MAPPED_INSTRUMENT ?? data.INSTRUMENT;
    this.timestamp = data.PRICE_LAST_UPDATE_TS * 1000;
    this.price = data.PRICE;
    this.quantity = data.LAST_TRADE_QUANTITY;
    this.side = data.LAST_TRADE_SIDE;
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
      side: this.data.LAST_PROCESSED_TRADE_SIDE,
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
/**
 * @fileoverview CryptoCompare data type definitions
 * @module @qi/core/data/models/sources/cryptocompare/types
 *
 * @description
 * Pure data type definitions for CryptoCompare market data.
 * These types represent the core data structures without any API or provider-specific logic.
 */

/**
 * Time unit for OHLCV data
 */
export type TimeUnit = "MINUTE" | "HOUR" | "DAY";

/**
 * Trade side type
 */
export type TradeSide = "buy" | "sell" | "unknown";

/**
 * Trade breakdown information for normalized data
 */
export interface TradeBreakdown {
  buy: number;
  sell: number;
  unknown: number;
}

/**
 * Volume breakdown information for normalized data
 */
export interface VolumeBreakdown extends TradeBreakdown {
  quoteBuy: number;
  quoteSell: number;
  quoteUnknown: number;
}

/**
 * Processed trade information for normalized data
 */
export interface ProcessedTrade {
  timestamp: number;
  timestampNs: number;
  price: number;
  quantity: number;
  quoteQuantity: number;
  side: TradeSide;
}

/**
 * Base raw response information shared between OHLCV and Tick data
 * These match the API response field names
 */
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

```

### storage

#### sequelize

##### cryptocompare

###### ohlcv.ts

```typescript
// data/models/storage/sequelize/cryptocompare/ohlcv.ts
import { Model, DataTypes, Sequelize } from "sequelize";
import { CryptoCompareOHLCVData } from "../../../sources/cryptocompare/response.js";
import { TimeUnit } from "../../../sources/cryptocompare/types.js";

export class CryptoCompareOHLCVModel
  extends Model
  implements CryptoCompareOHLCVData
{
  // Base response fields from BaseResponseFields
  public TYPE!: string;
  public MARKET!: string;
  public INSTRUMENT!: string;
  public MAPPED_INSTRUMENT?: string;
  public BASE?: string;
  public QUOTE?: string;
  public BASE_ID?: number;
  public QUOTE_ID?: number;
  public TRANSFORM_FUNCTION?: string;

  // Time unit and timestamp
  public UNIT!: TimeUnit;
  public TIMESTAMP!: number;

  // OHLCV core data
  public OPEN!: number;
  public HIGH!: number;
  public LOW!: number;
  public CLOSE!: number;
  public VOLUME!: number;
  public QUOTE_VOLUME!: number;

  // Trade information
  public TOTAL_TRADES!: number;
  public TOTAL_TRADES_BUY!: number;
  public TOTAL_TRADES_SELL!: number;
  public TOTAL_TRADES_UNKNOWN!: number;

  // Volume breakdowns
  public VOLUME_BUY!: number;
  public VOLUME_SELL!: number;
  public VOLUME_UNKNOWN!: number;
  public QUOTE_VOLUME_BUY!: number;
  public QUOTE_VOLUME_SELL!: number;
  public QUOTE_VOLUME_UNKNOWN!: number;

  // Trade timestamps
  public FIRST_TRADE_TIMESTAMP?: number;
  public LAST_TRADE_TIMESTAMP?: number;
  public FIRST_TRADE_PRICE?: number;
  public LAST_TRADE_PRICE?: number;

  static initialize(sequelize: Sequelize) {
    CryptoCompareOHLCVModel.init(
      {
        // Base response fields
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

        // Time unit and timestamp
        UNIT: {
          type: DataTypes.ENUM("MINUTE", "HOUR", "DAY"),
          allowNull: false,
        },
        TIMESTAMP: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },

        // OHLCV core data
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

        // Trade information
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

        // Volume breakdowns
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

        // Trade timestamps
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
          },
          {
            name: "idx_timestamp",
            fields: ["TIMESTAMP"],
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

export class CryptoCompareTickModel
  extends Model
  implements CryptoCompareTickData
{
  // Base response fields from BaseResponseFields
  public TYPE!: string;
  public MARKET!: string;
  public INSTRUMENT!: string;
  public MAPPED_INSTRUMENT?: string;
  public BASE?: string;
  public QUOTE?: string;
  public BASE_ID?: number;
  public QUOTE_ID?: number;
  public TRANSFORM_FUNCTION?: string;

  // Tick specific fields
  public CCSEQ!: number;
  public PRICE!: number;
  public PRICE_FLAG!: string;
  public PRICE_LAST_UPDATE_TS!: number;
  public PRICE_LAST_UPDATE_TS_NS!: number;

  // Last trade information
  public LAST_TRADE_QUANTITY!: number;
  public LAST_TRADE_QUOTE_QUANTITY!: number;
  public LAST_TRADE_ID!: string;
  public LAST_TRADE_CCSEQ!: number;
  public LAST_TRADE_SIDE!: TradeSide;

  // Last processed trade
  public LAST_PROCESSED_TRADE_TS!: number;
  public LAST_PROCESSED_TRADE_TS_NS!: number;
  public LAST_PROCESSED_TRADE_PRICE!: number;
  public LAST_PROCESSED_TRADE_QUANTITY!: number;
  public LAST_PROCESSED_TRADE_QUOTE_QUANTITY!: number;
  public LAST_PROCESSED_TRADE_SIDE!: TradeSide;

  static initialize(sequelize: Sequelize) {
    CryptoCompareTickModel.init(
      {
        // Base response fields
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

