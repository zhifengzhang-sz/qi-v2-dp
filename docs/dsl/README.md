# QiCore Market Data DSL - Core Principles

## What Defines the Quality of Our Project

The DSL design reveals the fundamental quality of our entire project. This is not just about code - it's about understanding what makes great software architecture.

## DSL Definition and Boundaries

### What DSL Provides

1. **Data Class Definitions** - Pure data structures based on **FIX Protocol 4.4** and **industry standards** (Price, OHLCV, Level1)
2. **Generic Interfaces** - Universal operations (getPrice(), getOHLCV(), getLevel1())

**📋 For detailed standards compliance, see [standards.md](./standards.md)**

### What DSL Does NOT Provide

- Context data (exchange routing, ticker interpretation, business logic)
- Asset-specific behavior or market-specific implementation details
- Capabilities, inheritance hierarchies, or complex patterns

## Core Principle

> **The DSL defines the vocabulary (data types) and grammar (interface methods) of market data operations. The meaning and behavior are entirely the responsibility of the implementing user/actor.**

This separation is **THE defining quality of our project**.

## Architecture Quality Indicators

### ✅ Good Architecture (What We Build)
- Clear boundaries between abstraction and implementation
- Pure interfaces that don't leak implementation details
- Extensible design that doesn't require core changes
- User empowerment - they control behavior, not the framework
- Simple, stable abstractions that survive changing requirements

### ❌ Poor Architecture (What We Avoid)
- Mixed concerns (DSL trying to solve implementation problems)
- Leaky abstractions (capabilities, market-specific methods)
- Brittle design (adding new assets requires DSL changes)
- Framework dictatorship - prescribing how users must behave
- Complex inheritance patterns that obscure simple concepts

## Example: The Right Way

```typescript
// DSL: Context-agnostic, pure abstraction
interface MarketDataReader {
  getPrice(ticker: string): Promise<Result<Price>>;
  getOHLCV(ticker: string, timeframe: string): Promise<Result<OHLCV>>;
  getLevel1(ticker: string): Promise<Result<Level1>>;
}

// Data: Pure structure based on industry standards
interface Price {
  timestamp: Date;    // FIX Protocol MDEntryTime (273)
  price: number;      // FIX Protocol MDEntryPrice (270)  
  size: number;       // FIX Protocol MDEntrySize (271)
}

interface Level1 {
  timestamp: Date;    // Quote observation time
  bidPrice: number;   // FIX Protocol best bid price
  bidSize: number;    // FIX Protocol bid size
  askPrice: number;   // FIX Protocol best ask price
  askSize: number;    // FIX Protocol ask size
}

// User Implementation: Context-aware behavior
class CoinGeckoReader implements MarketDataReader {
  async getPrice(ticker: string): Promise<Result<Price>> {
    // User decides: "BTC" → call CoinGecko bitcoin endpoint
    // User decides: error handling, retry logic, caching
    // User decides: how to map response to Price structure
    // DSL just defines the contract, nothing more
  }
}

class AlphaVantageReader implements MarketDataReader {
  async getPrice(ticker: string): Promise<Result<Price>> {
    // User decides: "AAPL" → call AlphaVantage stocks API
    // User decides: "BTC" → return error (not supported)
    // Different behavior, same DSL contract
  }
}
```

## Extensibility Without DSL Changes

### Different Asset Classes
- **Stock**: `price("AAPL")` → stock trading price
- **Crypto**: `price("BTC")` → crypto trading price (exchange TBD by user)
- **Treasury**: `price("10Y")` → bond price (maturity handling TBD by user)

**Same DSL, different user interpretation.**

### Different Market Types
- **Cash Market**: `price("AAPL")` → spot price
- **Futures Market**: `price("AAPL-MAR24")` → futures price

**Future extension without touching existing DSL.**

### Different Implementations
- **CoinGecko**: Interprets tickers as crypto symbols
- **Alpha Vantage**: Interprets tickers as stock symbols  
- **Multi-Asset**: Routes based on ticker format

**User choice, not DSL prescription.**

## Exchange and Market Context Management

### Core Principle: Context is Implementation Responsibility

The DSL deliberately **does not include exchange IDs or market IDs** in data structures. These are **implementation context** that varies by data source and use case.

### Real-World Context Examples

#### CoinGecko Implementation Context
```typescript
class CoinGeckoReader implements MarketDataReader {
  // CoinGecko context:
  // - Exchange: "aggregated" (CoinGecko provides aggregated data)
  // - Market: "crypto" (cash market assumed)
  // - Book keeping: CoinGecko handles exchange aggregation internally
  
  async getPrice(ticker: string): Promise<Result<Price>> {
    // User decides: "BTC" → aggregate across all exchanges
    // CoinGecko module handles the aggregation logic
    // DSL just returns pure Price data
  }
}
```

#### Coinbase Implementation Context
```typescript
class CoinbaseReader implements MarketDataReader {
  // Coinbase context:
  // - Exchange: "coinbase" (specific exchange)
  // - Market: "crypto" (cash market)
  // - Book keeping: Coinbase module handles exchange-specific APIs
  
  async getPrice(ticker: string): Promise<Result<Price>> {
    // User decides: "BTC" → Coinbase Pro exchange specifically
    // Coinbase module handles exchange authentication, rate limits
    // DSL just returns pure Price data
  }
}
```

#### TwelveData Implementation Context
```typescript
class TwelveDataReader implements MarketDataReader {
  // TwelveData context:
  // - Exchange: varies ("NYSE", "NASDAQ", "COINBASE", etc.)
  // - Market: varies ("equity", "crypto", "forex")
  // - Book keeping: TwelveData module manages exchange/market mapping
  
  async getPrice(ticker: string): Promise<Result<Price>> {
    // User decides: "AAPL" → query with exchangeId="NYSE", marketId="equity"
    // TwelveData module handles the exchange/market ID mapping
    // DSL just returns pure Price data
  }
}
```

### Why DSL Doesn't Handle Context

**Different data sources have different context requirements:**

- **CoinGecko**: No exchange ID needed (aggregated data)
- **Coinbase**: Fixed exchange context (always Coinbase)
- **TwelveData**: Requires explicit exchange ID and market ID for queries
- **Alpha Vantage**: Symbol format encodes exchange (`AAPL` vs `AAPL.L`)
- **IEX Cloud**: Different endpoints for different exchanges

**Context management is data source specific:**
- Authentication and API keys
- Rate limiting and quotas  
- Request formatting and parameter mapping
- Error handling and retry logic
- Exchange/market routing decisions

### Implementation Responsibility

Each implementation decides:

1. **How to interpret tickers** in their context
   - `"BTC"` → `bitcoin` (CoinGecko) vs `"BTC-USD"` (Coinbase)
   - `"AAPL"` → NYSE equity (default) vs specify exchange explicitly

2. **How to manage exchange/market context**
   - Store in configuration
   - Encode in ticker format
   - Route based on asset type
   - Query external mapping services

3. **How to handle context-specific requirements**
   - API authentication per exchange
   - Exchange-specific rate limits
   - Market-specific data formats
   - Exchange trading hours and availability

### Clean Separation Benefits

This separation allows:
- **Flexible routing**: Same DSL, different exchange strategies
- **Easy migration**: Switch from one data source to another
- **Multi-source**: Aggregate data from multiple exchanges
- **Context evolution**: Exchange requirements change, DSL stays stable

**DSL = Pure data vocabulary. Implementation = Contextual meaning.**

## Industry Standards Compliance

Our DSL data structures are based on **FIX Protocol 4.4** and established financial industry standards.

**📋 Complete standards documentation: [standards.md](./standards.md)**

### Quick Reference

**Price Data** → **FIX Protocol 4.4 MDEntryType=2 (Trade)**
```typescript
interface Price {
  timestamp: Date;    // FIX Tag 273 (MDEntryTime)
  price: number;      // FIX Tag 270 (MDEntryPrice)
  size: number;       // FIX Tag 271 (MDEntrySize)
}
```

**Level1 Data** → **FIX Protocol 4.4 MDEntryType=0/1 (Bid/Offer)**
```typescript
interface Level1 {
  timestamp: Date;    // Quote observation time
  bidPrice: number;   // FIX Tag 270 + MDEntryType=0
  bidSize: number;    // FIX Tag 271 + MDEntryType=0
  askPrice: number;   // FIX Tag 270 + MDEntryType=1
  askSize: number;    // FIX Tag 271 + MDEntryType=1
}
```

**OHLCV Data** → **Industry Standard Time Series Aggregation**
```typescript
interface OHLCV {
  timestamp: Date;    // Bar start time
  open: number;       // First price in period
  high: number;       // Highest price in period
  low: number;        // Lowest price in period
  close: number;      // Last price in period
  volume: number;     // Total volume in period
}
```

**Why Standards Matter:**
- ✅ **Professional Quality**: Recognized by financial industry
- ✅ **Interoperability**: Works with existing trading systems
- ✅ **Proven Design**: Decades of real-world usage
- ✅ **Tool Ecosystem**: Compatible with financial analysis libraries

## Design Maturity Demonstration

This principle demonstrates:

1. **Understanding Boundaries** - What belongs in abstraction vs implementation
2. **User Respect** - Trusting users to make intelligent decisions
3. **System Longevity** - Building abstractions that survive requirement changes
4. **Professional Quality** - Clean separation that scales indefinitely

## The DSL Promise

**We promise:**
- Simple, stable interfaces that never need to change
- Pure data types with no hidden behavior
- Freedom to implement any market logic you need
- Zero framework lock-in or prescribed patterns

**We do NOT promise:**
- To solve your ticker parsing problems
- To route your requests to the right exchange
- To validate your market data logic
- To constrain how you interpret our interfaces
- To manage exchange IDs or market IDs
- To handle context-specific data source requirements

## Market Context Setup

**DSL = Key data vocabulary. Context managers = Context data handling.**

The DSL focuses on key data (Price, OHLCV, Level1). Context managers (like `lib/src/market/crypto`) handle context data:
- Exchange routing and ticker interpretation
- Market-specific APIs and business logic
- Actors map between DSL types and target system formats

Example: `lib/src/market/crypto` contains all cryptocurrency market context and actors.

## Summary

**Great frameworks know what NOT to include.**

The DSL provides the essential vocabulary and grammar. Market contexts provide domain expertise. Everything else belongs to individual actors.

---

*This document defines the core philosophy of the QiCore project. All DSL design decisions should align with these principles.*