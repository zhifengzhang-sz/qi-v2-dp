// Data Acquiring Agent (Publisher) - Agent/MCP Centric Architecture
// FUNCTIONALITY: Get data from data source → Publish data into data stream

import { BaseAgent, type AgentConfig, PromptTemplate, MCPClient } from '../base/base-agent';

// Import Agents and MCP wrappers
import { CoinGeckoAgent, createCoinGeckoAgent, type CoinGeckoAgentConfig } from './sources/coingecko/coingecko-agent';
import { RedpandaStreamingMCPWrapper } from '../mcp-tools/datastream/redpanda.mcp.wrapper';
import { RedpandaStreamingDSL } from '../mcp-tools/datastream/redpanda.streaming.dsl';

// Data types
export interface CryptoDataRequest {
  symbols: string[];
  dataTypes: ('price' | 'ohlcv' | 'market_data')[];
  frequency: number; // minutes
  enrichWithTechnicalIndicators?: boolean;
}

export interface PublishedDataMetrics {
  totalRecords: number;
  successfulPublishes: number;
  failedPublishes: number;
  averageLatency: number;
  topics: string[];
  timestamp: Date;
}

export interface StreamingSchedule {
  priceUpdates: number; // minutes
  ohlcvUpdates: number; // minutes  
  marketDataUpdates: number; // minutes
  technicalAnalysis: number; // minutes
}

/**
 * Data Acquiring Agent (Publisher Agent)
 * 
 * Agent Definition: QiAgent + DSL + MCPWrapper
 * - QiAgent: AI orchestration and decision making
 * - DSL: Domain-specific operations for crypto data acquisition
 * - MCPWrapper: Standardized interfaces to external services
 * 
 * FUNCTIONALITY: Get data from data source → Publish data into data stream
 * 
 * Workflow:
 * 1. Get data from data source: CoinGecko MCP Server → Raw crypto data
 * 2. AI Processing: Agent enriches and validates data
 * 3. Publish data into data stream: Redpanda MCP → Streaming topics
 */
export class DataAcquiringAgent extends BaseAgent {
  // Agents (Complete Agent/MCP implementations)
  private coinGeckoAgent: CoinGeckoAgent;
  
  // MCP Wrappers (Interface to external systems)
  private redpandaMCP: RedpandaStreamingMCPWrapper;
  
  // DSLs (Domain-specific operations)
  private streamingDSL: RedpandaStreamingDSL;
  
  // Agent configuration
  private schedule: StreamingSchedule;
  private activeSubscriptions: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    schedule: StreamingSchedule = {
      priceUpdates: 1,      // Every 1 minute
      ohlcvUpdates: 5,      // Every 5 minutes
      marketDataUpdates: 15, // Every 15 minutes
      technicalAnalysis: 60  // Every 60 minutes
    },
    coinGeckoConfig?: CoinGeckoAgentConfig,
    logger?: any
  ) {
    super(config, logger);
    
    this.schedule = schedule;
    
    // Initialize Agents
    this.coinGeckoAgent = createCoinGeckoAgent({
      name: 'coingecko-agent',
      description: 'CoinGecko crypto data agent',
      version: '1.0.0',
      logger: logger,
      ...coinGeckoConfig,
    });
    
    // Initialize MCP Wrappers
    this.redpandaMCP = new RedpandaStreamingMCPWrapper(mcpClient);
    
    // Initialize DSLs
    this.streamingDSL = new RedpandaStreamingDSL(this.redpandaMCP);
  }

  async initialize(): Promise<void> {
    this.logger?.info('🚀 Initializing Data Acquiring Agent...');
    
    // Initialize agents
    await this.coinGeckoAgent.initialize();
    
    // Verify MCP connections
    await this.redpandaMCP.connect();
    
    // Setup streaming topics
    await this.streamingDSL.setupCryptoTopics();
    
    // Start scheduled data acquisition
    await this.startScheduledAcquisition();
    
    this.logger?.info('✅ Data Acquiring Agent initialized successfully');
  }

  /**
   * CORE FUNCTIONALITY: Get data from data source → Publish data into data stream
   */
  async acquireAndPublishData(request: CryptoDataRequest): Promise<PublishedDataMetrics> {
    const startTime = Date.now();
    const metrics: PublishedDataMetrics = {
      totalRecords: 0,
      successfulPublishes: 0,
      failedPublishes: 0,
      averageLatency: 0,
      topics: [],
      timestamp: new Date()
    };

    try {
      this.logger?.info(`🔄 Starting data acquisition for ${request.symbols.length} symbols`);

      // STEP 1: Get data from data source (CoinGecko MCP Server)
      const cryptoData = await this.acquireDataFromSource(request);
      metrics.totalRecords = cryptoData.length;

      // STEP 2: AI Processing - Enrich and validate data
      const enrichedData = await this.processDataWithAI(cryptoData, request);

      // STEP 3: Publish data into data stream (Redpanda MCP)
      const publishResults = await this.publishDataToStream(enrichedData, request.dataTypes);
      
      metrics.successfulPublishes = publishResults.successful;
      metrics.failedPublishes = publishResults.failed;
      metrics.topics = publishResults.topics;
      metrics.averageLatency = Date.now() - startTime;

      this.logger?.info(`✅ Data acquisition complete: ${metrics.successfulPublishes}/${metrics.totalRecords} records published`);
      return metrics;

    } catch (error) {
      this.logger?.error('❌ Data acquisition failed:', error);
      metrics.failedPublishes = metrics.totalRecords;
      throw error;
    }
  }

  /**
   * STEP 1: Get data from data source
   * Uses CoinGecko Agent (Agent/MCP paradigm)
   */
  private async acquireDataFromSource(request: CryptoDataRequest): Promise<any[]> {
    const allData: any[] = [];

    // Convert symbols to coinIds (simplified mapping for demo)
    const coinIds = request.symbols.map(symbol => symbol.toLowerCase());

    // Use CoinGecko Agent to get comprehensive crypto data
    const result = await this.coinGeckoAgent.getCryptoData({
      coinIds,
      dataTypes: request.dataTypes,
      includeAnalysis: request.enrichWithTechnicalIndicators,
    });

    // Transform agent results to our format
    if (result.prices) {
      allData.push(...result.prices.map(data => ({ ...data, type: 'price' })));
    }
    if (result.ohlcv) {
      allData.push(...result.ohlcv.map(data => ({ ...data, type: 'ohlcv' })));
    }
    if (result.analytics) {
      allData.push({ ...result.analytics, type: 'market_data' });
    }

    this.logger?.info(`📊 Acquired ${allData.length} records from CoinGecko Agent`);
    return allData;
  }

  /**
   * STEP 2: AI Processing - Enrich and validate data
   * Agent uses AI to process and enrich the data
   */
  private async processDataWithAI(rawData: any[], request: CryptoDataRequest): Promise<any[]> {
    // Create AI prompt for data processing
    const prompt = new PromptTemplate(`
      You are a crypto data processing expert. Analyze and enrich the following crypto data:
      
      Data: {data}
      Symbols: {symbols}
      Requirements: {requirements}
      
      Tasks:
      1. Validate data completeness and accuracy
      2. Calculate additional metrics (volatility, momentum indicators)
      3. Detect anomalies or unusual patterns
      4. Add market context and analysis
      5. Format for optimal streaming consumption
      
      Return structured data ready for publication to streaming platform.
    `);

    const enrichedData = [];
    const batchSize = 10; // Process in batches for efficiency

    for (let i = 0; i < rawData.length; i += batchSize) {
      const batch = rawData.slice(i, i + batchSize);
      
      try {
        // AI-powered data enrichment
        const result = await this.processWithAI(prompt, {
          data: JSON.stringify(batch),
          symbols: request.symbols.join(', '),
          requirements: request.dataTypes.join(', ')
        });

        // Parse AI response and add enriched data
        const processedBatch = JSON.parse(result);
        enrichedData.push(...processedBatch);

      } catch (error) {
        this.logger?.warn(`⚠️ AI processing failed for batch ${i}, using raw data:`, error);
        enrichedData.push(...batch);
      }
    }

    // Add technical indicators if requested
    if (request.enrichWithTechnicalIndicators) {
      await this.addTechnicalIndicators(enrichedData);
    }

    this.logger?.info(`🧠 AI processing complete: ${enrichedData.length} enriched records`);
    return enrichedData;
  }

  /**
   * STEP 3: Publish data into data stream
   * Uses Redpanda MCP for high-performance streaming
   */
  private async publishDataToStream(
    data: any[], 
    dataTypes: string[]
  ): Promise<{ successful: number; failed: number; topics: string[] }> {
    let successful = 0;
    let failed = 0;
    const topics: string[] = [];

    // Group data by type for efficient publishing
    const dataByType = this.groupDataByType(data);

    for (const [type, records] of dataByType.entries()) {
      try {
        let topic: string;
        
        switch (type) {
          case 'price':
            topic = 'crypto-prices';
            await this.streamingDSL.publishPriceData(records);
            break;
          case 'ohlcv':
            topic = 'crypto-ohlcv';
            await this.streamingDSL.publishOHLCVData(records);
            break;
          case 'market_data':
            topic = 'crypto-analytics';
            await this.streamingDSL.publishMarketData(records);
            break;
          default:
            topic = 'crypto-general';
            await this.streamingDSL.publishGenericData(records, topic);
        }

        successful += records.length;
        topics.push(topic);
        
        this.logger?.info(`📤 Published ${records.length} ${type} records to ${topic}`);

      } catch (error) {
        this.logger?.error(`❌ Failed to publish ${type} data:`, error);
        failed += records.length;
      }
    }

    return { successful, failed, topics };
  }

  /**
   * Start scheduled data acquisition based on configuration
   */
  private async startScheduledAcquisition(): Promise<void> {
    this.logger?.info('⏰ Starting scheduled data acquisition...');

    // Price updates (high frequency)
    const priceInterval = setInterval(async () => {
      await this.acquireAndPublishData({
        symbols: ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'],
        dataTypes: ['price'],
        frequency: this.schedule.priceUpdates
      });
    }, this.schedule.priceUpdates * 60 * 1000);

    // OHLCV updates (medium frequency)
    const ohlcvInterval = setInterval(async () => {
      await this.acquireAndPublishData({
        symbols: ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'],
        dataTypes: ['ohlcv'],
        frequency: this.schedule.ohlcvUpdates
      });
    }, this.schedule.ohlcvUpdates * 60 * 1000);

    // Market data updates (low frequency)
    const marketInterval = setInterval(async () => {
      await this.acquireAndPublishData({
        symbols: ['bitcoin', 'ethereum', 'cardano', 'solana', 'polkadot'],
        dataTypes: ['market_data'],
        frequency: this.schedule.marketDataUpdates,
        enrichWithTechnicalIndicators: true
      });
    }, this.schedule.marketDataUpdates * 60 * 1000);

    // Store intervals for cleanup
    this.activeSubscriptions.set('prices', priceInterval);
    this.activeSubscriptions.set('ohlcv', ohlcvInterval);
    this.activeSubscriptions.set('market', marketInterval);

    this.logger?.info('✅ Scheduled acquisition started');
  }

  /**
   * Add technical indicators to enriched data
   */
  private async addTechnicalIndicators(data: any[]): Promise<void> {
    // Add moving averages, RSI, MACD, etc.
    // This would use technical analysis libraries
    for (const record of data) {
      if (record.type === 'price' || record.type === 'ohlcv') {
        record.technicalIndicators = {
          sma_20: await this.calculateSMA(record, 20),
          rsi_14: await this.calculateRSI(record, 14),
          volume_sma: await this.calculateVolumeSMA(record, 10),
          price_change_24h: this.calculatePriceChange(record),
          volatility: this.calculateVolatility(record)
        };
      }
    }
  }

  /**
   * Helper methods for technical analysis
   */
  private async calculateSMA(record: any, period: number): Promise<number> {
    // Implementation would fetch historical data and calculate SMA
    return 0; // Placeholder
  }

  private async calculateRSI(record: any, period: number): Promise<number> {
    // Implementation would calculate RSI
    return 50; // Placeholder
  }

  private async calculateVolumeSMA(record: any, period: number): Promise<number> {
    // Implementation would calculate volume SMA
    return 0; // Placeholder
  }

  private calculatePriceChange(record: any): number {
    // Calculate 24h price change percentage
    return record.price_change_percentage_24h || 0;
  }

  private calculateVolatility(record: any): number {
    // Calculate recent volatility
    return Math.abs(record.price_change_percentage_24h || 0) / 100;
  }

  /**
   * Group data by type for efficient publishing
   */
  private groupDataByType(data: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>();
    
    for (const record of data) {
      const type = record.type || 'unknown';
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(record);
    }
    
    return grouped;
  }

  /**
   * Manual data acquisition for specific symbols and data types
   */
  async acquireSpecificData(
    symbols: string[], 
    dataTypes: ('price' | 'ohlcv' | 'market_data')[]
  ): Promise<PublishedDataMetrics> {
    return await this.acquireAndPublishData({
      symbols,
      dataTypes,
      frequency: 0, // One-time acquisition
      enrichWithTechnicalIndicators: true
    });
  }

  /**
   * Get acquisition metrics and status
   */
  async getAcquisitionStatus(): Promise<{
    isRunning: boolean;
    activeSchedules: string[];
    lastAcquisition: Date | null;
    totalAcquisitions: number;
  }> {
    return {
      isRunning: this.activeSubscriptions.size > 0,
      activeSchedules: Array.from(this.activeSubscriptions.keys()),
      lastAcquisition: new Date(), // Would track actual last acquisition
      totalAcquisitions: 0 // Would track actual count
    };
  }

  /**
   * Cleanup and stop all scheduled acquisitions
   */
  async cleanup(): Promise<void> {
    this.logger?.info('🛑 Stopping Data Acquiring Agent...');
    
    // Clear all scheduled intervals
    for (const [name, interval] of this.activeSubscriptions) {
      clearInterval(interval);
      this.logger?.info(`⏹️ Stopped ${name} acquisition schedule`);
    }
    this.activeSubscriptions.clear();
    
    // Cleanup agents and MCP clients
    await this.coinGeckoAgent.cleanup();
    await this.redpandaMCP.disconnect();
    
    this.logger?.info('✅ Data Acquiring Agent cleanup completed');
  }
}

// Export agent factory for easy instantiation
export function createDataAcquiringAgent(
  config: AgentConfig,
  mcpClient: MCPClient,
  schedule?: StreamingSchedule,
  coinGeckoConfig?: CoinGeckoAgentConfig,
  logger?: any
): DataAcquiringAgent {
  return new DataAcquiringAgent(config, mcpClient, schedule, coinGeckoConfig, logger);
}