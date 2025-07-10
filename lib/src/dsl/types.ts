#!/usr/bin/env bun

/**
 * FP DSL Types - Core Data Structures
 *
 * FIX Protocol 4.4 compliant market data types.
 * These are the fundamental data structures used throughout the FP system.
 */

// =============================================================================
// MARKET DATA TYPES - FIX PROTOCOL 4.4 COMPLIANT
// =============================================================================

/**
 * Price Data Class - Immutable price point
 * TypeScript Data Class pattern using readonly properties
 */
export class Price {
  constructor(
    public readonly timestamp: Date, // FIX Tag 273 (MDEntryTime)
    public readonly price: number, // FIX Tag 270 (MDEntryPrice)
    public readonly size: number, // FIX Tag 271 (MDEntrySize)
  ) {}

  static create(timestamp: Date, price: number, size: number): Price {
    return new Price(timestamp, price, size);
  }

  equals(other: Price): boolean {
    return (
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.price === other.price &&
      this.size === other.size
    );
  }

  toString(): string {
    return `Price(${this.timestamp.toISOString()}, ${this.price}, ${this.size})`;
  }
}

/**
 * OHLCV Data Class - Immutable candlestick data
 */
export class OHLCV {
  constructor(
    public readonly timestamp: Date, // Bar start time
    public readonly open: number, // First price in period
    public readonly high: number, // Highest price in period
    public readonly low: number, // Lowest price in period
    public readonly close: number, // Last price in period
    public readonly volume: number, // Total volume in period
  ) {}

  static create(
    timestamp: Date,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number,
  ): OHLCV {
    return new OHLCV(timestamp, open, high, low, close, volume);
  }

  equals(other: OHLCV): boolean {
    return (
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.open === other.open &&
      this.high === other.high &&
      this.low === other.low &&
      this.close === other.close &&
      this.volume === other.volume
    );
  }

  toString(): string {
    return `OHLCV(${this.timestamp.toISOString()}, O:${this.open}, H:${this.high}, L:${this.low}, C:${this.close}, V:${this.volume})`;
  }
}

/**
 * Level1 Data Class - Immutable bid/ask quote
 */
export class Level1 {
  constructor(
    public readonly timestamp: Date, // Quote observation time
    public readonly bidPrice: number, // FIX Tag 270 + MDEntryType=0
    public readonly bidSize: number, // FIX Tag 271 + MDEntryType=0
    public readonly askPrice: number, // FIX Tag 270 + MDEntryType=1
    public readonly askSize: number, // FIX Tag 271 + MDEntryType=1
  ) {}

  static create(
    timestamp: Date,
    bidPrice: number,
    bidSize: number,
    askPrice: number,
    askSize: number,
  ): Level1 {
    return new Level1(timestamp, bidPrice, bidSize, askPrice, askSize);
  }

  equals(other: Level1): boolean {
    return (
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.bidPrice === other.bidPrice &&
      this.bidSize === other.bidSize &&
      this.askPrice === other.askPrice &&
      this.askSize === other.askSize
    );
  }

  toString(): string {
    return `Level1(${this.timestamp.toISOString()}, Bid:${this.bidPrice}@${this.bidSize}, Ask:${this.askPrice}@${this.askSize})`;
  }
}

// =============================================================================
// MARKET CONTEXT TYPES
// =============================================================================

/**
 * Exchange Data Class - Immutable exchange information
 */
export class Exchange {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly region: string,
    public readonly type: "centralized" | "decentralized" | "aggregated",
  ) {}

  static create(
    id: string,
    name: string,
    region: string,
    type: "centralized" | "decentralized" | "aggregated",
  ): Exchange {
    return new Exchange(id, name, region, type);
  }

  equals(other: Exchange): boolean {
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.region === other.region &&
      this.type === other.type
    );
  }

  toString(): string {
    return `Exchange(${this.id}, ${this.name}, ${this.region}, ${this.type})`;
  }
}

/**
 * Instrument Type Enumeration
 * Differentiates between cash, futures, and derivative markets
 */
export enum InstrumentType {
  CASH = "cash", // Spot/cash markets
  FUTURE = "future", // Futures contracts
  OPTION = "option", // Options contracts
  SWAP = "swap", // Swap contracts
  FORWARD = "forward", // Forward contracts
  CFD = "cfd", // Contracts for difference
  WARRANT = "warrant", // Warrants
  BOND = "bond", // Bonds
  ETF = "etf", // Exchange-traded funds
  INDEX = "index", // Market indices
}

/**
 * Market Symbol Data Class - Immutable symbol information
 */
export class MarketSymbol {
  constructor(
    public readonly ticker: string,
    public readonly name: string,
    public readonly assetClass: "crypto" | "equity" | "bond" | "commodity" | "forex",
    public readonly currency: string,
    public readonly instrumentType: InstrumentType, // New field for instrument differentiation
    public readonly contractDetails?: {
      // Optional contract details for derivatives
      expirationDate?: Date;
      strikePrice?: number;
      multiplier?: number;
      underlying?: string;
    },
  ) {}

  static create(
    ticker: string,
    name: string,
    assetClass: "crypto" | "equity" | "bond" | "commodity" | "forex",
    currency: string,
    instrumentType: InstrumentType,
    contractDetails?: {
      expirationDate?: Date;
      strikePrice?: number;
      multiplier?: number;
      underlying?: string;
    },
  ): MarketSymbol {
    return new MarketSymbol(ticker, name, assetClass, currency, instrumentType, contractDetails);
  }

  equals(other: MarketSymbol): boolean {
    return (
      this.ticker === other.ticker &&
      this.name === other.name &&
      this.assetClass === other.assetClass &&
      this.currency === other.currency &&
      this.instrumentType === other.instrumentType &&
      JSON.stringify(this.contractDetails) === JSON.stringify(other.contractDetails)
    );
  }

  toString(): string {
    const contractInfo = this.contractDetails
      ? `, Contract:${JSON.stringify(this.contractDetails)}`
      : "";
    return `MarketSymbol(${this.ticker}, ${this.name}, ${this.assetClass}, ${this.currency}, ${this.instrumentType}${contractInfo})`;
  }
}

/**
 * Market Context Data Class - Immutable market context
 * NOTE: Timestamp removed as requested - context is about market identity, not time
 */
export class MarketContext {
  constructor(
    public readonly exchange: Exchange,
    public readonly symbol: MarketSymbol,
  ) {}

  static create(exchange: Exchange, symbol: MarketSymbol): MarketContext {
    return new MarketContext(exchange, symbol);
  }

  /**
   * Check if this context represents the same market as another
   */
  equals(other: MarketContext): boolean {
    return this.exchange.equals(other.exchange) && this.symbol.equals(other.symbol);
  }

  toString(): string {
    return `MarketContext(${this.exchange.toString()}, ${this.symbol.toString()})`;
  }
}
