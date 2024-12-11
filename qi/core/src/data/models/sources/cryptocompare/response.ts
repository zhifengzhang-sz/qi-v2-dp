/**
 * @fileoverview
 * @module response.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

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
