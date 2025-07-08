#!/usr/bin/env bun

/**
 * TimescaleDB Target Actor - Integration Tests
 *
 * Tests the TimescaleDB target actor with real database connections.
 * These tests verify time-series data storage to actual TimescaleDB instances.
 *
 * EXPECTED TO FAIL until TimescaleDB is properly configured and running.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("TimescaleTargetActor - External Integration", () => {
  let writer: any; // Will fail at import if actor doesn't exist

  beforeAll(async () => {
    try {
      // This import should exist but may fail
      const { createTimescaleMarketDataWriter } = await import(
        "../../../src/actors/targets/timescale"
      );

      writer = createTimescaleMarketDataWriter({
        name: "integration-test-timescale-target",
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
        batchSize: 100,
        flushInterval: 5000,
      });
    } catch (error) {
      console.error("❌ Failed to import TimescaleTargetActor:", error);
      throw new Error(`Missing TimescaleDB Target Actor implementation: ${error}`);
    }
  });

  afterAll(async () => {
    if (writer) {
      await writer.cleanup();
    }
  });

  describe("Database Connection", () => {
    it("should connect to TimescaleDB instance", async () => {
      // This SHOULD FAIL until database is running
      const result = await writer.initialize();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: TimescaleDB not available:", error?.message);
        throw new Error(`TimescaleDB connection failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      expect(writer.getStatus().isInitialized).toBe(true);
    }, 30000);

    it("should verify hypertables exist", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until hypertables are created
      const result = await writer.verifyTables();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Hypertables not created:", error?.message);
        throw new Error(`Hypertable verification failed: ${error?.message}`);
      }

      const tables = getData(result);
      expect(tables).toHaveProperty("crypto_prices");
      expect(tables).toHaveProperty("crypto_ohlcv");
      expect(tables).toHaveProperty("market_analytics");
    });

    it("should verify TimescaleDB extensions", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until TimescaleDB extension is installed
      const result = await writer.checkExtensions();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: TimescaleDB extensions missing:", error?.message);
        throw new Error(`TimescaleDB extensions not available: ${error?.message}`);
      }

      const extensions = getData(result);
      expect(extensions).toContain("timescaledb");
    });
  });

  describe("Time-Series Data Storage", () => {
    it("should store cryptocurrency price data", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const priceData = {
        coinId: "bitcoin",
        symbol: "BTC",
        usdPrice: 50000,
        lastUpdated: new Date(),
        source: "integration-test",
        attribution: "Test Suite",
      };

      // This SHOULD FAIL until tables are created and accessible
      const result = await writer.publishPrice(priceData);

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Price storage failed:", error?.message);
        throw new Error(`Price storage failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);

      // Verify data was actually stored
      const status = writer.getStatus();
      expect(status.totalStored).toBeGreaterThan(0);
    }, 15000);

    it("should store OHLCV time-series data", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const ohlcvData = {
        coinId: "bitcoin",
        timestamp: new Date(),
        open: 49500,
        high: 50500,
        low: 49000,
        close: 50000,
        volume: 1000000,
        source: "integration-test",
        attribution: "Test Suite",
      };

      // This SHOULD FAIL until OHLCV hypertable is configured
      const result = await writer.publishOHLCV(ohlcvData);

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: OHLCV storage failed:", error?.message);
        throw new Error(`OHLCV storage failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
    });

    it("should handle time-series queries and aggregations", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until continuous aggregates are configured
      const result = await writer.getHourlyAggregates(
        "bitcoin",
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date(),
      );

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Time-series aggregation failed:", error?.message);
        throw new Error(`Time-series aggregation failed: ${error?.message}`);
      }

      const aggregates = getData(result);
      expect(Array.isArray(aggregates)).toBe(true);
    });
  });

  describe("TimescaleDB Features", () => {
    it("should implement time partitioning", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until partitioning is configured
      const result = await writer.getPartitionInfo("crypto_prices");

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Time partitioning not configured:", error?.message);
        throw new Error(`Time partitioning failed: ${error?.message}`);
      }

      const partitions = getData(result);
      expect(partitions).toHaveProperty("interval");
      expect(partitions).toHaveProperty("chunks");
    });

    it("should support compression policies", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until compression is configured
      const result = await writer.checkCompressionPolicies();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Compression policies not configured:", error?.message);
        throw new Error(`Compression policies failed: ${error?.message}`);
      }

      const policies = getData(result);
      expect(Array.isArray(policies)).toBe(true);
    });

    it("should handle retention policies", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until retention is configured
      const result = await writer.checkRetentionPolicies();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Retention policies not configured:", error?.message);
        throw new Error(`Retention policies failed: ${error?.message}`);
      }

      const policies = getData(result);
      expect(Array.isArray(policies)).toBe(true);
    });
  });

  describe("Handler Architecture", () => {
    it("should inherit DSL methods from BaseWriter", () => {
      expect(typeof writer.publishPrice).toBe("function");
      expect(typeof writer.publishPrices).toBe("function");
      expect(typeof writer.publishOHLCV).toBe("function");
      expect(typeof writer.publishMarketAnalytics).toBe("function");
    });

    it("should implement TimescaleDB-specific handlers", () => {
      const prototype = Object.getPrototypeOf(writer);
      const methods = Object.getOwnPropertyNames(prototype);

      // Should have TimescaleDB-specific handlers
      expect(methods.some((m) => m.includes("Timescale") || m.includes("Hypertable"))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle database unavailable gracefully", async () => {
      const { createTimescaleMarketDataWriter } = await import(
        "../../../src/actors/targets/timescale"
      );

      const unreachableWriter = createTimescaleMarketDataWriter({
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

      const result = await unreachableWriter.initialize();
      expect(isFailure(result)).toBe(true);

      const error = getError(result);
      expect(error?.message).toMatch(/connection|database|host/i);
    });

    it("should handle schema validation failures", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL with invalid data
      const invalidData = {
        coinId: null, // Invalid
        symbol: "", // Invalid
        usdPrice: "not-a-number", // Invalid
        lastUpdated: "invalid-date", // Invalid
      };

      const result = await writer.publishPrice(invalidData as any);

      if (isSuccess(result)) {
        throw new Error("Should have failed with invalid data schema");
      }

      const error = getError(result);
      expect(error?.message).toMatch(/schema|validation|invalid|constraint/i);
    });

    it("should handle permission errors", async () => {
      // This SHOULD FAIL until database permissions are configured
      const { createTimescaleMarketDataWriter } = await import(
        "../../../src/actors/targets/timescale"
      );

      const restrictedWriter = createTimescaleMarketDataWriter({
        name: "restricted-test",
        connection: {
          host: "localhost",
          port: 5432,
          database: "crypto_data_test",
          user: "readonly_user", // User with no write permissions
          password: "password",
        },
        tables: { prices: "crypto_prices" },
      });

      const result = await restrictedWriter.initialize();
      if (isSuccess(result)) {
        const publishResult = await restrictedWriter.publishPrice({
          coinId: "test",
          symbol: "TEST",
          usdPrice: 1,
          lastUpdated: new Date(),
          source: "test",
          attribution: "test",
        });

        if (isSuccess(publishResult)) {
          throw new Error("Should have failed with permission error");
        }

        const error = getError(publishResult);
        expect(error?.message).toMatch(/permission|access|denied/i);
      }
    });
  });
});
