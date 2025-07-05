// MarketDataPublisherActor - A class of MCP client that provides DSL tooling interfaces
// Actor = Special MCP Client that provides DSL tooling interfaces for data streaming
//
// Business Logic: Knows how to properly stream market data with domain-specific topic routing

import { RedpandaClient } from '../redpanda/redpanda-client';
import type { MessagePayload, ProducerResponse } from '../redpanda/types';
import type { CryptoPriceData, CryptoOHLCVData, CryptoMarketAnalytics } from '../../publishers/sources/coingecko/coingecko-dsl';

// =============================================================================
// ACTOR TYPES
// =============================================================================

interface BaseActor {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

export interface MarketDataPublisherConfig {
  name: string;
  description?: string;
  version?: string;
  redpandaConfig?: {
    brokers?: string[];
    clientId?: string;
  };
  logger?: any;
}

// Market data input (source agnostic - doesn't know where data comes from)
export interface MarketDataInput {
  prices?: CryptoPriceData[];
  ohlcv?: CryptoOHLCVData[];
  analytics?: CryptoMarketAnalytics;
  timestamp: Date;
  source: string;
}

// Publishing result
export interface PublishResult {
  success: boolean;
  messagesPublished: number;
  topicsUsed: string[];
  responses: ProducerResponse[];
  errors?: string[];
}

// Topic routing rules (business logic)
interface TopicRules {
  prices: (ticker: string, market?: string) => string;
  ohlcv: (ticker: string, market?: string) => string;
  analytics: (market?: string) => string;
}

// =============================================================================
// MARKET DATA PUBLISHER ACTOR
// =============================================================================

/**
 * MarketDataPublisherActor - A class of MCP client that provides DSL tooling interfaces
 * 
 * Actor Definition: Special MCP client that provides DSL tooling interfaces for data streaming
 * - Specialty: DSL tooling interfaces for market data streaming domain
 * - Business Logic: Knows optimal streaming patterns and topic routing for market data
 * - Interface: Domain-specific streaming interfaces (hides MCP complexity)
 * 
 * Responsibilities:
 * - Provide DSL tooling interfaces for market data streaming operations
 * - Transform market data into stream-optimized messages (business logic)
 * - Route different data types to appropriate topics (domain knowledge)
 * - Handle partitioning and serialization (streaming expertise)
 * 
 * NOT an Agent - no workflow orchestration or AI decision making
 */
export class MarketDataPublisherActor implements BaseActor {
  // Streaming Component (Actor = Special MCP Client that provides DSL tooling interfaces)
  private client: RedpandaClient;
  
  // Actor state
  private config: MarketDataPublisherConfig;
  private isInitialized = false;
  private publishCount = 0;
  private lastPublish: Date | null = null;
  private logger?: any;

  // Business Logic: Topic routing rules (the Actor's domain expertise)
  private topicRules: TopicRules = {
    prices: (ticker: string, market = 'USD') => `crypto-prices-${market.toLowerCase()}-${ticker.toLowerCase()}`,
    ohlcv: (ticker: string, market = 'USD') => `crypto-ohlcv-${market.toLowerCase()}-${ticker.toLowerCase()}`,
    analytics: (market = 'global') => `crypto-analytics-${market.toLowerCase()}`
  };

  constructor(config: MarketDataPublisherConfig) {
    this.config = config;
    this.logger = config.logger;
    
    // Initialize streaming client (Actor = Special MCP Client that provides DSL tooling interfaces)
    const redpandaConfig = {
      brokers: config.redpandaConfig?.brokers || ['localhost:19092'],
      clientId: config.redpandaConfig?.clientId || config.name,
    };
    
    this.logger?.info(`🔗 MarketDataPublisher Actor connecting to brokers: ${redpandaConfig.brokers.join(', ')}`);
    this.client = new RedpandaClient(redpandaConfig);
  }

  // =============================================================================
  // ACTOR LIFECYCLE
  // =============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.logger?.info('🎭 Initializing MarketDataPublisher Actor...');

    try {
      await this.client.connect();
      
      // Create default topics with business logic
      await this.createDefaultTopics();
      
      this.isInitialized = true;
      this.logger?.info('✅ MarketDataPublisher Actor initialized successfully');
    } catch (error) {
      this.logger?.error('❌ MarketDataPublisher Actor initialization failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    this.logger?.info('🛑 Cleaning up MarketDataPublisher Actor...');
    
    try {
      await this.client.disconnect();
      this.isInitialized = false;
      this.logger?.info('✅ MarketDataPublisher Actor cleanup completed');
    } catch (error) {
      this.logger?.error('❌ MarketDataPublisher Actor cleanup failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // DSL TOOLING INTERFACES - Market Data Streaming Domain
  // =============================================================================

  /**
   * DSL Interface: Publish market data with business logic routing
   * - Actor knows how to route different data types to appropriate topics
   * - Actor handles partitioning, serialization, and optimization
   * - Source agnostic: doesn't know where data comes from
   */
  async publishMarketData(data: MarketDataInput): Promise<PublishResult> {
    this.ensureInitialized();
    this.updateMetrics();

    this.logger?.info(`📡 Publishing market data with ${data.prices?.length || 0} prices, ${data.ohlcv?.length || 0} OHLCV records`);

    const messages: MessagePayload[] = [];
    const topicsUsed = new Set<string>();

    try {
      // Business Logic: Route price data to price topics with coinId partitioning
      if (data.prices && data.prices.length > 0) {
        for (const priceData of data.prices) {
          const topic = this.topicRules.prices(priceData.symbol, 'USD');
          topicsUsed.add(topic);
          
          messages.push({
            topic,
            key: priceData.coinId, // Partition by coinId for load balancing
            value: {
              ...priceData,
              publishedAt: new Date().toISOString(),
              publisher: this.config.name
            },
            timestamp: Date.now()
          });
        }
      }

      // Business Logic: Route OHLCV data to time-series optimized topics
      if (data.ohlcv && data.ohlcv.length > 0) {
        for (const ohlcvData of data.ohlcv) {
          const topic = this.topicRules.ohlcv(ohlcvData.symbol || ohlcvData.coinId, 'USD');
          topicsUsed.add(topic);
          
          messages.push({
            topic,
            key: `${ohlcvData.coinId}-${ohlcvData.timestamp}`, // Partition by coinId+time
            value: {
              ...ohlcvData,
              publishedAt: new Date().toISOString(),
              publisher: this.config.name
            },
            timestamp: Date.now()
          });
        }
      }

      // Business Logic: Route analytics to analytics topic with time partitioning
      if (data.analytics) {
        const topic = this.topicRules.analytics('global');
        topicsUsed.add(topic);
        
        messages.push({
          topic,
          key: `analytics-${data.timestamp.getTime()}`, // Partition by timestamp
          value: {
            ...data.analytics,
            publishedAt: new Date().toISOString(),
            publisher: this.config.name,
            dataSource: data.source
          },
          timestamp: Date.now()
        });
      }

      // Batch publish for efficiency
      const responses = await this.client.produceBatch(messages);

      const result: PublishResult = {
        success: true,
        messagesPublished: messages.length,
        topicsUsed: Array.from(topicsUsed),
        responses
      };

      this.logger?.info(`✅ Published ${messages.length} messages to ${topicsUsed.size} topics`);
      return result;

    } catch (error) {
      this.logger?.error('❌ Failed to publish market data:', error);
      
      return {
        success: false,
        messagesPublished: 0,
        topicsUsed: Array.from(topicsUsed),
        responses: [],
        errors: [String(error)]
      };
    }
  }

  /**
   * DSL Interface: Publish single price update (optimized for real-time)
   */
  async publishPriceUpdate(priceData: CryptoPriceData): Promise<PublishResult> {
    return this.publishMarketData({
      prices: [priceData],
      timestamp: new Date(),
      source: priceData.source
    });
  }

  /**
   * DSL Interface: Publish OHLCV data batch (optimized for historical data)
   */
  async publishOHLCVBatch(ohlcvData: CryptoOHLCVData[]): Promise<PublishResult> {
    return this.publishMarketData({
      ohlcv: ohlcvData,
      timestamp: new Date(),
      source: ohlcvData[0]?.source || 'unknown'
    });
  }

  /**
   * DSL Interface: Publish market analytics (optimized for aggregated data)
   */
  async publishAnalytics(analytics: CryptoMarketAnalytics): Promise<PublishResult> {
    return this.publishMarketData({
      analytics,
      timestamp: new Date(),
      source: 'analytics'
    });
  }

  // =============================================================================
  // BUSINESS LOGIC - Domain Expertise
  // =============================================================================

  /**
   * Create default topics with optimal configurations for market data
   */
  private async createDefaultTopics(): Promise<void> {
    const defaultTopics = [
      // Price topics: High throughput, moderate retention
      { name: 'crypto-prices-usd-bitcoin', partitions: 3, replicationFactor: 1 },
      { name: 'crypto-prices-usd-ethereum', partitions: 3, replicationFactor: 1 },
      
      // OHLCV topics: Time-series optimized, longer retention
      { name: 'crypto-ohlcv-usd-bitcoin', partitions: 6, replicationFactor: 1 },
      { name: 'crypto-ohlcv-usd-ethereum', partitions: 6, replicationFactor: 1 },
      
      // Analytics topics: Lower throughput, long retention
      { name: 'crypto-analytics-global', partitions: 2, replicationFactor: 1 }
    ];

    for (const topicConfig of defaultTopics) {
      try {
        await this.client.createTopic(topicConfig);
        this.logger?.debug(`✅ Created topic: ${topicConfig.name}`);
      } catch (error) {
        // Topics might already exist - that's okay
        this.logger?.debug(`ℹ️ Topic ${topicConfig.name} already exists or creation failed`);
      }
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('MarketDataPublisher Actor not initialized. Call initialize() first.');
    }
  }

  private updateMetrics(): void {
    this.publishCount++;
    this.lastPublish = new Date();
  }

  /**
   * Get actor status
   */
  getStatus() {
    return {
      isConnected: this.isInitialized && this.client.getConnectionStatus(),
      publishCount: this.publishCount,
      lastPublish: this.lastPublish,
    };
  }

  /**
   * Get available topics
   */
  async getTopics(): Promise<string[]> {
    this.ensureInitialized();
    return await this.client.listTopics();
  }

  /**
   * Get streaming client for advanced operations
   */
  getStreamingClient(): RedpandaClient {
    return this.client;
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create MarketDataPublisher Actor instance
 */
export function createMarketDataPublisherActor(config: MarketDataPublisherConfig): MarketDataPublisherActor {
  return new MarketDataPublisherActor(config);
}