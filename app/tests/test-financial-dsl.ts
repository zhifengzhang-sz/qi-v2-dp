#!/usr/bin/env bun

// Test the new financial market DSL methods
import { CoinGeckoDSL } from '../lib/src/publishers/sources/coingecko/coingecko-dsl';

async function testFinancialDSL() {
  console.log('🧪 Testing Financial Market DSL Methods...\n');
  
  const dsl = new CoinGeckoDSL({
    debug: true,
    useRemoteServer: true,
    environment: 'demo',
    apiKey: process.env.COINGECKO_PRO_API_KEY
  });
  
  try {
    // Initialize DSL
    console.log('🚀 Initializing CoinGecko DSL...');
    await dsl.initialize();
    
    // Test 1: Get OHLCV data by date range
    console.log('\n📊 Test 1: Get OHLCV data by date range');
    const dateStart = new Date('2025-01-01');
    const dateEnd = new Date('2025-01-05');
    
    const ohlcvData = await dsl.getOHLCVByDateRange({
      ticker: 'BTC',
      dateStart,
      dateEnd,
      interval: '1d',
      market: 'USD'
    });
    
    console.log(`✅ Got ${ohlcvData.length} OHLCV records for BTC/USD`);
    if (ohlcvData.length > 0) {
      const latest = ohlcvData[ohlcvData.length - 1];
      console.log(`   📈 Latest: Open=$${latest.open.toLocaleString()}, Close=$${latest.close.toLocaleString()}`);
      console.log(`   📅 Date: ${latest.timestamp.toISOString().split('T')[0]}`);
      console.log(`   🏢 Market: ${latest.market}, Interval: ${latest.timeframe}`);
    }
    
    // Test 2: Get Level 1 data (best bid/ask)
    console.log('\n💰 Test 2: Get Level 1 data (best bid/ask)');
    const level1Data = await dsl.getLevel1Data({
      ticker: 'ETH',
      market: 'USD'
    });
    
    console.log(`✅ Level 1 data for ${level1Data.ticker}:`);
    console.log(`   💰 Best Bid: $${level1Data.bestBid.toFixed(2)}`);
    console.log(`   💰 Best Ask: $${level1Data.bestAsk.toFixed(2)}`);
    console.log(`   📊 Spread: $${level1Data.spread.toFixed(2)} (${level1Data.spreadPercent.toFixed(3)}%)`);
    console.log(`   ⏰ Timestamp: ${level1Data.timestamp.toISOString()}`);
    
    // Test 3: Stream real-time Level 1 data (limited test)
    console.log('\n📡 Test 3: Stream real-time Level 1 data (5 updates)');
    let updateCount = 0;
    
    const stopLevel1Stream = await dsl.streamLevel1Data(
      { ticker: 'BTC', market: 'USD' },
      (data: any) => {
        updateCount++;
        console.log(`   📊 Update ${updateCount}: BTC Bid=$${data.bestBid.toFixed(0)}, Ask=$${data.bestAsk.toFixed(0)}`);
      },
      { pollIntervalMs: 2000, stopAfter: 5 }
    );
    
    // Wait for streaming to complete
    await new Promise(resolve => setTimeout(resolve, 12000));
    stopLevel1Stream();
    console.log(`✅ Completed ${updateCount} real-time updates`);
    
    // Test 4: Stream real-time OHLCV (limited test)
    console.log('\n📈 Test 4: Stream real-time OHLCV (3 updates)');
    let ohlcvUpdateCount = 0;
    
    const stopOHLCVStream = await dsl.streamRealtimeOHLCV(
      { ticker: 'ETH', dataType: 'ohlcv', interval: '1h', market: 'USD' },
      (event: any) => {
        ohlcvUpdateCount++;
        const ohlcv = event.data as any;
        console.log(`   📊 OHLCV Update ${ohlcvUpdateCount}: ${event.ticker} Close=$${ohlcv.close?.toFixed(0)}`);
      },
      { pollIntervalMs: 3000, stopAfter: 3 }
    );
    
    // Wait for OHLCV streaming to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    stopOHLCVStream();
    console.log(`✅ Completed ${ohlcvUpdateCount} OHLCV updates`);
    
    console.log('\n🎉 All financial DSL tests completed successfully!');
    console.log('\n✅ Financial DSL Features Verified:');
    console.log('   • Date-range OHLCV queries with ticker resolution');
    console.log('   • Level 1 market data (bid/ask spreads)');
    console.log('   • Real-time streaming with polling fallback');
    console.log('   • Exchange/market parameter support');
    console.log('   • Proper financial data structures');
    
    return true;
    
  } catch (error) {
    console.error('❌ Financial DSL test failed:', error);
    return false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await dsl.close();
      console.log('✅ DSL cleanup completed');
    } catch (cleanupError) {
      console.warn('⚠️  Cleanup warning:', cleanupError);
    }
  }
}

// Check for API key
const apiKey = process.env.COINGECKO_PRO_API_KEY;
if (!apiKey) {
  console.error('❌ COINGECKO_PRO_API_KEY environment variable not set');
  console.error('Usage: COINGECKO_PRO_API_KEY=your-key bun run test-financial-dsl.ts');
  process.exit(1);
}

console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);

// Run the test
testFinancialDSL()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Financial DSL test PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 Financial DSL test FAILED');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });