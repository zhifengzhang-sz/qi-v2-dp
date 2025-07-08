#!/usr/bin/env bun

import { describe, expect, it } from "vitest";
import { createCoinGeckoMarketDataReaderWithMCP } from "../../../../src/actors/sources/coingecko/MarketDataReaderWithMCP";

describe("CoinGecko MCP Actor - REAL Integration Test", () => {
  it("should get real Bitcoin price from CoinGecko API", async () => {
    console.log("🧪 Testing REAL CoinGecko connection...");

    // Create MCP Actor with real server
    const reader = createCoinGeckoMarketDataReaderWithMCP({
      name: "real-test-reader",
      debug: true,
      useRemoteServer: true,
      environment: "free",
    });

    try {
      // Initialize
      console.log("🔗 Initializing...");
      const initResult = await reader.initialize();

      expect(initResult._tag).toBe("Right");

      // Get real Bitcoin price
      console.log("💰 Getting real Bitcoin price...");
      const priceResult = await reader.getCurrentPrice("bitcoin", "usd");

      if (priceResult._tag === "Right") {
        console.log(`✅ Bitcoin price: $${priceResult.right}`);
        expect(priceResult.right).toBeGreaterThan(0);
        expect(typeof priceResult.right).toBe("number");
      } else {
        console.error("❌ Price fetch failed:", priceResult.left);
        throw new Error(`Failed to get Bitcoin price: ${priceResult.left.message}`);
      }

      // Check status
      const status = reader.getStatus();
      console.log("📊 Status:", status);
      expect(status.isInitialized).toBe(true);
      expect(status.totalQueries).toBeGreaterThan(0);
    } finally {
      // Always cleanup
      console.log("🛑 Cleaning up...");
      await reader.cleanup();
    }
  }, 30000); // 30 second timeout for real API calls
});
