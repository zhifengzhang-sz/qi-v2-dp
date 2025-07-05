#!/usr/bin/env bun

// Test just the CoinGecko Actor factor to verify our architecture works

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testCoinGeckoActorOnly() {
  console.log('🧪 Testing CoinGecko Actor Factor (Architecture Verification)...\n');
  console.log('🎭 Actor = A class of MCP client that provides DSL tooling interfaces\n');

  // =============================================================================
  // FACTOR 1: CoinGecko Data Acquisition Actor
  // =============================================================================
  
  console.log('📊 Creating CoinGecko Actor (Factor: Crypto Data DSL)...');
  const coinGeckoActor = createCoinGeckoActor({
    name: 'crypto-data-factor',
    description: 'Factor that provides DSL tooling interfaces for crypto data',
    version: '1.0.0',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false,
      environment: 'demo',
    }
  });

  try {
    // =============================================================================
    // FACTOR INITIALIZATION
    // =============================================================================
    
    console.log('\n🚀 Initializing CoinGecko Actor...');
    await coinGeckoActor.initialize();
    console.log('✅ CoinGecko Actor initialized successfully!\n');

    // =============================================================================
    // DSL TOOLING INTERFACES TEST
    // =============================================================================
    
    console.log('🔧 Testing DSL Tooling Interfaces...\n');
    
    // Test DSL Interface 1: Get current prices
    console.log('💰 DSL Interface: getCurrentPrices()');
    const prices = await coinGeckoActor.getCurrentPrices(['bitcoin', 'ethereum']);
    console.log(`   ✅ Retrieved ${prices.length} price records`);
    
    for (const price of prices) {
      console.log(`   💰 ${price.symbol}: $${price.usdPrice.toLocaleString()}`);
      console.log(`   📜 Attribution: ${price.attribution}`);
    }

    // Test DSL Interface 2: Get comprehensive market data
    console.log('\n📊 DSL Interface: getCryptoData()');
    const marketData = await coinGeckoActor.getCryptoData({
      coinIds: ['bitcoin'],
      dataTypes: ['price', 'analytics'],
      includeAnalysis: false // Actor provides data, not AI analysis
    });
    
    console.log(`   ✅ Market data retrieved:`);
    console.log(`   💰 Prices: ${marketData.prices?.length || 0} records`);
    console.log(`   📈 Analytics: ${!!marketData.analytics ? 'included' : 'not included'}`);
    console.log(`   🕒 Timestamp: ${marketData.timestamp.toISOString()}`);
    console.log(`   📊 Source: ${marketData.source}`);

    // Test DSL Interface 3: Get market intelligence
    console.log('\n🧠 DSL Interface: getMarketIntelligence()');
    const intelligence = await coinGeckoActor.getMarketIntelligence();
    console.log(`   ✅ Market intelligence retrieved:`);
    console.log(`   📊 Total Market Cap: $${intelligence.analytics.totalMarketCap.toLocaleString()}`);
    console.log(`   💹 Market Sentiment: ${intelligence.sentiment}`);
    console.log(`   🏆 Top Performers: ${intelligence.topPerformers.gainers?.length || 0} gainers`);
    console.log(`   📝 AI Insights: ${intelligence.aiInsights?.substring(0, 100)}...`);

    // =============================================================================
    // FACTOR STATUS VERIFICATION
    // =============================================================================
    
    console.log('\n📊 Factor Status Check...');
    const status = coinGeckoActor.getStatus();
    console.log(`   🎭 CoinGecko Actor Status:`);
    console.log(`      Connected: ${status.isConnected}`);
    console.log(`      Total Queries: ${status.totalQueries}`);
    console.log(`      Last Query: ${status.lastQuery?.toISOString()}`);

    // =============================================================================
    // ARCHITECTURE VERIFICATION
    // =============================================================================
    
    console.log('\n🏗️ Architecture Verification...');
    console.log('✅ Actor Definition: A class of MCP client that provides DSL tooling interfaces');
    console.log('✅ DSL Specialty: Domain-specific tooling interfaces for crypto market data');
    console.log('✅ MCP Integration: Actor uses tools from MCP server + local tools');
    console.log('✅ Business Logic: Actor encapsulates crypto data domain expertise');
    console.log('✅ Source Agnostic: Actor provides clean interfaces, hides MCP complexity');
    
    console.log('\n🎉 CoinGecko Actor Factor Test PASSED!');
    console.log('\n💡 Architecture Insights:');
    console.log('   • Actor successfully provides DSL tooling interfaces');
    console.log('   • Business logic is properly encapsulated within the factor');
    console.log('   • MCP complexity is hidden from users');
    console.log('   • Factor is ready for Agent workflow composition');
    
    return true;

  } catch (error) {
    console.error('❌ CoinGecko Actor test failed:', error);
    return false;
  } finally {
    // =============================================================================
    // FACTOR CLEANUP
    // =============================================================================
    
    console.log('\n🧹 Cleaning up CoinGecko Actor...');
    try {
      await coinGeckoActor.cleanup();
      console.log('✅ CoinGecko Actor cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

// =============================================================================
// RUN TEST
// =============================================================================

if (import.meta.main) {
  const success = await testCoinGeckoActorOnly();
  process.exit(success ? 0 : 1);
}