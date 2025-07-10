#!/usr/bin/env bun

/**
 * CoinGecko MCP Reader - Real Implementation
 *
 * Reads cryptocurrency market data from CoinGecko via MCP protocol.
 * Supports price and OHLCV data, but Level1 data is not available.
 */

import type { MarketDataReader } from "../../../../dsl/interfaces";
import {
  Exchange,
  InstrumentType,
  type Level1,
  type MarketContext,
  type MarketSymbol,
  OHLCV,
  Price,
} from "../../../../dsl/types";
import type { TimeInterval } from "../../../../dsl/utils";
import {
  type ResultType as Result,
  createQiError,
  failure,
  success,
} from "../../../../qicore/base";

// =============================================================================
// COINGECKO MCP READER
// =============================================================================

export class CoinGeckoMCPReader implements MarketDataReader {
  private client: any; // MCP client will be injected

  constructor(private config: { name: string; debug?: boolean; mcpClient?: any }) {
    this.client = config.mcpClient;
  }

  // =============================================================================
  // MARKET DATA READER INTERFACE IMPLEMENTATION
  // =============================================================================

  async readPrice(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Price | Price[]> {
    if (symbol.assetClass !== "crypto") {
      throw new Error(`Only crypto assets are supported, got ${symbol.assetClass}`);
    }

    // For historical data, we need to use OHLCV and extract close prices
    if (interval) {
      this.validateTimeInterval(interval);

      // Get OHLCV data and convert to Price array
      const ohlcvData = (await this.readOHLCV(symbol, context, interval)) as OHLCV[];
      return ohlcvData.map((ohlcv) => Price.create(ohlcv.timestamp, ohlcv.close, ohlcv.volume));
    }

    // Current price - use simple price endpoint
    const result = await this.client.callTool({
      name: "get_simple_price",
      arguments: {
        ids: symbol.ticker.toLowerCase(),
        vs_currencies: symbol.currency.toLowerCase(),
      },
    });

    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error("Invalid response from CoinGecko MCP");
    }

    const data = JSON.parse(result.content[0].text);
    if (!data || typeof data !== "object") {
      throw new Error("No price data available");
    }

    // Get price from simple price response
    const coinId = symbol.ticker.toLowerCase();
    const currency = symbol.currency.toLowerCase();
    const price = data[coinId]?.[currency];

    if (!price) {
      throw new Error(`No price data available for ${coinId} in ${currency}`);
    }

    return Price.create(
      new Date(),
      price,
      0, // Volume not available in price endpoint
    );
  }

  async readLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Level1 | Level1[]> {
    // CoinGecko MCP Server does not provide Level1 bid/ask data
    throw new Error(
      `Level1 data not available for ${symbol.ticker}. CoinGecko MCP Server does not provide real-time bid/ask data. Consider using CCXT MCP Server or Twelve Data MCP Server for Level1 data.`,
    );
  }

  async readOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<OHLCV | OHLCV[]> {
    if (symbol.assetClass !== "crypto") {
      throw new Error(`Only crypto assets are supported, got ${symbol.assetClass}`);
    }

    // Calculate days based on timeInterval or default to 1 day
    let days = 1;
    if (interval) {
      this.validateTimeInterval(interval);
      const diffTime = interval.endDate.getTime() - interval.startDate.getTime();
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const result = await this.client.callTool({
      name: "get_range_coins_ohlc",
      arguments: {
        id: symbol.ticker.toLowerCase(),
        vs_currency: symbol.currency.toLowerCase(),
        from: Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000),
        to: Math.floor(Date.now() / 1000),
        interval: "daily",
      },
    });

    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error("Invalid response from CoinGecko MCP");
    }

    const data = JSON.parse(result.content[0].text);
    if (!data || !Array.isArray(data)) {
      throw new Error("No OHLCV data available");
    }

    // Convert to OHLCV data classes
    const ohlcvData = data.map(
      ([timestamp, open, high, low, close]: [number, number, number, number, number]) =>
        OHLCV.create(
          new Date(timestamp),
          open,
          high,
          low,
          close,
          0, // Volume not provided by this endpoint
        ),
    );

    // Filter by time interval if provided
    if (interval) {
      const filtered = ohlcvData.filter(
        (ohlcv) => ohlcv.timestamp >= interval.startDate && ohlcv.timestamp <= interval.endDate,
      );
      return filtered;
    }

    // Return single latest OHLCV if no time interval
    return ohlcvData.length > 0 ? ohlcvData[ohlcvData.length - 1] : ohlcvData[0];
  }

  async readHistoricalPrices(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Price[]> {
    const result = await this.readPrice(symbol, context, interval);
    return Array.isArray(result) ? result : [result];
  }

  async readHistoricalLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Level1[]> {
    throw new Error("Level1 data not supported by CoinGecko MCP Server");
  }

  async readHistoricalOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<OHLCV[]> {
    const result = await this.readOHLCV(symbol, context, interval);
    return Array.isArray(result) ? result : [result];
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private validateTimeInterval(timeInterval: TimeInterval): void {
    if (timeInterval.startDate >= timeInterval.endDate) {
      throw new Error("Start date must be before end date");
    }
    if (timeInterval.endDate > new Date()) {
      throw new Error("End date cannot be in the future");
    }
  }
}
