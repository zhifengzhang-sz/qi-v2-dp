// lib/src/database/timescale-client.ts
// Low-level TimescaleDB client using Kysely for high-performance SQL operations

import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";

// Database schema types for TimescaleDB
export interface Database {
  crypto_prices: {
    time: Date;
    coin_id: string;
    symbol: string;
    usd_price: number | null;
    btc_price: number | null;
    market_cap: number | null;
    volume_24h: number | null;
    change_24h: number | null;
    last_updated: number | null;
  };

  ohlcv_data: {
    time: Date;
    coin_id: string;
    symbol: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    interval: string | null;
  };

  market_analytics: {
    time: Date;
    total_market_cap: number | null;
    total_volume: number | null;
    btc_dominance: number | null;
    eth_dominance: number | null;
    active_cryptocurrencies: number | null;
    markets: number | null;
    market_cap_change_24h: number | null;
  };
}

export interface TimescaleCryptoPrice {
  time: Date;
  coin_id: string;
  symbol: string;
  usd_price?: number;
  btc_price?: number;
  market_cap?: number;
  volume_24h?: number;
  change_24h?: number;
  last_updated?: number;
}

export interface TimescaleOHLCV {
  time: Date;
  coin_id: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
}

export interface TimescaleMarketAnalytics {
  time: Date;
  total_market_cap?: number;
  total_volume?: number;
  btc_dominance?: number;
  eth_dominance?: number;
  active_cryptocurrencies?: number;
  markets?: number;
  market_cap_change_24h?: number;
  source?: string;
}

export interface TimescaleQueryOptions {
  symbols?: string[];
  timeRange?: { start: Date; end: Date };
  interval?: string;
  limit?: number;
}

/**
 * High-performance TimescaleDB client using Kysely
 * Provides optimized operations for crypto time-series data
 */
export class TimescaleClient {
  private db: Kysely<Database>;
  private pool: Pool;

  constructor(
    connectionString: string,
    poolConfig?: {
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    },
  ) {
    this.pool = new Pool({
      connectionString,
      max: poolConfig?.max || 20,
      idleTimeoutMillis: poolConfig?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: poolConfig?.connectionTimeoutMillis || 2000,
    });

    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });
  }

  /**
   * Initialize TimescaleDB hypertables and policies
   */
  async initialize(): Promise<void> {
    await this.createHypertables();
    await this.setupCompressionPolicies();
    await this.setupRetentionPolicies();
    await this.createIndexes();
  }

  /**
   * Create TimescaleDB hypertables for crypto data
   */
  private async createHypertables(): Promise<void> {
    // Create crypto_prices hypertable
    await sql`
      CREATE TABLE IF NOT EXISTS crypto_prices (
        time TIMESTAMPTZ NOT NULL,
        coin_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        usd_price DECIMAL,
        btc_price DECIMAL,
        market_cap DECIMAL,
        volume_24h DECIMAL,
        change_24h DECIMAL,
        last_updated BIGINT,
        PRIMARY KEY (coin_id, time)
      )
    `.execute(this.db);

    await sql`
      SELECT create_hypertable('crypto_prices', 'time', 
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE)
    `.execute(this.db);

    // Create ohlcv_data hypertable
    await sql`
      CREATE TABLE IF NOT EXISTS ohlcv_data (
        time TIMESTAMPTZ NOT NULL,
        coin_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        open DECIMAL NOT NULL,
        high DECIMAL NOT NULL,
        low DECIMAL NOT NULL,
        close DECIMAL NOT NULL,
        volume DECIMAL NOT NULL,
        interval TEXT,
        PRIMARY KEY (coin_id, time)
      )
    `.execute(this.db);

    await sql`
      SELECT create_hypertable('ohlcv_data', 'time',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE)
    `.execute(this.db);

    // Create market_analytics hypertable
    await sql`
      CREATE TABLE IF NOT EXISTS market_analytics (
        time TIMESTAMPTZ NOT NULL PRIMARY KEY,
        total_market_cap DECIMAL,
        total_volume DECIMAL,
        btc_dominance DECIMAL,
        eth_dominance DECIMAL,
        defi_market_cap DECIMAL,
        active_cryptocurrencies INTEGER
      )
    `.execute(this.db);

    await sql`
      SELECT create_hypertable('market_analytics', 'time',
        chunk_time_interval => INTERVAL '1 hour',
        if_not_exists => TRUE)
    `.execute(this.db);
  }

  /**
   * Setup compression policies for data efficiency
   */
  private async setupCompressionPolicies(): Promise<void> {
    // Compress data older than 7 days
    // Add compression policies with error handling
    try {
      await sql`SELECT add_compression_policy('crypto_prices', INTERVAL '7 days')`.execute(this.db);
    } catch (error) {
      // Policy may already exist, ignore error
    }

    try {
      await sql`SELECT add_compression_policy('ohlcv_data', INTERVAL '7 days')`.execute(this.db);
    } catch (error) {
      // Policy may already exist, ignore error
    }

    try {
      await sql`SELECT add_compression_policy('market_analytics', INTERVAL '3 days')`.execute(
        this.db,
      );
    } catch (error) {
      // Policy may already exist, ignore error
    }
  }

  /**
   * Setup data retention policies
   */
  private async setupRetentionPolicies(): Promise<void> {
    // Keep data for 2 years
    // Add retention policies with error handling
    try {
      await sql`SELECT add_retention_policy('crypto_prices', INTERVAL '2 years')`.execute(this.db);
    } catch (error) {
      // Policy may already exist, ignore error
    }

    try {
      await sql`SELECT add_retention_policy('ohlcv_data', INTERVAL '2 years')`.execute(this.db);
    } catch (error) {
      // Policy may already exist, ignore error
    }

    try {
      await sql`SELECT add_retention_policy('market_analytics', INTERVAL '1 year')`.execute(
        this.db,
      );
    } catch (error) {
      // Policy may already exist, ignore error
    }
  }

  /**
   * Create optimized indexes for query performance
   */
  private async createIndexes(): Promise<void> {
    await sql`
      CREATE INDEX IF NOT EXISTS idx_crypto_prices_symbol_time 
      ON crypto_prices (symbol, time DESC)
    `.execute(this.db);

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ohlcv_symbol_time 
      ON ohlcv_data (symbol, time DESC)
    `.execute(this.db);
  }

  /**
   * Insert crypto price data with high-performance bulk operations
   */
  async insertPrices(prices: TimescaleCryptoPrice[]): Promise<void> {
    if (prices.length === 0) return;

    await this.db
      .insertInto("crypto_prices")
      .values(
        prices.map((price) => ({
          time: price.time,
          coin_id: price.coin_id,
          symbol: price.symbol,
          usd_price: price.usd_price ?? null,
          btc_price: price.btc_price ?? null,
          market_cap: price.market_cap ?? null,
          volume_24h: price.volume_24h ?? null,
          change_24h: price.change_24h ?? null,
          last_updated: price.last_updated ?? null,
        })),
      )
      .onConflict((oc) =>
        oc.columns(["coin_id", "time"]).doUpdateSet({
          usd_price: (eb) => eb.ref("excluded.usd_price"),
          btc_price: (eb) => eb.ref("excluded.btc_price"),
          market_cap: (eb) => eb.ref("excluded.market_cap"),
          volume_24h: (eb) => eb.ref("excluded.volume_24h"),
          change_24h: (eb) => eb.ref("excluded.change_24h"),
          last_updated: (eb) => eb.ref("excluded.last_updated"),
        }),
      )
      .execute();
  }

  /**
   * Insert OHLCV data with conflict resolution
   */
  async insertOHLCV(ohlcvData: TimescaleOHLCV[]): Promise<void> {
    if (ohlcvData.length === 0) return;

    await this.db
      .insertInto("ohlcv_data")
      .values(
        ohlcvData.map((ohlcv) => ({
          time: ohlcv.time,
          coin_id: ohlcv.coin_id,
          symbol: ohlcv.symbol,
          open: ohlcv.open,
          high: ohlcv.high,
          low: ohlcv.low,
          close: ohlcv.close,
          volume: ohlcv.volume,
          interval: ohlcv.interval ?? null,
        })),
      )
      .onConflict((oc) =>
        oc.columns(["coin_id", "time"]).doUpdateSet({
          open: (eb) => eb.ref("excluded.open"),
          high: (eb) => eb.ref("excluded.high"),
          low: (eb) => eb.ref("excluded.low"),
          close: (eb) => eb.ref("excluded.close"),
          volume: (eb) => eb.ref("excluded.volume"),
          interval: (eb) => eb.ref("excluded.interval"),
        }),
      )
      .execute();
  }

  /**
   * Insert market analytics data
   */
  async insertMarketAnalytics(analytics: TimescaleMarketAnalytics): Promise<void> {
    const insertData = {
      time: analytics.time,
      total_market_cap: analytics.total_market_cap,
      total_volume: analytics.total_volume,
      btc_dominance: analytics.btc_dominance,
      eth_dominance: analytics.eth_dominance,
      active_cryptocurrencies: analytics.active_cryptocurrencies,
      markets: analytics.markets,
      market_cap_change_24h: analytics.market_cap_change_24h,
    };

    await this.db
      .insertInto("market_analytics")
      .values(insertData)
      .onConflict((oc) =>
        oc.column("time").doUpdateSet({
          total_market_cap: (eb) => eb.ref("excluded.total_market_cap"),
          total_volume: (eb) => eb.ref("excluded.total_volume"),
          btc_dominance: (eb) => eb.ref("excluded.btc_dominance"),
          eth_dominance: (eb) => eb.ref("excluded.eth_dominance"),
          active_cryptocurrencies: (eb) => eb.ref("excluded.active_cryptocurrencies"),
          markets: (eb) => eb.ref("excluded.markets"),
          market_cap_change_24h: (eb) => eb.ref("excluded.market_cap_change_24h"),
        }),
      )
      .execute();
  }

  /**
   * Get latest prices with TimescaleDB optimizations
   */
  async getLatestPrices(options: TimescaleQueryOptions = {}): Promise<TimescaleCryptoPrice[]> {
    let query = this.db
      .selectFrom("crypto_prices")
      .distinctOn(["symbol"])
      .select([
        "time",
        "coin_id",
        "symbol",
        "usd_price",
        "btc_price",
        "market_cap",
        "volume_24h",
        "change_24h",
        "last_updated",
      ])
      .orderBy("symbol")
      .orderBy("time", "desc");

    if (options.symbols?.length) {
      query = query.where("symbol", "in", options.symbols);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const results = await query.execute();

    return results.map((row) => ({
      time: row.time,
      coin_id: row.coin_id,
      symbol: row.symbol,
      usd_price: row.usd_price ?? undefined,
      btc_price: row.btc_price ?? undefined,
      market_cap: row.market_cap ?? undefined,
      volume_24h: row.volume_24h ?? undefined,
      change_24h: row.change_24h ?? undefined,
      last_updated: row.last_updated ?? undefined,
    }));
  }

  /**
   * Get OHLCV data with time bucketing for aggregation
   */
  async getOHLCVRange(options: TimescaleQueryOptions): Promise<any[]> {
    const bucketInterval = options.interval === "hourly" ? "1 hour" : "1 day";
    const startTime = options.timeRange?.start || new Date(Date.now() - 86400000);
    const endTime = options.timeRange?.end || new Date();

    let query = sql<any>`
      SELECT 
        symbol,
        time_bucket(${bucketInterval}, time) as time,
        first(open, time) as open,
        max(high) as high,
        min(low) as low,
        last(close, time) as close,
        sum(volume) as volume
      FROM ohlcv_data
      WHERE time >= ${startTime} AND time <= ${endTime}
    `;

    if (options.symbols?.length) {
      query = sql`${query} AND symbol = ANY(${options.symbols})`;
    }

    query = sql`${query}
      GROUP BY symbol, time_bucket(${bucketInterval}, time)
      ORDER BY symbol, time DESC
    `;

    if (options.limit) {
      query = sql`${query} LIMIT ${options.limit}`;
    }

    const result = await query.execute(this.db);
    return result.rows;
  }

  /**
   * Get market summary with aggregations
   */
  async getMarketSummary(timeRange?: { start: Date; end: Date }): Promise<any> {
    const startTime = timeRange?.start || new Date(Date.now() - 86400000);
    const endTime = timeRange?.end || new Date();

    const result = await sql<any>`
      SELECT 
        SUM(market_cap) as total_market_cap,
        SUM(volume_24h) as total_volume,
        COUNT(DISTINCT symbol) as active_symbols
      FROM crypto_prices 
      WHERE time >= ${startTime} AND time <= ${endTime}
      AND time = (
        SELECT MAX(time) 
        FROM crypto_prices cp2 
        WHERE cp2.symbol = crypto_prices.symbol
        AND cp2.time >= ${startTime} AND cp2.time <= ${endTime}
      )
    `.execute(this.db);

    const row = result.rows[0];
    return {
      totalMarketCap: Number.parseFloat(row?.total_market_cap || "0"),
      totalVolume: Number.parseFloat(row?.total_volume || "0"),
      activeSymbols: Number.parseInt(row?.active_symbols || "0"),
      timeRange: { start: startTime, end: endTime },
    };
  }

  /**
   * Execute custom SQL with TimescaleDB functions
   */
  async executeCustomQuery(sqlQuery: string): Promise<any[]> {
    // Security: Only allow SELECT queries
    if (!sqlQuery.trim().toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed for custom SQL execution");
    }

    const result = await sql.raw(sqlQuery).execute(this.db);
    return result.rows;
  }

  /**
   * Get hypertable information
   */
  async listHypertables(): Promise<any[]> {
    const result = await sql<any>`
      SELECT 
        ht.table_name as "tableName",
        ht.time_column_name as "timeColumn",
        COUNT(c.table_name) as chunks
      FROM _timescaledb_catalog.hypertable ht
      LEFT JOIN _timescaledb_catalog.chunk c ON ht.id = c.hypertable_id
      WHERE ht.table_schema = 'public'
      GROUP BY ht.table_name, ht.time_column_name
      ORDER BY ht.table_name
    `.execute(this.db);

    return result.rows.map((row) => ({
      tableName: row.tableName,
      timeColumn: row.timeColumn,
      chunks: Number.parseInt(row.chunks),
    }));
  }

  /**
   * Cleanup and close connections
   */
  async destroy(): Promise<void> {
    await this.db.destroy();
    await this.pool.end();
  }
}
