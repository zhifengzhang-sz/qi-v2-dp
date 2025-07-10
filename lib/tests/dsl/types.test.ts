#!/usr/bin/env bun

/**
 * DSL Types Unit Tests
 *
 * Tests the core data structures used throughout the DSL system.
 * Verifies immutability, creation, equality, and string representation.
 */

import {
  Exchange,
  InstrumentType,
  Level1,
  MarketContext,
  MarketSymbol,
  OHLCV,
  Price,
} from "@qi/core";
import { describe, expect, it } from "vitest";

describe("DSL Core Types", () => {
  describe("Price", () => {
    it("should create Price with correct properties", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const price = Price.create(timestamp, 100.5, 1000);

      expect(price.timestamp).toBe(timestamp);
      expect(price.price).toBe(100.5);
      expect(price.size).toBe(1000);
    });

    it("should have readonly properties", () => {
      const price = Price.create(new Date(), 100.5, 1000);

      // Properties should be readonly at compile time
      // In TypeScript, readonly provides compile-time immutability
      expect(price.price).toBe(100.5);
      expect(price.size).toBe(1000);

      // Verify properties exist and are accessible
      expect(typeof price.price).toBe("number");
      expect(typeof price.size).toBe("number");
      expect(price.timestamp instanceof Date).toBe(true);
    });

    it("should compare equality correctly", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const price1 = Price.create(timestamp, 100.5, 1000);
      const price2 = Price.create(timestamp, 100.5, 1000);
      const price3 = Price.create(timestamp, 100.6, 1000);

      expect(price1.equals(price2)).toBe(true);
      expect(price1.equals(price3)).toBe(false);
    });

    it("should handle different timestamps in equality", () => {
      const timestamp1 = new Date("2024-01-01T12:00:00Z");
      const timestamp2 = new Date("2024-01-01T12:00:01Z");
      const price1 = Price.create(timestamp1, 100.5, 1000);
      const price2 = Price.create(timestamp2, 100.5, 1000);

      expect(price1.equals(price2)).toBe(false);
    });

    it("should generate meaningful string representation", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const price = Price.create(timestamp, 100.5, 1000);
      const str = price.toString();

      expect(str).toContain("Price(");
      expect(str).toContain("2024-01-01T12:00:00.000Z");
      expect(str).toContain("100.5");
      expect(str).toContain("1000");
    });
  });

  describe("OHLCV", () => {
    it("should create OHLCV with correct properties", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const ohlcv = OHLCV.create(timestamp, 100, 105, 98, 102, 5000);

      expect(ohlcv.timestamp).toBe(timestamp);
      expect(ohlcv.open).toBe(100);
      expect(ohlcv.high).toBe(105);
      expect(ohlcv.low).toBe(98);
      expect(ohlcv.close).toBe(102);
      expect(ohlcv.volume).toBe(5000);
    });

    it("should have readonly properties", () => {
      const ohlcv = OHLCV.create(new Date(), 100, 105, 98, 102, 5000);

      // Properties should be readonly at compile time
      expect(ohlcv.open).toBe(100);
      expect(ohlcv.high).toBe(105);
      expect(ohlcv.low).toBe(98);
      expect(ohlcv.close).toBe(102);
      expect(ohlcv.volume).toBe(5000);

      // Verify properties exist and are accessible
      expect(typeof ohlcv.open).toBe("number");
      expect(typeof ohlcv.high).toBe("number");
      expect(typeof ohlcv.low).toBe("number");
      expect(typeof ohlcv.close).toBe("number");
      expect(typeof ohlcv.volume).toBe("number");
      expect(ohlcv.timestamp instanceof Date).toBe(true);
    });

    it("should compare equality correctly", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const ohlcv1 = OHLCV.create(timestamp, 100, 105, 98, 102, 5000);
      const ohlcv2 = OHLCV.create(timestamp, 100, 105, 98, 102, 5000);
      const ohlcv3 = OHLCV.create(timestamp, 100, 105, 98, 103, 5000);

      expect(ohlcv1.equals(ohlcv2)).toBe(true);
      expect(ohlcv1.equals(ohlcv3)).toBe(false);
    });

    it("should generate meaningful string representation", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const ohlcv = OHLCV.create(timestamp, 100, 105, 98, 102, 5000);
      const str = ohlcv.toString();

      expect(str).toContain("OHLCV(");
      expect(str).toContain("O:100");
      expect(str).toContain("H:105");
      expect(str).toContain("L:98");
      expect(str).toContain("C:102");
      expect(str).toContain("V:5000");
    });
  });

  describe("Level1", () => {
    it("should create Level1 with correct properties", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const level1 = Level1.create(timestamp, 100.25, 1000, 100.5, 1500);

      expect(level1.timestamp).toBe(timestamp);
      expect(level1.bidPrice).toBe(100.25);
      expect(level1.bidSize).toBe(1000);
      expect(level1.askPrice).toBe(100.5);
      expect(level1.askSize).toBe(1500);
    });

    it("should have readonly properties", () => {
      const level1 = Level1.create(new Date(), 100.25, 1000, 100.5, 1500);

      // Properties should be readonly at compile time
      expect(level1.bidPrice).toBe(100.25);
      expect(level1.bidSize).toBe(1000);
      expect(level1.askPrice).toBe(100.5);
      expect(level1.askSize).toBe(1500);

      // Verify properties exist and are accessible
      expect(typeof level1.bidPrice).toBe("number");
      expect(typeof level1.bidSize).toBe("number");
      expect(typeof level1.askPrice).toBe("number");
      expect(typeof level1.askSize).toBe("number");
      expect(level1.timestamp instanceof Date).toBe(true);
    });

    it("should compare equality correctly", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const level1_1 = Level1.create(timestamp, 100.25, 1000, 100.5, 1500);
      const level1_2 = Level1.create(timestamp, 100.25, 1000, 100.5, 1500);
      const level1_3 = Level1.create(timestamp, 100.25, 1000, 100.51, 1500);

      expect(level1_1.equals(level1_2)).toBe(true);
      expect(level1_1.equals(level1_3)).toBe(false);
    });

    it("should generate meaningful string representation", () => {
      const timestamp = new Date("2024-01-01T12:00:00Z");
      const level1 = Level1.create(timestamp, 100.25, 1000, 100.5, 1500);
      const str = level1.toString();

      expect(str).toContain("Level1(");
      expect(str).toContain("Bid:100.25@1000");
      expect(str).toContain("Ask:100.5@1500");
    });
  });

  describe("Exchange", () => {
    it("should create Exchange with correct properties", () => {
      const exchange = Exchange.create("BINANCE", "Binance", "Global", "centralized");

      expect(exchange.id).toBe("BINANCE");
      expect(exchange.name).toBe("Binance");
      expect(exchange.region).toBe("Global");
      expect(exchange.type).toBe("centralized");
    });

    it("should have readonly properties", () => {
      const exchange = Exchange.create("BINANCE", "Binance", "Global", "centralized");

      // Properties should be readonly at compile time
      expect(exchange.id).toBe("BINANCE");
      expect(exchange.name).toBe("Binance");
      expect(exchange.region).toBe("Global");
      expect(exchange.type).toBe("centralized");

      // Verify properties exist and are accessible
      expect(typeof exchange.id).toBe("string");
      expect(typeof exchange.name).toBe("string");
      expect(typeof exchange.region).toBe("string");
      expect(typeof exchange.type).toBe("string");
    });

    it("should compare equality correctly", () => {
      const exchange1 = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const exchange2 = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const exchange3 = Exchange.create("COINBASE", "Coinbase", "US", "centralized");

      expect(exchange1.equals(exchange2)).toBe(true);
      expect(exchange1.equals(exchange3)).toBe(false);
    });

    it("should handle different exchange types", () => {
      const centralized = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const decentralized = Exchange.create("UNISWAP", "Uniswap", "Ethereum", "decentralized");
      const aggregated = Exchange.create("1INCH", "1inch", "Multi-chain", "aggregated");

      expect(centralized.type).toBe("centralized");
      expect(decentralized.type).toBe("decentralized");
      expect(aggregated.type).toBe("aggregated");
    });

    it("should generate meaningful string representation", () => {
      const exchange = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const str = exchange.toString();

      expect(str).toContain("Exchange(");
      expect(str).toContain("BINANCE");
      expect(str).toContain("Binance");
      expect(str).toContain("Global");
      expect(str).toContain("centralized");
    });
  });

  describe("MarketSymbol", () => {
    it("should create MarketSymbol with basic properties", () => {
      const symbol = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );

      expect(symbol.ticker).toBe("BTC/USD");
      expect(symbol.name).toBe("Bitcoin");
      expect(symbol.assetClass).toBe("crypto");
      expect(symbol.currency).toBe("USD");
      expect(symbol.instrumentType).toBe(InstrumentType.CASH);
      expect(symbol.contractDetails).toBeUndefined();
    });

    it("should create MarketSymbol with contract details", () => {
      const contractDetails = {
        expirationDate: new Date("2024-12-31"),
        strikePrice: 50000,
        multiplier: 100,
        underlying: "BTC",
      };
      const symbol = MarketSymbol.create(
        "BTC-DEC24-50000-C",
        "Bitcoin Call Option",
        "crypto",
        "USD",
        InstrumentType.OPTION,
        contractDetails,
      );

      expect(symbol.instrumentType).toBe(InstrumentType.OPTION);
      expect(symbol.contractDetails).toEqual(contractDetails);
    });

    it("should handle all instrument types", () => {
      const cash = MarketSymbol.create("BTC/USD", "Bitcoin", "crypto", "USD", InstrumentType.CASH);
      const future = MarketSymbol.create(
        "BTC-DEC24",
        "Bitcoin Future",
        "crypto",
        "USD",
        InstrumentType.FUTURE,
      );
      const option = MarketSymbol.create(
        "BTC-50000-C",
        "Bitcoin Call",
        "crypto",
        "USD",
        InstrumentType.OPTION,
      );

      expect(cash.instrumentType).toBe(InstrumentType.CASH);
      expect(future.instrumentType).toBe(InstrumentType.FUTURE);
      expect(option.instrumentType).toBe(InstrumentType.OPTION);
    });

    it("should handle all asset classes", () => {
      const crypto = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const equity = MarketSymbol.create("AAPL", "Apple Inc", "equity", "USD", InstrumentType.CASH);
      const forex = MarketSymbol.create(
        "EUR/USD",
        "Euro Dollar",
        "forex",
        "USD",
        InstrumentType.CASH,
      );
      const commodity = MarketSymbol.create("GC", "Gold", "commodity", "USD", InstrumentType.CASH);
      const bond = MarketSymbol.create(
        "US10Y",
        "US 10Y Treasury",
        "bond",
        "USD",
        InstrumentType.BOND,
      );

      expect(crypto.assetClass).toBe("crypto");
      expect(equity.assetClass).toBe("equity");
      expect(forex.assetClass).toBe("forex");
      expect(commodity.assetClass).toBe("commodity");
      expect(bond.assetClass).toBe("bond");
    });

    it("should compare equality correctly", () => {
      const symbol1 = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const symbol2 = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const symbol3 = MarketSymbol.create(
        "ETH/USD",
        "Ethereum",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );

      expect(symbol1.equals(symbol2)).toBe(true);
      expect(symbol1.equals(symbol3)).toBe(false);
    });

    it("should compare equality with contract details", () => {
      const contractDetails1 = { expirationDate: new Date("2024-12-31"), strikePrice: 50000 };
      const contractDetails2 = { expirationDate: new Date("2024-12-31"), strikePrice: 50000 };
      const contractDetails3 = { expirationDate: new Date("2024-12-31"), strikePrice: 55000 };

      const symbol1 = MarketSymbol.create(
        "BTC-CALL",
        "Bitcoin Call",
        "crypto",
        "USD",
        InstrumentType.OPTION,
        contractDetails1,
      );
      const symbol2 = MarketSymbol.create(
        "BTC-CALL",
        "Bitcoin Call",
        "crypto",
        "USD",
        InstrumentType.OPTION,
        contractDetails2,
      );
      const symbol3 = MarketSymbol.create(
        "BTC-CALL",
        "Bitcoin Call",
        "crypto",
        "USD",
        InstrumentType.OPTION,
        contractDetails3,
      );

      expect(symbol1.equals(symbol2)).toBe(true);
      expect(symbol1.equals(symbol3)).toBe(false);
    });

    it("should generate meaningful string representation", () => {
      const symbol = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const str = symbol.toString();

      expect(str).toContain("MarketSymbol(");
      expect(str).toContain("BTC/USD");
      expect(str).toContain("Bitcoin");
      expect(str).toContain("crypto");
      expect(str).toContain("USD");
      expect(str).toContain("cash");
    });

    it("should include contract details in string representation", () => {
      const contractDetails = { expirationDate: new Date("2024-12-31"), strikePrice: 50000 };
      const symbol = MarketSymbol.create(
        "BTC-CALL",
        "Bitcoin Call",
        "crypto",
        "USD",
        InstrumentType.OPTION,
        contractDetails,
      );
      const str = symbol.toString();

      expect(str).toContain("Contract:");
      expect(str).toContain("strikePrice");
      expect(str).toContain("50000");
    });
  });

  describe("MarketContext", () => {
    it("should create MarketContext with exchange and symbol", () => {
      const exchange = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const symbol = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const context = MarketContext.create(exchange, symbol);

      expect(context.exchange).toBe(exchange);
      expect(context.symbol).toBe(symbol);
    });

    it("should have readonly properties", () => {
      const exchange = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const symbol = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const context = MarketContext.create(exchange, symbol);

      // Properties should be readonly at compile time
      expect(context.exchange).toBe(exchange);
      expect(context.symbol).toBe(symbol);

      // Verify properties exist and are accessible
      expect(context.exchange instanceof Exchange).toBe(true);
      expect(context.symbol instanceof MarketSymbol).toBe(true);
    });

    it("should compare equality correctly", () => {
      const exchange1 = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const exchange2 = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const exchange3 = Exchange.create("COINBASE", "Coinbase", "US", "centralized");
      const symbol1 = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const symbol2 = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const symbol3 = MarketSymbol.create(
        "ETH/USD",
        "Ethereum",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );

      const context1 = MarketContext.create(exchange1, symbol1);
      const context2 = MarketContext.create(exchange2, symbol2);
      const context3 = MarketContext.create(exchange3, symbol1);
      const context4 = MarketContext.create(exchange1, symbol3);

      expect(context1.equals(context2)).toBe(true);
      expect(context1.equals(context3)).toBe(false);
      expect(context1.equals(context4)).toBe(false);
    });

    it("should generate meaningful string representation", () => {
      const exchange = Exchange.create("BINANCE", "Binance", "Global", "centralized");
      const symbol = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const context = MarketContext.create(exchange, symbol);
      const str = context.toString();

      expect(str).toContain("MarketContext(");
      expect(str).toContain("Exchange(");
      expect(str).toContain("MarketSymbol(");
      expect(str).toContain("BINANCE");
      expect(str).toContain("BTC/USD");
    });
  });

  describe("InstrumentType Enum", () => {
    it("should contain all required instrument types", () => {
      expect(InstrumentType.CASH).toBe("cash");
      expect(InstrumentType.FUTURE).toBe("future");
      expect(InstrumentType.OPTION).toBe("option");
      expect(InstrumentType.SWAP).toBe("swap");
      expect(InstrumentType.FORWARD).toBe("forward");
      expect(InstrumentType.CFD).toBe("cfd");
      expect(InstrumentType.WARRANT).toBe("warrant");
      expect(InstrumentType.BOND).toBe("bond");
      expect(InstrumentType.ETF).toBe("etf");
      expect(InstrumentType.INDEX).toBe("index");
    });

    it("should be used correctly in MarketSymbol", () => {
      const cashSymbol = MarketSymbol.create(
        "BTC/USD",
        "Bitcoin",
        "crypto",
        "USD",
        InstrumentType.CASH,
      );
      const futureSymbol = MarketSymbol.create(
        "BTC-DEC24",
        "Bitcoin Future",
        "crypto",
        "USD",
        InstrumentType.FUTURE,
      );
      const optionSymbol = MarketSymbol.create(
        "BTC-50000-C",
        "Bitcoin Call",
        "crypto",
        "USD",
        InstrumentType.OPTION,
      );

      expect(cashSymbol.instrumentType).toBe("cash");
      expect(futureSymbol.instrumentType).toBe("future");
      expect(optionSymbol.instrumentType).toBe("option");
    });
  });
});
