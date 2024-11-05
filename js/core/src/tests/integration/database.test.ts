/**
 * @module tests/integration/database
 * @description Integration tests for database models and connections
 */

import { DatabaseConnection } from "@qi/core/db";
import {
  Market,
  Instrument,
  OHLCV,
  Tick,
  AssetSummary,
} from "@qi/core/db/models/cryptocompare";

describe("Database Integration Tests", () => {
  let db: DatabaseConnection;

  beforeAll(async () => {
    db = DatabaseConnection.getInstance();
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await Tick.destroy({ where: {}, force: true });
    await OHLCV.destroy({ where: {}, force: true });
    await Instrument.destroy({ where: {}, force: true });
    await Market.destroy({ where: {}, force: true });
    await AssetSummary.destroy({ where: {}, force: true });
  });

  describe("Market Model", () => {
    describe("CRUD Operations", () => {
      it("should create a market", async () => {
        const market = await Market.create({
          name: "Binance",
          isActive: true,
        });

        expect(market.name).toBe("Binance");
        expect(market.isActive).toBe(true);
      });

      it("should enforce unique market names", async () => {
        await Market.create({
          name: "Binance",
          isActive: true,
        });

        await expect(
          Market.create({
            name: "Binance",
            isActive: true,
          })
        ).rejects.toThrow();
      });

      it("should update a market", async () => {
        const market = await Market.create({
          name: "Binance",
          isActive: true,
        });

        await market.update({ isActive: false });

        const updated = await Market.findByPk(market.id);
        expect(updated?.isActive).toBe(false);
      });

      it("should soft delete a market", async () => {
        const market = await Market.create({
          name: "Binance",
          isActive: true,
        });

        await market.destroy();

        const found = await Market.findByPk(market.id);
        expect(found).toBeNull();

        const foundWithParanoid = await Market.findByPk(market.id, {
          paranoid: false,
        });
        expect(foundWithParanoid).not.toBeNull();
        expect(foundWithParanoid?.deletedAt).not.toBeNull();
      });
    });

    describe("Querying", () => {
      it("should find active markets", async () => {
        await Market.create({ name: "Binance", isActive: true });
        await Market.create({ name: "Kraken", isActive: true });
        await Market.create({ name: "Inactive", isActive: false });

        const active = await Market.findAll({
          where: { isActive: true },
        });

        expect(active).toHaveLength(2);
        expect(active.map((m) => m.name)).toContain("Binance");
        expect(active.map((m) => m.name)).toContain("Kraken");
      });

      it("should find by name", async () => {
        await Market.create({ name: "Binance", isActive: true });

        const market = await Market.findOne({
          where: { name: "Binance" },
        });

        expect(market?.name).toBe("Binance");
      });
    });
  });

  describe("Instrument Model", () => {
    let market: Market;

    beforeEach(async () => {
      market = await Market.create({
        name: "Binance",
        isActive: true,
      });
    });

    it("should create an instrument", async () => {
      const instrument = await Instrument.create({
        marketId: market.id,
        symbol: "BTC-USD",
        baseAsset: "BTC",
        quoteAsset: "USD",
        isActive: true,
      });

      expect(instrument.symbol).toBe("BTC-USD");
      expect(instrument.baseAsset).toBe("BTC");
      expect(instrument.quoteAsset).toBe("USD");
    });

    it("should enforce unique symbol per market", async () => {
      await Instrument.create({
        marketId: market.id,
        symbol: "BTC-USD",
        baseAsset: "BTC",
        quoteAsset: "USD",
      });

      await expect(
        Instrument.create({
          marketId: market.id,
          symbol: "BTC-USD",
          baseAsset: "BTC",
          quoteAsset: "USD",
        })
      ).rejects.toThrow();
    });

    it("should allow same symbol on different markets", async () => {
      const market2 = await Market.create({
        name: "Kraken",
        isActive: true,
      });

      await Instrument.create({
        marketId: market.id,
        symbol: "BTC-USD",
        baseAsset: "BTC",
        quoteAsset: "USD",
      });

      await expect(
        Instrument.create({
          marketId: market2.id,
          symbol: "BTC-USD",
          baseAsset: "BTC",
          quoteAsset: "USD",
        })
      ).resolves.toBeDefined();
    });
  });

  describe("OHLCV Model", () => {
    let instrument: Instrument;

    beforeEach(async () => {
      const market = await Market.create({
        name: "Binance",
        isActive: true,
      });

      instrument = await Instrument.create({
        marketId: market.id,
        symbol: "BTC-USD",
        baseAsset: "BTC",
        quoteAsset: "USD",
      });
    });

    it("should create OHLCV data", async () => {
      const ohlcv = await OHLCV.create({
        instrumentId: instrument.id,
        timestamp: new Date(),
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
        source: "test",
      });

      expect(ohlcv.open).toBe(50000);
      expect(ohlcv.high).toBe(51000);
      expect(ohlcv.low).toBe(49000);
      expect(ohlcv.close).toBe(50500);
      expect(ohlcv.volume).toBe(100);
    });

    it("should get data by time range", async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 3600000);

      await OHLCV.create({
        instrumentId: instrument.id,
        timestamp: hourAgo,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
        source: "test",
      });

      const data = await OHLCV.getByTimeRange(
        instrument.id,
        new Date(hourAgo.getTime() - 1000),
        new Date(now.getTime() + 1000)
      );

      expect(data).toHaveLength(1);
    });

    it("should get latest data", async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 3600000);

      await OHLCV.create({
        instrumentId: instrument.id,
        timestamp: hourAgo,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
        source: "test",
      });

      await OHLCV.create({
        instrumentId: instrument.id,
        timestamp: now,
        open: 51000,
        high: 52000,
        low: 50000,
        close: 51500,
        volume: 200,
        source: "test",
      });

      const latest = await OHLCV.getLatestByInstrumentId(instrument.id);
      expect(latest?.close).toBe(51500);
    });
  });

  describe("Asset Summary Model", () => {
    it("should create asset summary", async () => {
      const now = new Date();

      const asset = await AssetSummary.create({
        symbol: "BTC",
        assetId: 1,
        assetType: "CRYPTO",
        name: "Bitcoin",
        launchDate: now,
        source: "test",
      });

      expect(asset.symbol).toBe("BTC");
      expect(asset.name).toBe("Bitcoin");
      expect(asset.launchDate?.getTime()).toBe(now.getTime());
    });

    it("should enforce unique symbol", async () => {
      await AssetSummary.create({
        symbol: "BTC",
        assetId: 1,
        assetType: "CRYPTO",
        name: "Bitcoin",
        source: "test",
      });

      await expect(
        AssetSummary.create({
          symbol: "BTC",
          assetId: 2,
          assetType: "CRYPTO",
          name: "Bitcoin",
          source: "test",
        })
      ).rejects.toThrow();
    });

    it("should create or update asset", async () => {
      const [asset1, created1] = await AssetSummary.createOrUpdate("BTC", {
        assetId: 1,
        assetType: "CRYPTO",
        name: "Bitcoin",
        source: "test",
      });

      expect(created1).toBe(true);
      expect(asset1.name).toBe("Bitcoin");

      const [asset2, created2] = await AssetSummary.createOrUpdate("BTC", {
        assetId: 1,
        assetType: "CRYPTO",
        name: "Bitcoin Updated",
        source: "test",
      });

      expect(created2).toBe(false);
      expect(asset2.name).toBe("Bitcoin Updated");
    });
  });
});
