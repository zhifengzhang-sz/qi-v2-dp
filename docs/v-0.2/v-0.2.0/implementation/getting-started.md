# Getting Started with FP System

## Quick Start Guide

This guide will get you up and running with the v-0.2.0 Functional Programming system in under 10 minutes.

## Prerequisites

- Node.js 18+ or Bun 1.0+
- TypeScript 5.0+
- Basic understanding of functional programming concepts

## Installation

The FP system is included in the main project. No additional installation required.

## Basic Usage

### 1. Import the FP System

```typescript
import {
  createCoinGeckoMCPReader,
  createPureReader,
  createMarketContext,
  EXCHANGES,
  SYMBOLS
} from "@qi/fp";

import { getData, getError, isSuccess } from "@qi/core/base";
```

### 2. Create and Initialize a Reader

```typescript
const reader = createCoinGeckoMCPReader({
  name: "my-first-fp-reader",
  debug: true,
  timeout: 30000
});

// Initialize the reader
const initResult = await reader.initialize();
if (!isSuccess(initResult)) {
  console.error("Failed to initialize:", getError(initResult));
  process.exit(1);
}

console.log("✅ Reader initialized successfully");
```

### 3. Basic Price Retrieval

```typescript
// Traditional approach with full context
const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);
const priceResult = await reader.getPrice(context);

if (isSuccess(priceResult)) {
  const price = getData(priceResult);
  console.log(`Bitcoin price: $${price.price.toFixed(2)}`);
} else {
  console.error("Failed to get price:", getError(priceResult));
}
```

### 4. Functional Approach with Context Binding

```typescript
// Create a pure reader for Bitcoin
const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);

// Zero-argument calls for maximum performance
const btcPrice = await btcReader.getPrice(); // No arguments needed!

if (isSuccess(btcPrice)) {
  const price = getData(btcPrice);
  console.log(`BTC (bound): $${price.price.toFixed(2)}`);
}
```

### 5. Cleanup

```typescript
// Always cleanup when done
await reader.cleanup();
console.log("✅ Cleanup completed");
```

## Complete Example

Here's a complete working example:

```typescript
#!/usr/bin/env bun

import {
  createCoinGeckoMCPReader,
  createPureReader,
  createSymbolReader,
  parallel,
  EXCHANGES,
  SYMBOLS
} from "@qi/fp";

import { getData, getError, isSuccess } from "@qi/core/base";

async function main() {
  console.log("🚀 FP System Quick Start");
  
  // 1. Create and initialize reader
  const reader = createCoinGeckoMCPReader({
    name: "quickstart-demo",
    debug: true
  });
  
  const initResult = await reader.initialize();
  if (!isSuccess(initResult)) {
    console.error("❌ Initialization failed:", getError(initResult));
    return;
  }
  
  console.log("✅ Reader initialized");
  
  // 2. Create bound readers for performance
  const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
  const ethReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.ETH);
  
  // 3. Parallel price retrieval
  console.log("📊 Getting prices...");
  const [btcResult, ethResult] = await parallel([
    btcReader.getPrice,
    ethReader.getPrice
  ]);
  
  if (isSuccess(btcResult) && isSuccess(ethResult)) {
    const btcPrice = getData(btcResult);
    const ethPrice = getData(ethResult);
    
    console.log(`Bitcoin: $${btcPrice.price.toFixed(2)}`);
    console.log(`Ethereum: $${ethPrice.price.toFixed(2)}`);
    console.log(`BTC/ETH ratio: ${(btcPrice.price / ethPrice.price).toFixed(4)}`);
  } else {
    console.error("❌ Failed to get prices");
  }
  
  // 4. Cleanup
  await reader.cleanup();
  console.log("✅ Demo completed");
}

main().catch(console.error);
```

## Key Concepts

### 1. Context Binding

The FP system uses context binding to eliminate repeated parameter passing:

```typescript
// Without binding - repeated context creation
const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);
await reader.getPrice(context);
await reader.getPrice(context); // Repeated context
await reader.getPrice(context); // Repeated context

// With binding - zero-argument calls
const boundReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
await boundReader.getPrice(); // No arguments!
await boundReader.getPrice(); // No arguments!
await boundReader.getPrice(); // No arguments!
```

### 2. Type Safety

The system provides compile-time type safety:

```typescript
// TypeScript ensures correct argument types
const symbolReader = createSymbolReader(reader, EXCHANGES.COINGECKO);

// This works - providing required symbol
await symbolReader.getPrice(SYMBOLS.BTC);

// This fails at compile time - missing required argument
await symbolReader.getPrice(); // Error: Expected 1 arguments, but got 0
```

### 3. Performance Benefits

Context binding provides significant performance improvements:

```typescript
// Benchmark function
async function benchmark() {
  const reader = createCoinGeckoMCPReader({ name: "benchmark" });
  await reader.initialize();
  
  const iterations = 100;
  
  // Traditional approach
  console.time("Traditional");
  for (let i = 0; i < iterations; i++) {
    const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);
    await reader.getPrice(context);
  }
  console.timeEnd("Traditional");
  
  // FP approach
  const boundReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
  console.time("FP Bound");
  for (let i = 0; i < iterations; i++) {
    await boundReader.getPrice(); // Zero arguments!
  }
  console.timeEnd("FP Bound");
  
  await reader.cleanup();
}
```

## Common Patterns

### 1. High-Frequency Trading

```typescript
// Create bound readers for multiple assets
const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
const ethReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.ETH);

// High-frequency trading loop
for (let i = 0; i < 1000; i++) {
  const [btcPrice, ethPrice] = await parallel([
    btcReader.getPrice,
    ethReader.getPrice
  ]);
  
  // Process arbitrage opportunities
  if (isSuccess(btcPrice) && isSuccess(ethPrice)) {
    const ratio = getData(btcPrice).price / getData(ethPrice).price;
    if (ratio > ARBITRAGE_THRESHOLD) {
      await executeTrade(btcPrice, ethPrice);
    }
  }
}
```

### 2. Portfolio Monitoring

```typescript
// Create symbol reader for multiple assets on same exchange
const coinGeckoReader = createSymbolReader(reader, EXCHANGES.COINGECKO);

const portfolio = [SYMBOLS.BTC, SYMBOLS.ETH];
const portfolioResults = await parallel(
  portfolio.map(symbol => () => coinGeckoReader.getPrice(symbol))
);

// Process portfolio results
let totalValue = 0;
for (let i = 0; i < portfolioResults.length; i++) {
  const result = portfolioResults[i];
  if (isSuccess(result)) {
    const price = getData(result);
    totalValue += price.price;
    console.log(`${portfolio[i].ticker}: $${price.price.toFixed(2)}`);
  }
}

console.log(`Total portfolio value: $${totalValue.toFixed(2)}`);
```

### 3. Multi-Exchange Comparison

```typescript
// Create readers for different exchanges (when available)
const coinGeckoReader = createSymbolReader(reader, EXCHANGES.COINGECKO);
// const binanceReader = createSymbolReader(reader, EXCHANGES.BINANCE);

// Compare prices across exchanges
const [coinGeckoPrice] = await parallel([
  () => coinGeckoReader.getPrice(SYMBOLS.BTC)
  // () => binanceReader.getPrice(SYMBOLS.BTC)
]);

if (isSuccess(coinGeckoPrice)) {
  console.log(`CoinGecko BTC: $${getData(coinGeckoPrice).price.toFixed(2)}`);
}
```

## Error Handling

The FP system uses functional error handling with `Result<T>`:

```typescript
async function safeGetPrice(reader: any, symbol: any) {
  const result = await reader.getPrice(symbol);
  
  if (isSuccess(result)) {
    const price = getData(result);
    return price;
  } else {
    const error = getError(result);
    console.error(`Failed to get price: ${error?.message}`);
    return null;
  }
}
```

## Next Steps

1. **Explore Advanced Features**: Check out [Partial Application Guide](../fp-system/partial-application.md)
2. **Create Custom Actors**: Follow [Creating Actors Guide](creating-actors.md)
3. **Performance Optimization**: Read [Performance Best Practices](../guides/best-practices.md)
4. **Integration**: Learn about [Context Binding Patterns](context-binding.md)

## Troubleshooting

### Common Issues

1. **MCP Connection Failed**
   ```typescript
   // Check network connectivity and server status
   const reader = createCoinGeckoMCPReader({
     name: "test-reader",
     debug: true,  // Enable debugging
     timeout: 60000  // Increase timeout
   });
   ```

2. **Type Errors**
   ```typescript
   // Ensure proper imports
   import type { MarketSymbol } from "@qi/fp/dsl";
   
   // Use correct symbol types
   const symbol: MarketSymbol = SYMBOLS.BTC;
   ```

3. **Performance Issues**
   ```typescript
   // Avoid recreating contexts in loops
   // Bad
   for (let i = 0; i < 1000; i++) {
     const context = createMarketContext(exchange, symbol);
     await reader.getPrice(context);
   }
   
   // Good
   const boundReader = createPureReader(reader, exchange, symbol);
   for (let i = 0; i < 1000; i++) {
     await boundReader.getPrice();
   }
   ```

## Resources

- [FP System Overview](../fp-system/README.md)
- [Architecture Documentation](../architecture/overview.md)
- [API Reference](../fp-system/dsl-design.md)
- [Working Demo](../../../demos/fp-v2-coingecko-demo.ts)

Happy coding with the FP system! 🚀