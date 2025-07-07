#!/usr/bin/env bun

/**
 * Show What Tools Our TRUE Actors Provide to Users
 *
 * MCP Client tools = What the client provides to USERS (not servers)
 * Our actors should expose their DSL methods as user-facing tools
 */

import { createCoinGeckoMarketDataReader } from "../src/publishers/sources/coingecko/MarketDataReader";

async function showUserFacingTools() {
  console.log("🔍 WHAT TOOLS DO OUR TRUE ACTORS PROVIDE TO USERS?");
  console.log("=".repeat(60));

  const actor = createCoinGeckoMarketDataReader({
    name: "user-tool-inspection",
    debug: false,
  });

  console.log("🎭 TRUE Actor DSL Methods (User-Facing Tools):");
  console.log("─".repeat(60));

  // These are the tools our actor provides to users
  const userTools = [
    {
      name: "getCurrentPrice",
      description: "Get current price for a cryptocurrency",
      params: ["coinId", "vsCurrency?"],
    },
    {
      name: "getCurrentPrices",
      description: "Get current prices for multiple cryptocurrencies",
      params: ["coinIds[]", "options?"],
    },
    {
      name: "getCurrentOHLCV",
      description: "Get current OHLCV data for a cryptocurrency",
      params: ["coinId", "interval?"],
    },
    {
      name: "getLatestOHLCV",
      description: "Get latest OHLCV candles",
      params: ["coinId", "count?", "interval?"],
    },
    {
      name: "getPriceHistory",
      description: "Get price history within date range",
      params: ["coinId", "dateStart", "dateEnd"],
    },
    {
      name: "getOHLCVByDateRange",
      description: "Get OHLCV data within date range",
      params: ["query: DateRangeOHLCVQuery"],
    },
    {
      name: "getAvailableTickers",
      description: "Get all available cryptocurrency tickers",
      params: ["limit?"],
    },
    {
      name: "getLevel1Data",
      description: "Get Level 1 market data (bid/ask)",
      params: ["query: Level1Query"],
    },
    {
      name: "getMarketAnalytics",
      description: "Get global cryptocurrency market analytics",
      params: [],
    },
  ];

  userTools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.name}`);
    console.log(`   Description: ${tool.description}`);
    console.log(`   Parameters: ${tool.params.join(", ")}`);
  });

  console.log("\n🔍 KEY INSIGHT:");
  console.log("─".repeat(60));
  console.log("✅ These DSL methods ARE the tools our client provides to users");
  console.log("✅ Users call actor.getCurrentPrice() to get cryptocurrency prices");
  console.log("✅ Users call actor.getOHLCVByDateRange() to get historical data");
  console.log("✅ Our actor abstracts away MCP server complexity from users");

  console.log("\n🏗️ MCP ARCHITECTURE (CORRECTED):");
  console.log("─".repeat(60));
  console.log("🔹 MCP Server (CoinGecko): Provides 46 raw API tools");
  console.log("🔹 MCP Client (Our Actor): Consumes server tools internally");
  console.log("🔹 User Interface: Actor provides 9 clean DSL methods to users");
  console.log("🔹 Abstraction: Users don't deal with raw MCP calls");

  console.log("\n🎯 TRUE ACTOR VALUE PROPOSITION:");
  console.log("─".repeat(60));
  console.log("✅ Simplifies 46 raw CoinGecko tools → 9 clean DSL methods");
  console.log("✅ Handles MCP complexity (transport, error handling, data transformation)");
  console.log("✅ Provides domain-specific financial data interfaces");
  console.log("✅ Returns typed Result<T> for functional error handling");
  console.log("✅ Users get clean API without knowing about MCP protocol");

  // Test one of the user-facing tools
  console.log("\n🧪 TESTING USER-FACING TOOL:");
  console.log("─".repeat(60));

  try {
    console.log("🔌 Initializing actor...");
    const initResult = await actor.initialize();

    if (initResult._tag === "Right") {
      console.log("✅ Actor initialized");
      console.log("🎯 Testing getCurrentPrice() - User-facing tool:");

      const priceResult = await actor.getCurrentPrice("bitcoin");

      if (priceResult._tag === "Right") {
        console.log(`✅ Bitcoin price: $${priceResult.right}`);
        console.log("✅ User successfully used actor's tool without knowing MCP details");
      } else {
        console.log(`❌ Price fetch failed: ${priceResult.left.message}`);
      }

      await actor.cleanup();
    } else {
      console.log(`❌ Actor initialization failed: ${initResult.left.message}`);
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error}`);
  }
}

if (import.meta.main) {
  showUserFacingTools()
    .then(() => {
      console.log("\n✅ User-facing tool inspection completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Failed:", error);
      process.exit(1);
    });
}
