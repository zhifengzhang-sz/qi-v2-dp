/**
 * @fileoverview
 * @module ohlcv.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

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
