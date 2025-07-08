#!/usr/bin/env bun

/**
 * DSL Interface Abstractions - Unified Export
 *
 * This module exports all DSL interface abstractions for market data operations.
 * Provides unified factories and types for both reading and writing operations.
 */

// Independent Data Types (no dependencies)
export * from "./MarketDataTypes";

// Reading DSL
export * from "./MarketDataReadingDSL";

// Writing DSL
export * from "./MarketDataWritingDSL";

// Unified exports for convenience
export type { MarketDataReadingDSL } from "./MarketDataReadingDSL";

export type { MarketDataWritingDSL } from "./MarketDataWritingDSL";
