-- ClickHouse Initialization Script
-- Creates the necessary tables for QiCore crypto analytics platform

-- Create database
CREATE DATABASE IF NOT EXISTS crypto_analytics;

-- Use the database
USE crypto_analytics;

-- Create cryptocurrency prices table (analytics-optimized)
CREATE TABLE IF NOT EXISTS crypto_prices_analytics (
    time DateTime64(3),
    coin_id String,
    symbol String,
    usd_price Decimal64(8),
    btc_price Nullable(Decimal64(8)),
    market_cap Nullable(UInt64),
    volume_24h Nullable(UInt64),
    change_24h Nullable(Decimal64(4)),
    last_updated UInt64
) 
ENGINE = MergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY (coin_id, time)
TTL time + INTERVAL 2 YEAR;

-- Create OHLCV analytics table
CREATE TABLE IF NOT EXISTS ohlcv_analytics (
    time DateTime64(3),
    coin_id String,
    symbol String,
    open Decimal64(8),
    high Decimal64(8),
    low Decimal64(8),
    close Decimal64(8),
    volume Nullable(Decimal64(8)),
    interval String
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY (coin_id, interval, time)
TTL time + INTERVAL 5 YEAR;

-- Create market analytics table
CREATE TABLE IF NOT EXISTS market_analytics (
    time DateTime64(3),
    total_market_cap UInt64,
    total_volume UInt64,
    btc_dominance Decimal64(4),
    eth_dominance Nullable(Decimal64(4)),
    active_cryptocurrencies UInt32
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY time
TTL time + INTERVAL 10 YEAR;

-- Create materialized views for common analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_price_summary
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(time)
ORDER BY (coin_id, time)
AS SELECT
    toDate(time) as time,
    coin_id,
    symbol,
    avg(usd_price) as avg_price,
    max(usd_price) as max_price,
    min(usd_price) as min_price,
    count() as price_updates
FROM crypto_prices_analytics
GROUP BY toDate(time), coin_id, symbol;

-- Create view for top cryptocurrencies by market cap
CREATE VIEW IF NOT EXISTS top_cryptos_by_market_cap AS
SELECT 
    coin_id,
    symbol,
    usd_price,
    market_cap,
    volume_24h,
    change_24h,
    time
FROM crypto_prices_analytics
WHERE time >= now() - INTERVAL 1 DAY
ORDER BY market_cap DESC
LIMIT 100;