#!/usr/bin/env bun

/**
 * CoinGecko Market Data Reader - Clean Handler Implementation
 *
 * This Reader:
 * - Extends BaseReader for unified DSL foundation
 * - Implements only the handler functions for CoinGecko-specific logic
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
} from "../../../dsl";
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
// COINGECKO MARKET DATA READER - CLEAN HANDLER IMPLEMENTATION
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
      ...config,
    };

    // Create MCP client directly
    this.mcpClient = new Client(
      {
        name: config.name || "coingecko-market-data-reader",
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
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
            type: "data-source",
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
  // RESPONSE HANDLERS - COINGECKO API CALL + TRANSFORMATION IN ONE STEP
  // =============================================================================

  protected async getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId, vs_currency: vsCurrency, per_page: 1 },
    });
    const data = this.extractMCPData(result) as Array<{ current_price: number }>;
    return data[0].current_price;
  }

  protected async getCurrentPricesHandler(
    coinIds: string[],
    options?: CurrentPricesOptions,
  ): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: {
        ids: coinIds.join(","),
        vs_currency: options?.vsCurrencies?.[0] || "usd",
        include_market_cap: options?.includeMarketData || false,
        include_24hr_change: options?.includePriceChange || false,
        per_page: 250,
      },
    });
    const data = this.extractMCPData(result) as Array<any>;
    return data.map((coin) => ({
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
      exchangeId: "coingecko", // Added required field
    }));
  }

  protected async getCurrentOHLCVHandler(
    coinId: string,
    interval: "hourly" | "daily",
  ): Promise<CryptoOHLCVData> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_range_coins_ohlc",
      arguments: {
        id: coinId,
        from: Math.floor((Date.now() - 86400000) / 1000),
        to: Math.floor(Date.now() / 1000),
        vs_currency: "usd",
        interval: interval,
      },
    });
    const data = this.extractMCPData(result) as Array<[number, number, number, number, number]>;
    const latest = data[data.length - 1];
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
      exchangeId: "coingecko", // Added required field
    };
  }

  protected async getLatestOHLCVHandler(
    coinIds: string[],
    timeframe?: string,
  ): Promise<CryptoOHLCVData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // Convert timeframe to interval and count
    const count = 10; // Default
    const interval = timeframe === "1h" ? "hourly" : "daily";

    const results: CryptoOHLCVData[] = [];

    // Fetch OHLCV data for each coin
    for (const coinId of coinIds) {
      const { startTime, endTime } = this.calculateOHLCVTimeRange(count, interval);
      const result = await this.mcpClient.callTool({
        name: "get_range_coins_ohlc",
        arguments: {
          id: coinId,
          from: startTime,
          to: endTime,
          vs_currency: "usd",
          interval: interval,
        },
      });
      const data = this.extractMCPData(result) as Array<[number, number, number, number, number]>;
      const ohlcvData = data.map(([timestamp, open, high, low, close]) => ({
        coinId,
        timestamp: new Date(timestamp),
        open,
        high,
        low,
        close,
        volume: 0,
        timeframe: timeframe || "daily",
        source: "coingecko-mcp",
        attribution: "Data provided by CoinGecko API via MCP",
        exchangeId: "coingecko", // Added required field
      }));
      results.push(...ohlcvData);
    }

    return results;
  }

  protected async getPriceHistoryHandler(
    coinId: string,
    days: number,
    vsCurrency?: string,
  ): Promise<CryptoPriceData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }

    // Calculate date range from days
    const dateEnd = new Date();
    const dateStart = new Date(dateEnd.getTime() - days * 24 * 60 * 60 * 1000);

    const result = await this.mcpClient.callTool({
      name: "get_range_coins_market_chart",
      arguments: {
        id: coinId,
        from: Math.floor(dateStart.getTime() / 1000),
        to: Math.floor(dateEnd.getTime() / 1000),
        vs_currency: vsCurrency || "usd",
      },
    });
    const data = this.extractMCPData(result) as {
      prices: Array<[number, number]>;
    };
    return data.prices.map(([timestamp, price]: [number, number]) => ({
      coinId,
      symbol: coinId.toUpperCase(),
      name: coinId,
      usdPrice: price,
      lastUpdated: new Date(timestamp),
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
      exchangeId: "coingecko", // Added required field
    }));
  }

  protected async getOHLCVByDateRangeHandler(
    query: DateRangeOHLCVQuery,
  ): Promise<CryptoOHLCVData[]> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_range_coins_ohlc",
      arguments: {
        id: query.ticker,
        from: Math.floor(query.dateStart.getTime() / 1000),
        to: Math.floor(query.dateEnd.getTime() / 1000),
        vs_currency: "usd",
        interval: query.interval === "1d" ? "daily" : "hourly",
      },
    });
    const data = this.extractMCPData(result) as Array<[number, number, number, number, number]>;
    return data.map(([timestamp, open, high, low, close]) => ({
      coinId: query.ticker,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 0,
      timeframe: "daily",
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
      exchangeId: "coingecko", // Added required field
    }));
  }

  protected async getAvailableTickersHandler(limit: number): Promise<CryptoPriceData[]> {
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
    return data.slice(0, limit).map((coin) => ({
      coinId: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      usdPrice: 0,
      lastUpdated: new Date(),
      source: "coingecko-mcp",
      attribution: "Data provided by CoinGecko API via MCP",
      exchangeId: "coingecko", // Added required field
    }));
  }

  protected async getLevel1DataHandler(query: Level1Query): Promise<Level1Data> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    // CoinGecko doesn't provide real Level1 data, so we get current price and approximate
    const result = await this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: query.ticker, vs_currency: "usd", per_page: 1 },
    });
    const data = this.extractMCPData(result) as Array<{ current_price: number }>;
    const price = data[0].current_price;
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
      exchange: "coingecko", // Added required field
    };
  }

  protected async getMarketAnalyticsHandler(): Promise<CryptoMarketAnalytics> {
    if (!this.mcpClient) {
      throw new Error("MCP client not initialized");
    }
    const result = await this.mcpClient.callTool({
      name: "get_global",
      arguments: {},
    });
    const globalData = this.extractMCPData(result) as any;

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
