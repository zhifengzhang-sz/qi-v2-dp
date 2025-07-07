#!/usr/bin/env bun

/**
 * CoinGecko Market Data Readers - TRUE Actor & MCP Actor Implementations
 *
 * Provides both Actor patterns:
 * - Actor (composition): Can associate with MCP clients (≥0)
 * - MCP Actor (inheritance): IS an MCP client directly
 *
 * @author QiCore Contributors
 * @version 1.0.0
 */

// =============================================================================
// PRIMARY EXPORTS
// =============================================================================

// Actor Pattern (composition) - can associate with MCP clients
export {
  CoinGeckoMarketDataReader,
  createCoinGeckoMarketDataReader,
} from "./MarketDataReader";
export type { CoinGeckoActorConfig } from "./MarketDataReader";

// Export unified types from DSL abstraction
export type {
  CryptoPriceData,
  CryptoOHLCVData,
  CryptoMarketAnalytics,
  Level1Data,
  DateRangeOHLCVQuery,
  Level1Query,
  CurrentPricesOptions,
} from "../../abstract/dsl";

// Note: MCP integration is now handled directly in MarketDataReader
// The unified architecture eliminates the need for separate MCP classes

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Popular cryptocurrency coin IDs for quick reference
 */
export const POPULAR_COINS = {
  BITCOIN: "bitcoin",
  ETHEREUM: "ethereum",
  CARDANO: "cardano",
  POLKADOT: "polkadot",
  CHAINLINK: "chainlink",
  UNISWAP: "uniswap",
  LITECOIN: "litecoin",
  RIPPLE: "ripple",
  BITCOIN_CASH: "bitcoin-cash",
  BINANCE_COIN: "binancecoin",
} as const;

/**
 * Supported vs currencies
 */
export const VS_CURRENCIES = {
  USD: "usd",
  EUR: "eur",
  JPY: "jpy",
  BTC: "btc",
  ETH: "eth",
} as const;
