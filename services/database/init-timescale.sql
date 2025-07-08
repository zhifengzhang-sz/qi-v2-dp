-- TimescaleDB Initialization Script
-- Creates the necessary tables and hypertables for QiCore crypto data platform

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- =============================================================================
-- REFERENCE DATA TABLES
-- =============================================================================

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_fiat BOOLEAN NOT NULL DEFAULT false,
    decimals INTEGER NOT NULL DEFAULT 8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    api_url TEXT,
    websocket_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create trading pairs table
CREATE TABLE IF NOT EXISTS trading_pairs (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    base_asset VARCHAR(10) NOT NULL,
    quote_asset VARCHAR(10) NOT NULL,
    base_currency_id INTEGER REFERENCES currencies(id),
    quote_currency_id INTEGER REFERENCES currencies(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    min_trade_size NUMERIC(20, 8),
    max_trade_size NUMERIC(20, 8),
    price_tick_size NUMERIC(20, 8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TIME-SERIES DATA TABLES
-- =============================================================================

-- Create cryptocurrency prices table (aligned with Drizzle schema)
CREATE TABLE IF NOT EXISTS crypto_prices (
    time TIMESTAMPTZ NOT NULL,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    exchange_id INTEGER,
    usd_price NUMERIC(20, 8),
    btc_price NUMERIC(20, 8),
    eth_price NUMERIC(20, 8),
    market_cap NUMERIC(30, 2),
    volume_24h NUMERIC(30, 2),
    change_24h NUMERIC(10, 4),
    change_7d NUMERIC(10, 4),
    last_updated TIMESTAMPTZ,
    source VARCHAR(50) DEFAULT 'coingecko',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (coin_id, time)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('crypto_prices', 'time', if_not_exists => TRUE);

-- Create OHLCV data table (aligned with Drizzle schema)
CREATE TABLE IF NOT EXISTS ohlcv_data (
    time TIMESTAMPTZ NOT NULL,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    exchange_id INTEGER,
    timeframe VARCHAR(10) NOT NULL,
    open NUMERIC(20, 8) NOT NULL,
    high NUMERIC(20, 8) NOT NULL,
    low NUMERIC(20, 8) NOT NULL,
    close NUMERIC(20, 8) NOT NULL,
    volume NUMERIC(30, 8) NOT NULL,
    trades INTEGER DEFAULT 0,
    vwap NUMERIC(20, 8),
    source VARCHAR(50) DEFAULT 'coingecko',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (coin_id, timeframe, time)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('ohlcv_data', 'time', if_not_exists => TRUE);

-- Create market analytics table (aligned with Drizzle schema)
CREATE TABLE IF NOT EXISTS market_analytics (
    time TIMESTAMPTZ NOT NULL PRIMARY KEY,
    total_market_cap NUMERIC(30, 2),
    total_volume NUMERIC(30, 2),
    btc_dominance NUMERIC(10, 4),
    eth_dominance NUMERIC(10, 4),
    defi_market_cap NUMERIC(30, 2),
    nft_volume NUMERIC(30, 2),
    active_cryptocurrencies INTEGER,
    active_exchanges INTEGER,
    fear_greed_index INTEGER,
    source VARCHAR(50) DEFAULT 'coingecko',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('market_analytics', 'time', if_not_exists => TRUE);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL,
    time TIMESTAMPTZ NOT NULL,
    coin_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    exchange_id INTEGER REFERENCES exchanges(id),
    price NUMERIC(20, 8) NOT NULL,
    quantity NUMERIC(20, 8) NOT NULL,
    side TEXT NOT NULL,
    trade_id TEXT,
    order_id TEXT,
    source TEXT DEFAULT 'coingecko',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (time, id)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('trades', 'time', if_not_exists => TRUE);

-- Create indexes for better query performance (aligned with Drizzle schema)
-- Reference data indexes
CREATE INDEX IF NOT EXISTS currencies_code_idx ON currencies (code);
CREATE INDEX IF NOT EXISTS currencies_active_idx ON currencies (is_active);
CREATE INDEX IF NOT EXISTS exchanges_name_idx ON exchanges (name);
CREATE INDEX IF NOT EXISTS exchanges_active_idx ON exchanges (is_active);
CREATE INDEX IF NOT EXISTS trading_pairs_symbol_idx ON trading_pairs (symbol);
CREATE INDEX IF NOT EXISTS trading_pairs_active_idx ON trading_pairs (is_active);
CREATE INDEX IF NOT EXISTS trading_pairs_base_quote_idx ON trading_pairs (base_asset, quote_asset);

-- Time-series data indexes
CREATE INDEX IF NOT EXISTS crypto_prices_time_idx ON crypto_prices (time);
CREATE INDEX IF NOT EXISTS crypto_prices_symbol_time_idx ON crypto_prices (symbol, time);
CREATE INDEX IF NOT EXISTS crypto_prices_coin_time_idx ON crypto_prices (coin_id, time);
CREATE INDEX IF NOT EXISTS ohlcv_time_idx ON ohlcv_data (time);
CREATE INDEX IF NOT EXISTS ohlcv_symbol_timeframe_time_idx ON ohlcv_data (symbol, timeframe, time);
CREATE INDEX IF NOT EXISTS market_analytics_time_idx ON market_analytics (time);
CREATE INDEX IF NOT EXISTS trades_time_idx ON trades (time);
CREATE INDEX IF NOT EXISTS trades_symbol_time_idx ON trades (symbol, time);
CREATE INDEX IF NOT EXISTS trades_trade_id_idx ON trades (trade_id);

-- Add compression policy (optional, for production)
-- SELECT add_compression_policy('crypto_prices', INTERVAL '7 days');
-- SELECT add_compression_policy('ohlcv_data', INTERVAL '7 days');
-- SELECT add_compression_policy('market_analytics', INTERVAL '30 days');

COMMIT;