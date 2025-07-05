// lib/src/coingecko/coingecko-dsl.ts
// Domain-Specific Language (DSL) for CoinGecko crypto market operations
// Direct MCP integration without redundant wrapper layer
//
// FINANCIAL MARKET DSL FEATURES:
// • Date-range OHLCV queries with ticker/symbol resolution
// • Real-time streaming for OHLCV and Level 1 data
// • Level 1 market data (best bid/ask spreads)
// • Exchange/market parameter support
// • Proper financial data structures
//
// ATTRIBUTION REQUIREMENT:
// Data provided by CoinGecko (https://www.coingecko.com)
// Powered by CoinGecko API (https://www.coingecko.com/en/api/)
//
// This implementation complies with CoinGecko's attribution requirements.
// All data sources include proper attribution as required by CoinGecko's terms.

import { MCPClient, type MCPToolResult } from '@qicore/agent-lib';
import { OfficialCoinGeckoMCPLauncher, type CoinGeckoMCPConfig } from '../../../mcp-launchers/coingecko-mcp-launcher';

// =============================================================================
// DSL TYPES - Domain-specific data structures
// =============================================================================

/**
 * Simplified price data for domain operations
 */
export interface CryptoPriceData {
  coinId: string;
  symbol: string;
  name?: string;
  usdPrice: number;
  btcPrice?: number;
  ethPrice?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  change7d?: number;
  lastUpdated: Date;
  source: 'coingecko';
  attribution: 'Data provided by CoinGecko (https://www.coingecko.com)';
}

/**
 * Simplified OHLCV data for domain operations
 */
export interface CryptoOHLCVData {
  coinId: string;
  symbol?: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  source: 'coingecko';
  attribution: 'Data provided by CoinGecko (https://www.coingecko.com)';
}

/**
 * Market analytics data structure
 */
export interface CryptoMarketAnalytics {
  timestamp: Date;
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance?: number;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChange24h: number;
  source: 'coingecko';
  attribution: 'Data provided by CoinGecko (https://www.coingecko.com)';
}

/**
 * Top performer data
 */
export interface TopPerformer {
  coinId: string;
  symbol: string;
  name: string;
  change24h: number;
  currentPrice: number;
  marketCap: number;
  rank: number;
}

/**
 * Market summary for domain operations
 */
export interface CryptoMarketSummary {
  timestamp: Date;
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  activeCoins: number;
  topGainers: TopPerformer[];
  topLosers: TopPerformer[];
  fearGreedIndex?: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
}

/**
 * Level 1 market data (best bid/ask)
 */
export interface Level1Data {
  ticker: string;
  timestamp: Date;
  bestBid: number;
  bestAsk: number;
  bidSize?: number;
  askSize?: number;
  spread: number;
  spreadPercent: number;
  exchange?: string;
  market?: string;
  source: 'coingecko';
  attribution: 'Data provided by CoinGecko (https://www.coingecko.com)';
}

/**
 * Real-time market data stream event
 */
export interface RealtimeDataEvent {
  ticker: string;
  timestamp: Date;
  dataType: 'ohlcv' | 'trades' | 'orderbook';
  data: CryptoOHLCVData | TradeData | OrderBookData;
  exchange?: string;
  market?: string;
  source: 'coingecko';
}

/**
 * Trade data for real-time streams
 */
export interface TradeData {
  ticker: string;
  timestamp: Date;
  price: number;
  volume: number;
  side: 'buy' | 'sell';
  exchange?: string;
  market?: string;
  tradeId?: string;
}

/**
 * Order book data
 */
export interface OrderBookData {
  ticker: string;
  timestamp: Date;
  bids: Array<[number, number]>; // [price, size]
  asks: Array<[number, number]>; // [price, size]
  exchange?: string;
  market?: string;
}

/**
 * Domain-specific query options
 */
export interface DomainPriceQuery {
  symbols?: string[];
  coinIds?: string[];
  includeMarketData?: boolean;
  includePriceChange?: boolean;
  limit?: number;
}

export interface DomainOHLCVQuery {
  coinId: string;
  symbol?: string;
  days: number;
  interval: 'hourly' | 'daily';
  timeframe?: string; // For standardization: '1h', '1d'
}

/**
 * Date-range OHLCV query for financial markets
 */
export interface DateRangeOHLCVQuery {
  ticker: string;           // Symbol (BTC, ETH) or coinId (bitcoin, ethereum)
  dateStart: Date;          // Start date for historical data
  dateEnd: Date;            // End date for historical data
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
  exchange?: string;        // Optional exchange/market (binance, coinbase, etc.)
  market?: string;          // Optional market pair (USDT, USD, BTC)
}

/**
 * Real-time streaming query for live market data
 */
export interface RealtimeStreamQuery {
  ticker: string;           // Symbol to stream
  dataType: 'ohlcv' | 'trades' | 'orderbook';
  interval?: '1m' | '5m' | '15m' | '1h';  // For OHLCV streams
  exchange?: string;        // Specific exchange to stream from
  market?: string;          // Market pair (USDT, USD, BTC)
}

/**
 * Level 1 market data (best bid/ask)
 */
export interface Level1Query {
  ticker: string;           // Symbol for level 1 data
  exchange?: string;        // Specific exchange
  market?: string;          // Market pair
}

export interface DomainMarketQuery {
  category?: string;
  topN?: number;
  includeSparkline?: boolean;
  includePriceChange?: boolean;
  sortBy?: 'market_cap' | 'volume' | 'price_change';
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// COINGECKO CRYPTO DSL CLASS
// =============================================================================

// =============================================================================
// RAW COINGECKO RESPONSE TYPES (for internal transformation)
// =============================================================================

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd?: number;
    btc?: number;
    eth?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    usd_24h_change?: number;
    last_updated_at?: number;
  };
}

interface CoinGeckoOHLCVEntry {
  0: number; // timestamp
  1: number; // open
  2: number; // high
  3: number; // low
  4: number; // close
  5: number; // volume
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  last_updated: string;
}

interface CoinGeckoGlobalData {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth?: number };
    active_cryptocurrencies: number;
    markets: number;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

interface CoinGeckoSearchResponse {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    market_cap_rank?: number;
  }>;
}

interface CoinGeckoTrendingResponse {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      score: number;
    };
  }>;
}

/**
 * High-level DSL for CoinGecko crypto market operations
 * Direct MCP integration - Agent = QiAgent + DSL (no redundant wrapper)
 */
export class CoinGeckoDSL {
  private mcpClient: MCPClient | null = null;
  private launcher: OfficialCoinGeckoMCPLauncher;
  private isInitialized = false;
  private config: CoinGeckoMCPConfig & { debug?: boolean };

  constructor(config: CoinGeckoMCPConfig & { debug?: boolean } = {}) {
    this.config = {
      debug: false,
      ...config
    };
    this.launcher = new OfficialCoinGeckoMCPLauncher(config);
  }

  // =============================================================================
  // INITIALIZATION & SETUP
  // =============================================================================

  /**
   * Initialize CoinGecko MCP server and connect client directly
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.config.debug) {
      console.log('🪙 Initializing CoinGecko DSL with direct MCP integration...');
    }

    try {
      // Start the CoinGecko MCP Server
      await this.launcher.start();

      // Create MCP client connection
      this.mcpClient = new MCPClient({
        info: (msg) => this.config.debug && console.log(msg),
        warn: (msg) => this.config.debug && console.warn(msg),
        error: (msg) => console.error(msg)
      });

      // Connect to the MCP server
      await this.connectMCPClient();
      this.isInitialized = true;

      if (this.config.debug) {
        console.log('✅ CoinGecko DSL initialized with direct MCP connection');
      }
    } catch (error) {
      throw new Error(`Failed to initialize CoinGecko DSL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Connect MCP client to CoinGecko server with proper configuration for structured data
   */
  private async connectMCPClient(): Promise<void> {
    if (!this.mcpClient) {
      throw new Error('MCP Client not created');
    }

    let serverConfig;
    
    if (this.config.useRemoteServer) {
      // Use official CoinGecko remote MCP server (should provide structured data)
      serverConfig = {
        name: 'coingecko',
        command: 'npx',
        args: ['mcp-remote', 'https://mcp.api.coingecko.com/sse']
      };
      
      if (this.config.debug) {
        console.log('🌐 Configuring remote CoinGecko MCP server for structured data');
      }
    } else {
      // Use local CoinGecko MCP server with configurable tools mode
      const args = ['-y', '@coingecko/coingecko-mcp', '--client=claude'];
      
      // Add tools mode flag based on configuration (production-ready defaults to static)
      const useDynamicTools = this.config.useDynamicTools === true; // Default to false (static) for production
      if (useDynamicTools) {
        args.push('--tools=dynamic');
        if (this.config.debug) {
          console.log('🏠 Configuring local CoinGecko MCP server with --client=claude --tools=dynamic');
        }
      } else {
        if (this.config.debug) {
          console.log('🏠 Configuring local CoinGecko MCP server with --client=claude (static tools mode)');
        }
      }
      
      // Set up environment for free tier usage
      const env = {
        ...process.env,
        COINGECKO_RATE_LIMIT: '50',
        COINGECKO_TIMEOUT: '30000',
        // For free tier, explicitly omit API headers
        COINGECKO_USE_FREE_API: 'true',
        COINGECKO_OMIT_API_HEADERS: 'true',
        COINGECKO_ENVIRONMENT: 'free'
      };
      
      serverConfig = {
        name: 'coingecko',
        command: 'npx',
        args: args,
        env: env
      };
    }

    const result = await this.mcpClient.connectToServer(serverConfig);
    if (!result) {
      throw new Error('Failed to connect to CoinGecko MCP server');
    }

    if (this.config.debug) {
      console.log(`🔗 Connected to ${this.config.useRemoteServer ? 'remote' : 'local'} CoinGecko MCP server`);
      console.log('🔍 Server should now provide structured data (not requiring manual JSON parsing)');
    }
  }

  // =============================================================================
  // PRICE DATA OPERATIONS (DSL Level)
  // =============================================================================

  /**
   * Get current prices - clean DSL interface
   */
  async getCurrentPrices(query: DomainPriceQuery): Promise<CryptoPriceData[]> {
    this.ensureInitialized();

    const params = {
      ids: query.coinIds ? query.coinIds.join(',') : '',
      vs_currencies: 'usd,btc,eth',
      include_market_cap: query.includeMarketData || false,
      include_24hr_vol: query.includeMarketData || false,
      include_24hr_change: query.includePriceChange || false,
      include_last_updated_at: true,
    };

    const rawPrices = await this.callMCPTool<CoinGeckoPriceResponse>('get_simple_price', params);
    return this.transformPriceData(rawPrices);
  }

  /**
   * Get price for a single cryptocurrency - clean DSL interface
   */
  async getPrice(coinIdOrSymbol: string): Promise<number | null> {
    this.ensureInitialized();

    // Determine if it's a symbol or coinId
    const isSymbol = coinIdOrSymbol.length <= 10 && coinIdOrSymbol === coinIdOrSymbol.toUpperCase();
    
    if (isSymbol) {
      // Convert symbol to coinId using search
      const searchData = await this.callMCPTool<CoinGeckoSearchResponse>('get_search', { query: coinIdOrSymbol });
      const coin = searchData.coins.find(c => c.symbol.toLowerCase() === coinIdOrSymbol.toLowerCase());
      if (!coin) return null;
      coinIdOrSymbol = coin.id;
    }

    const priceData = await this.callMCPTool<CoinGeckoPriceResponse>('get_simple_price', {
      ids: coinIdOrSymbol,
      vs_currencies: 'usd'
    });
    
    return priceData[coinIdOrSymbol]?.usd || null;
  }

  /**
   * Get prices for multiple cryptocurrencies by symbols
   */
  async getPricesBySymbols(symbols: string[]): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();
    
    // Convert symbols to coinIds
    const coinIds: string[] = [];
    for (const symbol of symbols) {
      const searchResult = await this.callMCPTool<CoinGeckoSearchResponse>('get_search', { query: symbol });
      const coin = searchResult.coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
      if (coin) {
        coinIds.push(coin.id);
      }
    }

    if (coinIds.length === 0) return priceMap;

    const rawPrices = await this.callMCPTool<CoinGeckoPriceResponse>('get_simple_price', { 
      ids: coinIds.join(','),
      vs_currencies: 'usd'
    });
    
    for (const [coinId, data] of Object.entries(rawPrices)) {
      if (data.usd) {
        // Find the symbol for this coinId
        const symbol = symbols.find(s => {
          // This is a simplification - in production you'd maintain a coinId->symbol mapping
          return coinId.includes(s.toLowerCase());
        });
        if (symbol) {
          priceMap.set(symbol, data.usd);
        }
      }
    }

    return priceMap;
  }

  // =============================================================================
  // OHLCV DATA OPERATIONS (DSL Level)
  // =============================================================================

  /**
   * Get OHLCV data - clean DSL interface
   */
  async getOHLCVData(query: DomainOHLCVQuery): Promise<CryptoOHLCVData[]> {
    this.ensureInitialized();

    // Calculate timestamp range from days
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (query.days * 24 * 60 * 60);

    const params = {
      id: query.coinId,
      vs_currency: 'usd',
      from: startTime,
      to: endTime,
      interval: query.interval,
    };

    const rawOHLCV = await this.callMCPTool<CoinGeckoOHLCVEntry[]>('get_range_coins_ohlc', params);
    return this.transformOHLCVData(rawOHLCV, query.coinId, query.timeframe || query.interval);
  }

  /**
   * Get latest candlestick data for technical analysis
   */
  async getLatestCandles(coinId: string, count: number = 100, interval: 'hourly' | 'daily' = 'hourly'): Promise<CryptoOHLCVData[]> {
    const days = interval === 'hourly' ? Math.ceil(count / 24) : count;
    
    const ohlcvData = await this.getOHLCVData({
      coinId,
      days,
      interval,
    });

    return ohlcvData.slice(-count); // Get the latest N candles
  }

  // =============================================================================
  // FINANCIAL MARKET DSL METHODS
  // =============================================================================

  /**
   * 1. Get OHLCV data from date_start to date_end for a ticker
   */
  async getOHLCVByDateRange(query: DateRangeOHLCVQuery): Promise<CryptoOHLCVData[]> {
    this.ensureInitialized();

    // Convert ticker to coinId if needed
    const coinId = await this.resolveTickerToCoinId(query.ticker);
    if (!coinId) {
      throw new Error(`Unable to resolve ticker '${query.ticker}' to a valid coinId`);
    }

    // Calculate date range parameters
    const startTimestamp = Math.floor(query.dateStart.getTime() / 1000);
    const endTimestamp = Math.floor(query.dateEnd.getTime() / 1000);

    // Map interval to CoinGecko format
    const interval = this.mapIntervalToCoinGecko(query.interval);

    const params = {
      id: coinId,
      vs_currency: query.market || 'usd',
      from: startTimestamp,
      to: endTimestamp,
      interval: interval
    };

    const rawOHLCV = await this.callMCPTool<CoinGeckoOHLCVEntry[]>('get_range_coins_ohlc', params);
    
    // Filter data to exact date range and add exchange/market info
    const filteredData = rawOHLCV
      .filter(entry => {
        const entryTime = new Date(entry[0]);
        return entryTime >= query.dateStart && entryTime <= query.dateEnd;
      })
      .map(entry => ({
        coinId,
        symbol: query.ticker.toUpperCase(),
        timestamp: new Date(entry[0]),
        open: entry[1],
        high: entry[2],
        low: entry[3],
        close: entry[4],
        volume: entry[5],
        timeframe: query.interval,
        exchange: query.exchange,
        market: query.market || 'USD',
        source: 'coingecko' as const,
        attribution: 'Data provided by CoinGecko (https://www.coingecko.com)' as const,
      }));

    return filteredData;
  }

  /**
   * 2. Listen to real-time OHLCV for a ticker and market/exchange
   * Note: CoinGecko doesn't provide real-time streaming, so this simulates with polling
   */
  async streamRealtimeOHLCV(
    query: RealtimeStreamQuery,
    callback: (data: RealtimeDataEvent) => void,
    options: { pollIntervalMs?: number; stopAfter?: number } = {}
  ): Promise<() => void> {
    this.ensureInitialized();

    const { pollIntervalMs = 60000, stopAfter } = options; // Default 1 minute polling
    let isStreaming = true;
    let pollCount = 0;

    const coinId = await this.resolveTickerToCoinId(query.ticker);
    if (!coinId) {
      throw new Error(`Unable to resolve ticker '${query.ticker}' to a valid coinId`);
    }

    const poll = async () => {
      while (isStreaming) {
        if (stopAfter && pollCount >= stopAfter) break;

        try {
          if (query.dataType === 'ohlcv') {
            // Get latest OHLCV data
            const ohlcvData = await this.getLatestCandles(coinId, 1, query.interval === '1h' ? 'hourly' : 'daily');
            
            if (ohlcvData.length > 0) {
              const event: RealtimeDataEvent = {
                ticker: query.ticker,
                timestamp: new Date(),
                dataType: 'ohlcv',
                data: {
                  ...ohlcvData[0],
                  exchange: query.exchange,
                  market: query.market || 'USD'
                },
                exchange: query.exchange,
                market: query.market,
                source: 'coingecko'
              };
              
              callback(event);
            }
          }
          // TODO: Add support for 'trades' and 'orderbook' when CoinGecko provides real-time APIs
          
          pollCount++;
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        } catch (error) {
          console.error('Real-time polling error:', error);
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }
      }
    };

    // Start polling
    poll().catch(console.error);

    // Return stop function
    return () => {
      isStreaming = false;
    };
  }

  /**
   * 3. Get Level 1 data (best bid/ask) for a ticker
   */
  async getLevel1Data(query: Level1Query): Promise<Level1Data> {
    this.ensureInitialized();

    const coinId = await this.resolveTickerToCoinId(query.ticker);
    if (!coinId) {
      throw new Error(`Unable to resolve ticker '${query.ticker}' to a valid coinId`);
    }

    // Get current price and market data
    const priceParams = {
      ids: coinId,
      vs_currencies: query.market || 'usd',
      include_market_cap: true,
      include_24hr_vol: true,
      include_last_updated_at: true
    };

    const priceData = await this.callMCPTool<CoinGeckoPriceResponse>('/simple/price', priceParams);
    const coinData = priceData[coinId];

    if (!coinData) {
      throw new Error(`No price data available for ${query.ticker}`);
    }

    // For CoinGecko, we approximate bid/ask using current price
    // In production, you'd get this from exchange-specific APIs
    const currentPrice = coinData.usd || 0;
    const spread = currentPrice * 0.001; // Approximate 0.1% spread
    const bestBid = currentPrice - spread / 2;
    const bestAsk = currentPrice + spread / 2;

    return {
      ticker: query.ticker,
      timestamp: new Date(coinData.last_updated_at ? coinData.last_updated_at * 1000 : Date.now()),
      bestBid,
      bestAsk,
      spread,
      spreadPercent: (spread / currentPrice) * 100,
      exchange: query.exchange,
      market: query.market || 'USD',
      source: 'coingecko',
      attribution: 'Data provided by CoinGecko (https://www.coingecko.com)'
    };
  }

  /**
   * 4. Stream real-time Level 1 data
   */
  async streamLevel1Data(
    query: Level1Query,
    callback: (data: Level1Data) => void,
    options: { pollIntervalMs?: number; stopAfter?: number } = {}
  ): Promise<() => void> {
    this.ensureInitialized();

    const { pollIntervalMs = 5000, stopAfter } = options; // Default 5 second polling for level 1
    let isStreaming = true;
    let pollCount = 0;

    const poll = async () => {
      while (isStreaming) {
        if (stopAfter && pollCount >= stopAfter) break;

        try {
          const level1Data = await this.getLevel1Data(query);
          callback(level1Data);
          
          pollCount++;
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        } catch (error) {
          console.error('Level 1 streaming error:', error);
          await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }
      }
    };

    // Start polling
    poll().catch(console.error);

    // Return stop function
    return () => {
      isStreaming = false;
    };
  }

  // =============================================================================
  // MARKET ANALYTICS OPERATIONS (DSL Level)
  // =============================================================================

  /**
   * Get comprehensive market analytics - clean DSL interface
   */
  async getMarketAnalytics(): Promise<CryptoMarketAnalytics> {
    this.ensureInitialized();

    const globalData = await this.callMCPTool<CoinGeckoGlobalData>('get_global', {});
    return this.transformMarketAnalytics(globalData);
  }

  /**
   * Get market summary with top performers
   */
  async getMarketSummary(options: DomainMarketQuery = {}): Promise<CryptoMarketSummary> {
    const [globalData, topCoins] = await Promise.all([
      this.callMCPTool<CoinGeckoGlobalData>('get_global', {}),
      this.callMCPTool<CoinGeckoMarketData[]>('get_coins_markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: options.topN || 100,
        page: 1,
        sparkline: options.includeSparkline || false,
        price_change_percentage: '24h',
      }),
    ]);

    return this.buildMarketSummary(globalData, topCoins);
  }

  /**
   * Get top gainers and losers
   */
  async getTopPerformers(limit: number = 10): Promise<{ gainers: TopPerformer[]; losers: TopPerformer[] }> {
    const marketData = await this.callMCPTool<CoinGeckoMarketData[]>('get_coins_markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 250, // Get more data to find best performers
      page: 1,
      price_change_percentage: '24h',
    });

    const performers = marketData
      .filter(coin => coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h !== undefined)
      .map(coin => this.transformToTopPerformer(coin));

    const sortedByChange = [...performers].sort((a, b) => b.change24h - a.change24h);

    return {
      gainers: sortedByChange.slice(0, limit),
      losers: sortedByChange.slice(-limit).reverse(),
    };
  }

  // =============================================================================
  // TRENDING & DISCOVERY (DSL Level)
  // =============================================================================

  /**
   * Get trending cryptocurrencies with additional context
   */
  async getTrendingCoins(): Promise<Array<CryptoPriceData & { trendingScore: number }>> {
    const trendingData = await this.callMCPTool<CoinGeckoTrendingResponse>('get_search_trending', {});
    
    // Get detailed price data for trending coins
    const coinIds = trendingData.coins.map(coin => coin.item.id);
    const priceData = await this.getCurrentPrices({ coinIds });

    return priceData.map((price, index) => ({
      ...price,
      trendingScore: trendingData.coins[index]?.item.score || 0,
    }));
  }

  /**
   * Search and get price data for cryptocurrencies
   */
  async searchAndGetPrices(query: string, limit: number = 10): Promise<CryptoPriceData[]> {
    const searchResult = await this.callMCPTool<CoinGeckoSearchResponse>('get_search', { query });
    
    if (searchResult.coins.length === 0) return [];

    const coinIds = searchResult.coins.slice(0, limit).map(coin => coin.id);
    return await this.getCurrentPrices({ coinIds });
  }

  // =============================================================================
  // ADVANCED ANALYTICS (DSL Level)
  // =============================================================================

  /**
   * Detect significant price movements (simplified anomaly detection)
   */
  async detectPriceAnomalies(threshold: number = 10): Promise<CryptoPriceData[]> {
    const marketData = await this.callMCPTool<CoinGeckoMarketData[]>('get_coins_markets', {
      vs_currency: 'usd',
      order: 'market_cap_desc',
      per_page: 100,
      price_change_percentage: '24h',
    });

    const anomalies = marketData
      .filter(coin => Math.abs(coin.price_change_percentage_24h || 0) > threshold)
      .map(coin => this.transformMarketDataToPriceData(coin));

    return anomalies.sort((a, b) => Math.abs(b.change24h || 0) - Math.abs(a.change24h || 0));
  }

  /**
   * Calculate market dominance trends
   */
  async getMarketDominance(): Promise<Record<string, number>> {
    const globalData = await this.callMCPTool<CoinGeckoGlobalData>('get_global', {});
    return globalData.data.market_cap_percentage;
  }

  /**
   * Get market sentiment indicator
   */
  async getMarketSentiment(): Promise<'bullish' | 'bearish' | 'neutral'> {
    const [globalData, topPerformers] = await Promise.all([
      this.callMCPTool<CoinGeckoGlobalData>('/global', {}),
      this.getTopPerformers(50),
    ]);

    const marketCapChange = globalData.data.market_cap_change_percentage_24h_usd;
    const gainersCount = topPerformers.gainers.length;
    const losersCount = topPerformers.losers.length;

    if (marketCapChange > 2 && gainersCount > losersCount * 1.5) {
      return 'bullish';
    } else if (marketCapChange < -2 && losersCount > gainersCount * 1.5) {
      return 'bearish';
    } else {
      return 'neutral';
    }
  }

  // =============================================================================
  // DATA TRANSFORMATION METHODS
  // =============================================================================

  /**
   * Transform raw CoinGecko price data to domain format
   */
  private transformPriceData(rawPrices: CoinGeckoPriceResponse): CryptoPriceData[] {
    return Object.entries(rawPrices).map(([coinId, data]) => ({
      coinId,
      symbol: coinId.toUpperCase(), // Simplified - in production get actual symbol
      usdPrice: data.usd || 0,
      btcPrice: data.btc,
      ethPrice: data.eth,
      marketCap: data.usd_market_cap,
      volume24h: data.usd_24h_vol,
      change24h: data.usd_24h_change,
      lastUpdated: new Date(data.last_updated_at ? data.last_updated_at * 1000 : Date.now()),
      source: 'coingecko' as const,
      attribution: 'Data provided by CoinGecko (https://www.coingecko.com)' as const,
    }));
  }

  /**
   * Transform raw OHLCV data to domain format
   */
  private transformOHLCVData(rawOHLCV: CoinGeckoOHLCVEntry[], coinId: string, timeframe: string): CryptoOHLCVData[] {
    return rawOHLCV.map(entry => ({
      coinId,
      timestamp: new Date(entry[0]),
      open: entry[1],
      high: entry[2],
      low: entry[3],
      close: entry[4],
      volume: entry[5],
      timeframe,
      source: 'coingecko' as const,
      attribution: 'Data provided by CoinGecko (https://www.coingecko.com)' as const,
    }));
  }

  /**
   * Transform global data to market analytics
   */
  private transformMarketAnalytics(globalData: CoinGeckoGlobalData): CryptoMarketAnalytics {
    return {
      timestamp: new Date(globalData.data.updated_at * 1000),
      totalMarketCap: globalData.data.total_market_cap.usd || 0,
      totalVolume: globalData.data.total_volume.usd || 0,
      btcDominance: globalData.data.market_cap_percentage.btc || 0,
      ethDominance: globalData.data.market_cap_percentage.eth,
      activeCryptocurrencies: globalData.data.active_cryptocurrencies,
      markets: globalData.data.markets,
      marketCapChange24h: globalData.data.market_cap_change_percentage_24h_usd,
      source: 'coingecko' as const,
      attribution: 'Data provided by CoinGecko (https://www.coingecko.com)' as const,
    };
  }

  /**
   * Build comprehensive market summary
   */
  private buildMarketSummary(globalData: CoinGeckoGlobalData, topCoins: CoinGeckoMarketData[]): CryptoMarketSummary {
    const sortedByChange = [...topCoins]
      .filter(coin => coin.price_change_percentage_24h !== null)
      .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));

    const gainers = sortedByChange.slice(0, 10).map(coin => this.transformToTopPerformer(coin));
    const losers = sortedByChange.slice(-10).reverse().map(coin => this.transformToTopPerformer(coin));

    const marketCapChange = globalData.data.market_cap_change_percentage_24h_usd;
    let marketTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    if (marketCapChange > 2) marketTrend = 'bullish';
    else if (marketCapChange < -2) marketTrend = 'bearish';

    return {
      timestamp: new Date(globalData.data.updated_at * 1000),
      totalMarketCap: globalData.data.total_market_cap.usd || 0,
      totalVolume: globalData.data.total_volume.usd || 0,
      btcDominance: globalData.data.market_cap_percentage.btc || 0,
      activeCoins: globalData.data.active_cryptocurrencies,
      topGainers: gainers,
      topLosers: losers,
      marketTrend,
    };
  }

  /**
   * Transform market data to top performer format
   */
  private transformToTopPerformer(coin: CoinGeckoMarketData): TopPerformer {
    return {
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      change24h: coin.price_change_percentage_24h || 0,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      rank: coin.market_cap_rank,
    };
  }

  /**
   * Transform market data to price data format
   */
  private transformMarketDataToPriceData(coin: CoinGeckoMarketData): CryptoPriceData {
    return {
      coinId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      usdPrice: coin.current_price,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      change24h: coin.price_change_percentage_24h || undefined,
      lastUpdated: new Date(coin.last_updated),
      source: 'coingecko' as const,
      attribution: 'Data provided by CoinGecko (https://www.coingecko.com)' as const,
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Ensure DSL is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.mcpClient) {
      throw new Error('CoinGecko DSL not initialized. Call initialize() first.');
    }
  }

  /**
   * Clean DSL interface to MCP tools - abstracts all parsing complexity
   * PRODUCTION-READY: Uses direct static tool calls for reliability
   */
  private async callMCPTool<T>(endpoint: string, params: any): Promise<T> {
    try {
      // Check if we should use static tools mode (production-ready remote server)
      const useStaticTools = this.config.useRemoteServer || !this.config.useDynamicTools;
      
      if (useStaticTools) {
        // PRODUCTION-READY: Direct static tool calls (working with remote server)
        const result = await this.mcpClient!.callTool('coingecko', endpoint, params);
        return await this.handleMCPResult<T>(result);
      } else {
        // Legacy dynamic tools workflow (for local debugging only)
        const endpoints = await this.mcpClient!.callTool('coingecko', 'list_api_endpoints', {});
        const schema = await this.mcpClient!.callTool('coingecko', 'get_api_endpoint_schema', {
          endpoint: endpoint
        });
        const result = await this.mcpClient!.callTool('coingecko', 'invoke_api_endpoint', {
          endpoint: endpoint,
          parameters: params
        });
        return await this.handleMCPResult<T>(result);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error(`MCP call failed for endpoint '${endpoint}':`, error);
      }
      throw new Error(`Failed to call CoinGecko endpoint '${endpoint}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle MCP tool result and extract data (internal implementation)
   * NOTE: This complexity is hidden from DSL users
   */
  private async handleMCPResult<T>(result: any): Promise<T> {
    // Check for structured content first (ideal MCP format)
    if (result && result.structuredContent) {
      return result.structuredContent as T;
    }

    // Handle QiCore Result<T> pattern
    if (result && typeof result === 'object' && '_tag' in result) {
      if (result._tag === 'Right' && result.right) {
        const data = result.right;
        
        // Check for structured content in QiCore result
        if (data.structuredContent) {
          return data.structuredContent as T;
        }
        
        // Handle unstructured content (common for CoinGecko MCP server)
        if (data.content && Array.isArray(data.content) && data.content[0] && data.content[0].text) {
          try {
            return JSON.parse(data.content[0].text) as T;
          } catch (parseError) {
            if (this.config.debug) {
              console.error('JSON parse failed:', parseError);
            }
            return data.content[0].text as T;
          }
        }
        
        return data as T;
      } else if (result._tag === 'Left' && result.left) {
        throw new Error(`MCP call failed: ${result.left.message || 'Unknown error'}`);
      }
    }
    
    // Handle direct MCP result with structured content
    if (result && result.structuredContent) {
      return result.structuredContent as T;
    }
    
    // Handle direct MCP result with content array
    if (result && result.content && Array.isArray(result.content)) {
      const content = result.content[0];
      if (content && content.text) {
        try {
          return JSON.parse(content.text) as T;
        } catch (parseError) {
          if (this.config.debug) {
            console.error('JSON parse failed:', parseError);
          }
          return content.text as T;
        }
      }
    }
    
    // Handle MCPToolResult format
    if (result && result.metadata && result.content) {
      return result as T;
    }
    
    // Direct result as fallback
    return result as T;
  }

  // =============================================================================
  // HELPER METHODS FOR FINANCIAL DSL
  // =============================================================================

  /**
   * Convert ticker symbol to CoinGecko coinId
   */
  private async resolveTickerToCoinId(ticker: string): Promise<string | null> {
    // If it looks like a coinId already (lowercase, contains dashes), use it directly
    if (ticker.includes('-') || ticker === ticker.toLowerCase()) {
      return ticker;
    }

    try {
      // Search for the ticker symbol
      const searchData = await this.callMCPTool<CoinGeckoSearchResponse>('get_search', { 
        query: ticker 
      });
      
      // Find exact symbol match (case insensitive)
      const coin = searchData.coins.find(c => 
        c.symbol.toLowerCase() === ticker.toLowerCase()
      );
      
      return coin?.id || null;
    } catch (error) {
      console.error(`Failed to resolve ticker ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Map standard trading intervals to CoinGecko intervals
   */
  private mapIntervalToCoinGecko(interval: string): 'hourly' | 'daily' {
    switch (interval) {
      case '1m':
      case '5m':
      case '15m':
      case '1h':
      case '4h':
        return 'hourly';
      case '1d':
      case '1w':
      default:
        return 'daily';
    }
  }

  /**
   * Close DSL and cleanup connections
   */
  async close(): Promise<void> {
    if (this.config.debug) {
      console.log('🛑 Closing CoinGecko DSL...');
    }

    try {
      if (this.mcpClient) {
        await this.mcpClient.disconnect();
        this.mcpClient = null;
      }

      await this.launcher.stop();
      this.isInitialized = false;

      if (this.config.debug) {
        console.log('✅ CoinGecko DSL closed');
      }
    } catch (error) {
      console.error('❌ Error closing CoinGecko DSL:', error);
      throw error;
    }
  }

  /**
   * Get DSL status and health
   */
  getStatus(): { 
    isInitialized: boolean; 
    isConnected: boolean;
    serverStatus: ReturnType<OfficialCoinGeckoMCPLauncher['getStatus']>;
    availableTools: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.isInitialized && this.mcpClient?.isConnected('coingecko') || false,
      serverStatus: this.launcher.getStatus(),
      availableTools: this.launcher.getAvailableTools(),
    };
  }

  /**
   * Get server information
   */
  getServerInfo(): ReturnType<OfficialCoinGeckoMCPLauncher['getServerInfo']> {
    return this.launcher.getServerInfo();
  }
}