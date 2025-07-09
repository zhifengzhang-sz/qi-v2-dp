#!/usr/bin/env bun

/**
 * FP System Functional Utilities
 *
 * Implements partial application pattern for context binding.
 * Enables zero-overhead repeated calls with pre-bound contexts.
 * Based on mathematical foundations of functional programming.
 */

import type { ResultType as Result } from "@qi/core/base";
import type {
  Exchange,
  FPMarketDataReader,
  FPMarketDataWriter,
  Level1,
  MarketContext,
  MarketSymbol,
  OHLCV,
  Price,
} from "@qi/fp/dsl";

// =============================================================================
// PARTIAL APPLICATION TYPES
// =============================================================================

/**
 * Context completeness checker
 */
type IsContextComplete<T extends Partial<MarketContext>> = T extends MarketContext ? true : false;

/**
 * Calculate missing context fields
 */
type MissingContextArgs<T extends Partial<MarketContext>> = T extends { exchange: any }
  ? T extends { symbol: any }
    ? [] // Both present
    : [symbol: MarketSymbol] // Missing symbol
  : T extends { symbol: any }
    ? [exchange: Exchange] // Missing exchange
    : [exchange: Exchange, symbol: MarketSymbol]; // Missing both

/**
 * Bound reader type based on context completeness
 */
export type BoundReader<TContext extends Partial<MarketContext>> = {
  getPrice: IsContextComplete<TContext> extends true
    ? () => Promise<Result<Price>>
    : (...missing: MissingContextArgs<TContext>) => Promise<Result<Price>>;

  getOHLCV: IsContextComplete<TContext> extends true
    ? (timeframe: string) => Promise<Result<OHLCV>>
    : (timeframe: string, ...missing: MissingContextArgs<TContext>) => Promise<Result<OHLCV>>;

  getLevel1: IsContextComplete<TContext> extends true
    ? () => Promise<Result<Level1>>
    : (...missing: MissingContextArgs<TContext>) => Promise<Result<Level1>>;
};

/**
 * Bound writer type based on context completeness
 */
export type BoundWriter<TContext extends Partial<MarketContext>> = {
  writePrice: IsContextComplete<TContext> extends true
    ? (data: Price) => Promise<Result<void>>
    : (data: Price, ...missing: MissingContextArgs<TContext>) => Promise<Result<void>>;

  writeOHLCV: IsContextComplete<TContext> extends true
    ? (data: OHLCV) => Promise<Result<void>>
    : (data: OHLCV, ...missing: MissingContextArgs<TContext>) => Promise<Result<void>>;

  writeLevel1: IsContextComplete<TContext> extends true
    ? (data: Level1) => Promise<Result<void>>
    : (data: Level1, ...missing: MissingContextArgs<TContext>) => Promise<Result<void>>;
};

// =============================================================================
// CORE PARTIAL APPLICATION FUNCTIONS
// =============================================================================

/**
 * Complete partial context with missing fields and dynamic timestamp
 */
function completeContext(
  partial: Partial<MarketContext>,
  exchange?: Exchange,
  symbol?: MarketSymbol,
): MarketContext {
  return {
    exchange: partial.exchange || (exchange as Exchange),
    symbol: partial.symbol || (symbol as MarketSymbol),
    timestamp: new Date(), // Always use current timestamp
  };
}

/**
 * Bind context to a FPMarketDataReader
 */
export function bindContext<TContext extends Partial<MarketContext>>(
  reader: FPMarketDataReader,
  context: TContext,
): BoundReader<TContext> {
  const createBoundGetPrice = () => {
    if (context.exchange && context.symbol) {
      return () => reader.getPrice(completeContext(context));
    }
    if (context.exchange) {
      return (symbol: MarketSymbol) => reader.getPrice(completeContext(context, undefined, symbol));
    }
    if (context.symbol) {
      return (exchange: Exchange) => reader.getPrice(completeContext(context, exchange));
    }
    return (exchange: Exchange, symbol: MarketSymbol) =>
      reader.getPrice(completeContext(context, exchange, symbol));
  };

  const createBoundGetOHLCV = () => {
    if (context.exchange && context.symbol) {
      return (timeframe: string) => reader.getOHLCV(completeContext(context), timeframe);
    }
    if (context.exchange) {
      return (timeframe: string, symbol: MarketSymbol) =>
        reader.getOHLCV(completeContext(context, undefined, symbol), timeframe);
    }
    if (context.symbol) {
      return (timeframe: string, exchange: Exchange) =>
        reader.getOHLCV(completeContext(context, exchange), timeframe);
    }
    return (timeframe: string, exchange: Exchange, symbol: MarketSymbol) =>
      reader.getOHLCV(completeContext(context, exchange, symbol), timeframe);
  };

  const createBoundGetLevel1 = () => {
    if (context.exchange && context.symbol) {
      return () => reader.getLevel1(completeContext(context));
    }
    if (context.exchange) {
      return (symbol: MarketSymbol) => reader.getLevel1(completeContext(context, undefined, symbol));
    }
    if (context.symbol) {
      return (exchange: Exchange) => reader.getLevel1(completeContext(context, exchange));
    }
    return (exchange: Exchange, symbol: MarketSymbol) =>
      reader.getLevel1(completeContext(context, exchange, symbol));
  };

  return {
    getPrice: createBoundGetPrice(),
    getOHLCV: createBoundGetOHLCV(),
    getLevel1: createBoundGetLevel1(),
  } as BoundReader<TContext>;
}

// =============================================================================
// FACTORY FUNCTIONS FOR COMMON PATTERNS
// =============================================================================

/**
 * Create a pure reader (full context pre-bound)
 */
export function createPureReader(
  reader: FPMarketDataReader,
  exchange: Exchange,
  symbol: MarketSymbol,
): BoundReader<MarketContext> {
  return bindContext(reader, { exchange, symbol });
}

/**
 * Create a symbol reader (exchange pre-bound, symbol varies)
 */
export function createSymbolReader(
  reader: FPMarketDataReader,
  exchange: Exchange,
): BoundReader<{ exchange: Exchange }> {
  return bindContext(reader, { exchange });
}

// =============================================================================
// COMPOSITION UTILITIES
// =============================================================================

/**
 * Parallel execution of bound readers
 */
export async function parallel<T>(
  boundFunctions: (() => Promise<Result<T>>)[],
): Promise<Result<T>[]> {
  return Promise.all(boundFunctions.map((fn) => fn()));
}
