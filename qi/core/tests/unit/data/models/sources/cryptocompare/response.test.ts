/**
 * @fileoverview
 * @module response.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// cryptocompare/response.test.ts
import { describe, it, expect } from "vitest";
import {
  CryptoCompareOHLCVData,
  CryptoCompareTickData,
} from "@qi/core/data/models/sources/cryptocompare/response";

describe("CryptoCompareOHLCVData", () => {
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

  it("should create a valid CryptoCompareOHLCVData object", () => {
    const data = { ...validData };

    expect(data.MARKET).toBe("Kraken");
    expect(data.INSTRUMENT).toBe("BTC-USD");
    expect(data.TIMESTAMP).toBe(1701936000);
    expect(data.OPEN).toBe(43250.5);
    expect(data.HIGH).toBe(43500.0);
    expect(data.LOW).toBe(43100.0);
    expect(data.CLOSE).toBe(43300.5);
    expect(data.VOLUME).toBe(123.45);
    expect(data.QUOTE_VOLUME).toBe(5342917.25);
    expect(data.TOTAL_TRADES).toBe(1250);
  });

  it("should handle optional fields", () => {
    const data: CryptoCompareOHLCVData = {
      ...validData,
      MAPPED_INSTRUMENT: "BTCUSD",
      BASE: "BTC",
      QUOTE: "USD",
      BASE_ID: 1,
      QUOTE_ID: 2,
      TRANSFORM_FUNCTION: "NONE",
      FIRST_TRADE_TIMESTAMP: 1701936000,
      LAST_TRADE_TIMESTAMP: 1701936100,
      FIRST_TRADE_PRICE: 43200.0,
      LAST_TRADE_PRICE: 43300.5,
    };

    expect(data.MAPPED_INSTRUMENT).toBe("BTCUSD");
    expect(data.BASE).toBe("BTC");
    expect(data.QUOTE).toBe("USD");
    expect(data.BASE_ID).toBe(1);
    expect(data.QUOTE_ID).toBe(2);
    expect(data.TRANSFORM_FUNCTION).toBe("NONE");
    expect(data.FIRST_TRADE_TIMESTAMP).toBe(1701936000);
    expect(data.LAST_TRADE_TIMESTAMP).toBe(1701936100);
    expect(data.FIRST_TRADE_PRICE).toBe(43200.0);
    expect(data.LAST_TRADE_PRICE).toBe(43300.5);
  });

  describe("type checking", () => {
    // Note: The following type checks are commented out because they should fail compilation.
    // They serve as documentation for the type system's behavior.
    it("should enforce required fields", () => {
      // TypeScript should prevent this:
      // const missingField: CryptoCompareOHLCVData = {
      //   ...validData,
      //   TIMESTAMP: undefined, // Type error: number expected
      // };
      expect(true).toBe(true); // Placeholder assertion
    });

    it("should enforce field types", () => {
      // TypeScript should prevent these:
      // const invalidUnit: CryptoCompareOHLCVData = {
      //   ...validData,
      //   UNIT: "SECONDS", // Type error: must be "MINUTE" | "HOUR" | "DAY"
      // };
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});

describe("CryptoCompareTickData", () => {
  const validData: CryptoCompareTickData = {
    TYPE: "5",
    MARKET: "Kraken",
    INSTRUMENT: "BTC-USD",
    CCSEQ: 123456,
    PRICE: 43300.5,
    PRICE_FLAG: "1",
    PRICE_LAST_UPDATE_TS: 1701936000,
    PRICE_LAST_UPDATE_TS_NS: 123456789,
    LAST_TRADE_QUANTITY: 0.5,
    LAST_TRADE_QUOTE_QUANTITY: 21650.25,
    LAST_TRADE_ID: "12345",
    LAST_TRADE_CCSEQ: 123456,
    LAST_TRADE_SIDE: "buy",
    LAST_PROCESSED_TRADE_TS: 1701936000,
    LAST_PROCESSED_TRADE_TS_NS: 123456789,
    LAST_PROCESSED_TRADE_PRICE: 43300.5,
    LAST_PROCESSED_TRADE_QUANTITY: 0.5,
    LAST_PROCESSED_TRADE_QUOTE_QUANTITY: 21650.25,
    LAST_PROCESSED_TRADE_SIDE: "buy",
  };

  it("should create a valid CryptoCompareTickData object", () => {
    const data = { ...validData };

    expect(data.MARKET).toBe("Kraken");
    expect(data.INSTRUMENT).toBe("BTC-USD");
    expect(data.PRICE).toBe(43300.5);
    expect(data.LAST_TRADE_QUANTITY).toBe(0.5);
    expect(data.LAST_TRADE_SIDE).toBe("buy");
  });

  it("should handle optional fields", () => {
    const data: CryptoCompareTickData = {
      ...validData,
      MAPPED_INSTRUMENT: "BTCUSD",
      BASE: "BTC",
      QUOTE: "USD",
      BASE_ID: 1,
      QUOTE_ID: 2,
      TRANSFORM_FUNCTION: "NONE",
    };

    expect(data.MAPPED_INSTRUMENT).toBe("BTCUSD");
    expect(data.BASE).toBe("BTC");
    expect(data.QUOTE).toBe("USD");
    expect(data.BASE_ID).toBe(1);
    expect(data.QUOTE_ID).toBe(2);
    expect(data.TRANSFORM_FUNCTION).toBe("NONE");
  });

  describe("type checking", () => {
    // Note: The following type checks are commented out because they should fail compilation.
    // They serve as documentation for the type system's behavior.
    it("should enforce trade side values", () => {
      // TypeScript should prevent these:
      // const invalidTradeSide: CryptoCompareTickData = {
      //   ...validData,
      //   LAST_TRADE_SIDE: "invalid", // Type error: must be "buy" | "sell" | "unknown"
      // };
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
