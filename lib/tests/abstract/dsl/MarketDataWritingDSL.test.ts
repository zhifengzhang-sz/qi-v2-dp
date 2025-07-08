#!/usr/bin/env bun

/**
 * MarketDataWritingDSL Interface Tests
 *
 * Tests the unified writing DSL interface to ensure all methods are properly defined
 * and follow the correct Result<T> functional error handling pattern.
 */

import { beforeAll, describe, expect, it } from "vitest";
import type {
  BatchPublishResult,
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  MarketDataWritingDSL,
  PublishResult,
} from "../../../src/dsl";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

// Mock implementation for testing the interface
class MockMarketDataWriter implements MarketDataWritingDSL {
  async publishPrice(data: CryptoPriceData) {
    return this.mockPublishResult();
  }

  async publishPrices(data: CryptoPriceData[]) {
    return this.mockBatchPublishResult(data.length);
  }

  async publishOHLCV(data: CryptoOHLCVData) {
    return this.mockPublishResult();
  }

  async publishOHLCVBatch(data: CryptoOHLCVData[]) {
    return this.mockBatchPublishResult(data.length);
  }

  async publishMarketAnalytics(data: CryptoMarketAnalytics) {
    return this.mockPublishResult();
  }

  async publishLevel1Data(data: any) {
    return this.mockPublishResult();
  }

  async publishPriceHistory(data: any[]) {
    return this.mockBatchPublishResult(data.length);
  }

  async publishCustomData(data: any, schema?: any) {
    return this.mockPublishResult();
  }

  async publishBatch(data: any[]) {
    return this.mockBatchPublishResult(data.length);
  }

  async flush() {
    return this.mockResult(undefined);
  }

  private mockPublishResult(): Promise<any> {
    const { success } = require("../../../src/qicore/base");
    return Promise.resolve(
      success({
        messageId: "mock-message-id",
        timestamp: new Date(),
        topic: "mock-topic",
        partition: 0,
        offset: 12345,
        size: 1024,
      }),
    );
  }

  private mockBatchPublishResult(count: number): Promise<any> {
    const { success } = require("../../../src/qicore/base");
    return Promise.resolve(
      success({
        successCount: count,
        failureCount: 0,
        results: Array(count)
          .fill(null)
          .map((_, i) => ({
            messageId: `mock-message-${i}`,
            timestamp: new Date(),
            topic: "mock-topic",
            partition: 0,
            offset: 12345 + i,
            size: 1024,
          })),
        totalSize: count * 1024,
        batchId: "mock-batch-id",
      }),
    );
  }

  private mockResult<T>(data: T) {
    const { success } = require("../../../src/qicore/base");
    return Promise.resolve(success(data));
  }
}

describe("MarketDataWritingDSL Interface", () => {
  let writer: MarketDataWritingDSL;

  beforeAll(() => {
    writer = new MockMarketDataWriter();
  });

  const mockCryptoPriceData: CryptoPriceData = {
    coinId: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    usdPrice: 50000,
    btcPrice: 1,
    ethPrice: 20,
    marketCap: 1000000000000,
    volume24h: 50000000000,
    change24h: 2.5,
    change7d: 5.0,
    lastUpdated: new Date(),
    source: "test",
    attribution: "Test data",
  };

  const mockCryptoOHLCVData: CryptoOHLCVData = {
    coinId: "bitcoin",
    timestamp: new Date(),
    open: 49000,
    high: 51000,
    low: 48000,
    close: 50000,
    volume: 1000000,
    timeframe: "daily",
    source: "test",
    attribution: "Test OHLCV data",
  };

  const mockMarketAnalytics: CryptoMarketAnalytics = {
    timestamp: new Date(),
    totalMarketCap: 2000000000000,
    totalVolume: 50000000000,
    btcDominance: 50,
    ethDominance: 15,
    activeCryptocurrencies: 10000,
    markets: 500,
    marketCapChange24h: 2.5,
    source: "test",
    attribution: "Test market analytics",
  };

  describe("publishPrice", () => {
    it("should publish single cryptocurrency price", async () => {
      const result = await writer.publishPrice(mockCryptoPriceData);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const publishResult = getData(result) as PublishResult;
        expect(publishResult).toHaveProperty("messageId");
        expect(publishResult).toHaveProperty("timestamp");
        expect(publishResult).toHaveProperty("topic");
        expect(publishResult).toHaveProperty("partition");
        expect(publishResult).toHaveProperty("offset");
        expect(publishResult).toHaveProperty("size");

        expect(typeof publishResult.messageId).toBe("string");
        expect(publishResult.timestamp).toBeInstanceOf(Date);
        expect(typeof publishResult.partition).toBe("number");
        expect(typeof publishResult.offset).toBe("number");
        expect(typeof publishResult.size).toBe("number");
      }
    });
  });

  describe("publishPrices", () => {
    it("should publish multiple cryptocurrency prices", async () => {
      const pricesData = [mockCryptoPriceData, { ...mockCryptoPriceData, coinId: "ethereum" }];
      const result = await writer.publishPrices(pricesData);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const batchResult = getData(result) as BatchPublishResult;
        expect(batchResult).toHaveProperty("successCount");
        expect(batchResult).toHaveProperty("failureCount");
        expect(batchResult).toHaveProperty("results");
        expect(batchResult).toHaveProperty("totalSize");
        expect(batchResult).toHaveProperty("batchId");

        expect(batchResult.successCount).toBe(2);
        expect(batchResult.failureCount).toBe(0);
        expect(Array.isArray(batchResult.results)).toBe(true);
        expect(batchResult.results.length).toBe(2);
      }
    });

    it("should handle empty array", async () => {
      const result = await writer.publishPrices([]);
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("publishOHLCV", () => {
    it("should publish single OHLCV data", async () => {
      const result = await writer.publishOHLCV(mockCryptoOHLCVData);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const publishResult = getData(result) as PublishResult;
        expect(publishResult).toHaveProperty("messageId");
        expect(publishResult).toHaveProperty("timestamp");
        expect(publishResult).toHaveProperty("topic");
      }
    });
  });

  describe("publishOHLCVBatch", () => {
    it("should publish multiple OHLCV data", async () => {
      const ohlcvData = [mockCryptoOHLCVData, { ...mockCryptoOHLCVData, coinId: "ethereum" }];
      const result = await writer.publishOHLCVBatch(ohlcvData);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const batchResult = getData(result) as BatchPublishResult;
        expect(batchResult.successCount).toBe(2);
        expect(Array.isArray(batchResult.results)).toBe(true);
      }
    });
  });

  describe("publishMarketAnalytics", () => {
    it("should publish market analytics data", async () => {
      const result = await writer.publishMarketAnalytics(mockMarketAnalytics);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const publishResult = getData(result) as PublishResult;
        expect(publishResult).toHaveProperty("messageId");
        expect(publishResult).toHaveProperty("timestamp");
      }
    });
  });

  describe("publishLevel1Data", () => {
    it("should publish Level 1 market data", async () => {
      const level1Data = {
        ticker: "bitcoin",
        timestamp: new Date(),
        bestBid: 49950,
        bestAsk: 50050,
        spread: 100,
        spreadPercent: 0.2,
        market: "test",
        source: "test",
        attribution: "Test Level 1 data",
      };

      const result = await writer.publishLevel1Data(level1Data);
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("publishPriceHistory", () => {
    it("should publish price history data", async () => {
      const historyData = [
        { date: new Date("2024-01-01"), price: 45000 },
        { date: new Date("2024-01-02"), price: 46000 },
        { date: new Date("2024-01-03"), price: 47000 },
      ];

      const result = await writer.publishPriceHistory(historyData);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const batchResult = getData(result) as BatchPublishResult;
        expect(batchResult.successCount).toBe(3);
      }
    });
  });

  describe("publishCustomData", () => {
    it("should publish custom data without schema", async () => {
      const customData = { type: "custom", value: "test" };
      const result = await writer.publishCustomData(customData);

      expect(isSuccess(result)).toBe(true);
    });

    it("should publish custom data with schema", async () => {
      const customData = { type: "custom", value: "test" };
      const schema = { type: "object" };
      const result = await writer.publishCustomData(customData, schema);

      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("publishBatch", () => {
    it("should publish mixed batch data", async () => {
      const batchData = [mockCryptoPriceData, mockCryptoOHLCVData, mockMarketAnalytics];

      const result = await writer.publishBatch(batchData);

      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const batchResult = getData(result) as BatchPublishResult;
        expect(batchResult.successCount).toBe(3);
      }
    });
  });

  describe("flush", () => {
    it("should flush pending data", async () => {
      const result = await writer.flush();
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("Result<T> Pattern Compliance", () => {
    it("should return Result<T> from all methods", async () => {
      const methods = [
        () => writer.publishPrice(mockCryptoPriceData),
        () => writer.publishPrices([mockCryptoPriceData]),
        () => writer.publishOHLCV(mockCryptoOHLCVData),
        () => writer.publishOHLCVBatch([mockCryptoOHLCVData]),
        () => writer.publishMarketAnalytics(mockMarketAnalytics),
        () => writer.publishLevel1Data({}),
        () => writer.publishPriceHistory([]),
        () => writer.publishCustomData({}),
        () => writer.publishBatch([]),
        () => writer.flush(),
      ];

      for (const method of methods) {
        const result = await method();
        expect(result).toHaveProperty("_tag");
        expect(["Left", "Right"]).toContain(result._tag);
      }
    });
  });

  describe("Data Validation", () => {
    it("should handle required fields in CryptoPriceData", async () => {
      const minimalPriceData: CryptoPriceData = {
        coinId: "bitcoin",
        symbol: "btc",
        usdPrice: 50000,
        lastUpdated: new Date(),
        source: "test",
        attribution: "Test data",
      };

      const result = await writer.publishPrice(minimalPriceData);
      expect(isSuccess(result)).toBe(true);
    });

    it("should handle required fields in CryptoOHLCVData", async () => {
      const minimalOHLCVData: CryptoOHLCVData = {
        coinId: "bitcoin",
        timestamp: new Date(),
        open: 49000,
        high: 51000,
        low: 48000,
        close: 50000,
        volume: 1000000,
        timeframe: "daily",
        source: "test",
        attribution: "Test OHLCV data",
      };

      const result = await writer.publishOHLCV(minimalOHLCVData);
      expect(isSuccess(result)).toBe(true);
    });
  });
});
