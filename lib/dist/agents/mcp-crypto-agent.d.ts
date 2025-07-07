import type { MarketAnalytics } from "../publishers/types";
import { BaseAgent } from "./crypto-platform-agent";
export interface AgentConfig {
  redpandaBrokers: string[];
  postgresConnectionString: string;
  coinGeckoApiKey?: string;
  aivenToken?: string;
}
/**
 * Agent/MCP-Centric Crypto Platform Agent
 *
 * Architecture: Agent → MCP Tools → High-Performance Modules
 *
 * Key insight: The agent orchestrates through MCP tools, which wrap
 * the high-performance implementations. This separates concerns:
 * - Agent: High-level AI decisions and orchestration
 * - MCP Tools: Standardized tool interface + business logic
 * - Modules: Optimized implementations for performance
 */
export declare class MCPCryptoPlatformAgent extends BaseAgent {
  private mcpClient;
  private toolRegistry;
  private config;
  constructor(config: AgentConfig);
  /**
   * Setup MCP Tools - Bridge to High-Performance Modules
   */
  private setupTools;
  initialize(): Promise<void>;
  /**
   * Infrastructure setup via MCP tools
   */
  private setupInfrastructure;
  /**
   * High-level data collection orchestration
   * Agent decides WHAT to collect, tools handle HOW
   */
  collectCryptoData(symbols?: string[]): Promise<void>;
  /**
   * OHLCV data collection with agent intelligence
   */
  collectOHLCVData(symbol: string, period?: string): Promise<void>;
  /**
   * Stream processing orchestration
   * Agent decides processing strategy, tools execute
   */
  processMarketStream(
    operation: "moving_average" | "volatility" | "trend_detection",
  ): Promise<void>;
  /**
   * Market analysis using agent intelligence + MCP tools
   */
  analyzeMarket(): Promise<MarketAnalytics>;
  /**
   * Agent intelligence methods
   */
  private prioritizeSymbols;
  private calculateOptimalInterval;
  private determineOptimalInterval;
  private calculateProcessingParams;
  private optimizeCollection;
  private handleCollectionError;
  cleanup(): Promise<void>;
  /**
   * Get agent status including tool availability
   */
  getStatus(): object;
}
