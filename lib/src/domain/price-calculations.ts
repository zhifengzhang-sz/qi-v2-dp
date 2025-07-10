#!/usr/bin/env bun

/**
 * Price Calculation Functions
 *
 * Business logic for market data price calculations.
 * Operates on pure DSL data types.
 */

import type { Level1 } from "../dsl/types.js";
import type { ResultType as Result } from "@qi/core/base";
import { createQiError, failure, success } from "@qi/core/base";

/**
 * Calculate bid/ask spread
 */
export function getSpread(level1: Level1): Result<number> {
  if (level1.askPrice <= 0 || level1.bidPrice <= 0) {
    return failure(createQiError("INVALID_PRICE", "Bid and ask prices must be positive", "VALIDATION"));
  }
  if (level1.askPrice <= level1.bidPrice) {
    return failure(createQiError("INVALID_SPREAD", "Ask price must be greater than bid price", "VALIDATION"));
  }
  return success(level1.askPrice - level1.bidPrice);
}

/**
 * Calculate mid price (average of bid and ask)
 */
export function getMidPrice(level1: Level1): Result<number> {
  if (level1.askPrice <= 0 || level1.bidPrice <= 0) {
    return failure(createQiError("INVALID_PRICE", "Bid and ask prices must be positive", "VALIDATION"));
  }
  if (level1.askPrice <= level1.bidPrice) {
    return failure(createQiError("INVALID_SPREAD", "Ask price must be greater than bid price", "VALIDATION"));
  }
  return success((level1.bidPrice + level1.askPrice) / 2);
}
