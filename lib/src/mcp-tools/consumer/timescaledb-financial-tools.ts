// lib/src/mcp-tools/timescaledb-financial-tools.ts
// MCP Tools for TimescaleDB Financial Market Data
// Uses real database schema and DSL - NO FAKE CODE

import { 
  CryptoFinancialDSL, 
  DrizzleClient,
  type PriceDataInput,
  type OHLCVInput,
  type MarketAnalyticsInput,
  type PriceQuery,
  type OHLCVQuery,
  type CryptoPrice,
  type OHLCVData,
  type MarketSummary
} from '../../base/database';

// Temporary interface until QiCore is ready
interface MCPTool {
  name: string;
  description: string;
  execute(params: any): Promise<any>;
}

/**
 * Store crypto price data MCP Tool
 */
export class StoreCryptoPricesTool implements MCPTool {
  name = "store_crypto_prices";
  description = "Store real-time cryptocurrency price data in TimescaleDB";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    prices: Array<{
      coinId: string;
      symbol: string;
      usdPrice?: number;
      btcPrice?: number;
      ethPrice?: number;
      marketCap?: number;
      volume24h?: number;
      change24h?: number;
      change7d?: number;
      exchange?: string;
    }>;
  }): Promise<any> {
    if (!params.prices || !Array.isArray(params.prices)) {
      throw new Error('prices parameter must be an array');
    }

    const priceData: PriceDataInput[] = params.prices.map(price => ({
      coinId: price.coinId,
      symbol: price.symbol,
      usdPrice: price.usdPrice,
      btcPrice: price.btcPrice,
      ethPrice: price.ethPrice,
      marketCap: price.marketCap,
      volume24h: price.volume24h,
      change24h: price.change24h,
      change7d: price.change7d,
      lastUpdated: new Date(),
      exchange: price.exchange || 'unknown',
    }));

    await this.dsl.storePrices(priceData);

    return {
      success: true,
      stored: params.prices.length,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get latest crypto prices MCP Tool
 */
export class GetLatestPricesTool implements MCPTool {
  name = "get_latest_prices";
  description = "Get latest cryptocurrency prices from TimescaleDB";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    symbols?: string[];
    coinIds?: string[];
    limit?: number;
    latest?: boolean;
  }): Promise<any> {
    const query: PriceQuery = {
      symbols: params.symbols,
      coinIds: params.coinIds,
      limit: params.limit || 100,
      latest: params.latest !== false, // Default to true
    };

    const prices = await this.dsl.getLatestPrices(query);

    return {
      success: true,
      count: prices.length,
      prices: prices.map(price => ({
        coinId: price.coinId,
        symbol: price.symbol,
        usdPrice: price.usdPrice ? parseFloat(price.usdPrice) : null,
        btcPrice: price.btcPrice ? parseFloat(price.btcPrice) : null,
        marketCap: price.marketCap ? parseFloat(price.marketCap) : null,
        volume24h: price.volume24h ? parseFloat(price.volume24h) : null,
        change24h: price.change24h ? parseFloat(price.change24h) : null,
        timestamp: price.time.toISOString(),
        lastUpdated: price.lastUpdated?.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get current price for single coin MCP Tool
 */
export class GetCurrentPriceTool implements MCPTool {
  name = "get_current_price";
  description = "Get current price for a single cryptocurrency";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    coinId?: string;
    symbol?: string;
  }): Promise<any> {
    if (!params.coinId && !params.symbol) {
      throw new Error('Either coinId or symbol must be provided');
    }

    const identifier = params.coinId || params.symbol!;
    const price = await this.dsl.getCurrentPrice(identifier);

    return {
      success: true,
      identifier,
      price,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Store OHLCV data MCP Tool
 */
export class StoreOHLCVDataTool implements MCPTool {
  name = "store_ohlcv_data";
  description = "Store OHLCV candlestick data in TimescaleDB";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    data: Array<{
      coinId: string;
      symbol: string;
      timeframe: string;
      timestamp: number | string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      trades?: number;
      exchange?: string;
    }>;
  }): Promise<any> {
    if (!params.data || !Array.isArray(params.data)) {
      throw new Error('data parameter must be an array');
    }

    const ohlcvData: OHLCVInput[] = params.data.map(item => ({
      coinId: item.coinId,
      symbol: item.symbol,
      timeframe: item.timeframe,
      timestamp: typeof item.timestamp === 'string' ? new Date(item.timestamp) : new Date(item.timestamp),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      trades: item.trades,
      exchange: item.exchange || 'unknown',
    }));

    await this.dsl.storeOHLCV(ohlcvData);

    return {
      success: true,
      stored: params.data.length,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get OHLCV data MCP Tool
 */
export class GetOHLCVDataTool implements MCPTool {
  name = "get_ohlcv_data";
  description = "Get OHLCV candlestick data from TimescaleDB";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    symbols?: string[];
    coinIds?: string[];
    timeframe: string;
    timeRange?: {
      start: string | number;
      end: string | number;
    };
    limit?: number;
  }): Promise<any> {
    if (!params.timeframe) {
      throw new Error('timeframe parameter is required');
    }

    const query: OHLCVQuery = {
      symbols: params.symbols,
      coinIds: params.coinIds,
      timeframe: params.timeframe,
      timeRange: params.timeRange ? {
        start: new Date(params.timeRange.start),
        end: new Date(params.timeRange.end),
      } : undefined,
      limit: params.limit || 100,
    };

    const ohlcvData = await this.dsl.getOHLCV(query);

    return {
      success: true,
      count: ohlcvData.length,
      timeframe: params.timeframe,
      data: ohlcvData.map(item => ({
        coinId: item.coinId,
        symbol: item.symbol,
        timestamp: item.time.toISOString(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseFloat(item.volume),
        trades: item.trades,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Store market analytics MCP Tool
 */
export class StoreMarketAnalyticsTool implements MCPTool {
  name = "store_market_analytics";
  description = "Store global market analytics data in TimescaleDB";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    totalMarketCap?: number;
    totalVolume?: number;
    btcDominance?: number;
    ethDominance?: number;
    defiMarketCap?: number;
    nftVolume?: number;
    activeCryptocurrencies?: number;
    activeExchanges?: number;
    fearGreedIndex?: number;
    timestamp?: string;
  }): Promise<any> {
    const analytics: MarketAnalyticsInput = {
      timestamp: params.timestamp ? new Date(params.timestamp) : new Date(),
      totalMarketCap: params.totalMarketCap,
      totalVolume: params.totalVolume,
      btcDominance: params.btcDominance,
      ethDominance: params.ethDominance,
      defiMarketCap: params.defiMarketCap,
      nftVolume: params.nftVolume,
      activeCryptocurrencies: params.activeCryptocurrencies,
      activeExchanges: params.activeExchanges,
      fearGreedIndex: params.fearGreedIndex,
    };

    await this.dsl.storeMarketAnalytics(analytics);

    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get market summary MCP Tool
 */
export class GetMarketSummaryTool implements MCPTool {
  name = "get_market_summary";
  description = "Get comprehensive market summary from TimescaleDB";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    timeRange?: {
      start: string | number;
      end: string | number;
    };
  }): Promise<any> {
    const timeRange = params.timeRange ? {
      start: new Date(params.timeRange.start),
      end: new Date(params.timeRange.end),
    } : undefined;

    const summary = await this.dsl.getMarketSummary(timeRange);

    if (!summary) {
      return {
        success: false,
        message: 'No market data available for the specified time range',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      summary: {
        totalMarketCap: summary.totalMarketCap,
        totalVolume: summary.totalVolume,
        btcDominance: summary.btcDominance,
        activeCoins: summary.activeCoins,
        topGainers: summary.topGainers,
        topLosers: summary.topLosers,
        fearGreedIndex: summary.fearGreedIndex,
        timestamp: summary.timestamp.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Calculate Simple Moving Average MCP Tool
 */
export class CalculateSMATool implements MCPTool {
  name = "calculate_sma";
  description = "Calculate Simple Moving Average for cryptocurrency price data";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    coinId: string;
    period: number;
    window?: number;
  }): Promise<any> {
    if (!params.coinId) {
      throw new Error('coinId parameter is required');
    }
    if (!params.period || params.period <= 0) {
      throw new Error('period parameter must be a positive number');
    }

    const smaData = await this.dsl.calculateSMA(
      params.coinId,
      params.period,
      params.window || 100
    );

    return {
      success: true,
      coinId: params.coinId,
      period: params.period,
      dataPoints: smaData.length,
      data: smaData,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Detect price anomalies MCP Tool
 */
export class DetectPriceAnomalies implements MCPTool {
  name = "detect_price_anomalies";
  description = "Detect cryptocurrency price anomalies based on percentage threshold";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {
    threshold?: number;
  }): Promise<any> {
    const threshold = params.threshold || 10; // Default 10% change
    const anomalies = await this.dsl.detectPriceAnomalies(threshold);

    return {
      success: true,
      threshold,
      count: anomalies.length,
      anomalies: anomalies.map(anomaly => ({
        coinId: anomaly.coinId,
        symbol: anomaly.symbol,
        usdPrice: anomaly.usdPrice ? parseFloat(anomaly.usdPrice) : null,
        change24h: anomaly.change24h ? parseFloat(anomaly.change24h) : null,
        timestamp: anomaly.time.toISOString(),
      })),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get data health status MCP Tool
 */
export class GetDataHealthTool implements MCPTool {
  name = "get_data_health";
  description = "Get TimescaleDB data health and status information";

  constructor(private dsl: CryptoFinancialDSL) {}

  async execute(params: {}): Promise<any> {
    const health = await this.dsl.getDataHealth();

    return {
      success: true,
      health: {
        hypertables: health.hypertables.map(ht => ({
          tableName: ht.tableName,
          timeColumn: ht.timeColumn,
          chunks: ht.chunks,
          size: ht.size,
        })),
        dataStatus: {
          recentPriceUpdates: health.dataHealth.recentPriceUpdates,
          activeCurrencies: health.dataHealth.activeCurrencies,
          lastUpdateTime: health.dataHealth.lastUpdateTime?.toISOString(),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * TimescaleDB Financial Market Data MCP Tool Factory
 */
export class TimescaleDBFinancialTools {
  private dsl: CryptoFinancialDSL;

  constructor(connectionString: string) {
    const client = new DrizzleClient({
      connectionString,
      poolConfig: {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    });
    this.dsl = new CryptoFinancialDSL(client);
  }

  /**
   * Initialize TimescaleDB hypertables
   */
  async initialize(): Promise<void> {
    await this.dsl.initialize();
  }

  /**
   * Get all available MCP tools
   */
  getAllTools(): MCPTool[] {
    return [
      new StoreCryptoPricesTool(this.dsl),
      new GetLatestPricesTool(this.dsl),
      new GetCurrentPriceTool(this.dsl),
      new StoreOHLCVDataTool(this.dsl),
      new GetOHLCVDataTool(this.dsl),
      new StoreMarketAnalyticsTool(this.dsl),
      new GetMarketSummaryTool(this.dsl),
      new CalculateSMATool(this.dsl),
      new DetectPriceAnomalies(this.dsl),
      new GetDataHealthTool(this.dsl),
    ];
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.getAllTools().find(tool => tool.name === name);
  }

  /**
   * Get DSL instance for advanced operations
   */
  getDSL(): CryptoFinancialDSL {
    return this.dsl;
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    await this.dsl.close();
  }
}