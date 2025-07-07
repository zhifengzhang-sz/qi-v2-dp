#!/usr/bin/env bun

/**
 * BaseReader Tests
 * 
 * Tests the base reader class that provides unified DSL implementation
 * and workflow abstraction for all data source actors.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSuccess, isFailure, getData, getError, success, failure, createQiError } from '../../qicore/base';
import { BaseReader } from '../../abstract/readers/BaseReader';
import type { CryptoPriceData, CryptoOHLCVData, CryptoMarketAnalytics, CurrentPricesOptions, DateRangeOHLCVQuery, Level1Query, Level1Data } from '../../abstract/dsl';

// Test implementation of BaseReader
class TestMarketDataReader extends BaseReader {
  private mockResponses: Map<string, any> = new Map();
  private shouldFail = false;

  constructor(config: { name: string; debug?: boolean }) {
    super(config);
  }

  async initialize() {
    this.isInitialized = true;
    return success(undefined);
  }

  async cleanup() {
    this.isInitialized = false;
    return success(undefined);
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      mcpClientCount: this.clients.size,
      connectedClients: this.getAllClients().filter(c => c.isConnected).length,
      lastActivity: this.lastActivity,
      totalQueries: this.totalQueries,
      errorCount: this.errorCount,
      mcpClients: this.getAllClients().map(c => ({
        name: c.config.name,
        type: c.config.type,
        isConnected: c.isConnected,
        errorCount: c.errorCount
      }))
    };
  }

  // Mock control methods
  setMockResponse(method: string, response: any) {
    this.mockResponses.set(method, response);
  }

  setShouldFail(fail: boolean) {
    this.shouldFail = fail;
  }

  // Plugin implementations for testing
  protected async getCurrentPricePlugin(coinId: string, vsCurrency: string): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getCurrentPrice') || { price: 50000 };
  }

  protected async getCurrentPricesPlugin(coinIds: string[], options?: CurrentPricesOptions): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getCurrentPrices') || [
      { id: 'bitcoin', current_price: 50000, symbol: 'btc', name: 'Bitcoin' }
    ];
  }

  protected async getCurrentOHLCVPlugin(coinId: string, interval: "hourly" | "daily"): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getCurrentOHLCV') || [
      [Date.now(), 49000, 51000, 48000, 50000]
    ];
  }

  protected async getLatestOHLCVPlugin(coinId: string, count: number, interval: "hourly" | "daily"): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getLatestOHLCV') || [
      [Date.now(), 49000, 51000, 48000, 50000]
    ];
  }

  protected async getPriceHistoryPlugin(coinId: string, dateStart: Date, dateEnd: Date): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getPriceHistory') || [
      [Date.now(), 50000]
    ];
  }

  protected async getOHLCVByDateRangePlugin(query: DateRangeOHLCVQuery): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getOHLCVByDateRange') || [
      [Date.now(), 49000, 51000, 48000, 50000]
    ];
  }

  protected async getAvailableTickersPlugin(limit: number): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getAvailableTickers') || [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }
    ];
  }

  protected async getLevel1DataPlugin(query: Level1Query): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getLevel1Data') || {
      current_price: 50000
    };
  }

  protected async getMarketAnalyticsPlugin(): Promise<any> {
    if (this.shouldFail) throw new Error('Mock plugin failure');
    return this.mockResponses.get('getMarketAnalytics') || {
      data: {
        total_market_cap: { usd: 2000000000000 },
        total_volume: { usd: 50000000000 },
        market_cap_percentage: { btc: 50, eth: 15 },
        active_cryptocurrencies: 10000,
        markets: 500
      }
    };
  }

  // Transform implementations
  protected transformCurrentPrice(data: any): number {
    return data.price || 50000;
  }

  protected transformCurrentPrices(data: any): CryptoPriceData[] {
    return data.map((item: any) => ({
      coinId: item.id,
      symbol: item.symbol,
      name: item.name,
      usdPrice: item.current_price,
      lastUpdated: new Date(),
      source: 'test',
      attribution: 'Test data'
    }));
  }

  protected transformCurrentOHLCV(coinId: string, data: any): CryptoOHLCVData {
    const [timestamp, open, high, low, close] = data[0];
    return {
      coinId,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 1000000,
      timeframe: 'daily',
      source: 'test',
      attribution: 'Test OHLCV data'
    };
  }

  protected transformLatestOHLCV(coinId: string, data: any): CryptoOHLCVData[] {
    return data.map(([timestamp, open, high, low, close]: any) => ({
      coinId,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 1000000,
      timeframe: 'daily',
      source: 'test',
      attribution: 'Test OHLCV data'
    }));
  }

  protected transformPriceHistory(data: any): Array<{ date: Date; price: number }> {
    return data.map(([timestamp, price]: any) => ({
      date: new Date(timestamp),
      price
    }));
  }

  protected transformOHLCVByDateRange(ticker: string, data: any): CryptoOHLCVData[] {
    return data.map(([timestamp, open, high, low, close]: any) => ({
      coinId: ticker,
      timestamp: new Date(timestamp),
      open,
      high,
      low,
      close,
      volume: 1000000,
      timeframe: 'daily',
      source: 'test',
      attribution: 'Test OHLCV data'
    }));
  }

  protected transformAvailableTickers(data: any, limit: number): CryptoPriceData[] {
    return data.slice(0, limit).map((item: any) => ({
      coinId: item.id,
      symbol: item.symbol,
      name: item.name,
      usdPrice: 0,
      lastUpdated: new Date(),
      source: 'test',
      attribution: 'Test ticker data'
    }));
  }

  protected transformLevel1Data(query: Level1Query, data: any): Level1Data {
    const price = data.current_price;
    const spread = price * 0.001;
    return {
      ticker: query.ticker,
      timestamp: new Date(),
      bestBid: price - spread / 2,
      bestAsk: price + spread / 2,
      spread,
      spreadPercent: 0.1,
      market: query.market || 'test',
      source: 'test',
      attribution: 'Test Level 1 data'
    };
  }

  protected transformMarketAnalytics(data: any): CryptoMarketAnalytics {
    const globalData = data.data;
    return {
      timestamp: new Date(),
      totalMarketCap: globalData.total_market_cap?.usd || 0,
      totalVolume: globalData.total_volume?.usd || 0,
      btcDominance: globalData.market_cap_percentage?.btc || 0,
      ethDominance: globalData.market_cap_percentage?.eth || 0,
      activeCryptocurrencies: globalData.active_cryptocurrencies || 0,
      markets: globalData.markets || 0,
      marketCapChange24h: 0,
      source: 'test',
      attribution: 'Test market analytics'
    };
  }
}

describe('BaseReader', () => {
  let reader: TestMarketDataReader;

  beforeEach(async () => {
    reader = new TestMarketDataReader({ name: 'test-reader', debug: false });
    
    // Add a mock client to simulate connected state
    const mockClient = { connect: () => {}, close: () => {} };
    reader.addClient('test-client', mockClient, {
      name: 'test-client',
      type: 'data-source'
    });
    
    // Mark client as connected
    const clientAssoc = reader.getClient('test-client');
    if (clientAssoc) {
      clientAssoc.isConnected = true;
    }
    
    await reader.initialize();
  });

  afterEach(async () => {
    await reader.cleanup();
  });

  describe('Client Management', () => {
    it('should add and retrieve clients', () => {
      const mockClient = { test: true };
      reader.addClient('test-client-2', mockClient, {
        name: 'test-client-2',
        type: 'database'
      });

      const retrieved = reader.getClient('test-client-2');
      expect(retrieved).toBeDefined();
      expect(retrieved?.client).toBe(mockClient);
      expect(retrieved?.config.type).toBe('database');
    });

    it('should remove clients', () => {
      const mockClient = { test: true };
      reader.addClient('temp-client', mockClient, {
        name: 'temp-client',
        type: 'cache'
      });

      expect(reader.getClient('temp-client')).toBeDefined();
      
      const removed = reader.removeClient('temp-client');
      expect(removed).toBe(true);
      expect(reader.getClient('temp-client')).toBeUndefined();
    });

    it('should get clients by type', () => {
      reader.addClient('db-client', {}, { name: 'db-client', type: 'database' });
      reader.addClient('cache-client', {}, { name: 'cache-client', type: 'cache' });

      const dbClients = reader.getClientsByType('database');
      expect(dbClients).toHaveLength(1);
      expect(dbClients[0].config.name).toBe('db-client');

      const cacheClients = reader.getClientsByType('cache');
      expect(cacheClients).toHaveLength(1);
      expect(cacheClients[0].config.name).toBe('cache-client');
    });

    it('should get all clients', () => {
      reader.addClient('client-1', {}, { name: 'client-1', type: 'database' });
      reader.addClient('client-2', {}, { name: 'client-2', type: 'cache' });

      const allClients = reader.getAllClients();
      expect(allClients.length).toBeGreaterThanOrEqual(3); // Including the test-client from beforeEach
    });
  });

  describe('DSL Method Implementation', () => {
    it('should implement getCurrentPrice with workflow pattern', async () => {
      const result = await reader.getCurrentPrice('bitcoin', 'usd');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const price = getData(result);
        expect(typeof price).toBe('number');
        expect(price).toBe(50000);
      }
    });

    it('should implement getCurrentPrices with workflow pattern', async () => {
      const result = await reader.getCurrentPrices(['bitcoin', 'ethereum']);
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const prices = getData(result) as CryptoPriceData[];
        expect(Array.isArray(prices)).toBe(true);
        expect(prices.length).toBe(1);
        expect(prices[0]).toHaveProperty('coinId');
        expect(prices[0]).toHaveProperty('usdPrice');
      }
    });

    it('should implement getCurrentOHLCV with workflow pattern', async () => {
      const result = await reader.getCurrentOHLCV('bitcoin');
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const ohlcv = getData(result) as CryptoOHLCVData;
        expect(ohlcv).toHaveProperty('coinId');
        expect(ohlcv).toHaveProperty('open');
        expect(ohlcv).toHaveProperty('high');
        expect(ohlcv).toHaveProperty('low');
        expect(ohlcv).toHaveProperty('close');
        expect(ohlcv).toHaveProperty('volume');
      }
    });

    it('should implement getMarketAnalytics with workflow pattern', async () => {
      const result = await reader.getMarketAnalytics();
      
      expect(isSuccess(result)).toBe(true);
      if (isSuccess(result)) {
        const analytics = getData(result) as CryptoMarketAnalytics;
        expect(analytics).toHaveProperty('totalMarketCap');
        expect(analytics).toHaveProperty('totalVolume');
        expect(analytics).toHaveProperty('btcDominance');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle plugin failures gracefully', async () => {
      reader.setShouldFail(true);
      
      const result = await reader.getCurrentPrice('bitcoin');
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        const error = getError(result);
        expect(error).toBeDefined();
        expect(error?.message).toContain('Mock plugin failure');
      }
    });

    it('should increment error count on failures', async () => {
      const initialErrorCount = reader.getStatus().errorCount;
      
      reader.setShouldFail(true);
      await reader.getCurrentPrice('bitcoin');
      
      const finalErrorCount = reader.getStatus().errorCount;
      expect(finalErrorCount).toBe(initialErrorCount + 1);
    });

    it('should handle no active client', async () => {
      // Remove all clients
      const allClients = reader.getAllClients();
      allClients.forEach(client => {
        client.isConnected = false;
      });
      
      const result = await reader.getCurrentPrice('bitcoin');
      
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        const error = getError(result);
        expect(error?.code).toBe('NO_CLIENT');
      }
    });
  });

  describe('Activity Tracking', () => {
    it('should track query count and last activity', async () => {
      const initialQueries = reader.getStatus().totalQueries;
      const initialActivity = reader.getStatus().lastActivity;
      
      await reader.getCurrentPrice('bitcoin');
      
      const finalQueries = reader.getStatus().totalQueries;
      const finalActivity = reader.getStatus().lastActivity;
      
      expect(finalQueries).toBe(initialQueries + 1);
      expect(finalActivity).not.toBe(initialActivity);
      expect(finalActivity).toBeInstanceOf(Date);
    });
  });

  describe('Lifecycle Management', () => {
    it('should initialize and cleanup properly', async () => {
      const newReader = new TestMarketDataReader({ name: 'lifecycle-test' });
      
      expect(newReader.getStatus().isInitialized).toBe(false);
      
      const initResult = await newReader.initialize();
      expect(isSuccess(initResult)).toBe(true);
      expect(newReader.getStatus().isInitialized).toBe(true);
      
      const cleanupResult = await newReader.cleanup();
      expect(isSuccess(cleanupResult)).toBe(true);
      expect(newReader.getStatus().isInitialized).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should use default validation for compatible data', async () => {
      // Mock response that passes default validation
      reader.setMockResponse('getCurrentPrices', [
        { id: 'bitcoin', current_price: 50000 }
      ]);
      
      const result = await reader.getCurrentPrices(['bitcoin']);
      expect(isSuccess(result)).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate OHLCV time range correctly', async () => {
      // This tests the protected method indirectly through getLatestOHLCV
      const result = await reader.getLatestOHLCV('bitcoin', 5, 'daily');
      expect(isSuccess(result)).toBe(true);
    });

    it('should resolve ticker to coin ID', async () => {
      // Test the default implementation through DSL methods
      const result = await reader.getCurrentPrice('BTC');
      expect(isSuccess(result)).toBe(true);
    });
  });
});