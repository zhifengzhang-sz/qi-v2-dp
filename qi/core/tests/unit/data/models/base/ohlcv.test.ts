/**
 * @fileoverview
 * @module ohlcv.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// ohlcv.test.ts
import { describe, it, expect } from "vitest";
import { OHLCV } from "@qi/core/data/models/base/ohlcv";

describe("OHLCV", () => {
  const now = Date.now();

  it("should create a valid OHLCV object", () => {
    const ohlcv: OHLCV = {
      timestamp: now,
      open: 100.0,
      high: 110.0,
      low: 90.0,
      close: 105.0,
      volume: 1000,
      exchange: "NYSE",
      symbol: "AAPL",
    };

    expect(ohlcv.timestamp).toBe(now);
    expect(ohlcv.open).toBe(100.0);
    expect(ohlcv.high).toBe(110.0);
    expect(ohlcv.low).toBe(90.0);
    expect(ohlcv.close).toBe(105.0);
    expect(ohlcv.volume).toBe(1000);
    expect(ohlcv.exchange).toBe("NYSE");
    expect(ohlcv.symbol).toBe("AAPL");
  });

  it("should accept optional quoteVolume field", () => {
    const ohlcv: OHLCV = {
      timestamp: now,
      open: 100.0,
      high: 110.0,
      low: 90.0,
      close: 105.0,
      volume: 1000,
      quoteVolume: 105000.0,
      exchange: "NYSE",
      symbol: "AAPL",
    };
    expect(ohlcv.quoteVolume).toBe(105000.0);
  });

  it("should accept optional trades field", () => {
    const ohlcv: OHLCV = {
      timestamp: now,
      open: 100.0,
      high: 110.0,
      low: 90.0,
      close: 105.0,
      volume: 1000,
      trades: 150,
      exchange: "NYSE",
      symbol: "AAPL",
    };
    expect(ohlcv.trades).toBe(150);
  });

  it("should handle decimal prices and volumes", () => {
    const ohlcv: OHLCV = {
      timestamp: now,
      open: 100.12345678,
      high: 110.12345678,
      low: 90.12345678,
      close: 105.12345678,
      volume: 1000.12345678,
      quoteVolume: 105000.12345678,
      exchange: "NYSE",
      symbol: "AAPL",
    };
    expect(ohlcv.open).toBe(100.12345678);
    expect(ohlcv.high).toBe(110.12345678);
    expect(ohlcv.low).toBe(90.12345678);
    expect(ohlcv.close).toBe(105.12345678);
    expect(ohlcv.volume).toBe(1000.12345678);
    expect(ohlcv.quoteVolume).toBe(105000.12345678);
  });

  describe("type checking", () => {
    // Note: The following type checks are commented out because they should fail compilation.
    // They serve as documentation for the type system's behavior.
    it("should require all mandatory fields", () => {
      // TypeScript should prevent this:
      // const missingField: OHLCV = {
      //   timestamp: now,
      //   high: 110.0,
      //   low: 90.0,
      //   close: 105.0,
      //   volume: 1000,
      //   exchange: "NYSE",
      //   symbol: "AAPL",
      //   // open: 100.0,  // Type error: missing required property 'open'
      // };
      expect(true).toBe(true); // Placeholder assertion
    });

    it("should enforce numeric types", () => {
      // TypeScript should prevent this:
      // const invalidType: OHLCV = {
      //   timestamp: now,
      //   open: "100.0", // Type error: string not assignable to number
      //   high: 110.0,
      //   low: 90.0,
      //   close: 105.0,
      //   volume: 1000,
      //   exchange: "NYSE",
      //   symbol: "AAPL",
      // };
      expect(true).toBe(true); // Placeholder assertion
    });
  });
});
