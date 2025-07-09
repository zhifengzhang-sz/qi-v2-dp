#!/usr/bin/env bun

/**
 * FP System - Complete Export
 *
 * Clean functional programming approach to market data processing.
 * Follows v-0.1.0 handler pattern with proper domain context structure.
 */

// =============================================================================
// CORE DSL
// =============================================================================
export * from "./dsl";

// =============================================================================
// UTILITIES AND CONSTANTS
// =============================================================================
export * from "./utils";

// =============================================================================
// FUNCTIONAL UTILITIES
// =============================================================================
export * from "./functional";

// =============================================================================
// CRYPTO MARKET ACTORS
// =============================================================================

// Base classes
export { BaseReader } from "./market/crypto/actors/abstract/BaseReader";
export { BaseMCPReader } from "./market/crypto/actors/abstract/BaseMCPReader";
export type { BaseMCPReaderConfig } from "./market/crypto/actors/abstract/BaseMCPReader";

// Concrete implementations
export {
  CoinGeckoMCPReader,
  createCoinGeckoMCPReader,
} from "./market/crypto/actors/sources/CoinGeckoMCPReader";
export type { CoinGeckoMCPConfig } from "./market/crypto/actors/sources/CoinGeckoMCPReader";

// =============================================================================
// BACKWARD COMPATIBILITY
// =============================================================================
export * from "./types";
