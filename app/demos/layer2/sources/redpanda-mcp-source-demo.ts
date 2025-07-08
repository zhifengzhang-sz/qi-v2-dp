#!/usr/bin/env bun

/**
 * Redpanda MCP Reader Demo
 *
 * Demonstrates how to use the Redpanda MCP Reader to consume real-time
 * cryptocurrency data through an internal MCP server.
 *
 * This demo shows:
 * - Setting up an internal MCP server for Redpanda
 * - Using MCP-controlled streaming data consumption
 * - Reading real-time price and market data from topics
 * - Dynamic topic subscription and message filtering
 */

import { isFailure, isSuccess, getData, getError } from "@qi/core/base";
import { createRedpandaMCPMarketDataReader } from "../../../../lib/src/actors/sources/redpanda-mcp";

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_CONFIG = {
  reader: {
    name: "redpanda-mcp-demo-reader",
    mcpServerConfig: {
      // Internal MCP server for Redpanda
      serverUrl: "http://localhost:8080/mcp",
      authentication: {
        type: "none" // For demo purposes
      },
      timeout: 30000
    },
    redpandaConfig: {
      brokers: ["localhost:9092"],
      groupId: "mcp-demo-group",
      topics: {
        prices: "crypto-prices",
        ohlcv: "crypto-ohlcv",
        analytics: "crypto-analytics",
        level1: "crypto-level1"
      },
      consumerConfig: {
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000,
        maxWaitTime: 100,
        autoOffsetReset: "latest"
      }
    },
    debug: true
  }
};

// =============================================================================
// DEMO FUNCTIONS
// =============================================================================

async function demonstrateRealTimeDataConsumption() {
  console.log("\n🌊 Demonstrating Real-Time Data Consumption via MCP");
  console.log("=" .repeat(60));

  const reader = createRedpandaMCPMarketDataReader(DEMO_CONFIG.reader);

  try {
    // Initialize the MCP reader
    console.log("📡 Initializing Redpanda MCP Reader...");
    const initResult = await reader.initialize();
    
    if (isFailure(initResult)) {
      console.error("❌ Failed to initialize reader:", getError(initResult).message);
      return;
    }
    
    console.log("✅ MCP Reader initialized successfully");

    // Get current prices from streaming topics
    console.log("\n💰 Reading current prices from streaming topics...");
    const pricesResult = await reader.getCurrentPrices(["bitcoin", "ethereum", "cardano"]);
    
    if (isSuccess(pricesResult)) {
      const prices = getData(pricesResult);
      console.log(`✅ Retrieved ${prices.length} real-time prices from stream`);
      
      if (prices.length > 0) {
        console.log("\n💹 Current Streaming Prices:");
        prices.forEach((price, index) => {
          console.log(`  ${index + 1}. ${price.name} (${price.symbol.toUpperCase()}): $${price.usdPrice.toLocaleString()}`);
          console.log(`     Exchange: ${price.exchangeId} | Volume: $${price.volume24h?.toLocaleString() || 'N/A'}`);
          console.log(`     Change 24h: ${price.change24h ? (price.change24h > 0 ? '+' : '') + price.change24h.toFixed(2) + '%' : 'N/A'}`);
        });
      }
    } else {
      console.error("❌ Failed to get current prices:", getError(pricesResult).message);
    }

    // Get latest OHLCV data from stream
    console.log("\n📊 Reading latest OHLCV data from streaming topics...");
    const ohlcvResult = await reader.getLatestOHLCV(["bitcoin", "ethereum"], "1h");
    
    if (isSuccess(ohlcvResult)) {
      const ohlcvData = getData(ohlcvResult);
      console.log(`✅ Retrieved ${ohlcvData.length} OHLCV data points from stream`);
      
      if (ohlcvData.length > 0) {
        console.log("\n📈 Latest OHLCV from Stream:");
        const groupedByCoin = ohlcvData.reduce((acc, candle) => {
          if (!acc[candle.coinId]) acc[candle.coinId] = [];
          acc[candle.coinId].push(candle);
          return acc;
        }, {} as Record<string, typeof ohlcvData>);
        
        Object.entries(groupedByCoin).forEach(([coinId, candles]) => {
          console.log(`\n  ${coinId.toUpperCase()}:`);
          candles.slice(-3).forEach((candle, index) => {
            console.log(`    ${index + 1}. ${candle.timeframe} | O:$${candle.openPrice.toFixed(2)} H:$${candle.highPrice.toFixed(2)} L:$${candle.lowPrice.toFixed(2)} C:$${candle.closePrice.toFixed(2)} [${candle.exchangeId}]`);
          });
        });
      }
    } else {
      console.error("❌ Failed to get OHLCV data:", getError(ohlcvResult).message);
    }

    // Get market analytics from stream
    console.log("\n🌍 Reading global market analytics from stream...");
    const analyticsResult = await reader.getMarketAnalytics();
    
    if (isSuccess(analyticsResult)) {
      const analytics = getData(analyticsResult);
      console.log("✅ Retrieved market analytics from stream");
      
      console.log("\n🏦 Global Market Analytics:");
      console.log(`  Total Market Cap: $${analytics.totalMarketCap.toLocaleString()}`);
      console.log(`  Total Volume 24h: $${analytics.totalVolume.toLocaleString()}`);
      console.log(`  BTC Dominance: ${analytics.btcDominance.toFixed(2)}%`);
      console.log(`  ETH Dominance: ${analytics.ethDominance?.toFixed(2) || 'N/A'}%`);
      console.log(`  Active Cryptos: ${analytics.activeCryptocurrencies.toLocaleString()}`);
      console.log(`  Markets: ${analytics.markets.toLocaleString()}`);
      console.log(`  Market Cap Change 24h: ${analytics.marketCapChange24h > 0 ? '+' : ''}${analytics.marketCapChange24h.toFixed(2)}%`);
      console.log(`  Source: ${analytics.source} [${analytics.exchangeId || 'global'}]`);
    } else {
      console.error("❌ Failed to get market analytics:", getError(analyticsResult).message);
    }

    // Get single current price to show MCP control
    console.log("\n🎯 Reading single Bitcoin price via MCP control...");
    const singlePriceResult = await reader.getCurrentPrice("bitcoin", "usd");
    
    if (isSuccess(singlePriceResult)) {
      const price = getData(singlePriceResult);
      console.log(`✅ Bitcoin current price: $${price.toLocaleString()}`);
    } else {
      console.error("❌ Failed to get single price:", getError(singlePriceResult).message);
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

async function demonstrateMCPTopicManagement() {
  console.log("\n🔧 Demonstrating MCP Topic Management");
  console.log("=" .repeat(60));

  const reader = createRedpandaMCPMarketDataReader(DEMO_CONFIG.reader);
  
  try {
    const initResult = await reader.initialize();
    
    if (isSuccess(initResult)) {
      console.log("📊 Reader connected to MCP server");
      
      // Get reader status showing topic subscriptions
      const status = reader.getStatus();
      console.log("\n📈 MCP Reader Status:");
      console.log(JSON.stringify(status, null, 2));
      
      console.log("\n🔍 MCP Benefits:");
      console.log("  ✅ Dynamic topic subscription through MCP tools");
      console.log("  ✅ Message filtering and transformation");
      console.log("  ✅ Centralized streaming configuration");
      console.log("  ✅ AI-controlled data access patterns");
    }
    
    await reader.cleanup();
  } catch (error) {
    console.error("💥 Topic management demo error:", error);
  }
}

async function demonstrateExchangeAwareStreaming() {
  console.log("\n🏪 Demonstrating Exchange-Aware Streaming");
  console.log("=" .repeat(60));

  const reader = createRedpandaMCPMarketDataReader(DEMO_CONFIG.reader);
  
  try {
    const initResult = await reader.initialize();
    
    if (isSuccess(initResult)) {
      console.log("📡 Reading from exchange-specific topics...");
      
      // This would demonstrate reading from different exchange streams
      const pricesResult = await reader.getCurrentPrices(["bitcoin"]);
      
      if (isSuccess(pricesResult)) {
        const prices = getData(pricesResult);
        
        console.log("\n🔍 Exchange Distribution:");
        const exchangeGroups = prices.reduce((acc, price) => {
          if (!acc[price.exchangeId]) acc[price.exchangeId] = [];
          acc[price.exchangeId].push(price);
          return acc;
        }, {} as Record<string, typeof prices>);
        
        Object.entries(exchangeGroups).forEach(([exchange, exchangePrices]) => {
          console.log(`  ${exchange}: ${exchangePrices.length} price points`);
        });
      }
    }
    
    await reader.cleanup();
  } catch (error) {
    console.error("💥 Exchange demo error:", error);
  }
}

// =============================================================================
// MAIN DEMO EXECUTION
// =============================================================================

async function runDemo() {
  console.log("🚀 Redpanda MCP Reader Demo");
  console.log("=" .repeat(60));
  console.log("This demo showcases MCP-controlled streaming data consumption");
  console.log("Prerequisites:");
  console.log("  - Redpanda cluster running with crypto data topics");
  console.log("  - Internal MCP server for Redpanda control");
  console.log("  - Topics: crypto-prices, crypto-ohlcv, crypto-analytics");
  
  try {
    await demonstrateRealTimeDataConsumption();
    await demonstrateMCPTopicManagement();
    await demonstrateExchangeAwareStreaming();
    
    console.log("\n🎉 Demo completed successfully!");
    console.log("\nKey Takeaways:");
    console.log("  ✅ MCP server provides controlled streaming access");
    console.log("  ✅ Real-time data consumption via MCP protocol");
    console.log("  ✅ Dynamic topic subscription and management");
    console.log("  ✅ Exchange-aware message routing and filtering");
    console.log("  ✅ AI-controlled data access patterns possible");
    
  } catch (error) {
    console.error("\n💥 Demo failed:", error);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.main) {
  runDemo();
}

export { 
  runDemo, 
  demonstrateRealTimeDataConsumption, 
  demonstrateMCPTopicManagement,
  demonstrateExchangeAwareStreaming 
};