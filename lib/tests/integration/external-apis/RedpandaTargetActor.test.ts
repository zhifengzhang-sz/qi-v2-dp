#!/usr/bin/env bun

/**
 * Redpanda Target Actor - Integration Tests
 *
 * Tests the Redpanda target actor with real Kafka cluster connections.
 * These tests verify streaming data publishing to actual Redpanda clusters.
 *
 * EXPECTED TO FAIL until Redpanda cluster is properly configured and running.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("RedpandaTargetActor - External Integration", () => {
  let writer: any; // Will fail at import if actor doesn't exist

  beforeAll(async () => {
    try {
      // This import should exist but may fail
      const { createRedpandaMarketDataWriter } = await import(
        "../../../src/actors/targets/redpanda"
      );

      writer = createRedpandaMarketDataWriter({
        name: "integration-test-redpanda-target",
        debug: false,
        brokers: ["localhost:19092"], // Test broker
        topics: {
          prices: "crypto-prices",
          analytics: "market-analytics",
          ohlcv: "ohlcv-data",
        },
        batchSize: 100,
        flushInterval: 5000,
      });
    } catch (error) {
      console.error("❌ Failed to import RedpandaTargetActor:", error);
      throw new Error(`Missing Redpanda Target Actor implementation: ${error}`);
    }
  });

  afterAll(async () => {
    if (writer) {
      await writer.cleanup();
    }
  });

  describe("Kafka Producer Connection", () => {
    it("should connect to Redpanda Kafka cluster as producer", async () => {
      // This SHOULD FAIL until cluster is running
      const result = await writer.initialize();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Redpanda cluster not available:", error?.message);
        throw new Error(`Redpanda cluster connection failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      expect(writer.getStatus().isInitialized).toBe(true);
    }, 30000);

    it("should verify topic availability for publishing", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until topics are created
      const result = await writer.verifyTopics();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Topics not available:", error?.message);
        throw new Error(`Topic verification failed: ${error?.message}`);
      }

      const status = getData(result);
      expect(status.topics).toHaveProperty("crypto-prices");
      expect(status.topics).toHaveProperty("market-analytics");
    });
  });

  describe("Market Data Publishing", () => {
    it("should publish cryptocurrency price data", async () => {
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

      // This SHOULD FAIL until Kafka is properly configured
      const result = await writer.publishPrice(priceData);

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Price publishing failed:", error?.message);
        throw new Error(`Price publishing failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);

      // Verify message was actually sent
      const status = writer.getStatus();
      expect(status.totalPublished).toBeGreaterThan(0);
    }, 15000);

    it("should publish batch market analytics", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const analyticsData = {
        timestamp: new Date(),
        totalMarketCap: 2500000000000,
        totalVolume: 50000000000,
        btcDominance: 45.5,
        ethDominance: 18.2,
        source: "integration-test",
        attribution: "Test Suite",
      };

      // This SHOULD FAIL until topics and schemas are configured
      const result = await writer.publishMarketAnalytics(analyticsData);

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Analytics publishing failed:", error?.message);
        throw new Error(`Analytics publishing failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
    });

    it("should handle batch publishing with proper partitioning", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const pricesBatch = [
        {
          coinId: "bitcoin",
          symbol: "BTC",
          usdPrice: 50000,
          lastUpdated: new Date(),
          source: "test",
          attribution: "test",
        },
        {
          coinId: "ethereum",
          symbol: "ETH",
          usdPrice: 3000,
          lastUpdated: new Date(),
          source: "test",
          attribution: "test",
        },
        {
          coinId: "cardano",
          symbol: "ADA",
          usdPrice: 1.2,
          lastUpdated: new Date(),
          source: "test",
          attribution: "test",
        },
      ];

      // This SHOULD FAIL until partitioning is configured
      const result = await writer.publishPrices(pricesBatch);

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Batch publishing failed:", error?.message);
        throw new Error(`Batch publishing failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);

      const status = writer.getStatus();
      expect(status.totalPublished).toBeGreaterThan(pricesBatch.length - 1);
    });
  });

  describe("Streaming Architecture", () => {
    it("should implement streaming DSL methods", () => {
      // Verify actor has required methods
      expect(typeof writer.publishPrice).toBe("function");
      expect(typeof writer.publishPrices).toBe("function");
      expect(typeof writer.publishMarketAnalytics).toBe("function");
      expect(typeof writer.flush).toBe("function");
    });

    it("should handle producer batching and flushing", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until batching is configured
      const initialCount = writer.getStatus().totalPublished;

      // Add messages to batch
      await writer.publishPrice({
        coinId: "test1",
        symbol: "T1",
        usdPrice: 1,
        lastUpdated: new Date(),
        source: "test",
        attribution: "test",
      });
      await writer.publishPrice({
        coinId: "test2",
        symbol: "T2",
        usdPrice: 2,
        lastUpdated: new Date(),
        source: "test",
        attribution: "test",
      });

      // Force flush
      const flushResult = await writer.flush();

      if (isFailure(flushResult)) {
        const error = getError(flushResult);
        throw new Error(`Flush failed: ${error?.message}`);
      }

      const finalCount = writer.getStatus().totalPublished;
      expect(finalCount).toBeGreaterThan(initialCount);
    });
  });

  describe("Handler Architecture", () => {
    it("should inherit DSL methods from BaseWriter", () => {
      expect(typeof writer.publishPrice).toBe("function");
      expect(typeof writer.publishPrices).toBe("function");
      expect(typeof writer.publishMarketAnalytics).toBe("function");
      expect(typeof writer.flush).toBe("function");
    });

    it("should implement Kafka-specific handlers only", () => {
      const prototype = Object.getPrototypeOf(writer);
      const methods = Object.getOwnPropertyNames(prototype);

      // Should have Kafka-specific handlers
      expect(methods.some((m) => m.includes("Kafka") || m.includes("Producer"))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle broker unavailable gracefully", async () => {
      const { createRedpandaMarketDataWriter } = await import(
        "../../../src/actors/targets/redpanda"
      );

      const unreachableWriter = createRedpandaMarketDataWriter({
        name: "unreachable-test",
        brokers: ["unreachable:9999"],
        topics: { prices: "test" },
      });

      const result = await unreachableWriter.initialize();
      expect(isFailure(result)).toBe(true);

      const error = getError(result);
      expect(error?.message).toContain("broker");
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
      };

      const result = await writer.publishPrice(invalidData as any);

      if (isSuccess(result)) {
        throw new Error("Should have failed with invalid data schema");
      }

      const error = getError(result);
      expect(error?.message).toMatch(/schema|validation|invalid/i);
    });

    it("should handle topic permission errors", async () => {
      // This SHOULD FAIL until permissions are configured
      const { createRedpandaMarketDataWriter } = await import(
        "../../../src/actors/targets/redpanda"
      );

      const restrictedWriter = createRedpandaMarketDataWriter({
        name: "restricted-test",
        brokers: ["localhost:19092"],
        topics: { prices: "restricted-topic" },
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
          throw new Error("Should have failed with topic permission error");
        }
      }
    });
  });
});
