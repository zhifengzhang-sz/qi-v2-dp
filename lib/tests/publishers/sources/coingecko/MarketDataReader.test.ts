#!/usr/bin/env bun

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoinGeckoMarketDataReader } from "../../../../src/publishers/sources/coingecko/MarketDataReader";

// Mock the DSL functions
vi.mock("../../../../src/publishers/sources/coingecko/CoinGeckoDSL", () => ({
  getCurrentPrice: vi.fn(),
  getCurrentPrices: vi.fn(),
  // Re-export actual types
  ...vi.importActual("../../../../src/publishers/sources/coingecko/CoinGeckoDSL"),
}));

// Mock the MCP Actor creation
vi.mock("../../../../src/publishers/sources/coingecko/MarketDataReaderWithMCP", () => ({
  createCoinGeckoMarketDataReaderWithMCP: vi.fn(),
}));

import { createQiError, failure, success } from "@qi/core/base";
import {
  getCurrentPrice,
  getCurrentPrices,
} from "../../../../src/publishers/sources/coingecko/CoinGeckoDSL";
import { createCoinGeckoMarketDataReaderWithMCP } from "../../../../src/publishers/sources/coingecko/MarketDataReaderWithMCP";

describe("CoinGeckoMarketDataReader (Actor)", () => {
  let actor: CoinGeckoMarketDataReader;
  let mockMCPClient: Client;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock MCP client
    mockMCPClient = {
      callTool: vi.fn(),
      initialize: vi.fn(),
      cleanup: vi.fn(),
    } as unknown as Client;

    // Mock MCP Actor creation
    vi.mocked(createCoinGeckoMarketDataReaderWithMCP).mockReturnValue(mockMCPClient);

    // Create Actor instance
    actor = new CoinGeckoMarketDataReader({
      name: "test-actor",
      useMCPClient: true,
      debug: false,
    });
  });

  describe("initialization with MCP client association", () => {
    it("should associate with MCP client during initialization", async () => {
      // Mock successful MCP client initialization
      vi.mocked(mockMCPClient.initialize).mockResolvedValue(undefined);

      const result = await actor.initialize();

      expect(result._tag).toBe("Right");
      expect(createCoinGeckoMarketDataReaderWithMCP).toHaveBeenCalled();
      expect(mockMCPClient.initialize).toHaveBeenCalled();
      expect(actor["mcpClientInitialized"]).toBe(true);
    });

    it("should handle MCP client association failure gracefully", async () => {
      // Mock MCP client initialization failure
      vi.mocked(mockMCPClient.initialize).mockRejectedValue(new Error("MCP init failed"));

      const result = await actor.initialize();

      // Should still succeed but without MCP client
      expect(result._tag).toBe("Right");
      expect(actor["mcpClientInitialized"]).toBe(false);
    });
  });

  describe("getCurrentPrice with MCP client orchestration", () => {
    beforeEach(async () => {
      // Initialize actor with MCP client
      vi.mocked(mockMCPClient.initialize).mockResolvedValue(undefined);
      await actor.initialize();
    });

    it("should call DSL function with associated MCP client", async () => {
      // Mock DSL function to return success
      vi.mocked(getCurrentPrice).mockResolvedValue(success(50000));

      const result = await actor.getCurrentPrice("bitcoin", "usd");

      // Verify DSL function was called with associated MCP client
      expect(getCurrentPrice).toHaveBeenCalledWith(mockMCPClient, "bitcoin", "usd");

      // Verify result
      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toBe(50000);
      }
    });

    it("should fall back to API when MCP client fails", async () => {
      // Mock DSL function to return error (MCP failure)
      const mcpError = failure(createQiError("MCP_ERROR", "MCP failed", "SYSTEM"));
      vi.mocked(getCurrentPrice).mockResolvedValue(mcpError);

      const result = await actor.getCurrentPrice("bitcoin", "usd");

      // Should attempt MCP first
      expect(getCurrentPrice).toHaveBeenCalledWith(mockMCPClient, "bitcoin", "usd");

      // Since API fallback is not implemented, should return API error
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.code).toBe("API_NOT_IMPLEMENTED");
      }
    });

    it("should work without MCP client when not available", async () => {
      // Create actor without MCP client
      const actorNoMCP = new CoinGeckoMarketDataReader({
        name: "test-actor-no-mcp",
        useMCPClient: false,
        fallbackToAPI: false,
        debug: false,
      });

      await actorNoMCP.initialize();

      const result = await actorNoMCP.getCurrentPrice("bitcoin");

      // Should not call DSL function since no MCP client
      expect(getCurrentPrice).not.toHaveBeenCalled();

      // Should return error since no data sources available
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.code).toBe("PRICE_NOT_AVAILABLE");
      }
    });
  });

  describe("getCurrentPrices with MCP client orchestration", () => {
    beforeEach(async () => {
      vi.mocked(mockMCPClient.initialize).mockResolvedValue(undefined);
      await actor.initialize();
    });

    it("should call DSL function with associated MCP client", async () => {
      const mockPrices = [
        {
          coinId: "bitcoin",
          symbol: "BTC",
          usdPrice: 50000,
          lastUpdated: new Date(),
          source: "test",
          attribution: "test",
        },
      ];

      vi.mocked(getCurrentPrices).mockResolvedValue(success(mockPrices));

      const options = { vsCurrencies: ["usd", "eur"] };
      const result = await actor.getCurrentPrices(["bitcoin"], options);

      // Verify DSL function was called with associated MCP client
      expect(getCurrentPrices).toHaveBeenCalledWith(mockMCPClient, ["bitcoin"], options);

      expect(result._tag).toBe("Right");
      if (result._tag === "Right") {
        expect(result.right).toEqual(mockPrices);
      }
    });

    it("should handle orchestration of multiple data sources", async () => {
      // Mock MCP failure
      const mcpError = failure(createQiError("MCP_ERROR", "MCP failed", "SYSTEM"));
      vi.mocked(getCurrentPrices).mockResolvedValue(mcpError);

      const result = await actor.getCurrentPrices(["bitcoin", "ethereum"]);

      // Should try MCP first, then fall back (but API not implemented)
      expect(getCurrentPrices).toHaveBeenCalledWith(mockMCPClient, ["bitcoin", "ethereum"], {});
      expect(result._tag).toBe("Left");
    });
  });

  describe("status reporting", () => {
    it("should report correct status with MCP client", async () => {
      vi.mocked(mockMCPClient.initialize).mockResolvedValue(undefined);
      await actor.initialize();

      const status = actor.getStatus();

      expect(status.isInitialized).toBe(true);
      expect(status.mcpClientInitialized).toBe(true);
      expect(status.hasMCPClient).toBe(true);
      expect(status.dataSource).toBe("mcp+api");
    });

    it("should report correct status without MCP client", async () => {
      const actorNoMCP = new CoinGeckoMarketDataReader({
        name: "test-actor-no-mcp",
        useMCPClient: false,
        debug: false,
      });

      await actorNoMCP.initialize();

      const status = actorNoMCP.getStatus();

      expect(status.isInitialized).toBe(true);
      expect(status.mcpClientInitialized).toBe(false);
      expect(status.hasMCPClient).toBe(false);
      expect(status.dataSource).toBe("api-only");
    });
  });

  describe("cleanup", () => {
    it("should cleanup MCP client association", async () => {
      vi.mocked(mockMCPClient.initialize).mockResolvedValue(undefined);
      await actor.initialize();

      const result = await actor.cleanup();

      expect(result._tag).toBe("Right");
      expect(mockMCPClient.cleanup).toHaveBeenCalled();
      expect(actor["mcpClientInitialized"]).toBe(false);
    });
  });
});
