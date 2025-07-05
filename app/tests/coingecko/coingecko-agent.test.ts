// CoinGecko Agent Test - Agent/MCP Paradigm Integration
// Test: CoinGecko Agent (QiAgent + DSL + MCPWrapper)

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { CoinGeckoAgent, createCoinGeckoAgent } from '../../../lib/src/publishers/sources/coingecko/coingecko-agent';

/**
 * CoinGecko Agent Integration Test
 * 
 * This test verifies the complete Agent/MCP paradigm:
 * Agent = QiAgent + DSL + MCPWrapper
 * 
 * What we're testing:
 * 1. Agent initialization and MCP server connection
 * 2. High-level agent methods (not low-level MCP calls)
 * 3. AI-powered data analysis and enrichment
 * 4. Domain-specific operations through DSL
 * 5. Real crypto data acquisition and processing
 */

describe('CoinGecko Agent Tests', () => {
  let coinGeckoAgent: CoinGeckoAgent;
  
  beforeAll(async () => {
    console.log('🚀 Initializing CoinGecko Agent for testing...');
    
    // Create CoinGecko Agent
    coinGeckoAgent = createCoinGeckoAgent({
      name: 'test-coingecko-agent',
      description: 'CoinGecko agent for testing',
      version: '1.0.0',
      coinGeckoConfig: {
        debug: true,
        environment: 'free',
        autoStart: true,
      },
    });
    
    // Initialize agent (this starts MCP server and connects)
    await coinGeckoAgent.initialize();
    
    console.log('✅ CoinGecko Agent initialized successfully');
  }, 30000); // 30 second timeout for initialization
  
  afterAll(async () => {
    if (coinGeckoAgent) {
      console.log('🛑 Cleaning up CoinGecko Agent...');
      await coinGeckoAgent.cleanup();
      console.log('✅ CoinGecko Agent cleanup completed');
    }
  }, 10000);

  describe('Agent Status and Health', () => {
    test('should have proper agent status after initialization', async () => {
      console.log('📊 Testing agent status...');
      
      const status = coinGeckoAgent.getStatus();
      
      expect(status.isConnected).toBe(true);
      expect(status.totalQueries).toBe(0);
      expect(status.lastQuery).toBeNull();
      expect(status.serverStatus).toBeDefined();
      
      console.log('✅ Agent status verified');
    });
  });

  describe('Crypto Data Acquisition', () => {
    test('should get comprehensive crypto data for Bitcoin and Ethereum', async () => {
      console.log('\\n📊 TEST: Comprehensive Crypto Data');
      
      const result = await coinGeckoAgent.getCryptoData({
        coinIds: ['bitcoin', 'ethereum'],
        dataTypes: ['price', 'analytics'],
        includeAnalysis: true,
      });
      
      // Verify result structure
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.source).toBe('coingecko');
      
      // Verify price data
      expect(result.prices).toBeDefined();
      expect(Array.isArray(result.prices)).toBe(true);
      expect(result.prices!.length).toBe(2);
      
      // Verify Bitcoin price data
      const bitcoinPrice = result.prices!.find(p => p.coinId === 'bitcoin');
      expect(bitcoinPrice).toBeDefined();
      expect(bitcoinPrice!.usdPrice).toBeGreaterThan(0);
      expect(bitcoinPrice!.symbol).toBeDefined();
      expect(bitcoinPrice!.lastUpdated).toBeInstanceOf(Date);
      
      // Verify Ethereum price data
      const ethereumPrice = result.prices!.find(p => p.coinId === 'ethereum');
      expect(ethereumPrice).toBeDefined();
      expect(ethereumPrice!.usdPrice).toBeGreaterThan(0);
      
      // Verify analytics data
      expect(result.analytics).toBeDefined();
      expect(result.analytics!.totalMarketCap).toBeGreaterThan(0);
      expect(result.analytics!.btcDominance).toBeGreaterThan(0);
      
      // Verify AI analysis
      expect(result.aiAnalysis).toBeDefined();
      expect(typeof result.aiAnalysis).toBe('string');
      expect(result.aiAnalysis!.length).toBeGreaterThan(10);
      
      console.log(`✅ Bitcoin: $${bitcoinPrice!.usdPrice.toLocaleString()}`);
      console.log(`✅ Ethereum: $${ethereumPrice!.usdPrice.toLocaleString()}`);
      console.log(`✅ Market Cap: $${result.analytics!.totalMarketCap.toLocaleString()}`);
      console.log(`✅ BTC Dominance: ${result.analytics!.btcDominance.toFixed(1)}%`);
      console.log(`✅ AI Analysis: ${result.aiAnalysis!.substring(0, 100)}...`);
    }, 45000);

    test('should get current prices for multiple cryptocurrencies', async () => {
      console.log('\\n💰 TEST: Current Prices');
      
      const prices = await coinGeckoAgent.getCurrentPrices(['bitcoin', 'ethereum', 'cardano']);
      
      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBe(3);
      
      prices.forEach(price => {
        expect(price.coinId).toBeDefined();
        expect(price.usdPrice).toBeGreaterThan(0);
        expect(price.lastUpdated).toBeInstanceOf(Date);
        expect(price.source).toBe('coingecko');
        
        console.log(`   💰 ${price.coinId}: $${price.usdPrice.toLocaleString()}`);
      });
      
      console.log('✅ Current prices test passed');
    }, 30000);

    test('should get OHLCV data for technical analysis', async () => {
      console.log('\\n📈 TEST: OHLCV Technical Analysis');
      
      const ohlcvData = await coinGeckoAgent.getOHLCVAnalysis('bitcoin', 7, 'daily');
      
      expect(Array.isArray(ohlcvData)).toBe(true);
      expect(ohlcvData.length).toBeGreaterThan(0);
      expect(ohlcvData.length).toBeLessThanOrEqual(7);
      
      // Verify OHLCV data structure
      ohlcvData.forEach(candle => {
        expect(candle.coinId).toBe('bitcoin');
        expect(candle.timestamp).toBeInstanceOf(Date);
        expect(candle.open).toBeGreaterThan(0);
        expect(candle.high).toBeGreaterThan(0);
        expect(candle.low).toBeGreaterThan(0);
        expect(candle.close).toBeGreaterThan(0);
        expect(candle.volume).toBeGreaterThan(0);
        expect(candle.high).toBeGreaterThanOrEqual(candle.low);
        expect(candle.source).toBe('coingecko');
        
        console.log(`   📊 ${candle.timestamp.toISOString().split('T')[0]}: O:${candle.open} H:${candle.high} L:${candle.low} C:${candle.close}`);
      });
      
      console.log('✅ OHLCV technical analysis test passed');
    }, 30000);
  });

  describe('Market Intelligence', () => {
    test('should get comprehensive market intelligence', async () => {
      console.log('\\n🧠 TEST: Market Intelligence');
      
      const intelligence = await coinGeckoAgent.getMarketIntelligence();
      
      // Verify market analytics
      expect(intelligence.analytics).toBeDefined();
      expect(intelligence.analytics.totalMarketCap).toBeGreaterThan(0);
      expect(intelligence.analytics.btcDominance).toBeGreaterThan(0);
      expect(intelligence.analytics.activeCryptocurrencies).toBeGreaterThan(0);
      
      // Verify sentiment analysis
      expect(intelligence.sentiment).toBeDefined();
      expect(['bullish', 'bearish', 'neutral']).toContain(intelligence.sentiment);
      
      // Verify top performers
      expect(intelligence.topPerformers).toBeDefined();
      expect(intelligence.topPerformers.gainers).toBeDefined();
      expect(intelligence.topPerformers.losers).toBeDefined();
      expect(Array.isArray(intelligence.topPerformers.gainers)).toBe(true);
      expect(Array.isArray(intelligence.topPerformers.losers)).toBe(true);
      
      // Verify AI insights
      expect(intelligence.aiInsights).toBeDefined();
      expect(typeof intelligence.aiInsights).toBe('string');
      expect(intelligence.aiInsights!.length).toBeGreaterThan(10);
      
      console.log(`✅ Market Cap: $${intelligence.analytics.totalMarketCap.toLocaleString()}`);
      console.log(`✅ BTC Dominance: ${intelligence.analytics.btcDominance.toFixed(1)}%`);
      console.log(`✅ Market Sentiment: ${intelligence.sentiment.toUpperCase()}`);
      console.log(`✅ Top Gainer: ${intelligence.topPerformers.gainers[0]?.symbol} (+${intelligence.topPerformers.gainers[0]?.change24h.toFixed(2)}%)`);
      console.log(`✅ Top Loser: ${intelligence.topPerformers.losers[0]?.symbol} (${intelligence.topPerformers.losers[0]?.change24h.toFixed(2)}%)`);
      console.log(`✅ AI Insights: ${intelligence.aiInsights!.substring(0, 100)}...`);
      
      console.log('✅ Market intelligence test passed');
    }, 45000);
  });

  describe('Search and Discovery', () => {
    test('should search and analyze cryptocurrencies', async () => {
      console.log('\\n🔍 TEST: Search and Analysis');
      
      const searchResult = await coinGeckoAgent.searchAndAnalyze('DeFi', 5);
      
      expect(searchResult.results).toBeDefined();
      expect(Array.isArray(searchResult.results)).toBe(true);
      expect(searchResult.results.length).toBeGreaterThan(0);
      expect(searchResult.results.length).toBeLessThanOrEqual(5);
      
      // Verify search results
      searchResult.results.forEach(result => {
        expect(result.coinId).toBeDefined();
        expect(result.usdPrice).toBeGreaterThan(0);
        expect(result.source).toBe('coingecko');
        
        console.log(`   🔍 Found: ${result.coinId} - $${result.usdPrice}`);
      });
      
      // Verify AI analysis
      expect(searchResult.analysis).toBeDefined();
      expect(typeof searchResult.analysis).toBe('string');
      expect(searchResult.analysis!.length).toBeGreaterThan(10);
      
      console.log(`✅ Search Analysis: ${searchResult.analysis!.substring(0, 100)}...`);
      console.log('✅ Search and analysis test passed');
    }, 30000);
  });

  describe('Agent Performance', () => {
    test('should track query metrics correctly', async () => {
      console.log('\\n📊 TEST: Agent Performance Metrics');
      
      const initialStatus = coinGeckoAgent.getStatus();
      const initialQueries = initialStatus.totalQueries;
      
      // Make a query
      await coinGeckoAgent.getCurrentPrices(['bitcoin']);
      
      const afterStatus = coinGeckoAgent.getStatus();
      
      // Verify metrics updated
      expect(afterStatus.totalQueries).toBe(initialQueries + 1);
      expect(afterStatus.lastQuery).toBeInstanceOf(Date);
      expect(afterStatus.lastQuery!.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
      
      console.log(`✅ Query count increased: ${initialQueries} → ${afterStatus.totalQueries}`);
      console.log(`✅ Last query tracked: ${afterStatus.lastQuery!.toISOString()}`);
      console.log('✅ Agent performance metrics test passed');
    }, 15000);

    test('should handle multiple concurrent requests', async () => {
      console.log('\\n⚡ TEST: Concurrent Request Performance');
      
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = [
        coinGeckoAgent.getCurrentPrices(['bitcoin']),
        coinGeckoAgent.getCurrentPrices(['ethereum']),
        coinGeckoAgent.getCurrentPrices(['cardano']),
      ];
      
      const results = await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Verify all requests succeeded
      results.forEach((result, index) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].usdPrice).toBeGreaterThan(0);
      });
      
      console.log(`✅ Concurrent requests completed in ${duration}ms`);
      console.log('✅ Concurrent performance test passed');
    }, 30000);
  });

  describe('Error Handling', () => {
    test('should handle invalid coin IDs gracefully', async () => {
      console.log('\\n❌ TEST: Error Handling');
      
      // Test with invalid coin ID
      await expect(coinGeckoAgent.getCurrentPrices(['invalid-coin-that-does-not-exist']))
        .rejects
        .toThrow();
      
      console.log('✅ Invalid coin ID error handling verified');
    }, 15000);

    test('should maintain connection stability after errors', async () => {
      console.log('\\n🔄 TEST: Connection Stability');
      
      // After the error above, agent should still be connected
      const status = coinGeckoAgent.getStatus();
      expect(status.isConnected).toBe(true);
      
      // Should still be able to make valid requests
      const prices = await coinGeckoAgent.getCurrentPrices(['bitcoin']);
      expect(prices.length).toBe(1);
      expect(prices[0].usdPrice).toBeGreaterThan(0);
      
      console.log('✅ Connection stability after errors verified');
    }, 15000);
  });
});

// Manual test runner for development
export async function runCoinGeckoAgentTest(): Promise<void> {
  console.log('🚀 Running CoinGecko Agent Manual Test...\\n');
  
  const agent = createCoinGeckoAgent({
    name: 'manual-test-agent',
    description: 'Manual testing agent',
    version: '1.0.0',
    coinGeckoConfig: { debug: true },
  });
  
  try {
    // Initialize agent
    console.log('🔄 Initializing agent...');
    await agent.initialize();
    console.log('✅ Agent initialized\\n');
    
    // Test 1: Basic price data
    console.log('📊 Testing basic price data...');
    const prices = await agent.getCurrentPrices(['bitcoin', 'ethereum']);
    console.log(`✅ Got prices for ${prices.length} cryptocurrencies\\n`);
    
    // Test 2: Market intelligence
    console.log('🧠 Testing market intelligence...');
    const intelligence = await agent.getMarketIntelligence();
    console.log(`✅ Market sentiment: ${intelligence.sentiment}\\n`);
    
    // Test 3: Comprehensive data
    console.log('📈 Testing comprehensive data...');
    const data = await agent.getCryptoData({
      coinIds: ['bitcoin'],
      dataTypes: ['price', 'ohlcv', 'analytics'],
      includeAnalysis: true,
    });
    console.log(`✅ Got comprehensive data with AI analysis\\n`);
    
    console.log('🎉 All manual tests passed!');
    
    return {
      prices,
      intelligence,
      data,
    } as any;
    
  } catch (error) {
    console.error('❌ Manual test failed:', error);
    throw error;
  } finally {
    // Cleanup
    await agent.cleanup();
    console.log('✅ Agent cleanup completed');
  }
}

// Run manual test if this file is executed directly
if (require.main === module) {
  runCoinGeckoAgentTest()
    .then(() => {
      console.log('✅ Manual test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Manual test failed:', error);
      process.exit(1);
    });
}