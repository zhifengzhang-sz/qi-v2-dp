# Abstract Actor Classes

## Overview

The abstract actor classes provide the foundation for all data reading and writing operations in the QiCore platform. They implement the complete DSL interface and workflow patterns, allowing concrete actors to focus solely on technology-specific implementations.

## BaseReader Class

Location: `lib/src/actors/abstract/readers/BaseReader.ts`

### Purpose
Provides unified DSL foundation for all data sources (MCP, APIs, databases, files, streaming).

### Key Features

#### 1. Complete DSL Implementation
All MarketDataReadingDSL methods implemented with workflow abstraction:

```typescript
// DSL method implemented in BaseReader
async getCurrentPrice(coinId: string, vsCurrency = "usd"): Promise<Result<number>> {
  return this.workflow(
    () => this.getCurrentPriceHandler(coinId, vsCurrency),
    "PRICE_FETCH_ERROR"
  );
}

// Concrete classes implement only the handler
protected abstract getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number>;
```

#### 2. Universal Client Management
Supports both actor patterns:

- **Actor Pattern (Composition)**: Associates with external clients
- **MCP Actor Pattern (Inheritance)**: IS a client directly

```typescript
// Add external clients
reader.addClient("coingecko-mcp", mcpClient, {
  type: "data-source",
  name: "coingecko-mcp"
});

// Get clients by type
const dataSources = reader.getClientsByType("data-source");
```

#### 3. Workflow Abstraction
Unified error handling and lifecycle management:

```typescript
protected async workflow<TResult>(
  responseHandlerFn: () => Promise<TResult>,
  errorCode: string,
): Promise<Result<TResult>> {
  // Activity tracking, error handling, client management
}
```

### DSL Methods Implemented

All 9 core DSL operations:

1. `getCurrentPrice(coinId, vsCurrency)` - Single coin price
2. `getCurrentPrices(coinIds, options)` - Multiple coin prices  
3. `getCurrentOHLCV(coinId, interval)` - Current OHLCV data
4. `getLatestOHLCV(coinIds, timeframe)` - Latest OHLCV for multiple coins
5. `getPriceHistory(coinId, days, vsCurrency)` - Historical price data
6. `getOHLCVByDateRange(query)` - OHLCV data by date range
7. `getAvailableTickers(limit)` - Available cryptocurrency tickers
8. `getLevel1Data(query)` - Level 1 market data
9. `getMarketAnalytics()` - Global market analytics

### Abstract Methods

Concrete classes must implement these handlers:

```typescript
protected abstract getCurrentPriceHandler(coinId: string, vsCurrency: string): Promise<number>;
protected abstract getCurrentPricesHandler(coinIds: string[], options?: CurrentPricesOptions): Promise<CryptoPriceData[]>;
protected abstract getCurrentOHLCVHandler(coinId: string, interval: "hourly" | "daily"): Promise<CryptoOHLCVData>;
// ... and 6 more handlers
```

### Lifecycle Methods

```typescript
abstract initialize(): Promise<Result<void>>;
abstract cleanup(): Promise<Result<void>>;
abstract getStatus(): object;
```

## BaseWriter Class

Location: `lib/src/actors/abstract/writers/BaseWriter.ts`

### Purpose
Provides unified DSL foundation for all data targets (databases, streaming, files, MCP servers).

### Key Features

#### 1. Complete Writing DSL
All MarketDataWritingDSL methods implemented:

```typescript
async publishPrices(prices: CryptoPriceData[]): Promise<Result<void>> {
  return this.workflow(
    () => this.publishPricesHandler(prices),
    "PUBLISH_PRICES_ERROR"
  );
}
```

#### 2. Batch Operations
Optimized batch processing for high-throughput scenarios:

```typescript
async publishBatch<T>(
  data: T[],
  batchSize: number,
  publishFn: (batch: T[]) => Promise<Result<void>>
): Promise<Result<void>>
```

#### 3. Transaction Support
Atomic operations with rollback capabilities:

```typescript
async withTransaction<T>(
  operation: () => Promise<Result<T>>
): Promise<Result<T>>
```

### DSL Methods Implemented

All core writing operations:

1. `publishPrice(price)` - Single price publication
2. `publishPrices(prices)` - Batch price publication
3. `publishOHLCV(ohlcv)` - OHLCV data publication
4. `publishLevel1(level1)` - Level 1 data publication
5. `publishAnalytics(analytics)` - Market analytics publication

## Implementation Patterns

### 1. Plugin Pattern
Base classes provide all common functionality, concrete classes implement only technology-specific logic:

```typescript
// ✅ Good: Handler implementation only
class CoinGeckoReader extends BaseReader {
  protected async getCurrentPriceHandler(coinId: string): Promise<number> {
    const result = await this.mcpClient.callTool({
      name: "get_coins_markets",
      arguments: { ids: coinId }
    });
    return this.extractPrice(result);
  }
}

// ❌ Bad: Reimplementing DSL methods
class BadReader extends BaseReader {
  async getCurrentPrice(coinId: string): Promise<Result<number>> {
    // DON'T DO THIS - BaseReader already implements this
  }
}
```

### 2. Error Handling
All operations use Result<T> pattern:

```typescript
const result = await reader.getCurrentPrice("bitcoin");

if (isSuccess(result)) {
  const price = getData(result);
  console.log(`Bitcoin price: $${price}`);
} else {
  const error = getError(result);
  console.error(`Error: ${error.message}`);
}
```

### 3. Client Lifecycle
Proper initialization and cleanup:

```typescript
// Initialize before use
await actor.initialize();

// Use actor
const data = await actor.getCurrentPrices(["bitcoin", "ethereum"]);

// Clean up when done
await actor.cleanup();
```

## Benefits

### 1. Zero Code Duplication
- DSL methods implemented once in base classes
- Technology-specific logic isolated to handlers
- Consistent behavior across all actors

### 2. Type Safety
- Complete TypeScript integration
- Compile-time guarantees for data flow
- Result<T> error handling throughout

### 3. Flexibility
- Support for multiple client patterns
- Easy to add new data sources and targets
- Plugin architecture allows independent evolution

### 4. Maintainability
- Changes to DSL automatically propagate to all actors
- Clear separation of concerns
- Comprehensive error handling and logging

## Testing

Base classes include comprehensive test suites:

```bash
# Test base reader functionality
bun test lib/tests/abstract/readers/BaseReader.test.ts

# Test base writer functionality  
bun test lib/tests/abstract/writers/BaseWriter.test.ts
```

## Usage Guidelines

### Do ✅
- Extend BaseReader/BaseWriter for new actors
- Implement only handler methods in concrete classes
- Use the workflow abstraction for consistent error handling
- Follow the plugin pattern strictly

### Don't ❌
- Reimplement DSL methods in concrete classes
- Bypass the workflow abstraction
- Mix DSL logic with technology-specific logic
- Create actors without proper lifecycle management

---

**Next**: See [Source Actors](../sources/README.md) and [Target Actors](../targets/README.md) for concrete implementations