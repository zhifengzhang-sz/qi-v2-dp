/**
 * @fileoverview
 * @module types.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

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
