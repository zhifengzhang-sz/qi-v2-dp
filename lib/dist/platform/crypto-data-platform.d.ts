import type { PlatformConfig } from "../agents/crypto-platform-agent";
import type { CoinGeckoMCPConfig, PostgresMCPConfig, RedpandaMCPConfig } from "../mcp-launchers";
export interface CryptoDataPlatformConfig {
  platform: PlatformConfig;
  mcpServers: {
    postgres: PostgresMCPConfig;
    kafka: RedpandaMCPConfig;
    coingecko: CoinGeckoMCPConfig;
  };
  enableMonitoring?: boolean;
}
/**
 * QiCore Crypto Data Platform - Official MCP Architecture Implementation
 *
 * This class implements the official MCP servers first architecture per docs/data-stream:
 * Architecture: QiAgent → QiMCP Client → Official MCP Servers → Services
 *
 * Official MCP Servers Used:
 * - PostgreSQL MCP: @modelcontextprotocol/server-postgres (TimescaleDB compatible)
 * - Kafka MCP: @confluent/mcp-confluent or Redpanda's official MCP
 * - CoinGecko MCP: @coingecko/coingecko-mcp (15k+ coins, 8M+ tokens)
 */
export declare class CryptoDataPlatform {
  private mcpServerManager;
  private platformAgent;
  private config;
  private isRunning;
  constructor(config: CryptoDataPlatformConfig);
  /**
   * Start the complete crypto data platform
   * Follows official MCP servers first architecture per docs/data-stream
   */
  start(): Promise<void>;
  /**
   * Stop the complete crypto data platform
   */
  stop(): Promise<void>;
  /**
   * Get comprehensive platform status
   */
  getStatus(): object;
  /**
   * Get detailed platform information
   */
  getPlatformInfo(): object;
  /**
   * Execute platform operations via official MCP servers only
   */
  executeOperation(operation: string, params?: any): Promise<any>;
  /**
   * Start platform monitoring
   */
  private startMonitoring;
  /**
   * Print current platform status
   */
  private printPlatformStatus;
  /**
   * Graceful shutdown handler
   */
  setupGracefulShutdown(): void;
}
