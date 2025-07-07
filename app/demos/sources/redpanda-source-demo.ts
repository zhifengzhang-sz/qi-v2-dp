#!/usr/bin/env bun

/**
 * Redpanda Source Demo
 * 
 * Demonstrates the Redpanda Market Data Reader actor.
 * Shows how to consume data from Redpanda streaming topics.
 */

import { createRedpandaMarketDataReader } from "../../../lib/src/sources/redpanda";

console.log("🔴 Redpanda Source Demo");
console.log("=" * 50);

async function demonstrateRedpandaSource() {
  console.log("\n📊 Creating Redpanda Market Data Reader...");
  
  const redpandaReader = createRedpandaMarketDataReader({
    name: "demo-redpanda-reader",
    brokers: ["localhost:9092"],
    groupId: "demo-crypto-reader",
    topics: {
      prices: "crypto-prices",
      ohlcv: "crypto-ohlcv", 
      analytics: "crypto-analytics",
      level1: "crypto-level1"
    },
    timeout: 10000,
    debug: true
  });

  try {
    console.log("\n🚀 Initializing Redpanda reader...");
    const initResult = await redpandaReader.initialize();
    
    if (initResult.success) {
      console.log("✅ Redpanda reader initialized successfully");
    } else {
      console.log("❌ Initialization failed:", initResult.error);
      console.log("💡 Make sure Redpanda is running: docker-compose up redpanda");
      return;
    }

    console.log("\n📈 Testing DSL Functions:");

    // Test 1: Get current price (from stream)
    console.log("\n1️⃣ Getting current Bitcoin price from stream...");
    console.log("   ⏱️ Waiting up to 10 seconds for price data...");
    
    const priceResult = await redpandaReader.getCurrentPrice("bitcoin", "usd");
    
    if (priceResult.success) {
      console.log(`   💰 Bitcoin price from stream: $${priceResult.data.toFixed(2)}`);
    } else {
      console.log(`   ❌ Price fetch failed: ${priceResult.error.message}`);
      console.log(`   💡 This is expected if no data is being published to crypto-prices topic`);
    }

    // Test 2: Get multiple prices (from stream)
    console.log("\n2️⃣ Getting multiple cryptocurrency prices from stream...");
    console.log("   ⏱️ Waiting for crypto data on topics...");
    
    const pricesResult = await redpandaReader.getCurrentPrices(
      ["bitcoin", "ethereum", "cardano"],
      { vsCurrency: "usd", includeMarketCap: true }
    );
    
    if (pricesResult.success) {
      console.log(`   📊 Retrieved ${pricesResult.data.length} cryptocurrency prices from stream:`);
      pricesResult.data.forEach((crypto) => {
        console.log(`     💎 ${crypto.name} (${crypto.symbol.toUpperCase()}): $${crypto.usdPrice.toFixed(2)}`);
        console.log(`       📅 Last updated: ${crypto.lastUpdated.toISOString()}`);
        console.log(`       🔗 Source: ${crypto.source}`);
      });
    } else {
      console.log(`   ❌ Prices fetch failed: ${priceResult.error.message}`);
      console.log(`   💡 This is expected if no data is being published to crypto topics`);
    }

    // Test 3: Get OHLCV data (from stream)
    console.log("\n3️⃣ Getting Bitcoin OHLCV data from stream...");
    
    const ohlcvResult = await redpandaReader.getCurrentOHLCV("bitcoin");
    
    if (ohlcvResult.success) {
      const ohlcv = ohlcvResult.data;
      console.log(`   📊 Bitcoin OHLCV from stream:`);
      console.log(`     🔓 Open: $${ohlcv.open.toFixed(2)}`);
      console.log(`     🔺 High: $${ohlcv.high.toFixed(2)}`);
      console.log(`     🔻 Low: $${ohlcv.low.toFixed(2)}`);
      console.log(`     🔒 Close: $${ohlcv.close.toFixed(2)}`);
      console.log(`     📦 Volume: ${ohlcv.volume.toFixed(0)}`);
      console.log(`     ⏰ Timestamp: ${ohlcv.timestamp.toISOString()}`);
      console.log(`     🔗 Source: ${ohlcv.source}`);
    } else {
      console.log(`   ❌ OHLCV fetch failed: ${ohlcvResult.error.message}`);
      console.log(`   💡 This is expected if no OHLCV data is being published to crypto-ohlcv topic`);
    }

    // Test 4: Get market analytics (from stream)
    console.log("\n4️⃣ Getting market analytics from stream...");
    
    const analyticsResult = await redpandaReader.getMarketAnalytics();
    
    if (analyticsResult.success) {
      const analytics = analyticsResult.data;
      console.log(`   🌍 Global Market Analytics from stream:`);
      console.log(`     💰 Total Market Cap: $${(analytics.totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(`     📊 Total Volume (24h): $${(analytics.totalVolume / 1e9).toFixed(2)}B`);
      console.log(`     ₿ Bitcoin Dominance: ${analytics.btcDominance.toFixed(1)}%`);
      console.log(`     ⟠ Ethereum Dominance: ${analytics.ethDominance.toFixed(1)}%`);
      console.log(`     ⏰ Timestamp: ${analytics.timestamp.toISOString()}`);
      console.log(`     🔗 Source: ${analytics.source}`);
    } else {
      console.log(`   ❌ Analytics fetch failed: ${analyticsResult.error.message}`);
      console.log(`   💡 This is expected if no analytics data is being published to crypto-analytics topic`);
    }

    // Test 5: Actor status
    console.log("\n5️⃣ Checking actor status...");
    const status = redpandaReader.getStatus();
    console.log(`   🔧 Actor Status:`);
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 Connected: ${status.isConnected}`);
    console.log(`     📊 Total Queries: ${status.totalQueries}`);
    console.log(`     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : 'None'}`);
    console.log(`     ❌ Error Count: ${status.errorCount}`);
    console.log(`     🔴 Brokers: ${status.brokers?.join(', ')}`);
    console.log(`     👥 Group ID: ${status.groupId}`);

    // Test 6: Demonstrate streaming capabilities
    console.log("\n6️⃣ Demonstrating streaming capabilities...");
    console.log("   💡 Redpanda source excels at real-time data consumption");
    console.log("   🔄 In a real pipeline, this would continuously process streaming data");
    console.log("   📡 Topics being monitored:");
    console.log(`     - crypto-prices: Real-time price updates`);
    console.log(`     - crypto-ohlcv: OHLCV candle data`);
    console.log(`     - crypto-analytics: Market-wide analytics`);
    console.log(`     - crypto-level1: Level 1 order book data`);

  } catch (error) {
    console.error("💥 Demo failed with error:", error);
    if (error.message?.includes("ECONNREFUSED") || error.message?.includes("broker")) {
      console.log("💡 Connection failed - make sure Redpanda is running:");
      console.log("   docker-compose up redpanda");
    }
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await redpandaReader.cleanup();
    
    if (cleanupResult.success) {
      console.log("✅ Cleanup completed successfully");
    } else {
      console.log("❌ Cleanup failed:", cleanupResult.error);
    }
  }

  console.log("\n🎉 Redpanda Source Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with Redpanda streams");
  console.log("🔧 The actor can consume real-time data for immediate processing or forwarding");
  console.log("📡 Perfect for building reactive data pipelines");
}

demonstrateRedpandaSource().catch(console.error);