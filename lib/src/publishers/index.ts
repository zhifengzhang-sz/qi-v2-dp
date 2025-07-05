// Publishers Index - Agent/MCP Centric Architecture
// Export all publisher agents (data acquiring agents)

export { 
  DataAcquiringAgent, 
  createDataAcquiringAgent,
  type CryptoDataRequest,
  type PublishedDataMetrics,
  type StreamingSchedule
} from './data.acquiring.agent';

// Legacy exports (TODO: Migrate to Agent/MCP pattern)
export { CryptoDataPublisher } from "./crypto-data-publisher";
export { PricePublisher } from "./price-publisher";
export { OHLCVPublisher } from "./ohlcv-publisher";
export { AnalyticsPublisher } from "./analytics-publisher";
export * from "./types";

// Re-export for convenience
export type { AgentConfig } from '@qicore/agent-lib/qiagent';
export type { MCPClient } from '@qicore/agent-lib/qimcp/client';

/**
 * Publisher Agents Directory
 * 
 * Contains agents that implement the publisher pattern:
 * FUNCTIONALITY: Get data from data source → Publish data into data stream
 * 
 * Architecture:
 * - Agent = QiAgent + DSL + MCPWrapper
 * - Data Source: External APIs (CoinGecko, CryptoCompare, etc.) via Official MCP Servers
 * - Data Stream: Redpanda topics via Custom MCP Tools
 * 
 * Current Agents:
 * - DataAcquiringAgent: Multi-source crypto data publisher with AI enrichment
 * 
 * Usage:
 * ```typescript
 * import { createDataAcquiringAgent } from './publishers';
 * 
 * const agent = createDataAcquiringAgent(config, mcpClient, schedule, logger);
 * await agent.initialize();
 * await agent.acquireAndPublishData(request);
 * ```
 */
