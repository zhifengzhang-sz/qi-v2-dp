/**
 * @fileoverview
 * @module tick.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

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
