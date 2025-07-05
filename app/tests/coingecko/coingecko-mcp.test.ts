// app/tests/coingecko/coingecko-mcp.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPClient } from '@qicore/agent-lib/qimcp/client';

describe('CoinGecko MCP Integration Tests', () => {
  let coinGeckoMCP: MCPClient;

  beforeAll(async () => {
    // Start CoinGecko MCP server (assuming it's already running)
    coinGeckoMCP = new MCPClient('stdio://coingecko-mcp-server');
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('Price Data', () => {
    it('should get current Bitcoin price', async () => {
      const result = await coinGeckoMCP.call('get_price', {
        ids: 'bitcoin',
        vs_currencies: 'usd',
        include_market_cap: true,
        include_24hr_vol: true,
        include_24hr_change: true
      });

      expect(result.bitcoin).toBeDefined();
      expect(result.bitcoin.usd).toBeGreaterThan(0);
      expect(result.bitcoin.usd_market_cap).toBeGreaterThan(0);
      expect(result.bitcoin.usd_24h_vol).toBeGreaterThan(0);
      expect(typeof result.bitcoin.usd_24h_change).toBe('number');
    });

    it('should get prices for multiple cryptocurrencies', async () => {
      const result = await coinGeckoMCP.call('get_price', {
        ids: 'bitcoin,ethereum,cardano',
        vs_currencies: 'usd,btc',
        include_market_cap: true
      });

      expect(result.bitcoin).toBeDefined();
      expect(result.ethereum).toBeDefined();
      expect(result.cardano).toBeDefined();
      
      // Check USD prices
      expect(result.bitcoin.usd).toBeGreaterThan(0);
      expect(result.ethereum.usd).toBeGreaterThan(0);
      expect(result.cardano.usd).toBeGreaterThan(0);
      
      // Check BTC prices
      expect(result.ethereum.btc).toBeGreaterThan(0);
      expect(result.cardano.btc).toBeGreaterThan(0);
    });
  });

  describe('OHLCV Data', () => {
    it('should get Bitcoin OHLCV data', async () => {
      const result = await coinGeckoMCP.call('get_ohlcv', {
        id: 'bitcoin',
        vs_currency: 'usd',
        days: '1',
        interval: 'hourly'
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const firstEntry = result[0];
      expect(firstEntry).toHaveLength(6); // [timestamp, open, high, low, close, volume]
      expect(typeof firstEntry[0]).toBe('number'); // timestamp
      expect(typeof firstEntry[1]).toBe('number'); // open
      expect(typeof firstEntry[2]).toBe('number'); // high
      expect(typeof firstEntry[3]).toBe('number'); // low
      expect(typeof firstEntry[4]).toBe('number'); // close
      expect(typeof firstEntry[5]).toBe('number'); // volume
    });

    it('should get Ethereum daily OHLCV data', async () => {
      const result = await coinGeckoMCP.call('get_ohlcv', {
        id: 'ethereum',
        vs_currency: 'usd',
        days: '7',
        interval: 'daily'
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(7);
      
      result.forEach(entry => {
        expect(entry).toHaveLength(6);
        expect(entry[2]).toBeGreaterThanOrEqual(entry[3]); // high >= low
        expect(entry[2]).toBeGreaterThanOrEqual(entry[1]); // high >= open
        expect(entry[2]).toBeGreaterThanOrEqual(entry[4]); // high >= close
      });
    });
  });

  describe('Market Data', () => {
    it('should get coins market data', async () => {
      const result = await coinGeckoMCP.call('get_coins_markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(10);
      
      const firstCoin = result[0];
      expect(firstCoin.id).toBeDefined();
      expect(firstCoin.symbol).toBeDefined();
      expect(firstCoin.name).toBeDefined();
      expect(firstCoin.current_price).toBeGreaterThan(0);
      expect(firstCoin.market_cap).toBeGreaterThan(0);
      expect(firstCoin.market_cap_rank).toBe(1); // First should be rank 1
      expect(typeof firstCoin.price_change_percentage_24h).toBe('number');
    });

    it('should get top cryptocurrencies by market cap', async () => {
      const result = await coinGeckoMCP.call('get_coins_markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 50,
        page: 1
      });

      expect(result.length).toBe(50);
      
      // Check if sorted by market cap descending
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].market_cap).toBeGreaterThanOrEqual(result[i + 1].market_cap);
      }
    });
  });

  describe('Global Statistics', () => {
    it('should get global crypto statistics', async () => {
      const result = await coinGeckoMCP.call('get_global');

      expect(result.data).toBeDefined();
      expect(result.data.total_market_cap).toBeDefined();
      expect(result.data.total_volume).toBeDefined();
      expect(result.data.market_cap_percentage).toBeDefined();
      expect(result.data.active_cryptocurrencies).toBeGreaterThan(0);
      expect(result.data.markets).toBeGreaterThan(0);
      
      // Check Bitcoin dominance
      expect(result.data.market_cap_percentage.btc).toBeGreaterThan(0);
      expect(result.data.market_cap_percentage.btc).toBeLessThan(100);
    });
  });

  describe('Trending Data', () => {
    it('should get trending cryptocurrencies', async () => {
      const result = await coinGeckoMCP.call('get_trending');

      expect(result.coins).toBeDefined();
      expect(Array.isArray(result.coins)).toBe(true);
      expect(result.coins.length).toBeGreaterThan(0);
      
      const firstTrendingCoin = result.coins[0];
      expect(firstTrendingCoin.item).toBeDefined();
      expect(firstTrendingCoin.item.id).toBeDefined();
      expect(firstTrendingCoin.item.symbol).toBeDefined();
      expect(firstTrendingCoin.item.name).toBeDefined();
      expect(typeof firstTrendingCoin.item.score).toBe('number');
    });
  });

  describe('Search Functionality', () => {
    it('should search for cryptocurrencies', async () => {
      const result = await coinGeckoMCP.call('search', {
        query: 'bitcoin'
      });

      expect(result.coins).toBeDefined();
      expect(Array.isArray(result.coins)).toBe(true);
      expect(result.coins.length).toBeGreaterThan(0);
      
      // Should find Bitcoin
      const bitcoin = result.coins.find(coin => coin.id === 'bitcoin');
      expect(bitcoin).toBeDefined();
      expect(bitcoin.symbol).toBe('btc');
      expect(bitcoin.name.toLowerCase()).toContain('bitcoin');
    });

    it('should search for DeFi tokens', async () => {
      const result = await coinGeckoMCP.call('search', {
        query: 'uniswap'
      });

      expect(result.coins).toBeDefined();
      expect(result.coins.length).toBeGreaterThan(0);
      
      // Should find Uniswap
      const uniswap = result.coins.find(coin => coin.id === 'uniswap');
      expect(uniswap).toBeDefined();
    });
  });

  describe('Historical Data', () => {
    it('should get historical data for a specific date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toLocaleDateString('en-GB'); // dd-mm-yyyy format

      const result = await coinGeckoMCP.call('get_history', {
        id: 'bitcoin',
        date: dateStr
      });

      expect(result.id).toBe('bitcoin');
      expect(result.market_data).toBeDefined();
      expect(result.market_data.current_price).toBeDefined();
      expect(result.market_data.current_price.usd).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid coin ID', async () => {
      await expect(coinGeckoMCP.call('get_price', {
        ids: 'invalid-coin-id',
        vs_currencies: 'usd'
      })).rejects.toThrow();
    });

    it('should handle invalid currency', async () => {
      await expect(coinGeckoMCP.call('get_price', {
        ids: 'bitcoin',
        vs_currencies: 'invalid-currency'
      })).rejects.toThrow();
    });

    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(coinGeckoMCP.call('get_price', {
          ids: 'bitcoin',
          vs_currencies: 'usd'
        }));
      }

      // Should handle rate limiting without crashing
      const results = await Promise.allSettled(promises);
      
      // At least some requests should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Data Quality', () => {
    it('should return consistent data structure', async () => {
      const result = await coinGeckoMCP.call('get_coins_markets', {
        vs_currency: 'usd',
        per_page: 5,
        page: 1
      });

      result.forEach(coin => {
        expect(coin).toHaveProperty('id');
        expect(coin).toHaveProperty('symbol');
        expect(coin).toHaveProperty('name');
        expect(coin).toHaveProperty('current_price');
        expect(coin).toHaveProperty('market_cap');
        expect(coin).toHaveProperty('market_cap_rank');
        expect(coin).toHaveProperty('total_volume');
        expect(coin).toHaveProperty('price_change_24h');
        expect(coin).toHaveProperty('price_change_percentage_24h');
      });
    });

    it('should have reasonable data values', async () => {
      const result = await coinGeckoMCP.call('get_price', {
        ids: 'bitcoin,ethereum',
        vs_currencies: 'usd'
      });

      // Bitcoin should be more expensive than Ethereum
      expect(result.bitcoin.usd).toBeGreaterThan(result.ethereum.usd);
      
      // Both should have reasonable values
      expect(result.bitcoin.usd).toBeGreaterThan(1000);
      expect(result.ethereum.usd).toBeGreaterThan(100);
    });
  });
});