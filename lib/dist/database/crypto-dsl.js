// lib/src/database/crypto-dsl.ts
// Domain-Specific Language (DSL) for crypto financial operations
// High-level interface that wraps the low-level Drizzle client
// =============================================================================
// CRYPTO FINANCIAL DSL CLASS
// =============================================================================
/**
 * High-level DSL for crypto financial operations
 * Provides domain-specific methods that abstract the database complexity
 */
export class CryptoFinancialDSL {
    client;
    constructor(client) {
        this.client = client;
    }
    // =============================================================================
    // INITIALIZATION & SETUP
    // =============================================================================
    /**
     * Initialize the database with TimescaleDB hypertables
     */
    async initialize() {
        await this.client.initialize();
    }
    // =============================================================================
    // PRICE DATA OPERATIONS (DSL Level)
    // =============================================================================
    /**
     * Store price data from external APIs
     */
    async storePrices(prices) {
        const transformedPrices = prices.map(price => ({
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
            source: 'api', // Default source
        }));
        await this.client.insertCryptoPrices(transformedPrices);
    }
    /**
     * Get latest prices for specified coins
     */
    async getLatestPrices(query) {
        const options = {
            symbols: query.symbols?.map(s => s.toUpperCase()),
            coinIds: query.coinIds,
            timeRange: query.timeRange ? {
                start: new Date(query.timeRange.start),
                end: new Date(query.timeRange.end),
            } : undefined,
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
    async getCurrentPrice(coinIdOrSymbol) {
        const isSymbol = coinIdOrSymbol.length <= 10 && coinIdOrSymbol === coinIdOrSymbol.toUpperCase();
        const query = {
            [isSymbol ? 'symbols' : 'coinIds']: [coinIdOrSymbol],
            latest: true,
            limit: 1,
        };
        const prices = await this.getLatestPrices(query);
        return prices[0]?.usdPrice ? parseFloat(prices[0].usdPrice) : null;
    }
    // =============================================================================
    // OHLCV DATA OPERATIONS (DSL Level)
    // =============================================================================
    /**
     * Store OHLCV candlestick data
     */
    async storeOHLCV(data) {
        const transformedData = data.map(item => ({
            time: typeof item.timestamp === 'number' ? new Date(item.timestamp) : item.timestamp,
            coinId: item.coinId,
            symbol: item.symbol.toUpperCase(),
            timeframe: item.timeframe,
            open: item.open.toString(),
            high: item.high.toString(),
            low: item.low.toString(),
            close: item.close.toString(),
            volume: item.volume.toString(),
            trades: item.trades,
            source: 'api',
        }));
        await this.client.insertOHLCVData(transformedData);
    }
    /**
     * Get OHLCV data for technical analysis
     */
    async getOHLCV(query) {
        const options = {
            symbols: query.symbols?.map(s => s.toUpperCase()),
            coinIds: query.coinIds,
            timeframe: query.timeframe,
            timeRange: query.timeRange ? {
                start: new Date(query.timeRange.start),
                end: new Date(query.timeRange.end),
            } : undefined,
            limit: query.limit,
        };
        return await this.client.getOHLCVRange(options);
    }
    /**
     * Get time-bucketed OHLCV data (e.g., 5-minute candles from 1-minute data)
     */
    async getTimeBucketedOHLCV(coinId, bucketInterval, timeRange) {
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
    async storeMarketAnalytics(analytics) {
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
            source: 'api',
        };
        await this.client.insertMarketAnalytics(transformedAnalytics);
    }
    /**
     * Get comprehensive market summary
     */
    async getMarketSummary(timeRange) {
        const analytics = await this.client.getMarketSummary(timeRange);
        if (!analytics)
            return null;
        // Get top gainers and losers
        const recentPrices = await this.getLatestPrices({
            limit: 100,
            timeRange: timeRange || {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
                end: new Date(),
            },
        });
        const sortedByChange = recentPrices
            .filter(p => p.change24h)
            .map(p => ({
            symbol: p.symbol,
            change24h: parseFloat(p.change24h),
        }))
            .sort((a, b) => b.change24h - a.change24h);
        return {
            timestamp: analytics.time,
            totalMarketCap: parseFloat(analytics.totalMarketCap || '0'),
            totalVolume: parseFloat(analytics.totalVolume || '0'),
            btcDominance: parseFloat(analytics.btcDominance || '0'),
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
    async detectPriceAnomalies(threshold = 10) {
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
    async calculateSMA(coinId, period, window = 100) {
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
    async getVWAP(coinId, timeRange) {
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
        return result[0]?.vwap ? parseFloat(result[0].vwap) : null;
    }
    // =============================================================================
    // DATA HEALTH & MONITORING (DSL Level)
    // =============================================================================
    /**
     * Get data health status
     */
    async getDataHealth() {
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
    async close() {
        await this.client.close();
    }
    /**
     * Get the underlying client for advanced operations
     */
    getClient() {
        return this.client;
    }
}
