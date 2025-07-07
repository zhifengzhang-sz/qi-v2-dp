// lib/src/database/crypto-dsl.ts
// Domain-Specific Language (DSL) for crypto financial operations
// High-level interface that wraps the low-level Drizzle client

import type { DrizzleClient, TimeSeriesQueryOptions } from "./drizzle-client";
import type {
  CryptoPrice,
  CryptoPriceInsert,
  Currency,
  Exchange,
  MarketAnalytics,
  OHLCVData,
  OHLCVDataInsert,
  Trade,
} from "./schema";

// =============================================================================
// DSL TYPES - Domain-specific data structures
// =============================================================================

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
  timeframe: string; // '1m', '5m', '1h', '1d'
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
  latest?: boolean; // Get only latest price per coin
}

/**
 * OHLCV query parameters
 */
export interface OHLCVQuery extends PriceQuery {
  timeframe: string; // '1m', '5m', '1h', '1d', '1w'
  bucketInterval?: string; // For custom time bucketing: '5 minutes', '1 hour'
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
  topGainers: Array<{ symbol: string; change24h: number }>;
  topLosers: Array<{ symbol: string; change24h: number }>;
  fearGreedIndex?: number;
}

// =============================================================================
// CRYPTO FINANCIAL DSL CLASS
// =============================================================================

/**
 * High-level DSL for crypto financial operations
 * Provides domain-specific methods that abstract the database complexity
 */
export class CryptoFinancialDSL {
  constructor(private client: DrizzleClient) {}

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  /**
   * Initialize the database with TimescaleDB hypertables
   */
  async initialize(): Promise<void> {
    await this.client.initialize();
  }

  // =============================================================================
  // PRICE DATA OPERATIONS (DSL Level)
  // =============================================================================

  /**
   * Store price data from external APIs
   */
  async storePrices(prices: PriceDataInput[]): Promise<void> {
    const transformedPrices: CryptoPriceInsert[] = prices.map((price) => ({
      time: new Date(),
      coinId: price.coinId,
      symbol: price.symbol.toUpperCase(),
      usdPrice: price.usdPrice?.toString(),
      btcPrice: price.btcPrice?.toString(),
      ethPrice: price.ethPrice?.toString(),
      marketCap: price.marketCap?.toString(),
      volume24h: price.volume24h?.toString(),
      change24h: price.change24h?.toString(),
      change7d: price.change7d?.toString(),
      lastUpdated: price.lastUpdated,
      source: "api", // Default source
    }));

    await this.client.insertCryptoPrices(transformedPrices);
  }

  /**
   * Get latest prices for specified coins
   */
  async getLatestPrices(query: PriceQuery): Promise<CryptoPrice[]> {
    const options: TimeSeriesQueryOptions = {
      symbols: query.symbols?.map((s) => s.toUpperCase()),
      coinIds: query.coinIds,
      timeRange: query.timeRange
        ? {
            start: new Date(query.timeRange.start),
            end: new Date(query.timeRange.end),
          }
        : undefined,
      limit: query.limit,
    };

    if (query.latest) {
      return await this.client.getDistinctLatestPrices(query.coinIds);
    }

    return await this.client.getLatestPrices(options);
  }

  /**
   * Get current price for a single coin (convenience method)
   */
  async getCurrentPrice(coinIdOrSymbol: string): Promise<number | null> {
    const isSymbol = coinIdOrSymbol.length <= 10 && coinIdOrSymbol === coinIdOrSymbol.toUpperCase();

    const query: PriceQuery = {
      [isSymbol ? "symbols" : "coinIds"]: [coinIdOrSymbol],
      latest: true,
      limit: 1,
    };

    const prices = await this.getLatestPrices(query);
    return prices[0]?.usdPrice ? Number.parseFloat(prices[0].usdPrice) : null;
  }

  // =============================================================================
  // OHLCV DATA OPERATIONS (DSL Level)
  // =============================================================================

  /**
   * Store OHLCV candlestick data
   */
  async storeOHLCV(data: OHLCVInput[]): Promise<void> {
    const transformedData: OHLCVDataInsert[] = data.map((item) => ({
      time: typeof item.timestamp === "number" ? new Date(item.timestamp) : item.timestamp,
      coinId: item.coinId,
      symbol: item.symbol.toUpperCase(),
      timeframe: item.timeframe,
      open: item.open.toString(),
      high: item.high.toString(),
      low: item.low.toString(),
      close: item.close.toString(),
      volume: item.volume.toString(),
      trades: item.trades,
      source: "api",
    }));

    await this.client.insertOHLCVData(transformedData);
  }

  /**
   * Get OHLCV data for technical analysis
   */
  async getOHLCV(query: OHLCVQuery): Promise<OHLCVData[]> {
    const options: TimeSeriesQueryOptions & { timeframe: string } = {
      symbols: query.symbols?.map((s) => s.toUpperCase()),
      coinIds: query.coinIds,
      timeframe: query.timeframe,
      timeRange: query.timeRange
        ? {
            start: new Date(query.timeRange.start),
            end: new Date(query.timeRange.end),
          }
        : undefined,
      limit: query.limit,
    };

    return await this.client.getOHLCVRange(options);
  }

  /**
   * Get time-bucketed OHLCV data (e.g., 5-minute candles from 1-minute data)
   */
  async getTimeBucketedOHLCV(
    coinId: string,
    bucketInterval: string,
    timeRange: { start: Date | string; end: Date | string },
  ): Promise<any[]> {
    return await this.client.getTimeBucketedOHLCV(coinId, bucketInterval, {
      start: new Date(timeRange.start),
      end: new Date(timeRange.end),
    });
  }

  // =============================================================================
  // MARKET ANALYTICS OPERATIONS (DSL Level)
  // =============================================================================

  /**
   * Store market analytics data
   */
  async storeMarketAnalytics(analytics: MarketAnalyticsInput): Promise<void> {
    const transformedAnalytics = {
      time: analytics.timestamp || new Date(),
      totalMarketCap: analytics.totalMarketCap?.toString(),
      totalVolume: analytics.totalVolume?.toString(),
      btcDominance: analytics.btcDominance?.toString(),
      ethDominance: analytics.ethDominance?.toString(),
      defiMarketCap: analytics.defiMarketCap?.toString(),
      nftVolume: analytics.nftVolume?.toString(),
      activeCryptocurrencies: analytics.activeCryptocurrencies,
      activeExchanges: analytics.activeExchanges,
      fearGreedIndex: analytics.fearGreedIndex,
      source: "api",
    };

    await this.client.insertMarketAnalytics(transformedAnalytics);
  }

  /**
   * Get comprehensive market summary
   */
  async getMarketSummary(timeRange?: { start: Date; end: Date }): Promise<MarketSummary | null> {
    const analytics = await this.client.getMarketSummary(timeRange);
    if (!analytics) return null;

    // Get top gainers and losers
    const recentPrices = await this.getLatestPrices({
      limit: 100,
      timeRange: timeRange || {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        end: new Date(),
      },
    });

    const sortedByChange = recentPrices
      .filter((p) => p.change24h)
      .map((p) => ({
        symbol: p.symbol,
        change24h: Number.parseFloat(p.change24h!),
      }))
      .sort((a, b) => b.change24h - a.change24h);

    return {
      timestamp: analytics.time,
      totalMarketCap: Number.parseFloat(analytics.totalMarketCap || "0"),
      totalVolume: Number.parseFloat(analytics.totalVolume || "0"),
      btcDominance: Number.parseFloat(analytics.btcDominance || "0"),
      activeCoins: analytics.activeCryptocurrencies || 0,
      topGainers: sortedByChange.slice(0, 10),
      topLosers: sortedByChange.slice(-10).reverse(),
      fearGreedIndex: analytics.fearGreedIndex || undefined,
    };
  }

  // =============================================================================
  // ADVANCED ANALYTICS (DSL Level)
  // =============================================================================

  /**
   * Detect price anomalies (significant price movements)
   */
  async detectPriceAnomalies(threshold = 10): Promise<CryptoPrice[]> {
    const query = `
      SELECT *
      FROM crypto_prices
      WHERE time > NOW() - INTERVAL '1 hour'
        AND ABS(COALESCE(change_24h::numeric, 0)) > ${threshold}
      ORDER BY ABS(COALESCE(change_24h::numeric, 0)) DESC
      LIMIT 50
    `;

    return await this.client.executeCustomQuery(query);
  }

  /**
   * Calculate moving averages using TimescaleDB
   */
  async calculateSMA(coinId: string, period: number, window = 100): Promise<any[]> {
    const query = `
      SELECT 
        time,
        coin_id,
        symbol,
        usd_price,
        AVG(usd_price::numeric) OVER (
          PARTITION BY coin_id 
          ORDER BY time 
          ROWS BETWEEN ${period - 1} PRECEDING AND CURRENT ROW
        ) as sma_${period}
      FROM crypto_prices
      WHERE coin_id = '${coinId}'
        AND usd_price IS NOT NULL
      ORDER BY time DESC
      LIMIT ${window}
    `;

    return await this.client.executeCustomQuery(query);
  }

  /**
   * Get volume-weighted average price (VWAP)
   */
  async getVWAP(coinId: string, timeRange: { start: Date; end: Date }): Promise<number | null> {
    const query = `
      SELECT 
        SUM(usd_price::numeric * volume_24h::numeric) / SUM(volume_24h::numeric) as vwap
      FROM crypto_prices
      WHERE coin_id = '${coinId}'
        AND time >= '${timeRange.start.toISOString()}'
        AND time <= '${timeRange.end.toISOString()}'
        AND usd_price IS NOT NULL
        AND volume_24h IS NOT NULL
        AND volume_24h::numeric > 0
    `;

    const result = await this.client.executeCustomQuery(query);
    return result[0]?.vwap ? Number.parseFloat(result[0].vwap) : null;
  }

  // =============================================================================
  // DATA HEALTH & MONITORING (DSL Level)
  // =============================================================================

  /**
   * Get data health status
   */
  async getDataHealth(): Promise<any> {
    const hypertables = await this.client.getHypertableInfo();

    // Get recent data counts
    const recentPrices = await this.getLatestPrices({
      timeRange: {
        start: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        end: new Date(),
      },
    });

    const currencies = await this.client.getCurrencies();

    return {
      hypertables,
      dataHealth: {
        recentPriceUpdates: recentPrices.length,
        activeCurrencies: currencies.length,
        lastUpdateTime: recentPrices[0]?.time,
      },
    };
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.client.close();
  }

  /**
   * Get the underlying client for advanced operations
   */
  getClient(): DrizzleClient {
    return this.client;
  }
}
