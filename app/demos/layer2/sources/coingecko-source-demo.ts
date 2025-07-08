#!/usr/bin/env bun

/**
 * CoinGecko Source Demo
 *
 * Demonstrates the CoinGecko Market Data Reader actor.
 * Shows the unified DSL architecture with direct MCP integration.
 */

import { getData, getError, isFailure, isSuccess } from "@qi/core/base";
import { createCoinGeckoMarketDataReader } from "@qi/dp/actors/sources/coingecko";
import type { CryptoMarketAnalytics, CryptoOHLCVData, CryptoPriceData } from "@qi/dp/dsl";

console.log("🪙 CoinGecko Source Demo");
console.log("=".repeat(50));

async function demonstrateCoinGeckoSource() {
  console.log("\n📊 Creating CoinGecko Market Data Reader...");

  const coinGeckoReader = createCoinGeckoMarketDataReader({
    name: "demo-coingecko-reader",
    debug: true,
    useRemoteServer: true,
    timeout: 30000,
  });

  try {
    console.log("\n🚀 Initializing CoinGecko reader...");
    const initResult = await coinGeckoReader.initialize();

    if (isSuccess(initResult)) {
      console.log("✅ CoinGecko reader initialized successfully");
    } else {
      console.log("❌ Initialization failed:", getError(initResult));
      return;
    }

    console.log("\n📈 Testing DSL Functions:");

    // Test 1: Get current price
    console.log("\n1️⃣ Getting current Bitcoin price...");
    const priceResult = await coinGeckoReader.getCurrentPrice("bitcoin", "usd");

    if (isSuccess(priceResult)) {
      const price = getData(priceResult) as number;
      console.log(`   💰 Bitcoin price: $${price.toFixed(2)}`);
    } else {
      const error = getError(priceResult);
      console.log(`   ❌ Price fetch failed: ${error?.message || "Unknown error"}`);
    }

    // Test 2: Get multiple prices
    console.log("\n2️⃣ Getting multiple cryptocurrency prices...");
    const pricesResult = await coinGeckoReader.getCurrentPrices(
      ["bitcoin", "ethereum", "cardano"],
      { vsCurrencies: ["usd"], includeMarketData: true },
    );

    if (isSuccess(pricesResult)) {
      const cryptoPrices = getData(pricesResult) as CryptoPriceData[];
      console.log(`   📊 Retrieved ${cryptoPrices.length} cryptocurrency prices:`);
      for (const crypto of cryptoPrices) {
        console.log(
          `     💎 ${crypto.name} (${crypto.symbol.toUpperCase()}): $${crypto.usdPrice.toFixed(2)}`,
        );
        if (crypto.marketCap) {
          console.log(`       📈 Market Cap: $${(crypto.marketCap / 1e9).toFixed(2)}B`);
        }
      }
    } else {
      const error = getError(pricesResult);
      console.log(`   ❌ Prices fetch failed: ${error?.message || "Unknown error"}`);
    }

    // Test 3: Get OHLCV data
    console.log("\n3️⃣ Getting Bitcoin OHLCV data...");
    const ohlcvResult = await coinGeckoReader.getCurrentOHLCV("bitcoin");

    if (isSuccess(ohlcvResult)) {
      const ohlcv = getData(ohlcvResult) as CryptoOHLCVData;
      console.log("   📊 Bitcoin OHLCV:");
      console.log(`     🔓 Open: $${ohlcv.open.toFixed(2)}`);
      console.log(`     🔺 High: $${ohlcv.high.toFixed(2)}`);
      console.log(`     🔻 Low: $${ohlcv.low.toFixed(2)}`);
      console.log(`     🔒 Close: $${ohlcv.close.toFixed(2)}`);
      console.log(`     📦 Volume: ${ohlcv.volume.toFixed(0)}`);
    } else {
      const error = getError(ohlcvResult);
      console.log(`   ❌ OHLCV fetch failed: ${error?.message || "Unknown error"}`);
    }

    // Test 4: Get market analytics
    console.log("\n4️⃣ Getting market analytics...");
    const analyticsResult = await coinGeckoReader.getMarketAnalytics();

    if (isSuccess(analyticsResult)) {
      const analytics = getData(analyticsResult) as CryptoMarketAnalytics;
      console.log("   🌍 Global Market Analytics:");
      console.log(`     💰 Total Market Cap: $${(analytics.totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(`     📊 Total Volume (24h): $${(analytics.totalVolume / 1e9).toFixed(2)}B`);
      console.log(`     ₿ Bitcoin Dominance: ${analytics.btcDominance?.toFixed(1) || "N/A"}%`);
      console.log(`     ⟠ Ethereum Dominance: ${analytics.ethDominance?.toFixed(1) || "N/A"}%`);
      console.log(`     🪙 Active Cryptocurrencies: ${analytics.activeCryptocurrencies}`);
    } else {
      const error = getError(analyticsResult);
      console.log(`   ❌ Analytics fetch failed: ${error?.message || "Unknown error"}`);
    }

    // Test 5: Actor status
    console.log("\n5️⃣ Checking actor status...");
    const status = coinGeckoReader.getStatus();
    console.log("   🔧 Actor Status:");
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 MCP Client: ${status.mcpClientInitialized ? "Ready" : "Not Ready"}`);
    console.log(`     📊 Total Queries: ${status.totalQueries}`);
    console.log(
      `     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : "None"}`,
    );
    console.log(`     ❌ Error Count: ${status.errorCount}`);
  } catch (error) {
    console.error("💥 Demo failed with error:", error);
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await coinGeckoReader.cleanup();

    if (isSuccess(cleanupResult)) {
      console.log("✅ Cleanup completed successfully");
    } else {
      const error = getError(cleanupResult);
      console.log("❌ Cleanup failed:", error);
    }
  }

  console.log("\n🎉 CoinGecko Source Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with CoinGecko API");
  console.log("🔧 The actor can be used in composition with other actors for complete pipelines");
}

demonstrateCoinGeckoSource().catch(console.error);
