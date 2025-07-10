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
  isFailure,
  getData,
  getError,
} from "@qi/core/base";

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
  ): Promise<Result<Price | Price[]>> {
    if (symbol.assetClass !== "crypto") {
      return failure(createQiError("UNSUPPORTED_ASSET_CLASS", `Only crypto assets are supported, got ${symbol.assetClass}`, "VALIDATION"));
    }

    // For historical data, we need to use OHLCV and extract close prices
    if (interval) {
      const validationResult = this.validateTimeInterval(interval);
      if (isFailure(validationResult)) {
        return failure(getError(validationResult));
      }

      // Get OHLCV data and convert to Price array
      const ohlcvResult = await this.readOHLCV(symbol, context, interval);
      if (isFailure(ohlcvResult)) {
        return failure(getError(ohlcvResult));
      }
      
      const ohlcvData = getData(ohlcvResult);
      const ohlcvArray = Array.isArray(ohlcvData) ? ohlcvData : [ohlcvData];
      return success(ohlcvArray.map((ohlcv) => Price.create(ohlcv.timestamp, ohlcv.close, ohlcv.volume)));
    }

    try {
      // Current price - use simple price endpoint
      const result = await this.client.callTool({
        name: "get_simple_price",
        arguments: {
          ids: symbol.ticker.toLowerCase(),
          vs_currencies: symbol.currency.toLowerCase(),
        },
      });

      if (!result.content || !result.content[0] || !result.content[0].text) {
        return failure(createQiError("INVALID_RESPONSE", "Invalid response from CoinGecko MCP", "NETWORK"));
      }

      const data = JSON.parse(result.content[0].text);
      if (!data || typeof data !== "object") {
        return failure(createQiError("NO_DATA", "No price data available", "BUSINESS"));
      }

      // Get price from simple price response
      const coinId = symbol.ticker.toLowerCase();
      const currency = symbol.currency.toLowerCase();
      const price = data[coinId]?.[currency];

      if (!price) {
        return failure(createQiError("NO_DATA", `No price data available for ${coinId} in ${currency}`, "BUSINESS"));
      }

      return success(Price.create(
        new Date(),
        price,
        0, // Volume not available in price endpoint
      ));
    } catch (error) {
      return failure(createQiError("FETCH_ERROR", `Failed to fetch price data: ${error}`, "NETWORK"));
    }
  }

  async readLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<Level1 | Level1[]>> {
    // CoinGecko MCP Server does not provide Level1 bid/ask data
    return failure(createQiError(
      "UNSUPPORTED_OPERATION",
      `Level1 data not available for ${symbol.ticker}. CoinGecko MCP Server does not provide real-time bid/ask data. Consider using CCXT MCP Server or Twelve Data MCP Server for Level1 data.`,
      "BUSINESS"
    ));
  }

  async readOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<OHLCV | OHLCV[]>> {
    if (symbol.assetClass !== "crypto") {
      return failure(createQiError("UNSUPPORTED_ASSET_CLASS", `Only crypto assets are supported, got ${symbol.assetClass}`, "VALIDATION"));
    }

    // Calculate days based on timeInterval or default to 1 day
    let days = 1;
    if (interval) {
      const validationResult = this.validateTimeInterval(interval);
      if (isFailure(validationResult)) {
        return failure(getError(validationResult));
      }
      const diffTime = interval.endDate.getTime() - interval.startDate.getTime();
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    try {
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
        return failure(createQiError("INVALID_RESPONSE", "Invalid response from CoinGecko MCP", "NETWORK"));
      }

      const data = JSON.parse(result.content[0].text);
      if (!data || !Array.isArray(data)) {
        return failure(createQiError("NO_DATA", "No OHLCV data available", "BUSINESS"));
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
        return success(filtered);
      }

      // Return single latest OHLCV if no time interval
      return success(ohlcvData.length > 0 ? ohlcvData[ohlcvData.length - 1] : ohlcvData[0]);
    } catch (error) {
      return failure(createQiError("FETCH_ERROR", `Failed to fetch OHLCV data: ${error}`, "NETWORK"));
    }
  }

  async readHistoricalPrices(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Result<Price[]>> {
    const result = await this.readPrice(symbol, context, interval);
    if (isFailure(result)) {
      return failure(getError(result));
    }
    const data = getData(result);
    return success(Array.isArray(data) ? data : [data]);
  }

  async readHistoricalLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Result<Level1[]>> {
    return failure(createQiError("UNSUPPORTED_OPERATION", "Level1 data not supported by CoinGecko MCP Server", "BUSINESS"));
  }

  async readHistoricalOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Result<OHLCV[]>> {
    const result = await this.readOHLCV(symbol, context, interval);
    if (isFailure(result)) {
      return failure(getError(result));
    }
    const data = getData(result);
    return success(Array.isArray(data) ? data : [data]);
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private validateTimeInterval(timeInterval: TimeInterval): Result<void> {
    if (timeInterval.startDate >= timeInterval.endDate) {
      return failure(createQiError("INVALID_INTERVAL", "Start date must be before end date", "VALIDATION"));
    }
    if (timeInterval.endDate > new Date()) {
      return failure(createQiError("INVALID_INTERVAL", "End date cannot be in the future", "VALIDATION"));
    }
    return success(undefined);
  }
}
