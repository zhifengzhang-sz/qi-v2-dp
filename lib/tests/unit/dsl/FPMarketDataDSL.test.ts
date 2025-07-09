#!/usr/bin/env bun

/**
 * FP Market Data DSL Tests
 *
 * Tests for the simplified functional programming approach to DSL.
 * Verifies context/content separation and partial application patterns.
 */

import { describe, expect, it } from "vitest";
import {
  EXCHANGES,
  type Level1,
  type MarketContext,
  type MarketDataReader,
  type OHLCV,
  type Price,
  SYMBOLS,
  bindContext,
  createMarketContext,
  createPureReader,
  createSymbolReader,
} from "../../../src/dsl";
import { createQiError, failure, isFailure, isSuccess, success } from "../../../src/qicore/base";
import type { ResultType as Result } from "../../../src/qicore/base";

// Mock MarketDataReader for testing
class MockMarketDataReader implements MarketDataReader {
  async getPrice(context: MarketContext): Promise<Result<Price>> {
    return success({
      timestamp: context.timestamp,
      price: 50000,
      size: 1000,
    });
  }

  async getOHLCV(context: MarketContext, timeframe: string): Promise<Result<OHLCV>> {
    return success({
      timestamp: context.timestamp,
      open: 49000,
      high: 51000,
      low: 48000,
      close: 50000,
      volume: 100000,
    });
  }

  async getLevel1(context: MarketContext): Promise<Result<Level1>> {
    return success({
      timestamp: context.timestamp,
      bidPrice: 49950,
      bidSize: 500,
      askPrice: 50050,
      askSize: 500,
    });
  }
}

describe("FP Market Data DSL", () => {
  const mockReader = new MockMarketDataReader();

  describe("Context Creation", () => {
    it("should create market context with all required fields", () => {
      const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);

      expect(context.exchange.id).toBe("coingecko");
      expect(context.symbol.ticker).toBe("BTC");
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it("should create context with custom timestamp", () => {
      const customTime = new Date("2025-01-01T00:00:00Z");
      const context = createMarketContext(EXCHANGES.BINANCE, SYMBOLS.ETH, customTime);

      expect(context.timestamp).toBe(customTime);
    });
  });

  describe("Full Context Interface", () => {
    it("should work with complete market context", async () => {
      const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);

      const priceResult = await mockReader.getPrice(context);
      expect(isSuccess(priceResult)).toBe(true);

      const ohlcvResult = await mockReader.getOHLCV(context, "1d");
      expect(isSuccess(ohlcvResult)).toBe(true);

      const level1Result = await mockReader.getLevel1(context);
      expect(isSuccess(level1Result)).toBe(true);
    });
  });

  describe("Partial Application - Context Binding", () => {
    it("should create pure reader with full context bound", async () => {
      const pureReader = createPureReader(mockReader, EXCHANGES.COINGECKO, SYMBOLS.BTC);

      // Zero-argument calls
      const priceResult = await pureReader.getPrice();
      expect(isSuccess(priceResult)).toBe(true);

      const ohlcvResult = await pureReader.getOHLCV("1d");
      expect(isSuccess(ohlcvResult)).toBe(true);

      const level1Result = await pureReader.getLevel1();
      expect(isSuccess(level1Result)).toBe(true);
    });

    it("should create symbol reader with exchange bound", async () => {
      const symbolReader = createSymbolReader(mockReader, EXCHANGES.BINANCE);

      // Symbol-argument calls
      const btcResult = await symbolReader.getPrice(SYMBOLS.BTC);
      expect(isSuccess(btcResult)).toBe(true);

      const ethResult = await symbolReader.getPrice(SYMBOLS.ETH);
      expect(isSuccess(ethResult)).toBe(true);
    });

    it("should bind partial context flexibly", async () => {
      // Exchange-only binding
      const exchangeReader = bindContext(mockReader, { exchange: EXCHANGES.COINBASE });
      const priceResult = await exchangeReader.getPrice(SYMBOLS.BTC);
      expect(isSuccess(priceResult)).toBe(true);

      // Symbol-only binding
      const symbolReader = bindContext(mockReader, { symbol: SYMBOLS.BTC });
      const priceResult2 = await symbolReader.getPrice(EXCHANGES.COINBASE);
      expect(isSuccess(priceResult2)).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with bound contexts", async () => {
      const pureReader = createPureReader(mockReader, EXCHANGES.COINGECKO, SYMBOLS.BTC);

      // These should compile and work
      const price = await pureReader.getPrice();
      const ohlcv = await pureReader.getOHLCV("1h");
      const level1 = await pureReader.getLevel1();

      expect(isSuccess(price)).toBe(true);
      expect(isSuccess(ohlcv)).toBe(true);
      expect(isSuccess(level1)).toBe(true);
    });

    it("should provide correct data structures", async () => {
      const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);

      const priceResult = await mockReader.getPrice(context);
      if (isSuccess(priceResult)) {
        const price = priceResult.right;
        expect(price.timestamp).toBeInstanceOf(Date);
        expect(typeof price.price).toBe("number");
        expect(typeof price.size).toBe("number");
      }

      const ohlcvResult = await mockReader.getOHLCV(context, "1d");
      if (isSuccess(ohlcvResult)) {
        const ohlcv = ohlcvResult.right;
        expect(ohlcv.timestamp).toBeInstanceOf(Date);
        expect(typeof ohlcv.open).toBe("number");
        expect(typeof ohlcv.high).toBe("number");
        expect(typeof ohlcv.low).toBe("number");
        expect(typeof ohlcv.close).toBe("number");
        expect(typeof ohlcv.volume).toBe("number");
      }

      const level1Result = await mockReader.getLevel1(context);
      if (isSuccess(level1Result)) {
        const level1 = level1Result.right;
        expect(level1.timestamp).toBeInstanceOf(Date);
        expect(typeof level1.bidPrice).toBe("number");
        expect(typeof level1.bidSize).toBe("number");
        expect(typeof level1.askPrice).toBe("number");
        expect(typeof level1.askSize).toBe("number");
      }
    });
  });

  describe("Performance Patterns", () => {
    it("should support high-frequency trading patterns", async () => {
      const btcReader = createPureReader(mockReader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
      const ethReader = createPureReader(mockReader, EXCHANGES.COINGECKO, SYMBOLS.ETH);

      const startTime = Date.now();

      // Simulate high-frequency calls
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(btcReader.getPrice());
        promises.push(ethReader.getPrice());
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results.length).toBe(200);
      expect(results.every((r) => isSuccess(r))).toBe(true);

      // Should complete quickly (arbitrary performance check)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should support parallel portfolio monitoring", async () => {
      const symbolReader = createSymbolReader(mockReader, EXCHANGES.BINANCE);
      const portfolio = [SYMBOLS.BTC, SYMBOLS.ETH];

      const results = await Promise.all(portfolio.map((symbol) => symbolReader.getPrice(symbol)));

      expect(results.length).toBe(2);
      expect(results.every((r) => isSuccess(r))).toBe(true);
    });
  });

  describe("Constants and Utilities", () => {
    it("should provide exchange constants", () => {
      expect(EXCHANGES.COINGECKO.id).toBe("coingecko");
      expect(EXCHANGES.BINANCE.id).toBe("binance");
      expect(EXCHANGES.COINBASE.id).toBe("coinbase");
    });

    it("should provide symbol constants", () => {
      expect(SYMBOLS.BTC.ticker).toBe("BTC");
      expect(SYMBOLS.ETH.ticker).toBe("ETH");
    });

    it("should maintain exchange types", () => {
      expect(EXCHANGES.COINGECKO.type).toBe("aggregated");
      expect(EXCHANGES.BINANCE.type).toBe("centralized");
      expect(EXCHANGES.COINBASE.type).toBe("centralized");
    });
  });
});
