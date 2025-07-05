import postgres from 'postgres';
import { type CryptoPrice, type CryptoPriceInsert, type OHLCVData, type OHLCVDataInsert, type MarketAnalytics, type MarketAnalyticsInsert, type Trade, type TradeInsert, type Currency, type Exchange, type TradingPair } from './schema';
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
    timeRange?: {
        start: Date;
        end: Date;
    };
    timeframe?: string;
    limit?: number;
    orderBy?: 'asc' | 'desc';
    exchanges?: string[];
}
/**
 * High-performance Drizzle ORM client for crypto financial data
 * Provides type-safe, optimized operations for TimescaleDB
 */
export declare class DrizzleClient {
    private client;
    private db;
    constructor(config: DrizzleClientConfig);
    /**
     * Initialize TimescaleDB hypertables and extensions
     */
    initialize(): Promise<void>;
    /**
     * Create TimescaleDB extension if not exists
     */
    private createTimescaleExtension;
    /**
     * Create TimescaleDB hypertables for time-series tables
     */
    private createHypertables;
    /**
     * Setup compression policies for data efficiency
     */
    private setupCompressionPolicies;
    /**
     * Setup data retention policies
     */
    private setupRetentionPolicies;
    /**
     * Insert crypto price data with conflict resolution
     */
    insertCryptoPrices(prices: CryptoPriceInsert[]): Promise<void>;
    /**
     * Get latest prices for specified coins
     */
    getLatestPrices(options?: TimeSeriesQueryOptions): Promise<CryptoPrice[]>;
    /**
     * Get distinct latest price for each coin (one per coin)
     */
    getDistinctLatestPrices(coinIds?: string[]): Promise<CryptoPrice[]>;
    /**
     * Insert OHLCV data with conflict resolution
     */
    insertOHLCVData(data: OHLCVDataInsert[]): Promise<void>;
    /**
     * Get OHLCV data with time bucketing for aggregation
     */
    getOHLCVRange(options: TimeSeriesQueryOptions & {
        timeframe: string;
    }): Promise<OHLCVData[]>;
    /**
     * Get custom time-bucketed OHLCV data using TimescaleDB functions
     */
    getTimeBucketedOHLCV(coinId: string, bucketInterval: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<any[]>;
    /**
     * Insert market analytics data
     */
    insertMarketAnalytics(analytics: MarketAnalyticsInsert): Promise<void>;
    /**
     * Get market summary for a time range
     */
    getMarketSummary(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<MarketAnalytics | null>;
    /**
     * Insert individual trades
     */
    insertTrades(trades: TradeInsert[]): Promise<void>;
    /**
     * Get recent trades for analysis
     */
    getRecentTrades(options: TimeSeriesQueryOptions): Promise<Trade[]>;
    /**
     * Get all active currencies
     */
    getCurrencies(): Promise<Currency[]>;
    /**
     * Get all active exchanges
     */
    getExchanges(): Promise<Exchange[]>;
    /**
     * Get all active trading pairs
     */
    getTradingPairs(): Promise<TradingPair[]>;
    /**
     * Execute custom SQL query with TimescaleDB functions
     */
    executeCustomQuery(sqlQuery: string): Promise<any[]>;
    /**
     * Get hypertable information
     */
    getHypertableInfo(): Promise<any[]>;
    /**
     * Run migrations (if using drizzle-kit migrations)
     */
    runMigrations(migrationFolder: string): Promise<void>;
    /**
     * Close database connections
     */
    close(): Promise<void>;
    /**
     * Get the underlying Drizzle database instance for advanced usage
     */
    getDb(): import("drizzle-orm/postgres-js").PostgresJsDatabase<Record<string, unknown>>;
    /**
     * Get the underlying postgres client for raw SQL operations
     */
    getClient(): postgres.Sql<{}>;
}
