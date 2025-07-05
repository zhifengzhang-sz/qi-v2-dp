// Consumers Index - Agent/MCP Centric Architecture
// Export all consumer agents (data store agents)

export { 
  DataStoreAgent, 
  createDataStoreAgent,
  type StreamConsumerConfig,
  type StorageMetrics,
  type DataValidationResult,
  type StorageOptimization
} from './data.store.agent';

// Legacy exports (TODO: Migrate to Agent/MCP pattern)
export { CryptoDataConsumer } from "./crypto-data-consumer";
export { PriceConsumer } from "./price-consumer";
export { OHLCVConsumer } from "./ohlcv-consumer";
export { AnalyticsConsumer } from "./analytics-consumer";
export * from "./types";

// Re-export for convenience
export type { AgentConfig } from '@qicore/agent-lib/qiagent';
export type { MCPClient } from '@qicore/agent-lib/qimcp/client';

/**
 * Consumer Agents Directory
 * 
 * Contains agents that implement the consumer pattern:
 * FUNCTIONALITY: Get data from data stream → Store data into data store
 * 
 * Architecture:
 * - Agent = QiAgent + DSL + MCPWrapper
 * - Data Stream: Redpanda topics via Custom MCP Tools
 * - Data Store: TimescaleDB/ClickHouse via Official MCP Servers
 * 
 * Current Agents:
 * - DataStoreAgent: Multi-destination crypto data consumer with AI validation
 * 
 * Usage:
 * ```typescript
 * import { createDataStoreAgent } from './consumers';
 * 
 * const agent = createDataStoreAgent(config, mcpClient, consumerConfig, logger);
 * await agent.initialize();
 * await agent.consumeAndStoreData();
 * ```
 */
