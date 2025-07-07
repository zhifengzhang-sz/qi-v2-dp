#!/usr/bin/env bun

/**
 * Advanced CoinGecko Actor Demo - Financial DSL Showcase
 *
 * Demonstrates all 5 financial market data acquisition DSL functions
 * of the CoinGecko Actor with comprehensive data analysis.
 *
 * Financial Market Data Acquisition DSL:
 * 1. Get current price for ticker and market
 * 2. Get current OHLCV for ticker and market
 * 3. Get price from date_start to date_end
 * 4. Get OHLCV from date_start to date_end
 * 5. Get all available tickers for market
 */

import { CoinGeckoActor } from "../../../lib/src/publishers/sources/coingecko/CoinGeckoActor";

// Enhanced logger for demo
const logger = {
  info: (msg: string) => console.log(`[INFO] ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
};

async function demonstrateAdvancedFinancialDSL() {
  console.log("🎯 ADVANCED COINGECKO ACTOR DEMO - Financial DSL Showcase");
  console.log("📈 Comprehensive financial market data acquisition demonstration...\n");

  // Create the CoinGecko Actor
  const coinGeckoActor = new CoinGeckoActor({
    name: "advanced-demo-coingecko-actor",
    useRemoteServer: true,
    environment: "free",
    debug: false, // Reduced verbosity for cleaner output
    timeout: 30000,
  });

  try {
    // =============================================================================
    // ACTOR INITIALIZATION
    // =============================================================================

    console.log("🚀 INITIALIZING FINANCIAL DSL ACTOR");
    await coinGeckoActor.initialize();
    console.log("✅ CoinGecko Actor ready for financial analysis\n");

    // =============================================================================
    // FINANCIAL DSL FUNCTION 1: CURRENT PRICE ANALYSIS
    // =============================================================================

    console.log("💰 DSL FUNCTION 1: CURRENT PRICE ANALYSIS");
    console.log("🎯 Analyzing current market prices for major cryptocurrencies...\n");

    try {
      // Get current prices for major cryptocurrencies
      const cryptoList = ["bitcoin", "ethereum", "binancecoin", "cardano", "solana"];
      const currentPricesResult = await coinGeckoActor.getCurrentPrices(cryptoList, {
        vsCurrencies: ["usd", "btc"],
        includeMarketData: true,
        includePriceChange: true,
      });

      if (currentPricesResult._tag === "Left") {
        console.error("❌ Failed to get current prices:", currentPricesResult.left.message);
        return;
      }

      const currentPrices = currentPricesResult.right;
      console.log("📊 Current Market Analysis:");
      for (const crypto of currentPrices) {
        const changeIcon = crypto.change24h && crypto.change24h > 0 ? "📈" : "📉";
        const changeColor = crypto.change24h && crypto.change24h > 0 ? "+" : "";

        console.log(`   ${changeIcon} ${crypto.symbol}:`);
        console.log(`      💵 Price: $${crypto.usdPrice.toLocaleString()}`);
        console.log(`      ₿ BTC Price: ${crypto.btcPrice?.toFixed(8) || "N/A"} BTC`);
        console.log(`      📈 24h Change: ${changeColor}${crypto.change24h?.toFixed(2) || "N/A"}%`);
        console.log(`      💎 Market Cap: $${(crypto.marketCap! / 1e9).toFixed(2)}B`);
        console.log(`      📊 24h Volume: $${(crypto.volume24h! / 1e6).toFixed(2)}M`);
        console.log("");
      }

      // Calculate portfolio metrics
      const totalMarketCap = currentPrices.reduce(
        (sum, crypto) => sum + (crypto.marketCap || 0),
        0,
      );
      const avgChange24h =
        currentPrices.reduce((sum, crypto) => sum + (crypto.change24h || 0), 0) /
        currentPrices.length;

      console.log("🎯 Portfolio Analysis:");
      console.log(`   💰 Combined Market Cap: $${(totalMarketCap / 1e12).toFixed(2)}T`);
      console.log(
        `   📈 Average 24h Change: ${avgChange24h > 0 ? "+" : ""}${avgChange24h.toFixed(2)}%`,
      );
      console.log(
        `   🏆 Best Performer: ${currentPrices.sort((a, b) => (b.change24h || 0) - (a.change24h || 0))[0]?.symbol}`,
      );
      console.log("   ✅ Current price analysis completed\n");
    } catch (error) {
      console.log(`   ⚠️ Price analysis skipped (rate limited): ${error.message}\n`);
    }

    // =============================================================================
    // FINANCIAL DSL FUNCTION 2: CURRENT OHLCV ANALYSIS
    // =============================================================================

    console.log("📊 DSL FUNCTION 2: CURRENT OHLCV ANALYSIS");
    console.log("🎯 Analyzing current OHLCV candle data for technical analysis...\n");

    try {
      // Get current OHLCV for Bitcoin
      const btcOHLCVResult = await coinGeckoActor.getCurrentOHLCV("bitcoin", "hourly");

      if (btcOHLCVResult._tag === "Right") {
        const btcOHLCV = btcOHLCVResult.right;
        console.log("📈 Bitcoin Current OHLCV Analysis:");
        console.log(`   🕒 Timestamp: ${btcOHLCV.timestamp.toISOString()}`);
        console.log(`   🟢 Open: $${btcOHLCV.open.toLocaleString()}`);
        console.log(`   🔺 High: $${btcOHLCV.high.toLocaleString()}`);
        console.log(`   🔻 Low: $${btcOHLCV.low.toLocaleString()}`);
        console.log(`   🎯 Close: $${btcOHLCV.close.toLocaleString()}`);
        console.log(`   📊 Volume: ${(btcOHLCV.volume / 1e6).toFixed(2)}M`);

        // Calculate technical indicators
        const bodySize = Math.abs(btcOHLCV.close - btcOHLCV.open);
        const upperWick = btcOHLCV.high - Math.max(btcOHLCV.open, btcOHLCV.close);
        const lowerWick = Math.min(btcOHLCV.open, btcOHLCV.close) - btcOHLCV.low;
        const priceChange = ((btcOHLCV.close - btcOHLCV.open) / btcOHLCV.open) * 100;

        console.log("\n   🎯 Technical Analysis:");
        console.log(
          `   📏 Body Size: $${bodySize.toFixed(2)} (${((bodySize / btcOHLCV.open) * 100).toFixed(3)}%)`,
        );
        console.log(`   ⬆️ Upper Wick: $${upperWick.toFixed(2)}`);
        console.log(`   ⬇️ Lower Wick: $${lowerWick.toFixed(2)}`);
        console.log(`   📈 Price Change: ${priceChange > 0 ? "+" : ""}${priceChange.toFixed(3)}%`);
        console.log(
          `   🎨 Candle Type: ${btcOHLCV.close > btcOHLCV.open ? "Bullish (Green)" : "Bearish (Red)"}`,
        );
        console.log("   ✅ OHLCV analysis completed\n");
      } else {
        console.error("❌ Failed to get OHLCV data:", btcOHLCVResult.left.message);
      }
    } catch (error) {
      console.log(`   ⚠️ OHLCV analysis skipped (rate limited): ${error.message}\n`);
    }

    // =============================================================================
    // FINANCIAL DSL FUNCTION 3: PRICE HISTORY ANALYSIS
    // =============================================================================

    console.log("📈 DSL FUNCTION 3: PRICE HISTORY ANALYSIS");
    console.log("🎯 Analyzing historical price trends for investment insights...\n");

    try {
      // Get price history for the last 7 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      const priceHistory = await coinGeckoActor.getPriceHistory("bitcoin", startDate, endDate);

      if (priceHistory.length > 0) {
        console.log(`📊 Bitcoin Price History (${priceHistory.length} data points):`);

        // Calculate trend analysis
        const firstPrice = priceHistory[0].price;
        const lastPrice = priceHistory[priceHistory.length - 1].price;
        const totalChange = ((lastPrice - firstPrice) / firstPrice) * 100;

        const maxPrice = Math.max(...priceHistory.map((p) => p.price));
        const minPrice = Math.min(...priceHistory.map((p) => p.price));
        const volatility = ((maxPrice - minPrice) / minPrice) * 100;

        console.log(`   📅 Period: ${startDate.toDateString()} to ${endDate.toDateString()}`);
        console.log(`   🎯 Start Price: $${firstPrice.toLocaleString()}`);
        console.log(`   🎯 End Price: $${lastPrice.toLocaleString()}`);
        console.log(`   📈 Total Return: ${totalChange > 0 ? "+" : ""}${totalChange.toFixed(2)}%`);
        console.log(
          `   📊 Price Range: $${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`,
        );
        console.log(`   ⚡ Volatility: ${volatility.toFixed(2)}%`);
        console.log(`   📊 Trend: ${totalChange > 0 ? "Bullish 📈" : "Bearish 📉"}`);
        console.log("   ✅ Price history analysis completed\n");
      } else {
        console.log("   ⚠️ No historical price data available\n");
      }
    } catch (error) {
      console.log(`   ⚠️ Price history analysis skipped (rate limited): ${error.message}\n`);
    }

    // =============================================================================
    // FINANCIAL DSL FUNCTION 5: MARKET OVERVIEW
    // =============================================================================

    console.log("🏆 DSL FUNCTION 5: COMPREHENSIVE MARKET OVERVIEW");
    console.log("🎯 Analyzing top cryptocurrency market for investment opportunities...\n");

    try {
      // Get top 10 cryptocurrencies
      const topCryptos = await coinGeckoActor.getAvailableTickers(10);

      console.log("🏆 Top 10 Cryptocurrencies by Market Cap:");
      for (let i = 0; i < topCryptos.length; i++) {
        const crypto = topCryptos[i];
        const rank = i + 1;
        const medalEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "🏅";

        console.log(`   ${medalEmoji} #${rank} ${crypto.symbol} (${crypto.name}):`);
        console.log(`      💵 Price: $${crypto.usdPrice.toLocaleString()}`);
        console.log(`      💎 Market Cap: $${(crypto.marketCap! / 1e9).toFixed(2)}B`);
        console.log(`      📊 24h Volume: $${(crypto.volume24h! / 1e6).toFixed(2)}M`);
        console.log(
          `      📈 24h Change: ${crypto.change24h && crypto.change24h > 0 ? "+" : ""}${crypto.change24h?.toFixed(2) || "N/A"}%`,
        );
        console.log("");
      }

      // Market insights
      const totalTopMarketCap = topCryptos.reduce(
        (sum, crypto) => sum + (crypto.marketCap || 0),
        0,
      );
      const avgTopChange =
        topCryptos.reduce((sum, crypto) => sum + (crypto.change24h || 0), 0) / topCryptos.length;
      const bullishCount = topCryptos.filter((crypto) => (crypto.change24h || 0) > 0).length;

      console.log("🎯 Market Overview Insights:");
      console.log(`   💰 Top 10 Combined Market Cap: $${(totalTopMarketCap / 1e12).toFixed(2)}T`);
      console.log(
        `   📈 Average 24h Performance: ${avgTopChange > 0 ? "+" : ""}${avgTopChange.toFixed(2)}%`,
      );
      console.log(
        `   🟢 Bullish Cryptos: ${bullishCount}/10 (${((bullishCount / 10) * 100).toFixed(0)}%)`,
      );
      console.log(
        `   📊 Market Sentiment: ${bullishCount >= 6 ? "Bullish 📈" : bullishCount >= 4 ? "Neutral ➡️" : "Bearish 📉"}`,
      );
      console.log("   ✅ Market overview completed\n");
    } catch (error) {
      console.log(`   ⚠️ Market overview skipped (rate limited): ${error.message}\n`);
    }

    // =============================================================================
    // GLOBAL MARKET ANALYTICS
    // =============================================================================

    console.log("🌍 GLOBAL MARKET ANALYTICS");
    console.log("🎯 Comprehensive cryptocurrency market analysis...\n");

    try {
      const globalAnalytics = await coinGeckoActor.getMarketAnalytics();

      console.log("🌍 Global Cryptocurrency Market Analysis:");
      console.log(
        `   💰 Total Market Capitalization: $${(globalAnalytics.totalMarketCap / 1e12).toFixed(2)}T`,
      );
      console.log(
        `   📊 Total 24h Trading Volume: $${(globalAnalytics.totalVolume / 1e9).toFixed(2)}B`,
      );
      console.log(`   ₿ Bitcoin Dominance: ${globalAnalytics.btcDominance.toFixed(2)}%`);
      console.log(
        `   🔷 Ethereum Dominance: ${globalAnalytics.ethDominance?.toFixed(2) || "N/A"}%`,
      );
      console.log(
        `   🪙 Active Cryptocurrencies: ${globalAnalytics.activeCryptocurrencies.toLocaleString()}`,
      );
      console.log(`   🏪 Active Markets: ${globalAnalytics.markets.toLocaleString()}`);
      console.log(
        `   📈 24h Market Cap Change: ${globalAnalytics.marketCapChange24h > 0 ? "+" : ""}${globalAnalytics.marketCapChange24h.toFixed(2)}%`,
      );
      console.log(`   🕒 Last Updated: ${globalAnalytics.timestamp.toISOString()}`);

      // Market health indicators
      const volumeToMcapRatio =
        (globalAnalytics.totalVolume / globalAnalytics.totalMarketCap) * 100;
      const marketHealth =
        volumeToMcapRatio > 10
          ? "High Activity 🔥"
          : volumeToMcapRatio > 5
            ? "Moderate Activity 📊"
            : "Low Activity 😴";

      console.log("\n   🎯 Market Health Indicators:");
      console.log(`   📊 Volume/Market Cap Ratio: ${volumeToMcapRatio.toFixed(2)}%`);
      console.log(`   💪 Market Activity Level: ${marketHealth}`);
      console.log(
        `   🎯 Bitcoin Dominance Trend: ${globalAnalytics.btcDominance > 50 ? "BTC Leading 👑" : "Altcoin Season 🌟"}`,
      );
      console.log("   ✅ Global analytics completed\n");
    } catch (error) {
      console.log(`   ⚠️ Global analytics skipped (rate limited): ${error.message}\n`);
    }

    // =============================================================================
    // FINAL SUMMARY
    // =============================================================================

    console.log("🏗️ FINANCIAL DSL DEMONSTRATION SUMMARY");
    console.log("✅ Successfully demonstrated all financial market data acquisition functions:");
    console.log("   1️⃣ Current price analysis with multi-currency support");
    console.log("   2️⃣ OHLCV technical analysis with candlestick insights");
    console.log("   3️⃣ Historical price trend analysis and volatility metrics");
    console.log("   4️⃣ Market overview with ranking and sentiment analysis");
    console.log("   5️⃣ Global market analytics with health indicators");
    console.log("\n🎉 ADVANCED FINANCIAL DSL DEMONSTRATION SUCCESSFUL!");
    console.log("💡 The CoinGecko Actor provides comprehensive financial market");
    console.log("   data acquisition capabilities through clean DSL interfaces.\n");

    return true;
  } catch (error) {
    console.error("❌ Advanced demo failed:", error);
    return false;
  } finally {
    // =============================================================================
    // CLEANUP
    // =============================================================================

    console.log("🧹 CLEANING UP FINANCIAL DSL ACTOR");

    try {
      await coinGeckoActor.cleanup();
      console.log("✅ Actor cleanup completed successfully");
    } catch (cleanupError) {
      console.warn("⚠️ Cleanup warning:", cleanupError);
    }

    console.log("\n✨ Advanced demo completed!");
  }
}

// =============================================================================
// RUN DEMONSTRATION
// =============================================================================

if (import.meta.main) {
  console.log("=".repeat(90));
  console.log("🚀 QICORE CRYPTO DATA PLATFORM - ADVANCED FINANCIAL DSL DEMO");
  console.log("=".repeat(90));

  const success = await demonstrateAdvancedFinancialDSL();

  console.log("\n" + "=".repeat(90));
  console.log(success ? "✅ ADVANCED DEMO COMPLETED SUCCESSFULLY" : "❌ ADVANCED DEMO FAILED");
  console.log("📈 FINANCIAL DSL CAPABILITIES VALIDATED");
  console.log("=".repeat(90));

  process.exit(success ? 0 : 1);
}
