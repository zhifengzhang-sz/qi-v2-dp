#!/usr/bin/env bun

/**
 * Market Data DSL Tests
 *
 * Tests for the functional programming approach to market data DSL.
 * Verifies the new clean interfaces and data classes.
 */

import { describe, expect, it } from "vitest";
import type { MarketDataReader } from "../../../src/dsl/interfaces.js";
import {
  Exchange,
  InstrumentType,
  MarketContext,
  MarketSymbol,
  OHLCV,
  Price,
} from "../../../src/dsl/types.js";
import type { Level1 } from "../../../src/dsl/types.js";
import { createTimeInterval } from "../../../src/dsl/utils.js";

// Mock MarketDataReader for testing using new interfaces
class MockMarketDataReader implements MarketDataReader {
  async readPrice(symbol: MarketSymbol, context: MarketContext): Promise<Price> {
    return Price.create(new Date(), 50000, 1000);
  }

  async readLevel1(symbol: MarketSymbol, context: MarketContext): Promise<Level1> {
    // Simulate the CoinGecko MCP Server behavior - Level1 data not available
    throw new Error(
      "Level1 bid/ask data is not available through CoinGecko MCP Server. " +
        "CoinGecko MCP Server provides price, market data, and OHLCV, but not order book depth. " +
        "For Level1 data, consider using exchange-specific MCP servers like Binance, Coinbase, or CCXT MCP Server.",
    );
  }

  async readOHLCV(symbol: MarketSymbol, context: MarketContext): Promise<OHLCV> {
    return OHLCV.create(new Date(), 49000, 51000, 48000, 50000, 100000);
  }

  async readHistoricalPrices(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: any,
  ): Promise<Price[]> {
    return [Price.create(new Date(), 50000, 1000), Price.create(new Date(), 50100, 1500)];
  }

  async readHistoricalLevel1(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: any,
  ): Promise<Level1[]> {
    throw new Error("Level1 data not supported");
  }

  async readHistoricalOHLCV(
    symbol: MarketSymbol,
    context: MarketContext,
    interval: any,
  ): Promise<OHLCV[]> {
    return [
      OHLCV.create(new Date(), 49000, 51000, 48000, 50000, 100000),
      OHLCV.create(new Date(), 50000, 52000, 49000, 51000, 120000),
    ];
  }
}

describe("Market Data DSL", () => {
  const mockReader = new MockMarketDataReader();

  // Create test data using new data classes
  const testExchange = Exchange.create("coingecko", "CoinGecko", "global", "aggregated");
  const testSymbol = MarketSymbol.create("BTC", "Bitcoin", "crypto", "USD", InstrumentType.CASH);
  const testContext = MarketContext.create(testExchange, testSymbol);

  describe("Data Class Creation", () => {
    it("should create Price with factory method", () => {
      const price = Price.create(new Date(), 50000, 1000);

      expect(price.timestamp).toBeInstanceOf(Date);
      expect(price.price).toBe(50000);
      expect(price.size).toBe(1000);
    });

    it("should create OHLCV with factory method", () => {
      const ohlcv = OHLCV.create(new Date(), 49000, 51000, 48000, 50000, 100000);

      expect(ohlcv.timestamp).toBeInstanceOf(Date);
      expect(ohlcv.open).toBe(49000);
      expect(ohlcv.high).toBe(51000);
      expect(ohlcv.low).toBe(48000);
      expect(ohlcv.close).toBe(50000);
      expect(ohlcv.volume).toBe(100000);
    });

    it("should create MarketSymbol with factory method", () => {
      const symbol = MarketSymbol.create("BTC", "Bitcoin", "crypto", "USD", InstrumentType.CASH);

      expect(symbol.ticker).toBe("BTC");
      expect(symbol.name).toBe("Bitcoin");
      expect(symbol.assetClass).toBe("crypto");
      expect(symbol.currency).toBe("USD");
      expect(symbol.instrumentType).toBe(InstrumentType.CASH);
    });

    it("should create MarketContext with factory method", () => {
      const exchange = Exchange.create("binance", "Binance", "global", "centralized");
      const symbol = MarketSymbol.create("ETH", "Ethereum", "crypto", "USD", InstrumentType.CASH);
      const context = MarketContext.create(exchange, symbol);

      expect(context.exchange).toBe(exchange);
      expect(context.symbol).toBe(symbol);
    });
  });

  describe("Reader Interface Implementation", () => {
    it("should read price data using new interface", async () => {
      const price = await mockReader.readPrice(testSymbol, testContext);

      expect(price).toBeInstanceOf(Price);
      expect(price.price).toBe(50000);
      expect(price.size).toBe(1000);
    });

    it("should read OHLCV data using new interface", async () => {
      const ohlcv = await mockReader.readOHLCV(testSymbol, testContext);

      expect(ohlcv).toBeInstanceOf(OHLCV);
      expect(ohlcv.open).toBe(49000);
      expect(ohlcv.high).toBe(51000);
      expect(ohlcv.low).toBe(48000);
      expect(ohlcv.close).toBe(50000);
      expect(ohlcv.volume).toBe(100000);
    });

    it("should handle unsupported operations gracefully", async () => {
      try {
        await mockReader.readLevel1(testSymbol, testContext);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Level1 bid/ask data is not available");
      }
    });

    it("should read historical data", async () => {
      const interval = createTimeInterval(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());

      const prices = await mockReader.readHistoricalPrices(testSymbol, testContext, interval);
      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBe(2);
      expect(prices[0]).toBeInstanceOf(Price);

      const ohlcvData = await mockReader.readHistoricalOHLCV(testSymbol, testContext, interval);
      expect(Array.isArray(ohlcvData)).toBe(true);
      expect(ohlcvData.length).toBe(2);
      expect(ohlcvData[0]).toBeInstanceOf(OHLCV);
    });
  });

  describe("Time Interval Utilities", () => {
    it("should create time intervals", () => {
      const start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = new Date();
      const interval = createTimeInterval(start, end);

      expect(interval.startDate).toBe(start);
      expect(interval.endDate).toBe(end);
    });
  });

  describe("Type Safety", () => {
    it("should maintain immutable data structures", () => {
      const price = Price.create(new Date(), 50000, 1000);

      // Properties should be readonly - TypeScript will prevent this at compile time
      expect(price.price).toBe(50000);
      expect(price.size).toBe(1000);
    });

    it("should provide correct data structures", async () => {
      const price = await mockReader.readPrice(testSymbol, testContext);
      expect(price.timestamp).toBeInstanceOf(Date);
      expect(typeof price.price).toBe("number");
      expect(typeof price.size).toBe("number");

      const ohlcv = await mockReader.readOHLCV(testSymbol, testContext);
      expect(ohlcv.timestamp).toBeInstanceOf(Date);
      expect(typeof ohlcv.open).toBe("number");
      expect(typeof ohlcv.high).toBe("number");
      expect(typeof ohlcv.low).toBe("number");
      expect(typeof ohlcv.close).toBe("number");
      expect(typeof ohlcv.volume).toBe("number");
    });
  });

  describe("Error Handling", () => {
    it("should handle capability limitations gracefully", async () => {
      try {
        await mockReader.readLevel1(testSymbol, testContext);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain("Level1 bid/ask data is not available");
      }
    });
  });
});
