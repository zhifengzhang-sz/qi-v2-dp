// lib/src/database/drizzle-client.ts
// Drizzle ORM client for crypto financial time-series data
// High-performance low-level module with TimescaleDB integration
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { sql, eq, and, gte, lte, desc, asc, inArray } from 'drizzle-orm';
import { schema, } from './schema';
/**
 * High-performance Drizzle ORM client for crypto financial data
 * Provides type-safe, optimized operations for TimescaleDB
 */
export class DrizzleClient {
    client;
    db;
    constructor(config) {
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
    async initialize() {
        await this.createTimescaleExtension();
        await this.createHypertables();
        await this.setupCompressionPolicies();
        await this.setupRetentionPolicies();
    }
    /**
     * Create TimescaleDB extension if not exists
     */
    async createTimescaleExtension() {
        await this.db.execute(sql `CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);
    }
    /**
     * Create TimescaleDB hypertables for time-series tables
     */
    async createHypertables() {
        // Create hypertable for crypto_prices
        await this.db.execute(sql `
      SELECT create_hypertable('crypto_prices', 'time',
        chunk_time_interval => INTERVAL '1 day',
        if_not_exists => TRUE
      );
    `);
        // Create hypertable for ohlcv_data
        await this.db.execute(sql `
      SELECT create_hypertable('ohlcv_data', 'time',
        chunk_time_interval => INTERVAL '1 day', 
        if_not_exists => TRUE
      );
    `);
        // Create hypertable for trades
        await this.db.execute(sql `
      SELECT create_hypertable('trades', 'time',
        chunk_time_interval => INTERVAL '1 hour',
        if_not_exists => TRUE
      );
    `);
        // Create hypertable for market_analytics
        await this.db.execute(sql `
      SELECT create_hypertable('market_analytics', 'time',
        chunk_time_interval => INTERVAL '1 hour',
        if_not_exists => TRUE
      );
    `);
    }
    /**
     * Setup compression policies for data efficiency
     */
    async setupCompressionPolicies() {
        const policies = [
            { table: 'crypto_prices', interval: '7 days' },
            { table: 'ohlcv_data', interval: '7 days' },
            { table: 'trades', interval: '3 days' },
            { table: 'market_analytics', interval: '3 days' },
        ];
        for (const policy of policies) {
            await this.db.execute(sql `
        SELECT add_compression_policy(${policy.table}, INTERVAL ${policy.interval})
        ON CONFLICT (hypertable_id) DO NOTHING;
      `);
        }
    }
    /**
     * Setup data retention policies
     */
    async setupRetentionPolicies() {
        const policies = [
            { table: 'crypto_prices', retention: '2 years' },
            { table: 'ohlcv_data', retention: '2 years' },
            { table: 'trades', retention: '1 year' },
            { table: 'market_analytics', retention: '1 year' },
        ];
        for (const policy of policies) {
            await this.db.execute(sql `
        SELECT add_retention_policy(${policy.table}, INTERVAL ${policy.retention})
        ON CONFLICT (hypertable_id) DO NOTHING;
      `);
        }
    }
    // =============================================================================
    // CRYPTO PRICES OPERATIONS
    // =============================================================================
    /**
     * Insert crypto price data with conflict resolution
     */
    async insertCryptoPrices(prices) {
        if (prices.length === 0)
            return;
        await this.db
            .insert(schema.cryptoPrices)
            .values(prices)
            .onConflictDoUpdate({
            target: [schema.cryptoPrices.coinId, schema.cryptoPrices.time],
            set: {
                usdPrice: sql `excluded.usd_price`,
                btcPrice: sql `excluded.btc_price`,
                ethPrice: sql `excluded.eth_price`,
                marketCap: sql `excluded.market_cap`,
                volume24h: sql `excluded.volume_24h`,
                change24h: sql `excluded.change_24h`,
                change7d: sql `excluded.change_7d`,
                lastUpdated: sql `excluded.last_updated`,
                updatedAt: sql `NOW()`,
            },
        });
    }
    /**
     * Get latest prices for specified coins
     */
    async getLatestPrices(options = {}) {
        const conditions = [];
        // Build where conditions
        if (options.coinIds?.length) {
            conditions.push(inArray(schema.cryptoPrices.coinId, options.coinIds));
        }
        if (options.symbols?.length) {
            conditions.push(inArray(schema.cryptoPrices.symbol, options.symbols));
        }
        if (options.timeRange) {
            conditions.push(gte(schema.cryptoPrices.time, options.timeRange.start), lte(schema.cryptoPrices.time, options.timeRange.end));
        }
        // Build the query step by step
        const baseQuery = this.db.select().from(schema.cryptoPrices);
        const withWhere = conditions.length > 0
            ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
            : baseQuery;
        const withOrder = withWhere.orderBy(desc(schema.cryptoPrices.time));
        const finalQuery = options.limit
            ? withOrder.limit(options.limit)
            : withOrder;
        return await finalQuery;
    }
    /**
     * Get distinct latest price for each coin (one per coin)
     */
    async getDistinctLatestPrices(coinIds) {
        const whereClause = coinIds?.length
            ? sql `WHERE coin_id = ANY(${coinIds})`
            : sql ``;
        const result = await this.db.execute(sql `
      SELECT DISTINCT ON (coin_id) *
      FROM crypto_prices
      ${whereClause}
      ORDER BY coin_id, time DESC
    `);
        return result;
    }
    // =============================================================================
    // OHLCV DATA OPERATIONS
    // =============================================================================
    /**
     * Insert OHLCV data with conflict resolution
     */
    async insertOHLCVData(data) {
        if (data.length === 0)
            return;
        await this.db
            .insert(schema.ohlcvData)
            .values(data)
            .onConflictDoUpdate({
            target: [schema.ohlcvData.coinId, schema.ohlcvData.timeframe, schema.ohlcvData.time],
            set: {
                open: sql `excluded.open`,
                high: sql `excluded.high`,
                low: sql `excluded.low`,
                close: sql `excluded.close`,
                volume: sql `excluded.volume`,
                trades: sql `excluded.trades`,
                vwap: sql `excluded.vwap`,
                updatedAt: sql `NOW()`,
            },
        });
    }
    /**
     * Get OHLCV data with time bucketing for aggregation
     */
    async getOHLCVRange(options) {
        const conditions = [eq(schema.ohlcvData.timeframe, options.timeframe)];
        // Build additional where conditions
        if (options.coinIds?.length) {
            conditions.push(inArray(schema.ohlcvData.coinId, options.coinIds));
        }
        if (options.symbols?.length) {
            conditions.push(inArray(schema.ohlcvData.symbol, options.symbols));
        }
        if (options.timeRange) {
            conditions.push(gte(schema.ohlcvData.time, options.timeRange.start), lte(schema.ohlcvData.time, options.timeRange.end));
        }
        // Build query step by step
        const baseQuery = this.db.select().from(schema.ohlcvData);
        const withWhere = baseQuery.where(and(...conditions));
        // Order by time
        const orderDirection = options.orderBy === 'asc' ? asc : desc;
        const withOrder = withWhere.orderBy(orderDirection(schema.ohlcvData.time));
        const finalQuery = options.limit
            ? withOrder.limit(options.limit)
            : withOrder;
        return await finalQuery;
    }
    /**
     * Get custom time-bucketed OHLCV data using TimescaleDB functions
     */
    async getTimeBucketedOHLCV(coinId, bucketInterval, timeRange) {
        const result = await this.db.execute(sql `
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
    async insertMarketAnalytics(analytics) {
        await this.db
            .insert(schema.marketAnalytics)
            .values(analytics)
            .onConflictDoUpdate({
            target: [schema.marketAnalytics.time],
            set: {
                totalMarketCap: sql `excluded.total_market_cap`,
                totalVolume: sql `excluded.total_volume`,
                btcDominance: sql `excluded.btc_dominance`,
                ethDominance: sql `excluded.eth_dominance`,
                defiMarketCap: sql `excluded.defi_market_cap`,
                nftVolume: sql `excluded.nft_volume`,
                activeCryptocurrencies: sql `excluded.active_cryptocurrencies`,
                activeExchanges: sql `excluded.active_exchanges`,
                fearGreedIndex: sql `excluded.fear_greed_index`,
                updatedAt: sql `NOW()`,
            },
        });
    }
    /**
     * Get market summary for a time range
     */
    async getMarketSummary(timeRange) {
        const baseQuery = this.db.select().from(schema.marketAnalytics);
        const withWhere = timeRange
            ? baseQuery.where(and(gte(schema.marketAnalytics.time, timeRange.start), lte(schema.marketAnalytics.time, timeRange.end)))
            : baseQuery;
        const finalQuery = withWhere
            .orderBy(desc(schema.marketAnalytics.time))
            .limit(1);
        const result = await finalQuery;
        return result[0] || null;
    }
    // =============================================================================
    // TRADES OPERATIONS
    // =============================================================================
    /**
     * Insert individual trades
     */
    async insertTrades(trades) {
        if (trades.length === 0)
            return;
        await this.db.insert(schema.trades).values(trades);
    }
    /**
     * Get recent trades for analysis
     */
    async getRecentTrades(options) {
        const conditions = [];
        // Build where conditions
        if (options.coinIds?.length) {
            conditions.push(inArray(schema.trades.coinId, options.coinIds));
        }
        if (options.symbols?.length) {
            conditions.push(inArray(schema.trades.symbol, options.symbols));
        }
        if (options.timeRange) {
            conditions.push(gte(schema.trades.time, options.timeRange.start), lte(schema.trades.time, options.timeRange.end));
        }
        // Build query step by step
        const baseQuery = this.db.select().from(schema.trades);
        const withWhere = conditions.length > 0
            ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
            : baseQuery;
        const withOrder = withWhere.orderBy(desc(schema.trades.time));
        const finalQuery = options.limit
            ? withOrder.limit(options.limit)
            : withOrder;
        return await finalQuery;
    }
    // =============================================================================
    // REFERENCE DATA OPERATIONS
    // =============================================================================
    /**
     * Get all active currencies
     */
    async getCurrencies() {
        return await this.db
            .select()
            .from(schema.currencies)
            .where(eq(schema.currencies.isActive, true))
            .orderBy(asc(schema.currencies.code));
    }
    /**
     * Get all active exchanges
     */
    async getExchanges() {
        return await this.db
            .select()
            .from(schema.exchanges)
            .where(eq(schema.exchanges.isActive, true))
            .orderBy(asc(schema.exchanges.name));
    }
    /**
     * Get all active trading pairs
     */
    async getTradingPairs() {
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
    async executeCustomQuery(sqlQuery) {
        // Security: Only allow SELECT queries
        if (!sqlQuery.trim().toLowerCase().startsWith('select')) {
            throw new Error('Only SELECT queries are allowed for custom SQL execution');
        }
        const result = await this.db.execute(sql.raw(sqlQuery));
        return result;
    }
    /**
     * Get hypertable information
     */
    async getHypertableInfo() {
        const result = await this.db.execute(sql `
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
    async runMigrations(migrationFolder) {
        await migrate(this.db, { migrationsFolder: migrationFolder });
    }
    /**
     * Close database connections
     */
    async close() {
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
