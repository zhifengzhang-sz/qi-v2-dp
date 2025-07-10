#!/usr/bin/env bun

/**
 * Market Logic Functions
 *
 * Business logic for market data operations.
 * Operates on pure DSL data types.
 */

import type { MarketContext, MarketSymbol } from "../dsl/types.js";
import { InstrumentType } from "../dsl/types.js";

/**
 * Check if a symbol represents a cash/spot instrument
 */
export function isCash(symbol: MarketSymbol): boolean {
  return symbol.instrumentType === InstrumentType.CASH;
}

/**
 * Check if a symbol represents a derivative instrument
 */
export function isDerivative(symbol: MarketSymbol): boolean {
  return [
    InstrumentType.FUTURE,
    InstrumentType.OPTION,
    InstrumentType.SWAP,
    InstrumentType.FORWARD,
    InstrumentType.CFD,
    InstrumentType.WARRANT,
  ].includes(symbol.instrumentType);
}

/**
 * Check if a symbol represents a futures contract
 */
export function isFuture(symbol: MarketSymbol): boolean {
  return symbol.instrumentType === InstrumentType.FUTURE;
}

/**
 * Generate a unique market identifier
 * Format: exchange_id:symbol_ticker:instrument_type
 */
export function getMarketId(context: MarketContext): string {
  return `${context.exchange.id}:${context.symbol.ticker}:${context.symbol.instrumentType}`;
}
