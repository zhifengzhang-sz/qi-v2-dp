#!/usr/bin/env bun

/**
 * Alpha Vantage MCP Reader - Real Implementation
 *
 * Reads stock market data from Alpha Vantage via MCP protocol.
 * Provides NASDAQ-licensed stock market data including real-time quotes,
 * historical data, and fundamental information.
 * Supports US equities, ETFs, and basic forex data.
 */

import {
  type ResultType as Result,
  createQiError,
  failure,
  getData,
  getError,
  isFailure,
  success,
} from "@qi/core/base";
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
import { validateTimeInterval } from "../../../../utils/time-intervals";

// =============================================================================
// ALPHA VANTAGE MCP READER
// =============================================================================

export interface AlphaVantageMCPConfig {
  name: string;
  apiKey: string;
  debug?: boolean;
  mcpClient?: any;
}

export class AlphaVantageMCPReader implements MarketDataReader {
  private client: any; // MCP client will be injected
  private apiKey: string;

  constructor(private config: AlphaVantageMCPConfig) {
    this.client = config.mcpClient;
    this.apiKey = config.apiKey;
  }

  // =============================================================================
  // MARKET DATA READER INTERFACE IMPLEMENTATION
  // =============================================================================

  async readPrice(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<Price | Price[]>> {
    if (symbol.assetClass !== "equity") {
      return failure(
        createQiError(
          "UNSUPPORTED_ASSET_CLASS",
          `Only equity assets are supported, got ${symbol.assetClass}`,
          "VALIDATION",
        ),
      );
    }

    // For historical data, use time series endpoint
    if (interval) {
      const validationResult = this.validateTimeInterval(interval);
      if (isFailure(validationResult)) {
        return validationResult;
      }

      try {
        const result = await this.client.callTool({
          name: "get-time-series",
          arguments: {
            symbol: symbol.ticker,
            interval: "daily",
            apikey: this.apiKey,
          },
        });

        if (!result.content || !result.content[0] || !result.content[0].text) {
          return failure(
            createQiError("INVALID_RESPONSE", "Invalid response from Alpha Vantage MCP", "NETWORK"),
          );
        }

        const data = JSON.parse(result.content[0].text);
        if (!data["Time Series (Daily)"]) {
          return failure(
            createQiError("NO_DATA", "No historical price data available", "BUSINESS"),
          );
        }

        const timeSeries = data["Time Series (Daily)"];
        const prices: Price[] = [];

        for (const [dateStr, values] of Object.entries(timeSeries)) {
          const date = new Date(dateStr);
          if (date >= interval.startDate && date <= interval.endDate) {
            prices.push(
              Price.create(
                date,
                Number.parseFloat((values as any)["4. close"]),
                Number.parseFloat((values as any)["5. volume"]),
              ),
            );
          }
        }

        return success(prices);
      } catch (error) {
        return failure(
          createQiError(
            "FETCH_ERROR",
            `Failed to fetch historical price data: ${error}`,
            "NETWORK",
          ),
        );
      }
    }

    try {
      // Current price - use real-time quote endpoint
      const result = await this.client.callTool({
        name: "get-stock-quote",
        arguments: {
          symbol: symbol.ticker,
          apikey: this.apiKey,
        },
      });

      if (!result.content || !result.content[0] || !result.content[0].text) {
        return failure(
          createQiError("INVALID_RESPONSE", "Invalid response from Alpha Vantage MCP", "NETWORK"),
        );
      }

      const data = JSON.parse(result.content[0].text);
      const quote = data["Global Quote"];

      if (!quote || !quote["05. price"]) {
        return failure(createQiError("NO_DATA", "No price data available", "BUSINESS"));
      }

      return success(
        Price.create(
          new Date(), // Current timestamp
          Number.parseFloat(quote["05. price"]),
          Number.parseFloat(quote["06. volume"]),
        ),
      );
    } catch (error) {
      return failure(
        createQiError("FETCH_ERROR", `Failed to fetch current price data: ${error}`, "NETWORK"),
      );
    }
  }

  async readLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<Level1 | Level1[]>> {
    // Alpha Vantage does not provide Level1 bid/ask data
    return failure(
      createQiError(
        "UNSUPPORTED_OPERATION",
        `Level1 data not available for ${symbol.ticker}. Alpha Vantage does not provide real-time bid/ask data. Consider using IEX Cloud or TwelveData for Level1 data.`,
        "BUSINESS",
      ),
    );
  }

  async readOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<OHLCV | OHLCV[]>> {
    if (symbol.assetClass !== "equity") {
      return failure(
        createQiError(
          "UNSUPPORTED_ASSET_CLASS",
          `Only equity assets are supported, got ${symbol.assetClass}`,
          "VALIDATION",
        ),
      );
    }

    try {
      const result = await this.client.callTool({
        name: "get-time-series",
        arguments: {
          symbol: symbol.ticker,
          interval: "daily",
          apikey: this.apiKey,
        },
      });

      if (!result.content || !result.content[0] || !result.content[0].text) {
        return failure(
          createQiError("INVALID_RESPONSE", "Invalid response from Alpha Vantage MCP", "NETWORK"),
        );
      }

      const data = JSON.parse(result.content[0].text);
      if (!data["Time Series (Daily)"]) {
        return failure(createQiError("NO_DATA", "No OHLCV data available", "BUSINESS"));
      }

      const timeSeries = data["Time Series (Daily)"];
      const ohlcvData: OHLCV[] = [];

      for (const [dateStr, values] of Object.entries(timeSeries)) {
        const date = new Date(dateStr);

        // Filter by time interval if provided
        if (interval) {
          const validationResult = this.validateTimeInterval(interval);
          if (isFailure(validationResult)) {
            return validationResult;
          }
          if (date < interval.startDate || date > interval.endDate) {
            continue;
          }
        }

        ohlcvData.push(
          OHLCV.create(
            date,
            Number.parseFloat((values as any)["1. open"]),
            Number.parseFloat((values as any)["2. high"]),
            Number.parseFloat((values as any)["3. low"]),
            Number.parseFloat((values as any)["4. close"]),
            Number.parseFloat((values as any)["5. volume"]),
          ),
        );
      }

      // Return single latest OHLCV if no time interval, otherwise return array
      if (!interval && ohlcvData.length > 0) {
        return success(ohlcvData[0]);
      }

      return success(ohlcvData);
    } catch (error) {
      return failure(
        createQiError("FETCH_ERROR", `Failed to fetch OHLCV data: ${error}`, "NETWORK"),
      );
    }
  }

  async readHistoricalPrices(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Result<Price[]>> {
    const result = await this.readPrice(symbol, context, interval);
    if (isFailure(result)) {
      return result;
    }

    const priceData = getData(result);
    const priceArray = Array.isArray(priceData) ? priceData : [priceData];
    return success(priceArray.filter((item) => item !== null));
  }

  async readHistoricalLevel1(
    _symbol: MarketSymbol,
    _context: MarketContext,
    _interval: TimeInterval,
  ): Promise<Result<Level1[]>> {
    // Historical Level1 data is not available from Alpha Vantage
    return failure(
      createQiError(
        "UNSUPPORTED_OPERATION",
        "Historical Level1 data not supported by Alpha Vantage MCP Server",
        "BUSINESS",
      ),
    );
  }

  async readHistoricalOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Result<OHLCV[]>> {
    const result = await this.readOHLCV(symbol, context, interval);
    if (isFailure(result)) {
      return result;
    }

    const ohlcvData = getData(result);
    const ohlcvArray = Array.isArray(ohlcvData) ? ohlcvData : [ohlcvData];
    return success(ohlcvArray.filter((item) => item !== null));
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private validateTimeInterval(timeInterval: TimeInterval): Result<void> {
    if (timeInterval.startDate >= timeInterval.endDate) {
      return failure(
        createQiError("INVALID_INTERVAL", "Start date must be before end date", "VALIDATION"),
      );
    }
    if (timeInterval.endDate > new Date()) {
      return failure(
        createQiError("INVALID_INTERVAL", "End date cannot be in the future", "VALIDATION"),
      );
    }
    return success(undefined);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createAlphaVantageMCPReader(config: AlphaVantageMCPConfig): AlphaVantageMCPReader {
  return new AlphaVantageMCPReader(config);
}
