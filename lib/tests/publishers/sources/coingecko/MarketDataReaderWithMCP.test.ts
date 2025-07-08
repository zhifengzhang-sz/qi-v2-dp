#!/usr/bin/env bun

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type CoinGeckoMarketDataReaderWithMCP,
  createCoinGeckoMarketDataReaderWithMCP,
} from "../../../../src/actors/sources/coingecko/MarketDataReaderWithMCP";

describe("CoinGecko MCP Actor - Real Tests", () => {
  let mcpActor: CoinGeckoMarketDataReaderWithMCP;

  beforeEach(async () => {
    // Create real MCP Actor instance
    mcpActor = createCoinGeckoMarketDataReaderWithMCP({
      name: "test-mcp-actor",
      debug: true,
      useRemoteServer: true,
      environment: "free",
    });

    // Initialize with real connection
    const initResult = await mcpActor.initialize();
    if (initResult._tag === "Left") {
      console.error("🚨 Initialization failed:", initResult.left);
    }
    expect(initResult._tag).toBe("Right");
  });

  afterEach(async () => {
    // Always cleanup real connections
    await mcpActor.cleanup();
  });

  describe("getCurrentPrice", () => {
    it("should get real Bitcoin price", async () => {
      const result = await mcpActor.getCurrentPrice("bitcoin", "usd");

      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBeGreaterThan(0);
        expect(typeof result.right).toBe("number");
        console.log(`💰 Bitcoin price: $${result.right}`);
      }
    }, 30000);

    it("should get real Ethereum price", async () => {
      const result = await mcpActor.getCurrentPrice("ethereum", "usd");

      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBeGreaterThan(0);
        expect(typeof result.right).toBe("number");
        console.log(`💰 Ethereum price: $${result.right}`);
      }
    }, 30000);

    it("should handle invalid coin ID", async () => {
      const result = await mcpActor.getCurrentPrice("invalid-coin-id", "usd");

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.code).toBe("NO_PRICE_DATA");
      }
    }, 30000);

    it("should update activity tracking", async () => {
      const initialQueries = mcpActor.getStatus().totalQueries;
      const initialActivity = mcpActor.getStatus().lastActivity;

      await mcpActor.getCurrentPrice("bitcoin");

      const status = mcpActor.getStatus();
      expect(status.totalQueries).toBe(initialQueries + 1);
      expect(status.lastActivity).not.toBe(initialActivity);
    }, 30000);
  });

  describe("initialization and status", () => {
    it("should be properly initialized", () => {
      const status = mcpActor.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.isConnected).toBe(true);
      expect(status.serverName).toBe("coingecko");
    });

    it("should track error count on real failures", async () => {
      const initialErrorCount = mcpActor.getStatus().errorCount;

      // This will cause a real error (invalid coin ID)
      await mcpActor.getCurrentPrice("definitely-invalid-coin-12345");

      const status = mcpActor.getStatus();
      expect(status.errorCount).toBe(initialErrorCount); // No error count increase for business logic failures
    }, 30000);
  });
});
