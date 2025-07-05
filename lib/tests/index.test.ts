// lib/tests/index.test.ts
import { describe, expect, it } from "vitest";
import * as lib from "../index";

describe("lib exports", () => {
  it("should export RedpandaMCPLauncher", () => {
    expect(lib.RedpandaMCPLauncher).toBeDefined();
  });

  it("should export RedpandaClient", () => {
    expect(lib.RedpandaClient).toBeDefined();
  });

  it("should export RedpandaConfigManager", () => {
    expect(lib.RedpandaConfigManager).toBeDefined();
  });

  it("should export CryptoDataPublisher", () => {
    expect(lib.CryptoDataPublisher).toBeDefined();
  });

  it("should export CryptoDataConsumer", () => {
    expect(lib.CryptoDataConsumer).toBeDefined();
  });

  it("should export specialized publishers", () => {
    expect(lib.PricePublisher).toBeDefined();
    expect(lib.OHLCVPublisher).toBeDefined();
    expect(lib.AnalyticsPublisher).toBeDefined();
  });

  it("should export specialized consumers", () => {
    expect(lib.PriceConsumer).toBeDefined();
    expect(lib.OHLCVConsumer).toBeDefined();
    expect(lib.AnalyticsConsumer).toBeDefined();
  });
});
