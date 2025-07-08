# Database Table Schema Design Tutorial

## Overview

This tutorial covers how to design, implement, and manage database table schemas for the QiCore cryptocurrency data platform using TimescaleDB (PostgreSQL with time-series extensions).

## Schema Design Principles

### 1. Exchange-Aware Table Design

All tables include `exchange_id` as a required field to support multi-exchange data processing and partitioning:

```sql
-- Base pattern for all tables
CREATE TABLE example_table (
    id BIGSERIAL PRIMARY KEY,
    exchange_id VARCHAR(50) NOT NULL,
    time TIMESTAMPTZ NOT NULL,
    -- table-specific fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. TimescaleDB Hypertable Strategy

Convert regular tables to hypertables for time-series optimization:

```sql
-- Create hypertable with time partitioning
SELECT create_hypertable('crypto_prices', 'time');

-- Add space partitioning by exchange_id
SELECT add_dimension('crypto_prices', 'exchange_id', number_partitions => 4);
```

## Core Table Schemas

### 1. Crypto Prices Table

```sql
-- lib/src/base/database/schemas/crypto_prices.sql
CREATE TABLE crypto_prices (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    coin_id VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    exchange_id VARCHAR(50) NOT NULL,
    
    -- Price Data
    usd_price DECIMAL(20, 8) NOT NULL,
    btc_price DECIMAL(20, 8),
    eth_price DECIMAL(20, 8),
    
    -- Market Data
    market_cap DECIMAL(30, 2),
    volume_24h DECIMAL(30, 2),
    change_24h DECIMAL(10, 4),
    change_7d DECIMAL(10, 4),
    
    -- Timing
    time TIMESTAMPTZ NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    source VARCHAR(100) NOT NULL,
    attribution TEXT NOT NULL,
    
    -- Housekeeping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable('crypto_prices', 'time');
SELECT add_dimension('crypto_prices', 'exchange_id', number_partitions => 4);

-- Indexes for performance
CREATE INDEX idx_crypto_prices_coin_exchange_time 
    ON crypto_prices (coin_id, exchange_id, time DESC);
CREATE INDEX idx_crypto_prices_symbol_time 
    ON crypto_prices (symbol, time DESC);
CREATE INDEX idx_crypto_prices_exchange_time 
    ON crypto_prices (exchange_id, time DESC);

-- Compression policy (compress data older than 7 days)
ALTER TABLE crypto_prices SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'exchange_id, coin_id'
);

SELECT add_compression_policy('crypto_prices', INTERVAL '7 days');
```

**Drizzle Schema Definition:**
```typescript
// lib/src/base/database/schema.ts
import { pgTable, bigserial, varchar, decimal, timestamp, text, index } from 'drizzle-orm/pg-core';

export const cryptoPrices = pgTable('crypto_prices', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  
  // Identifiers
  coinId: varchar('coin_id', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  exchangeId: varchar('exchange_id', { length: 50 }).notNull(),
  
  // Price Data
  usdPrice: decimal('usd_price', { precision: 20, scale: 8 }).notNull(),
  btcPrice: decimal('btc_price', { precision: 20, scale: 8 }),
  ethPrice: decimal('eth_price', { precision: 20, scale: 8 }),
  
  // Market Data
  marketCap: decimal('market_cap', { precision: 30, scale: 2 }),
  volume24h: decimal('volume_24h', { precision: 30, scale: 2 }),
  change24h: decimal('change_24h', { precision: 10, scale: 4 }),
  change7d: decimal('change_7d', { precision: 10, scale: 4 }),
  
  // Timing
  time: timestamp('time', { withTimezone: true }).notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
  
  // Metadata
  source: varchar('source', { length: 100 }).notNull(),
  attribution: text('attribution').notNull(),
  
  // Housekeeping
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  coinExchangeTimeIdx: index('idx_crypto_prices_coin_exchange_time')
    .on(table.coinId, table.exchangeId, table.time),
  symbolTimeIdx: index('idx_crypto_prices_symbol_time')
    .on(table.symbol, table.time),
  exchangeTimeIdx: index('idx_crypto_prices_exchange_time')
    .on(table.exchangeId, table.time),
}));
```

### 2. OHLCV Data Table

```sql
-- lib/src/base/database/schemas/ohlcv_data.sql
CREATE TABLE ohlcv_data (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    coin_id VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    exchange_id VARCHAR(50) NOT NULL,
    
    -- OHLCV Data
    time TIMESTAMPTZ NOT NULL,
    open_price DECIMAL(20, 8) NOT NULL,
    high_price DECIMAL(20, 8) NOT NULL,
    low_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(30, 8) NOT NULL,
    
    -- Metadata
    timeframe VARCHAR(10) NOT NULL, -- '1m', '5m', '1h', '1d', etc.
    source VARCHAR(100) NOT NULL,
    attribution TEXT NOT NULL,
    
    -- Housekeeping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ohlcv_data_prices_check 
        CHECK (high_price >= low_price AND 
               open_price >= low_price AND open_price <= high_price AND
               close_price >= low_price AND close_price <= high_price),
    CONSTRAINT ohlcv_data_volume_check 
        CHECK (volume >= 0),
    UNIQUE (coin_id, exchange_id, time, timeframe)
);

-- Convert to hypertable
SELECT create_hypertable('ohlcv_data', 'time');
SELECT add_dimension('ohlcv_data', 'exchange_id', number_partitions => 4);

-- Indexes
CREATE INDEX idx_ohlcv_coin_timeframe_time 
    ON ohlcv_data (coin_id, timeframe, time DESC);
CREATE INDEX idx_ohlcv_exchange_timeframe_time 
    ON ohlcv_data (exchange_id, timeframe, time DESC);

-- Compression
ALTER TABLE ohlcv_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'exchange_id, coin_id, timeframe'
);

SELECT add_compression_policy('ohlcv_data', INTERVAL '30 days');

-- Retention policy (keep data for 2 years)
SELECT add_retention_policy('ohlcv_data', INTERVAL '2 years');
```

### 3. Market Analytics Table

```sql
-- lib/src/base/database/schemas/market_analytics.sql
CREATE TABLE market_analytics (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    exchange_id VARCHAR(50) NOT NULL, -- 'global', 'binance', etc.
    
    -- Timing
    time TIMESTAMPTZ NOT NULL,
    
    -- Market Metrics
    total_market_cap DECIMAL(40, 2) NOT NULL,
    total_volume DECIMAL(40, 2) NOT NULL,
    btc_dominance DECIMAL(8, 4) NOT NULL,
    eth_dominance DECIMAL(8, 4),
    
    -- Market Statistics
    active_cryptocurrencies INTEGER NOT NULL,
    markets INTEGER NOT NULL,
    market_cap_change_24h DECIMAL(10, 4),
    
    -- Metadata
    source VARCHAR(100) NOT NULL,
    attribution TEXT NOT NULL,
    
    -- Housekeeping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT market_analytics_dominance_check 
        CHECK (btc_dominance >= 0 AND btc_dominance <= 100),
    CONSTRAINT market_analytics_counts_check 
        CHECK (active_cryptocurrencies > 0 AND markets > 0),
    UNIQUE (exchange_id, time)
);

-- Convert to hypertable
SELECT create_hypertable('market_analytics', 'time');

-- Indexes
CREATE INDEX idx_market_analytics_exchange_time 
    ON market_analytics (exchange_id, time DESC);

-- Compression
ALTER TABLE market_analytics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'exchange_id'
);

SELECT add_compression_policy('market_analytics', INTERVAL '14 days');
```

### 4. Level 1 Order Book Data

```sql
-- lib/src/base/database/schemas/level1_data.sql
CREATE TABLE level1_data (
    id BIGSERIAL PRIMARY KEY,
    
    -- Identifiers
    ticker VARCHAR(50) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    market VARCHAR(50) NOT NULL,
    
    -- L1 Data
    time TIMESTAMPTZ NOT NULL,
    best_bid DECIMAL(20, 8) NOT NULL,
    best_ask DECIMAL(20, 8) NOT NULL,
    spread DECIMAL(20, 8) NOT NULL,
    spread_percent DECIMAL(8, 4) NOT NULL,
    
    -- Metadata
    source VARCHAR(100) NOT NULL,
    attribution TEXT NOT NULL,
    
    -- Housekeeping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT level1_data_spread_check 
        CHECK (best_ask > best_bid AND spread = (best_ask - best_bid)),
    CONSTRAINT level1_data_spread_percent_check 
        CHECK (spread_percent >= 0)
);

-- Convert to hypertable
SELECT create_hypertable('level1_data', 'time');
SELECT add_dimension('level1_data', 'exchange', number_partitions => 4);

-- Indexes
CREATE INDEX idx_level1_ticker_exchange_time 
    ON level1_data (ticker, exchange, time DESC);

-- Short retention (L1 data is high-frequency, short-lived)
SELECT add_retention_policy('level1_data', INTERVAL '7 days');
```

## Schema Migration and Evolution

### 1. Migration Scripts

```sql
-- migrations/001_initial_schema.sql
BEGIN;

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create all tables
\i crypto_prices.sql
\i ohlcv_data.sql
\i market_analytics.sql
\i level1_data.sql

-- Create version tracking
CREATE TABLE IF NOT EXISTS schema_versions (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_versions (version, description) 
VALUES ('1.0.0', 'Initial schema with crypto_prices, ohlcv_data, market_analytics, level1_data');

COMMIT;
```

```sql
-- migrations/002_add_exchange_metadata.sql
BEGIN;

-- Add exchange metadata table
CREATE TABLE exchanges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    api_url VARCHAR(500),
    websocket_url VARCHAR(500),
    trading_fees DECIMAL(6, 4),
    withdrawal_fees JSONB,
    supported_pairs TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE crypto_prices 
    ADD CONSTRAINT fk_crypto_prices_exchange 
    FOREIGN KEY (exchange_id) REFERENCES exchanges(id);

ALTER TABLE ohlcv_data 
    ADD CONSTRAINT fk_ohlcv_data_exchange 
    FOREIGN KEY (exchange_id) REFERENCES exchanges(id);

-- Insert known exchanges
INSERT INTO exchanges (id, name, api_url) VALUES
    ('binance', 'Binance', 'https://api.binance.com'),
    ('coinbase', 'Coinbase Pro', 'https://api.pro.coinbase.com'),
    ('kraken', 'Kraken', 'https://api.kraken.com'),
    ('bitstamp', 'Bitstamp', 'https://www.bitstamp.net/api');

INSERT INTO schema_versions (version, description) 
VALUES ('1.1.0', 'Added exchanges metadata table and foreign key constraints');

COMMIT;
```

### 2. Drizzle Migration System

```typescript
// lib/src/base/database/migrations/drizzle-migrations.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

export async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL!;
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log('Running database migrations...');
  await migrate(db, { migrationsFolder: './lib/src/base/database/migrations' });
  console.log('Migrations completed successfully!');

  await sql.end();
}

// Migration file: 0001_initial_schema.sql
// This will be auto-generated by drizzle-kit
```

## Performance Optimization

### 1. Partitioning Strategy

```sql
-- Create partitioned table for high-volume data
CREATE TABLE crypto_prices_partitioned (
    LIKE crypto_prices INCLUDING ALL
) PARTITION BY RANGE (time);

-- Create monthly partitions
CREATE TABLE crypto_prices_y2024m01 
    PARTITION OF crypto_prices_partitioned 
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE crypto_prices_y2024m02 
    PARTITION OF crypto_prices_partitioned 
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Auto-create partitions
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_y' || to_char(start_date, 'YYYY') || 'm' || to_char(start_date, 'MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
        partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### 2. Continuous Aggregates

```sql
-- Create continuous aggregates for common queries
CREATE MATERIALIZED VIEW hourly_price_averages
WITH (timescaledb.continuous) AS
SELECT 
    coin_id,
    exchange_id,
    time_bucket('1 hour', time) AS bucket,
    AVG(usd_price) AS avg_price,
    MAX(usd_price) AS max_price,
    MIN(usd_price) AS min_price,
    COUNT(*) AS sample_count
FROM crypto_prices
GROUP BY coin_id, exchange_id, bucket;

-- Refresh policy
SELECT add_continuous_aggregate_policy('hourly_price_averages',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Daily OHLCV aggregation
CREATE MATERIALIZED VIEW daily_ohlcv_summary
WITH (timescaledb.continuous) AS
SELECT 
    coin_id,
    exchange_id,
    time_bucket('1 day', time) AS bucket,
    first(open_price, time) AS open_price,
    MAX(high_price) AS high_price,
    MIN(low_price) AS low_price,
    last(close_price, time) AS close_price,
    SUM(volume) AS total_volume
FROM ohlcv_data
WHERE timeframe = '1h'
GROUP BY coin_id, exchange_id, bucket;
```

### 3. Query Optimization

```typescript
// lib/src/base/database/queries/optimized-queries.ts
export class OptimizedQueries {
  // Use prepared statements for frequent queries
  static readonly GET_LATEST_PRICES = `
    SELECT DISTINCT ON (coin_id, exchange_id) 
           coin_id, symbol, name, exchange_id, usd_price, time
    FROM crypto_prices 
    WHERE coin_id = ANY($1) 
      AND time >= NOW() - INTERVAL '1 hour'
    ORDER BY coin_id, exchange_id, time DESC;
  `;

  // Use time-bucket for aggregations
  static readonly GET_PRICE_HISTORY = `
    SELECT 
      time_bucket('5 minutes', time) AS bucket,
      coin_id,
      exchange_id,
      AVG(usd_price) AS avg_price,
      MAX(usd_price) AS max_price,
      MIN(usd_price) AS min_price
    FROM crypto_prices 
    WHERE coin_id = $1 
      AND exchange_id = $2 
      AND time >= $3 
      AND time <= $4
    GROUP BY bucket, coin_id, exchange_id
    ORDER BY bucket;
  `;

  // Use indexes effectively
  static readonly GET_TOP_PERFORMERS = `
    SELECT DISTINCT ON (coin_id)
           coin_id, symbol, name, usd_price, change_24h
    FROM crypto_prices 
    WHERE time >= NOW() - INTERVAL '1 hour'
      AND change_24h IS NOT NULL
    ORDER BY coin_id, time DESC, change_24h DESC
    LIMIT $1;
  `;
}
```

## Data Integrity and Validation

### 1. Database Constraints

```sql
-- Add comprehensive constraints
ALTER TABLE crypto_prices ADD CONSTRAINT crypto_prices_price_positive 
    CHECK (usd_price > 0);

ALTER TABLE crypto_prices ADD CONSTRAINT crypto_prices_time_reasonable 
    CHECK (time >= '2009-01-03'::date AND time <= NOW() + INTERVAL '1 hour');

ALTER TABLE ohlcv_data ADD CONSTRAINT ohlcv_data_timeframe_valid 
    CHECK (timeframe IN ('1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'));

-- Add triggers for data validation
CREATE OR REPLACE FUNCTION validate_crypto_price_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate price is not too far from recent prices (basic sanity check)
    IF EXISTS (
        SELECT 1 FROM crypto_prices 
        WHERE coin_id = NEW.coin_id 
          AND exchange_id = NEW.exchange_id 
          AND time >= NEW.time - INTERVAL '1 hour'
          AND ABS(usd_price - NEW.usd_price) / usd_price > 0.5  -- 50% change threshold
    ) THEN
        RAISE WARNING 'Large price change detected for % on %: %', 
            NEW.coin_id, NEW.exchange_id, NEW.usd_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crypto_price_validation_trigger
    BEFORE INSERT OR UPDATE ON crypto_prices
    FOR EACH ROW EXECUTE FUNCTION validate_crypto_price_insert();
```

### 2. Application-Level Validation

```typescript
// lib/src/base/database/validation/price-validator.ts
export class PriceDataValidator {
  static validatePriceData(data: CryptoPriceData): ValidationResult {
    const errors: string[] = [];

    // Price validation
    if (data.usdPrice <= 0) {
      errors.push('USD price must be positive');
    }

    if (data.usdPrice > 10000000) { // $10M per coin seems unreasonable
      errors.push('USD price seems unreasonably high');
    }

    // Market cap validation
    if (data.marketCap && data.marketCap < 0) {
      errors.push('Market cap cannot be negative');
    }

    // Volume validation
    if (data.volume24h && data.volume24h < 0) {
      errors.push('24h volume cannot be negative');
    }

    // Change validation
    if (data.change24h && Math.abs(data.change24h) > 200) {
      errors.push('24h change over 200% seems suspicious');
    }

    // Timestamp validation
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    if (data.lastUpdated > now || data.lastUpdated < oneHourAgo) {
      errors.push('Last updated timestamp should be within the last hour');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

## Schema Generation from DSL

### 1. Automatic Schema Generation

```typescript
// lib/scripts/generate-db-schema.ts
import { generateDrizzleSchema } from './schema-generator';

async function generateDatabaseSchemas(): Promise<void> {
  const schemas = [
    {
      dslType: 'CryptoPriceData',
      tableName: 'crypto_prices',
      hypertable: true,
      partitionBy: ['exchange_id'],
      compression: { after: '7 days', segmentBy: ['exchange_id', 'coin_id'] }
    },
    {
      dslType: 'CryptoOHLCVData',
      tableName: 'ohlcv_data',
      hypertable: true,
      partitionBy: ['exchange_id'],
      compression: { after: '30 days', segmentBy: ['exchange_id', 'coin_id', 'timeframe'] }
    },
    {
      dslType: 'CryptoMarketAnalytics',
      tableName: 'market_analytics',
      hypertable: true,
      compression: { after: '14 days', segmentBy: ['exchange_id'] }
    }
  ];

  for (const schema of schemas) {
    console.log(`Generating schema for ${schema.tableName}...`);
    await generateDrizzleSchema(schema);
    await generateSQLSchema(schema);
  }

  console.log('All database schemas generated successfully!');
}
```

## Monitoring and Maintenance

### 1. Database Health Monitoring

```sql
-- Monitor hypertable statistics
SELECT 
    schemaname,
    tablename,
    compression_status,
    before_compression_total_bytes,
    after_compression_total_bytes,
    (before_compression_total_bytes - after_compression_total_bytes) * 100.0 / before_compression_total_bytes AS compression_ratio
FROM timescaledb_information.compressed_chunk_stats;

-- Monitor chunk statistics
SELECT 
    chunk_name,
    range_start,
    range_end,
    is_compressed,
    chunk_size,
    compressed_chunk_size
FROM timescaledb_information.chunks 
WHERE hypertable_name = 'crypto_prices'
ORDER BY range_start DESC;

-- Monitor query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%crypto_prices%'
ORDER BY total_time DESC;
```

### 2. Automated Maintenance

```sql
-- Create maintenance procedures
CREATE OR REPLACE FUNCTION maintain_hypertables()
RETURNS void AS $$
BEGIN
    -- Compress old chunks
    PERFORM compress_chunk(i) 
    FROM show_chunks('crypto_prices', older_than => INTERVAL '7 days') i;
    
    -- Update table statistics
    ANALYZE crypto_prices;
    ANALYZE ohlcv_data;
    ANALYZE market_analytics;
    
    -- Log maintenance
    INSERT INTO maintenance_log (operation, completed_at) 
    VALUES ('hypertable_maintenance', NOW());
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (requires pg_cron extension)
SELECT cron.schedule('hypertable-maintenance', '0 2 * * *', 'SELECT maintain_hypertables();');
```

This comprehensive guide provides the foundation for robust database schema design in the QiCore platform.