// lib/src/database/drizzle-client.ts
// Drizzle ORM client for crypto financial time-series data
// High-performance low-level module with TimescaleDB integration

import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import {
  type CryptoPrice,
  type CryptoPriceInsert,
  type Currency,
  type Exchange,
  type MarketAnalytics,
  type MarketAnalyticsInsert,
  type OHLCVData,
  type OHLCVDataInsert,
  type Trade,
  type TradeInsert,
  type TradingPair,
  schema,
} from "./schema";

/**
 * Configuration for the Drizzle client
 */
export interface DrizzleClientConfig {
  connectionString: string;
  poolConfig?: {
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
  debug?: boolean;
}

/**
 * Query options for time-series data
 */
export interface TimeSeriesQueryOptions {
  symbols?: string[];
  coinIds?: string[];
  timeRange?: { start: Date; end: Date };
  timeframe?: string;
  limit?: number;
  orderBy?: "asc" | "desc";
  exchanges?: string[];
}

/**
 * High-performance Drizzle ORM client for crypto financial data
 * Provides type-safe, optimized operations for TimescaleDB
 */
export class DrizzleClient {
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;

  constructor(config: DrizzleClientConfig) {
    // Create postgres client with connection pooling
    this.client = postgres(config.connectionString, {
      max: config.poolConfig?.max || 20,
      idle_timeout: config.poolConfig?.idleTimeoutMillis || 30000,
      connect_timeout: config.poolConfig?.connectionTimeoutMillis || 2000,
      prepare: true, // Enable prepared statements for performance
      debug: config.debug || false,
    });

    // Create Drizzle instance with schema
    this.db = drizzle(this.client, { schema });
  }

  /**
   * Initialize TimescaleDB hypertables and extensions
   */
  async initialize(): Promise<void> {
    await this.createTimescaleExtension();
    await this.createHypertables();
    await this.setupCompressionPolicies();
    await this.setupRetentionPolicies();
  }

  /**
   * Create TimescaleDB extension if not exists
   */
  private async createTimescaleExtension(): Promise<void> {
    await this.db.execute(sql`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);
  }

  /**
   * Create TimescaleDB hypertables for time-series tables
   * Only creates hypertables for tables that exist in our DSL schema
   */
  private async createHypertables(): Promise<void> {
    // Check which tables exist and only create hypertables for those
    const tablesToCheck = [
      { name: "crypto_prices", interval: "1 day" },
      { name: "ohlcv_data", interval: "1 day" },
      { name: "market_analytics", interval: "1 hour" },
      { name: "level1_data", interval: "1 hour" },
    ];

    for (const table of tablesToCheck) {
      try {
        // Check if table exists first
        const tableExists = await this.db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table.name}
          );
        `);

        if (tableExists[0]?.exists) {
          await this.db.execute(sql`
            SELECT create_hypertable(${table.name}, 'time',
              chunk_time_interval => INTERVAL ${table.interval},
              if_not_exists => TRUE
            );
          `);
        }
      } catch (error: any) {
        if (!error.message?.includes("already a hypertable")) {
          console.warn(`⚠️ Could not create hypertable for ${table.name}:`, error.message);
        }
      }
    }
  }

  /**
   * Setup compression policies for data efficiency
   */
  private async setupCompressionPolicies(): Promise<void> {
    const policies = [
      { table: "crypto_prices", interval: "7 days" },
      { table: "ohlcv_data", interval: "7 days" },
      { table: "trades", interval: "3 days" },
      { table: "market_analytics", interval: "3 days" },
    ];

    for (const policy of policies) {
      try {
        await this.db.execute(
          sql.raw(`
          SELECT add_compression_policy('${policy.table}', INTERVAL '${policy.interval}');
        `),
        );
      } catch (error: any) {
        // Ignore if policy already exists
        if (!error.message?.includes("already exists") && !error.message?.includes("duplicate")) {
          console.warn(
            `Warning: Could not add compression policy for ${policy.table}:`,
            error.message,
          );
        }
      }
    }
  }

  /**
   * Setup data retention policies
   */
  private async setupRetentionPolicies(): Promise<void> {
    const policies = [
      { table: "crypto_prices", retention: "2 years" },
      { table: "ohlcv_data", retention: "2 years" },
      { table: "trades", retention: "1 year" },
      { table: "market_analytics", retention: "1 year" },
    ];

    for (const policy of policies) {
      try {
        await this.db.execute(
          sql.raw(`
          SELECT add_retention_policy('${policy.table}', INTERVAL '${policy.retention}');
        `),
        );
      } catch (error: any) {
        // Ignore if policy already exists
        if (!error.message?.includes("already exists") && !error.message?.includes("duplicate")) {
          console.warn(
            `Warning: Could not add retention policy for ${policy.table}:`,
            error.message,
          );
        }
      }
    }
  }

  // =============================================================================
  // CRYPTO PRICES OPERATIONS
  // =============================================================================

  /**
   * Insert crypto price data with conflict resolution
   */
  async insertCryptoPrices(prices: CryptoPriceInsert[]): Promise<void> {
    if (prices.length === 0) return;

    await this.db
      .insert(schema.cryptoPrices)
      .values(prices)
      .onConflictDoUpdate({
        target: [schema.cryptoPrices.coinId, schema.cryptoPrices.time],
        set: {
          usdPrice: sql`excluded.usd_price`,
          btcPrice: sql`excluded.btc_price`,
          ethPrice: sql`excluded.eth_price`,
          marketCap: sql`excluded.market_cap`,
          volume24h: sql`excluded.volume_24h`,
          change24h: sql`excluded.change_24h`,
          change7d: sql`excluded.change_7d`,
          lastUpdated: sql`excluded.last_updated`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  /**
   * Get latest prices for specified coins
   */
  async getLatestPrices(options: TimeSeriesQueryOptions = {}): Promise<CryptoPrice[]> {
    const conditions = [];

    // Build where conditions
    if (options.coinIds?.length) {
      conditions.push(inArray(schema.cryptoPrices.coinId, options.coinIds));
    }

    if (options.symbols?.length) {
      conditions.push(inArray(schema.cryptoPrices.symbol, options.symbols));
    }

    if (options.timeRange) {
      conditions.push(
        gte(schema.cryptoPrices.time, options.timeRange.start),
        lte(schema.cryptoPrices.time, options.timeRange.end),
      );
    }

    // Build the query step by step
    const baseQuery = this.db.select().from(schema.cryptoPrices);

    const withWhere =
      conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : baseQuery;

    const withOrder = withWhere.orderBy(desc(schema.cryptoPrices.time));

    const finalQuery = options.limit ? withOrder.limit(options.limit) : withOrder;

    return await finalQuery;
  }

  /**
   * Get distinct latest price for each coin (one per coin)
   */
  async getDistinctLatestPrices(coinIds?: string[]): Promise<CryptoPrice[]> {
    const whereClause = coinIds?.length ? sql`WHERE coin_id = ANY(${coinIds})` : sql``;

    const result = await this.db.execute(sql`
      SELECT DISTINCT ON (coin_id) *
      FROM crypto_prices
      ${whereClause}
      ORDER BY coin_id, time DESC
    `);

    return result as unknown as CryptoPrice[];
  }

  // =============================================================================
  // OHLCV DATA OPERATIONS
  // =============================================================================

  /**
   * Insert OHLCV data with conflict resolution
   */
  async insertOHLCVData(data: OHLCVDataInsert[]): Promise<void> {
    if (data.length === 0) return;

    await this.db
      .insert(schema.ohlcvData)
      .values(data)
      .onConflictDoUpdate({
        target: [schema.ohlcvData.coinId, schema.ohlcvData.timeframe, schema.ohlcvData.time],
        set: {
          open: sql`excluded.open`,
          high: sql`excluded.high`,
          low: sql`excluded.low`,
          close: sql`excluded.close`,
          volume: sql`excluded.volume`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  /**
   * Get OHLCV data with time bucketing for aggregation
   */
  async getOHLCVRange(
    options: TimeSeriesQueryOptions & { timeframe: string },
  ): Promise<OHLCVData[]> {
    const conditions = [eq(schema.ohlcvData.timeframe, options.timeframe)];

    // Build additional where conditions
    if (options.coinIds?.length) {
      conditions.push(inArray(schema.ohlcvData.coinId, options.coinIds));
    }

    if (options.symbols?.length) {
      conditions.push(inArray(schema.ohlcvData.symbol, options.symbols));
    }

    if (options.timeRange) {
      conditions.push(
        gte(schema.ohlcvData.time, options.timeRange.start),
        lte(schema.ohlcvData.time, options.timeRange.end),
      );
    }

    // Build query step by step
    const baseQuery = this.db.select().from(schema.ohlcvData);
    const withWhere = baseQuery.where(and(...conditions));

    // Order by time
    const orderDirection = options.orderBy === "asc" ? asc : desc;
    const withOrder = withWhere.orderBy(orderDirection(schema.ohlcvData.time));

    const finalQuery = options.limit ? withOrder.limit(options.limit) : withOrder;

    return await finalQuery;
  }

  /**
   * Get custom time-bucketed OHLCV data using TimescaleDB functions
   */
  async getTimeBucketedOHLCV(
    coinId: string,
    bucketInterval: string,
    timeRange: { start: Date; end: Date },
  ): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        coin_id,
        time_bucket(${bucketInterval}, time) as bucket_time,
        first(open, time) as open,
        max(high) as high,
        min(low) as low,
        last(close, time) as close,
        sum(volume) as volume,
        count(*) as periods
      FROM ohlcv_data
      WHERE coin_id = ${coinId}
        AND time >= ${timeRange.start}
        AND time <= ${timeRange.end}
      GROUP BY coin_id, bucket_time
      ORDER BY bucket_time DESC
    `);

    return result;
  }

  // =============================================================================
  // MARKET ANALYTICS OPERATIONS
  // =============================================================================

  /**
   * Insert market analytics data
   */
  async insertMarketAnalytics(analytics: MarketAnalyticsInsert): Promise<void> {
    await this.db
      .insert(schema.marketAnalytics)
      .values(analytics)
      .onConflictDoUpdate({
        target: [schema.marketAnalytics.time],
        set: {
          totalMarketCap: sql`excluded.total_market_cap`,
          totalVolume: sql`excluded.total_volume`,
          btcDominance: sql`excluded.btc_dominance`,
          ethDominance: sql`excluded.eth_dominance`,
          activeCryptocurrencies: sql`excluded.active_cryptocurrencies`,
          markets: sql`excluded.markets`,
          marketCapChange24h: sql`excluded.market_cap_change_24h`,
          updatedAt: sql`NOW()`,
        },
      });
  }

  /**
   * Get market summary for a time range
   */
  async getMarketSummary(timeRange?: { start: Date; end: Date }): Promise<MarketAnalytics | null> {
    const baseQuery = this.db.select().from(schema.marketAnalytics);

    const withWhere = timeRange
      ? baseQuery.where(
          and(
            gte(schema.marketAnalytics.time, timeRange.start),
            lte(schema.marketAnalytics.time, timeRange.end),
          ),
        )
      : baseQuery;

    const finalQuery = withWhere.orderBy(desc(schema.marketAnalytics.time)).limit(1);

    const result = await finalQuery;
    return result[0] || null;
  }

  // =============================================================================
  // TRADES OPERATIONS
  // =============================================================================

  /**
   * Insert individual trades
   */
  async insertTrades(trades: TradeInsert[]): Promise<void> {
    if (trades.length === 0) return;

    await this.db.insert(schema.trades).values(trades);
  }

  /**
   * Get recent trades for analysis
   */
  async getRecentTrades(options: TimeSeriesQueryOptions): Promise<Trade[]> {
    const conditions = [];

    // Build where conditions
    if (options.coinIds?.length) {
      conditions.push(inArray(schema.trades.coinId, options.coinIds));
    }

    if (options.symbols?.length) {
      conditions.push(inArray(schema.trades.symbol, options.symbols));
    }

    if (options.timeRange) {
      conditions.push(
        gte(schema.trades.time, options.timeRange.start),
        lte(schema.trades.time, options.timeRange.end),
      );
    }

    // Build query step by step
    const baseQuery = this.db.select().from(schema.trades);

    const withWhere =
      conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : baseQuery;

    const withOrder = withWhere.orderBy(desc(schema.trades.time));

    const finalQuery = options.limit ? withOrder.limit(options.limit) : withOrder;

    return await finalQuery;
  }

  // =============================================================================
  // REFERENCE DATA OPERATIONS
  // =============================================================================

  /**
   * Get all active currencies
   */
  async getCurrencies(): Promise<Currency[]> {
    return await this.db
      .select()
      .from(schema.currencies)
      .where(eq(schema.currencies.isActive, true))
      .orderBy(asc(schema.currencies.code));
  }

  /**
   * Get all active exchanges
   */
  async getExchanges(): Promise<Exchange[]> {
    return await this.db
      .select()
      .from(schema.exchanges)
      .where(eq(schema.exchanges.isActive, true))
      .orderBy(asc(schema.exchanges.name));
  }

  /**
   * Get all active trading pairs
   */
  async getTradingPairs(): Promise<TradingPair[]> {
    return await this.db
      .select()
      .from(schema.tradingPairs)
      .where(eq(schema.tradingPairs.isActive, true))
      .orderBy(asc(schema.tradingPairs.symbol));
  }

  // =============================================================================
  // ADVANCED QUERIES
  // =============================================================================

  /**
   * Execute custom SQL query with TimescaleDB functions
   */
  async executeCustomQuery(sqlQuery: string): Promise<any[]> {
    // Security: Only allow SELECT queries
    if (!sqlQuery.trim().toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed for custom SQL execution");
    }

    const result = await this.db.execute(sql.raw(sqlQuery));
    return result;
  }

  /**
   * Get hypertable information
   */
  async getHypertableInfo(): Promise<any[]> {
    const result = await this.db.execute(sql`
      SELECT 
        ht.table_name as "tableName",
        ht.time_column_name as "timeColumn",
        COUNT(c.table_name) as chunks,
        pg_size_pretty(hypertable_size(format('%I.%I', ht.schema_name, ht.table_name)::regclass)) as size
      FROM _timescaledb_catalog.hypertable ht
      LEFT JOIN _timescaledb_catalog.chunk c ON ht.id = c.hypertable_id
      WHERE ht.schema_name = 'public'
      GROUP BY ht.table_name, ht.time_column_name, ht.schema_name
      ORDER BY ht.table_name
    `);

    return result;
  }

  /**
   * Run migrations (if using drizzle-kit migrations)
   */
  async runMigrations(migrationFolder: string): Promise<void> {
    await migrate(this.db, { migrationsFolder: migrationFolder });
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.client.end();
  }

  /**
   * Get the underlying Drizzle database instance for advanced usage
   */
  getDb() {
    return this.db;
  }

  /**
   * Get the underlying postgres client for raw SQL operations
   */
  getClient() {
    return this.client;
  }
}
