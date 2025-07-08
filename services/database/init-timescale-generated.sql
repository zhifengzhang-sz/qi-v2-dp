-- TimescaleDB Schema Generated from DSL Types
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
