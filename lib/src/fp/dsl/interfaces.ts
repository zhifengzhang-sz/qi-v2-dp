#!/usr/bin/env bun

/**
 * FP DSL Interfaces - Core Contracts
 *
 * These are the fundamental contracts that all actors must implement.
 * Defines the canonical interfaces for market data operations.
 */

import type { ResultType as Result } from "@qi/core/base";
import type { Level1, MarketContext, OHLCV, Price } from "./types";

// =============================================================================
// CORE DSL INTERFACES - CANONICAL CONTRACTS
// =============================================================================

/**
 * FP Market Data Reader - Core DSL Contract
 *
 * All reader implementations must implement this interface.
 * All methods take full MarketContext for maximum flexibility.
 */
export interface FPMarketDataReader {
  getPrice(context: MarketContext): Promise<Result<Price>>;
  getOHLCV(context: MarketContext, timeframe: string): Promise<Result<OHLCV>>;
  getLevel1(context: MarketContext): Promise<Result<Level1>>;
}

/**
 * FP Market Data Writer - Core DSL Contract
 *
 * All writer implementations must implement this interface.
 * All methods take full MarketContext for maximum flexibility.
 */
export interface FPMarketDataWriter {
  writePrice(context: MarketContext, data: Price): Promise<Result<void>>;
  writeOHLCV(context: MarketContext, data: OHLCV): Promise<Result<void>>;
  writeLevel1(context: MarketContext, data: Level1): Promise<Result<void>>;
}

// =============================================================================
// LIFECYCLE INTERFACES
// =============================================================================

/**
 * Actor Lifecycle Interface
 *
 * All actors must implement initialization and cleanup.
 */
export interface FPActorLifecycle {
  initialize(): Promise<Result<void>>;
  cleanup(): Promise<Result<void>>;
  getStatus(): object;
}
