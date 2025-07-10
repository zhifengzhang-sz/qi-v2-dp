#!/usr/bin/env bun

/**
 * Twelve Data MCP Reader - Real Implementation
 *
 * Reads market data from Twelve Data via MCP protocol.
 * Supports crypto, stocks, forex, and commodities.
 * Provides real Level1 data, streaming capabilities, and comprehensive historical data.
 * Production-grade reliability with 99.95% SLA.
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
  Level1,
  type MarketContext,
  type MarketSymbol,
  OHLCV,
  Price,
} from "../../../../dsl/types";
import type { TimeInterval } from "../../../../dsl/utils";
import { validateTimeInterval } from "../../../../utils/time-intervals";

// =============================================================================
// TWELVE DATA MCP READER
// =============================================================================

export interface TwelveDataMCPConfig {
  name: string;
  apiKey: string;
  assetClass: "crypto" | "stocks" | "forex" | "commodities";
  debug?: boolean;
  mcpClient?: any;
}

export class TwelveDataMCPReader implements MarketDataReader {
  private client: any; // MCP client will be injected
  private apiKey: string;
  private assetClass: "crypto" | "stocks" | "forex" | "commodities";

  constructor(private config: TwelveDataMCPConfig) {
    this.client = config.mcpClient;
    this.apiKey = config.apiKey;
    this.assetClass = config.assetClass;
  }

  // =============================================================================
  // MARKET DATA READER INTERFACE IMPLEMENTATION
  // =============================================================================

  async readPrice(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<Price | Price[]>> {
    if (symbol.assetClass !== this.assetClass) {
      return failure(
        createQiError(
          "UNSUPPORTED_ASSET_CLASS",
          `Asset class mismatch. Expected ${this.assetClass}, got ${symbol.assetClass}`,
          "VALIDATION",
        ),
      );
    }

    const formattedSymbol = this.formatSymbol(symbol);

    // For historical data, use time series endpoint
    if (interval) {
      const validationResult = this.validateTimeInterval(interval);
      if (isFailure(validationResult)) {
        return validationResult;
      }

      try {
        const result = await this.client.callTool({
          name: "time_series",
          arguments: {
            symbol: formattedSymbol,
            interval: "1day",
            start_date: interval.startDate.toISOString().split("T")[0], // YYYY-MM-DD format
            end_date: interval.endDate.toISOString().split("T")[0], // YYYY-MM-DD format
            apikey: this.apiKey,
          },
        });

        if (!result.content || !result.content[0] || !result.content[0].text) {
          return failure(
            createQiError("INVALID_RESPONSE", "Invalid response from Twelve Data MCP", "NETWORK"),
          );
        }

        const data = JSON.parse(result.content[0].text);
        if (!data.values || !Array.isArray(data.values)) {
          return failure(
            createQiError("NO_DATA", "No historical price data available", "BUSINESS"),
          );
        }

        // Convert to Price array
        return success(
          data.values.map((item: any) =>
            Price.create(
              new Date(item.datetime),
              Number.parseFloat(item.close),
              Number.parseFloat(item.volume || 0),
            ),
          ),
        );
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
      // Current price - use real-time price endpoint
      const result = await this.client.callTool({
        name: "quote",
        arguments: {
          symbol: formattedSymbol,
          apikey: this.apiKey,
        },
      });

      if (!result.content || !result.content[0] || !result.content[0].text) {
        return failure(
          createQiError("INVALID_RESPONSE", "Invalid response from Twelve Data MCP", "NETWORK"),
        );
      }

      const priceData = JSON.parse(result.content[0].text);
      if (!priceData.price) {
        return failure(createQiError("NO_DATA", "No price data available", "BUSINESS"));
      }

      return success(
        Price.create(
          new Date(), // Current timestamp
          Number.parseFloat(priceData.price),
          0, // Volume not provided in price endpoint
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
    if (symbol.assetClass !== this.assetClass) {
      return failure(
        createQiError(
          "UNSUPPORTED_ASSET_CLASS",
          `Asset class mismatch. Expected ${this.assetClass}, got ${symbol.assetClass}`,
          "VALIDATION",
        ),
      );
    }

    const formattedSymbol = this.formatSymbol(symbol);

    try {
      // Twelve Data provides real Level1 bid/ask data
      const result = await this.client.callTool({
        name: "quote",
        arguments: {
          symbol: formattedSymbol,
          apikey: this.apiKey,
        },
      });

      if (!result.content || !result.content[0] || !result.content[0].text) {
        return failure(
          createQiError("INVALID_RESPONSE", "Invalid response from Twelve Data MCP", "NETWORK"),
        );
      }

      const quoteData = JSON.parse(result.content[0].text);
      if (!quoteData.bid || !quoteData.ask) {
        return failure(createQiError("NO_DATA", "No Level1 quote data available", "BUSINESS"));
      }

      return success(
        Level1.create(
          new Date(), // Current timestamp
          Number.parseFloat(quoteData.bid),
          Number.parseFloat(quoteData.bid_size || 100), // Default size if not provided
          Number.parseFloat(quoteData.ask),
          Number.parseFloat(quoteData.ask_size || 100), // Default size if not provided
        ),
      );
    } catch (error) {
      return failure(
        createQiError("FETCH_ERROR", `Failed to fetch Level1 data: ${error}`, "NETWORK"),
      );
    }
  }

  async readOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval?: TimeInterval,
  ): Promise<Result<OHLCV | OHLCV[]>> {
    if (symbol.assetClass !== this.assetClass) {
      return failure(
        createQiError(
          "UNSUPPORTED_ASSET_CLASS",
          `Asset class mismatch. Expected ${this.assetClass}, got ${symbol.assetClass}`,
          "VALIDATION",
        ),
      );
    }

    const formattedSymbol = this.formatSymbol(symbol);
    const timeframe = "1day"; // Default timeframe

    // Prepare parameters
    const params: any = {
      symbol: formattedSymbol,
      interval: timeframe,
      apikey: this.apiKey,
    };

    // Add time range for historical data
    if (interval) {
      const validationResult = this.validateTimeInterval(interval);
      if (isFailure(validationResult)) {
        return validationResult;
      }
      params.start_date = interval.startDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      params.end_date = interval.endDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      // Don't include outputsize when using date range
    } else {
      // For current data, get last candle - don't include date parameters
      params.outputsize = 1;
    }

    try {
      const result = await this.client.callTool({
        name: "time_series",
        arguments: params,
      });

      if (!result.content || !result.content[0] || !result.content[0].text) {
        return failure(
          createQiError("INVALID_RESPONSE", "Invalid response from Twelve Data MCP", "NETWORK"),
        );
      }

      const data = JSON.parse(result.content[0].text);
      if (!data.values || !Array.isArray(data.values)) {
        return failure(createQiError("NO_DATA", "No OHLCV data available", "BUSINESS"));
      }

      // Convert to OHLCV data classes
      const ohlcvData = data.values.map((item: any) =>
        OHLCV.create(
          new Date(item.datetime),
          Number.parseFloat(item.open),
          Number.parseFloat(item.high),
          Number.parseFloat(item.low),
          Number.parseFloat(item.close),
          Number.parseFloat(item.volume || 0),
        ),
      );

      // Return array for historical data, single item for current
      return success(interval ? ohlcvData : ohlcvData.length > 0 ? ohlcvData[0] : ohlcvData[0]);
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
    symbol: MarketSymbol,
    context: MarketContext,
    interval: TimeInterval,
  ): Promise<Result<Level1[]>> {
    // Historical Level1 data is typically not available
    return failure(
      createQiError(
        "UNSUPPORTED_OPERATION",
        "Historical Level1 data not supported by Twelve Data MCP Server",
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

  private formatSymbol(symbol: MarketSymbol): string {
    // Format symbol based on asset class
    switch (this.assetClass) {
      case "crypto":
        return `${symbol.ticker}/${symbol.currency}`;
      case "stocks":
        return symbol.ticker;
      case "forex":
        return `${symbol.ticker}/${symbol.currency}`;
      case "commodities":
        return symbol.ticker;
      default:
        return symbol.ticker;
    }
  }

  private validateTimeInterval(timeInterval: TimeInterval): Result<void> {
    if (timeInterval.startDate >= timeInterval.endDate) {
      return failure(
        createQiError("INVALID_TIME_INTERVAL", "Start date must be before end date", "VALIDATION"),
      );
    }
    if (timeInterval.endDate > new Date()) {
      return failure(
        createQiError("INVALID_TIME_INTERVAL", "End date cannot be in the future", "VALIDATION"),
      );
    }
    return success(undefined);
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

export function createTwelveDataMCPReader(config: TwelveDataMCPConfig): TwelveDataMCPReader {
  return new TwelveDataMCPReader(config);
}
