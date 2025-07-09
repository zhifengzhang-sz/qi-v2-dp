#!/usr/bin/env bun

/**
 * CoinGecko MCP Reader - Crypto Market Context
 *
 * Extends BaseMCPReader and implements ONLY the handler methods.
 * All DSL workflow is inherited from the base class.
 * This follows the proven v-0.1.0 architecture pattern.
 */

import type { Level1, MarketContext, OHLCV, Price } from "@qi/fp/dsl";
import { BaseMCPReader } from "../abstract/BaseMCPReader";

// =============================================================================
// COINGECKO MCP READER - HANDLER IMPLEMENTATION ONLY
// =============================================================================

export interface CoinGeckoMCPConfig {
  name: string;
  debug?: boolean;
  timeout?: number;
  useRemoteServer?: boolean;
}

export class CoinGeckoMCPReader extends BaseMCPReader {
  constructor(config: CoinGeckoMCPConfig) {
    super({
      name: config.name,
      debug: config.debug,
      mcpServerUrl: "https://mcp.api.coingecko.com/sse",
      timeout: config.timeout || 30000,
      maxRetries: 3,
    });
  }

  // =============================================================================
  // HANDLER IMPLEMENTATIONS - ONLY BUSINESS LOGIC
  // =============================================================================

  protected async getPriceHandler(context: MarketContext): Promise<Price> {
    const data = await this.callMCPTool("get_coins_markets", {
      ids: context.symbol.ticker.toLowerCase(),
      vs_currency: context.symbol.currency.toLowerCase(),
      per_page: 1,
    });

    if (!data || data.length === 0) {
      throw new Error(`No price data found for ${context.symbol.ticker}`);
    }

    const coinData = data[0];
    return {
      timestamp: new Date(coinData.last_updated || context.timestamp),
      price: coinData.current_price,
      size: coinData.total_volume || 0,
    };
  }

  protected async getOHLCVHandler(context: MarketContext, timeframe: string): Promise<OHLCV> {
    const interval = this.mapTimeframeToInterval(timeframe);
    const { startTime, endTime } = this.calculateTimeRange(timeframe);

    const data = await this.callMCPTool("get_range_coins_ohlc", {
      id: context.symbol.ticker.toLowerCase(),
      from: startTime,
      to: endTime,
      vs_currency: context.symbol.currency.toLowerCase(),
      interval: interval,
    });

    if (!data || data.length === 0) {
      throw new Error(`No OHLCV data found for ${context.symbol.ticker}`);
    }

    // Get the latest OHLCV data point
    const latest = data[data.length - 1];
    const [timestamp, open, high, low, close] = latest;

    return {
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 0, // CoinGecko OHLC doesn't include volume
    };
  }

  protected async getLevel1Handler(context: MarketContext): Promise<Level1> {
    const data = await this.callMCPTool("get_coins_markets", {
      ids: context.symbol.ticker.toLowerCase(),
      vs_currency: context.symbol.currency.toLowerCase(),
      per_page: 1,
    });

    if (!data || data.length === 0) {
      throw new Error(`No Level1 data found for ${context.symbol.ticker}`);
    }

    const coinData = data[0];
    const price = coinData.current_price;

    // CoinGecko doesn't provide real bid/ask data, approximate from current price
    const spread = price * 0.001; // 0.1% spread approximation
    const level1Size = 1000; // Approximate size

    return {
      timestamp: new Date(coinData.last_updated || context.timestamp),
      bidPrice: price - spread / 2,
      bidSize: level1Size,
      askPrice: price + spread / 2,
      askSize: level1Size,
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private mapTimeframeToInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      "1h": "hourly",
      "4h": "hourly",
      "1d": "daily",
      "1w": "daily",
      "1M": "daily",
    };
    return mapping[timeframe] || "daily";
  }

  private calculateTimeRange(timeframe: string): { startTime: number; endTime: number } {
    const now = Date.now();
    const endTime = Math.floor(now / 1000);

    const timeRanges: Record<string, number> = {
      "1h": 3600 * 1000, // 1 hour
      "4h": 3600 * 4 * 1000, // 4 hours
      "1d": 86400 * 1000, // 1 day
      "1w": 86400 * 7 * 1000, // 1 week
      "1M": 86400 * 30 * 1000, // 1 month
    };

    const range = timeRanges[timeframe] || 86400 * 1000;
    const startTime = Math.floor((now - range) / 1000);

    return { startTime, endTime };
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      mcpClientInitialized: this.mcpClientInitialized,
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
      dataSource: "coingecko-mcp-crypto",
      marketContext: "crypto",
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCoinGeckoMCPReader(config: CoinGeckoMCPConfig): CoinGeckoMCPReader {
  return new CoinGeckoMCPReader(config);
}
