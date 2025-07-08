#!/usr/bin/env bun

/**
 * TimescaleDB MCP Target Actor - Integration Tests
 *
 * Tests the TimescaleDB MCP target actor with real MCP server connections.
 * These tests verify MCP-based time-series data storage to TimescaleDB instances.
 * 
 * EXPECTED TO FAIL until TimescaleDB MCP Server is properly configured and running.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("TimescaleMCPTargetActor - External Integration", () => {
  let writer: any; // Will fail at import if actor doesn't exist

  beforeAll(async () => {
    try {
      // This import should exist but may fail
      const { createTimescaleMCPMarketDataWriter } = await import("../../../src/actors/targets/timescale-mcp");
      
      writer = createTimescaleMCPMarketDataWriter({
        name: "integration-test-timescale-mcp-target",
        debug: false,
        mcpConfig: {
          transport: "stdio",
          command: "timescaledb-mcp-server",
          args: ["--host", "localhost", "--port", "5432", "--database", "crypto_data_test"],
          connection: {
            host: "localhost",
            port: 5432,
            database: "crypto_data_test",
            user: "postgres",
            password: "password",
            ssl: false,
          },
        },
        tables: {
          prices: "crypto_prices",
          ohlcv: "crypto_ohlcv",
          analytics: "market_analytics",
        },
        batchSize: 100,
        flushInterval: 5000,
        timeout: 30000,
      });
    } catch (error) {
      console.error("❌ Failed to import TimescaleMCPTargetActor:", error);
      throw new Error(`Missing TimescaleDB MCP Target Actor implementation: ${error}`);
    }
  });

  afterAll(async () => {
    if (writer) {
      await writer.cleanup();
    }
  });

  describe("MCP Server Connection", () => {
    it("should connect to TimescaleDB MCP Server", async () => {
      // This SHOULD FAIL until MCP server is running
      const result = await writer.initialize();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: TimescaleDB MCP Server not available:", error?.message);
        throw new Error(`TimescaleDB MCP Server connection failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      expect(writer.getStatus().isInitialized).toBe(true);
      expect(writer.getStatus().mcpClientInitialized).toBe(true);
    }, 30000);

    it("should list available MCP tools", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until MCP server exposes TimescaleDB tools
      const result = await writer.listMCPTools();
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: TimescaleDB MCP tools not available:", error?.message);
        throw new Error(`MCP tools listing failed: ${error?.message}`);
      }

      const tools = getData(result);
      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toContain("create_hypertable");
      expect(tools).toContain("insert_timeseries_data");
      expect(tools).toContain("query_timeseries");
      expect(tools).toContain("create_continuous_aggregate");
    });

    it("should verify MCP protocol compliance", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const status = writer.getStatus();
      expect(status.dataSource).toBe("mcp+timescaledb");
      expect(status.hasMCPClient).toBe(true);
      
      const mcpClient = writer.getClient("timescaledb-mcp");
      expect(mcpClient).toBeDefined();
      expect(mcpClient!.isConnected).toBe(true);
    });
  });

  describe("MCP-Based Database Operations", () => {
    it("should create hypertables via MCP tools", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until database permissions are configured
      const result = await writer.callMCPTool("create_hypertable", {
        table_name: "crypto_prices_test",
        time_column: "timestamp",
        chunk_interval: "1 day",
        if_not_exists: true,
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Hypertable creation via MCP failed:", error?.message);
        throw new Error(`MCP hypertable creation failed: ${error?.message}`);
      }

      const tableData = getData(result);
      expect(tableData).toHaveProperty("table_name", "crypto_prices_test");
      expect(tableData).toHaveProperty("created", true);
    });

    it("should verify database connection via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until database is accessible
      const result = await writer.callMCPTool("check_connection", {});
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Database connection check via MCP failed:", error?.message);
        throw new Error(`MCP database connection check failed: ${error?.message}`);
      }

      const connectionData = getData(result);
      expect(connectionData).toHaveProperty("connected", true);
      expect(connectionData).toHaveProperty("timescaledb_version");
    });

    it("should list existing hypertables via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until hypertables exist
      const result = await writer.callMCPTool("list_hypertables", {});
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Hypertable listing via MCP failed:", error?.message);
        throw new Error(`MCP hypertable listing failed: ${error?.message}`);
      }

      const hypertables = getData(result);
      expect(Array.isArray(hypertables)).toBe(true);
    });
  });

  describe("DSL Implementation via MCP", () => {
    it("should publish cryptocurrency price data via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const priceData = {
        coinId: "bitcoin",
        symbol: "BTC",
        usdPrice: 50000,
        lastUpdated: new Date(),
        source: "integration-test-mcp",
        attribution: "Test Suite MCP",
      };

      // This SHOULD FAIL until hypertables are configured
      const result = await writer.publishPrice(priceData);
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Price publishing via MCP failed:", error?.message);
        throw new Error(`Price publishing via MCP failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      
      const status = writer.getStatus();
      expect(status.totalPublished).toBeGreaterThan(0);
    }, 15000);

    it("should publish OHLCV data via MCP tools", async () => {
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
        source: "integration-test-mcp",
        attribution: "Test Suite MCP",
      };

      // This SHOULD FAIL until OHLCV hypertable is configured
      const result = await writer.publishOHLCV(ohlcvData);
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: OHLCV publishing via MCP failed:", error?.message);
        throw new Error(`OHLCV publishing via MCP failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
    });

    it("should publish market analytics via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const analyticsData = {
        timestamp: new Date(),
        totalMarketCap: 2500000000000,
        totalVolume: 50000000000,
        btcDominance: 45.5,
        ethDominance: 18.2,
        source: "integration-test-mcp",
        attribution: "Test Suite MCP",
      };

      // This SHOULD FAIL until analytics table is configured
      const result = await writer.publishMarketAnalytics(analyticsData);
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Analytics publishing via MCP failed:", error?.message);
        throw new Error(`Analytics publishing via MCP failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
    });
  });

  describe("TimescaleDB Features via MCP", () => {
    it("should create continuous aggregates via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until continuous aggregates are supported
      const result = await writer.callMCPTool("create_continuous_aggregate", {
        view_name: "hourly_price_avg",
        query: `
          SELECT coin_id,
                 time_bucket('1 hour', timestamp) AS bucket,
                 AVG(usd_price) AS avg_price,
                 MAX(usd_price) AS max_price,
                 MIN(usd_price) AS min_price
          FROM crypto_prices
          GROUP BY coin_id, bucket
        `,
        refresh_policy: {
          start_offset: "1 day",
          end_offset: "1 hour",
          schedule_interval: "1 hour",
        },
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Continuous aggregate creation via MCP failed:", error?.message);
        throw new Error(`MCP continuous aggregate creation failed: ${error?.message}`);
      }

      const aggregateData = getData(result);
      expect(aggregateData).toHaveProperty("view_name", "hourly_price_avg");
      expect(aggregateData).toHaveProperty("created", true);
    });

    it("should manage compression policies via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until compression is configured
      const result = await writer.callMCPTool("set_compression_policy", {
        table_name: "crypto_prices",
        compress_after: "7 days",
        segment_by: "coin_id",
        order_by: "timestamp",
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Compression policy via MCP failed:", error?.message);
        throw new Error(`MCP compression policy failed: ${error?.message}`);
      }

      const policyData = getData(result);
      expect(policyData).toHaveProperty("table_name", "crypto_prices");
      expect(policyData).toHaveProperty("policy_set", true);
    });

    it("should manage retention policies via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until retention is configured
      const result = await writer.callMCPTool("set_retention_policy", {
        table_name: "crypto_prices",
        drop_after: "1 year",
      });
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Retention policy via MCP failed:", error?.message);
        throw new Error(`MCP retention policy failed: ${error?.message}`);
      }

      const policyData = getData(result);
      expect(policyData).toHaveProperty("table_name", "crypto_prices");
      expect(policyData).toHaveProperty("policy_set", true);
    });
  });

  describe("Handler Architecture", () => {
    it("should inherit DSL methods from BaseWriter", () => {
      expect(typeof writer.publishPrice).toBe("function");
      expect(typeof writer.publishPrices).toBe("function");
      expect(typeof writer.publishOHLCV).toBe("function");
      expect(typeof writer.publishMarketAnalytics).toBe("function");
      expect(typeof writer.flush).toBe("function");
    });

    it("should implement MCP+TimescaleDB-specific handlers", () => {
      const prototype = Object.getPrototypeOf(writer);
      const methods = Object.getOwnPropertyNames(prototype);
      
      // Should have MCP+TimescaleDB-specific handlers
      expect(methods.some(m => m.includes("MCP") || m.includes("Timescale"))).toBe(true);
      expect(typeof writer.callMCPTool).toBe("function");
      expect(typeof writer.listMCPTools).toBe("function");
    });
  });

  describe("Batch Processing via MCP", () => {
    it("should handle batch insertions via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      const pricesBatch = [
        { coinId: "bitcoin", symbol: "BTC", usdPrice: 50000, lastUpdated: new Date(), source: "test-mcp", attribution: "test" },
        { coinId: "ethereum", symbol: "ETH", usdPrice: 3000, lastUpdated: new Date(), source: "test-mcp", attribution: "test" },
        { coinId: "cardano", symbol: "ADA", usdPrice: 1.2, lastUpdated: new Date(), source: "test-mcp", attribution: "test" },
      ];

      // This SHOULD FAIL until batch processing is configured
      const result = await writer.publishPrices(pricesBatch);
      
      if (isFailure(result)) {
        const error = getError(result);
        console.error("🚫 EXPECTED FAILURE: Batch processing via MCP failed:", error?.message);
        throw new Error(`Batch processing via MCP failed: ${error?.message}`);
      }

      expect(isSuccess(result)).toBe(true);
      
      const status = writer.getStatus();
      expect(status.totalPublished).toBeGreaterThan(pricesBatch.length - 1);
    });

    it("should handle transaction batching via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL until transaction support is configured
      const result = await writer.callMCPTool("begin_transaction", {});
      
      if (isSuccess(result)) {
        const insertResult = await writer.callMCPTool("insert_batch", {
          table_name: "crypto_prices",
          data: [
            { coin_id: "bitcoin", usd_price: 50000, timestamp: new Date().toISOString() },
            { coin_id: "ethereum", usd_price: 3000, timestamp: new Date().toISOString() },
          ],
        });

        const commitResult = await writer.callMCPTool("commit_transaction", {});
        
        expect(isSuccess(insertResult)).toBe(true);
        expect(isSuccess(commitResult)).toBe(true);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle MCP server unavailable gracefully", async () => {
      const { createTimescaleMCPMarketDataWriter } = await import("../../../src/actors/targets/timescale-mcp");
      
      const unreachableWriter = createTimescaleMCPMarketDataWriter({
        name: "unreachable-test",
        mcpConfig: {
          transport: "stdio",
          command: "nonexistent-timescale-mcp-server",
          args: ["--invalid"],
          connection: {
            host: "unreachable-host",
            port: 9999,
            database: "nonexistent",
            user: "invalid",
            password: "invalid",
          },
        },
        tables: { prices: "test" },
      });

      const result = await unreachableWriter.initialize();
      expect(isFailure(result)).toBe(true);
      
      const error = getError(result);
      expect(error?.message).toMatch(/mcp|server|command|connection/i);
    });

    it("should handle database constraint violations via MCP", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL with constraint violation
      const invalidData = {
        coinId: null, // Violates NOT NULL constraint
        symbol: "", 
        usdPrice: -1, // Violates CHECK constraint
        lastUpdated: "invalid-date",
      };

      const result = await writer.publishPrice(invalidData as any);
      
      if (isSuccess(result)) {
        throw new Error("Should have failed with constraint violation");
      }

      const error = getError(result);
      expect(error?.message).toMatch(/constraint|validation|null|invalid/i);
    });

    it("should handle MCP tool call failures", async () => {
      if (!writer.getStatus().isInitialized) {
        await writer.initialize();
      }

      // This SHOULD FAIL with invalid tool name
      const result = await writer.callMCPTool("nonexistent_timescale_tool", {});
      
      expect(isFailure(result)).toBe(true);
      
      const error = getError(result);
      expect(error?.message).toMatch(/tool|method|unknown|invalid/i);
    });
  });
});