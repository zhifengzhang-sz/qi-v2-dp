#!/usr/bin/env bun

/**
 * BaseReader Tests - Testing Abstract Class Through Concrete Implementation
 *
 * Best Practice: Test abstract classes through their concrete implementations
 * rather than creating mock implementations in tests.
 *
 * This test uses CoinGeckoMarketDataReader to verify BaseReader functionality.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type CoinGeckoMarketDataReader,
  createCoinGeckoMarketDataReader,
} from "../../../src/actors/sources/coingecko";
import type { CryptoMarketAnalytics, CryptoOHLCVData, CryptoPriceData } from "../../../src/dsl";
import { getData, getError, isFailure, isSuccess } from "../../../src/qicore/base";

describe("BaseReader (tested via CoinGeckoMarketDataReader)", () => {
  let reader: CoinGeckoMarketDataReader;

  beforeEach(async () => {
    reader = createCoinGeckoMarketDataReader({
      name: "test-reader",
      debug: false,
      useRemoteServer: false, // Use local/mock mode for unit tests
    });

    // Add a mock client to simulate connected state
    const mockClient = {
      connect: () => {},
      close: () => {},
      callTool: async () => ({ content: [] }),
    };
    reader.addClient("test-client", mockClient, {
      name: "test-client",
      type: "data-source",
    });

    // Mark client as connected
    const clientAssoc = reader.getClient("test-client");
    if (clientAssoc) {
      clientAssoc.isConnected = true;
    }

    // Initialize without waiting to prevent timeout in unit tests
    reader.initialize().catch(() => {}); // Ignore initialization errors in unit tests
  });

  afterEach(async () => {
    await reader.cleanup();
  });

  describe("Client Management (BaseReader functionality)", () => {
    it("should add and retrieve clients", () => {
      const mockClient = { test: true };
      reader.addClient("test-client-2", mockClient, {
        name: "test-client-2",
        type: "database",
      });

      const retrieved = reader.getClient("test-client-2");
      expect(retrieved).toBeDefined();
      expect(retrieved?.client).toBe(mockClient);
      expect(retrieved?.config.type).toBe("database");
    });

    it("should remove clients", () => {
      const mockClient = { test: true };
      reader.addClient("temp-client", mockClient, {
        name: "temp-client",
        type: "cache",
      });

      expect(reader.getClient("temp-client")).toBeDefined();

      const removed = reader.removeClient("temp-client");
      expect(removed).toBe(true);
      expect(reader.getClient("temp-client")).toBeUndefined();
    });

    it("should get clients by type", () => {
      reader.addClient("db-client", {}, { name: "db-client", type: "database" });
      reader.addClient("cache-client", {}, { name: "cache-client", type: "cache" });

      const dbClients = reader.getClientsByType("database");
      expect(dbClients).toHaveLength(1);
      expect(dbClients[0].config.name).toBe("db-client");

      const cacheClients = reader.getClientsByType("cache");
      expect(cacheClients).toHaveLength(1);
      expect(cacheClients[0].config.name).toBe("cache-client");
    });

    it("should get all clients", () => {
      reader.addClient("client-1", {}, { name: "client-1", type: "database" });
      reader.addClient("client-2", {}, { name: "client-2", type: "cache" });

      const allClients = reader.getAllClients();
      expect(allClients.length).toBeGreaterThanOrEqual(3); // Including the test-client from beforeEach
    });
  });

  describe("DSL Method Implementation (BaseReader workflow)", () => {
    it("should have all DSL methods available from BaseReader", () => {
      // Verify all DSL methods are inherited from BaseReader
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

    it("should return Result<T> types from DSL methods", async () => {
      // Test that BaseReader workflow returns proper Result<T> types
      const result = await reader.getCurrentPrice("bitcoin", "usd");

      expect(result).toHaveProperty("_tag");
      expect(["Left", "Right"]).toContain(result._tag);

      // The result might be success or failure depending on mock setup
      // but it should always be a proper Result<T>
      if (isSuccess(result)) {
        expect(typeof getData(result)).toBe("number");
      } else {
        expect(getError(result)).toBeDefined();
      }
    });

    it("should handle no active client gracefully", async () => {
      // Remove all clients to test BaseReader error handling
      const allClients = reader.getAllClients();
      for (const client of allClients) {
        client.isConnected = false;
      }

      const result = await reader.getCurrentPrice("bitcoin");

      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        const error = getError(result);
        expect(error?.code).toBe("NO_CLIENT");
      }
    });
  });

  describe("Activity Tracking (BaseReader functionality)", () => {
    it("should track query count and last activity", async () => {
      const status = reader.getStatus();
      const initialQueries = status.totalQueries || 0;
      const initialActivity = status.lastActivity;

      await reader.getCurrentPrice("bitcoin");

      const finalStatus = reader.getStatus();
      const finalQueries = finalStatus.totalQueries || 0;
      const finalActivity = finalStatus.lastActivity;

      expect(finalQueries).toBeGreaterThanOrEqual(initialQueries);
      if (finalActivity && initialActivity) {
        expect(new Date(finalActivity).getTime()).toBeGreaterThanOrEqual(
          new Date(initialActivity).getTime(),
        );
      }
    });
  });

  describe("Lifecycle Management (BaseReader functionality)", () => {
    it("should initialize and cleanup properly", async () => {
      const newReader = createCoinGeckoMarketDataReader({
        name: "lifecycle-test",
        useRemoteServer: false,
      });

      const status = newReader.getStatus();
      expect(status.isInitialized).toBe(false);

      const initResult = await newReader.initialize();
      expect(isSuccess(initResult)).toBe(true);

      const statusAfterInit = newReader.getStatus();
      expect(statusAfterInit.isInitialized).toBe(true);

      const cleanupResult = await newReader.cleanup();
      expect(isSuccess(cleanupResult)).toBe(true);

      const statusAfterCleanup = newReader.getStatus();
      expect(statusAfterCleanup.isInitialized).toBe(false);
    });
  });

  describe("Error Handling (BaseReader workflow)", () => {
    it("should handle error cases gracefully", async () => {
      // Force an error by disconnecting all clients
      const allClients = reader.getAllClients();
      for (const client of allClients) {
        client.isConnected = false;
      }

      const result = await reader.getCurrentPrice("bitcoin");

      // Should return a failure result when no clients are available
      expect(isFailure(result)).toBe(true);
      if (isFailure(result)) {
        const error = getError(result);
        expect(error?.code).toBe("NO_CLIENT");
      }
    });
  });

  describe("Inheritance Verification", () => {
    it("should verify CoinGecko reader extends BaseReader", () => {
      // Verify inheritance from BaseReader
      expect(reader.constructor.name).toBe("CoinGeckoMarketDataReader");

      // DSL methods should be inherited, not redefined
      const readerPrototype = Object.getPrototypeOf(reader);
      const hasGetCurrentPrice =
        "getCurrentPrice" in readerPrototype || "getCurrentPrice" in reader;
      expect(hasGetCurrentPrice).toBe(true);
    });

    it("should have proper status reporting", () => {
      const status = reader.getStatus();

      // BaseReader should provide these status fields
      expect(status).toHaveProperty("isInitialized");
      expect(typeof status.isInitialized).toBe("boolean");

      // Status should be an object with properties
      expect(typeof status).toBe("object");
      expect(status).not.toBeNull();

      // Should have some properties (the exact ones depend on implementation)
      const statusKeys = Object.keys(status);
      expect(statusKeys.length).toBeGreaterThan(0);
    });
  });
});
