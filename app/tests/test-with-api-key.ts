#!/usr/bin/env bun

// Test script with API key from environment
// Usage: COINGECKO_DEMO_API_KEY=your-key bun run test-with-api-key.ts

console.log('🧪 Testing CoinGecko Agent with Demo API Key...\n');

// Check for API key
const apiKey = process.env.COINGECKO_PRO_API_KEY;
if (!apiKey) {
  console.error('❌ COINGECKO_PRO_API_KEY environment variable not set');
  console.error('Usage: COINGECKO_PRO_API_KEY=your-key bun run test-with-api-key.ts');
  process.exit(1);
}

console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';

async function testWithApiKey() {
  const actor = createCoinGeckoActor({
    name: 'test-api-key-actor',
    description: 'Testing with real API key',
    version: '1.0.0',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: true, // Use remote server (may handle demo keys better)
      environment: 'demo',
      apiKey: apiKey
    }
  });
  
  try {
    console.log('🚀 Initializing actor with demo API key...');
    await actor.initialize();
    
    console.log('📊 Testing current prices...');
    const prices = await actor.getCurrentPrices(['bitcoin', 'ethereum']);
    
    console.log('✅ SUCCESS! Real data received:');
    prices.forEach((price: any) => {
      console.log(`   💰 ${price.coinId}: $${price.usdPrice.toLocaleString()}`);
      console.log(`   📜 ${price.attribution}`);
    });
    
    console.log('\n🎉 CoinGecko Actor/MCP integration working perfectly!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  } finally {
    try {
      await actor.cleanup();
      console.log('✅ Actor cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError);
    }
  }
}

testWithApiKey()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Agent/MCP integration test PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 Agent/MCP integration test FAILED');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test script error:', error);
    process.exit(1);
  });