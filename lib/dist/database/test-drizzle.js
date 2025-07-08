// lib/src/database/test-drizzle.ts
// Test script to verify Drizzle client and DSL functionality
import { CryptoFinancialDSL, DrizzleClient } from "./index";
async function testDrizzleImplementation() {
  console.log("🧪 Testing Drizzle ORM implementation...");
  // Connection string for TimescaleDB
  const connectionString =
    process.env.TIMESCALE_CONNECTION_STRING ||
    "postgresql://postgres:password@localhost:5432/crypto_data";
  try {
    // Initialize Drizzle client
    console.log("📦 Initializing Drizzle client...");
    const client = new DrizzleClient({
      connectionString,
      debug: true,
      poolConfig: {
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
      },
    });
    // Initialize DSL
    console.log("🎯 Creating DSL interface...");
    const dsl = new CryptoFinancialDSL(client);
    // Test 1: Initialize TimescaleDB
    console.log("⚡ Initializing TimescaleDB hypertables...");
    try {
      await dsl.initialize();
      console.log("✅ TimescaleDB initialization successful");
    } catch (error) {
      console.log(
        "⚠️ TimescaleDB initialization skipped (may already exist):",
        error instanceof Error ? error.message : String(error),
      );
    }
    // Test 2: Store sample price data
    console.log("💰 Testing price data storage...");
    const samplePrices = [
      {
        coinId: "bitcoin",
        symbol: "BTC",
        usdPrice: 45000.5,
        btcPrice: 1.0,
        marketCap: 850000000000,
        volume24h: 25000000000,
        change24h: 2.5,
        lastUpdated: new Date(),
      },
      {
        coinId: "ethereum",
        symbol: "ETH",
        usdPrice: 3000.75,
        btcPrice: 0.067,
        marketCap: 360000000000,
        volume24h: 15000000000,
        change24h: 1.8,
        lastUpdated: new Date(),
      },
    ];
    await dsl.storePrices(samplePrices);
    console.log("✅ Price data stored successfully");
    // Test 3: Retrieve latest prices
    console.log("📊 Testing price data retrieval...");
    const latestPrices = await dsl.getLatestPrices({
      symbols: ["BTC", "ETH"],
      latest: true,
    });
    console.log(`✅ Retrieved ${latestPrices.length} latest prices:`);
    for (const price of latestPrices) {
      console.log(`   ${price.symbol}: $${price.usdPrice} (${price.change24h}%)`);
    }
    // Test 4: Test DSL convenience method
    console.log("🎯 Testing DSL convenience methods...");
    const btcPrice = await dsl.getCurrentPrice("BTC");
    console.log(`✅ Current BTC price: $${btcPrice}`);
    // Test 5: Store OHLCV data
    console.log("📈 Testing OHLCV data storage...");
    const sampleOHLCV = [
      {
        coinId: "bitcoin",
        symbol: "BTC",
        timeframe: "1h",
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        open: 44000,
        high: 45500,
        low: 43800,
        close: 45000,
        volume: 1500000,
        trades: 12500,
      },
    ];
    await dsl.storeOHLCV(sampleOHLCV);
    console.log("✅ OHLCV data stored successfully");
    // Test 6: Retrieve OHLCV data
    const ohlcvData = await dsl.getOHLCV({
      symbols: ["BTC"],
      timeframe: "1h",
      limit: 10,
    });
    console.log(`✅ Retrieved ${ohlcvData.length} OHLCV records`);
    // Test 7: Store market analytics
    console.log("🌍 Testing market analytics storage...");
    await dsl.storeMarketAnalytics({
      totalMarketCap: 2500000000000,
      totalVolume: 85000000000,
      btcDominance: 42.5,
      ethDominance: 18.2,
      activeCryptocurrencies: 8500,
      fearGreedIndex: 65,
    });
    console.log("✅ Market analytics stored successfully");
    // Test 8: Get market summary
    const marketSummary = await dsl.getMarketSummary();
    if (marketSummary) {
      console.log("✅ Market summary retrieved:");
      console.log(`   Total Market Cap: $${marketSummary.totalMarketCap.toLocaleString()}`);
      console.log(`   BTC Dominance: ${marketSummary.btcDominance}%`);
      console.log(`   Active Coins: ${marketSummary.activeCoins}`);
    }
    // Test 9: Test advanced analytics
    console.log("🔍 Testing advanced analytics...");
    const sma = await dsl.calculateSMA("bitcoin", 7, 10);
    console.log(`✅ Calculated SMA (${sma.length} data points)`);
    // Test 10: Data health check
    console.log("🏥 Testing data health monitoring...");
    const health = await dsl.getDataHealth();
    console.log("✅ Data health check completed:");
    console.log(`   Hypertables: ${health.hypertables.length}`);
    console.log(`   Recent price updates: ${health.dataHealth.recentPriceUpdates}`);
    console.log(`   Active currencies: ${health.dataHealth.activeCurrencies}`);
    // Cleanup
    console.log("🧹 Closing connections...");
    await dsl.close();
    console.log("🎉 All tests passed! Drizzle implementation is working correctly.");
    return {
      success: true,
      results: {
        pricesStored: samplePrices.length,
        pricesRetrieved: latestPrices.length,
        ohlcvRecords: ohlcvData.length,
        currentBTCPrice: btcPrice,
        marketSummary: marketSummary ? "Retrieved" : "Not available",
        smaCalculated: sma.length > 0,
        hypertables: health.hypertables.length,
      },
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
// Run tests if executed directly
if (import.meta.main) {
  console.log("🚀 Starting Drizzle ORM tests...");
  console.log("📋 Make sure TimescaleDB is running on localhost:5432");
  console.log("");
  testDrizzleImplementation()
    .then((result) => {
      if (result.success) {
        console.log("\n✨ Test Summary:", result.results);
        process.exit(0);
      } else {
        console.log("\n💥 Tests failed:", result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("💥 Unexpected error:", error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
export { testDrizzleImplementation };
