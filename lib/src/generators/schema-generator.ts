#!/usr/bin/env bun

/**
 * Schema Generator - DSL to Database Schema
 * 
 * Generates database schemas from DSL types as single source of truth.
 * This ensures DSL changes automatically propagate to storage layer.
 */

import type {
  CryptoPriceData,
  CryptoOHLCVData, 
  CryptoMarketAnalytics,
  Level1Data
} from "../abstract/dsl/MarketDataTypes";
import { writeFileSync } from "fs";

/**
 * Generate TimescaleDB SQL schema from DSL types
 */
export function generateTimescaleSchema(): string {
  return `-- TimescaleDB Schema Generated from DSL Types
-- Source: lib/src/abstract/dsl/MarketDataTypes.ts
-- DO NOT EDIT MANUALLY - Regenerate when DSL changes

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- CryptoPriceData table (from DSL)
CREATE TABLE IF NOT EXISTS crypto_prices (
    time TIMESTAMPTZ NOT NULL,
    coin_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT,
    usd_price NUMERIC(20, 8),
    btc_price NUMERIC(20, 8),
    eth_price NUMERIC(20, 8),
    market_cap NUMERIC(30, 2),
    volume_24h NUMERIC(30, 2),
    change_24h NUMERIC(10, 4),
    change_7d NUMERIC(10, 4),
    last_updated TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL,
    attribution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (coin_id, time)
);

-- Convert to hypertable
SELECT create_hypertable('crypto_prices', 'time', if_not_exists => TRUE);

-- CryptoOHLCVData table (from DSL)
CREATE TABLE IF NOT EXISTS ohlcv_data (
    time TIMESTAMPTZ NOT NULL,
    coin_id TEXT NOT NULL,
    symbol TEXT,
    open NUMERIC(20, 8) NOT NULL,
    high NUMERIC(20, 8) NOT NULL,
    low NUMERIC(20, 8) NOT NULL,
    close NUMERIC(20, 8) NOT NULL,
    volume NUMERIC(30, 8) NOT NULL,
    timeframe TEXT NOT NULL,
    source TEXT NOT NULL,
    attribution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (coin_id, timeframe, time)
);

-- Convert to hypertable
SELECT create_hypertable('ohlcv_data', 'time', if_not_exists => TRUE);

-- CryptoMarketAnalytics table (from DSL)
CREATE TABLE IF NOT EXISTS market_analytics (
    time TIMESTAMPTZ NOT NULL PRIMARY KEY,
    total_market_cap NUMERIC(30, 2) NOT NULL,
    total_volume NUMERIC(30, 2) NOT NULL,
    btc_dominance NUMERIC(10, 4) NOT NULL,
    eth_dominance NUMERIC(10, 4),
    active_cryptocurrencies INTEGER NOT NULL,
    markets INTEGER NOT NULL,
    market_cap_change_24h NUMERIC(10, 4) NOT NULL,
    source TEXT NOT NULL,
    attribution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('market_analytics', 'time', if_not_exists => TRUE);

-- Level1Data table (from DSL)
CREATE TABLE IF NOT EXISTS level1_data (
    time TIMESTAMPTZ NOT NULL,
    ticker TEXT NOT NULL,
    best_bid NUMERIC(20, 8) NOT NULL,
    best_ask NUMERIC(20, 8) NOT NULL,
    spread NUMERIC(20, 8) NOT NULL,
    spread_percent NUMERIC(10, 4) NOT NULL,
    exchange TEXT,
    market TEXT NOT NULL,
    source TEXT NOT NULL,
    attribution TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ticker, market, time)
);

-- Convert to hypertable
SELECT create_hypertable('level1_data', 'time', if_not_exists => TRUE);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS crypto_prices_time_idx ON crypto_prices (time);
CREATE INDEX IF NOT EXISTS crypto_prices_symbol_time_idx ON crypto_prices (symbol, time);
CREATE INDEX IF NOT EXISTS ohlcv_time_idx ON ohlcv_data (time);
CREATE INDEX IF NOT EXISTS ohlcv_symbol_timeframe_time_idx ON ohlcv_data (symbol, timeframe, time);
CREATE INDEX IF NOT EXISTS market_analytics_time_idx ON market_analytics (time);
CREATE INDEX IF NOT EXISTS level1_ticker_market_time_idx ON level1_data (ticker, market, time);

COMMIT;
`;
}

/**
 * Generate type mappings for Layer 2 actors
 */
export interface DSLToStorageMapping {
  tableName: string;
  dslType: string;
  mapFunction: string;
}

export function generateStorageMappings(): DSLToStorageMapping[] {
  return [
    {
      tableName: "crypto_prices",
      dslType: "CryptoPriceData",
      mapFunction: `
function mapCryptoPriceToStorage(data: CryptoPriceData) {
  return {
    time: data.lastUpdated,
    coin_id: data.coinId,
    symbol: data.symbol,
    name: data.name,
    usd_price: data.usdPrice,
    btc_price: data.btcPrice,
    eth_price: data.ethPrice,
    market_cap: data.marketCap,
    volume_24h: data.volume24h,
    change_24h: data.change24h,
    change_7d: data.change7d,
    last_updated: data.lastUpdated,
    source: data.source,
    attribution: data.attribution
  };
}`
    },
    {
      tableName: "ohlcv_data", 
      dslType: "CryptoOHLCVData",
      mapFunction: `
function mapOHLCVToStorage(data: CryptoOHLCVData) {
  return {
    time: data.timestamp,
    coin_id: data.coinId,
    symbol: data.symbol,
    open: data.open,
    high: data.high,
    low: data.low,
    close: data.close,
    volume: data.volume,
    timeframe: data.timeframe,
    source: data.source,
    attribution: data.attribution
  };
}`
    },
    {
      tableName: "market_analytics",
      dslType: "CryptoMarketAnalytics", 
      mapFunction: `
function mapMarketAnalyticsToStorage(data: CryptoMarketAnalytics) {
  return {
    time: data.timestamp,
    total_market_cap: data.totalMarketCap,
    total_volume: data.totalVolume,
    btc_dominance: data.btcDominance,
    eth_dominance: data.ethDominance,
    active_cryptocurrencies: data.activeCryptocurrencies,
    markets: data.markets,
    market_cap_change_24h: data.marketCapChange24h,
    source: data.source,
    attribution: data.attribution
  };
}`
    },
    {
      tableName: "level1_data",
      dslType: "Level1Data",
      mapFunction: `
function mapLevel1ToStorage(data: Level1Data) {
  return {
    time: data.timestamp,
    ticker: data.ticker,
    best_bid: data.bestBid,
    best_ask: data.bestAsk,
    spread: data.spread,
    spread_percent: data.spreadPercent,
    exchange: data.exchange,
    market: data.market,
    source: data.source,
    attribution: data.attribution
  };
}`
    }
  ];
}

/**
 * Generate and write the TimescaleDB schema file
 */
export function generateSchemaFile(outputPath: string = "../../services/database/init-timescale-generated.sql"): void {
  const schema = generateTimescaleSchema();
  writeFileSync(outputPath, schema);
  console.log(`✅ Generated TimescaleDB schema at: ${outputPath}`);
}

/**
 * CLI entry point for schema generation
 */
if (import.meta.main) {
  const outputPath = process.argv[2] || "../../services/database/init-timescale-generated.sql";
  generateSchemaFile(outputPath);
}