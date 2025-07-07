export declare abstract class BaseAgent {
  readonly name: string;
  constructor(name: string);
  abstract initialize(): Promise<void>;
  abstract cleanup(): Promise<void>;
}
export declare class MCPClient {
  private logger;
  private connections;
  constructor(logger: any);
  connectToServer(config: {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
  }): Promise<void>;
  callTool(server: string, tool: string, params: any): Promise<any>;
  private handlePostgresToolCall;
  private handleCoinGeckoToolCall;
  private handleKafkaToolCall;
  disconnect(): Promise<void>;
}
import type { MarketAnalytics } from "../publishers/types";
export interface PlatformConfig {
  redpandaBrokers: string[];
  postgresConnectionString: string;
  coinGeckoApiKey?: string;
  aivenToken?: string;
}
export declare class CryptoPlatformAgent extends BaseAgent {
  private mcpClient;
  private config;
  private toolRegistry;
  private producer;
  private consumer;
  constructor(config: PlatformConfig);
  initialize(): Promise<void>;
  /**
   * Setup message handlers for consumer
   */
  private setupMessageHandlers;
  setupCryptoTopics(): Promise<void>;
  setupDatabaseTables(): Promise<void>;
  collectCryptoData(symbols?: string[]): Promise<void>;
  collectOHLCVData(symbol: string, days?: string): Promise<void>;
  processStreamData(): Promise<void>;
  analyzeMarketData(): Promise<MarketAnalytics>;
  monitorPlatform(): Promise<void>;
  handleAlert(alert: {
    type: string;
    message: string;
    timestamp: number;
    groupId?: string;
    topic?: string;
  }): Promise<void>;
  cleanup(): Promise<void>;
  orchestratePlatform(): Promise<void>;
}
