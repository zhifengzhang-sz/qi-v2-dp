#!/usr/bin/env bun

/**
 * CoinGecko Source Demo
 * 
 * Demonstrates the CoinGecko Market Data Reader actor.
 * Shows both Actor (composition) and MCP Actor (inheritance) patterns.
 */

import { createCoinGeckoMarketDataReader } from "../../../lib/src/sources/coingecko";

console.log("🪙 CoinGecko Source Demo");
console.log("=" * 50);

async function demonstrateCoinGeckoSource() {
  console.log("\n📊 Creating CoinGecko Market Data Reader...");
  
  const coinGeckoReader = createCoinGeckoMarketDataReader({
    name: "demo-coingecko-reader",
    debug: true,
    useRemoteServer: true,
    timeout: 30000
  });

  try {
    console.log("\n🚀 Initializing CoinGecko reader...");
    const initResult = await coinGeckoReader.initialize();
    
    if (initResult.success) {
      console.log("✅ CoinGecko reader initialized successfully");
    } else {
      console.log("❌ Initialization failed:", initResult.error);
      return;
    }

    console.log("\n📈 Testing DSL Functions:");

    // Test 1: Get current price
    console.log("\n1️⃣ Getting current Bitcoin price...");
    const priceResult = await coinGeckoReader.getCurrentPrice("bitcoin", "usd");
    
    if (priceResult.success) {
      console.log(`   💰 Bitcoin price: $${priceResult.data.toFixed(2)}`);
    } else {
      console.log(`   ❌ Price fetch failed: ${priceResult.error.message}`);
    }

    // Test 2: Get multiple prices
    console.log("\n2️⃣ Getting multiple cryptocurrency prices...");
    const pricesResult = await coinGeckoReader.getCurrentPrices(
      ["bitcoin", "ethereum", "cardano"],
      { vsCurrency: "usd", includeMarketCap: true }
    );
    
    if (pricesResult.success) {
      console.log(`   📊 Retrieved ${pricesResult.data.length} cryptocurrency prices:`);
      pricesResult.data.forEach((crypto) => {
        console.log(`     💎 ${crypto.name} (${crypto.symbol.toUpperCase()}): $${crypto.usdPrice.toFixed(2)}`);
        if (crypto.marketCap) {
          console.log(`       📈 Market Cap: $${(crypto.marketCap / 1e9).toFixed(2)}B`);
        }
      });
    } else {
      console.log(`   ❌ Prices fetch failed: ${pricesResult.error.message}`);
    }

    // Test 3: Get OHLCV data
    console.log("\n3️⃣ Getting Bitcoin OHLCV data...");
    const ohlcvResult = await coinGeckoReader.getCurrentOHLCV("bitcoin");
    
    if (ohlcvResult.success) {
      const ohlcv = ohlcvResult.data;
      console.log(`   📊 Bitcoin OHLCV:`);
      console.log(`     🔓 Open: $${ohlcv.open.toFixed(2)}`);
      console.log(`     🔺 High: $${ohlcv.high.toFixed(2)}`);
      console.log(`     🔻 Low: $${ohlcv.low.toFixed(2)}`);
      console.log(`     🔒 Close: $${ohlcv.close.toFixed(2)}`);
      console.log(`     📦 Volume: ${ohlcv.volume.toFixed(0)}`);
    } else {
      console.log(`   ❌ OHLCV fetch failed: ${ohlcvResult.error.message}`);
    }

    // Test 4: Get market analytics
    console.log("\n4️⃣ Getting market analytics...");
    const analyticsResult = await coinGeckoReader.getMarketAnalytics();
    
    if (analyticsResult.success) {
      const analytics = analyticsResult.data;
      console.log(`   🌍 Global Market Analytics:`);
      console.log(`     💰 Total Market Cap: $${(analytics.totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(`     📊 Total Volume (24h): $${(analytics.totalVolume / 1e9).toFixed(2)}B`);
      console.log(`     ₿ Bitcoin Dominance: ${analytics.btcDominance.toFixed(1)}%`);
      console.log(`     ⟠ Ethereum Dominance: ${analytics.ethDominance.toFixed(1)}%`);
      console.log(`     🪙 Active Cryptocurrencies: ${analytics.activeCryptocurrencies}`);
    } else {
      console.log(`   ❌ Analytics fetch failed: ${analyticsResult.error.message}`);
    }

    // Test 5: Actor status
    console.log("\n5️⃣ Checking actor status...");
    const status = coinGeckoReader.getStatus();
    console.log(`   🔧 Actor Status:`);
    console.log(`     ✅ Initialized: ${status.isInitialized}`);
    console.log(`     🔗 Connected: ${status.isConnected}`);
    console.log(`     📊 Total Queries: ${status.totalQueries}`);
    console.log(`     🕒 Last Activity: ${status.lastActivity ? status.lastActivity.toISOString() : 'None'}`);
    console.log(`     ❌ Error Count: ${status.errorCount}`);

  } catch (error) {
    console.error("💥 Demo failed with error:", error);
  } finally {
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await coinGeckoReader.cleanup();
    
    if (cleanupResult.success) {
      console.log("✅ Cleanup completed successfully");
    } else {
      console.log("❌ Cleanup failed:", cleanupResult.error);
    }
  }

  console.log("\n🎉 CoinGecko Source Demo completed!");
  console.log("💡 This demonstrates the unified DSL abstraction working with CoinGecko API");
  console.log("🔧 The actor can be used in composition with other actors for complete pipelines");
}

demonstrateCoinGeckoSource().catch(console.error);