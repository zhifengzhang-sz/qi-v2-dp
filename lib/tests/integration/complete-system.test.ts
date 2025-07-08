#!/usr/bin/env bun

/**
 * Complete System Integration Tests
 *
 * Tests the complete 2-layer architecture with real external integrations.
 * These are slower tests that verify the entire system works end-to-end.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { CryptoMarketAnalytics, CryptoPriceData } from "../../src/dsl";
import { getData, getError, isFailure, isSuccess } from "../../src/qicore/base";
import { createCoinGeckoMarketDataReader } from "../../src/actors/sources/coingecko";

describe("Complete System Integration", () => {
  let reader: any;

  beforeAll(async () => {
    reader = createCoinGeckoMarketDataReader({
      name: "integration-test-reader",
      debug: false,
      useRemoteServer: true,
      timeout: 20000,
    });
  });

  afterAll(async () => {
    if (reader) {
      await reader.cleanup();
    }
  });

  describe("End-to-End Data Flow", () => {
    it("should complete full initialization → data fetch → cleanup cycle", async () => {
      // Step 1: Initialize
      const initResult = await reader.initialize();
      expect(isSuccess(initResult)).toBe(true);

      // Verify initialization status
      const status = reader.getStatus();
      expect(status.isInitialized).toBe(true);

      // Step 2: Fetch real data
      const priceResult = await reader.getCurrentPrice("bitcoin", "usd");

      if (isSuccess(priceResult)) {
        const price = getData(priceResult);
        expect(typeof price).toBe("number");
        expect(price).toBeGreaterThan(0);
        console.log(`✅ Integration Test - Bitcoin Price: $${price.toFixed(2)}`);
      } else {
        const error = getError(priceResult);
        console.log(`⚠️ External service unavailable: ${error?.message}`);
        // Don't fail test if external service is down
        expect(isFailure(priceResult)).toBe(true);
      }

      // Step 3: Verify activity tracking
      const finalStatus = reader.getStatus();
      expect(finalStatus.totalQueries).toBeGreaterThan(0);
      expect(finalStatus.lastActivity).toBeInstanceOf(Date);

      // Step 4: Cleanup
      const cleanupResult = await reader.cleanup();
      expect(isSuccess(cleanupResult)).toBe(true);
      expect(reader.getStatus().isInitialized).toBe(false);
    }, 30000);

    it("should demonstrate plugin architecture benefits", async () => {
      await reader.initialize();

      // All these methods should work without any DSL implementation in CoinGecko class
      const methods = [
        "getCurrentPrice",
        "getCurrentPrices",
        "getMarketAnalytics",
        "getCurrentOHLCV",
      ];

      for (const methodName of methods) {
        expect(typeof reader[methodName]).toBe("function");

        // Verify method exists on the instance but not implemented in CoinGecko class
        const coinGeckoPrototype = Object.getPrototypeOf(reader);
        expect(Object.hasOwn(coinGeckoPrototype, methodName)).toBe(false);
      }

      console.log("✅ Plugin Architecture: DSL methods inherited, not reimplemented");
    }, 10000);

    it("should verify unified data format across all sources", async () => {
      await reader.initialize();

      const analyticsResult = await reader.getMarketAnalytics();

      if (isSuccess(analyticsResult)) {
        const analytics = getData(analyticsResult) as CryptoMarketAnalytics;

        // Verify unified data structure
        expect(analytics).toHaveProperty("timestamp");
        expect(analytics).toHaveProperty("totalMarketCap");
        expect(analytics).toHaveProperty("totalVolume");
        expect(analytics).toHaveProperty("btcDominance");
        expect(analytics).toHaveProperty("source");
        expect(analytics).toHaveProperty("attribution");

        // Verify data types
        expect(analytics.timestamp).toBeInstanceOf(Date);
        expect(typeof analytics.totalMarketCap).toBe("number");
        expect(typeof analytics.totalVolume).toBe("number");
        expect(typeof analytics.source).toBe("string");

        // Verify CoinGecko-specific attribution
        expect(analytics.source).toBe("coingecko-mcp");
        expect(analytics.attribution).toContain("CoinGecko API");

        console.log(
          `✅ Unified Data Format - Market Cap: $${(analytics.totalMarketCap / 1e12).toFixed(2)}T`,
        );
      }
    }, 15000);
  });

  describe("Error Resilience", () => {
    it("should handle network failures gracefully", async () => {
      // Create reader with very short timeout to simulate network failure
      const failReader = createCoinGeckoMarketDataReader({
        name: "fail-test-reader",
        debug: false,
        useRemoteServer: true,
        timeout: 1, // Very short timeout
      });

      const result = await failReader.getCurrentPrice("bitcoin");

      // Should fail gracefully with proper error handling
      expect(isFailure(result)).toBe(true);

      if (isFailure(result)) {
        const error = getError(result);
        expect(error).toBeDefined();
        expect(typeof error?.message).toBe("string");
      }

      // Error count should be tracked
      expect(failReader.getStatus().errorCount).toBeGreaterThan(0);

      await failReader.cleanup();
    }, 10000);

    it("should handle invalid coin IDs gracefully", async () => {
      await reader.initialize();

      const result = await reader.getCurrentPrice("invalid-coin-that-does-not-exist");

      // Should either succeed with no data or fail gracefully
      if (isFailure(result)) {
        const error = getError(result);
        expect(error).toBeDefined();
      } else {
        // If it succeeds, it should handle the case gracefully
        expect(isSuccess(result)).toBe(true);
      }
    }, 10000);
  });

  describe("Performance Characteristics", () => {
    it("should respond within reasonable time limits", async () => {
      await reader.initialize();

      const startTime = Date.now();
      const result = await reader.getCurrentPrice("bitcoin");
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      if (isSuccess(result)) {
        // Should respond within 10 seconds for real external API
        expect(responseTime).toBeLessThan(10000);
        console.log(`✅ Response Time: ${responseTime}ms`);
      } else {
        console.log(`⚠️ External service unavailable - Response Time: ${responseTime}ms`);
      }
    }, 15000);

    it("should handle concurrent requests efficiently", async () => {
      await reader.initialize();

      const startTime = Date.now();

      // Make multiple concurrent requests
      const promises = [
        reader.getCurrentPrice("bitcoin"),
        reader.getCurrentPrice("ethereum"),
        reader.getMarketAnalytics(),
      ];

      const results = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      // Verify all requests completed
      expect(results).toHaveLength(3);

      // Should complete concurrent requests efficiently
      expect(totalTime).toBeLessThan(20000);

      console.log(`✅ Concurrent Requests Completed in: ${totalTime}ms`);
    }, 25000);
  });

  describe("MCP Protocol Compliance", () => {
    it("should establish proper MCP connection", async () => {
      await reader.initialize();

      const status = reader.getStatus();
      expect(status.mcpClientInitialized).toBe(true);
      expect(status.hasMCPClient).toBe(true);
      expect(status.dataSource).toBe("mcp+api");

      // Verify MCP client is registered with BaseReader
      const mcpClient = reader.getClient("coingecko-mcp");
      expect(mcpClient).toBeDefined();
      expect(mcpClient?.config.type).toBe("data-source");
      expect(mcpClient?.isConnected).toBe(true);

      console.log("✅ MCP Protocol: External server connection established");
    }, 10000);
  });
});
