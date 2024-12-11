/**
 * @fileoverview
 * @module ohlcv.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-11
 */

// sequelize/cryptocompare/ohlcv.test.ts

import { describe, it, expect, beforeAll } from "vitest";
import { Sequelize } from "sequelize";
import { CryptoCompareOHLCVModel } from "@qi/core/data/models/storage/sequelize/cryptocompare/ohlcv";
import { TimeUnit } from "@qi/core/data/models/sources/cryptocompare/types";

const sequelize = new Sequelize("sqlite::memory:", { logging: false });

describe("CryptoCompareOHLCVModel", () => {
  beforeAll(async () => {
    CryptoCompareOHLCVModel.initialize(sequelize);
    await sequelize.sync({ force: true });
  });

  it("should create a valid CryptoCompareOHLCVModel instance", async () => {
    const data = {
      TYPE: "5",
      MARKET: "Kraken",
      INSTRUMENT: "BTC-USD",
      UNIT: "MINUTE" as TimeUnit,
      TIMESTAMP: 1701936000,
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

    const ohlcv = await CryptoCompareOHLCVModel.create(data);

    expect(ohlcv.MARKET).toBe("Kraken");
    expect(ohlcv.INSTRUMENT).toBe("BTC-USD");
    expect(ohlcv.TIMESTAMP).toBe(1701936000);
    expect(ohlcv.OPEN).toBe(43250.5);
    expect(ohlcv.HIGH).toBe(43500.0);
    expect(ohlcv.LOW).toBe(43100.0);
    expect(ohlcv.CLOSE).toBe(43300.5);
    expect(ohlcv.VOLUME).toBe(123.45);
    expect(ohlcv.QUOTE_VOLUME).toBe(5342917.25);
    expect(ohlcv.TOTAL_TRADES).toBe(1250);
  });
});
