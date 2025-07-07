#!/usr/bin/env bun

/**
 * CoinGecko Market Data Reader With MCP - TRUE MCP Actor Implementation
 *
 * MCP Actor Definition: "A class that extends Client and provides DSL interfaces"
 *
 * This Reader:
 * - IS an MCP Client (extends MCP SDK Client directly)
 * - Provides financial market data acquisition DSL interfaces for CoinGecko MCP server
 * - Uses qicore Result<T> for functional error handling
 * - Direct MCP SDK integration with inheritance pattern
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
// Import shared DSL implementation and data types
// Note: CoinGeckoDSL.ts removed - functionality moved to MarketDataReader implementations

// =============================================================================
// COINGECKO ACTOR CONFIGURATION
// =============================================================================

export interface CoinGeckoReaderConfig {
  useRemoteServer?: boolean;
  environment?: "pro" | "demo" | "free";
  debug?: boolean;
  timeout?: number;
}

// =============================================================================
// COINGECKO ACTOR - TRUE ACTOR IMPLEMENTATION
// =============================================================================

/**
 * CoinGecko Market Data Reader - MCP Composition Pattern
 *
 * Uses composition with MCP SDK Client to provide cryptocurrency
 * market data acquisition DSL interfaces with functional error handling.
 */
export class CoinGeckoMarketDataReaderWithMCP {
  private mcpClient: Client;
  private config: CoinGeckoReaderConfig;
  private isInitialized = false;
  private serverConnected = false;
  private totalQueries = 0;
  private errorCount = 0;
  private lastActivity?: Date;

  constructor(config: CoinGeckoReaderConfig & { name: string }) {
    this.config = {
      useRemoteServer: true, // Default to working remote server
      environment: "free",
      debug: false,
      timeout: 30000,
      ...config,
    };

    // Create MCP client via composition (like working SimpleMCPReader)
    this.mcpClient = new Client(
      {
        name: config.name || "coingecko-actor",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );
  }

  // =============================================================================
  // MCP CLIENT FUNCTIONALITY - COMPOSITION PATTERN
  // =============================================================================

  /**
   * Connect to MCP server
   */
  async connect(transport: any): Promise<void> {
    await this.mcpClient.connect(transport);
    this.serverConnected = true;
  }

  /**
   * Call MCP tool
   */
  async callTool(request: { name: string; arguments: any }): Promise<any> {
    return await this.mcpClient.callTool(request);
  }

  /**
   * List available MCP tools
   */
  async listTools(): Promise<any> {
    return await this.mcpClient.listTools();
  }

  /**
   * Close MCP connection
   */
  async close(): Promise<void> {
    if (this.serverConnected) {
      await this.mcpClient.close();
      this.serverConnected = false;
    }
  }

  // =============================================================================
  // ACTOR LIFECYCLE - REQUIRED IMPLEMENTATIONS
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🎭 Initializing CoinGecko TRUE Actor...");
      }

      // Create transport to CoinGecko MCP server
      const transport = await this.createTransport();

      // Connect using MCP SDK Client.connect() - inherited method
      await this.connect(transport);

      this.isInitialized = true;
      this.serverConnected = true;

      if (this.config.debug) {
        console.log("✅ CoinGecko TRUE Actor initialized - IS MCP client");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "ACTOR_INIT_FAILED",
        `CoinGecko Actor initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error, config: this.config },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  async cleanup(): Promise<Result<void>> {
    try {
      if (this.config.debug) {
        console.log("🛑 Cleaning up CoinGecko TRUE Actor...");
      }

      // Close MCP connection using inherited method
      if (this.serverConnected) {
        await this.close();
        this.serverConnected = false;
      }

      this.isInitialized = false;

      if (this.config.debug) {
        console.log("✅ CoinGecko TRUE Actor cleanup completed");
      }

      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "ACTOR_CLEANUP_FAILED",
        `CoinGecko Actor cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // FINANCIAL MARKET DATA ACQUISITION DSL - IMPLEMENTATIONS
  // =============================================================================

  // =============================================================================
  // DSL METHODS - USING SIMPLE PATTERN LIKE WORKING SIMPLEMCPREADER
  // =============================================================================

  // DSL Function 1: Get current price - simplified working pattern
  async getCurrentPrice(coinId: string, vsCurrency = "usd"): Promise<Result<number>> {
    try {
      this.updateActivity();

      const result = await this.callTool({
        name: "get_coins_markets",
        arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 },
      });

      // Extract price from MCP response (same as SimpleMCPReader)
      if (result?.content?.[0]?.text) {
        const data = JSON.parse(result.content[0].text);
        if (data && data.length > 0 && data[0].current_price) {
          return success(data[0].current_price);
        }
      }

      return failure(
        createQiError("NO_PRICE_DATA", "No price data found in response", "BUSINESS", {
          coinId,
          vsCurrency,
          result,
        }),
      );
    } catch (error) {
      this.incrementErrors();
      return failure(
        createQiError(
          "PRICE_FETCH_ERROR",
          `Price fetch failed: ${error instanceof Error ? error.message : String(error)}`,
          "SYSTEM",
          { coinId, vsCurrency, error },
        ),
      );
    }
  }

  // =============================================================================
  // DATA TRANSFORMATION UTILITIES
  // =============================================================================

  private extractMCPData<T>(result: any): T {
    if (result?.content?.[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch (error) {
        throw new Error(`Failed to parse MCP response: ${error}`);
      }
    }
    return result?.data || result;
  }

  // =============================================================================
  // UTILITY METHODS (FROM BASEREADER)
  // =============================================================================

  protected updateActivity(): void {
    this.totalQueries++;
    this.lastActivity = new Date();
  }

  protected incrementErrors(): void {
    this.errorCount++;
  }

  // Stub implementations - TODO: Add real implementations one at a time
  async getCurrentPrices(): Promise<Result<any[]>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getCurrentOHLCV(): Promise<Result<any>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getLatestOHLCV(): Promise<Result<any[]>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getPriceHistory(): Promise<Result<any[]>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getOHLCVByDateRange(): Promise<Result<any[]>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getAvailableTickers(): Promise<Result<any[]>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getLevel1Data(): Promise<Result<any>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  async getMarketAnalytics(): Promise<Result<any>> {
    throw new Error("Not implemented yet - add one at a time");
  }

  // =============================================================================
  // ACTOR STATUS - REQUIRED IMPLEMENTATION
  // =============================================================================

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.serverConnected,
      serverName: "coingecko",
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  protected async createTransport() {
    if (this.config.useRemoteServer) {
      const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));

      if (this.config.debug) {
        console.log("🔍 Created SSE transport:", transport.constructor.name);
        console.log("🔍 Transport has start method:", typeof transport.start);
      }

      return transport;
    }

    // Local server (keeping for reference)
    const env = {
      ...process.env,
      COINGECKO_RATE_LIMIT: "50",
      COINGECKO_TIMEOUT: String(this.config.timeout || 30000),
      COINGECKO_USE_FREE_API: "true",
      COINGECKO_OMIT_API_HEADERS: "true",
      COINGECKO_ENVIRONMENT: this.config.environment || "free",
    };

    return new StdioClientTransport({
      command: "npx",
      args: ["-y", "@coingecko/coingecko-mcp", "--client=claude"],
      env,
    });
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCoinGeckoMarketDataReaderWithMCP(
  config: CoinGeckoReaderConfig & { name: string },
): CoinGeckoMarketDataReaderWithMCP {
  return new CoinGeckoMarketDataReaderWithMCP(config);
}
