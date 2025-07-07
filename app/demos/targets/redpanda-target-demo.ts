#!/usr/bin/env bun

/**
 * Redpanda Target Demo
 * 
 * Demonstrates the Redpanda Market Data Writer actor.
 * Shows how to publish data to Redpanda streaming topics.
 */

import { createRedpandaMarketDataWriter } from "../../../lib/src/targets/redpanda";
import type { CryptoPriceData, CryptoOHLCVData, CryptoMarketAnalytics } from "../../../lib/src/abstract/dsl";

console.log("🔴 Redpanda Target Demo");
console.log("=" * 50);

async function demonstrateRedpandaTarget() {
  console.log("\n📊 Creating Redpanda Market Data Writer...");
  
  const redpandaWriter = createRedpandaMarketDataWriter({
    name: "demo-redpanda-writer",
    brokers: ["localhost:9092"],
    clientId: "demo-crypto-writer",
    topics: {
      prices: "crypto-prices",
      ohlcv: "crypto-ohlcv",
      analytics: "crypto-analytics",
      level1: "crypto-level1"
    },
    compression: "gzip",
    batchSize: 10,
    flushInterval: 1000,
    debug: true
  });

  try {
    console.log("\n🚀 Initializing Redpanda writer...");
    const initResult = await redpandaWriter.initialize();
    
    if (initResult.success) {
      console.log("✅ Redpanda writer initialized successfully");
    } else {
      console.log("❌ Initialization failed:", initResult.error);
      console.log("💡 Make sure Redpanda is running: docker-compose up redpanda");
      return;
    }

    console.log("\n📤 Testing DSL Publishing Functions:");

    // Test 1: Publish single price
    console.log("\n1️⃣ Publishing single Bitcoin price...");
    
    const bitcoinPrice: CryptoPriceData = {
      coinId: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      usdPrice: 67500.45,
      btcPrice: 1.0,
      ethPrice: 19.2,
      marketCap: 1.33e12,
      volume24h: 28.5e9,
      change24h: 2.34,
      change7d: 8.67,
      lastUpdated: new Date(),
      source: "demo-generator",
      attribution: "Demo data for testing Redpanda target"
    };

    const publishResult = await redpandaWriter.publishPrice(bitcoinPrice);
    
    if (publishResult.success) {
      console.log(`   ✅ Price published successfully:`);
      console.log(`     📨 Message ID: ${publishResult.data.messageId}`);
      console.log(`     📂 Topic: ${publishResult.data.topic}`);
      console.log(`     📊 Size: ${publishResult.data.size} bytes`);
      console.log(`     ⏰ Timestamp: ${publishResult.data.timestamp.toISOString()}`);
    } else {
      console.log(`   ❌ Price publish failed: ${publishResult.error.message}`);
    }

    // Test 2: Publish multiple prices (batch)
    console.log("\n2️⃣ Publishing multiple cryptocurrency prices...");
    
    const cryptoPrices: CryptoPriceData[] = [
      {
        coinId: "ethereum",
        symbol: "ETH", 
        name: "Ethereum",
        usdPrice: 3520.12,
        btcPrice: 0.052,
        marketCap: 423e9,
        volume24h: 15.2e9,
        change24h: 1.89,
        change7d: 5.43,
        lastUpdated: new Date(),
        source: "demo-generator",
        attribution: "Demo data for testing Redpanda target"
      },
      {
        coinId: "cardano",
        symbol: "ADA",
        name: "Cardano", 
        usdPrice: 0.65,
        btcPrice: 0.0000096,
        marketCap: 23e9,
        volume24h: 890e6,
        change24h: -0.45,
        change7d: 3.21,
        lastUpdated: new Date(),
        source: "demo-generator",
        attribution: "Demo data for testing Redpanda target"
      },
      {
        coinId: "polkadot",
        symbol: "DOT",
        name: "Polkadot",
        usdPrice: 8.45,
        btcPrice: 0.000125,
        marketCap: 12e9,
        volume24h: 456e6,
        change24h: 0.89,
        change7d: -1.23,
        lastUpdated: new Date(),
        source: "demo-generator",
        attribution: "Demo data for testing Redpanda target"
      }
    ];

    const batchResult = await redpandaWriter.publishPrices(cryptoPrices);
    
    if (batchResult.success) {
      console.log(`   ✅ Batch published successfully:`);
      console.log(`     📨 Total Messages: ${batchResult.data.totalMessages}`);
      console.log(`     ✅ Success Count: ${batchResult.data.successCount}`);
      console.log(`     ❌ Failure Count: ${batchResult.data.failureCount}`);
      console.log(`     🆔 Batch ID: ${batchResult.data.batchId}`);
      console.log(`     ⏱️ Processing Time: ${batchResult.data.processingTime}ms`);
    } else {
      console.log(`   ❌ Batch publish failed: ${batchResult.error.message}`);
    }

    // Test 3: Publish OHLCV data
    console.log("\n3️⃣ Publishing Bitcoin OHLCV data...");
    
    const bitcoinOHLCV: CryptoOHLCVData = {
      coinId: "bitcoin",
      symbol: "BTC",
      timestamp: new Date(),
      open: 67200.0,
      high: 67800.0,
      low: 66500.0,
      close: 67500.45,
      volume: 890.5,
      timeframe: "1h",
      source: "demo-generator",
      attribution: "Demo OHLCV data for testing"
    };

    const ohlcvResult = await redpandaWriter.publishOHLCV(bitcoinOHLCV);
    
    if (ohlcvResult.success) {
      console.log(`   ✅ OHLCV published successfully:`);
      console.log(`     📨 Message ID: ${ohlcvResult.data.messageId}`);
      console.log(`     📂 Topic: ${ohlcvResult.data.topic}`);
      console.log(`     📊 Timeframe: ${bitcoinOHLCV.timeframe}`);
      console.log(`     🔒 Close Price: $${bitcoinOHLCV.close}`);
    } else {
      console.log(`   ❌ OHLCV publish failed: ${ohlcvResult.error.message}`);
    }

    // Test 4: Publish market analytics
    console.log("\n4️⃣ Publishing market analytics...");
    
    const marketAnalytics: CryptoMarketAnalytics = {
      timestamp: new Date(),
      totalMarketCap: 2.45e12,
      totalVolume: 89.5e9,
      btcDominance: 54.2,
      ethDominance: 17.3,
      activeCryptocurrencies: 2835,
      markets: 8921,
      marketCapChange24h: 1.89,
      source: "demo-generator",
      attribution: "Demo analytics data for testing"
    };

    const analyticsResult = await redpandaWriter.publishAnalytics(marketAnalytics);
    
    if (analyticsResult.success) {
      console.log(`   ✅ Analytics published successfully:`);
      console.log(`     📨 Message ID: ${analyticsResult.data.messageId}`);
      console.log(`     📂 Topic: ${analyticsResult.data.topic}`);
      console.log(`     💰 Total Market Cap: $${(marketAnalytics.totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(`     ₿ BTC Dominance: ${marketAnalytics.btcDominance}%`);
    } else {
      console.log(`   ❌ Analytics publish failed: ${analyticsResult.error.message}`);
    }

    // Test 5: Flush pending messages
    console.log("\n5️⃣ Flushing pending messages...");
    
    const flushResult = await redpandaWriter.flush(5000);
    
    if (flushResult.success) {
      console.log(`   ✅ Messages flushed successfully`);
    } else {
      console.log(`   ❌ Flush failed: ${flushResult.error.message}`);
    }

    // Test 6: Get publishing metrics
    console.log("\n6️⃣ Getting publishing metrics...");
    
    const metricsResult = await redpandaWriter.getPublishingMetrics();
    
    if (metricsResult.success) {
      const metrics = metricsResult.data;
      console.log(`   📊 Publishing Metrics:`);
      console.log(`     📨 Total Messages: ${metrics.totalMessages}`);
      console.log(`     ✅ Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
      console.log(`     ⏱️ Average Latency: ${metrics.averageLatency.toFixed(1)}ms`);
      console.log(`     ❌ Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
    } else {
      console.log(`   ❌ Metrics fetch failed: ${metricsResult.error.message}`);
    }

    // Test 7: Actor status
    console.log("\n7️⃣ Checking actor status...");
    const status = redpandaWriter.getStatus();
    console.log(`   🔧 Actor Status:`);
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 Connected: ${status.isConnected}`);
    console.log(`     📤 Total Publishes: ${status.totalPublishes}`);
    console.log(`     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : 'None'}`);
    console.log(`     ❌ Error Count: ${status.errorCount}`);
    console.log(`     🔴 Brokers: ${status.brokers?.join(', ')}`);
    console.log(`     🆔 Client ID: ${status.clientId}`);

  } catch (error) {
    console.error("💥 Demo failed with error:", error);
    if (error.message?.includes("ECONNREFUSED") || error.message?.includes("broker")) {
      console.log("💡 Connection failed - make sure Redpanda is running:");
      console.log("   docker-compose up redpanda");
    }
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await redpandaWriter.cleanup();
    
    if (cleanupResult.success) {
      console.log("✅ Cleanup completed successfully");
    } else {
      console.log("❌ Cleanup failed:", cleanupResult.error);
    }
  }

  console.log("\n🎉 Redpanda Target Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with Redpanda publishing");
  console.log("🔧 The actor can publish real-time data to streaming topics");
  console.log("📡 Perfect for building scalable data distribution pipelines");
  console.log("🔍 Check Redpanda console to see the published messages!");
}

demonstrateRedpandaTarget().catch(console.error);