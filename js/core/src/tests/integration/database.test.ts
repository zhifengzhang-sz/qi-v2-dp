import { DatabaseConnection } from 'qi/core/db/connection';
import { Instrument } from 'qi/core/db/models/cryptocompare/instrument';
import { Market } from 'qi/core/db/models/cryptocompare/market';
import { OHLCV } from 'qi/core/db/models/cryptocompare/ohlcv';
import { Tick } from 'qi/core/db/models/cryptocompare/tick';

describe('Database Integration Tests', () => {
  let db: DatabaseConnection;

  beforeAll(async () => {
    db = DatabaseConnection.getInstance();
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await Tick.destroy({ where: {}, force: true });
    await OHLCV.destroy({ where: {}, force: true });
    await Instrument.destroy({ where: {}, force: true });
    await Market.destroy({ where: {}, force: true });
  });

  describe('Market Model', () => {
    it('should create a market', async () => {
      const market = await Market.create({
        name: 'Binance',
        isActive: true
      });

      expect(market.name).toBe('Binance');
      expect(market.isActive).toBe(true);
    });

    it('should not allow duplicate market names', async () => {
      await Market.create({
        name: 'Binance',
        isActive: true
      });

      await expect(Market.create({
        name: 'Binance',
        isActive: true
      })).rejects.toThrow();
    });
  });

  describe('Instrument Model', () => {
    let market: Market;

    beforeEach(async () => {
      market = await Market.create({
        name: 'Binance',
        isActive: true
      });
    });

    it('should create an instrument', async () => {
      const instrument = await Instrument.create({
        symbol: 'BTC-USD',
        marketId: market.id,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        isActive: true
      });

      expect(instrument.symbol).toBe('BTC-USD');
      expect(instrument.baseAsset).toBe('BTC');
      expect(instrument.quoteAsset).toBe('USD');
    });

    it('should enforce unique symbol per market', async () => {
      await Instrument.create({
        symbol: 'BTC-USD',
        marketId: market.id,
        baseAsset: 'BTC',
        quoteAsset: 'USD'
      });

      await expect(Instrument.create({
        symbol: 'BTC-USD',
        marketId: market.id,
        baseAsset: 'BTC',
        quoteAsset: 'USD'
      })).rejects.toThrow();
    });
  });

  describe('Associations', () => {
    let market: Market;
    let instrument: Instrument;

    beforeEach(async () => {
      market = await Market.create({
        name: 'Binance',
        isActive: true
      });

      instrument = await Instrument.create({
        symbol: 'BTC-USD',
        marketId: market.id,
        baseAsset: 'BTC',
        quoteAsset: 'USD',
        isActive: true
      });
    });

    it('should correctly establish Market-Instrument association', async () => {
      const marketWithInstruments = await Market.findOne({
        where: { id: market.id },
        include: [Instrument]
      });

      expect(marketWithInstruments?.Instruments).toBeDefined();
      expect(marketWithInstruments?.Instruments[0].symbol).toBe('BTC-USD');
    });

    it('should correctly establish Instrument-OHLCV association', async () => {
      const ohlcv = await OHLCV.create({
        instrumentId: instrument.id,
        timestamp: new Date(),
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100,
        source: 'test'
      });

      const instrumentWithOHLCV = await Instrument.findOne({
        where: { id: instrument.id },
        include: [OHLCV]
      });

      expect(instrumentWithOHLCV?.OHLCVs).toBeDefined();
      expect(instrumentWithOHLCV?.OHLCVs[0].close).toBe(50500);
    });

    it('should correctly establish Instrument-Tick association', async () => {
      const tick = await Tick.create({
        instrumentId: instrument.id,
        timestamp: new Date(),
        side: 'BUY',
        price: 50000,
        quantity: 1,
        quoteQuantity: 50000,
        tradeId: Date.now().toString(),
        source: 'test',
        ccseq: Date.now(),
        status: 'VALID'
      });

      const instrumentWithTicks = await Instrument.findOne({
        where: { id: instrument.id },
        include: [Tick]
      });

      expect(instrumentWithTicks?.Ticks).toBeDefined();
      expect(instrumentWithTicks?.Ticks[0].price).toBe(50000);
    });
  });
});