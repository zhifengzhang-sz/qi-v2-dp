#!/usr/bin/env bun

/**
 * FP System Utilities - Constants and Helper Functions
 *
 * Common constants and utility functions for the FP system.
 */

import { MarketContext } from "./dsl/types";
import type { Exchange, MarketSymbol } from "./dsl/types";

// =============================================================================
// CONSTANTS
// =============================================================================

export const EXCHANGES = {
  COINBASE: {
    id: "coinbase",
    name: "Coinbase Pro",
    region: "US",
    type: "centralized" as const,
  },
  BINANCE: {
    id: "binance",
    name: "Binance",
    region: "Global",
    type: "centralized" as const,
  },
  COINGECKO: {
    id: "coingecko",
    name: "CoinGecko",
    region: "Global",
    type: "aggregated" as const,
  },
} as const;

export const SYMBOLS = {
  BTC: {
    ticker: "bitcoin",
    name: "Bitcoin",
    assetClass: "crypto" as const,
    currency: "USD",
  },
  ETH: {
    ticker: "ethereum",
    name: "Ethereum",
    assetClass: "crypto" as const,
    currency: "USD",
  },
} as const;

// =============================================================================
// UTILITIES
// =============================================================================

export function createMarketContext(
  exchange: Exchange,
  symbol: MarketSymbol,
  timestamp?: Date,
): MarketContext {
  return MarketContext.create(exchange, symbol);
}
