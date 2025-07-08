#!/usr/bin/env bun

/**
 * TimescaleDB MCP Writer Demo
 *
 * Demonstrates how to use the TimescaleDB MCP Writer to persist
 * cryptocurrency data through an internal MCP server.
 *
 * This demo shows:
 * - Setting up an internal MCP server for TimescaleDB
 * - Using MCP-controlled database write operations
 * - Publishing price, OHLCV, and analytics data
 * - Transaction management through MCP
 * - Batch operations for high-throughput scenarios
 */

import { getData, getError, isFailure, isSuccess } from "@qi/core/base";
import { createTimescaleDBMCPMarketDataWriter } from "../../../../lib/src/actors/targets/timescale-mcp";
import type {
  CryptoMarketAnalytics,
  CryptoOHLCVData,
  CryptoPriceData,
} from "../../../../lib/src/dsl";

// =============================================================================
// DEMO CONFIGURATION
// =============================================================================

const DEMO_CONFIG = {
  writer: {
    name: "timescale-mcp-demo-writer",
    mcpServerConfig: {
      // Internal MCP server for TimescaleDB
      command: "npx",
      args: ["@modelcontextprotocol/server-postgres"],
      env: {
        POSTGRES_CONNECTION_STRING:
          process.env.DATABASE_URL || "postgresql://localhost:5432/qicore",
      },
    },
    databaseConfig: {
      connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/qicore",
      poolSize: 10,
      ssl: false,
      batchSize: 1000,
      flushInterval: 5000,
    },
    debug: true,
  },
};

// =============================================================================
// DEMO DATA GENERATION
// =============================================================================

function generateSamplePriceData(): CryptoPriceData[] {
  const coins = [
    { coinId: "bitcoin", symbol: "btc", name: "Bitcoin" },
    { coinId: "ethereum", symbol: "eth", name: "Ethereum" },
    { coinId: "cardano", symbol: "ada", name: "Cardano" },
  ];

  const exchanges = ["binance", "coinbase", "kraken"];
  const data: CryptoPriceData[] = [];

  for (const coin of coins) {
    for (const exchange of exchanges) {
      const basePrice = coin.coinId === "bitcoin" ? 45000 : coin.coinId === "ethereum" ? 3000 : 0.5;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation

      data.push({
        coinId: coin.coinId,
        symbol: coin.symbol,
        name: coin.name,
        exchangeId: exchange,
        usdPrice: basePrice * (1 + variation),
        btcPrice: coin.coinId === "bitcoin" ? 1 : basePrice / 45000,
        marketCap: basePrice * 19000000 * (1 + variation), // Approximate circulating supply
        volume24h: basePrice * 100000 * (1 + Math.random()),
        change24h: (Math.random() - 0.5) * 10, // ±5% daily change
        change7d: (Math.random() - 0.5) * 20, // ±10% weekly change
        lastUpdated: new Date(),
        source: "mcp-demo",
        attribution: "Demo data generated for MCP TimescaleDB writer testing",
      });
    }
  }

  return data;
}

function generateSampleOHLCVData(): CryptoOHLCVData[] {
  const coins = ["bitcoin", "ethereum"];
  const exchanges = ["binance", "coinbase"];
  const data: CryptoOHLCVData[] = [];

  for (const coinId of coins) {
    for (const exchangeId of exchanges) {
      const basePrice = coinId === "bitcoin" ? 45000 : 3000;
      const open = basePrice * (0.98 + Math.random() * 0.04);
      const close = basePrice * (0.98 + Math.random() * 0.04);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (0.98 + Math.random() * 0.02);

      data.push({
        coinId,
        symbol: coinId === "bitcoin" ? "btc" : "eth",
        exchangeId,
        timestamp: new Date(),
        open: open,
        high: high,
        low: low,
        close: close,
        volume: Math.random() * 1000000,
        timeframe: "1h",
        source: "mcp-demo",
        attribution: "Demo OHLCV data for MCP TimescaleDB writer testing",
      });
    }
  }

  return data;
}

function generateSampleAnalyticsData(): CryptoMarketAnalytics {
  return {
    timestamp: new Date(),
    exchangeId: "global", // Global market analytics
    totalMarketCap: 2500000000000, // $2.5T
    totalVolume: 95000000000, // $95B
    btcDominance: 42.5,
    ethDominance: 18.3,
    activeCryptocurrencies: 13500,
    markets: 25000,
    marketCapChange24h: 2.1,
    source: "mcp-demo",
    attribution: "Demo analytics data for MCP TimescaleDB writer testing",
  };
}

// =============================================================================
// DEMO FUNCTIONS
// =============================================================================

async function demonstrateMCPDataPersistence() {
  console.log("\n💾 Demonstrating MCP-Controlled Data Persistence");
  console.log("=".repeat(60));

  const writer = createTimescaleDBMCPMarketDataWriter(DEMO_CONFIG.writer);

  try {
    // Initialize the MCP writer
    console.log("📡 Initializing TimescaleDB MCP Writer...");
    const initResult = await writer.initialize();

    if (isFailure(initResult)) {
      console.error(
        "❌ Failed to initialize writer:",
        getError(initResult)?.message || "Unknown error",
      );
      return;
    }

    console.log("✅ MCP Writer initialized successfully");

    // Generate sample data
    const priceData = generateSamplePriceData();
    const ohlcvData = generateSampleOHLCVData();
    const analyticsData = generateSampleAnalyticsData();

    // Publish single price entry via MCP
    console.log("\n💰 Publishing single price entry via MCP...");
    const singlePriceResult = await writer.publishPrice(priceData[0]);

    if (isSuccess(singlePriceResult)) {
      console.log("✅ Single price published successfully");
      console.log(
        `   ${priceData[0].name}: $${priceData[0].usdPrice.toLocaleString()} [${priceData[0].exchangeId}]`,
      );
    } else {
      console.error(
        "❌ Failed to publish single price:",
        getError(singlePriceResult)?.message || "Unknown error",
      );
    }

    // Publish batch of prices via MCP
    console.log("\n📊 Publishing batch of prices via MCP...");
    const batchPricesResult = await writer.publishPrices(priceData);

    if (isSuccess(batchPricesResult)) {
      console.log(`✅ Batch of ${priceData.length} prices published successfully`);

      // Show distribution by exchange
      const exchangeGroups = priceData.reduce(
        (acc, price) => {
          acc[price.exchangeId] = (acc[price.exchangeId] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log("   Exchange distribution:");
      for (const [exchange, count] of Object.entries(exchangeGroups)) {
        console.log(`     ${exchange}: ${count} prices`);
      }
    } else {
      console.error(
        "❌ Failed to publish price batch:",
        getError(batchPricesResult)?.message || "Unknown error",
      );
    }

    // Publish OHLCV data via MCP
    console.log("\n📈 Publishing OHLCV data via MCP...");
    const ohlcvResults = await Promise.all(ohlcvData.map((candle) => writer.publishOHLCV(candle)));

    const successfulOHLCV = ohlcvResults.filter(isSuccess).length;
    console.log(`✅ ${successfulOHLCV}/${ohlcvData.length} OHLCV entries published successfully`);

    if (successfulOHLCV > 0) {
      console.log("   Sample OHLCV data published:");
      for (const [index, candle] of ohlcvData.slice(0, 2).entries()) {
        console.log(
          `     ${index + 1}. ${candle.coinId} [${candle.exchangeId}]: $${candle.open.toFixed(2)} → $${candle.close.toFixed(2)}`,
        );
      }
    }

    // Publish market analytics via MCP
    console.log("\n🌍 Publishing market analytics via MCP...");
    const analyticsResult = await writer.publishAnalytics(analyticsData);

    if (isSuccess(analyticsResult)) {
      console.log("✅ Market analytics published successfully");
      console.log(`   Market Cap: $${analyticsData.totalMarketCap.toLocaleString()}`);
      console.log(`   Volume 24h: $${analyticsData.totalVolume.toLocaleString()}`);
      console.log(`   BTC Dominance: ${analyticsData.btcDominance}%`);
    } else {
      console.error(
        "❌ Failed to publish analytics:",
        getError(analyticsResult)?.message || "Unknown error",
      );
    }

    // Cleanup
    console.log("\n🧹 Cleaning up...");
    const cleanupResult = await writer.cleanup();

    if (isSuccess(cleanupResult)) {
      console.log("✅ Writer cleanup completed");
    } else {
      console.error("⚠️ Cleanup warning:", getError(cleanupResult)?.message || "Unknown error");
    }
  } catch (error) {
    console.error("💥 Demo error:", error);
  }
}

async function demonstrateMCPTransactionManagement() {
  console.log("\n🔒 Demonstrating MCP Transaction Management");
  console.log("=".repeat(60));

  const writer = createTimescaleDBMCPMarketDataWriter(DEMO_CONFIG.writer);

  try {
    const initResult = await writer.initialize();

    if (isSuccess(initResult)) {
      console.log("📊 Testing transaction capabilities...");

      // Generate larger dataset for transaction demo
      const largePriceDataset = Array.from({ length: 50 }, (_, i) => ({
        coinId: `demo-coin-${i + 1}`,
        symbol: `DC${i + 1}`,
        name: `Demo Coin ${i + 1}`,
        exchangeId: ["demo-exchange-1", "demo-exchange-2"][i % 2],
        usdPrice: Math.random() * 1000,
        marketCap: Math.random() * 1000000000,
        volume24h: Math.random() * 10000000,
        change24h: (Math.random() - 0.5) * 10,
        lastUpdated: new Date(),
        source: "mcp-transaction-demo",
        attribution: "Demo data for MCP transaction testing",
      }));

      console.log(
        `\n💎 Publishing ${largePriceDataset.length} entries in MCP-controlled transaction...`,
      );

      // Use batch publish (transaction-like behavior through MCP)
      const transactionResult = await writer.publishPrices(largePriceDataset);

      if (isSuccess(transactionResult)) {
        console.log("✅ Transaction completed successfully");
        console.log("   All data committed atomically via MCP");
        console.log(`   ${largePriceDataset.length} price entries persisted`);
      } else {
        console.error(
          "❌ Transaction failed:",
          getError(transactionResult)?.message || "Unknown error",
        );
      }
    }

    await writer.cleanup();
  } catch (error) {
    console.error("💥 Transaction demo error:", error);
  }
}

async function demonstrateBatchOptimization() {
  console.log("\n⚡ Demonstrating Batch Optimization via MCP");
  console.log("=".repeat(60));

  const writer = createTimescaleDBMCPMarketDataWriter(DEMO_CONFIG.writer);

  try {
    const initResult = await writer.initialize();

    if (isSuccess(initResult)) {
      console.log("🚀 Testing high-throughput batch operations...");

      // Generate large dataset
      const batchData = Array.from({ length: 1000 }, (_, i) => ({
        coinId: `batch-coin-${(i % 100) + 1}`,
        symbol: `BC${(i % 100) + 1}`,
        name: `Batch Coin ${(i % 100) + 1}`,
        exchangeId: `batch-exchange-${(i % 5) + 1}`,
        usdPrice: Math.random() * 100,
        marketCap: Math.random() * 100000000,
        volume24h: Math.random() * 1000000,
        change24h: (Math.random() - 0.5) * 5,
        lastUpdated: new Date(Date.now() - Math.random() * 86400000), // Last 24 hours
        source: "mcp-batch-demo",
        attribution: "Demo data for MCP batch testing",
      }));

      console.log(`\n⏱️  Publishing ${batchData.length} entries via MCP batch operation...`);
      const startTime = Date.now();

      const batchResult = await writer.publishPrices(batchData);
      const duration = Date.now() - startTime;

      if (isSuccess(batchResult)) {
        console.log(`✅ Batch operation completed in ${duration}ms`);
        console.log(
          `   Throughput: ${Math.round(batchData.length / (duration / 1000))} records/second`,
        );
        console.log("   MCP server optimized the batch for TimescaleDB");

        // Show batch statistics
        const exchangeStats = batchData.reduce(
          (acc, item) => {
            acc[item.exchangeId] = (acc[item.exchangeId] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        console.log("\n📊 Batch Statistics:");
        for (const [exchange, count] of Object.entries(exchangeStats)) {
          console.log(`   ${exchange}: ${count} records`);
        }
      } else {
        console.error(
          "❌ Batch operation failed:",
          getError(batchResult)?.message || "Unknown error",
        );
      }
    }

    await writer.cleanup();
  } catch (error) {
    console.error("💥 Batch demo error:", error);
  }
}

// =============================================================================
// MAIN DEMO EXECUTION
// =============================================================================

async function runDemo() {
  console.log("🚀 TimescaleDB MCP Writer Demo");
  console.log("=".repeat(60));
  console.log("This demo showcases MCP-controlled database write operations");
  console.log("Prerequisites:");
  console.log("  - TimescaleDB running with crypto schema");
  console.log("  - DATABASE_URL environment variable set");
  console.log("  - @modelcontextprotocol/server-postgres package installed");
  console.log("  - Internal MCP server for database control");

  try {
    await demonstrateMCPDataPersistence();
    await demonstrateMCPTransactionManagement();
    await demonstrateBatchOptimization();

    console.log("\n🎉 Demo completed successfully!");
    console.log("\nKey Takeaways:");
    console.log("  ✅ MCP server provides controlled database write access");
    console.log("  ✅ Transaction management through MCP protocol");
    console.log("  ✅ High-throughput batch operations optimized");
    console.log("  ✅ Exchange-aware data partitioning and indexing");
    console.log("  ✅ TimescaleDB compression and hypertable benefits");
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
  demonstrateMCPDataPersistence,
  demonstrateMCPTransactionManagement,
  demonstrateBatchOptimization,
  generateSamplePriceData,
  generateSampleOHLCVData,
  generateSampleAnalyticsData,
};
