// CoinGecko Actor - MCP Client + DSL Implementation
// Actor = MCP Client + DSL (executes crypto data operations)

interface BaseActor {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

interface ActorConfig {
  name: string;
  description?: string;
  version?: string;
}

import { CoinGeckoDSL, type CryptoPriceData, type CryptoOHLCVData, type CryptoMarketAnalytics } from './coingecko-dsl';
import { type CoinGeckoMCPConfig } from '../../../mcp-launchers/coingecko-mcp-launcher';

// =============================================================================
// COINGECKO ACTOR TYPES
// =============================================================================

export interface CoinGeckoActorConfig {
  name: string;
  description?: string;
  version?: string;
  coinGeckoConfig?: CoinGeckoMCPConfig & { debug?: boolean };
  logger?: any;
}

export interface CryptoDataQuery {
  symbols?: string[];
  coinIds?: string[];
  dataTypes: ('price' | 'ohlcv' | 'market_data' | 'analytics')[];
  timeframe?: 'hourly' | 'daily';
  days?: number;
  includeAnalysis?: boolean;
}

export interface CryptoDataResult {
  prices?: CryptoPriceData[];
  ohlcv?: CryptoOHLCVData[];
  analytics?: CryptoMarketAnalytics;
  aiAnalysis?: string;
  timestamp: Date;
  source: 'coingecko';
}

export interface CoinGeckoActorStatus {
  isConnected: boolean;
  serverStatus: any;
  lastQuery: Date | null;
  totalQueries: number;
}

// =============================================================================
// COINGECKO ACTOR CLASS
// =============================================================================

/**
 * CoinGecko Actor - Special MCP Client that provides DSL tooling interfaces
 * 
 * Actor Definition: Special MCP Client that provides DSL tooling interfaces
 * - MCP Client uses tools from: Tool module (local) + MCP server tools
 * - Specialty: DSL tooling interfaces for crypto data task domain
 * - Interface: Domain-specific tooling interfaces (hides MCP complexity)
 * 
 * Responsibilities:
 * - Provide DSL tooling interfaces for crypto market data operations
 * - Data transformation and enrichment via DSL
 * - Real-time price monitoring interfaces
 * - MCP server + local tools integration
 * 
 * NOT an Agent - no workflow orchestration or AI decision making
 */
export class CoinGeckoActor implements BaseActor {
  // DSL Component (Actor = Special MCP Client that provides DSL tooling interfaces)
  private dsl: CoinGeckoDSL;
  
  // Actor state  
  private config: CoinGeckoActorConfig;
  private isInitialized = false;
  private queryCount = 0;
  private lastQuery: Date | null = null;
  private logger?: any;

  constructor(config: CoinGeckoActorConfig) {
    this.config = config;
    this.logger = config.logger;
    
    // Apply production-ready defaults for MCP configuration
    const productionConfig = {
      useRemoteServer: true,  // PRODUCTION-READY: Use remote server (no local auth issues)
      useDynamicTools: false, // PRODUCTION-READY: Static tools mode for reliability
      environment: 'free',    // PRODUCTION-READY: Free tier access
      debug: false,           // PRODUCTION-READY: Disable debug for production
      ...config.coinGeckoConfig
    };
    
    // Initialize DSL tooling interfaces (Actor = Special MCP Client that provides DSL tooling interfaces)
    this.dsl = new CoinGeckoDSL(productionConfig);
  }

  // =============================================================================
  // ACTOR LIFECYCLE
  // =============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.logger?.info('🎭 Initializing CoinGecko Actor...');

    try {
      // Initialize MCP client and DSL
      await this.dsl.initialize();
      
      this.isInitialized = true;
      this.logger?.info('✅ CoinGecko Actor initialized successfully');
    } catch (error) {
      this.logger?.error('❌ CoinGecko Actor initialization failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.logger?.info('🛑 Cleaning up CoinGecko Actor...');
    
    try {
      await this.dsl.close();
      this.isInitialized = false;
      this.logger?.info('✅ CoinGecko Actor cleanup completed');
    } catch (error) {
      this.logger?.error('❌ CoinGecko Actor cleanup failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // CORE ACTOR FUNCTIONALITY (Data Operations)
  // =============================================================================

  /**
   * Execute crypto data operations (no AI analysis - just data)
   */
  async getCryptoData(query: CryptoDataQuery): Promise<CryptoDataResult> {
    this.ensureInitialized();
    this.updateQueryMetrics();

    this.logger?.info(`🔍 Executing crypto data operations for: ${(query.coinIds || query.symbols || []).join(', ')}`);

    const result: CryptoDataResult = {
      timestamp: new Date(),
      source: 'coingecko' as const,
    };

    try {
      // Execute data operations based on requested types
      const dataPromises: Promise<any>[] = [];

      if (query.dataTypes.includes('price')) {
        dataPromises.push(this.getPriceData(query));
      }

      if (query.dataTypes.includes('ohlcv')) {
        dataPromises.push(this.getOHLCVData(query));
      }

      if (query.dataTypes.includes('analytics')) {
        dataPromises.push(this.getAnalyticsData());
      }

      // Execute all queries in parallel
      const results = await Promise.all(dataPromises);

      // Assign results
      let resultIndex = 0;
      if (query.dataTypes.includes('price')) {
        result.prices = results[resultIndex++];
      }
      if (query.dataTypes.includes('ohlcv')) {
        result.ohlcv = results[resultIndex++];
      }
      if (query.dataTypes.includes('analytics')) {
        result.analytics = results[resultIndex++];
      }

      // Add data summary if requested
      if (query.includeAnalysis) {
        result.aiAnalysis = this.generateDataSummary(result, query);
      }

      this.logger?.info(`✅ Retrieved crypto data: ${Object.keys(result).filter(k => k !== 'timestamp' && k !== 'source').join(', ')}`);
      return result;

    } catch (error) {
      this.logger?.error('❌ Failed to get crypto data:', error);
      throw error;
    }
  }

  /**
   * Get current prices for cryptocurrencies
   */
  async getCurrentPrices(coinIds: string[]): Promise<CryptoPriceData[]> {
    this.ensureInitialized();
    this.updateQueryMetrics();

    return await this.dsl.getCurrentPrices({
      coinIds,
      includeMarketData: true,
      includePriceChange: true,
    });
  }

  /**
   * Get OHLCV data for technical analysis
   */
  async getOHLCVAnalysis(coinId: string, days: number = 30, interval: 'hourly' | 'daily' = 'daily'): Promise<CryptoOHLCVData[]> {
    this.ensureInitialized();
    this.updateQueryMetrics();

    return await this.dsl.getOHLCVData({
      coinId,
      days,
      interval,
    });
  }

  /**
   * Get market analytics and sentiment
   */
  async getMarketIntelligence(): Promise<{
    analytics: CryptoMarketAnalytics;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    topPerformers: any;
    aiInsights?: string;
  }> {
    this.ensureInitialized();
    this.updateQueryMetrics();

    const [analytics, sentiment, topPerformers] = await Promise.all([
      this.dsl.getMarketAnalytics(),
      this.dsl.getMarketSentiment(),
      this.dsl.getTopPerformers(10),
    ]);

    // Generate data summary
    const aiInsights = this.generateMarketSummary(analytics, sentiment, topPerformers);

    return {
      analytics,
      sentiment,
      topPerformers,
      aiInsights,
    };
  }

  /**
   * Search and analyze cryptocurrencies
   */
  async searchAndAnalyze(query: string, limit: number = 10): Promise<{
    results: CryptoPriceData[];
    analysis?: string;
  }> {
    this.ensureInitialized();
    this.updateQueryMetrics();

    const results = await this.dsl.searchAndGetPrices(query, limit);
    
    const analysis = this.generateSearchSummary(query, results);

    return { results, analysis };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async getPriceData(query: CryptoDataQuery): Promise<CryptoPriceData[]> {
    if (query.coinIds) {
      return await this.dsl.getCurrentPrices({
        coinIds: query.coinIds,
        includeMarketData: true,
        includePriceChange: true,
      });
    } else if (query.symbols) {
      const priceMap = await this.dsl.getPricesBySymbols(query.symbols);
      return Array.from(priceMap.entries()).map(([symbol, price]) => ({
        coinId: symbol.toLowerCase(),
        symbol: symbol.toUpperCase(),
        usdPrice: price,
        lastUpdated: new Date(),
        source: 'coingecko' as const,
        attribution: 'Data provided by CoinGecko (https://www.coingecko.com)',
      }));
    } else {
      throw new Error('Must provide either coinIds or symbols for price data');
    }
  }

  private async getOHLCVData(query: CryptoDataQuery): Promise<CryptoOHLCVData[]> {
    if (!query.coinIds || query.coinIds.length === 0) {
      throw new Error('OHLCV data requires coinIds');
    }

    const coinId = query.coinIds[0]; // Get OHLCV for first coin
    return await this.dsl.getOHLCVData({
      coinId,
      days: query.days || 30,
      interval: query.timeframe || 'daily',
    });
  }

  private async getAnalyticsData(): Promise<CryptoMarketAnalytics> {
    return await this.dsl.getMarketAnalytics();
  }

  /**
   * Generate simple data summary (no AI processing - Actor pattern)
   */
  private generateDataSummary(data: CryptoDataResult, query: CryptoDataQuery): string {
    return `Data Summary for CoinGecko Query:

Query: ${JSON.stringify(query)}
Data Retrieved:
- Prices: ${data.prices?.length || 0} cryptocurrencies
- OHLCV: ${data.ohlcv?.length || 0} data points  
- Market Analytics: ${!!data.analytics}

Status:
- Data acquired successfully from CoinGecko
- ${data.prices?.length || 0} price records processed
- Market analysis ${data.analytics ? 'included' : 'not included'}
- Summary generated at ${new Date().toISOString()}

Note: Data ready for downstream processing.`;
  }

  /**
   * Generate market data summary (no AI processing - Actor pattern)
   */
  private generateMarketSummary(
    analytics: CryptoMarketAnalytics,
    sentiment: string,
    topPerformers: any
  ): string {
    return `Market Data Summary:

Market Analytics:
- Total Market Cap: $${analytics.totalMarketCap}
- Total Volume: $${analytics.totalVolume}
- BTC Dominance: ${analytics.btcDominance}%
- Market Cap Change 24h: ${analytics.marketCapChange24h}%

Current Sentiment: ${sentiment}
Top Gainers: ${JSON.stringify(topPerformers.gainers?.slice(0, 3) || [])}
Top Losers: ${JSON.stringify(topPerformers.losers?.slice(0, 3) || [])}

Note: This is raw market data. For AI-powered insights, use a Market Analysis Agent.`;
  }

  /**
   * Generate search results summary (no AI processing - Actor pattern)
   */
  private generateSearchSummary(query: string, results: CryptoPriceData[]): string {
    if (results.length === 0) {
      return `No cryptocurrencies found matching "${query}".`;
    }

    const summary = `Search Results for "${query}":

Found: ${results.length} cryptocurrencies
Sample results:
${results.slice(0, 3).map(r => `- ${r.symbol}: $${r.usdPrice}`).join('\n')}

Note: This is raw search data. For AI-powered analysis, use a Market Analysis Agent.`;

    return summary;
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CoinGecko Actor not initialized. Call initialize() first.');
    }
  }

  private updateQueryMetrics(): void {
    this.queryCount++;
    this.lastQuery = new Date();
  }

  /**
   * Get actor status
   */
  getStatus(): CoinGeckoActorStatus {
    return {
      isConnected: this.isInitialized && this.dsl.getStatus().isConnected,
      serverStatus: this.dsl.getStatus().serverStatus,
      lastQuery: this.lastQuery,
      totalQueries: this.queryCount,
    };
  }

  /**
   * Get the underlying DSL for advanced operations
   */
  getDSL(): CoinGeckoDSL {
    return this.dsl;
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return this.dsl.getServerInfo();
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create CoinGecko Actor instance
 */
export function createCoinGeckoActor(config: CoinGeckoActorConfig): CoinGeckoActor {
  return new CoinGeckoActor(config);
}

// Legacy alias for backward compatibility
export function createCoinGeckoAgent(config: CoinGeckoActorConfig): CoinGeckoActor {
  return new CoinGeckoActor(config);
}