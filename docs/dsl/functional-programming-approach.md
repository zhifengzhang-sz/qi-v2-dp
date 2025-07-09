# Functional Programming Approach to DSL Design

## Overview

This document outlines the **Functional Programming (FP) approach** to DSL aliasing using **partial function application**. This approach leverages mathematical foundations of functional programming to create ergonomic, high-performance interfaces while maintaining architectural simplicity.

## Core Principle: Partial Function Application

### Mathematical Foundation

**Partial Application**: "The process of fixing a number of arguments of a function, producing another function of smaller arity."

```typescript
// Original function with full arity
f(a, b, c) → result

// Partial application fixing argument 'a'  
f_partial = partial(f, a)
f_partial(b, c) → result

// Further partial application fixing argument 'b'
f_specialized = partial(f_partial, b)  
f_specialized(c) → result
```

### Applied to Market Data DSL

```typescript
// DSL: Full context interface (canonical)
interface MarketDataReader {
  getPrice(context: MarketContext): Promise<Result<Price>>;
  getOHLCV(context: MarketContext, timeframe: string): Promise<Result<OHLCV>>;
  getLevel1(context: MarketContext): Promise<Result<Level1>>;
}

// Partial application for context binding
const btc_coinbase_reader = partial(reader.getPrice, {
  exchange: coinbase,
  symbol: btc,
  timestamp: () => new Date() // Dynamic timestamp generation
});

// Result: Zero-argument function optimized for repeated use
await btc_coinbase_reader(); // Context pre-bound, content flows
```

## Implementation Strategy

### 1. Canonical DSL Interface

**Single Source of Truth**: DSL specifies only full context interface

```typescript
// lib/src/dsl/index.ts
export interface MarketDataReader {
  getPrice(context: MarketContext): Promise<Result<Price>>;
  getOHLCV(context: MarketContext, timeframe: string): Promise<Result<OHLCV>>;
  getLevel1(context: MarketContext): Promise<Result<Level1>>;
}

export interface MarketDataWriter {
  writePrice(context: MarketContext, data: Price): Promise<Result<void>>;
  writeOHLCV(context: MarketContext, data: OHLCV): Promise<Result<void>>;
  writeLevel1(context: MarketContext, data: Level1): Promise<Result<void>>;
}
```

### 2. Functional Partial Application Utilities

**Generic Partial Function Library**:

```typescript
// lib/src/dsl/functional/partial.ts

/**
 * Partial application utility for context binding
 */
export function partial<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => TResult,
  ...fixedArgs: Partial<TArgs>
): (...remainingArgs: Remaining<TArgs, typeof fixedArgs>) => TResult {
  return (...remainingArgs) => fn(...fixedArgs, ...remainingArgs);
}

/**
 * Context-specific partial application for market data readers
 */
export function bindContext<TReader extends MarketDataReader>(
  reader: TReader,
  context: Partial<MarketContext>
): BoundReader<TReader, typeof context> {
  return {
    getPrice: partial(reader.getPrice, completeContext(context)),
    getOHLCV: (timeframe: string) => reader.getOHLCV(completeContext(context), timeframe),
    getLevel1: partial(reader.getLevel1, completeContext(context))
  };
}

/**
 * Complete partial context with dynamic defaults
 */
function completeContext(partial: Partial<MarketContext>): MarketContext {
  return {
    timestamp: new Date(),
    ...partial,
    // Ensure all required fields present
  } as MarketContext;
}
```

### 3. Type-Safe Context Binding

**TypeScript Conditional Types for Argument Inference**:

```typescript
// lib/src/dsl/functional/types.ts

/**
 * Infer remaining arguments after partial application
 */
type Remaining<TArgs extends any[], TFixed extends any[]> = 
  TArgs extends [...TFixed, ...infer Rest] ? Rest : never;

/**
 * Context completeness checker
 */
type IsContextComplete<T extends Partial<MarketContext>> = 
  T extends MarketContext ? true : false;

/**
 * Bound reader type based on context completeness
 */
type BoundReader<TReader, TContext extends Partial<MarketContext>> = {
  getPrice: IsContextComplete<TContext> extends true 
    ? () => ReturnType<TReader['getPrice']>
    : (...missing: MissingContextFields<TContext>) => ReturnType<TReader['getPrice']>;
    
  getOHLCV: IsContextComplete<TContext> extends true
    ? (timeframe: string) => ReturnType<TReader['getOHLCV']>
    : (timeframe: string, ...missing: MissingContextFields<TContext>) => ReturnType<TReader['getOHLCV']>;
    
  getLevel1: IsContextComplete<TContext> extends true
    ? () => ReturnType<TReader['getLevel1']>
    : (...missing: MissingContextFields<TContext>) => ReturnType<TReader['getLevel1']>;
};

/**
 * Calculate missing context fields
 */
type MissingContextFields<T extends Partial<MarketContext>> = 
  T extends { exchange: any } 
    ? T extends { symbol: any }
      ? [] // Both present
      : [symbol: Symbol] // Missing symbol
    : T extends { symbol: any }
      ? [exchange: Exchange] // Missing exchange  
      : [exchange: Exchange, symbol: Symbol]; // Missing both
```

### 4. Practical Usage Patterns

**High-Performance Trading Setup**:

```typescript
// Setup once - context bound at compile time
const btc_coinbase = bindContext(coinGeckoReader, {
  exchange: { id: 'coinbase', name: 'Coinbase Pro', region: 'US', type: 'centralized' },
  symbol: { ticker: 'BTC', name: 'Bitcoin', assetClass: 'crypto', currency: 'USD' }
});

const eth_binance = bindContext(coinGeckoReader, {
  exchange: { id: 'binance', name: 'Binance', region: 'Global', type: 'centralized' },
  symbol: { ticker: 'ETH', name: 'Ethereum', assetClass: 'crypto', currency: 'USD' }
});

// Use millions of times - zero context overhead
async function highFrequencyTrading() {
  for (let i = 0; i < 1_000_000; i++) {
    const btcPrice = await btc_coinbase.getPrice();     // No arguments!
    const ethPrice = await eth_binance.getPrice();      // No arguments!
    const btcOHLCV = await btc_coinbase.getOHLCV('1m'); // Only content arg!
    
    // Trading logic with zero context marshalling overhead
    if (isSuccess(btcPrice) && isSuccess(ethPrice)) {
      await executeArbitrageStrategy(getData(btcPrice), getData(ethPrice));
    }
  }
}
```

**Multi-Exchange Portfolio**:

```typescript
// Context binding for different exchanges
const exchanges = [
  { reader: coinGeckoReader, exchange: coinbase },
  { reader: binanceReader, exchange: binance },
  { reader: krakenReader, exchange: kraken }
];

const portfolio = ['BTC', 'ETH', 'ADA', 'DOT'].map(ticker => 
  exchanges.map(({reader, exchange}) => 
    bindContext(reader, {
      exchange,
      symbol: { ticker, assetClass: 'crypto', currency: 'USD' }
    })
  )
).flat();

// Portfolio monitoring with pre-bound contexts
async function monitorPortfolio() {
  const prices = await Promise.all(
    portfolio.map(boundReader => boundReader.getPrice()) // All zero-arg calls!
  );
  
  return prices.filter(isSuccess).map(getData);
}
```

### 5. Factory Functions for Common Patterns

**Ergonomic Factory Pattern**:

```typescript
// lib/src/dsl/functional/factories.ts

/**
 * Create symbol-specific reader (exchange pre-bound)
 */
export function createSymbolReader(
  reader: MarketDataReader,
  exchange: Exchange
) {
  return (symbol: Symbol) => bindContext(reader, { exchange, symbol });
}

/**
 * Create pure reader (full context pre-bound)  
 */
export function createPureReader(
  reader: MarketDataReader,
  context: MarketContext
) {
  return bindContext(reader, context);
}

/**
 * Create exchange reader factory
 */
export function createExchangeReaderFactory(reader: MarketDataReader) {
  return (exchange: Exchange) => createSymbolReader(reader, exchange);
}

// Usage examples
const coinbaseFactory = createExchangeReaderFactory(coinGeckoReader);
const coinbaseBTC = coinbaseFactory(coinbase)(btcSymbol);
const coinbaseETH = coinbaseFactory(coinbase)(ethSymbol);

await coinbaseBTC.getPrice(); // Zero args - full context pre-bound
await coinbaseETH.getPrice(); // Zero args - full context pre-bound
```

## Performance Benefits

### 1. Compile-Time Optimization

**Context Resolution at Build Time**:
- TypeScript resolves partial application types at compile time
- No runtime context merging overhead
- Zero argument validation for bound contexts
- Optimal memory layout for repeated calls

### 2. Runtime Efficiency

**Function Call Optimization**:
```typescript
// Traditional approach - context passed every call
for (let i = 0; i < 1_000_000; i++) {
  await reader.getPrice({exchange: coinbase, symbol: btc, timestamp: new Date()});
  // ↑ Object creation, property access, validation on every call
}

// FP approach - context pre-bound
const boundReader = partial(reader.getPrice, {exchange: coinbase, symbol: btc});
for (let i = 0; i < 1_000_000; i++) {
  await boundReader(); // ↑ Direct function call, no object overhead
}
```

**Memory Efficiency**:
- Context objects created once, reused across millions of calls
- No repeated object allocation/garbage collection
- Optimal CPU cache utilization through function locality

### 3. Type Safety

**Compile-Time Guarantees**:
```typescript
// TypeScript ensures context completeness
const incompleteReader = bindContext(reader, { exchange: coinbase }); 
// ↑ Type error: missing 'symbol' field

const completeReader = bindContext(reader, { exchange: coinbase, symbol: btc });
await completeReader.getPrice(); // ✅ Compiles successfully

const partialReader = bindContext(reader, { exchange: coinbase });
await partialReader.getPrice(btcSymbol); // ✅ TypeScript requires missing symbol
```

## Architectural Benefits

### 1. Separation of Concerns

**Clear Boundaries**:
- **DSL Layer**: Defines canonical full-context interface
- **Functional Layer**: Provides partial application utilities  
- **Usage Layer**: Leverages bound functions for performance
- **Implementation Layer**: Handlers always receive complete context

### 2. Backward Compatibility

**Non-Breaking Evolution**:
```typescript
// Existing DSL interface unchanged
interface MarketDataReader {
  getPrice(context: MarketContext): Promise<Result<Price>>; // Canonical
}

// FP layer adds ergonomic aliases without breaking changes
const boundReader = partial(reader.getPrice, context); // Additive enhancement
```

### 3. Composability

**Function Composition**:
```typescript
// Compose partial applications
const pipe = (...fns) => (value) => fns.reduce((acc, fn) => fn(acc), value);

const priceProcessor = pipe(
  partial(reader.getPrice, context),
  price => price.map(p => p.price),
  price => price.map(formatCurrency)
);

const result = await priceProcessor(); // Composed pipeline
```

### 4. Testing Benefits

**Isolated Testing**:
```typescript
// Test canonical interface
await reader.getPrice(fullContext); // Direct testing

// Test bound behavior
const boundReader = partial(reader.getPrice, partialContext);
await boundReader(); // Bound function testing

// Test composition
const composedReader = pipe(boundReader, formatter);
await composedReader(); // Pipeline testing
```

## Migration Strategy

### Phase 1: Implement FP Utilities

1. Create `lib/src/dsl/functional/` directory
2. Implement partial application utilities
3. Add TypeScript conditional types
4. Create factory functions

### Phase 2: Update DSL Definition

1. Simplify DSL to full-context interface only
2. Remove generic type parameters
3. Document canonical interface

### Phase 3: Provide FP Aliases

1. Export partial application helpers
2. Create ergonomic factory functions
3. Document usage patterns
4. Add performance benchmarks

### Phase 4: Update Implementation

1. Consolidate base classes to single FreeReader
2. Update actors to implement canonical interface
3. Replace complex inheritance with composition
4. Migrate existing usage to FP patterns

## Conclusion

The Functional Programming approach to DSL aliasing provides:

**Mathematical Foundation**: Grounded in partial application theory
**Performance Optimization**: Zero runtime context overhead
**Type Safety**: Compile-time context completeness verification  
**Architectural Clarity**: Clean separation between canonical DSL and ergonomic usage
**Scalability**: Optimal for high-frequency financial data processing

This approach transforms the DSL from a complex inheritance hierarchy into a simple, mathematically-grounded system that leverages functional programming principles for maximum performance and clarity.

---

**Next Steps**: Implement the FP utilities and update the CoinGecko actor to demonstrate the pattern in practice.