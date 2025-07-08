#!/usr/bin/env bun

/**
 * MarketDataReadingDSL Interface Tests
 *
 * Tests the unified reading DSL interface to ensure all methods are properly defined
 * and follow the correct Result<T> functional error handling pattern.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
  MarketDataReadingDSL,
} from "../../../src/abstract/dsl";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

// Mock implementation for testing the interface
class MockMarketDataReader implements MarketDataReadingDSL {
  async getCurrentPrice(coinId: string, vsCurrency = "usd") {
    return this.mockResult({ price: 50000 });
  }

  async getCurrentPrices(coinIds: string[], options?) {
    return this.mockResult([
      {
        coinId: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        usdPrice: 50000,
        lastUpdated: new Date(),
        source: "mock",
        attribution: "Mock data for testing",
      },
    ]);
  }

  async getCurrentOHLCV(coinId: string, interval = "daily") {
    return this.mockResult({
      coinId,
      timestamp: new Date(),
      open: 49000,
      high: 51000,
      low: 48000,
      close: 50000,
      volume: 1000000,
      timeframe: interval,
      source: "mock",
      attribution: "Mock OHLCV data",
    });
  }

  async getLatestOHLCV(coinId: string, count = 10, interval = "daily") {
    return this.mockResult([
      {
        coinId,
        timestamp: new Date(),
        open: 49000,
        high: 51000,
        low: 48000,
        close: 50000,
        volume: 1000000,
        timeframe: interval,
        source: "mock",
        attribution: "Mock OHLCV data",
      },
    ]);
  }

  async getPriceHistory(coinId: string, dateStart: Date, dateEnd: Date) {
    return this.mockResult([{ date: new Date(), price: 50000 }]);
  }

  async getOHLCVByDateRange(query: any) {
    return this.mockResult([
      {
        coinId: query.ticker,
        timestamp: new Date(),
        open: 49000,
        high: 51000,
        low: 48000,
        close: 50000,
        volume: 1000000,
        timeframe: query.interval,
        source: "mock",
        attribution: "Mock OHLCV data",
      },
    ]);
  }

  async getAvailableTickers(limit = 100) {
    return this.mockResult([
      {
        coinId: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        usdPrice: 50000,
        lastUpdated: new Date(),
        source: "mock",
        attribution: "Mock ticker data",
      },
    ]);
  }

  async getLevel1Data(query: any) {
    return this.mockResult({
      ticker: query.ticker,
      timestamp: new Date(),
      bestBid: 49950,
      bestAsk: 50050,
      spread: 100,
      spreadPercent: 0.2,
      market: "mock",
      source: "mock",
      attribution: "Mock Level 1 data",
    });
  }

  async getMarketAnalytics() {
    return this.mockResult({
      timestamp: new Date(),
      totalMarketCap: 2000000000000,
      totalVolume: 50000000000,
      btcDominance: 50,
      ethDominance: 15,
      activeCryptocurrencies: 10000,
      markets: 500,
      marketCapChange24h: 2.5,
      source: "mock",
      attribution: "Mock market analytics",
    });
  }

  private mockResult<T>(data: T) {
    // Import success function properly
    const { success } = require("../../../src/qicore/base");
    return Promise.resolve(success(data));
  }
}

describe("MarketDataReadingDSL Interface", () => {
  let reader: MarketDataReadingDSL;

  beforeAll(() => {
    reader = new MockMarketDataReader();
  });

  describe("getCurrentPrice", () => {
    it("should return current price for a cryptocurrency", async () => {
      const result = await reader.getCurrentPrice("bitcoin", "usd");

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const price = getData(result);
        expect(typeof price).toBe("number");
        expect(price).toBeGreaterThan(0);
      }
    });

    it("should use USD as default currency", async () => {
      const result = await reader.getCurrentPrice("bitcoin");
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("getCurrentPrices", () => {
    it("should return prices for multiple cryptocurrencies", async () => {
      const result = await reader.getCurrentPrices(["bitcoin", "ethereum"]);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const prices = getData(result) as CryptoPriceData[];
        expect(Array.isArray(prices)).toBe(true);
        expect(prices.length).toBeGreaterThan(0);

        for (const price of prices) {
          expect(price).toHaveProperty("coinId");
          expect(price).toHaveProperty("symbol");
          expect(price).toHaveProperty("usdPrice");
          expect(price).toHaveProperty("lastUpdated");
          expect(price).toHaveProperty("source");
          expect(price).toHaveProperty("attribution");
          expect(typeof price.usdPrice).toBe("number");
        }
      }
    });

    it("should handle options parameter", async () => {
      const result = await reader.getCurrentPrices(["bitcoin"], {
        vsCurrencies: ["usd"],
        includeMarketCap: true,
      });

      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("getCurrentOHLCV", () => {
    it("should return OHLCV data for a cryptocurrency", async () => {
      const result = await reader.getCurrentOHLCV("bitcoin", "daily");

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const ohlcv = getData(result) as CryptoOHLCVData;
        expect(ohlcv).toHaveProperty("coinId");
        expect(ohlcv).toHaveProperty("timestamp");
        expect(ohlcv).toHaveProperty("open");
        expect(ohlcv).toHaveProperty("high");
        expect(ohlcv).toHaveProperty("low");
        expect(ohlcv).toHaveProperty("close");
        expect(ohlcv).toHaveProperty("volume");
        expect(ohlcv).toHaveProperty("timeframe");
        expect(ohlcv).toHaveProperty("source");
        expect(ohlcv).toHaveProperty("attribution");

        expect(typeof ohlcv.open).toBe("number");
        expect(typeof ohlcv.high).toBe("number");
        expect(typeof ohlcv.low).toBe("number");
        expect(typeof ohlcv.close).toBe("number");
        expect(typeof ohlcv.volume).toBe("number");
      }
    });

    it("should default to daily interval", async () => {
      const result = await reader.getCurrentOHLCV("bitcoin");
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("getLatestOHLCV", () => {
    it("should return multiple OHLCV candles", async () => {
      const result = await reader.getLatestOHLCV("bitcoin", 5, "hourly");

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const ohlcvArray = getData(result) as CryptoOHLCVData[];
        expect(Array.isArray(ohlcvArray)).toBe(true);
        expect(ohlcvArray.length).toBeGreaterThan(0);
      }
    });

    it("should default to 10 candles and daily interval", async () => {
      const result = await reader.getLatestOHLCV("bitcoin");
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("getPriceHistory", () => {
    it("should return price history for date range", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-07");
      const result = await reader.getPriceHistory("bitcoin", startDate, endDate);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const history = getData(result);
        expect(Array.isArray(history)).toBe(true);
        if (history && history.length > 0) {
          expect(history[0]).toHaveProperty("date");
          expect(history[0]).toHaveProperty("price");
        }
      }
    });
  });

  describe("getOHLCVByDateRange", () => {
    it("should return OHLCV data for date range", async () => {
      const query = {
        ticker: "bitcoin",
        dateStart: new Date("2024-01-01"),
        dateEnd: new Date("2024-01-07"),
        interval: "1d",
      };

      const result = await reader.getOHLCVByDateRange(query);
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("getAvailableTickers", () => {
    it("should return available cryptocurrency tickers", async () => {
      const result = await reader.getAvailableTickers(50);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const tickers = getData(result) as CryptoPriceData[];
        expect(Array.isArray(tickers)).toBe(true);
      }
    });

    it("should default to 100 tickers", async () => {
      const result = await reader.getAvailableTickers();
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("getLevel1Data", () => {
    it("should return Level 1 market data", async () => {
      const query = { ticker: "bitcoin", market: "test" };
      const result = await reader.getLevel1Data(query);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const level1 = getData(result) as Level1Data;
        expect(level1).toHaveProperty("ticker");
        expect(level1).toHaveProperty("timestamp");
        expect(level1).toHaveProperty("bestBid");
        expect(level1).toHaveProperty("bestAsk");
        expect(level1).toHaveProperty("spread");
        expect(level1).toHaveProperty("market");
        expect(level1).toHaveProperty("source");
        expect(level1).toHaveProperty("attribution");
      }
    });
  });

  describe("getMarketAnalytics", () => {
    it("should return global market analytics", async () => {
      const result = await reader.getMarketAnalytics();

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const analytics = getData(result) as CryptoMarketAnalytics;
        expect(analytics).toHaveProperty("timestamp");
        expect(analytics).toHaveProperty("totalMarketCap");
        expect(analytics).toHaveProperty("totalVolume");
        expect(analytics).toHaveProperty("btcDominance");
        expect(analytics).toHaveProperty("ethDominance");
        expect(analytics).toHaveProperty("activeCryptocurrencies");
        expect(analytics).toHaveProperty("markets");
        expect(analytics).toHaveProperty("source");
        expect(analytics).toHaveProperty("attribution");

        expect(typeof analytics.totalMarketCap).toBe("number");
        expect(typeof analytics.totalVolume).toBe("number");
        expect(typeof analytics.btcDominance).toBe("number");
      }
    });
  });

  describe("Result<T> Pattern Compliance", () => {
    it("should return Result<T> from all methods", async () => {
      const methods = [
        () => reader.getCurrentPrice("bitcoin"),
        () => reader.getCurrentPrices(["bitcoin"]),
        () => reader.getCurrentOHLCV("bitcoin"),
        () => reader.getLatestOHLCV("bitcoin"),
        () => reader.getPriceHistory("bitcoin", new Date(), new Date()),
        () =>
          reader.getOHLCVByDateRange({
            ticker: "bitcoin",
            dateStart: new Date(),
            dateEnd: new Date(),
            interval: "1d",
          }),
        () => reader.getAvailableTickers(),
        () => reader.getLevel1Data({ ticker: "bitcoin" }),
        () => reader.getMarketAnalytics(),
      ];

      for (const method of methods) {
        const result = await method();
        expect(result).toHaveProperty("_tag");
        expect(["Left", "Right"]).toContain(result._tag);
      }
    });
  });
});
