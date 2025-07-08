#!/usr/bin/env bun

/**
 * Redpanda Source Actor - Integration Tests
 *
 * Tests the Redpanda source actor with real Kafka cluster connections.
 * These tests verify streaming data consumption from actual Redpanda clusters.
 *
 * EXPECTED TO FAIL until Redpanda cluster is properly configured and running.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("RedpandaSourceActor - External Integration", () => {
  let reader: any; // Will fail at import if actor doesn't exist

  beforeAll(async () => {
    try {
      // This import should exist but may fail
      const { createRedpandaMarketDataReader } = await import(
        "../../../src/actors/sources/redpanda"
      );

      reader = createRedpandaMarketDataReader({
        name: "integration-test-redpanda-source",
        debug: false,
        brokers: ["localhost:19092"], // Test broker
        topics: ["crypto-prices", "market-data"],
        consumerGroup: "integration-test-group",
      });
    } catch (error) {
      console.error("❌ Failed to import RedpandaSourceActor:", error);
      throw new Error(`Missing Redpanda Source Actor implementation: ${error}`);
    }
  });

  afterAll(async () => {
    if (reader) {
      await reader.cleanup();
    }
  });

  describe("Kafka Cluster Connection", () => {
    it("should connect to Redpanda Kafka cluster", async () => {
      // This SHOULD FAIL until cluster is running
      const result = await reader.initialize();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Redpanda cluster not available:", error?.message);
        throw new Error(`Redpanda cluster connection failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      expect(reader.getStatus().isInitialized).toBe(true);
    }, 30000);

    it("should list available topics", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until topics are created
      const result = await reader.listTopics();

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Failed to list topics:", error?.message);
        throw new Error(`Topic listing failed: ${error?.message}`);
      }

      const topics = getData(result);
      expect(Array.isArray(topics)).toBe(true);
      expect(topics).toContain("crypto-prices");
    });
  });

  describe("Market Data Consumption", () => {
    it("should consume cryptocurrency price messages", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until data is flowing
      const result = await reader.getCurrentPrice("bitcoin");

      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: No data available:", error?.message);
        throw new Error(`Market data consumption failed: ${error?.message}`);
      }

      const price = getData(result);
      expect(typeof price).toBe("number");
      expect(price).toBeGreaterThan(0);
    }, 30000);

    it("should handle consumer group management", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until consumer groups are configured
      const status = reader.getConsumerStatus();
      expect(status).toHaveProperty("consumerGroup", "integration-test-group");
      expect(status).toHaveProperty("partitionAssignments");
      expect(status).toHaveProperty("lag");
    });
  });

  describe("Streaming Architecture", () => {
    it("should implement streaming DSL methods", () => {
      // Verify actor has required methods
      expect(typeof reader.startConsuming).toBe("function");
      expect(typeof reader.stopConsuming).toBe("function");
      expect(typeof reader.getConsumerLag).toBe("function");
      expect(typeof reader.getCurrentPrice).toBe("function");
    });

    it("should handle real-time message consumption", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until streaming is working
      const messages = [];
      const unsubscribe = reader.subscribe("crypto-prices", (message) => {
        messages.push(message);
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));
      unsubscribe();

      if (messages.length === 0) {
        throw new Error("No messages received from Redpanda stream - streaming broken");
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toHaveProperty("topic");
      expect(messages[0]).toHaveProperty("value");
    }, 10000);
  });

  describe("Handler Architecture", () => {
    it("should inherit DSL methods from BaseReader", () => {
      expect(typeof reader.getCurrentPrice).toBe("function");
      expect(typeof reader.getCurrentPrices).toBe("function");
      expect(typeof reader.getMarketAnalytics).toBe("function");
    });

    it("should implement Kafka-specific handlers only", () => {
      const prototype = Object.getPrototypeOf(reader);
      const methods = Object.getOwnPropertyNames(prototype);

      // Should have Kafka-specific handlers
      expect(methods.some((m) => m.includes("Kafka") || m.includes("Consumer"))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle broker unavailable gracefully", async () => {
      const { createRedpandaMarketDataReader } = await import(
        "../../../src/actors/sources/redpanda"
      );

      const unreachableReader = createRedpandaMarketDataReader({
        name: "unreachable-test",
        brokers: ["unreachable:9999"],
        topics: ["test"],
      });

      const result = await unreachableReader.initialize();
      expect(isFailure(result)).toBe(true);

      const error = getError(result);
      expect(error?.message).toContain("broker");
    });

    it("should handle authentication failures", async () => {
      // This SHOULD FAIL until auth is configured
      const { createRedpandaMarketDataReader } = await import(
        "../../../src/actors/sources/redpanda"
      );

      const authReader = createRedpandaMarketDataReader({
        name: "auth-test",
        brokers: ["localhost:19092"],
        topics: ["secure-topic"],
        sasl: {
          mechanism: "SCRAM-SHA-256",
          username: "invalid",
          password: "invalid",
        },
      });

      const result = await authReader.initialize();
      if (isSuccess(result)) {
        throw new Error("Authentication should have failed with invalid credentials");
      }

      const error = getError(result);
      expect(error?.message).toMatch(/auth|credential|permission/i);
    });
  });
});
