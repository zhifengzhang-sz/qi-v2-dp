#!/usr/bin/env bun

/**
 * Price Calculation Functions
 *
 * Business logic for market data price calculations.
 * Operates on pure DSL data types.
 */

import type { Level1 } from "../dsl/types.js";

/**
 * Calculate bid/ask spread
 */
export function getSpread(level1: Level1): number {
  return level1.askPrice - level1.bidPrice;
}

/**
 * Calculate mid price (average of bid and ask)
 */
export function getMidPrice(level1: Level1): number {
  return (level1.bidPrice + level1.askPrice) / 2;
}
