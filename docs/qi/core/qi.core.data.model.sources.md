# Project Source Code Documentation

## sources

### cryptocompare

#### index.ts

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

#### ohlcv.ts

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

#### response.ts

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

#### tick.ts

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

#### types.ts

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

