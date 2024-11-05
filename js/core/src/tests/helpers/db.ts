import { Pool } from 'pg';
import { Sequelize } from 'sequelize';
import { logger } from '@qi/core/logger';
import { OHLCV, Market, Tick, Instrument, AssetSummary } from '@qi/core/services/timescaledb/models/cryptocompare';

export const testPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export const testDb = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false
});

export async function initTestDatabase() {
  try {
    await testDb.sync({ force: true });
    logger.info('Test database initialized');
  } catch (error) {
    logger.error('Test database initialization failed:', error);
    throw error;
  }
}

export async function cleanDatabase() {
  try {
    await Tick.destroy({ where: {}, force: true });
    await OHLCV.destroy({ where: {}, force: true });
    await Instrument.destroy({ where: {}, force: true });
    await Market.destroy({ where: {}, force: true });
    await AssetSummary.destroy({ where: {}, force: true });
    logger.info('Test database cleaned');
  } catch (error) {
    logger.error('Database cleanup failed:', error);
    throw error;
  }
}

type MarketCreationAttributes = {
  name: string;
  isActive: boolean;
};

export async function createTestMarket(
  attributes: Partial<MarketCreationAttributes> = {}
): Promise<Market> {
  const defaultAttributes: MarketCreationAttributes = {
    name: 'TestMarket',
    isActive: true
  };

  return Market.create({ ...defaultAttributes, ...attributes });
}

type InstrumentCreationAttributes = {
  marketId: number;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isActive: boolean;
};

export async function createTestInstrument(
  marketId: number,
  attributes: Partial<Omit<InstrumentCreationAttributes, 'marketId'>> = {}
): Promise<Instrument> {
  const defaultAttributes: InstrumentCreationAttributes = {
    marketId,
    symbol: 'BTC-USD',
    baseAsset: 'BTC',
    quoteAsset: 'USD',
    isActive: true
  };

  return Instrument.create({ ...defaultAttributes, ...attributes });
}

type TickCreationAttributes = {
  instrumentId: number;
  timestamp: Date;
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  quoteQuantity: number;
  tradeId: string;
  source: string;
  ccseq: number;
  status: 'VALID' | 'INVALID' | 'PENDING';
};

export async function createTestTick(
  instrumentId: number,
  attributes: Partial<Omit<TickCreationAttributes, 'instrumentId'>> = {}
): Promise<Tick> {
  const defaultAttributes: TickCreationAttributes = {
    instrumentId,
    timestamp: new Date(),
    side: 'BUY',
    price: 50000,
    quantity: 1,
    quoteQuantity: 50000,
    tradeId: Date.now().toString(),
    source: 'test',
    ccseq: Date.now(),
    status: 'VALID'
  };

  return Tick.create({ ...defaultAttributes, ...attributes });
}

type OHLCVCreationAttributes = {
  instrumentId: number;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: string;
};

export async function createTestOHLCV(
  instrumentId: number,
  attributes: Partial<Omit<OHLCVCreationAttributes, 'instrumentId'>> = {}
): Promise<OHLCV> {
  const defaultAttributes: OHLCVCreationAttributes = {
    instrumentId,
    timestamp: new Date(),
    open: 50000,
    high: 51000,
    low: 49000,
    close: 50500,
    volume: 100,
    source: 'test'
  };

  return OHLCV.create({ ...defaultAttributes, ...attributes });
}

type AssetSummaryCreationAttributes = {
  symbol: string;
  assetId: number;
  assetType: string;
  name: string;
  source: string;
  logoUrl?: string;
  launchDate?: Date;
  metadata?: Record<string, any>;
};

export async function createTestAssetSummary(
  attributes: Partial<AssetSummaryCreationAttributes> = {}
): Promise<AssetSummary> {
  const defaultAttributes: AssetSummaryCreationAttributes = {
    symbol: 'BTC',
    assetId: 1,
    assetType: 'CRYPTO',
    name: 'Bitcoin',
    source: 'test'
  };

  return AssetSummary.create({ ...defaultAttributes, ...attributes });
}

export async function closeTestConnections() {
  await testDb.close();
  await testPool.end();
  logger.info('Test database connections closed');
}