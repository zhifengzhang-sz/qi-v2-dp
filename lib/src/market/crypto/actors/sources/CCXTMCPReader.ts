#!/usr/bin/env bun

/**
 * CCXT MCP Reader - Real Implementation
 *
 * Reads cryptocurrency market data from exchanges via CCXT MCP protocol.
 * Supports real Level1 order book data, price, and OHLCV data.
 * Connects to 100+ cryptocurrency exchanges through unified CCXT interface.
 */

import type { MarketDataReader } from "../../../../dsl/interfaces";
import {
  Exchange,
  InstrumentType,
  Level1,
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
// CCXT MCP READER
// =============================================================================

export interface CCXTMCPConfig {
  name: string;
  exchange: string; // e.g., "binance", "coinbase", "kraken"
  apiKey?: string;
  secret?: string;
  sandbox?: boolean;
  debug?: boolean;
  mcpClient?: any;
}

export class CCXTMCPReader implements MarketDataReader {
  private client: any; // MCP client will be injected
  private exchangeName: string;
  private apiCredentials?: { apiKey: string; secret: string };
  private sandbox: boolean;

  constructor(private config: CCXTMCPConfig) {
    this.client = config.mcpClient;
    this.exchangeName = config.exchange;
    this.sandbox = config.sandbox || false;

    if (config.apiKey && config.secret) {
      this.apiCredentials = {
        apiKey: config.apiKey,
        secret: config.secret,
      };
    }
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

    const formattedSymbol = this.formatSymbol(symbol);

    // For historical data, use OHLCV and extract close prices
    if (interval) {
      this.validateTimeInterval(interval);

      // Get OHLCV data and convert to Price array
      const ohlcvData = (await this.readOHLCV(symbol, context, interval)) as OHLCV[];
      return ohlcvData.map((ohlcv) => Price.create(ohlcv.timestamp, ohlcv.close, ohlcv.volume));
    }

    // Current price - use ticker data
    const result = await this.client.callTool({
      name: "fetch_ticker",
      arguments: {
        exchange: this.exchangeName,
        symbol: formattedSymbol,
        credentials: this.apiCredentials,
        sandbox: this.sandbox,
      },
    });

    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error("Invalid response from CCXT MCP");
    }

    const tickerData = JSON.parse(result.content[0].text);
    if (!tickerData || !tickerData.last) {
      throw new Error("No price data available");
    }

    return Price.create(
      new Date(tickerData.timestamp || Date.now()),
      tickerData.last,
      tickerData.baseVolume || 0,
    );
  }

  async readLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Level1 | Level1[]> {
    if (symbol.assetClass !== "crypto") {
      throw new Error(`Only crypto assets are supported, got ${symbol.assetClass}`);
    }

    const formattedSymbol = this.formatSymbol(symbol);

    // CCXT provides real Level1 order book data
    const result = await this.client.callTool({
      name: "fetch_order_book",
      arguments: {
        exchange: this.exchangeName,
        symbol: formattedSymbol,
        credentials: this.apiCredentials,
        sandbox: this.sandbox,
      },
    });

    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error("Invalid response from CCXT MCP");
    }

    const orderBook = JSON.parse(result.content[0].text);
    if (
      !orderBook ||
      !orderBook.bids ||
      !orderBook.asks ||
      orderBook.bids.length === 0 ||
      orderBook.asks.length === 0
    ) {
      throw new Error("No order book data available");
    }

    // Get best bid and ask
    const bestBid = orderBook.bids[0];
    const bestAsk = orderBook.asks[0];

    return Level1.create(
      new Date(orderBook.timestamp || Date.now()),
      bestBid[0], // bid price
      bestBid[1], // bid size
      bestAsk[0], // ask price
      bestAsk[1], // ask size
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

    const formattedSymbol = this.formatSymbol(symbol);

    // Prepare parameters for CCXT
    const params: any = {
      exchange: this.exchangeName,
      symbol: formattedSymbol,
      timeframe: "1d", // Default timeframe
      credentials: this.apiCredentials,
      sandbox: this.sandbox,
    };

    // Add time range for historical data
    if (interval) {
      this.validateTimeInterval(interval);
      params.since = interval.startDate.getTime();
      params.limit = this.calculateLimit(interval, "1d");
    } else {
      // For current data, get last candle
      params.limit = 1;
    }

    const result = await this.client.callTool({
      name: "fetch_ohlcv",
      arguments: params,
    });

    if (!result.content || !result.content[0] || !result.content[0].text) {
      throw new Error("Invalid response from CCXT MCP");
    }

    const ohlcvData = JSON.parse(result.content[0].text);
    if (!ohlcvData || !Array.isArray(ohlcvData)) {
      throw new Error("No OHLCV data available");
    }

    // Convert to OHLCV data classes
    const convertedData = ohlcvData.map(
      ([timestamp, open, high, low, close, volume]: [
        number,
        number,
        number,
        number,
        number,
        number,
      ]) => OHLCV.create(new Date(timestamp), open, high, low, close, volume),
    );

    // Filter by time interval if provided
    if (interval) {
      const filtered = convertedData.filter(
        (ohlcv) => ohlcv.timestamp >= interval.startDate && ohlcv.timestamp <= interval.endDate,
      );
      return filtered;
    }

    // Return single latest OHLCV if no time interval
    return convertedData.length > 0 ? convertedData[convertedData.length - 1] : convertedData[0];
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
    // Level1 historical data is typically not available through CCXT
    // This would require polling at intervals, which is not practical
    throw new Error("Historical Level1 data not supported by CCXT MCP Server");
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

  private formatSymbol(symbol: MarketSymbol): string {
    // Format symbol for CCXT (e.g., "BTC/USD")
    return `${symbol.ticker}/${symbol.currency}`;
  }

  private calculateLimit(timeInterval: TimeInterval, timeframe: string): number {
    const diffTime = timeInterval.endDate.getTime() - timeInterval.startDate.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Adjust limit based on timeframe
    switch (timeframe) {
      case "1m":
        return Math.min(days * 24 * 60, 1000);
      case "5m":
        return Math.min(days * 24 * 12, 1000);
      case "15m":
        return Math.min(days * 24 * 4, 1000);
      case "1h":
        return Math.min(days * 24, 1000);
      case "4h":
        return Math.min(days * 6, 1000);
      case "1d":
        return Math.min(days, 1000);
      default:
        return Math.min(days, 1000);
    }
  }

  private validateTimeInterval(timeInterval: TimeInterval): void {
    if (timeInterval.startDate >= timeInterval.endDate) {
      throw new Error("Start date must be before end date");
    }
    if (timeInterval.endDate > new Date()) {
      throw new Error("End date cannot be in the future");
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createCCXTMCPReader(config: CCXTMCPConfig): CCXTMCPReader {
  return new CCXTMCPReader(config);
}
