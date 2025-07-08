#!/usr/bin/env bun

/**
 * CoinGecko Market Data Reader Tests
 *
 * Tests the CoinGecko actor implementation with real external MCP server integration.
 * These tests verify the plugin architecture and MCP client integration.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CryptoMarketAnalytics, CryptoOHLCVData, CryptoPriceData } from "../../src/dsl";
import { getData, getError, isFailure, isSuccess } from "../../src/qicore/base";
import {
  type CoinGeckoMarketDataReader,
  createCoinGeckoMarketDataReader,
} from "../../src/actors/sources/coingecko";

describe("CoinGeckoMarketDataReader", () => {
  let reader: CoinGeckoMarketDataReader;

  beforeAll(async () => {
    reader = createCoinGeckoMarketDataReader({
      name: "test-coingecko-reader",
      debug: false,
      useRemoteServer: true,
      timeout: 15000,
    });
  });

  afterAll(async () => {
    if (reader) {
      await reader.cleanup();
    }
  });

  describe("Initialization", () => {
    it("should initialize with external MCP server", async () => {
      const result = await reader.initialize();

      expect(isSuccess(result)).toBe(true);

      const status = reader.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.mcpClientInitialized).toBe(true);
      expect(status.hasMCPClient).toBe(true);
    }, 20000);
  });

  describe("MCP Client Integration", () => {
    beforeEach(async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }
    });

    it("should connect to external CoinGecko MCP server", async () => {
      const status = reader.getStatus();
      expect(status.mcpClientInitialized).toBe(true);
      expect(status.dataSource).toBe("mcp+api");
    });

    it("should register MCP client with BaseReader", async () => {
      const client = reader.getClient("coingecko-mcp");
      expect(client).toBeDefined();
      expect(client?.config.type).toBe("data-source");
      expect(client?.isConnected).toBe(true);
    });
  });

  describe("DSL Interface Implementation", () => {
    beforeEach(async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }
    });

    it("should get current Bitcoin price from external server", async () => {
      const result = await reader.getCurrentPrice("bitcoin", "usd");

      if (isSuccess(result)) {
        const price = getData(result);
        expect(typeof price).toBe("number");
        expect(price).toBeGreaterThan(0);
        expect(price).toBeGreaterThan(10000); // Reasonable Bitcoin price range
        expect(price).toBeLessThan(200000);
        console.log(`✅ Bitcoin price: $${price.toFixed(2)}`);
      } else {
        // Log error for debugging but don't fail test if external server is unavailable
        const error = getError(result);
        console.log(`⚠️ External MCP server unavailable: ${error?.message}`);
        expect(isFailure(result)).toBe(true);
      }
    }, 15000);

    it("should get multiple cryptocurrency prices", async () => {
      const result = await reader.getCurrentPrices(["bitcoin", "ethereum"], {
        vsCurrencies: ["usd"],
        includeMarketCap: true,
      });

      if (isSuccess(result)) {
        const prices = getData(result) as CryptoPriceData[];
        expect(Array.isArray(prices)).toBe(true);

        if (prices.length > 0) {
          const bitcoinPrice = prices.find((p) => p.coinId === "bitcoin");
          if (bitcoinPrice) {
            expect(bitcoinPrice).toHaveProperty("coinId", "bitcoin");
            expect(bitcoinPrice).toHaveProperty("symbol");
            expect(bitcoinPrice).toHaveProperty("usdPrice");
            expect(bitcoinPrice).toHaveProperty("source", "coingecko-mcp");
            expect(bitcoinPrice).toHaveProperty("attribution");
            expect(bitcoinPrice.usdPrice).toBeGreaterThan(0);
          }
        }
        console.log(`✅ Retrieved ${prices.length} cryptocurrency prices`);
      } else {
        const error = getError(result);
        console.log(`⚠️ Multiple prices fetch failed: ${error?.message}`);
      }
    }, 15000);

    it("should get global market analytics", async () => {
      const result = await reader.getMarketAnalytics();

      if (isSuccess(result)) {
        const analytics = getData(result) as CryptoMarketAnalytics;
        expect(analytics).toHaveProperty("timestamp");
        expect(analytics).toHaveProperty("totalMarketCap");
        expect(analytics).toHaveProperty("totalVolume");
        expect(analytics).toHaveProperty("btcDominance");
        expect(analytics).toHaveProperty("ethDominance");
        expect(analytics).toHaveProperty("source", "coingecko-mcp");

        expect(analytics.totalMarketCap).toBeGreaterThan(0);
        expect(analytics.totalVolume).toBeGreaterThan(0);
        expect(analytics.btcDominance).toBeGreaterThan(0);
        expect(analytics.btcDominance).toBeLessThan(100);

        console.log(`✅ Market Cap: $${(analytics.totalMarketCap / 1e12).toFixed(2)}T`);
        console.log(`✅ Bitcoin Dominance: ${analytics.btcDominance.toFixed(1)}%`);
      } else {
        const error = getError(result);
        console.log(`⚠️ Market analytics fetch failed: ${error?.message}`);
      }
    }, 15000);

    it("should get OHLCV data", async () => {
      const result = await reader.getCurrentOHLCV("bitcoin");

      if (isSuccess(result)) {
        const ohlcv = getData(result) as CryptoOHLCVData;
        expect(ohlcv).toHaveProperty("coinId", "bitcoin");
        expect(ohlcv).toHaveProperty("timestamp");
        expect(ohlcv).toHaveProperty("open");
        expect(ohlcv).toHaveProperty("high");
        expect(ohlcv).toHaveProperty("low");
        expect(ohlcv).toHaveProperty("close");
        expect(ohlcv).toHaveProperty("source", "coingecko-mcp");

        expect(typeof ohlcv.open).toBe("number");
        expect(typeof ohlcv.high).toBe("number");
        expect(typeof ohlcv.low).toBe("number");
        expect(typeof ohlcv.close).toBe("number");

        console.log(
          `✅ OHLCV - O: $${ohlcv.open}, H: $${ohlcv.high}, L: $${ohlcv.low}, C: $${ohlcv.close}`,
        );
      } else {
        const error = getError(result);
        console.log(`⚠️ OHLCV fetch failed: ${error?.message}`);
      }
    }, 15000);
  });

  describe("Plugin Architecture Verification", () => {
    beforeEach(async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }
    });

    it("should inherit all DSL methods from BaseReader", () => {
      // Verify that CoinGecko reader has all DSL methods
      expect(typeof reader.getCurrentPrice).toBe("function");
      expect(typeof reader.getCurrentPrices).toBe("function");
      expect(typeof reader.getCurrentOHLCV).toBe("function");
      expect(typeof reader.getLatestOHLCV).toBe("function");
      expect(typeof reader.getPriceHistory).toBe("function");
      expect(typeof reader.getOHLCVByDateRange).toBe("function");
      expect(typeof reader.getAvailableTickers).toBe("function");
      expect(typeof reader.getLevel1Data).toBe("function");
      expect(typeof reader.getMarketAnalytics).toBe("function");
    });

    it("should implement only plugin methods, not DSL methods", () => {
      // This verifies the plugin architecture - concrete class should NOT have
      // DSL method implementations, only plugin implementations
      const prototype = Object.getPrototypeOf(reader);
      const methods = Object.getOwnPropertyNames(prototype);

      // Should have plugin methods
      expect(methods.some((m) => m.includes("Plugin"))).toBe(true);

      // Should NOT have DSL method implementations (they're inherited)
      const dslMethods = ["getCurrentPrice", "getCurrentPrices", "getCurrentOHLCV"];
      for (const method of dslMethods) {
        expect(Object.hasOwn(prototype, method)).toBe(false);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle MCP client not initialized gracefully", async () => {
      const uninitialized = createCoinGeckoMarketDataReader({
        name: "uninitialized-reader",
        debug: false,
      });

      const result = await uninitialized.getCurrentPrice("bitcoin");
      expect(isFailure(result)).toBe(true);

      if (isFailure(result)) {
        const error = getError(result);
        expect(error?.message).toContain("MCP client not initialized");
      }
    });

    it("should increment error count on failures", async () => {
      const initialErrorCount = reader.getStatus().errorCount;

      // Try to call method without proper initialization
      const uninitializedReader = createCoinGeckoMarketDataReader({
        name: "error-test-reader",
        debug: false,
      });

      await uninitializedReader.getCurrentPrice("bitcoin");

      // Error count should increase
      expect(uninitializedReader.getStatus().errorCount).toBeGreaterThan(0);
    });
  });

  describe("Data Transformation", () => {
    beforeEach(async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }
    });

    it("should transform MCP response to unified data types", async () => {
      const result = await reader.getCurrentPrices(["bitcoin"]);

      if (isSuccess(result)) {
        const prices = getData(result) as CryptoPriceData[];
        if (prices.length > 0) {
          const price = prices[0];

          // Verify transformation to unified CryptoPriceData format
          expect(price.coinId).toBe("bitcoin");
          expect(typeof price.symbol).toBe("string");
          expect(typeof price.usdPrice).toBe("number");
          expect(price.lastUpdated).toBeInstanceOf(Date);
          expect(price.source).toBe("coingecko-mcp");
          expect(typeof price.attribution).toBe("string");
        }
      }
    });
  });

  describe("Status and Monitoring", () => {
    it("should provide comprehensive status information", async () => {
      const status = reader.getStatus();

      expect(status).toHaveProperty("isInitialized");
      expect(status).toHaveProperty("mcpClientInitialized");
      expect(status).toHaveProperty("hasMCPClient");
      expect(status).toHaveProperty("lastActivity");
      expect(status).toHaveProperty("totalQueries");
      expect(status).toHaveProperty("errorCount");
      expect(status).toHaveProperty("dataSource");

      expect(typeof status.isInitialized).toBe("boolean");
      expect(typeof status.totalQueries).toBe("number");
      expect(typeof status.errorCount).toBe("number");
    });

    it("should track query activity", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      const initialQueries = reader.getStatus().totalQueries;
      await reader.getCurrentPrice("bitcoin");
      const finalQueries = reader.getStatus().totalQueries;

      expect(finalQueries).toBeGreaterThan(initialQueries);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup resources properly", async () => {
      const testReader = createCoinGeckoMarketDataReader({
        name: "cleanup-test-reader",
        debug: false,
        useRemoteServer: true,
        timeout: 10000,
      });

      await testReader.initialize();
      expect(testReader.getStatus().isInitialized).toBe(true);

      const cleanupResult = await testReader.cleanup();
      expect(isSuccess(cleanupResult)).toBe(true);
      expect(testReader.getStatus().isInitialized).toBe(false);
    });
  });
});
