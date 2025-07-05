#!/usr/bin/env bun

// Test the simplified Agent/MCP architecture: Agent = QiAgent + DSL
import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testSimplifiedArchitecture() {
  console.log('🧪 Testing Simplified Agent/MCP Architecture (Agent = QiAgent + DSL)...\n');
  
  const actor = createCoinGeckoActor({
    name: 'test-simplified-actor',
    description: 'Testing simplified architecture',
    version: '1.0.0',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false, // Use local server with demo API key
      environment: 'free',
      apiKey: process.env.COINGECKO_DEMO_API_KEY // Read from environment variable
    }
  });
  
  try {
    // Initialize actor (this will use the demo API key you provide)
    console.log('🚀 Initializing simplified actor...');
    await actor.initialize();
    
    // Check status
    const status = actor.getStatus();
    console.log('📊 Actor Status:', {
      isConnected: status.isConnected,
      totalQueries: status.totalQueries
    });
    
    // Test 1: Get current prices
    console.log('\n💰 Testing current prices...');
    const prices = await actor.getCurrentPrices(['bitcoin', 'ethereum']);
    console.log(`✅ Got prices for ${prices.length} cryptocurrencies`);
    prices.forEach((price: any) => {
      console.log(`   💰 ${price.coinId}: $${price.usdPrice.toLocaleString()}`);
    });
    
    // Test 2: Get comprehensive data with summary
    console.log('\n📊 Testing comprehensive data...');
    const data = await actor.getCryptoData({
      coinIds: ['bitcoin'],
      dataTypes: ['price', 'analytics'],
      includeAnalysis: true
    });
    console.log('✅ Got comprehensive data with summary');
    console.log(`   📈 Bitcoin: $${data.prices?.[0]?.usdPrice.toLocaleString()}`);
    console.log(`   📊 Market Cap: $${data.analytics?.totalMarketCap.toLocaleString()}`);
    console.log(`   📜 Data Summary: ${data.aiAnalysis?.substring(0, 100)}...`);
    console.log(`   📜 Attribution: ${data.prices?.[0]?.attribution}`);
    
    console.log('\n🎉 Simplified architecture test completed successfully!');
    console.log('\n✅ Key Benefits:');
    console.log('   • Removed redundant CoinGeckoClient wrapper');
    console.log('   • DSL directly calls MCPClient');
    console.log('   • Cleaner Actor = MCP Client + DSL architecture');
    console.log('   • Real CoinGecko MCP server integration');
    
    return true;
    
  } catch (error) {
    console.error('❌ Simplified architecture test failed:', error);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await actor.cleanup();
      console.log('✅ Actor cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError);
    }
  }
}

// Run the test
testSimplifiedArchitecture()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Simplified Agent/MCP architecture works perfectly!');
      process.exit(0);
    } else {
      console.log('\n💥 Architecture test failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });