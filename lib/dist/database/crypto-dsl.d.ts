import { DrizzleClient } from './drizzle-client';
import type { CryptoPrice, OHLCVData } from './schema';
/**
 * Price data from CoinGecko API format
 */
export interface PriceDataInput {
    coinId: string;
    symbol: string;
    usdPrice?: number;
    btcPrice?: number;
    ethPrice?: number;
    marketCap?: number;
    volume24h?: number;
    change24h?: number;
    change7d?: number;
    lastUpdated?: Date;
    exchange?: string;
}
/**
 * OHLCV data input format
 */
export interface OHLCVInput {
    coinId: string;
    symbol: string;
    timeframe: string;
    timestamp: number | Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    trades?: number;
    exchange?: string;
}
/**
 * Market analytics input format
 */
export interface MarketAnalyticsInput {
    timestamp?: Date;
    totalMarketCap?: number;
    totalVolume?: number;
    btcDominance?: number;
    ethDominance?: number;
    defiMarketCap?: number;
    nftVolume?: number;
    activeCryptocurrencies?: number;
    activeExchanges?: number;
    fearGreedIndex?: number;
}
/**
 * Price query parameters
 */
export interface PriceQuery {
    symbols?: string[];
    coinIds?: string[];
    timeRange?: {
        start: Date | string | number;
        end: Date | string | number;
    };
    limit?: number;
    latest?: boolean;
}
/**
 * OHLCV query parameters
 */
export interface OHLCVQuery extends PriceQuery {
    timeframe: string;
    bucketInterval?: string;
}
/**
 * Technical analysis result
 */
export interface TechnicalAnalysis {
    symbol: string;
    timeframe: string;
    sma?: number[];
    ema?: number[];
    rsi?: number;
    macd?: {
        macd: number;
        signal: number;
        histogram: number;
    };
    bollinger?: {
        upper: number;
        middle: number;
        lower: number;
    };
}
/**
 * Market summary result
 */
export interface MarketSummary {
    timestamp: Date;
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    activeCoins: number;
    topGainers: Array<{
        symbol: string;
        change24h: number;
    }>;
    topLosers: Array<{
        symbol: string;
        change24h: number;
    }>;
    fearGreedIndex?: number;
}
/**
 * High-level DSL for crypto financial operations
 * Provides domain-specific methods that abstract the database complexity
 */
export declare class CryptoFinancialDSL {
    private client;
    constructor(client: DrizzleClient);
    /**
     * Initialize the database with TimescaleDB hypertables
     */
    initialize(): Promise<void>;
    /**
     * Store price data from external APIs
     */
    storePrices(prices: PriceDataInput[]): Promise<void>;
    /**
     * Get latest prices for specified coins
     */
    getLatestPrices(query: PriceQuery): Promise<CryptoPrice[]>;
    /**
     * Get current price for a single coin (convenience method)
     */
    getCurrentPrice(coinIdOrSymbol: string): Promise<number | null>;
    /**
     * Store OHLCV candlestick data
     */
    storeOHLCV(data: OHLCVInput[]): Promise<void>;
    /**
     * Get OHLCV data for technical analysis
     */
    getOHLCV(query: OHLCVQuery): Promise<OHLCVData[]>;
    /**
     * Get time-bucketed OHLCV data (e.g., 5-minute candles from 1-minute data)
     */
    getTimeBucketedOHLCV(coinId: string, bucketInterval: string, timeRange: {
        start: Date | string;
        end: Date | string;
    }): Promise<any[]>;
    /**
     * Store market analytics data
     */
    storeMarketAnalytics(analytics: MarketAnalyticsInput): Promise<void>;
    /**
     * Get comprehensive market summary
     */
    getMarketSummary(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<MarketSummary | null>;
    /**
     * Detect price anomalies (significant price movements)
     */
    detectPriceAnomalies(threshold?: number): Promise<CryptoPrice[]>;
    /**
     * Calculate moving averages using TimescaleDB
     */
    calculateSMA(coinId: string, period: number, window?: number): Promise<any[]>;
    /**
     * Get volume-weighted average price (VWAP)
     */
    getVWAP(coinId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<number | null>;
    /**
     * Get data health status
     */
    getDataHealth(): Promise<any>;
    /**
     * Close database connections
     */
    close(): Promise<void>;
    /**
     * Get the underlying client for advanced operations
     */
    getClient(): DrizzleClient;
}
