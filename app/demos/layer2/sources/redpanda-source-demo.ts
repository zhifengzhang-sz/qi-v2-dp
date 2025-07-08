#!/usr/bin/env bun

/**
 * Redpanda Source Demo
 *
 * Demonstrates the Redpanda Market Data Reader actor.
 * Shows the unified DSL architecture with streaming data consumption.
 */

import { getData, getError, isFailure, isSuccess } from "@qi/core/base";
import { createRedpandaMarketDataReader } from "@qi/dp/actor/source/redpanda";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
  Level1Data,
} from "@qi/dp/base/abstract/dsl";

console.log("🔄 Redpanda Source Demo");
console.log("=".repeat(50));

async function demonstrateRedpandaSource() {
  console.log("\n📊 Creating Redpanda Market Data Reader...");

  const redpandaReader = createRedpandaMarketDataReader({
    name: "demo-redpanda-reader",
    brokers: ["localhost:19092"],
    groupId: "demo-crypto-reader",
    topics: {
      prices: "crypto-prices",
      ohlcv: "crypto-ohlcv",
      analytics: "market-analytics",
      level1: "level1-data",
    },
    autoCommit: true,
    sessionTimeout: 30000,
    debug: true,
  });

  try {
    console.log("\n🚀 Initializing Redpanda reader...");
    const initResult = await redpandaReader.initialize();

    if (isSuccess(initResult)) {
      console.log("✅ Redpanda reader initialized successfully");
    } else {
      const error = getError(initResult);
      console.log("❌ Initialization failed:", error?.message || "Unknown error");
      console.log("💡 Make sure Redpanda is running: docker-compose up redpanda");
      return;
    }

    console.log("\n📈 Testing DSL Functions:");

    // Test 1: Get current price from streaming data
    console.log("\n1️⃣ Getting current Bitcoin price from stream...");
    const priceResult = await redpandaReader.getCurrentPrice("bitcoin", "usd");

    if (isSuccess(priceResult)) {
      const price = getData(priceResult) as number;
      console.log(`   💰 Bitcoin price: $${price.toFixed(2)}`);
    } else {
      const error = getError(priceResult);
      console.log(`   ❌ Price fetch failed: ${error?.message || "Unknown error"}`);
      console.log(`   💡 Make sure there's data in the crypto-prices topic`);
    }

    // Test 2: Get multiple prices from streaming data
    console.log("\n2️⃣ Getting multiple cryptocurrency prices from stream...");
    const pricesResult = await redpandaReader.getCurrentPrices(
      ["bitcoin", "ethereum", "cardano"],
      { vsCurrencies: ["usd"], includeMarketData: true },
    );

    if (isSuccess(pricesResult)) {
      const cryptoPrices = getData(pricesResult) as CryptoPriceData[];
      console.log(`   📊 Retrieved ${cryptoPrices.length} cryptocurrency prices:`);
      cryptoPrices.forEach((crypto) => {
        console.log(
          `     💎 ${crypto.name} (${crypto.symbol.toUpperCase()}): $${crypto.usdPrice.toFixed(2)}`,
        );
        if (crypto.marketCap) {
          console.log(`       📈 Market Cap: $${(crypto.marketCap / 1e9).toFixed(2)}B`);
        }
      });
    } else {
      const error = getError(pricesResult);
      console.log(`   ❌ Prices fetch failed: ${error?.message || "Unknown error"}`);
      console.log(`   💡 Make sure there's data in the crypto-prices topic`);
    }

    // Test 3: Get OHLCV data from streaming data
    console.log("\n3️⃣ Getting Bitcoin OHLCV data from stream...");
    const ohlcvResult = await redpandaReader.getCurrentOHLCV("bitcoin");

    if (isSuccess(ohlcvResult)) {
      const ohlcv = getData(ohlcvResult) as CryptoOHLCVData;
      console.log(`   📊 Bitcoin OHLCV:`);
      console.log(`     🔓 Open: $${ohlcv.open.toFixed(2)}`);
      console.log(`     🔺 High: $${ohlcv.high.toFixed(2)}`);
      console.log(`     🔻 Low: $${ohlcv.low.toFixed(2)}`);
      console.log(`     🔒 Close: $${ohlcv.close.toFixed(2)}`);
      console.log(`     📦 Volume: ${ohlcv.volume.toFixed(0)}`);
      console.log(`     ⏰ Timeframe: ${ohlcv.timeframe}`);
    } else {
      const error = getError(ohlcvResult);
      console.log(`   ❌ OHLCV fetch failed: ${error?.message || "Unknown error"}`);
      console.log(`   💡 Make sure there's data in the crypto-ohlcv topic`);
    }

    // Test 4: Get market analytics from streaming data
    console.log("\n4️⃣ Getting market analytics from stream...");
    const analyticsResult = await redpandaReader.getMarketAnalytics();

    if (isSuccess(analyticsResult)) {
      const analytics = getData(analyticsResult) as CryptoMarketAnalytics;
      console.log(`   🌍 Global Market Analytics:`);
      console.log(`     💰 Total Market Cap: $${(analytics.totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(`     📊 Total Volume (24h): $${(analytics.totalVolume / 1e9).toFixed(2)}B`);
      console.log(`     ₿ Bitcoin Dominance: ${analytics.btcDominance?.toFixed(1) || "N/A"}%`);
      console.log(`     ⟠ Ethereum Dominance: ${analytics.ethDominance?.toFixed(1) || "N/A"}%`);
      console.log(`     🪙 Active Cryptocurrencies: ${analytics.activeCryptocurrencies}`);
    } else {
      const error = getError(analyticsResult);
      console.log(`   ❌ Analytics fetch failed: ${error?.message || "Unknown error"}`);
      console.log(`   💡 Make sure there's data in the market-analytics topic`);
    }

    // Test 5: Get Level 1 data from streaming data
    console.log("\n5️⃣ Getting Level 1 data from stream...");
    const level1Result = await redpandaReader.getLevel1Data({
      ticker: "BTC/USD",
      market: "spot",
    });

    if (isSuccess(level1Result)) {
      const level1Data = getData(level1Result);
      if (level1Data) {
        console.log(`   📊 Level 1 Data:`);
        console.log(`     📈 ${level1Data.ticker}:`);
        console.log(`       🔵 Best Bid: $${level1Data.bestBid}`);
        console.log(`       🔴 Best Ask: $${level1Data.bestAsk}`);
        console.log(`       📊 Spread: $${level1Data.spread.toFixed(2)} (${level1Data.spreadPercent.toFixed(2)}%)`);
      } else {
        console.log(`   ℹ️ No Level 1 data available`);
      }
    } else {
      const error = getError(level1Result);
      console.log(`   ❌ Level 1 data fetch failed: ${error?.message || "Unknown error"}`);
      console.log(`   💡 Make sure there's data in the level1-data topic`);
    }

    // Test 6: Actor status and streaming metrics
    console.log("\n6️⃣ Checking actor status and streaming metrics...");
    const status = redpandaReader.getStatus();
    console.log(`   🔧 Actor Status:`);
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 Connected: ${status.isConnected}`);
    console.log(`     🔄 Redpanda Client: ${status.hasRedpandaClient ? "Ready" : "Not Ready"}`);
    console.log(`     📊 Total Queries: ${status.totalQueries}`);
    console.log(
      `     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : "None"}`,
    );
    console.log(`     ❌ Error Count: ${status.errorCount}`);
    console.log(`     📥 Buffer Size: ${status.bufferSize} messages`);
    console.log(`     🏢 Brokers: ${status.brokers.join(", ")}`);
    console.log(`     👥 Group ID: ${status.groupId}`);

    // Test 7: Redpanda-specific features
    console.log("\n7️⃣ Demonstrating Redpanda streaming advantages...");
    console.log(`   💡 Redpanda Features:`);
    console.log(`     🚀 Zero-copy architecture for ultra-low latency`);
    console.log(`     🔄 Real-time streaming data consumption`);
    console.log(`     📊 Automatic offset management and consumer groups`);
    console.log(`     🔧 Built-in schema registry support`);
    console.log(`     📈 High-throughput with back-pressure handling`);
    console.log(`     🛡️ Fault-tolerant with automatic rebalancing`);
    console.log(`     🎯 Perfect for real-time trading systems`);

    // Test 8: Topic configuration
    console.log("\n8️⃣ Topic configuration...");
    console.log(`   📊 Topic Configuration:`);
    console.log(`     💰 Prices Topic: ${status.topics?.prices}`);
    console.log(`     📈 OHLCV Topic: ${status.topics?.ohlcv}`);
    console.log(`     🌍 Analytics Topic: ${status.topics?.analytics}`);
    console.log(`     📊 Level 1 Topic: ${status.topics?.level1}`);
    console.log(`     🔗 Connected Brokers: ${status.brokers.join(", ")}`);
    console.log(`     👥 Consumer Group: ${status.groupId}`);

  } catch (error) {
    console.error("💥 Demo failed with error:", error);
    const errorMessage = (error as Error)?.message;
    if (errorMessage?.includes("ECONNREFUSED") || errorMessage?.includes("connect")) {
      console.log("💡 Connection failed - make sure Redpanda is running:");
      console.log("   docker-compose up redpanda");
    } else if (errorMessage?.includes("timeout")) {
      console.log("💡 Timeout - make sure topics have data:");
      console.log("   Run the Redpanda target demo first to populate topics");
    }
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await redpandaReader.cleanup();

    if (isSuccess(cleanupResult)) {
      console.log("✅ Cleanup completed successfully");
    } else {
      const error = getError(cleanupResult);
      console.log("❌ Cleanup failed:", error?.message || "Unknown error");
    }
  }

  console.log("\n🎉 Redpanda Source Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with Redpanda streaming");
  console.log("🔧 The actor can consume real-time market data from Redpanda topics");
  console.log("⚡ Perfect for building low-latency trading systems and real-time analytics");
  console.log("🔄 Run the pipeline demo to see this actor in a complete data flow");
}

demonstrateRedpandaSource().catch(console.error);