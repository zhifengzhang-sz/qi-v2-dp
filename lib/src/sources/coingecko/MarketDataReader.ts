#!/usr/bin/env bun

/**
 * CoinGecko Market Data Reader - Clean Plugin Implementation
 *
 * This Reader:
 * - Extends BaseReader for unified DSL foundation
 * - Implements only the plugin functions for CoinGecko-specific logic
 * - BaseReader handles all DSL interface + workflow complexity
 */

import { type ResultType as Result, createQiError, failure, success } from "@qi/core/base";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  CurrentPricesOptions,
  DateRangeOHLCVQuery,
  Level1Data,
  Level1Query,
} from "../../abstract/dsl";
import { BaseReader } from "../../abstract/readers/BaseReader";

// Direct MCP imports for external server
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// =============================================================================
// COINGECKO MARKET DATA READER CONFIGURATION
// =============================================================================

export interface CoinGeckoActorConfig {
  name: string;
  debug?: boolean;
  timeout?: number;
  useRemoteServer?: boolean;
}

// =============================================================================
// COINGECKO MARKET DATA READER - CLEAN PLUGIN IMPLEMENTATION
// =============================================================================

export class CoinGeckoMarketDataReader extends BaseReader {
  protected config: CoinGeckoActorConfig & { name: string };
  private mcpClient?: Client;
  private mcpClientInitialized = false;

  constructor(config: CoinGeckoActorConfig & { name: string }) {
    super({
      name: config.name || "coingecko-market-data-reader",
      debug: config.debug,
    });

    this.config = {
      useRemoteServer: true,
      timeout: 30000,
      debug: false,
      ...config
    };

    // Create MCP client directly
    this.mcpClient = new Client(
      {
        name: config.name || "coingecko-market-data-reader",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  // =============================================================================
  // READER LIFECYCLE
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log("🎭 Initializing CoinGecko Actor...");
      }

      // Connect directly to external CoinGecko MCP server
      if (this.mcpClient) {
        try {
          if (this.config.debug) {
            console.log("🚀 Connecting to external CoinGecko MCP server...");
          }

          const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));
          await this.mcpClient.connect(transport);
          this.mcpClientInitialized = true;

          // Add MCP client to BaseReader's client management  
          this.addClient("coingecko-mcp", this.mcpClient, {
            name: "coingecko-mcp",
            type: "data-source"
          });
          
          // Mark client as connected
          const clientAssoc = this.getClient("coingecko-mcp");
          if (clientAssoc) {
            clientAssoc.isConnected = true;
          }

          if (this.config.debug) {
            console.log("✅ Connected to external CoinGecko MCP server");
          }
        } catch (error) {
          if (this.config.debug) {
            console.log("⚠️ MCP server connection failed:", error);
          }
          this.mcpClientInitialized = false;
        }
      }

      this.isInitialized = true;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_INIT_FAILED",
        `CoinGecko Reader initialization failed: ${error instanceof Error ? error.message : String(error)}`,
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
        console.log("🛑 Cleaning up CoinGecko Actor...");
      }

      if (this.mcpClient && this.mcpClientInitialized) {
        await this.mcpClient.close();
        this.mcpClientInitialized = false;
      }

      this.isInitialized = false;
      return success(undefined);
    } catch (error: unknown) {
      const qiError = createQiError(
        "READER_CLEANUP_FAILED",
        `CoinGecko Reader cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        "SYSTEM",
        { error },
      );

      this.errorCount++;
      return failure(qiError);
    }
  }

  // =============================================================================
  // PLUGIN IMPLEMENTATIONS - COINGECKO-SPECIFIC API CALLS
  // =============================================================================

  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 },
    });
  }

  protected async getCurrentPricesPlugin(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: {
        ids: coinIds.join(","),
        vs_currency: options?.vsCurrencies?.[0] || "usd",
        include_market_cap: options?.includeMarketData || false,
        include_24hr_change: options?.includePriceChange || false,
        per_page: 250,
      },
    });
  }

  protected async getCurrentOHLCVPlugin(
    coinId: string,
    interval: "hourly" | "daily",
  ): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    return this.mcpClient.callTool({
      name: "get_range_coins_ohlc",
      arguments: {
        id: coinId,
        from: Math.floor((Date.now() - 86400000) / 1000),
        to: Math.floor(Date.now() / 1000),
        vs_currency: "usd",
        interval: interval,
      },
    });
  }

  protected async getLatestOHLCVPlugin(
    coinId: string,
    count: number,
    interval: "hourly" | "daily",
  ): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const { startTime, endTime } = this.calculateOHLCVTimeRange(count, interval);
    return this.mcpClient.callTool({
      name: "get_range_coins_ohlc",
      arguments: {
        id: coinId,
        from: startTime,
        to: endTime,
        vs_currency: "usd",
        interval: interval,
      },
    });
  }

  protected async getPriceHistoryPlugin(
    coinId: string,
    dateStart: Date,
    dateEnd: Date,
  ): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_range_coins_market_chart",
      arguments: {
        id: coinId,
        from: Math.floor(dateStart.getTime() / 1000),
        to: Math.floor(dateEnd.getTime() / 1000),
        vs_currency: "usd",
      },
    });
    const data = this.extractMCPData(result) as {
      prices: Array<[number, number]>;
    };
    return data.prices;
  }

  protected async getOHLCVByDateRangePlugin(query: DateRangeOHLCVQuery): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    return this.mcpClient.callTool({
      name: "get_range_coins_ohlc",
      arguments: {
        id: query.ticker,
        from: Math.floor(query.dateStart.getTime() / 1000),
        to: Math.floor(query.dateEnd.getTime() / 1000),
        vs_currency: "usd",
        interval: query.interval === "1d" ? "daily" : "hourly",
      },
    });
  }

  protected async getAvailableTickersPlugin(limit: number): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_coins_list",
      arguments: { include_platform: false },
    });
    const data = this.extractMCPData(result) as Array<{
      id: string;
      symbol: string;
      name: string;
    }>;
    return data.slice(0, limit);
  }

  protected async getLevel1DataPlugin(query: Level1Query): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    // CoinGecko doesn't provide real Level1 data, so we get current price and approximate
    return this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: query.ticker, vs_currency: "usd", per_page: 1 },
    });
  }

  protected async getMarketAnalyticsPlugin(): Promise<any> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    return this.mcpClient.callTool({
      name: "get_global",
      arguments: {},
    });
  }

  // =============================================================================
  // TRANSFORM IMPLEMENTATIONS - COINGECKO-SPECIFIC DATA TRANSFORMATION
  // =============================================================================

  protected transformCurrentPrice(data: any): number {
    const extracted = this.extractMCPData(data) as Array<{
      current_price: number;
    }>;
    return extracted[0].current_price;
  }

  protected transformCurrentPrices(data: any): CryptoPriceData[] {
    const extracted = this.extractMCPData(data) as Array<any>;
    return extracted.map((coin) => ({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      usdPrice: coin.current_price || 0,
      btcPrice: coin.price_btc,
      ethPrice: coin.price_eth,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      change24h: coin.price_change_percentage_24h,
      change7d: coin.price_change_percentage_7d,
      lastUpdated: new Date(),
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
    }));
  }

  protected transformCurrentOHLCV(coinId: string, data: any): CryptoOHLCVData {
    const extracted = this.extractMCPData(data) as Array<[number, number, number, number, number]>;
    const latest = extracted[extracted.length - 1];
    const [timestamp, open, high, low, close] = latest;

    return {
      coinId,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 0,
      timeframe: "daily",
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
    };
  }

  protected transformLatestOHLCV(coinId: string, data: any): CryptoOHLCVData[] {
    const extracted = this.extractMCPData(data) as Array<[number, number, number, number, number]>;
    return extracted.map(([timestamp, open, high, low, close]) => ({
      coinId,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 0,
      timeframe: "daily",
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
    }));
  }

  protected transformPriceHistory(data: any): Array<{ date: Date; price: number }> {
    return data.map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp),
      price,
    }));
  }

  protected transformOHLCVByDateRange(ticker: string, data: any): CryptoOHLCVData[] {
    const extracted = this.extractMCPData(data) as Array<[number, number, number, number, number]>;
    return extracted.map(([timestamp, open, high, low, close]) => ({
      coinId: ticker,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 0,
      timeframe: "daily",
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
    }));
  }

  protected transformAvailableTickers(data: any, limit: number): CryptoPriceData[] {
    return data.map((coin: { id: string; symbol: string; name: string }) => ({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      usdPrice: 0,
      lastUpdated: new Date(),
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
    }));
  }

  protected transformLevel1Data(query: Level1Query, data: any): Level1Data {
    const extracted = this.extractMCPData(data) as Array<{
      current_price: number;
    }>;
    const price = extracted[0].current_price;
    const spread = price * 0.001;

    return {
      ticker: query.ticker,
      timestamp: new Date(),
      bestBid: price - spread / 2,
      bestAsk: price + spread / 2,
      spread: spread,
      spreadPercent: 0.1,
      market: query.market || "coingecko",
      source: "coingecko-mcp",
      attribution: "Approximated from CoinGecko current price",
    };
  }

  protected transformMarketAnalytics(data: any): CryptoMarketAnalytics {
    const globalData = this.extractMCPData(data) as any;

    return {
      timestamp: new Date(),
      totalMarketCap: globalData.data?.total_market_cap?.usd || 0,
      totalVolume: globalData.data?.total_volume?.usd || 0,
      btcDominance: globalData.data?.market_cap_percentage?.btc || 0,
      ethDominance: globalData.data?.market_cap_percentage?.eth || 0,
      activeCryptocurrencies: globalData.data?.active_cryptocurrencies || 0,
      markets: globalData.data?.markets || 0,
      marketCapChange24h: globalData.data?.market_cap_change_percentage_24h_usd || 0,
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
    };
  }

  // =============================================================================
  // UTILITY METHODS
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
  // VALIDATION OVERRIDES - CONCRETE CLASS KNOWS MCP RESPONSE FORMAT
  // =============================================================================

  protected validateCurrentPrice(data: any): boolean {
    // After transformation, data should be a number
    return typeof data === "number" && data > 0;
  }

  protected validateCurrentPrices(data: any): boolean {
    // After transformation, data should be an array of CryptoPriceData
    return Array.isArray(data) && data.length > 0;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      mcpClientInitialized: this.mcpClientInitialized,
      hasMCPClient: !!this.mcpClient,
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
      dataSource: this.mcpClientInitialized ? "mcp+api" : "api-only",
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCoinGeckoMarketDataReader(
  config: CoinGeckoActorConfig & { name: string },
): CoinGeckoMarketDataReader {
  return new CoinGeckoMarketDataReader(config);
}
