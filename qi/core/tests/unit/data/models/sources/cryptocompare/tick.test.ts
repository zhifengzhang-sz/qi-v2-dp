/**
 * @fileoverview
 * @module tick.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// cryptocompare/tick.test.ts
import { describe, it, expect } from "vitest";
import { CryptoCompareTick } from "@qi/core/data/models/sources/cryptocompare/tick";
import { CryptoCompareTickData } from "@qi/core/data/models/sources/cryptocompare/response";

describe("CryptoCompareTick", () => {
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

  it("should create a valid CryptoCompareTick object", () => {
    const tick = new CryptoCompareTick(validData);

    expect(tick.exchange).toBe("Kraken");
    expect(tick.symbol).toBe("BTC-USD");
    expect(tick.timestamp).toBe(1701936000000);
    expect(tick.price).toBe(43300.5);
    expect(tick.quantity).toBe(0.5);
    expect(tick.side).toBe("buy");
  });

  it("should use MAPPED_INSTRUMENT when available", () => {
    const data = {
      ...validData,
      MAPPED_INSTRUMENT: "BTCUSD",
    };
    const tick = new CryptoCompareTick(data);
    expect(tick.symbol).toBe("BTCUSD");
  });

  it("should handle different trade sides", () => {
    const sellTick = new CryptoCompareTick({
      ...validData,
      LAST_TRADE_SIDE: "sell",
    });
    expect(sellTick.side).toBe("sell");

    const unknownTick = new CryptoCompareTick({
      ...validData,
      LAST_TRADE_SIDE: "unknown",
    });
    expect(unknownTick.side).toBe("unknown");
  });

  describe("getTimestampNs", () => {
    it("should return nanosecond timestamp", () => {
      const tick = new CryptoCompareTick(validData);
      expect(tick.getTimestampNs()).toBe(123456789);
    });
  });

  describe("getQuoteQuantity", () => {
    it("should return quote quantity", () => {
      const tick = new CryptoCompareTick(validData);
      expect(tick.getQuoteQuantity()).toBe(21650.25);
    });
  });

  describe("getSequence", () => {
    it("should return CCSEQ", () => {
      const tick = new CryptoCompareTick(validData);
      expect(tick.getSequence()).toBe(123456);
    });
  });

  describe("getProcessedTrade", () => {
    it("should return processed trade info", () => {
      const tick = new CryptoCompareTick(validData);
      const processed = tick.getProcessedTrade();

      expect(processed.timestamp).toBe(1701936000000);
      expect(processed.timestampNs).toBe(123456789);
      expect(processed.price).toBe(43300.5);
      expect(processed.quantity).toBe(0.5);
      expect(processed.quoteQuantity).toBe(21650.25);
      expect(processed.side).toBe("buy");
    });
  });

  describe("getRawData", () => {
    it("should return copy of original data", () => {
      const tick = new CryptoCompareTick(validData);
      const raw = tick.getRawData();

      expect(raw).toEqual(validData);
      expect(raw).not.toBe(validData); // Should be a different object
    });
  });

  describe("static fromResponse", () => {
    it("should create array of ticks from response data", () => {
      const data = [validData, { ...validData, CCSEQ: 123457 }];
      const ticks = CryptoCompareTick.fromResponse(data);

      expect(ticks).toHaveLength(2);
      expect(ticks[0]).toBeInstanceOf(CryptoCompareTick);
      expect(ticks[1]).toBeInstanceOf(CryptoCompareTick);
      expect(ticks[0].getSequence()).toBe(123456);
      expect(ticks[1].getSequence()).toBe(123457);
    });
  });
});
