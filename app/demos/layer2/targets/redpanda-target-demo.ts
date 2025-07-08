#!/usr/bin/env bun

/**
 * Redpanda Target Demo
 *
 * Demonstrates the Redpanda Market Data Writer actor.
 * Shows how to publish data to Redpanda topics for real-time streaming.
 */

import { getData, getError, isFailure, isSuccess } from "@qi/core/base";
import { createRedpandaMarketDataWriter } from "@qi/dp/actor/target/redpanda";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
} from "@qi/dp/base/abstract/dsl";

console.log("🔄 Redpanda Target Demo");
console.log("=".repeat(50));

async function demonstrateRedpandaTarget() {
  console.log("\n📊 Creating Redpanda Market Data Writer...");

  const redpandaWriter = createRedpandaMarketDataWriter({
    name: "demo-redpanda-writer",
    brokers: ["localhost:19092"],
    clientId: "demo-market-writer",
    topics: {
      prices: "crypto-prices",
      ohlcv: "crypto-ohlcv",
      analytics: "market-analytics",
      level1: "level1-data",
    },
    compression: "snappy",
    batchSize: 100,
    flushInterval: 5000,
    retries: 3,
    timeout: 30000,
    debug: true,
  });

  try {
    console.log("\n🚀 Initializing Redpanda writer...");
    const initResult = await redpandaWriter.initialize();

    if (isSuccess(initResult)) {
      console.log("✅ Redpanda writer initialized successfully");
    } else {
      const error = getError(initResult);
      console.log("❌ Initialization failed:", error?.message || "Unknown error");
      console.log("💡 Make sure Redpanda is running: docker-compose up redpanda");
      return;
    }

    console.log("\n💾 Testing DSL Publishing Functions:");

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
      attribution: "Demo data for testing Redpanda streaming",
    };

    const publishResult = await redpandaWriter.publishPrice(bitcoinPrice);

    if (isSuccess(publishResult)) {
      const publishData = getData(publishResult);
      if (publishData) {
        console.log(`   ✅ Price published successfully:`);
        console.log(`     📨 Message ID: ${publishData.messageId}`);
        console.log(`     🔄 Topic: ${publishData.topic}`);
        console.log(`     📊 Size: ${publishData.size} bytes`);
        console.log(`     ⏰ Timestamp: ${publishData.timestamp.toISOString()}`);
        console.log(`     🎯 Partition: ${publishData.partition || "auto-assigned"}`);
        console.log(`     📍 Offset: ${publishData.offset || "pending"}`);
      }
    } else {
      const error = getError(publishResult);
      console.log(`   ❌ Price publishing failed: ${error?.message || "Unknown error"}`);
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
        attribution: "Demo data for testing Redpanda streaming",
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
        attribution: "Demo data for testing Redpanda streaming",
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
        attribution: "Demo data for testing Redpanda streaming",
      },
    ];

    const batchResult = await redpandaWriter.publishPrices(cryptoPrices);

    if (isSuccess(batchResult)) {
      const batchData = getData(batchResult);
      if (batchData) {
        console.log(`   ✅ Batch published successfully:`);
        console.log(`     📨 Total Messages: ${batchData.totalMessages}`);
        console.log(`     ✅ Success Count: ${batchData.successCount}`);
        console.log(`     ❌ Failure Count: ${batchData.failureCount}`);
        console.log(`     🆔 Batch ID: ${batchData.batchId}`);
        console.log(`     ⏱️ Processing Time: ${batchData.processingTime}ms`);
      }
    } else {
      const error = getError(batchResult);
      console.log(`   ❌ Batch publishing failed: ${error?.message || "Unknown error"}`);
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
      attribution: "Demo OHLCV data for testing",
    };

    const ohlcvResult = await redpandaWriter.publishOHLCV(bitcoinOHLCV);

    if (isSuccess(ohlcvResult)) {
      const ohlcvData = getData(ohlcvResult);
      if (ohlcvData) {
        console.log(`   ✅ OHLCV published successfully:`);
        console.log(`     📨 Message ID: ${ohlcvData.messageId}`);
        console.log(`     🔄 Topic: ${ohlcvData.topic}`);
        console.log(`     📊 Timeframe: ${bitcoinOHLCV.timeframe}`);
        console.log(`     🔒 Close Price: $${bitcoinOHLCV.close}`);
        console.log(`     📦 Volume: ${bitcoinOHLCV.volume}`);
      }
    } else {
      const error = getError(ohlcvResult);
      console.log(`   ❌ OHLCV publishing failed: ${error?.message || "Unknown error"}`);
    }

    // Test 4: Publish multiple OHLCV data (batch)
    console.log("\n4️⃣ Publishing multiple OHLCV records...");

    const ohlcvBatch: CryptoOHLCVData[] = Array.from({ length: 5 }, (_, i) => ({
      coinId: "bitcoin",
      symbol: "BTC",
      timestamp: new Date(Date.now() - (4 - i) * 3600000), // Hourly data
      open: 67000 + Math.random() * 1000,
      high: 67200 + Math.random() * 1000,
      low: 66800 + Math.random() * 800,
      close: 67100 + Math.random() * 900,
      volume: 800 + Math.random() * 200,
      timeframe: "1h",
      source: "demo-generator",
      attribution: "Demo historical OHLCV data",
    }));

    const ohlcvBatchResult = await redpandaWriter.publishOHLCVBatch(ohlcvBatch);

    if (isSuccess(ohlcvBatchResult)) {
      const ohlcvBatchData = getData(ohlcvBatchResult);
      if (ohlcvBatchData) {
        console.log(`   ✅ OHLCV batch published successfully:`);
        console.log(`     📨 Total Records: ${ohlcvBatchData.totalMessages}`);
        console.log(`     ✅ Success Count: ${ohlcvBatchData.successCount}`);
        console.log(`     🕒 Time Range: 5 hours of hourly data`);
        console.log(`     🔄 Streaming to: crypto-ohlcv topic`);
      }
    } else {
      const error = getError(ohlcvBatchResult);
      console.log(`   ❌ OHLCV batch publishing failed: ${error?.message || "Unknown error"}`);
    }

    // Test 5: Publish market analytics
    console.log("\n5️⃣ Publishing market analytics...");

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
      attribution: "Demo analytics data for testing",
    };

    const analyticsResult = await redpandaWriter.publishAnalytics(marketAnalytics);

    if (isSuccess(analyticsResult)) {
      const analyticsData = getData(analyticsResult);
      if (analyticsData) {
        console.log(`   ✅ Analytics published successfully:`);
        console.log(`     📨 Message ID: ${analyticsData.messageId}`);
        console.log(`     🔄 Topic: ${analyticsData.topic}`);
        console.log(
          `     💰 Total Market Cap: $${(marketAnalytics.totalMarketCap / 1e12).toFixed(2)}T`,
        );
        console.log(`     ₿ BTC Dominance: ${marketAnalytics.btcDominance}%`);
        console.log(`     🔄 Now streaming to consumers in real-time`);
      }
    } else {
      const error = getError(analyticsResult);
      console.log(`   ❌ Analytics publishing failed: ${error?.message || "Unknown error"}`);
    }

    // Test 6: Publish Level 1 data
    console.log("\n6️⃣ Publishing Level 1 market data...");

    const level1Data: Level1Data = {
      ticker: "BTC/USD",
      exchange: "demo-exchange",
      timestamp: new Date(),
      bestBid: 67450.0,
      bestAsk: 67500.0,
      spread: 50.0,
      spreadPercent: 0.074,
      market: "spot",
      source: "demo-generator",
      attribution: "Demo Level 1 data for testing",
    };

    const level1Result = await redpandaWriter.publishLevel1(level1Data);

    if (isSuccess(level1Result)) {
      const level1PublishData = getData(level1Result);
      if (level1PublishData) {
        console.log(`   ✅ Level 1 data published successfully:`);
        console.log(`     📨 Message ID: ${level1PublishData.messageId}`);
        console.log(`     🔄 Topic: ${level1PublishData.topic}`);
        console.log(`     📊 Ticker: ${level1Data.ticker}`);
        console.log(`     🔵 Best Bid: $${level1Data.bestBid}`);
        console.log(`     🔴 Best Ask: $${level1Data.bestAsk}`);
        console.log(`     📋 Spread: $${level1Data.spread} (${level1Data.spreadPercent}%)`);
        console.log(`     📊 Spread: $${(level1Data.bestAsk - level1Data.bestBid).toFixed(2)}`);
      }
    } else {
      const error = getError(level1Result);
      console.log(`   ❌ Level 1 publishing failed: ${error?.message || "Unknown error"}`);
    }

    // Test 7: Get publishing metrics
    console.log("\n7️⃣ Getting publishing metrics...");

    const metricsResult = await redpandaWriter.getPublishingMetrics();

    if (isSuccess(metricsResult)) {
      const metrics = getData(metricsResult);
      if (metrics) {
        console.log(`   📊 Publishing Metrics:`);
        console.log(`     📨 Total Messages: ${metrics.totalMessages}`);
        console.log(`     ✅ Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        console.log(`     ⏱️ Average Latency: ${metrics.averageLatency.toFixed(1)}ms`);
        console.log(`     ❌ Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
        // Note: throughput not available in base metrics interface
      }
    } else {
      const error = getError(metricsResult);
      console.log(`   ❌ Metrics fetch failed: ${error?.message || "Unknown error"}`);
    }

    // Test 8: Actor status
    console.log("\n8️⃣ Checking actor status...");
    const status = redpandaWriter.getStatus();
    console.log(`   🔧 Actor Status:`);
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 Connected: ${status.isConnected}`);
    console.log(`     🔄 Redpanda Client: ${status.hasRedpandaClient ? "Ready" : "Not Ready"}`);
    console.log(`     📤 Total Publishes: ${status.totalPublishes}`);
    console.log(
      `     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : "None"}`,
    );
    console.log(`     ❌ Error Count: ${status.errorCount}`);
    console.log(`     ⚡ Throughput: ${status.throughput.toFixed(2)} msg/sec`);
    console.log(`     🏢 Brokers: ${status.brokers.join(", ")}`);

    // Test 9: Redpanda-specific advantages
    console.log("\n9️⃣ Demonstrating Redpanda streaming advantages...");
    console.log(`   💡 Redpanda Features:`);
    console.log(`     🚀 Zero-copy architecture for ultra-low latency`);
    console.log(`     📊 Real-time message streaming with sub-millisecond latency`);
    console.log(`     🗜️ Built-in compression (snappy)`);
    console.log(`     📦 Efficient batching (100 messages)`);
    console.log(`     🔄 Automatic topic creation and management`);
    console.log(`     🛡️ Fault-tolerant with replication`);
    console.log(`     🎯 Perfect for real-time trading systems`);
    console.log(`     ⚡ High-throughput with back-pressure handling`);

    // Test 10: Topic configuration
    console.log("\n🔟 Topic configuration...");
    console.log(`   📊 Topic Configuration:`);
    console.log(`     💰 Prices Topic: ${status.topics?.prices}`);
    console.log(`     📈 OHLCV Topic: ${status.topics?.ohlcv}`);
    console.log(`     🌍 Analytics Topic: ${status.topics?.analytics}`);
    console.log(`     📊 Level 1 Topic: ${status.topics?.level1}`);
    console.log(`     🔗 Connected Brokers: ${status.brokers.join(", ")}`);

  } catch (error) {
    console.error("💥 Demo failed with error:", error);
    const errorMessage = (error as Error)?.message;
    if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("connect")) {
      console.log("💡 Connection failed - make sure Redpanda is running:");
      console.log("   docker-compose up redpanda");
    } else if (errorMessage?.includes("timeout")) {
      console.log("💡 Timeout - check Redpanda cluster health:");
      console.log("   docker-compose ps redpanda");
    }
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await redpandaWriter.cleanup();

    if (isSuccess(cleanupResult)) {
      console.log("✅ Cleanup completed successfully");
    } else {
      const error = getError(cleanupResult);
      console.log("❌ Cleanup failed:", error?.message || "Unknown error");
    }
  }

  console.log("\n🎉 Redpanda Target Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with Redpanda streaming");
  console.log("🔧 The actor can publish real-time market data to Redpanda topics");
  console.log("⚡ Perfect for building low-latency trading systems and real-time analytics");
  console.log("🔄 Run the Redpanda source demo to consume the data you just published");
  console.log("🔍 Check Redpanda topics to see the streaming data in real-time!");
}

demonstrateRedpandaTarget().catch(console.error);