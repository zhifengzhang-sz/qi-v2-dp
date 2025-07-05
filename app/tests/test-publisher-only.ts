#!/usr/bin/env bun

/**
 * TEST: Publisher Only
 * 
 * Simple test to verify the MarketDataPublisher works correctly
 */

import { createMarketDataPublisherActor } from '../lib/src/streaming/actors/market-data-publisher-actor';
import { RedpandaConfigManager } from '../lib/src/streaming/redpanda/redpanda-config';

async function testPublisherOnly() {
  console.log('📤 TESTING: Publisher Only\n');
  
  // Force correct broker configuration in singleton
  const configManager = RedpandaConfigManager.getInstance();
  configManager.updateConfig({
    brokers: ['localhost:19092'],
    clientId: 'test-publisher'
  });
  console.log('🔧 Updated singleton config to use localhost:19092');

  const publisherActor = createMarketDataPublisherActor({
    name: 'test-publisher',
    redpandaConfig: {
      clientId: 'test-publisher',
      brokers: ['localhost:19092'], // Explicit broker config
    }
  });

  try {
    console.log('🔧 Initializing Publisher Actor...');
    console.log('🔧 Expected broker: localhost:19092');
    
    await publisherActor.initialize();
    console.log('✅ Publisher Actor initialized');
    
    // Test publishing a simple message
    console.log('\n📤 Testing message publishing...');
    
    const testData = {
      symbol: 'BTC/USD',
      price: 108000,
      timestamp: new Date().toISOString(),
      source: 'test-data',
      metadata: { test: true }
    };
    
    await publisherActor.publishMarketData('test.topic', testData);
    console.log('✅ Message published successfully');

    return true;
  } catch (error) {
    console.error('❌ Publisher test failed:', error);
    return false;
  } finally {
    console.log('\n🧹 Cleaning up...');
    try {
      await publisherActor.cleanup();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

if (import.meta.main) {
  console.log('=' .repeat(60));
  console.log('📤 PUBLISHER ONLY TEST');
  console.log('=' .repeat(60));
  
  const success = await testPublisherOnly();
  
  console.log('\n' + '=' .repeat(60));
  console.log(success ? '✅ PUBLISHER WORKING!' : '❌ PUBLISHER FAILED');
  console.log('=' .repeat(60));
  
  process.exit(success ? 0 : 1);
}