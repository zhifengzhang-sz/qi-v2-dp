# Official PostgreSQL MCP Server for TimescaleDB

## Overview

This document covers the **Official PostgreSQL MCP Server** for TimescaleDB integration in the QiCore crypto data platform.

**Important**: TimescaleDB is PostgreSQL-based, so we use the **Official PostgreSQL MCP Server** built by the MCP team, not a custom TimescaleDB server.

## Recommended Architecture

```mermaid
graph LR
    AI[AI Agent] --> MC[MCP Client]
    MC --> PMS[Official PostgreSQL MCP Server]
    PMS --> TS[TimescaleDB Instance]
```

```
AI Agent → MCP Client → Official PostgreSQL MCP Server → TimescaleDB
```

**Why Official PostgreSQL MCP Server:**
- ✅ **Official Implementation** - Built by Model Context Protocol team
- ✅ **TimescaleDB Compatible** - Works with any PostgreSQL-compatible database
- ✅ **Production Ready** - Battle-tested with enterprise PostgreSQL deployments
- ✅ **Complete SQL Support** - Full PostgreSQL feature set including TimescaleDB extensions
- ✅ **Zero Custom Code** - No need to build/maintain custom TimescaleDB MCP server

## Official PostgreSQL MCP Server Setup

### Why PostgreSQL MCP Server for TimescaleDB
TimescaleDB is built on PostgreSQL, so the **Official PostgreSQL MCP Server** provides complete compatibility with all TimescaleDB features.

#### Installation
```bash
# Install Official PostgreSQL MCP Server
npm install @modelcontextprotocol/server-postgres

# Or use via npx in production
npx @modelcontextprotocol/server-postgres

# Or use Claude CLI to add it
claude mcp add postgres -s user -- npx @modelcontextprotocol/server-postgres postgresql://localhost:5432/crypto_data
```

#### Configuration
```typescript
// src/mcp-servers/timescale-mcp-config.ts
export const officialPostgresMCPConfig = {
  server: '@modelcontextprotocol/server-postgres',
  transport: 'stdio',
  args: [process.env.TIMESCALE_CONNECTION_STRING || 
    'postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data'],
  environment: {
    POSTGRES_READ_ONLY: 'false', // Allow writes for data ingestion
    POSTGRES_SCHEMA: 'public'
  }
};
```

#### Available MCP Tools
```typescript
// Official PostgreSQL MCP Server capabilities for TimescaleDB
interface OfficialPostgresMCPTools {
  // Schema Operations
  read_schema: () => Promise<{
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
      }>;
    }>;
  }>;

  // Query Execution
  read_query: (params: {
    query: string;
  }) => Promise<{
    rows: any[];
    columns: string[];
    rowCount: number;
  }>;

  // Data Insertion (for TimescaleDB hypertables)
  execute_query: (params: {
    query: string;
    params?: any[];
  }) => Promise<{
    success: boolean;
    rowCount: number;
    message?: string;
  }>;

  // Table Information
  describe_table: (params: {
    table_name: string;
  }) => Promise<{
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      default_value?: string;
    }>;
    indexes: string[];
    constraints: string[];
  }>;
}

## Implementation

### 1. Physical Infrastructure Setup

### TimescaleDB Configuration
```yaml
# docker-compose.yml - TimescaleDB setup
version: '3.8'
services:
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    container_name: timescaledb
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: crypto_data
      POSTGRES_USER: crypto_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      TIMESCALEDB_TELEMETRY: 'off'
    volumes:
      - timescale_data:/var/lib/postgresql/data
      - ./sql/init-timescale.sql:/docker-entrypoint-initdb.d/01-init-timescale.sql
      - ./sql/create-tables.sql:/docker-entrypoint-initdb.d/02-create-tables.sql
      - ./sql/create-views.sql:/docker-entrypoint-initdb.d/03-create-views.sql
      - ./sql/create-functions.sql:/docker-entrypoint-initdb.d/04-create-functions.sql
    networks:
      - crypto_net
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crypto_user -d crypto_data"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  timescale_data:

networks:
  crypto_net:
    driver: bridge
```

### Database Schema Setup
```sql
-- sql/init-timescale.sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create database user with appropriate permissions
CREATE USER crypto_user WITH PASSWORD 'crypto_pass';
GRANT ALL PRIVILEGES ON DATABASE crypto_data TO crypto_user;

-- Switch to the crypto database
\c crypto_data crypto_user;

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Set up proper permissions
GRANT USAGE ON SCHEMA public TO crypto_user;
GRANT CREATE ON SCHEMA public TO crypto_user;
```

```sql
-- sql/create-tables.sql
\c crypto_data crypto_user;

-- Main OHLCV data table
CREATE TABLE ohlcv_data (
    timestamp TIMESTAMPTZ NOT NULL,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(20) NOT NULL DEFAULT 'coingecko',
    timeframe VARCHAR(10) NOT NULL DEFAULT '1m',
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL DEFAULT 0,
    market_cap DECIMAL(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable (TimescaleDB's core feature)
SELECT create_hypertable('ohlcv_data', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes for performance
CREATE INDEX idx_ohlcv_coin_time ON ohlcv_data (coin_id, timestamp DESC);
CREATE INDEX idx_ohlcv_symbol_time ON ohlcv_data (symbol, timestamp DESC);
CREATE INDEX idx_ohlcv_exchange_coin ON ohlcv_data (exchange, coin_id);
CREATE INDEX idx_ohlcv_timeframe ON ohlcv_data (timeframe);

-- Real-time price data table
CREATE TABLE price_data (
    timestamp TIMESTAMPTZ NOT NULL,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    usd_price DECIMAL(20,8) NOT NULL,
    btc_price DECIMAL(20,8),
    market_cap DECIMAL(20,8),
    volume_24h DECIMAL(20,8),
    change_24h DECIMAL(10,4),
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for price data
SELECT create_hypertable('price_data', 'timestamp', chunk_time_interval => INTERVAL '6 hours');

-- Indexes for price data
CREATE INDEX idx_price_coin_time ON price_data (coin_id, timestamp DESC);
CREATE INDEX idx_price_symbol_time ON price_data (symbol, timestamp DESC);
CREATE UNIQUE INDEX idx_price_coin_timestamp ON price_data (coin_id, timestamp);

-- Market overview data table
CREATE TABLE market_overview (
    timestamp TIMESTAMPTZ NOT NULL,
    total_market_cap DECIMAL(20,8),
    total_volume_24h DECIMAL(20,8),
    bitcoin_dominance DECIMAL(5,2),
    ethereum_dominance DECIMAL(5,2),
    defi_market_cap DECIMAL(20,8),
    defi_to_eth_ratio DECIMAL(5,4),
    trading_volume DECIMAL(20,8),
    data_source VARCHAR(20) DEFAULT 'coingecko',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for market overview
SELECT create_hypertable('market_overview', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Technical indicators table
CREATE TABLE technical_indicators (
    timestamp TIMESTAMPTZ NOT NULL,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    sma_20 DECIMAL(20,8),
    sma_50 DECIMAL(20,8),
    sma_200 DECIMAL(20,8),
    ema_12 DECIMAL(20,8),
    ema_26 DECIMAL(20,8),
    rsi DECIMAL(5,2),
    macd DECIMAL(20,8),
    macd_signal DECIMAL(20,8),
    bollinger_upper DECIMAL(20,8),
    bollinger_lower DECIMAL(20,8),
    bollinger_middle DECIMAL(20,8),
    volume_sma DECIMAL(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable for technical indicators
SELECT create_hypertable('technical_indicators', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes for technical indicators
CREATE INDEX idx_tech_coin_time ON technical_indicators (coin_id, timestamp DESC);
CREATE INDEX idx_tech_symbol_timeframe ON technical_indicators (symbol, timeframe, timestamp DESC);

-- Data retention policies
SELECT add_retention_policy('ohlcv_data', INTERVAL '2 years');
SELECT add_retention_policy('price_data', INTERVAL '1 year');
SELECT add_retention_policy('market_overview', INTERVAL '5 years');
SELECT add_retention_policy('technical_indicators', INTERVAL '1 year');
```

```sql
-- sql/create-views.sql
\c crypto_data crypto_user;

-- Latest prices view
CREATE VIEW latest_prices AS
SELECT DISTINCT ON (coin_id)
    coin_id,
    symbol,
    usd_price,
    btc_price,
    market_cap,
    volume_24h,
    change_24h,
    timestamp
FROM price_data
ORDER BY coin_id, timestamp DESC;

-- OHLCV aggregated views
CREATE MATERIALIZED VIEW ohlcv_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', timestamp) AS timestamp,
    coin_id,
    symbol,
    exchange,
    '1h' as timeframe,
    first(open, timestamp) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, timestamp) AS close,
    sum(volume) AS volume,
    avg(market_cap) AS market_cap
FROM ohlcv_data
WHERE timeframe = '1m'
GROUP BY time_bucket('1 hour', timestamp), coin_id, symbol, exchange;

CREATE MATERIALIZED VIEW ohlcv_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', timestamp) AS timestamp,
    coin_id,
    symbol,
    exchange,
    '1d' as timeframe,
    first(open, timestamp) AS open,
    max(high) AS high,
    min(low) AS low,
    last(close, timestamp) AS close,
    sum(volume) AS volume,
    avg(market_cap) AS market_cap
FROM ohlcv_data
WHERE timeframe = '1m'
GROUP BY time_bucket('1 day', timestamp), coin_id, symbol, exchange;

-- Refresh policies for continuous aggregates
SELECT add_continuous_aggregate_policy('ohlcv_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('ohlcv_daily',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- Top gainers/losers view
CREATE VIEW top_movers_24h AS
SELECT 
    coin_id,
    symbol,
    usd_price,
    change_24h,
    volume_24h,
    market_cap,
    timestamp,
    CASE 
        WHEN change_24h > 0 THEN 'gainer'
        WHEN change_24h < 0 THEN 'loser'
        ELSE 'neutral'
    END as movement_type
FROM latest_prices
WHERE change_24h IS NOT NULL
ORDER BY ABS(change_24h) DESC
LIMIT 100;
```

```sql
-- sql/create-functions.sql
\c crypto_data crypto_user;

-- Function to calculate Simple Moving Average
CREATE OR REPLACE FUNCTION calculate_sma(
    p_coin_id VARCHAR(50),
    p_period INTEGER,
    p_timeframe VARCHAR(10) DEFAULT '1h',
    p_start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 day'
)
RETURNS TABLE(timestamp TIMESTAMPTZ, sma DECIMAL(20,8)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.timestamp,
        AVG(o.close) OVER (
            ORDER BY o.timestamp 
            ROWS BETWEEN p_period-1 PRECEDING AND CURRENT ROW
        ) as sma
    FROM ohlcv_data o
    WHERE o.coin_id = p_coin_id 
        AND o.timeframe = p_timeframe
        AND o.timestamp >= p_start_time
    ORDER BY o.timestamp;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate RSI
CREATE OR REPLACE FUNCTION calculate_rsi(
    p_coin_id VARCHAR(50),
    p_period INTEGER DEFAULT 14,
    p_timeframe VARCHAR(10) DEFAULT '1h',
    p_start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 day'
)
RETURNS TABLE(timestamp TIMESTAMPTZ, rsi DECIMAL(5,2)) AS $$
BEGIN
    RETURN QUERY
    WITH price_changes AS (
        SELECT 
            timestamp,
            close,
            close - LAG(close) OVER (ORDER BY timestamp) as price_change
        FROM ohlcv_data
        WHERE coin_id = p_coin_id 
            AND timeframe = p_timeframe
            AND timestamp >= p_start_time
    ),
    gains_losses AS (
        SELECT 
            timestamp,
            CASE WHEN price_change > 0 THEN price_change ELSE 0 END as gain,
            CASE WHEN price_change < 0 THEN ABS(price_change) ELSE 0 END as loss
        FROM price_changes
        WHERE price_change IS NOT NULL
    ),
    avg_gains_losses AS (
        SELECT 
            timestamp,
            AVG(gain) OVER (ORDER BY timestamp ROWS BETWEEN p_period-1 PRECEDING AND CURRENT ROW) as avg_gain,
            AVG(loss) OVER (ORDER BY timestamp ROWS BETWEEN p_period-1 PRECEDING AND CURRENT ROW) as avg_loss
        FROM gains_losses
    )
    SELECT 
        a.timestamp,
        CASE 
            WHEN a.avg_loss = 0 THEN 100::DECIMAL(5,2)
            ELSE (100 - (100 / (1 + (a.avg_gain / a.avg_loss))))::DECIMAL(5,2)
        END as rsi
    FROM avg_gains_losses a
    ORDER BY a.timestamp;
END;
$$ LANGUAGE plpgsql;

-- Function to get volume profile
CREATE OR REPLACE FUNCTION get_volume_profile(
    p_coin_id VARCHAR(50),
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_price_levels INTEGER DEFAULT 20
)
RETURNS TABLE(price_level DECIMAL(20,8), volume DECIMAL(20,8), percentage DECIMAL(5,2)) AS $$
BEGIN
    RETURN QUERY
    WITH price_range AS (
        SELECT 
            MIN(low) as min_price,
            MAX(high) as max_price
        FROM ohlcv_data
        WHERE coin_id = p_coin_id
            AND timestamp BETWEEN p_start_time AND p_end_time
    ),
    price_buckets AS (
        SELECT 
            generate_series(0, p_price_levels-1) as bucket_num,
            pr.min_price + (generate_series(0, p_price_levels-1) * (pr.max_price - pr.min_price) / p_price_levels) as bucket_start,
            pr.min_price + ((generate_series(0, p_price_levels-1) + 1) * (pr.max_price - pr.min_price) / p_price_levels) as bucket_end
        FROM price_range pr
    ),
    volume_by_bucket AS (
        SELECT 
            pb.bucket_start as price_level,
            SUM(o.volume) as volume
        FROM price_buckets pb
        LEFT JOIN ohlcv_data o ON 
            o.coin_id = p_coin_id
            AND o.timestamp BETWEEN p_start_time AND p_end_time
            AND ((o.high >= pb.bucket_start AND o.low <= pb.bucket_end) OR
                 (o.close >= pb.bucket_start AND o.close <= pb.bucket_end))
        GROUP BY pb.bucket_start
    ),
    total_volume AS (
        SELECT SUM(volume) as total_vol FROM volume_by_bucket
    )
    SELECT 
        vb.price_level,
        vb.volume,
        CASE 
            WHEN tv.total_vol > 0 THEN (vb.volume / tv.total_vol * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as percentage
    FROM volume_by_bucket vb
    CROSS JOIN total_volume tv
    WHERE vb.volume > 0
    ORDER BY vb.volume DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get correlation between coins
CREATE OR REPLACE FUNCTION calculate_correlation(
    p_coin1_id VARCHAR(50),
    p_coin2_id VARCHAR(50),
    p_timeframe VARCHAR(10) DEFAULT '1h',
    p_start_time TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
    correlation_coeff DECIMAL(5,4);
BEGIN
    WITH coin1_prices AS (
        SELECT timestamp, close as price1
        FROM ohlcv_data
        WHERE coin_id = p_coin1_id 
            AND timeframe = p_timeframe
            AND timestamp >= p_start_time
    ),
    coin2_prices AS (
        SELECT timestamp, close as price2
        FROM ohlcv_data
        WHERE coin_id = p_coin2_id 
            AND timeframe = p_timeframe
            AND timestamp >= p_start_time
    ),
    combined_prices AS (
        SELECT c1.timestamp, c1.price1, c2.price2
        FROM coin1_prices c1
        INNER JOIN coin2_prices c2 ON c1.timestamp = c2.timestamp
    )
    SELECT CORR(price1, price2)::DECIMAL(5,4)
    INTO correlation_coeff
    FROM combined_prices;
    
    RETURN COALESCE(correlation_coeff, 0);
END;
$$ LANGUAGE plpgsql;
```

## MCP Server Integration in Your Application

### Starting TimescaleDB MCP Server
```typescript
// src/mcp-servers/timescale-mcp-launcher.ts
import { spawn } from 'child_process';
import { timescaleMCPConfig } from './timescale-mcp-config';

export class TimescaleMCPLauncher {
  private process?: any;

  async start(): Promise<void> {
    console.log('🕒 Starting TimescaleDB MCP Server...');
    
    this.process = spawn('npx', ['@modelcontextprotocol/server-postgres', timescaleMCPConfig.connectionString], {
      env: {
        ...process.env,
        ...timescaleMCPConfig.environment
      }
    });

    this.process.on('error', (error: Error) => {
      console.error('❌ TimescaleDB MCP Server error:', error);
    });

    this.process.on('exit', (code: number) => {
      console.log(`🕒 TimescaleDB MCP Server exited with code ${code}`);
    });

    await this.waitForReady();
    console.log('✅ TimescaleDB MCP Server ready');
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

  private async waitForReady(): Promise<void> {
    const maxRetries = 30;
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Test database connection
        const { Client } = require('pg');
        const client = new Client({ connectionString: timescaleMCPConfig.connectionString });
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        return;
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('TimescaleDB MCP Server failed to start');
  }
}
```

### AI Agent Integration
```typescript
// src/agents/timescale-agent.ts
import { BaseAgent } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

export class TimescaleAgent extends BaseAgent {
  private timescaleMCP: MCPClient;

  constructor() {
    super('timescale-agent');
    this.timescaleMCP = new MCPClient('stdio://timescale-mcp'); // Connect to TimescaleDB MCP
  }

  async insertOHLCVData(data: OHLCVData[]): Promise<void> {
    const query = `
      INSERT INTO ohlcv_data (timestamp, coin_id, symbol, exchange, timeframe, open, high, low, close, volume, market_cap)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (coin_id, timestamp) DO UPDATE SET
        open = EXCLUDED.open,
        high = EXCLUDED.high,
        low = EXCLUDED.low,
        close = EXCLUDED.close,
        volume = EXCLUDED.volume,
        market_cap = EXCLUDED.market_cap
    `;

    for (const item of data) {
      await this.timescaleMCP.call('execute_query', {
        query: query,
        params: [
          new Date(item.timestamp),
          item.coin_id,
          item.symbol,
          item.exchange || 'coingecko',
          item.timeframe || '1m',
          item.open,
          item.high,
          item.low,
          item.close,
          item.volume,
          item.market_cap
        ]
      });
    }
  }

  async insertPriceData(data: PriceData[]): Promise<void> {
    const query = `
      INSERT INTO price_data (timestamp, coin_id, symbol, usd_price, btc_price, market_cap, volume_24h, change_24h, last_updated)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (coin_id, timestamp) DO UPDATE SET
        usd_price = EXCLUDED.usd_price,
        btc_price = EXCLUDED.btc_price,
        market_cap = EXCLUDED.market_cap,
        volume_24h = EXCLUDED.volume_24h,
        change_24h = EXCLUDED.change_24h,
        last_updated = EXCLUDED.last_updated
    `;

    for (const item of data) {
      await this.timescaleMCP.call('execute_query', {
        query: query,
        params: [
          new Date(item.timestamp),
          item.coin_id,
          item.symbol,
          item.usd_price,
          item.btc_price,
          item.market_cap,
          item.volume_24h,
          item.change_24h,
          item.last_updated ? new Date(item.last_updated) : null
        ]
      });
    }
  }

  async getLatestPrices(limit: number = 50): Promise<any[]> {
    const query = `
      SELECT coin_id, symbol, usd_price, btc_price, market_cap, volume_24h, change_24h, timestamp
      FROM latest_prices
      ORDER BY market_cap DESC NULLS LAST
      LIMIT $1
    `;

    const result = await this.timescaleMCP.call('execute_query', {
      query: query,
      params: [limit]
    });

    return result.rows;
  }

  async getOHLCVData(
    coinId: string,
    timeframe: string = '1h',
    startTime: Date,
    endTime: Date = new Date()
  ): Promise<any[]> {
    const query = `
      SELECT timestamp, open, high, low, close, volume, market_cap
      FROM ohlcv_data
      WHERE coin_id = $1 AND timeframe = $2 AND timestamp BETWEEN $3 AND $4
      ORDER BY timestamp ASC
    `;

    const result = await this.timescaleMCP.call('execute_query', {
      query: query,
      params: [coinId, timeframe, startTime, endTime]
    });

    return result.rows;
  }

  async calculateSMA(coinId: string, period: number, timeframe: string = '1h'): Promise<any[]> {
    const result = await this.timescaleMCP.call('execute_query', {
      query: 'SELECT * FROM calculate_sma($1, $2, $3)',
      params: [coinId, period, timeframe]
    });

    return result.rows;
  }

  async calculateRSI(coinId: string, period: number = 14, timeframe: string = '1h'): Promise<any[]> {
    const result = await this.timescaleMCP.call('execute_query', {
      query: 'SELECT * FROM calculate_rsi($1, $2, $3)',
      params: [coinId, period, timeframe]
    });

    return result.rows;
  }

  async getVolumeProfile(coinId: string, startTime: Date, endTime: Date): Promise<any[]> {
    const result = await this.timescaleMCP.call('execute_query', {
      query: 'SELECT * FROM get_volume_profile($1, $2, $3)',
      params: [coinId, startTime, endTime]
    });

    return result.rows;
  }

  async getCorrelation(coin1Id: string, coin2Id: string, timeframe: string = '1h'): Promise<number> {
    const result = await this.timescaleMCP.call('execute_query', {
      query: 'SELECT calculate_correlation($1, $2, $3) as correlation',
      params: [coin1Id, coin2Id, timeframe]
    });

    return result.rows[0]?.correlation || 0;
  }

  async getTopMovers(movementType: 'gainer' | 'loser' | 'all' = 'all', limit: number = 20): Promise<any[]> {
    let query = `
      SELECT coin_id, symbol, usd_price, change_24h, volume_24h, market_cap, timestamp
      FROM top_movers_24h
    `;

    const params: any[] = [];
    if (movementType !== 'all') {
      query += ` WHERE movement_type = $1`;
      params.push(movementType);
    }

    query += ` LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.postgresMCP.call('read_query', {
      query: query,
      params: params
    });

    return result.rows;
  }

  async getMarketOverview(startTime?: Date, endTime?: Date): Promise<any[]> {
    let query = `
      SELECT timestamp, total_market_cap, total_volume_24h, bitcoin_dominance, 
             ethereum_dominance, defi_market_cap, defi_to_eth_ratio
      FROM market_overview
    `;

    const params: any[] = [];
    if (startTime && endTime) {
      query += ` WHERE timestamp BETWEEN $1 AND $2`;
      params.push(startTime, endTime);
    } else if (startTime) {
      query += ` WHERE timestamp >= $1`;
      params.push(startTime);
    }

    query += ` ORDER BY timestamp DESC LIMIT 100`;

    const result = await this.postgresMCP.call('read_query', {
      query: query,
      params: params
    });

    return result.rows;
  }

  async executeCustomQuery(query: string, params: any[] = []): Promise<any> {
    const result = await this.timescaleMCP.call('execute_query', {
      query: query,
      params: params
    });

    return result;
  }

  async getTableSchema(tableName: string): Promise<any[]> {
    // Use official MCP tool for schema information
    const result = await this.postgresMCP.call('describe_table', {
      table_name: tableName
    });

    return result.columns;
  }
}
```

### Data Consumer Integration
```typescript
// src/consumers/timescale-data-consumer.ts
import { Kafka } from 'kafkajs';
import { TimescaleAgent } from '../agents/timescale-agent';

export class TimescaleDataConsumer {
  private kafka: Kafka;
  private consumer: any;
  private timescaleAgent: TimescaleAgent;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'timescale-consumer',
      brokers: ['localhost:9092']
    });
    this.consumer = this.kafka.consumer({ groupId: 'timescale-group' });
    this.timescaleAgent = new TimescaleAgent();
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ 
      topics: ['crypto-prices', 'crypto-ohlcv', 'crypto-analytics'] 
    });

    console.log('🕒 TimescaleDB consumer connected');

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await this.processMessage(topic, message);
      },
    });
  }

  private async processMessage(topic: string, message: any): Promise<void> {
    try {
      const data = JSON.parse(message.value.toString());

      switch (topic) {
        case 'crypto-prices':
          await this.timescaleAgent.insertPriceData([{
            timestamp: data.timestamp,
            coin_id: data.coin_id,
            symbol: data.symbol,
            usd_price: data.usd_price,
            btc_price: data.btc_price,
            market_cap: data.market_cap,
            volume_24h: data.volume_24h,
            change_24h: data.change_24h,
            last_updated: data.last_updated
          }]);
          break;

        case 'crypto-ohlcv':
          await this.timescaleAgent.insertOHLCVData([{
            timestamp: data.timestamp,
            coin_id: data.coin_id,
            symbol: data.symbol,
            exchange: data.exchange || 'coingecko',
            timeframe: data.timeframe || '1m',
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            market_cap: data.market_cap
          }]);
          break;

        case 'crypto-analytics':
          // Handle market overview and analytics data
          if (data.global_stats) {
            await this.timescaleAgent.executeCustomQuery(`
              INSERT INTO market_overview (timestamp, total_market_cap, total_volume_24h, bitcoin_dominance, ethereum_dominance, defi_market_cap)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
              new Date(data.timestamp),
              data.global_stats.total_market_cap?.usd,
              data.global_stats.total_volume_24h?.usd,
              data.global_stats.market_cap_percentage?.btc,
              data.global_stats.market_cap_percentage?.eth,
              data.global_stats.defi_market_cap
            ]);
          }
          break;
      }

      console.log(`✅ Processed ${topic} message for TimescaleDB`);
    } catch (error) {
      console.error(`❌ Error processing ${topic} message:`, error);
    }
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    console.log('🕒 TimescaleDB consumer disconnected');
  }
}
```

## Environment Configuration

```bash
# .env
# TimescaleDB Connection
TIMESCALE_CONNECTION_STRING=postgresql://crypto_user:crypto_pass@localhost:5432/crypto_data
POSTGRES_PASSWORD=secure_postgres_password

# Alternative: Aiven TimescaleDB
AIVEN_API_TOKEN=your_aiven_token
AIVEN_PROJECT=crypto-platform
AIVEN_POSTGRES_SERVICE=timescale-crypto

# MCP Server Configuration
TIMESCALE_MCP_PORT=8082
POSTGRES_SCHEMA=public
POSTGRES_READ_ONLY=false
```

## Monitoring and Performance

### Performance Optimization
```typescript
// src/services/timescale-optimization.ts
export class TimescaleOptimization {
  private timescaleAgent: TimescaleAgent;

  constructor() {
    this.timescaleAgent = new TimescaleAgent();
  }

  async optimizeIndexes(): Promise<void> {
    // Analyze query performance
    const slowQueries = await this.timescaleAgent.executeCustomQuery(`
      SELECT query, mean_exec_time, calls, total_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    console.log('🔍 Slow queries detected:', slowQueries.rows);

    // Suggest index optimizations
    for (const query of slowQueries.rows) {
      console.log(`⚠️ Slow query (${query.mean_exec_time}ms): ${query.query}`);
    }
  }

  async analyzeChunkUsage(): Promise<void> {
    const chunkInfo = await this.timescaleAgent.executeCustomQuery(`
      SELECT hypertable_name, chunk_name, range_start, range_end, 
             compressed_chunk_name IS NOT NULL as is_compressed
      FROM timescaledb_information.chunks
      WHERE hypertable_name IN ('ohlcv_data', 'price_data')
      ORDER BY range_start DESC
      LIMIT 20
    `);

    console.log('📊 Recent chunks:', chunkInfo.rows);
  }

  async enableCompression(): Promise<void> {
    // Enable compression for older data
    await this.timescaleAgent.executeCustomQuery(`
      ALTER TABLE ohlcv_data SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'coin_id, symbol',
        timescaledb.compress_orderby = 'timestamp DESC'
      )
    `);

    await this.timescaleAgent.executeCustomQuery(`
      SELECT add_compression_policy('ohlcv_data', INTERVAL '7 days')
    `);

    console.log('✅ Compression enabled for ohlcv_data');
  }
}
```

### Health Monitoring
```typescript
// src/health/timescale-health.ts
export class TimescaleHealthChecker {
  private timescaleMCP: MCPClient;

  constructor() {
    this.timescaleMCP = new MCPClient('stdio://timescale-mcp');
  }

  async checkHealth(): Promise<HealthStatus> {
    try {
      // Check database connectivity
      const connectionTest = await this.timescaleMCP.call('execute_query', {
        query: 'SELECT NOW() as current_time, version() as version'
      });

      // Check hypertable health
      const hypertableHealth = await this.timescaleMCP.call('execute_query', {
        query: `
          SELECT hypertable_name, num_chunks, 
                 compressed_chunks, uncompressed_chunks
          FROM timescaledb_information.hypertables
        `
      });

      // Check recent data ingestion
      const recentData = await this.timescaleMCP.call('execute_query', {
        query: `
          SELECT COUNT(*) as recent_records
          FROM price_data
          WHERE timestamp > NOW() - INTERVAL '5 minutes'
        `
      });

      const recentRecords = recentData.rows[0]?.recent_records || 0;

      if (recentRecords < 10) {
        return {
          status: 'degraded',
          message: `Low data ingestion: ${recentRecords} records in last 5 minutes`,
          data: {
            hypertables: hypertableHealth.rows,
            recent_records: recentRecords
          }
        };
      }

      return {
        status: 'healthy',
        message: 'TimescaleDB healthy via Official PostgreSQL MCP Server',
        data: {
          database_time: connectionTest.rows[0]?.current_time,
          hypertables: hypertableHealth.rows,
          recent_records: recentRecords
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `TimescaleDB MCP error: ${error.message}`
      };
    }
  }
}
```

## Summary

- **Ready-to-Use**: Official PostgreSQL MCP server works with TimescaleDB
- **Time-Series Optimized**: Hypertables, continuous aggregates, compression
- **Advanced Analytics**: Built-in functions for SMA, RSI, correlations
- **High Performance**: Optimized indexes and query patterns
- **Real-time Ingestion**: Kafka consumer integration for live data
- **Monitoring**: Health checks and performance optimization tools