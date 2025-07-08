#!/usr/bin/env bun

/**
 * Redpanda MCP Source Actor - Integration Tests
 *
 * Tests the Redpanda MCP source actor with real MCP server connections.
 * These tests verify MCP-based streaming data consumption from Redpanda clusters.
 * 
 * EXPECTED TO FAIL until Redpanda MCP Server is properly configured and running.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("RedpandaMCPSourceActor - External Integration", () => {
  let reader: any; // Will fail at import if actor doesn't exist

  beforeAll(async () => {
    try {
      // This import should exist but may fail
      const { createRedpandaMCPMarketDataReader } = await import("../../../src/actors/sources/redpanda-mcp");
      
      reader = createRedpandaMCPMarketDataReader({
        name: "integration-test-redpanda-mcp-source",
        debug: false,
        mcpConfig: {
          transport: "stdio",
          command: "rpk",
          args: ["mcp", "server", "--brokers", "localhost:19092"],
          brokers: ["localhost:19092"],
          useCloudMCP: false,
        },
        topics: ["crypto-prices", "market-data"],
        consumerGroup: "integration-test-mcp-group",
        timeout: 30000,
      });
    } catch (error) {
      console.error("❌ Failed to import RedpandaMCPSourceActor:", error);
      throw new Error(`Missing Redpanda MCP Source Actor implementation: ${error}`);
    }
  });

  afterAll(async () => {
    if (reader) {
      await reader.cleanup();
    }
  });

  describe("MCP Server Connection", () => {
    it("should connect to Redpanda MCP Server", async () => {
      // This SHOULD FAIL until MCP server is running
      const result = await reader.initialize();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Redpanda MCP Server not available:", error?.message);
        throw new Error(`Redpanda MCP Server connection failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      expect(reader.getStatus().isInitialized).toBe(true);
      expect(reader.getStatus().mcpClientInitialized).toBe(true);
    }, 30000);

    it("should list available MCP tools", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until MCP server exposes tools
      const result = await reader.listMCPTools();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: MCP tools not available:", error?.message);
        throw new Error(`MCP tools listing failed: ${error?.message}`);
      }

      const tools = getData(result);
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toContain("list_topics");
      expect(tools).toContain("consume_messages");
      expect(tools).toContain("list_consumer_groups");
    });

    it("should verify MCP protocol compliance", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      const status = reader.getStatus();
      expect(status.dataSource).toBe("mcp+kafka");
      expect(status.hasMCPClient).toBe(true);
      
      const mcpClient = reader.getClient("redpanda-mcp");
      expect(mcpClient).toBeDefined();
      expect(mcpClient!.isConnected).toBe(true);
    });
  });

  describe("MCP-Based Kafka Operations", () => {
    it("should list topics via MCP tools", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until topics exist
      const result = await reader.callMCPTool("list_topics", {});
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Topic listing via MCP failed:", error?.message);
        throw new Error(`MCP topic listing failed: ${error?.message}`);
      }

      const topicData = getData(result);
      expect(topicData).toHaveProperty("topics");
      expect(Array.isArray(topicData.topics)).toBe(true);
    });

    it("should consume messages via MCP tools", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until messages are available
      const result = await reader.callMCPTool("consume_messages", {
        topic: "crypto-prices",
        consumer_group: "integration-test-mcp-group",
        max_messages: 5,
        timeout_ms: 10000,
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Message consumption via MCP failed:", error?.message);
        throw new Error(`MCP message consumption failed: ${error?.message}`);
      }

      const messageData = getData(result);
      expect(messageData).toHaveProperty("messages");
      expect(Array.isArray(messageData.messages)).toBe(true);
    });

    it("should get consumer group status via MCP", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until consumer groups are configured
      const result = await reader.callMCPTool("describe_consumer_group", {
        group_id: "integration-test-mcp-group",
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Consumer group status via MCP failed:", error?.message);
        throw new Error(`MCP consumer group status failed: ${error?.message}`);
      }

      const groupData = getData(result);
      expect(groupData).toHaveProperty("group_id");
      expect(groupData).toHaveProperty("state");
      expect(groupData).toHaveProperty("members");
    });
  });

  describe("DSL Implementation via MCP", () => {
    it("should get current cryptocurrency price via MCP", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until price data is flowing through Kafka
      const result = await reader.getCurrentPrice("bitcoin");
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Price data not available via MCP:", error?.message);
        throw new Error(`Current price via MCP failed: ${error?.message}`);
      }

      const price = getData(result);
      expect(typeof price).toBe("number");
      expect(price).toBeGreaterThan(0);
    }, 30000);

    it("should get multiple prices via MCP streaming", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until multiple coin data is available
      const result = await reader.getCurrentPrices(["bitcoin", "ethereum"], {
        vsCurrencies: ["usd"],
        includeMarketCap: true,
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Multiple prices not available via MCP:", error?.message);
        throw new Error(`Multiple prices via MCP failed: ${error?.message}`);
      }

      const prices = getData(result);
      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBeGreaterThan(0);
    });

    it("should get market analytics from streaming data", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until analytics data is flowing
      const result = await reader.getMarketAnalytics();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Market analytics not available via MCP:", error?.message);
        throw new Error(`Market analytics via MCP failed: ${error?.message}`);
      }

      const analytics = getData(result);
      expect(analytics).toHaveProperty("totalMarketCap");
      expect(analytics).toHaveProperty("totalVolume");
      expect(analytics).toHaveProperty("source", "redpanda-mcp");
    });
  });

  describe("Handler Architecture", () => {
    it("should inherit DSL methods from BaseReader", () => {
      expect(typeof reader.getCurrentPrice).toBe("function");
      expect(typeof reader.getCurrentPrices).toBe("function");
      expect(typeof reader.getMarketAnalytics).toBe("function");
      expect(typeof reader.getAvailableTickers).toBe("function");
    });

    it("should implement MCP+Kafka-specific handlers", () => {
      const prototype = Object.getPrototypeOf(reader);
      const methods = Object.getOwnPropertyNames(prototype);
      
      // Should have MCP-specific handlers
      expect(methods.some(m => m.includes("MCP") || m.includes("Kafka"))).toBe(true);
      expect(typeof reader.callMCPTool).toBe("function");
      expect(typeof reader.listMCPTools).toBe("function");
    });
  });

  describe("Streaming Performance", () => {
    it("should handle real-time message processing", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until high-throughput streaming is configured
      const startTime = Date.now();
      const messages = [];
      
      const unsubscribe = reader.subscribeToTopic("crypto-prices", (message) => {
        messages.push(message);
      });

      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      unsubscribe();
      
      const endTime = Date.now();
      const messagesPerSecond = messages.length / ((endTime - startTime) / 1000);

      if (messagesPerSecond < 1) {
        throw new Error(`Insufficient message throughput: ${messagesPerSecond} msg/sec - streaming broken`);
      }

      expect(messagesPerSecond).toBeGreaterThan(1);
      console.log(`✅ Message throughput: ${messagesPerSecond.toFixed(2)} msg/sec`);
    }, 15000);

    it("should handle consumer lag monitoring", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL until lag monitoring is configured
      const result = await reader.getConsumerLag();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Consumer lag monitoring not available:", error?.message);
        throw new Error(`Consumer lag monitoring failed: ${error?.message}`);
      }

      const lagData = getData(result);
      expect(lagData).toHaveProperty("totalLag");
      expect(lagData).toHaveProperty("partitionLags");
      expect(Array.isArray(lagData.partitionLags)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle MCP server unavailable gracefully", async () => {
      const { createRedpandaMCPMarketDataReader } = await import("../../../src/actors/sources/redpanda-mcp");
      
      const unreachableReader = createRedpandaMCPMarketDataReader({
        name: "unreachable-test",
        mcpConfig: {
          transport: "stdio", 
          command: "nonexistent-command",
          args: ["invalid"],
          brokers: ["unreachable:9999"],
        },
        topics: ["test"],
      });

      const result = await unreachableReader.initialize();
      expect(isFailure(result)).toBe(true);
      
      const error = getError(result);
      expect(error?.message).toMatch(/mcp|server|command|connection/i);
    });

    it("should handle invalid MCP tool calls", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL with invalid tool name
      const result = await reader.callMCPTool("nonexistent_tool", {});
      
      expect(isFailure(result)).toBe(true);
      
      const error = getError(result);
      expect(error?.message).toMatch(/tool|method|unknown|invalid/i);
    });

    it("should handle Kafka cluster disconnection", async () => {
      if (!reader.getStatus().isInitialized) {
        await reader.initialize();
      }

      // This SHOULD FAIL when cluster becomes unavailable
      const result = await reader.callMCPTool("cluster_info", {});
      
      if (isFailure(result)) {
        const error = getError(result);
        expect(error?.message).toMatch(/cluster|broker|connection|unavailable/i);
      } else {
        // If cluster is available, verify we can detect disconnection
        const clusterInfo = getData(result);
        expect(clusterInfo).toHaveProperty("brokers");
      }
    });
  });
});