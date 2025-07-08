#!/usr/bin/env bun

/**
 * TimescaleDB Target Demo
 *
 * Demonstrates the TimescaleDB Market Data Writer actor.
 * Shows how to store data in TimescaleDB time-series database.
 */

import { getData, getError, isFailure, isSuccess } from "@qi/core/base";
import { createTimescaleMarketDataWriter } from "@qi/dp/actors/targets/timescale";
import type { CryptoMarketAnalytics, CryptoOHLCVData, CryptoPriceData } from "@qi/dp/dsl";

console.log("🗄️ TimescaleDB Target Demo");
console.log("=".repeat(50));

async function demonstrateTimescaleTarget() {
  console.log("\n📊 Creating TimescaleDB Market Data Writer...");

  const timescaleWriter = createTimescaleMarketDataWriter({
    name: "demo-timescale-writer",
    connectionString:
      process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/cryptodb",
    poolConfig: {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    batchSize: 50,
    flushInterval: 2000,
    debug: true,
  });

  try {
    console.log("\n🚀 Initializing TimescaleDB writer...");
    const initResult = await timescaleWriter.initialize();

    if (isSuccess(initResult)) {
      console.log("✅ TimescaleDB writer initialized successfully");
    } else {
      const error = getError(initResult);
      console.log("❌ Initialization failed:", error?.message || "Unknown error");
      console.log("💡 Make sure TimescaleDB is running: docker-compose up timescaledb");
      return;
    }

    console.log("\n💾 Testing DSL Storage Functions:");

    // Test 1: Store single price
    console.log("\n1️⃣ Storing single Bitcoin price...");

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
      attribution: "Demo data for testing TimescaleDB target",
      exchangeId: "demo-exchange", // Added required field
    };

    const publishResult = await timescaleWriter.publishPrice(bitcoinPrice);

    if (isSuccess(publishResult)) {
      const publishData = getData(publishResult);
      if (publishData) {
        console.log("   ✅ Price stored successfully:");
        console.log(`     📨 Message ID: ${publishData.messageId}`);
        console.log(`     🗄️ Table: ${publishData.topic}`);
        console.log(`     📊 Size: ${publishData.size} row(s)`);
        console.log(`     ⏰ Timestamp: ${publishData.timestamp.toISOString()}`);
      }
    } else {
      const error = getError(publishResult);
      console.log(`   ❌ Price storage failed: ${error?.message || "Unknown error"}`);
    }

    // Test 2: Store multiple prices (batch)
    console.log("\n2️⃣ Storing multiple cryptocurrency prices...");

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
        attribution: "Demo data for testing TimescaleDB target",
        exchangeId: "demo-exchange", // Added required field
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
        attribution: "Demo data for testing TimescaleDB target",
        exchangeId: "demo-exchange", // Added required field
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
        attribution: "Demo data for testing TimescaleDB target",
        exchangeId: "demo-exchange", // Added required field
      },
    ];

    const batchResult = await timescaleWriter.publishPrices(cryptoPrices);

    if (isSuccess(batchResult)) {
      const batchData = getData(batchResult);
      if (batchData) {
        console.log("   ✅ Batch stored successfully:");
        console.log(`     📨 Total Messages: ${batchData.totalMessages}`);
        console.log(`     ✅ Success Count: ${batchData.successCount}`);
        console.log(`     ❌ Failure Count: ${batchData.failureCount}`);
        console.log(`     🆔 Batch ID: ${batchData.batchId}`);
        console.log(`     ⏱️ Processing Time: ${batchData.processingTime}ms`);
      }
    } else {
      const error = getError(batchResult);
      console.log(`   ❌ Batch storage failed: ${error?.message || "Unknown error"}`);
    }

    // Test 3: Store OHLCV data
    console.log("\n3️⃣ Storing Bitcoin OHLCV data...");

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
      exchangeId: "demo-exchange", // Added required field
    };

    const ohlcvResult = await timescaleWriter.publishOHLCV(bitcoinOHLCV);

    if (isSuccess(ohlcvResult)) {
      const ohlcvData = getData(ohlcvResult);
      if (ohlcvData) {
        console.log("   ✅ OHLCV stored successfully:");
        console.log(`     📨 Message ID: ${ohlcvData.messageId}`);
        console.log(`     🗄️ Table: ${ohlcvData.topic}`);
        console.log(`     📊 Timeframe: ${bitcoinOHLCV.timeframe}`);
        console.log(`     🔒 Close Price: $${bitcoinOHLCV.close}`);
      }
    } else {
      const error = getError(ohlcvResult);
      console.log(`   ❌ OHLCV storage failed: ${error?.message || "Unknown error"}`);
    }

    // Test 4: Store multiple OHLCV data (batch)
    console.log("\n4️⃣ Storing multiple OHLCV records...");

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
      exchangeId: "demo-exchange", // Added required field
    }));

    const ohlcvBatchResult = await timescaleWriter.publishOHLCVBatch(ohlcvBatch);

    if (isSuccess(ohlcvBatchResult)) {
      const ohlcvBatchData = getData(ohlcvBatchResult);
      if (ohlcvBatchData) {
        console.log("   ✅ OHLCV batch stored successfully:");
        console.log(`     📨 Total Records: ${ohlcvBatchData.totalMessages}`);
        console.log(`     ✅ Success Count: ${ohlcvBatchData.successCount}`);
        console.log("     🕒 Time Range: 5 hours of hourly data");
      }
    } else {
      const error = getError(ohlcvBatchResult);
      console.log(`   ❌ OHLCV batch storage failed: ${error?.message || "Unknown error"}`);
    }

    // Test 5: Store market analytics
    console.log("\n5️⃣ Storing market analytics...");

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

    const analyticsResult = await timescaleWriter.publishAnalytics(marketAnalytics);

    if (isSuccess(analyticsResult)) {
      const analyticsData = getData(analyticsResult);
      if (analyticsData) {
        console.log("   ✅ Analytics stored successfully:");
        console.log(`     📨 Message ID: ${analyticsData.messageId}`);
        console.log(`     🗄️ Table: ${analyticsData.topic}`);
        console.log(
          `     💰 Total Market Cap: $${(marketAnalytics.totalMarketCap / 1e12).toFixed(2)}T`,
        );
        console.log(`     ₿ BTC Dominance: ${marketAnalytics.btcDominance}%`);
      }
    } else {
      const error = getError(analyticsResult);
      console.log(`   ❌ Analytics storage failed: ${error?.message || "Unknown error"}`);
    }

    // Test 6: Get publishing metrics
    console.log("\n6️⃣ Getting storage metrics...");

    const metricsResult = await timescaleWriter.getPublishingMetrics();

    if (isSuccess(metricsResult)) {
      const metrics = getData(metricsResult);
      if (metrics) {
        console.log("   📊 Storage Metrics:");
        console.log(`     📨 Total Messages: ${metrics.totalMessages}`);
        console.log(`     ✅ Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        console.log(`     ⏱️ Average Latency: ${metrics.averageLatency.toFixed(1)}ms`);
        console.log(`     ❌ Error Rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
      }
    } else {
      const error = getError(metricsResult);
      console.log(`   ❌ Metrics fetch failed: ${error?.message || "Unknown error"}`);
    }

    // Test 7: Actor status
    console.log("\n7️⃣ Checking actor status...");
    const status = timescaleWriter.getStatus();
    console.log("   🔧 Actor Status:");
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 Connected: ${status.isConnected}`);
    console.log(`     💾 Has TimescaleDB Client: ${status.hasDrizzleClient}`);
    console.log(`     📤 Total Publishes: ${status.totalPublishes}`);
    console.log(
      `     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : "None"}`,
    );
    console.log(`     ❌ Error Count: ${status.errorCount}`);
    console.log(`     ⚡ Throughput: ${status.throughput.toFixed(2)} writes/sec`);

    // Test 8: Database-specific features
    console.log("\n8️⃣ Demonstrating TimescaleDB advantages...");
    console.log("   💡 TimescaleDB Features:");
    console.log("     📈 Automatic time-based partitioning (hypertables)");
    console.log("     🗜️ Compression for older data (90% space savings)");
    console.log("     📊 Fast time-series aggregations and analytics");
    console.log("     🔍 SQL queries with time-series specific functions");
    console.log("     📅 Automatic retention policies");
    console.log("     📈 Excellent for technical analysis and backtesting");
  } catch (error) {
    console.error("💥 Demo failed with error:", error);
    const errorMessage = (error as Error)?.message;
    if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("connect")) {
      console.log("💡 Connection failed - make sure TimescaleDB is running:");
      console.log("   docker-compose up timescaledb");
    }
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await timescaleWriter.cleanup();

    if (isSuccess(cleanupResult)) {
      console.log("✅ Cleanup completed successfully");
    } else {
      const error = getError(cleanupResult);
      console.log("❌ Cleanup failed:", error?.message || "Unknown error");
    }
  }

  console.log("\n🎉 TimescaleDB Target Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with TimescaleDB storage");
  console.log("🔧 The actor can store time-series data optimally for analytics");
  console.log("📈 Perfect for building historical data repositories and analytics pipelines");
  console.log("🔍 Check TimescaleDB to see the stored time-series data!");
}

demonstrateTimescaleTarget().catch(console.error);
