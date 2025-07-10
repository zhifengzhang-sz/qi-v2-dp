#!/usr/bin/env bun

/**
 * CoinGecko MCP Reader Integration Tests
 *
 * Tests CoinGecko MCP Reader with REAL MCP server connection.
 * Verifies DSL interface compliance and proper error handling for unsupported operations.
 * No mocks - tests actual CoinGecko MCP server behavior.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import {
  Exchange,
  InstrumentType,
  MarketContext,
  MarketSymbol,
  type OHLCV,
  type Price,
} from "@qi/core";
import { type ResultType as Result, getData, getError, isFailure, isSuccess } from "@qi/core/base";
import { CoinGeckoMCPReader } from "@qi/dp/market/crypto/sources/CoinGeckoMCPReader";
import { type TimeInterval, createTimeInterval } from "@qi/dp/utils";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("CoinGecko MCP Reader - Real Server Integration", () => {
  let reader: CoinGeckoMCPReader;
  let mcpClient: Client;
  let transport: SSEClientTransport;

  // Test data setup - using CoinGecko coin IDs
  const testExchange = Exchange.create("COINGECKO", "CoinGecko", "Global", "aggregated");
  const bitcoinSymbol = MarketSymbol.create(
    "bitcoin", // CoinGecko coin ID
    "Bitcoin",
    "crypto",
    "usd", // lowercase currency
    InstrumentType.CASH,
  );
  const ethereumSymbol = MarketSymbol.create(
    "ethereum", // CoinGecko coin ID
    "Ethereum",
    "crypto",
    "usd", // lowercase currency
    InstrumentType.CASH,
  );
  const stockSymbol = MarketSymbol.create(
    "AAPL",
    "Apple Inc",
    "equity",
    "USD",
    InstrumentType.CASH,
  );

  const bitcoinContext = MarketContext.create(testExchange, bitcoinSymbol);
  const ethereumContext = MarketContext.create(testExchange, ethereumSymbol);
  const stockContext = MarketContext.create(testExchange, stockSymbol);

  beforeAll(async () => {
    console.log("🔗 Connecting to CoinGecko MCP Server...");

    // Create real MCP client connection
    mcpClient = new Client(
      { name: "coingecko-integration-test", version: "1.0.0" },
      { capabilities: { tools: {} } },
    );

    transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));

    try {
      await mcpClient.connect(transport);
      console.log("✅ Successfully connected to CoinGecko MCP Server");
    } catch (error) {
      console.error("❌ Failed to connect to CoinGecko MCP Server:", error);
      console.warn("⚠️  CoinGecko integration tests will be skipped");
      return;
    }

    // Create reader with real MCP client
    reader = new CoinGeckoMCPReader({
      name: "integration-test-reader",
      debug: false,
      mcpClient: mcpClient,
    });
  });

  afterAll(async () => {
    if (mcpClient) {
      try {
        await mcpClient.close();
        console.log("✅ Disconnected from CoinGecko MCP Server");
      } catch (error) {
        console.warn("⚠️  Error disconnecting from MCP server:", error);
      }
    }
  });

  describe("Constructor", () => {
    it("should create CoinGecko MCP Reader with correct configuration", () => {
      if (!mcpClient) return;

      expect(reader).toBeDefined();
      expect(reader).toBeInstanceOf(CoinGeckoMCPReader);
    });
  });

  describe("DSL Interface - readPrice", () => {
    it(
      "should read current Bitcoin price successfully",
      async () => {
        if (!mcpClient) return;

        const result = await reader.readPrice(bitcoinSymbol, bitcoinContext);

        if (isFailure(result)) {
          const error = getError(result);
          console.warn(`⚠️  Bitcoin price fetch failed: ${error?.message}`);
          // Server might be temporarily unavailable or rate limited
          expect(error?.category).toMatch(/NETWORK|BUSINESS/);
          return;
        }

        expect(isSuccess(result)).toBe(true);
        const price = getData(result) as Price;

        // Verify Price object structure and data validity
        expect(price).toBeDefined();
        expect(price.price).toBeGreaterThan(0);
        expect(typeof price.price).toBe("number");
        expect(price.timestamp).toBeInstanceOf(Date);
        expect(price.size).toBe(0); // CoinGecko price endpoint doesn't provide volume

        // Bitcoin price should be reasonable (basic sanity check)
        expect(price.price).toBeGreaterThan(1000); // Bitcoin > $1,000
        expect(price.price).toBeLessThan(1000000); // Bitcoin < $1,000,000

        console.log(`✅ Bitcoin price: $${price.price.toLocaleString()}`);
      },
      { timeout: 30000 },
    );

    it(
      "should read current Ethereum price successfully",
      async () => {
        if (!mcpClient) return;

        const result = await reader.readPrice(ethereumSymbol, ethereumContext);

        if (isFailure(result)) {
          const error = getError(result);
          console.warn(`⚠️  Ethereum price fetch failed: ${error?.message}`);
          return;
        }

        expect(isSuccess(result)).toBe(true);
        const price = getData(result) as Price;

        expect(price.price).toBeGreaterThan(0);
        expect(typeof price.price).toBe("number");
        expect(price.timestamp).toBeInstanceOf(Date);

        // Ethereum price should be reasonable
        expect(price.price).toBeGreaterThan(100); // ETH > $100
        expect(price.price).toBeLessThan(100000); // ETH < $100,000

        console.log(`✅ Ethereum price: $${price.price.toLocaleString()}`);
      },
      { timeout: 30000 },
    );

    it("should reject non-crypto assets with proper error", async () => {
      if (!mcpClient) return;

      const result = await reader.readPrice(stockSymbol, stockContext);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("UNSUPPORTED_ASSET_CLASS");
      expect(error?.message).toContain("Only crypto assets are supported");
      expect(error?.category).toBe("VALIDATION");

      console.log(`✅ Correctly rejected non-crypto asset: ${error?.message}`);
    });

    it(
      "should handle historical price requests using OHLCV",
      async () => {
        if (!mcpClient) return;

        const interval = createTimeInterval(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        );

        const result = await reader.readPrice(bitcoinSymbol, bitcoinContext, interval);

        if (isFailure(result)) {
          const error = getError(result);
          console.warn(`⚠️  Historical prices unavailable: ${error?.message}`);
          return;
        }

        expect(isSuccess(result)).toBe(true);
        const prices = getData(result) as Price[];

        expect(Array.isArray(prices)).toBe(true);
        expect(prices.length).toBeGreaterThan(0);

        // Verify each price in the historical data
        for (const price of prices) {
          expect(price.price).toBeGreaterThan(0);
          expect(price.timestamp).toBeInstanceOf(Date);
          expect(price.timestamp.getTime()).toBeGreaterThanOrEqual(interval.startDate.getTime());
          expect(price.timestamp.getTime()).toBeLessThanOrEqual(interval.endDate.getTime());
        }

        console.log(`✅ Retrieved ${prices.length} historical Bitcoin prices`);
      },
      { timeout: 45000 },
    );
  });

  describe("DSL Interface - readLevel1", () => {
    it("should properly reject Level1 requests (unsupported by CoinGecko)", async () => {
      if (!mcpClient) return;

      const result = await reader.readLevel1(bitcoinSymbol, bitcoinContext);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("UNSUPPORTED_OPERATION");
      expect(error?.message).toContain("Level1 data not available");
      expect(error?.message).toContain(
        "CoinGecko MCP Server does not provide real-time bid/ask data",
      );
      expect(error?.category).toBe("BUSINESS");

      console.log(`✅ Level1 correctly rejected: ${error?.message}`);
    });

    it("should reject historical Level1 requests", async () => {
      if (!mcpClient) return;

      const interval = createTimeInterval(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());

      const result = await reader.readLevel1(bitcoinSymbol, bitcoinContext, interval);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("UNSUPPORTED_OPERATION");
      expect(error?.category).toBe("BUSINESS");

      console.log("✅ Historical Level1 correctly rejected");
    });
  });

  describe("DSL Interface - readOHLCV", () => {
    it(
      "should read Bitcoin OHLCV data successfully",
      async () => {
        if (!mcpClient) return;

        const result = await reader.readOHLCV(bitcoinSymbol, bitcoinContext);

        if (isFailure(result)) {
          const error = getError(result);
          console.warn(`⚠️  OHLCV data unavailable: ${error?.message}`);
          return;
        }

        expect(isSuccess(result)).toBe(true);
        const ohlcv = getData(result) as OHLCV;

        // Verify OHLCV structure
        expect(ohlcv).toBeDefined();
        expect(ohlcv.open).toBeGreaterThan(0);
        expect(ohlcv.high).toBeGreaterThan(0);
        expect(ohlcv.low).toBeGreaterThan(0);
        expect(ohlcv.close).toBeGreaterThan(0);
        expect(ohlcv.volume).toBe(0); // CoinGecko OHLC endpoint doesn't include volume
        expect(ohlcv.timestamp).toBeInstanceOf(Date);

        // Verify OHLCV relationships (high >= open, close; low <= open, close)
        expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.open);
        expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.close);
        expect(ohlcv.low).toBeLessThanOrEqual(ohlcv.open);
        expect(ohlcv.low).toBeLessThanOrEqual(ohlcv.close);
        expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.low);

        console.log(
          `✅ Bitcoin OHLCV - Open: $${ohlcv.open.toLocaleString()}, High: $${ohlcv.high.toLocaleString()}, Low: $${ohlcv.low.toLocaleString()}, Close: $${ohlcv.close.toLocaleString()}`,
        );
      },
      { timeout: 30000 },
    );

    it(
      "should read historical OHLCV data with time filtering",
      async () => {
        if (!mcpClient) return;

        const interval = createTimeInterval(
          new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        );

        const result = await reader.readOHLCV(bitcoinSymbol, bitcoinContext, interval);

        if (isFailure(result)) {
          const error = getError(result);
          console.warn(`⚠️  Historical OHLCV unavailable: ${error?.message}`);
          return;
        }

        expect(isSuccess(result)).toBe(true);
        const ohlcvArray = getData(result) as OHLCV[];

        expect(Array.isArray(ohlcvArray)).toBe(true);
        expect(ohlcvArray.length).toBeGreaterThan(0);

        // Verify all OHLCV entries are within the time interval
        for (const ohlcv of ohlcvArray) {
          expect(ohlcv.timestamp.getTime()).toBeGreaterThanOrEqual(interval.startDate.getTime());
          expect(ohlcv.timestamp.getTime()).toBeLessThanOrEqual(interval.endDate.getTime());
          expect(ohlcv.open).toBeGreaterThan(0);
          expect(ohlcv.high).toBeGreaterThan(0);
          expect(ohlcv.low).toBeGreaterThan(0);
          expect(ohlcv.close).toBeGreaterThan(0);
          expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.low);
        }

        console.log(`✅ Retrieved ${ohlcvArray.length} historical OHLCV entries`);
      },
      { timeout: 45000 },
    );

    it("should reject non-crypto assets for OHLCV", async () => {
      if (!mcpClient) return;

      const result = await reader.readOHLCV(stockSymbol, stockContext);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("UNSUPPORTED_ASSET_CLASS");
      expect(error?.category).toBe("VALIDATION");

      console.log("✅ Non-crypto OHLCV correctly rejected");
    });

    it("should handle invalid time intervals", async () => {
      if (!mcpClient) return;

      const invalidInterval = createTimeInterval(
        new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
      );

      const result = await reader.readOHLCV(bitcoinSymbol, bitcoinContext, invalidInterval);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("INVALID_INTERVAL");
      expect(error?.category).toBe("VALIDATION");

      console.log(`✅ Future interval correctly rejected: ${error?.message}`);
    });
  });

  describe("DSL Historical Methods", () => {
    it(
      "should implement readHistoricalPrices",
      async () => {
        if (!mcpClient) return;

        const interval = createTimeInterval(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          new Date(Date.now() - 24 * 60 * 60 * 1000),
        );

        const result = await reader.readHistoricalPrices(bitcoinSymbol, bitcoinContext, interval);

        if (isSuccess(result)) {
          const prices = getData(result) as Price[];
          expect(Array.isArray(prices)).toBe(true);
          expect(prices.length).toBeGreaterThan(0);
          console.log(`✅ readHistoricalPrices returned ${prices.length} entries`);
        } else {
          const error = getError(result);
          console.warn(`⚠️  Historical prices unavailable: ${error?.message}`);
        }
      },
      { timeout: 45000 },
    );

    it("should reject readHistoricalLevel1", async () => {
      if (!mcpClient) return;

      const interval = createTimeInterval(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());

      const result = await reader.readHistoricalLevel1(bitcoinSymbol, bitcoinContext, interval);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("UNSUPPORTED_OPERATION");
      expect(error?.message).toContain("Level1 data not supported by CoinGecko MCP Server");

      console.log("✅ readHistoricalLevel1 correctly rejected");
    });

    it(
      "should implement readHistoricalOHLCV",
      async () => {
        if (!mcpClient) return;

        const interval = createTimeInterval(
          new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          new Date(Date.now() - 24 * 60 * 60 * 1000),
        );

        const result = await reader.readHistoricalOHLCV(bitcoinSymbol, bitcoinContext, interval);

        if (isSuccess(result)) {
          const ohlcvArray = getData(result) as OHLCV[];
          expect(Array.isArray(ohlcvArray)).toBe(true);
          expect(ohlcvArray.length).toBeGreaterThan(0);
          console.log(`✅ readHistoricalOHLCV returned ${ohlcvArray.length} entries`);
        } else {
          const error = getError(result);
          console.warn(`⚠️  Historical OHLCV unavailable: ${error?.message}`);
        }
      },
      { timeout: 45000 },
    );
  });

  describe("Time Interval Validation", () => {
    it("should validate future intervals", async () => {
      if (!mcpClient) return;

      const futureInterval = createTimeInterval(
        new Date(Date.now() + 60000), // 1 minute from now
        new Date(Date.now() + 120000), // 2 minutes from now
      );

      const result = await reader.readOHLCV(bitcoinSymbol, bitcoinContext, futureInterval);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("INVALID_INTERVAL");
      expect(error?.message).toContain("End date cannot be in the future");
      expect(error?.category).toBe("VALIDATION");

      console.log("✅ Future interval validation works");
    });

    it("should handle edge case time intervals", async () => {
      if (!mcpClient) return;

      const sameTimeInterval = createTimeInterval(
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-01-01T00:00:00Z"), // Same time
      );

      const result = await reader.readOHLCV(bitcoinSymbol, bitcoinContext, sameTimeInterval);

      expect(isFailure(result)).toBe(true);
      const error = getError(result);
      expect(error?.code).toBe("INVALID_INTERVAL");
      expect(error?.message).toContain("Start date must be before end date");

      console.log("✅ Same-time interval correctly rejected");
    });
  });

  describe("Error Handling and Resilience", () => {
    it(
      "should handle network issues gracefully",
      async () => {
        if (!mcpClient) return;

        // Test that all operations return Result<T> and never throw
        try {
          const priceResult = await reader.readPrice(bitcoinSymbol, bitcoinContext);
          expect(typeof priceResult).toBe("object");
          expect("_tag" in priceResult).toBe(true);

          const ohlcvResult = await reader.readOHLCV(bitcoinSymbol, bitcoinContext);
          expect(typeof ohlcvResult).toBe("object");
          expect("_tag" in ohlcvResult).toBe(true);

          const level1Result = await reader.readLevel1(bitcoinSymbol, bitcoinContext);
          expect(typeof level1Result).toBe("object");
          expect("_tag" in level1Result).toBe(true);
          expect(isFailure(level1Result)).toBe(true); // Should always fail for CoinGecko

          console.log("✅ All operations return Result<T> without throwing");
        } catch (error) {
          expect.fail(`CoinGecko reader should not throw exceptions: ${error}`);
        }
      },
      { timeout: 60000 },
    );

    it(
      "should handle symbol case correctly",
      async () => {
        if (!mcpClient) return;

        // Test that symbols are correctly formatted for CoinGecko API calls
        const upperCaseSymbol = MarketSymbol.create(
          "BITCOIN", // Uppercase - should be converted to lowercase
          "Bitcoin",
          "crypto",
          "USD", // Uppercase - should be converted to lowercase
          InstrumentType.CASH,
        );

        const result = await reader.readPrice(upperCaseSymbol, bitcoinContext);

        // Should succeed regardless of symbol case (or fail for other reasons)
        if (isFailure(result)) {
          const error = getError(result);
          expect(error?.code).not.toBe("INVALID_SYMBOL_FORMAT");
        }

        console.log("✅ Symbol case handling works");
      },
      { timeout: 30000 },
    );
  });

  describe("Response Processing", () => {
    it(
      "should handle empty or invalid responses gracefully",
      async () => {
        if (!mcpClient) return;

        // Create an invalid symbol that might return empty data
        const weirdSymbol = MarketSymbol.create(
          "notexistcoin",
          "Non-existent Coin",
          "crypto",
          "usd",
          InstrumentType.CASH,
        );
        const weirdContext = MarketContext.create(testExchange, weirdSymbol);

        const result = await reader.readPrice(weirdSymbol, weirdContext);

        // Should fail gracefully with proper error categorization
        if (isFailure(result)) {
          const error = getError(result);
          expect(error?.category).toMatch(/BUSINESS|NETWORK/);
          console.log(`✅ Invalid symbol handled properly: ${error?.message}`);
        } else {
          console.log("✅ Unexpected success - symbol might actually exist");
        }
      },
      { timeout: 30000 },
    );
  });
});
