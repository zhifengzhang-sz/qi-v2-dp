#!/usr/bin/env bun

/**
 * FP DSL Types - Core Data Structures
 *
 * FIX Protocol 4.4 compliant market data types.
 * These are the fundamental data structures used throughout the FP system.
 */

// =============================================================================
// MARKET DATA TYPES - FIX PROTOCOL 4.4 COMPLIANT
// =============================================================================

export interface Price {
  timestamp: Date; // FIX Tag 273 (MDEntryTime)
  price: number; // FIX Tag 270 (MDEntryPrice)
  size: number; // FIX Tag 271 (MDEntrySize)
}

export interface OHLCV {
  timestamp: Date; // Bar start time
  open: number; // First price in period
  high: number; // Highest price in period
  low: number; // Lowest price in period
  close: number; // Last price in period
  volume: number; // Total volume in period
}

export interface Level1 {
  timestamp: Date; // Quote observation time
  bidPrice: number; // FIX Tag 270 + MDEntryType=0
  bidSize: number; // FIX Tag 271 + MDEntryType=0
  askPrice: number; // FIX Tag 270 + MDEntryType=1
  askSize: number; // FIX Tag 271 + MDEntryType=1
}

// =============================================================================
// MARKET CONTEXT TYPES
// =============================================================================

export interface Exchange {
  id: string;
  name: string;
  region: string;
  type: "centralized" | "decentralized" | "aggregated";
}

export interface MarketSymbol {
  ticker: string;
  name: string;
  assetClass: "crypto" | "equity" | "bond" | "commodity" | "forex";
  currency: string;
}

export interface MarketContext {
  exchange: Exchange;
  symbol: MarketSymbol;
  timestamp: Date;
}
