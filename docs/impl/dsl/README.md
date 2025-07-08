# DSL (Domain-Specific Language) Documentation

## Overview

The QiCore DSL provides a unified interface for cryptocurrency market data operations. It serves as the **single source of truth** for data types, operations, and composition rules, automatically generating database schemas, streaming configurations, and validation rules.

## Core Philosophy

### 1. DSL as Single Source of Truth
```
DSL Types → Auto-generates → Database Schemas + Topic Configs + Validation
```

### 2. Type Safety Throughout
- Complete TypeScript integration
- Compile-time guarantees for data flow
- Result<T> error handling pattern

### 3. Law-Based Composition
- Five fundamental laws govern data operations
- Type-safe combinators for complex workflows
- Compile-time validation of operation compatibility

## Directory Structure

```
lib/src/dsl/
├── MarketDataTypes.ts           # Core data type definitions
├── MarketDataReadingDSL.ts      # Reading operations interface
├── MarketDataWritingDSL.ts      # Writing operations interface
├── laws/                        # Composition and validation laws
│   ├── combinator.ts           # Five fundamental DSL laws
│   └── index.ts                # Law exports
└── index.ts                    # Unified DSL exports
```

## Core Components

### 1. Data Types (`MarketDataTypes.ts`)

**Purpose**: Defines all data structures used throughout the platform

**Key Types**:
```typescript
// Core price data with exchange awareness
interface CryptoPriceData {
  coinId: string;
  symbol: string;
  exchangeId: string;        // Required: exchange identifier
  usdPrice: number;
  btcPrice?: number;
  ethPrice?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  change7d?: number;
  lastUpdated: Date;
  source: string;
  attribution: string;       // Required: data attribution
}

// OHLCV time-series data
interface CryptoOHLCVData {
  coinId: string;
  symbol?: string;
  exchangeId: string;        // Required: exchange identifier
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
  source: string;
  attribution: string;
}

// Global market analytics
interface CryptoMarketAnalytics {
  timestamp: Date;
  exchangeId?: string;       // Optional: for exchange-specific analytics
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  ethDominance?: number;
  activeCryptocurrencies: number;
  markets: number;
  marketCapChange24h: number;
  source: string;
  attribution: string;
}

// Level 1 market data (bid/ask)
interface Level1Data {
  ticker: string;
  timestamp: Date;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  exchange: string;          // Required: exchange identifier
  market: string;
  source: string;
  attribution: string;
}
```

**Schema Generation**: These types automatically generate:
- TimescaleDB table schemas with hypertables
- Redpanda topic configurations
- JSON Schema validation rules
- TypeScript type definitions

### 2. Reading Operations (`MarketDataReadingDSL.ts`)

**Purpose**: Defines all data reading operations

**Interface**:
```typescript
interface MarketDataReadingDSL {
  // Single price operations
  getCurrentPrice(coinId: string, vsCurrency?: string): Promise<Result<number>>;
  
  // Batch price operations
  getCurrentPrices(coinIds: string[], options?: CurrentPricesOptions): Promise<Result<CryptoPriceData[]>>;
  
  // OHLCV operations
  getCurrentOHLCV(coinId: string, interval?: "hourly" | "daily"): Promise<Result<CryptoOHLCVData>>;
  getLatestOHLCV(coinIds: string[], timeframe?: string): Promise<Result<CryptoOHLCVData[]>>;
  getOHLCVByDateRange(query: DateRangeOHLCVQuery): Promise<Result<CryptoOHLCVData[]>>;
  
  // Historical operations
  getPriceHistory(coinId: string, days: number, vsCurrency?: string): Promise<Result<CryptoPriceData[]>>;
  
  // Market data operations
  getAvailableTickers(limit?: number): Promise<Result<CryptoPriceData[]>>;
  getLevel1Data(query: Level1Query): Promise<Result<Level1Data>>;
  getMarketAnalytics(): Promise<Result<CryptoMarketAnalytics>>;
}
```

**Query Types**:
```typescript
interface CurrentPricesOptions {
  vsCurrencies?: string[];
  includeMarketData?: boolean;
  includePriceChange?: boolean;
  sparkline?: boolean;
}

interface DateRangeOHLCVQuery {
  ticker: string;
  dateStart: Date;
  dateEnd: Date;
  interval: string;
  market?: string;
}

interface Level1Query {
  ticker: string;
  exchange?: string;
  market?: string;
}
```

### 3. Writing Operations (`MarketDataWritingDSL.ts`)

**Purpose**: Defines all data writing operations

**Interface**:
```typescript
interface MarketDataWritingDSL {
  // Single operations
  publishPrice(price: CryptoPriceData): Promise<Result<void>>;
  publishOHLCV(ohlcv: CryptoOHLCVData): Promise<Result<void>>;
  publishLevel1(level1: Level1Data): Promise<Result<void>>;
  publishAnalytics(analytics: CryptoMarketAnalytics): Promise<Result<void>>;
  
  // Batch operations
  publishPrices(prices: CryptoPriceData[]): Promise<Result<void>>;
  publishOHLCVBatch(ohlcv: CryptoOHLCVData[]): Promise<Result<void>>;
  publishLevel1Batch(level1: Level1Data[]): Promise<Result<void>>;
  
  // Transaction operations
  withTransaction<T>(operation: () => Promise<Result<T>>): Promise<Result<T>>;
}
```

### 4. Composition Laws (`laws/combinator.ts`)

**Purpose**: Defines rules for combining reading and writing operations

**Five Fundamental Laws**:

#### Law 1: Type Coherence Law
```typescript
// Output type of read operation must match input type of write operation
type TypeCoherenceLaw<R, W> = R extends (...args: any[]) => Promise<Result<infer TRead>>
  ? W extends (data: TRead, ...args: any[]) => Promise<Result<any>>
    ? true
    : false
  : false;
```

#### Law 2: Error Propagation Law
```typescript
// Errors must propagate correctly through the composition
interface ErrorPropagationLaw<TResult> {
  readonly readFailed: (error: any) => Result<never>;
  readonly writeFailed: (error: any) => Result<never>;
  readonly success: (result: TResult) => Result<TResult>;
}
```

#### Law 3: Data Flow Law
```typescript
// Data flows unidirectionally: Read → Transform → Write
interface DataFlowLaw<TRead, TWrite> {
  readonly flow: (data: TRead) => TWrite;
  readonly purity: (data: TRead) => TRead; // Original data unchanged
}
```

#### Law 4: Temporal Execution Law
```typescript
// Read operation MUST complete before write operation begins
interface TemporalLaw {
  readonly sequence: "READ_THEN_WRITE";
  readonly atomicity: boolean; // Either both succeed or both fail
}
```

#### Law 5: DSL Method Compatibility Law
```typescript
// Only methods from MarketDataReadingDSL can be read operations
// Only methods from MarketDataWritingDSL can be write operations
type DSLCompatibilityLaw<
  R extends keyof MarketDataReadingDSL,
  W extends keyof MarketDataWritingDSL,
> = true;
```

**Law-Enforcing Combinator**:
```typescript
export function createLawfulDSLCombinator<
  TReadFn extends (...args: any[]) => Promise<Result<any>>,
  TWriteFn extends (data: any, ...args: any[]) => Promise<Result<any>>
>(
  readOperation: TReadFn,
  writeOperation: TWriteFn,
): DSLCombinator<TReadFn, TWriteFn, TReadData, TWriteResult> {
  // Returns combinator that enforces all five laws
}
```

## Usage Patterns

### 1. Basic Operations

```typescript
// Reading data
const reader = createCoinGeckoMarketDataReader({...});
await reader.initialize();

const price = await reader.getCurrentPrice("bitcoin");
const prices = await reader.getCurrentPrices(["bitcoin", "ethereum"]);
const analytics = await reader.getMarketAnalytics();

// Writing data
const writer = createTimescaleMarketDataWriter({...});
await writer.initialize();

await writer.publishPrice(priceData);
await writer.publishPrices(pricesArray);
await writer.publishAnalytics(analyticsData);
```

### 2. Law-Based Composition

```typescript
import { createReaderWriterCombinator } from './laws/combinator';

// Create type-safe combinator
const combinator = createReaderWriterCombinator(reader, writer);

// Valid combination: getCurrentPrices → publishPrices
const pricesPipeline = combinator.pricesPipeline.execute(
  [["bitcoin", "ethereum"]], // reader args
  []                         // writer args
);

const result = await pricesPipeline();

// Valid combination with transformation
const transformedPipeline = combinator.pricesPipeline.withTransform(
  (prices) => prices.filter(p => p.usdPrice > 1000) // Filter expensive coins
).execute([["bitcoin", "ethereum"]], []);
```

### 3. Error Handling

```typescript
import { isSuccess, isFailure, getData, getError } from '@qi/core/base';

const result = await reader.getCurrentPrices(["bitcoin", "ethereum"]);

if (isSuccess(result)) {
  const prices = getData(result);
  console.log(`Retrieved ${prices.length} prices`);
  
  // Write to multiple targets
  await Promise.all([
    writer1.publishPrices(prices),
    writer2.publishPrices(prices)
  ]);
} else {
  const error = getError(result);
  console.error(`Failed to get prices: ${error.message}`);
  
  // Handle specific error types
  switch (error.code) {
    case "PRICES_FETCH_ERROR":
      // Handle data source issues
      break;
    case "NO_CLIENT":
      // Handle connection issues
      break;
  }
}
```

## Schema Generation

### Automatic Schema Generation

The DSL types automatically generate:

**1. TimescaleDB Schemas**:
```sql
-- Generated from CryptoPriceData
CREATE TABLE crypto_prices (
  coin_id VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  exchange_id VARCHAR(50) NOT NULL,
  usd_price NUMERIC(20,8) NOT NULL,
  market_cap NUMERIC(20,2),
  volume_24h NUMERIC(20,2),
  change_24h NUMERIC(10,4),
  change_7d NUMERIC(10,4),
  last_updated TIMESTAMPTZ NOT NULL,
  source VARCHAR(100) NOT NULL,
  attribution TEXT NOT NULL,
  PRIMARY KEY (coin_id, exchange_id, last_updated)
);

SELECT create_hypertable('crypto_prices', 'last_updated');
```

**2. Redpanda Topic Configurations**:
```yaml
# Generated from DSL types
crypto-prices:
  partitions: 12
  replication-factor: 3
  retention-ms: 604800000  # 7 days
  compression-type: lz4
  key-strategy: symbol     # From CryptoPriceData.symbol

crypto-ohlcv:
  partitions: 24
  replication-factor: 3
  retention-ms: 2592000000 # 30 days
  compression-type: lz4
  key-strategy: coinId     # From CryptoOHLCVData.coinId
```

**3. JSON Schema Validation**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "coinId": { "type": "string", "minLength": 1 },
    "symbol": { "type": "string", "minLength": 1 },
    "exchangeId": { "type": "string", "minLength": 1 },
    "usdPrice": { "type": "number", "minimum": 0 },
    "lastUpdated": { "type": "string", "format": "date-time" }
  },
  "required": ["coinId", "symbol", "exchangeId", "usdPrice", "lastUpdated"]
}
```

### Schema Evolution

When DSL types change:

1. **Update DSL types** in `MarketDataTypes.ts`
2. **Regenerate schemas**: `bun run scripts/generate-schema.ts`
3. **Apply migrations**: Database and streaming configurations update automatically
4. **Actors adapt**: All actors use updated schemas automatically

## Type Safety Validation

### Compile-Time Validation

```typescript
// ✅ Valid: Types match
type ValidCombination = TypeCoherenceLaw<
  MarketDataReadingDSL["getCurrentPrices"],
  MarketDataWritingDSL["publishPrices"]
>; // true

// ❌ Invalid: Types don't match
type InvalidCombination = TypeCoherenceLaw<
  MarketDataReadingDSL["getCurrentPrice"],  // Returns number
  MarketDataWritingDSL["publishPrices"]     // Expects CryptoPriceData[]
>; // false
```

### Runtime Validation

```typescript
// Law enforcement at runtime
const combinator = createLawfulDSLCombinator(
  reader.getCurrentPrices.bind(reader),
  writer.publishPrices.bind(writer)
);

// Laws are enforced during execution
const pipeline = combinator.execute([["bitcoin"]], []);
const result = await pipeline(); // All laws checked
```

## Best Practices

### 1. Always Use DSL Interfaces
```typescript
// ✅ Good: Use DSL interface
function processData(reader: MarketDataReadingDSL) {
  return reader.getCurrentPrices(["bitcoin"]);
}

// ❌ Bad: Use concrete class
function processData(reader: CoinGeckoMarketDataReader) {
  // Tightly coupled to specific implementation
}
```

### 2. Use Law-Based Combinators
```typescript
// ✅ Good: Type-safe composition
const combinator = createLawfulDSLCombinator(readFn, writeFn);

// ❌ Bad: Manual composition (no law enforcement)
const data = await readFn();
await writeFn(data);
```

### 3. Handle Results Properly
```typescript
// ✅ Good: Explicit error handling
const result = await reader.getCurrentPrice("bitcoin");
if (isSuccess(result)) {
  const price = getData(result);
} else {
  const error = getError(result);
  // Handle error appropriately
}

// ❌ Bad: Ignore errors
const result = await reader.getCurrentPrice("bitcoin");
const price = getData(result); // Could throw if result is failure
```

## Testing

### DSL Interface Tests
```bash
# Test DSL interfaces
bun test lib/tests/dsl/MarketDataReadingDSL.test.ts
bun test lib/tests/dsl/MarketDataWritingDSL.test.ts

# Test law enforcement
bun test lib/tests/dsl/laws/combinator.test.ts
```

### Type Safety Tests
```typescript
// Compile-time type safety tests
describe("DSL Type Safety", () => {
  it("should enforce type coherence", () => {
    // This should compile
    const validCombinator = createLawfulDSLCombinator(
      reader.getCurrentPrices.bind(reader),
      writer.publishPrices.bind(writer)
    );
    
    // This should NOT compile (type mismatch)
    // const invalidCombinator = createLawfulDSLCombinator(
    //   reader.getCurrentPrice.bind(reader),
    //   writer.publishPrices.bind(writer)
    // );
  });
});
```

---

**Next**: See [Base Infrastructure](../base/README.md) for low-level implementation details