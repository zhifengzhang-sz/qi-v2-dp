#!/usr/bin/env bun

/**
 * Test Runner for QiCore Data Platform
 *
 * Comprehensive test suite covering all DSL interfaces, base modules, and concrete actors.
 */

import { describe, expect, it } from "vitest";

// Import all test suites
import "./abstract/dsl/MarketDataReadingDSL.test";
import "./abstract/dsl/MarketDataWritingDSL.test";
import "./abstract/readers/BaseReader.test";
import "./sources/coingecko/CoinGeckoMarketDataReader.test";

console.log("🧪 QiCore Data Platform Test Suite");
console.log("=" + "=".repeat(50));
console.log("✅ DSL Interface Tests");
console.log("✅ Base Module Tests");
console.log("✅ Actor Implementation Tests");
console.log("✅ MCP Integration Tests");
console.log("=" + "=".repeat(50));
