#!/usr/bin/env bun

/**
 * CoinGecko FP v2 Demo - Following v-0.1.0 Handler Pattern
 *
 * Demonstrates the improved FP system:
 * 1. Base class + handler pattern (like v-0.1.0)
 * 2. Canonical full-context interface
 * 3. Partial application for context binding
 * 4. Clean separation of concerns
 */

import {
  type CoinGeckoMCPConfig,
  EXCHANGES,
  SYMBOLS,
  bindContext,
  createCoinGeckoMCPReader,
  createMarketContext,
  createPureReader,
  createSymbolReader,
  parallel,
} from "@qi/fp";

import { getData, getError, isSuccess } from "@qi/core/base";

// =============================================================================
// DEMO SETUP
// =============================================================================

// Helper function for string repeat
const repeatStr = (str: string, count: number) => str.repeat(count);

async function demonstrateFPv2Approach() {
  console.log("🚀 CoinGecko FP v2 Demo - v-0.1.0 Handler Pattern");
  console.log(repeatStr("=", 80));

  // Create the reader using the new system
  const reader = createCoinGeckoMCPReader({
    name: "coingecko-fp-v2-demo",
    debug: true,
    useRemoteServer: true,
  });

  // Initialize the reader
  const initResult = await reader.initialize();
  if (!isSuccess(initResult)) {
    console.error("❌ Failed to initialize reader:", getError(initResult));
    return;
  }

  console.log("✅ Reader initialized successfully");

  // =============================================================================
  // DEMO 1: CANONICAL INTERFACE - FULL CONTEXT
  // =============================================================================

  console.log("\n📋 Demo 1: Canonical Interface (Full Context)");
  console.log(repeatStr("-", 50));

  const btcContext = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);
  const ethContext = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.ETH);

  // Direct canonical interface usage
  console.log("🔍 Getting BTC price with full context...");
  const btcPrice = await reader.getPrice(btcContext);
  if (isSuccess(btcPrice)) {
    const price = getData(btcPrice);
    console.log(`✅ BTC Price: $${price.price.toFixed(2)} (${price.timestamp.toISOString()})`);
  } else {
    console.error("❌ Failed to get BTC price:", getError(btcPrice));
  }

  console.log("🔍 Getting ETH Level1 with full context...");
  const ethLevel1 = await reader.getLevel1(ethContext);
  if (isSuccess(ethLevel1)) {
    const level1 = getData(ethLevel1);
    console.log(
      `✅ ETH Level1: Bid:$${level1.bidPrice.toFixed(2)} Ask:$${level1.askPrice.toFixed(2)}`,
    );
  } else {
    console.error("❌ Failed to get ETH Level1:", getError(ethLevel1));
  }

  // =============================================================================
  // DEMO 2: PARTIAL APPLICATION - CONTEXT BINDING
  // =============================================================================

  console.log("\n🔧 Demo 2: Partial Application (Context Binding)");
  console.log(repeatStr("-", 50));

  // Pure reader - full context bound, zero arguments
  console.log("🎯 Creating pure BTC reader (full context bound)...");
  const btcPureReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);

  // Zero-argument calls - maximum performance
  console.log("⚡ Zero-argument BTC price call...");
  const btcPurePrice = await btcPureReader.getPrice();
  if (isSuccess(btcPurePrice)) {
    const price = getData(btcPurePrice);
    console.log(`✅ Pure BTC Price: $${price.price.toFixed(2)} (zero args!)`);
  }

  // Symbol reader - exchange bound, symbol varies
  console.log("🎯 Creating CoinGecko symbol reader (exchange bound)...");
  const coinGeckoSymbolReader = createSymbolReader(reader, EXCHANGES.COINGECKO);

  console.log("⚡ Symbol reader BTC call...");
  const btcSymbolPrice = await coinGeckoSymbolReader.getPrice(SYMBOLS.BTC);
  if (isSuccess(btcSymbolPrice)) {
    const price = getData(btcSymbolPrice);
    console.log(`✅ Symbol BTC Price: $${price.price.toFixed(2)} (symbol arg only)`);
  }

  // =============================================================================
  // DEMO 3: HIGH-PERFORMANCE TRADING PATTERN
  // =============================================================================

  console.log("\n🏎️ Demo 3: High-Performance Trading Pattern");
  console.log(repeatStr("-", 50));

  // Create multiple pure readers for different assets
  const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
  const ethReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.ETH);

  // Simulate high-frequency trading loop
  console.log("⚡ High-frequency trading simulation (5 iterations)...");
  const startTime = Date.now();

  for (let i = 0; i < 5; i++) {
    // Parallel execution of zero-argument calls
    const [btcResult, ethResult] = await parallel([btcReader.getPrice, ethReader.getPrice]);

    if (isSuccess(btcResult) && isSuccess(ethResult)) {
      const btcPrice = getData(btcResult);
      const ethPrice = getData(ethResult);

      // Simulate arbitrage calculation
      const ratio = btcPrice.price / ethPrice.price;
      console.log(`    Iteration ${i + 1}: BTC/ETH ratio = ${ratio.toFixed(4)}`);
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  console.log(
    `✅ Completed 5 iterations in ${duration}ms (${(duration / 5).toFixed(2)}ms per iteration)`,
  );

  // =============================================================================
  // DEMO 4: FLEXIBLE CONTEXT BINDING
  // =============================================================================

  console.log("\n🔄 Demo 4: Flexible Context Binding");
  console.log(repeatStr("-", 50));

  // Bind different levels of context
  console.log("🎯 Binding partial context (exchange only)...");
  const exchangeReader = bindContext(reader, { exchange: EXCHANGES.COINGECKO });

  console.log("⚡ Exchange reader with symbol argument...");
  const flexBtcPrice = await exchangeReader.getPrice(SYMBOLS.BTC);
  if (isSuccess(flexBtcPrice)) {
    const price = getData(flexBtcPrice);
    console.log(`✅ Flexible BTC Price: $${price.price.toFixed(2)}`);
  }

  // =============================================================================
  // DEMO 5: ARCHITECTURE BENEFITS
  // =============================================================================

  console.log("\n🏗️ Demo 5: Architecture Benefits");
  console.log(repeatStr("-", 50));

  console.log("✅ Base Class Pattern: DSL workflow inherited from FPBaseMCPReader");
  console.log("✅ Handler Pattern: CoinGeckoFPReader implements handlers only");
  console.log("✅ MCP Lifecycle: Automatic connection management");
  console.log("✅ Error Handling: Functional Result<T> pattern");
  console.log("✅ Type Safety: Full TypeScript support");
  console.log("✅ Performance: Zero-argument calls after context binding");

  // Show status
  const status = reader.getStatus();
  console.log("📊 Reader Status:", status);

  // =============================================================================
  // CLEANUP
  // =============================================================================

  console.log("\n🧹 Cleaning up...");
  await reader.cleanup();
  console.log("✅ Demo completed successfully!");
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

// Run the demo
demonstrateFPv2Approach().catch(console.error);
