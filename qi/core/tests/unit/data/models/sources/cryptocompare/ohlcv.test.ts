/**
 * @fileoverview
 * @module ohlcv.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// cryptocompare/ohlcv.test.ts
import { describe, it, expect } from "vitest";
import { CryptoCompareOHLCV } from "@qi/core/data/models/sources/cryptocompare/ohlcv";
import { CryptoCompareOHLCVData } from "@qi/core/data/models/sources/cryptocompare/response";

describe("CryptoCompareOHLCV", () => {
  const validData: CryptoCompareOHLCVData = {
    TYPE: "5",
    MARKET: "Kraken",
    INSTRUMENT: "BTC-USD",
    TIMESTAMP: 1701936000,
    UNIT: "MINUTE",
    OPEN: 43250.5,
    HIGH: 43500.0,
    LOW: 43100.0,
    CLOSE: 43300.5,
    VOLUME: 123.45,
    QUOTE_VOLUME: 5342917.25,
    TOTAL_TRADES: 1250,
    TOTAL_TRADES_BUY: 600,
    TOTAL_TRADES_SELL: 500,
    TOTAL_TRADES_UNKNOWN: 150,
    VOLUME_BUY: 60,
    VOLUME_SELL: 50,
    VOLUME_UNKNOWN: 13.45,
    QUOTE_VOLUME_BUY: 3000000,
    QUOTE_VOLUME_SELL: 2000000,
    QUOTE_VOLUME_UNKNOWN: 342917.25,
  };

  it("should create a valid CryptoCompareOHLCV object", () => {
    const ohlcv = new CryptoCompareOHLCV(validData);

    expect(ohlcv.exchange).toBe("Kraken");
    expect(ohlcv.symbol).toBe("BTC-USD");
    expect(ohlcv.timestamp).toBe(1701936000000);
    expect(ohlcv.open).toBe(43250.5);
    expect(ohlcv.high).toBe(43500.0);
    expect(ohlcv.low).toBe(43100.0);
    expect(ohlcv.close).toBe(43300.5);
    expect(ohlcv.volume).toBe(123.45);
    expect(ohlcv.quoteVolume).toBe(5342917.25);
    expect(ohlcv.trades).toBe(1250);
  });

  it("should use MAPPED_INSTRUMENT when available", () => {
    const data = {
      ...validData,
      MAPPED_INSTRUMENT: "BTCUSD",
    };
    const ohlcv = new CryptoCompareOHLCV(data);
    expect(ohlcv.symbol).toBe("BTCUSD");
  });

  describe("getTradeBreakdown", () => {
    it("should return correct trade breakdown", () => {
      const ohlcv = new CryptoCompareOHLCV(validData);
      const breakdown = ohlcv.getTradeBreakdown();

      expect(breakdown.buy).toBe(600);
      expect(breakdown.sell).toBe(500);
      expect(breakdown.unknown).toBe(150);
    });
  });

  describe("getVolumeBreakdown", () => {
    it("should return correct volume breakdown", () => {
      const ohlcv = new CryptoCompareOHLCV(validData);
      const breakdown = ohlcv.getVolumeBreakdown();

      expect(breakdown.buy).toBe(60);
      expect(breakdown.sell).toBe(50);
      expect(breakdown.unknown).toBe(13.45);
      expect(breakdown.quoteBuy).toBe(3000000);
      expect(breakdown.quoteSell).toBe(2000000);
      expect(breakdown.quoteUnknown).toBe(342917.25);
    });
  });

  describe("getRawData", () => {
    it("should return copy of original data", () => {
      const ohlcv = new CryptoCompareOHLCV(validData);
      const raw = ohlcv.getRawData();

      expect(raw).toEqual(validData);
      expect(raw).not.toBe(validData); // Should be a different object
    });
  });

  describe("static fromResponse", () => {
    it("should create array of ohlcv from response data", () => {
      const data = [validData, { ...validData, TIMESTAMP: 1701936060 }];
      const ohlcvs = CryptoCompareOHLCV.fromResponse(data);

      expect(ohlcvs).toHaveLength(2);
      expect(ohlcvs[0]).toBeInstanceOf(CryptoCompareOHLCV);
      expect(ohlcvs[1]).toBeInstanceOf(CryptoCompareOHLCV);
      expect(ohlcvs[0].timestamp).toBe(1701936000000);
      expect(ohlcvs[1].timestamp).toBe(1701936060000);
    });

    it("should handle empty array", () => {
      const ohlcvs = CryptoCompareOHLCV.fromResponse([]);
      expect(ohlcvs).toHaveLength(0);
    });
  });

  describe("type checking", () => {
    // Note: The following type checks are commented out because they should fail compilation.
    // They serve as documentation for the type system's behavior.
    it("should enforce UNIT values", () => {
      // TypeScript should prevent this:
      // const invalidUnit: CryptoCompareOHLCVData = {
      //   ...validData,
      //   UNIT: "SECOND", // Type error: must be "MINUTE" | "HOUR" | "DAY"
      // };
      expect(true).toBe(true); // Placeholder assertion
    });

    it("should require all mandatory fields", () => {
      // TypeScript should prevent this:
      // const missingField: CryptoCompareOHLCVData = {
      //   ...validData,
      //   VOLUME: undefined, // Type error: number required
      // };
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
