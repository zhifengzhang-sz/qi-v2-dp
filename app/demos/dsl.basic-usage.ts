#!/usr/bin/env bun

/**
 * Simple DSL Demo
 *
 * Demonstrates the core DSL data classes and utilities:
 * - Data classes (Price, OHLCV, Level1, MarketSymbol, MarketContext, Exchange)
 * - Time interval utilities
 * - Data immutability and factory methods
 * - Type safety features
 */

import {
  Exchange,
  InstrumentType,
  Level1,
  MarketContext,
  MarketSymbol,
  OHLCV,
  // Data classes
  Price,
  // Time utilities
  TimeInterval,
  createLastNDaysInterval,
  createLastNHoursInterval,
  createTimeInterval,
  getIntervalDurationDays,
  validateTimeInterval,
} from "@qi/core";

// QiCore Result pattern
import { getData, isSuccess } from "@qi/core/base";

// Domain functions (business logic)
import { getMarketId, getMidPrice, getSpread, isCash, isDerivative } from "@qi/dp/domain";

// =============================================================================
// DEMO SETUP
// =============================================================================

console.log("🚀 Simple DSL Demo - Data Classes & Utilities");
console.log("=".repeat(60));

// =============================================================================
// DATA CLASSES DEMO
// =============================================================================

console.log("\n🏗️  Data Classes Demo");
console.log("-".repeat(30));

// Create Exchange
const binanceExchange = Exchange.create("binance", "Binance", "Global", "centralized");
console.log("📊 Exchange:", binanceExchange.toString());

// Create MarketSymbol
const btcSymbol = MarketSymbol.create("BTC/USD", "Bitcoin", "crypto", "USD", InstrumentType.CASH);
console.log("🪙 Symbol:", btcSymbol.toString());

// Create MarketContext
const marketContext = MarketContext.create(binanceExchange, btcSymbol);
console.log("🎯 Context:", marketContext.toString());

// Create Price data
const currentPrice = Price.create(new Date(), 45000.5, 1.5);
console.log("💰 Price:", currentPrice.toString());

// Create OHLCV data
const ohlcvData = OHLCV.create(
  new Date(),
  44500.0, // open
  45200.0, // high
  44300.0, // low
  45000.5, // close
  125.75, // volume
);
console.log("📈 OHLCV:", ohlcvData.toString());

// Create Level1 data
const level1Data = Level1.create(
  new Date(),
  44999.5, // bid price
  0.25, // bid size
  45000.5, // ask price
  0.3, // ask size
);
console.log("📊 Level1:", level1Data.toString());
const spreadResult = getSpread(level1Data);
const midPriceResult = getMidPrice(level1Data);

if (isSuccess(spreadResult) && isSuccess(midPriceResult)) {
  const spread = getData(spreadResult);
  const midPrice = getData(midPriceResult);
  if (spread !== null && midPrice !== null) {
    console.log(`   Spread: $${spread.toFixed(2)}`);
    console.log(`   Mid Price: $${midPrice.toFixed(2)}`);
  } else {
    console.log("   Error: null values returned");
  }
} else {
  console.log("   Error calculating spread or mid price");
}

// =============================================================================
// IMMUTABILITY DEMO
// =============================================================================

console.log("\n🔒 Immutability Demo");
console.log("-".repeat(30));

console.log("Testing data class immutability...");

// Test Price immutability
const originalPrice = currentPrice.price;
try {
  // This should fail at runtime (readonly properties)
  (currentPrice as any).price = 50000;
  console.log("❌ Price was modified! Original:", originalPrice, "New:", currentPrice.price);
} catch (error) {
  console.log("✅ Price immutability maintained:", originalPrice);
}

// Test object equality
const samePrice = Price.create(currentPrice.timestamp, currentPrice.price, currentPrice.size);
const differentPrice = Price.create(new Date(), 46000, 2.0);

console.log("Price equality test:");
console.log("  Same values:", currentPrice.equals(samePrice) ? "✅ Equal" : "❌ Not equal");
console.log(
  "  Different values:",
  currentPrice.equals(differentPrice) ? "❌ Equal" : "✅ Not equal",
);

// =============================================================================
// TIME INTERVALS DEMO
// =============================================================================

console.log("\n⏰ Time Intervals Demo");
console.log("-".repeat(30));

// Create various time intervals
const last24Hours = createLastNHoursInterval(24);
const last7Days = createLastNDaysInterval(7);
const last30Days = createLastNDaysInterval(30);
const customInterval = createTimeInterval(new Date("2024-01-01"), new Date("2024-01-07"));

console.log("📅 Time Intervals:");
console.log(
  "  Last 24 hours:",
  last24Hours.startDate.toISOString(),
  "to",
  last24Hours.endDate.toISOString(),
);
console.log("  Last 7 days:", getIntervalDurationDays(last7Days), "days");
console.log("  Last 30 days:", getIntervalDurationDays(last30Days), "days");
console.log("  Custom interval:", getIntervalDurationDays(customInterval), "days");

// Validate intervals
console.log("\n✅ Interval Validation:");
try {
  validateTimeInterval(last24Hours);
  console.log("  24h interval: Valid");
} catch (error) {
  console.log("  24h interval: Invalid -", (error as Error).message);
}

try {
  const invalidInterval = createTimeInterval(new Date(), new Date(Date.now() - 1000));
  validateTimeInterval(invalidInterval);
  console.log("  Invalid interval: Valid");
} catch (error) {
  console.log("  Invalid interval: Invalid -", (error as Error).message);
}

// =============================================================================
// TYPE SAFETY DEMO
// =============================================================================

console.log("\n🛡️  Type Safety Demo");
console.log("-".repeat(30));

// Demonstrate instrument type checking
console.log("Instrument type checking:");
console.log("  BTC is cash instrument:", isCash(btcSymbol) ? "✅ Yes" : "❌ No");
console.log("  BTC is derivative:", isDerivative(btcSymbol) ? "❌ Yes" : "✅ No");

// Create a derivative instrument
const btcFuture = MarketSymbol.create(
  "BTC-MAR24",
  "Bitcoin March 2024 Future",
  "crypto",
  "USD",
  InstrumentType.FUTURE,
  {
    expirationDate: new Date("2024-03-29"),
    multiplier: 1,
    underlying: "BTC",
  },
);

console.log("  BTC Future is derivative:", isDerivative(btcFuture) ? "✅ Yes" : "❌ No");
console.log("  BTC Future expiration:", btcFuture.contractDetails?.expirationDate?.toDateString());

// =============================================================================
// MARKET CONTEXT DEMO
// =============================================================================

console.log("\n🎯 Market Context Demo");
console.log("-".repeat(30));

// Create different market contexts
const coinbaseContext = MarketContext.create(
  Exchange.create("coinbase", "Coinbase Pro", "US", "centralized"),
  btcSymbol,
);

const binanceContext = MarketContext.create(binanceExchange, btcSymbol);

console.log("Market contexts:");
console.log("  Coinbase:", getMarketId(coinbaseContext));
console.log("  Binance:", getMarketId(binanceContext));
console.log("  Same context:", coinbaseContext.equals(binanceContext) ? "✅ Yes" : "❌ No");

// =============================================================================
// DEMO SUMMARY
// =============================================================================

console.log("\n🎉 Demo Summary");
console.log("=".repeat(60));
console.log("✅ Data classes created successfully");
console.log("✅ Immutability enforced");
console.log("✅ Time intervals working");
console.log("✅ Type safety demonstrated");
console.log("✅ Market contexts functional");
console.log("\n📋 Key Features:");
console.log("  • Factory methods for all data classes");
console.log("  • Readonly properties for immutability");
console.log("  • Equality methods for comparisons");
console.log("  • Time interval utilities");
console.log("  • Type-safe instrument classification");
console.log("  • Professional toString() methods");

console.log("\n🔗 Next Steps:");
console.log("  • Set up MCP servers for real data");
console.log("  • Use actors for live market data");
console.log("  • Implement streaming capabilities");
console.log("  • Add database persistence");

console.log("\n🚀 DSL System Ready for Production!");
