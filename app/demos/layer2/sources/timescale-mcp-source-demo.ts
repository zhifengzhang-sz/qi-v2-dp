#!/usr/bin/env bun

/**
 * TimescaleDB MCP Reader Demo
 *
 * Demonstrates how to use the TimescaleDB MCP Reader to query historical
 * cryptocurrency data through an internal MCP server.
 *
 * This demo shows:
 * - Setting up an internal MCP server for TimescaleDB
 * - Using MCP-controlled database queries
 * - Reading historical price and OHLCV data
 * - Error handling with Result<T> pattern
 */

import { isFailure, isSuccess, getData, getError } from "@qi/core/base";
import { createTimescaleDBMCPMarketDataReader } from "../../../../lib/src/actors/sources/timescale-mcp";

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_CONFIG = {
  reader: {
    name: "timescale-mcp-demo-reader",
    mcpServerConfig: {
      // Internal MCP server for TimescaleDB
      command: "npx",
      args: ["@modelcontextprotocol/server-postgres"],
      env: {
        POSTGRES_CONNECTION_STRING: process.env.DATABASE_URL || "postgresql://localhost:5432/qicore"
      }
    },
    databaseConfig: {
      connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/qicore",
      poolSize: 5,
      ssl: false
    },
    debug: true
  }
};

// =============================================================================
// DEMO FUNCTIONS
// =============================================================================

async function demonstrateHistoricalPriceQuery() {
  console.log("\n🔍 Demonstrating Historical Price Query via MCP");
  console.log("=" .repeat(60));

  const reader = createTimescaleDBMCPMarketDataReader(DEMO_CONFIG.reader);

  try {
    // Initialize the MCP reader
    console.log("📡 Initializing TimescaleDB MCP Reader...");
    const initResult = await reader.initialize();
    
    if (isFailure(initResult)) {
      console.error("❌ Failed to initialize reader:", getError(initResult).message);
      return;
    }
    
    console.log("✅ MCP Reader initialized successfully");

    // Query historical Bitcoin prices for the last 7 days
    console.log("\n📊 Querying Bitcoin price history (last 7 days)...");
    const historyResult = await reader.getPriceHistory("bitcoin", 7, "usd");
    
    if (isSuccess(historyResult)) {
      const prices = getData(historyResult);
      console.log(`✅ Retrieved ${prices.length} historical price points`);
      
      if (prices.length > 0) {
        console.log("\n📈 Recent Bitcoin Prices:");
        prices.slice(-5).forEach((price, index) => {
          console.log(`  ${index + 1}. $${price.usdPrice.toLocaleString()} (${price.lastUpdated.toISOString()}) [${price.exchangeId}]`);
        });
        
        // Calculate price statistics
        const currentPrice = prices[prices.length - 1]?.usdPrice || 0;
        const oldestPrice = prices[0]?.usdPrice || 0;
        const change = ((currentPrice - oldestPrice) / oldestPrice * 100);
        
        console.log(`\n📊 7-Day Price Change: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
        console.log(`   From: $${oldestPrice.toLocaleString()}`);
        console.log(`   To:   $${currentPrice.toLocaleString()}`);
      }
    } else {
      console.error("❌ Failed to get price history:", getError(historyResult).message);
    }

    // Query OHLCV data by date range
    console.log("\n📊 Querying OHLCV data for Ethereum (last 3 days)...");
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const ohlcvResult = await reader.getOHLCVByDateRange({
      ticker: "ethereum",
      dateStart: startDate,
      dateEnd: endDate,
      interval: "1d"
    });
    
    if (isSuccess(ohlcvResult)) {
      const ohlcvData = getData(ohlcvResult);
      console.log(`✅ Retrieved ${ohlcvData.length} OHLCV data points`);
      
      if (ohlcvData.length > 0) {
        console.log("\n📊 Ethereum OHLCV Data:");
        ohlcvData.forEach((candle, index) => {
          console.log(`  Day ${index + 1}: Open=$${candle.openPrice.toFixed(2)} High=$${candle.highPrice.toFixed(2)} Low=$${candle.lowPrice.toFixed(2)} Close=$${candle.closePrice.toFixed(2)} [${candle.exchangeId}]`);
        });
      }
    } else {
      console.error("❌ Failed to get OHLCV data:", getError(ohlcvResult).message);
    }

    // Query available tickers
    console.log("\n📋 Querying available cryptocurrency tickers...");
    const tickersResult = await reader.getAvailableTickers(10);
    
    if (isSuccess(tickersResult)) {
      const tickers = getData(tickersResult);
      console.log(`✅ Retrieved ${tickers.length} available tickers`);
      
      if (tickers.length > 0) {
        console.log("\n🏷️  Available Cryptocurrencies:");
        tickers.forEach((ticker, index) => {
          console.log(`  ${index + 1}. ${ticker.name} (${ticker.symbol.toUpperCase()}) - ${ticker.coinId} [${ticker.exchangeId}]`);
        });
      }
    } else {
      console.error("❌ Failed to get available tickers:", getError(tickersResult).message);
    }

    // Cleanup
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await reader.cleanup();
    
    if (isSuccess(cleanupResult)) {
      console.log("✅ Reader cleanup completed");
    } else {
      console.error("⚠️ Cleanup warning:", getError(cleanupResult).message);
    }

  } catch (error) {
    console.error("💥 Demo error:", error);
  }
}

async function demonstrateMCPServerInfo() {
  console.log("\n🔧 MCP Server Information");
  console.log("=" .repeat(60));

  const reader = createTimescaleDBMCPMarketDataReader(DEMO_CONFIG.reader);
  
  try {
    const initResult = await reader.initialize();
    
    if (isSuccess(initResult)) {
      const status = reader.getStatus();
      console.log("📊 Reader Status:", JSON.stringify(status, null, 2));
    }
    
    await reader.cleanup();
  } catch (error) {
    console.error("💥 Status check error:", error);
  }
}

// =============================================================================
// MAIN DEMO EXECUTION
// =============================================================================

async function runDemo() {
  console.log("🚀 TimescaleDB MCP Reader Demo");
  console.log("=" .repeat(60));
  console.log("This demo showcases MCP-controlled database queries for historical crypto data");
  console.log("Prerequisites:");
  console.log("  - TimescaleDB running with crypto data");
  console.log("  - DATABASE_URL environment variable set");
  console.log("  - @modelcontextprotocol/server-postgres package installed");
  
  try {
    await demonstrateHistoricalPriceQuery();
    await demonstrateMCPServerInfo();
    
    console.log("\n🎉 Demo completed successfully!");
    console.log("\nKey Takeaways:");
    console.log("  ✅ MCP server provides controlled database access");
    console.log("  ✅ Historical data queries work through MCP protocol");
    console.log("  ✅ Result<T> pattern provides type-safe error handling");
    console.log("  ✅ Exchange-aware data includes proper attribution");
    
  } catch (error) {
    console.error("\n💥 Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.main) {
  runDemo();
}

export { runDemo, demonstrateHistoricalPriceQuery, demonstrateMCPServerInfo };