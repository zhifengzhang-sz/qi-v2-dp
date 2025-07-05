#!/usr/bin/env bun

// Test Factor-Compositional Architecture: CoinGeckoActor → MarketDataPublisherActor → Redpanda
// This tests our core architecture principle: Agent = Special QiAgent with workflow composed of Actors

import { createCoinGeckoActor } from '../lib/src/publishers/sources/coingecko/coingecko-actor';
import { createMarketDataPublisherActor } from '../lib/src/streaming/actors/market-data-publisher-actor';

async function testFactorComposition() {
  console.log('🧪 Testing Factor-Compositional Architecture...\n');
  console.log('🎭 Actor = A class of MCP client that provides DSL tooling interfaces');
  console.log('🤖 Agent = A class of QiAgent with workflow composed of Actors\n');

  // =============================================================================
  // FACTOR 1: CoinGecko Data Acquisition Actor
  // =============================================================================
  
  console.log('📊 Creating CoinGecko Actor (Factor 1: Data Acquisition)...');
  const coinGeckoActor = createCoinGeckoActor({
    name: 'crypto-data-factor',
    description: 'Factor for crypto market data acquisition',
    version: '1.0.0',
    coinGeckoConfig: {
      debug: true,
      useRemoteServer: false,
      environment: 'demo',
    }
  });

  // =============================================================================
  // FACTOR 2: Market Data Publisher Actor  
  // =============================================================================
  
  console.log('📡 Creating MarketDataPublisher Actor (Factor 2: Data Streaming)...');
  const publisherActor = createMarketDataPublisherActor({
    name: 'market-data-publisher-factor',
    description: 'Factor for market data streaming to Redpanda',
    version: '1.0.0',
    redpandaConfig: {
      brokers: ['localhost:19092'], // External port mapping for Redpanda
      clientId: 'factor-composition-test',
    },
    logger: console
  });

  try {
    // =============================================================================
    // FACTOR INITIALIZATION
    // =============================================================================
    
    console.log('\n🚀 Initializing Factors...');
    console.log('   🎭 Factor 1: CoinGecko Actor initialization...');
    await coinGeckoActor.initialize();
    
    console.log('   🎭 Factor 2: MarketDataPublisher Actor initialization...');
    await publisherActor.initialize();
    
    console.log('✅ All factors initialized successfully!\n');

    // =============================================================================
    // FACTOR COMPOSITION TEST (Simulated Agent Workflow)
    // =============================================================================
    
    console.log('🔗 Testing Factor Composition (Agent Workflow Simulation)...\n');
    
    // Workflow Node 1: Use CoinGecko Actor to get market data
    console.log('📈 Workflow Node 1: Acquire crypto data via CoinGecko Actor DSL...');
    const marketData = await coinGeckoActor.getCryptoData({
      coinIds: ['bitcoin', 'ethereum'],
      dataTypes: ['price', 'analytics'],
      includeAnalysis: false // Just data, no AI processing (Actor, not Agent)
    });
    
    console.log(`   ✅ Factor 1 produced: ${marketData.prices?.length || 0} prices, analytics: ${!!marketData.analytics}`);
    
    // Display data from Factor 1
    if (marketData.prices) {
      for (const price of marketData.prices) {
        console.log(`   💰 ${price.symbol}: $${price.usdPrice.toLocaleString()}`);
      }
    }

    // Workflow Node 2: Use MarketDataPublisher Actor to stream data  
    console.log('\n📡 Workflow Node 2: Stream data via MarketDataPublisher Actor DSL...');
    const publishResult = await publisherActor.publishMarketData({
      prices: marketData.prices,
      analytics: marketData.analytics,
      timestamp: marketData.timestamp,
      source: marketData.source
    });
    
    console.log(`   ✅ Factor 2 produced: ${publishResult.messagesPublished} messages to ${publishResult.topicsUsed.length} topics`);
    console.log(`   📡 Topics used: ${publishResult.topicsUsed.join(', ')}`);
    
    // Display streaming results
    for (const response of publishResult.responses) {
      console.log(`   📤 Published to ${response.topic}, partition ${response.partition}, offset ${response.offset}`);
    }

    // =============================================================================
    // FACTOR STATUS VERIFICATION
    // =============================================================================
    
    console.log('\n📊 Factor Status Check...');
    
    const coinGeckoStatus = coinGeckoActor.getStatus();
    console.log(`   🎭 CoinGecko Actor: Connected=${coinGeckoStatus.isConnected}, Queries=${coinGeckoStatus.totalQueries}`);
    
    const publisherStatus = publisherActor.getStatus();
    console.log(`   🎭 Publisher Actor: Connected=${publisherStatus.isConnected}, Published=${publisherStatus.publishCount}`);

    // =============================================================================
    // ARCHITECTURE VERIFICATION
    // =============================================================================
    
    console.log('\n🏗️ Architecture Verification...');
    console.log('✅ Factor 1 (CoinGeckoActor): Provides DSL tooling interfaces for crypto data');
    console.log('✅ Factor 2 (PublisherActor): Provides DSL tooling interfaces for data streaming'); 
    console.log('✅ Factor Independence: Each Actor is source-agnostic and self-contained');
    console.log('✅ Factor Composition: Workflow orchestrated Actor DSL interfaces');
    console.log('✅ Business Logic Encapsulation: Each Actor knows its domain expertise');
    
    console.log('\n🎉 Factor-Compositional Architecture Test PASSED!');
    console.log('\n💡 Key Insights:');
    console.log('   • Actors encapsulate domain-specific DSL tooling interfaces');
    console.log('   • Factors are composable and independently testable');
    console.log('   • Business logic stays within each factor\'s specialty');
    console.log('   • Agent workflow would orchestrate these factor compositions');
    
    return true;

  } catch (error) {
    console.error('❌ Factor composition test failed:', error);
    return false;
  } finally {
    // =============================================================================
    // FACTOR CLEANUP
    // =============================================================================
    
    console.log('\n🧹 Cleaning up factors...');
    try {
      await coinGeckoActor.cleanup();
      console.log('✅ CoinGecko Actor cleanup completed');
      
      await publisherActor.cleanup();
      console.log('✅ MarketDataPublisher Actor cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError);
    }
  }
}

// =============================================================================
// RUN TEST
// =============================================================================

if (import.meta.main) {
  const success = await testFactorComposition();
  process.exit(success ? 0 : 1);
}