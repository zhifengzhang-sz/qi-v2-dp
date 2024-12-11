/**
 * @fileoverview
 * @module tick.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// sequelize/cryptocompare/tick.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { Sequelize } from "sequelize";
import { CryptoCompareTickModel } from "@qi/core/data/models/storage/sequelize/cryptocompare/tick";
import { TradeSide } from "@qi/core/data/models/sources/cryptocompare/types";

const sequelize = new Sequelize("sqlite::memory:", { logging: false });

describe("CryptoCompareTickModel", () => {
  beforeAll(async () => {
    CryptoCompareTickModel.initialize(sequelize);
    await sequelize.sync({ force: true });
  });

  // Define test data type matching model attributes
  type TestData = {
    TYPE: string;
    MARKET: string;
    INSTRUMENT: string;
    MAPPED_INSTRUMENT?: string;
    BASE?: string;
    QUOTE?: string;
    BASE_ID?: number;
    QUOTE_ID?: number;
    TRANSFORM_FUNCTION?: string;
    CCSEQ: number;
    PRICE: number;
    PRICE_FLAG: string;
    PRICE_LAST_UPDATE_TS: number;
    PRICE_LAST_UPDATE_TS_NS: number;
    LAST_TRADE_QUANTITY: number;
    LAST_TRADE_QUOTE_QUANTITY: number;
    LAST_TRADE_ID: string;
    LAST_TRADE_CCSEQ: number;
    LAST_TRADE_SIDE: TradeSide;
    LAST_PROCESSED_TRADE_TS: number;
    LAST_PROCESSED_TRADE_TS_NS: number;
    LAST_PROCESSED_TRADE_PRICE: number;
    LAST_PROCESSED_TRADE_QUANTITY: number;
    LAST_PROCESSED_TRADE_QUOTE_QUANTITY: number;
    LAST_PROCESSED_TRADE_SIDE: TradeSide;
    LAST_PROCESSED_TRADE_CCSEQ: number;
  };

  const validData: TestData = {
    TYPE: "5",
    MARKET: "Kraken",
    INSTRUMENT: "BTC-USD",
    MAPPED_INSTRUMENT: "BTCUSD",
    BASE: "BTC",
    QUOTE: "USD",
    BASE_ID: 1,
    QUOTE_ID: 2,
    TRANSFORM_FUNCTION: "NONE",
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
    LAST_PROCESSED_TRADE_CCSEQ: 123457,
  };

  it("should create a valid tick instance with all fields", async () => {
    const tick = await CryptoCompareTickModel.create(validData);

    // Base fields
    expect(tick.TYPE).toBe("5");
    expect(tick.MARKET).toBe("Kraken");
    expect(tick.INSTRUMENT).toBe("BTC-USD");
    expect(tick.MAPPED_INSTRUMENT).toBe("BTCUSD");

    // Tick specific fields
    expect(tick.CCSEQ).toBe(123456);
    expect(tick.PRICE).toBe(43300.5);
    expect(tick.PRICE_FLAG).toBe("1");
    expect(tick.PRICE_LAST_UPDATE_TS).toBe(1701936000);
    expect(tick.PRICE_LAST_UPDATE_TS_NS).toBe(123456789);

    // Last trade
    expect(tick.LAST_TRADE_QUANTITY).toBe(0.5);
    expect(tick.LAST_TRADE_QUOTE_QUANTITY).toBe(21650.25);
    expect(tick.LAST_TRADE_SIDE).toBe("buy");
    expect(tick.LAST_TRADE_CCSEQ).toBe(123456);

    // Processed trade
    expect(tick.LAST_PROCESSED_TRADE_TS).toBe(1701936000);
    expect(tick.LAST_PROCESSED_TRADE_PRICE).toBe(43300.5);
    expect(tick.LAST_PROCESSED_TRADE_QUANTITY).toBe(0.5);
    expect(tick.LAST_PROCESSED_TRADE_SIDE).toBe("buy");
  });

  it("should validate trade side enum values", async () => {
    const invalidData = {
      ...validData,
      LAST_TRADE_SIDE: "invalid" as TradeSide, // Type assertion to test invalid value
    };

    await expect(CryptoCompareTickModel.create(invalidData)).rejects.toThrow();
  });

  it("should enforce decimal precision", async () => {
    const data = {
      ...validData,
      PRICE: 43300.12345678,
      LAST_TRADE_QUANTITY: 0.12345678,
    };

    const tick = await CryptoCompareTickModel.create(data);
    expect(tick.PRICE.toString()).toBe("43300.12345678");
    expect(tick.LAST_TRADE_QUANTITY.toString()).toBe("0.12345678");
  });

  it("should enforce required fields", async () => {
    // Create new object without required field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PRICE, ...invalidData } = validData;

    await expect(CryptoCompareTickModel.create(invalidData)).rejects.toThrow();
  });
});
