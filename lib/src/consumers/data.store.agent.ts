// Data Store Agent (Consumer) - Agent/MCP Centric Architecture
// FUNCTIONALITY: Get data from data stream → Store data into data store

import { BaseAgent, type AgentConfig } from '@qicore/agent-lib/qiagent';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';
import { PromptTemplate } from '@qicore/agent-lib/qiprompt';

// Import MCP wrappers and DSLs
import { RedpandaStreamingMCPWrapper } from '../mcp-tools/datastream/redpanda.mcp.wrapper';
import { TimescaleDBMCPWrapper } from '../mcp-tools/database/timescaledb.mcp.wrapper';
import { RedpandaStreamingDSL } from '../mcp-tools/datastream/redpanda.streaming.dsl';
import { TimescaleDBFinancialDSL } from '../mcp-tools/database/timescaledb.financial.dsl';

// Data types
export interface StreamConsumerConfig {
  topics: string[];
  consumerGroup: string;
  batchSize: number;
  processingInterval: number; // milliseconds
  maxRetries: number;
}

export interface StorageMetrics {
  totalRecordsProcessed: number;
  successfulInserts: number;
  failedInserts: number;
  averageProcessingTime: number;
  lastProcessedTimestamp: Date;
  databaseHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedData?: any;
}

export interface StorageOptimization {
  compressionApplied: boolean;
  retentionPolicyActive: boolean;
  hypertableOptimized: boolean;
  indexesOptimized: boolean;
}

/**
 * Data Store Agent (Consumer Agent)
 * 
 * Agent Definition: QiAgent + DSL + MCPWrapper
 * - QiAgent: AI orchestration for data processing and storage decisions
 * - DSL: Domain-specific operations for crypto data storage
 * - MCPWrapper: Standardized interfaces to streaming and database systems
 * 
 * FUNCTIONALITY: Get data from data stream → Store data into data store
 * 
 * Workflow:
 * 1. Get data from data stream: Redpanda MCP → Stream consumption
 * 2. AI Processing: Agent validates, enriches, and optimizes data
 * 3. Store data into data store: TimescaleDB MCP → Time-series storage
 */
export class DataStoreAgent extends BaseAgent {
  // MCP Wrappers (Interface to external systems)
  private streamingMCP: RedpandaStreamingMCPWrapper;
  private databaseMCP: TimescaleDBMCPWrapper;
  
  // DSLs (Domain-specific operations)
  private streamingDSL: RedpandaStreamingDSL;
  private databaseDSL: TimescaleDBFinancialDSL;
  
  // Agent configuration
  private consumerConfig: StreamConsumerConfig;
  private isConsuming: boolean = false;
  private consumptionMetrics: StorageMetrics;
  private processingBuffer: any[] = [];

  constructor(
    config: AgentConfig,
    mcpClient: MCPClient,
    consumerConfig: StreamConsumerConfig = {
      topics: ['crypto-prices', 'crypto-ohlcv', 'crypto-analytics'],
      consumerGroup: 'data-store-consumer-group',
      batchSize: 1000,
      processingInterval: 5000, // 5 seconds
      maxRetries: 3
    },
    logger?: any
  ) {
    super(config, logger);
    
    this.consumerConfig = consumerConfig;
    this.consumptionMetrics = {
      totalRecordsProcessed: 0,
      successfulInserts: 0,
      failedInserts: 0,
      averageProcessingTime: 0,
      lastProcessedTimestamp: new Date(),
      databaseHealth: 'healthy'
    };
    
    // Initialize MCP Wrappers
    this.streamingMCP = new RedpandaStreamingMCPWrapper(mcpClient);
    this.databaseMCP = new TimescaleDBMCPWrapper(mcpClient);
    
    // Initialize DSLs
    this.streamingDSL = new RedpandaStreamingDSL(this.streamingMCP);
    this.databaseDSL = new TimescaleDBFinancialDSL(this.databaseMCP);
  }

  async initialize(): Promise<void> {
    this.logger?.info('🚀 Initializing Data Store Agent...');
    
    // Verify MCP connections
    await this.streamingMCP.connect();
    await this.databaseMCP.connect();
    
    // Setup database schema and optimizations
    await this.databaseDSL.initializeFinancialSchema();
    await this.optimizeDatabase();
    
    // Start consuming from stream
    await this.startStreamConsumption();
    
    this.logger?.info('✅ Data Store Agent initialized successfully');
  }

  /**
   * CORE FUNCTIONALITY: Get data from data stream → Store data into data store
   */
  async consumeAndStoreData(): Promise<StorageMetrics> {
    const startTime = Date.now();
    
    try {
      this.logger?.info('🔄 Starting stream consumption and storage cycle...');

      // STEP 1: Get data from data stream (Redpanda MCP)
      const streamData = await this.consumeDataFromStream();
      
      if (streamData.length === 0) {
        this.logger?.debug('📭 No new data in stream');
        return this.consumptionMetrics;
      }

      // STEP 2: AI Processing - Validate, enrich, and optimize data
      const processedData = await this.processDataWithAI(streamData);

      // STEP 3: Store data into data store (TimescaleDB MCP)
      const storageResults = await this.storeDataInDatabase(processedData);
      
      // Update metrics
      this.updateMetrics(storageResults, Date.now() - startTime);

      this.logger?.info(`✅ Processing cycle complete: ${storageResults.successful}/${streamData.length} records stored`);
      return this.consumptionMetrics;

    } catch (error) {
      this.logger?.error('❌ Consumption and storage cycle failed:', error);
      this.consumptionMetrics.databaseHealth = 'unhealthy';
      throw error;
    }
  }

  /**
   * STEP 1: Get data from data stream
   * Uses Redpanda MCP for stream consumption
   */
  private async consumeDataFromStream(): Promise<any[]> {
    const streamData: any[] = [];

    try {
      // Consume from all configured topics
      for (const topic of this.consumerConfig.topics) {
        const messages = await this.streamingDSL.consumeMessages(
          topic,
          this.consumerConfig.consumerGroup,
          this.consumerConfig.batchSize
        );

        if (messages.length > 0) {
          streamData.push(...messages);
          this.logger?.info(`📥 Consumed ${messages.length} messages from ${topic}`);
        }
      }

      return streamData;

    } catch (error) {
      this.logger?.error('❌ Stream consumption failed:', error);
      throw error;
    }
  }

  /**
   * STEP 2: AI Processing - Validate, enrich, and optimize data
   * Agent uses AI to process streaming data for optimal storage
   */
  private async processDataWithAI(streamData: any[]): Promise<any[]> {
    // Create AI prompt for data processing
    const prompt = new PromptTemplate(`
      You are a crypto data storage optimization expert. Process the following streaming data for optimal time-series storage:
      
      Stream Data: {data}
      Total Records: {count}
      Data Types: {types}
      
      Tasks:
      1. Validate data integrity and completeness
      2. Detect and handle duplicates based on timestamp + symbol
      3. Normalize data formats for TimescaleDB optimization
      4. Identify optimal batching strategies for bulk inserts
      5. Flag anomalies that need special handling
      6. Optimize data types and precision for financial calculations
      
      Return processed data ready for efficient TimescaleDB storage.
      Group by data type (prices, ohlcv, analytics) for batch optimization.
    `);

    const processedData = [];
    const batchSize = 100; // Process in smaller batches for AI

    for (let i = 0; i < streamData.length; i += batchSize) {
      const batch = streamData.slice(i, i + batchSize);
      
      try {
        // Extract data types from batch
        const dataTypes = [...new Set(batch.map(item => item.type || 'unknown'))];
        
        // AI-powered data processing
        const result = await this.processWithAI(prompt, {
          data: JSON.stringify(batch),
          count: batch.length.toString(),
          types: dataTypes.join(', ')
        });

        // Parse AI response and add processed data
        const processedBatch = JSON.parse(result);
        
        // Validate AI output
        const validatedBatch = await this.validateProcessedData(processedBatch);
        processedData.push(...validatedBatch);

      } catch (error) {
        this.logger?.warn(`⚠️ AI processing failed for batch ${i}, using manual validation:`, error);
        
        // Fallback to manual processing
        const manuallyProcessed = await this.manualDataProcessing(batch);
        processedData.push(...manuallyProcessed);
      }
    }

    this.logger?.info(`🧠 AI processing complete: ${processedData.length} validated records`);
    return processedData;
  }

  /**
   * STEP 3: Store data into data store
   * Uses TimescaleDB MCP for optimized time-series storage
   */
  private async storeDataInDatabase(
    data: any[]
  ): Promise<{ successful: number; failed: number; tables: string[] }> {
    let successful = 0;
    let failed = 0;
    const tables: string[] = [];

    // Group data by type for optimized batch inserts
    const dataByType = this.groupDataByType(data);

    for (const [type, records] of dataByType.entries()) {
      try {
        let tableName: string;
        
        switch (type) {
          case 'price':
            tableName = 'crypto_prices';
            await this.databaseDSL.storeCryptoPrices(records);
            break;
          case 'ohlcv':
            tableName = 'ohlcv_data';
            await this.databaseDSL.storeOHLCVData(records);
            break;
          case 'market_data':
            tableName = 'market_analytics';
            await this.databaseDSL.storeMarketAnalytics(records);
            break;
          case 'analytics':
            tableName = 'crypto_analytics';
            await this.databaseDSL.storeCryptoAnalytics(records);
            break;
          default:
            tableName = 'crypto_general';
            await this.databaseDSL.storeGenericCryptoData(records, tableName);
        }

        successful += records.length;
        tables.push(tableName);
        
        this.logger?.info(`💾 Stored ${records.length} ${type} records in ${tableName}`);

      } catch (error) {
        this.logger?.error(`❌ Failed to store ${type} data:`, error);
        failed += records.length;
        
        // Attempt retry with exponential backoff
        await this.retryFailedStorage(type, records);
      }
    }

    return { successful, failed, tables };
  }

  /**
   * Start continuous stream consumption
   */
  private async startStreamConsumption(): Promise<void> {
    if (this.isConsuming) {
      this.logger?.warn('⚠️ Stream consumption already active');
      return;
    }

    this.isConsuming = true;
    this.logger?.info('🔄 Starting continuous stream consumption...');

    // Continuous consumption loop
    const consumptionLoop = async () => {
      while (this.isConsuming) {
        try {
          await this.consumeAndStoreData();
          
          // Wait for next processing interval
          await new Promise(resolve => 
            setTimeout(resolve, this.consumerConfig.processingInterval)
          );
          
        } catch (error) {
          this.logger?.error('❌ Consumption loop error:', error);
          
          // Exponential backoff on errors
          await new Promise(resolve => 
            setTimeout(resolve, this.consumerConfig.processingInterval * 2)
          );
        }
      }
    };

    // Start consumption loop
    consumptionLoop();

    this.logger?.info('✅ Continuous stream consumption started');
  }

  /**
   * Validate processed data from AI
   */
  private async validateProcessedData(data: any[]): Promise<any[]> {
    const validatedData = [];

    for (const record of data) {
      const validation = await this.validateRecord(record);
      
      if (validation.isValid) {
        validatedData.push(validation.correctedData || record);
      } else {
        this.logger?.warn(`⚠️ Invalid record detected:`, validation.errors);
        
        // Try to correct if possible
        if (validation.correctedData) {
          validatedData.push(validation.correctedData);
        }
      }
    }

    return validatedData;
  }

  /**
   * Validate individual record
   */
  private async validateRecord(record: any): Promise<DataValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let correctedData = { ...record };

    // Basic validation
    if (!record.timestamp) {
      errors.push('Missing timestamp');
    }

    if (!record.symbol && !record.coinId) {
      errors.push('Missing symbol or coinId');
    }

    // Financial data validation
    if (record.type === 'price') {
      if (!record.usd_price || record.usd_price <= 0) {
        errors.push('Invalid USD price');
      }
      
      // Auto-correct timestamp format
      if (typeof record.timestamp === 'string') {
        correctedData.timestamp = new Date(record.timestamp);
        warnings.push('Converted timestamp to Date object');
      }
    }

    // OHLCV validation
    if (record.type === 'ohlcv') {
      const requiredFields = ['open', 'high', 'low', 'close', 'volume'];
      for (const field of requiredFields) {
        if (!record[field] || record[field] < 0) {
          errors.push(`Invalid ${field} value`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedData: warnings.length > 0 ? correctedData : undefined
    };
  }

  /**
   * Manual data processing fallback
   */
  private async manualDataProcessing(batch: any[]): Promise<any[]> {
    const processed = [];

    for (const record of batch) {
      // Basic cleanup and normalization
      const cleanRecord = {
        ...record,
        timestamp: new Date(record.timestamp || Date.now()),
        symbol: record.symbol?.toUpperCase() || record.coinId,
        processed_at: new Date(),
        source: 'manual_processing'
      };

      // Type-specific processing
      if (record.type === 'price') {
        cleanRecord.usd_price = parseFloat(record.usd_price || record.price || 0);
        cleanRecord.market_cap = parseFloat(record.market_cap || 0);
        cleanRecord.volume_24h = parseFloat(record.volume_24h || record.total_volume || 0);
      }

      processed.push(cleanRecord);
    }

    return processed;
  }

  /**
   * Retry failed storage with exponential backoff
   */
  private async retryFailedStorage(type: string, records: any[]): Promise<void> {
    for (let attempt = 1; attempt <= this.consumerConfig.maxRetries; attempt++) {
      try {
        this.logger?.info(`🔄 Retry attempt ${attempt} for ${type} data...`);
        
        // Wait with exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );

        // Retry storage
        switch (type) {
          case 'price':
            await this.databaseDSL.storeCryptoPrices(records);
            break;
          case 'ohlcv':
            await this.databaseDSL.storeOHLCVData(records);
            break;
          default:
            await this.databaseDSL.storeGenericCryptoData(records, 'crypto_general');
        }

        this.logger?.info(`✅ Retry successful for ${type} data`);
        return;

      } catch (error) {
        this.logger?.warn(`⚠️ Retry ${attempt} failed for ${type}:`, error);
        
        if (attempt === this.consumerConfig.maxRetries) {
          this.logger?.error(`❌ All retries exhausted for ${type} data`);
        }
      }
    }
  }

  /**
   * Optimize database for time-series performance
   */
  private async optimizeDatabase(): Promise<StorageOptimization> {
    this.logger?.info('🛠️ Optimizing database for time-series storage...');

    const optimization: StorageOptimization = {
      compressionApplied: false,
      retentionPolicyActive: false,
      hypertableOptimized: false,
      indexesOptimized: false
    };

    try {
      // Create hypertables if not exists
      await this.databaseDSL.createHypertables();
      optimization.hypertableOptimized = true;

      // Setup compression policies
      await this.databaseDSL.setupCompressionPolicies();
      optimization.compressionApplied = true;

      // Setup retention policies
      await this.databaseDSL.setupRetentionPolicies();
      optimization.retentionPolicyActive = true;

      // Optimize indexes
      await this.databaseDSL.optimizeIndexes();
      optimization.indexesOptimized = true;

      this.logger?.info('✅ Database optimization complete');
      
    } catch (error) {
      this.logger?.error('❌ Database optimization failed:', error);
    }

    return optimization;
  }

  /**
   * Group data by type for optimized batch processing
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
   * Update consumption metrics
   */
  private updateMetrics(
    results: { successful: number; failed: number }, 
    processingTime: number
  ): void {
    this.consumptionMetrics.totalRecordsProcessed += results.successful + results.failed;
    this.consumptionMetrics.successfulInserts += results.successful;
    this.consumptionMetrics.failedInserts += results.failed;
    this.consumptionMetrics.lastProcessedTimestamp = new Date();
    
    // Update average processing time
    const currentAvg = this.consumptionMetrics.averageProcessingTime;
    const newAvg = (currentAvg + processingTime) / 2;
    this.consumptionMetrics.averageProcessingTime = newAvg;
    
    // Update health status
    const successRate = this.consumptionMetrics.successfulInserts / this.consumptionMetrics.totalRecordsProcessed;
    if (successRate >= 0.95) {
      this.consumptionMetrics.databaseHealth = 'healthy';
    } else if (successRate >= 0.80) {
      this.consumptionMetrics.databaseHealth = 'degraded';
    } else {
      this.consumptionMetrics.databaseHealth = 'unhealthy';
    }
  }

  /**
   * Get storage metrics and status
   */
  async getStorageStatus(): Promise<StorageMetrics & {
    isConsuming: boolean;
    consumerGroup: string;
    topicsSubscribed: string[];
  }> {
    return {
      ...this.consumptionMetrics,
      isConsuming: this.isConsuming,
      consumerGroup: this.consumerConfig.consumerGroup,
      topicsSubscribed: this.consumerConfig.topics
    };
  }

  /**
   * Stop stream consumption
   */
  async stopConsumption(): Promise<void> {
    this.logger?.info('🛑 Stopping stream consumption...');
    this.isConsuming = false;
    
    // Process remaining buffer
    if (this.processingBuffer.length > 0) {
      await this.storeDataInDatabase(this.processingBuffer);
      this.processingBuffer = [];
    }
    
    this.logger?.info('✅ Stream consumption stopped');
  }

  /**
   * Manual storage for specific data
   */
  async storeSpecificData(data: any[], dataType: string): Promise<StorageMetrics> {
    const processed = await this.processDataWithAI(data);
    await this.storeDataInDatabase(processed);
    return this.consumptionMetrics;
  }

  /**
   * Cleanup and disconnect
   */
  async cleanup(): Promise<void> {
    this.logger?.info('🛑 Stopping Data Store Agent...');
    
    // Stop consumption
    await this.stopConsumption();
    
    // Disconnect MCP clients
    await this.streamingMCP.disconnect();
    await this.databaseMCP.disconnect();
    
    this.logger?.info('✅ Data Store Agent cleanup completed');
  }
}

// Export agent factory for easy instantiation
export function createDataStoreAgent(
  config: AgentConfig,
  mcpClient: MCPClient,
  consumerConfig?: StreamConsumerConfig,
  logger?: any
): DataStoreAgent {
  return new DataStoreAgent(config, mcpClient, consumerConfig, logger);
}