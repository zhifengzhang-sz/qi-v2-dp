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
        defi_market_cap: number | null;
        active_cryptocurrencies: number | null;
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
    interval?: string;
}
export interface TimescaleMarketAnalytics {
    time: Date;
    total_market_cap?: number;
    total_volume?: number;
    btc_dominance?: number;
    eth_dominance?: number;
    defi_market_cap?: number;
    active_cryptocurrencies?: number;
}
export interface TimescaleQueryOptions {
    symbols?: string[];
    timeRange?: {
        start: Date;
        end: Date;
    };
    interval?: string;
    limit?: number;
}
/**
 * High-performance TimescaleDB client using Kysely
 * Provides optimized operations for crypto time-series data
 */
export declare class TimescaleClient {
    private db;
    private pool;
    constructor(connectionString: string, poolConfig?: {
        max?: number;
        idleTimeoutMillis?: number;
        connectionTimeoutMillis?: number;
    });
    /**
     * Initialize TimescaleDB hypertables and policies
     */
    initialize(): Promise<void>;
    /**
     * Create TimescaleDB hypertables for crypto data
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
     * Create optimized indexes for query performance
     */
    private createIndexes;
    /**
     * Insert crypto price data with high-performance bulk operations
     */
    insertPrices(prices: TimescaleCryptoPrice[]): Promise<void>;
    /**
     * Insert OHLCV data with conflict resolution
     */
    insertOHLCV(ohlcvData: TimescaleOHLCV[]): Promise<void>;
    /**
     * Insert market analytics data
     */
    insertMarketAnalytics(analytics: TimescaleMarketAnalytics): Promise<void>;
    /**
     * Get latest prices with TimescaleDB optimizations
     */
    getLatestPrices(options?: TimescaleQueryOptions): Promise<TimescaleCryptoPrice[]>;
    /**
     * Get OHLCV data with time bucketing for aggregation
     */
    getOHLCVRange(options: TimescaleQueryOptions): Promise<any[]>;
    /**
     * Get market summary with aggregations
     */
    getMarketSummary(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<any>;
    /**
     * Execute custom SQL with TimescaleDB functions
     */
    executeCustomQuery(sqlQuery: string): Promise<any[]>;
    /**
     * Get hypertable information
     */
    listHypertables(): Promise<any[]>;
    /**
     * Cleanup and close connections
     */
    destroy(): Promise<void>;
}
