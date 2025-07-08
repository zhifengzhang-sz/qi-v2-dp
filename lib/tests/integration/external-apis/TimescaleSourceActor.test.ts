#!/usr/bin/env bun

/**
 * TimescaleDB Source Actor - Integration Tests
 *
 * Tests the TimescaleDB source actor with real database connections.
 * These tests verify time-series data reading from actual TimescaleDB instances.
 * 
 * EXPECTED TO FAIL until TimescaleDB is properly configured with historical data.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("TimescaleSourceActor - External Integration", () => {
  let reader: any; // Will fail at import if actor doesn't exist

  beforeAll(async () => {
    try {
      // This import should exist but may fail
      const { createTimescaleMarketDataReader } = await import("../../../src/actors/sources/timescale-mcp");
      
      reader = createTimescaleMarketDataReader({
        name: "integration-test-timescale-source",
        debug: false,
        connection: {
          host: "localhost",
          port: 5432,
          database: "crypto_data_test",
          user: "postgres",
          password: "password",
          ssl: false,
        },
        tables: {
          prices: "crypto_prices",
          ohlcv: "crypto_ohlcv", 
          analytics: "market_analytics",
        },
        cacheTimeout: 60000,
      });
    } catch (error) {
      console.error("❌ Failed to import TimescaleSourceActor:", error);
      throw new Error(`Missing TimescaleDB Source Actor implementation: ${error}`);
    }
  });

  afterAll(async () => {
    if (reader) {
      await reader.cleanup();
    }
  });

  describe("Database Connection", () => {
    it("should connect to TimescaleDB instance for reading", async () => {
      // This SHOULD FAIL until database is running
      const result = await reader.initialize();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: TimescaleDB not available:", error?.message);
        throw new Error(`TimescaleDB connection failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      expect(reader.getStatus().isInitialized).toBe(true);
    }, 30000);

    it("should verify read access to hypertables", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until hypertables exist with data
      const result = await reader.verifyDataAccess();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: No data access to hypertables:", error?.message);
        throw new Error(`Data access verification failed: ${error?.message}`);
      }

      const access = getData(result);
      expect(access).toHaveProperty("canReadPrices", true);
      expect(access).toHaveProperty("canReadOHLCV", true);
      expect(access).toHaveProperty("canReadAnalytics", true);
    });
  });

  describe("Historical Data Queries", () => {
    it("should read current cryptocurrency prices from TimescaleDB", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until historical data exists
      const result = await reader.getCurrentPrice("bitcoin");
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: No historical price data:", error?.message);
        throw new Error(`Current price query failed: ${error?.message}`);
      }

      const price = getData(result);
      expect(typeof price).toBe("number");
      expect(price).toBeGreaterThan(0);
    }, 15000);

    it("should query price history with time ranges", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      // This SHOULD FAIL until historical data is populated
      const result = await reader.getPriceHistory("bitcoin", { startTime, endTime });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: No price history data:", error?.message);
        throw new Error(`Price history query failed: ${error?.message}`);
      }

      const history = getData(result);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      // Verify time-series structure
      expect(history[0]).toHaveProperty("timestamp");
      expect(history[0]).toHaveProperty("usdPrice");
      expect(history[0].timestamp instanceof Date).toBe(true);
    });

    it("should query OHLCV data with time aggregations", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      // This SHOULD FAIL until OHLCV data is populated
      const result = await reader.getOHLCVByDateRange("bitcoin", { 
        startTime, 
        endTime, 
        interval: "1h" 
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: No OHLCV data:", error?.message);
        throw new Error(`OHLCV query failed: ${error?.message}`);
      }

      const ohlcv = getData(result);
      expect(Array.isArray(ohlcv)).toBe(true);
      expect(ohlcv.length).toBeGreaterThan(0);
      
      // Verify OHLCV structure
      expect(ohlcv[0]).toHaveProperty("open");
      expect(ohlcv[0]).toHaveProperty("high");
      expect(ohlcv[0]).toHaveProperty("low");
      expect(ohlcv[0]).toHaveProperty("close");
      expect(ohlcv[0]).toHaveProperty("volume");
    });
  });

  describe("Time-Series Analytics", () => {
    it("should perform time-bucket aggregations", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until continuous aggregates are configured
      const result = await reader.getTimeBucketAnalytics("bitcoin", {
        bucket: "1 hour",
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(),
        metrics: ["avg", "max", "min", "stddev"],
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Time-bucket aggregations not available:", error?.message);
        throw new Error(`Time-bucket analytics failed: ${error?.message}`);
      }

      const analytics = getData(result);
      expect(Array.isArray(analytics)).toBe(true);
      expect(analytics[0]).toHaveProperty("bucket_time");
      expect(analytics[0]).toHaveProperty("avg_price");
    });

    it("should query market analytics historical data", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until market analytics data exists
      const result = await reader.getMarketAnalytics();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: No market analytics data:", error?.message);
        throw new Error(`Market analytics query failed: ${error?.message}`);
      }

      const analytics = getData(result);
      expect(analytics).toHaveProperty("totalMarketCap");
      expect(analytics).toHaveProperty("totalVolume");
      expect(analytics).toHaveProperty("btcDominance");
      expect(analytics.totalMarketCap).toBeGreaterThan(0);
    });

    it("should support materialized view queries", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until materialized views are created
      const result = await reader.queryMaterializedView("daily_price_summary", {
        coin_id: "bitcoin",
        date_range: 30,
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Materialized views not configured:", error?.message);
        throw new Error(`Materialized view query failed: ${error?.message}`);
      }

      const summary = getData(result);
      expect(Array.isArray(summary)).toBe(true);
    });
  });

  describe("Handler Architecture", () => {
    it("should inherit DSL methods from BaseReader", () => {
      expect(typeof reader.getCurrentPrice).toBe("function");
      expect(typeof reader.getCurrentPrices).toBe("function");
      expect(typeof reader.getPriceHistory).toBe("function");
      expect(typeof reader.getOHLCVByDateRange).toBe("function");
      expect(typeof reader.getMarketAnalytics).toBe("function");
    });

    it("should implement TimescaleDB-specific handlers", () => {
      const prototype = Object.getPrototypeOf(reader);
      const methods = Object.getOwnPropertyNames(prototype);
      
      // Should have TimescaleDB-specific handlers
      expect(methods.some(m => m.includes("Timescale") || m.includes("TimeBucket"))).toBe(true);
    });
  });

  describe("Performance Optimization", () => {
    it("should use connection pooling", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      const status = reader.getStatus();
      expect(status).toHaveProperty("connectionPool");
      expect(status.connectionPool).toHaveProperty("totalConnections");
      expect(status.connectionPool).toHaveProperty("idleConnections");
    });

    it("should implement query result caching", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until caching is configured
      const startTime = performance.now();
      const result1 = await reader.getCurrentPrice("bitcoin");
      const firstQueryTime = performance.now() - startTime;

      const startTime2 = performance.now();
      const result2 = await reader.getCurrentPrice("bitcoin");
      const secondQueryTime = performance.now() - startTime2;

      if (isSuccess(result1) && isSuccess(result2)) {
        // Second query should be faster due to caching
        expect(secondQueryTime).toBeLessThan(firstQueryTime);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle database unavailable gracefully", async () => {
      const { createTimescaleMarketDataReader } = await import("../../../src/actors/sources/timescale-mcp");
      
      const unreachableReader = createTimescaleMarketDataReader({
        name: "unreachable-test",
        connection: {
          host: "unreachable-host",
          port: 9999,
          database: "nonexistent",
          user: "invalid",
          password: "invalid",
        },
        tables: { prices: "test" },
      });

      const result = await unreachableReader.initialize();
      expect(isFailure(result)).toBe(true);
      
      const error = getError(result);
      expect(error?.message).toMatch(/connection|database|host/i);
    });

    it("should handle empty result sets gracefully", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // Query for non-existent coin
      const result = await reader.getCurrentPrice("nonexistent-coin-12345");
      
      if (isFailure(result)) {
        const error = getError(result);
        expect(error?.message).toMatch(/not found|no data|empty/i);
      } else {
        // If successful, should return null or empty result
        const price = getData(result);
        expect(price).toBeNull();
      }
    });

    it("should handle query timeout gracefully", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL with timeout on long-running query
      const result = await reader.runCustomQuery(`
        SELECT pg_sleep(60), * FROM crypto_prices 
        WHERE coin_id = 'bitcoin' 
        ORDER BY timestamp DESC
      `, { timeout: 1000 }); // 1 second timeout

      expect(isFailure(result)).toBe(true);
      
      const error = getError(result);
      expect(error?.message).toMatch(/timeout|cancelled/i);
    });
  });
});