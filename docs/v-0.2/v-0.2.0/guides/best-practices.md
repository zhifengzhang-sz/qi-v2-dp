# FP System Best Practices

## Performance Optimization

### 1. Context Binding Strategy

**✅ Do: Bind contexts once, reuse multiple times**
```typescript
// Good - bind once, use many times
const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);

for (let i = 0; i < 1000; i++) {
  await btcReader.getPrice(); // Zero arguments, maximum performance
}
```

**❌ Don't: Recreate contexts in loops**
```typescript
// Bad - recreating context on every iteration
for (let i = 0; i < 1000; i++) {
  const context = createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC);
  await reader.getPrice(context); // Repeated context creation overhead
}
```

### 2. Choose the Right Binding Pattern

**Full Context Binding**: Best for single-asset operations
```typescript
// Perfect for BTC-only operations
const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
await btcReader.getPrice(); // Zero arguments
```

**Partial Context Binding**: Best for multi-asset operations
```typescript
// Perfect for multiple assets on same exchange
const coinGeckoReader = createSymbolReader(reader, EXCHANGES.COINGECKO);
await coinGeckoReader.getPrice(SYMBOLS.BTC);
await coinGeckoReader.getPrice(SYMBOLS.ETH);
```

**Custom Context Binding**: Best for complex patterns
```typescript
// Custom binding for specific use cases
const partialReader = bindContext(reader, { 
  exchange: EXCHANGES.COINGECKO 
});
await partialReader.getPrice(SYMBOLS.BTC);
```

### 3. Parallel Operations

**✅ Do: Use parallel execution for independent operations**
```typescript
// Good - parallel execution
const [btcPrice, ethPrice] = await parallel([
  btcReader.getPrice,
  ethReader.getPrice
]);
```

**❌ Don't: Sequential execution for independent operations**
```typescript
// Bad - sequential execution
const btcPrice = await btcReader.getPrice();
const ethPrice = await ethReader.getPrice(); // Waits for BTC unnecessarily
```

## Memory Management

### 1. Reader Lifecycle

**✅ Do: Properly manage reader lifecycle**
```typescript
async function processMarketData() {
  const reader = createCoinGeckoMCPReader({ name: "processor" });
  
  try {
    await reader.initialize();
    
    // Use reader for operations
    const result = await reader.getPrice(context);
    
    return result;
  } finally {
    // Always cleanup
    await reader.cleanup();
  }
}
```

**❌ Don't: Forget to cleanup readers**
```typescript
// Bad - reader never cleaned up
const reader = createCoinGeckoMCPReader({ name: "processor" });
await reader.initialize();
// Missing cleanup - memory leak!
```

### 2. Context Reuse

**✅ Do: Reuse bound readers**
```typescript
// Good - create once, use many times
const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);

// Use in multiple functions
async function getCurrentPrice() {
  return await btcReader.getPrice();
}

async function monitorPrice() {
  setInterval(async () => {
    const price = await btcReader.getPrice();
    console.log(`BTC: $${getData(price).price}`);
  }, 1000);
}
```

**❌ Don't: Recreate bound readers unnecessarily**
```typescript
// Bad - recreating bound reader
async function getCurrentPrice() {
  const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
  return await btcReader.getPrice();
}
```

## Error Handling

### 1. Result Type Handling

**✅ Do: Always check Result<T> success/failure**
```typescript
const priceResult = await reader.getPrice(context);

if (isSuccess(priceResult)) {
  const price = getData(priceResult);
  console.log(`Price: $${price.price.toFixed(2)}`);
} else {
  const error = getError(priceResult);
  console.error(`Failed to get price: ${error?.message}`);
  // Handle error appropriately
}
```

**❌ Don't: Assume operations always succeed**
```typescript
// Bad - not checking for errors
const priceResult = await reader.getPrice(context);
const price = getData(priceResult); // May throw if result is failure
```

### 2. Error Propagation

**✅ Do: Use functional error propagation**
```typescript
async function processPortfolio(symbols: MarketSymbol[]) {
  const results = await parallel(
    symbols.map(symbol => () => reader.getPrice(createMarketContext(exchange, symbol)))
  );
  
  const successfulPrices = results.filter(isSuccess).map(getData);
  const failures = results.filter(result => !isSuccess(result));
  
  if (failures.length > 0) {
    console.warn(`${failures.length} price fetches failed`);
  }
  
  return successfulPrices;
}
```

**❌ Don't: Throw exceptions for expected failures**
```typescript
// Bad - throwing for expected failures
async function getPrice(symbol: MarketSymbol) {
  const result = await reader.getPrice(context);
  if (!isSuccess(result)) {
    throw new Error("Price fetch failed"); // Don't throw for expected failures
  }
  return getData(result);
}
```

## Type Safety

### 1. Leverage TypeScript

**✅ Do: Use strict TypeScript settings**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**✅ Do: Use proper type annotations**
```typescript
// Good - explicit types
const reader: CoinGeckoMCPReader = createCoinGeckoMCPReader({
  name: "typed-reader",
  debug: false
});

const btcReader: BoundReader<MarketContext> = createPureReader(
  reader, 
  EXCHANGES.COINGECKO, 
  SYMBOLS.BTC
);
```

### 2. Context Type Safety

**✅ Do: Use type-safe context binding**
```typescript
// Good - TypeScript ensures correct arguments
const symbolReader = createSymbolReader(reader, EXCHANGES.COINGECKO);

// TypeScript knows this requires a symbol argument
await symbolReader.getPrice(SYMBOLS.BTC); // ✅ Correct

// TypeScript prevents this at compile time
// await symbolReader.getPrice(); // ❌ Error: Expected 1 arguments, but got 0
```

**❌ Don't: Use any types**
```typescript
// Bad - losing type safety
const reader: any = createCoinGeckoMCPReader({});
await reader.getPrice(); // No type checking
```

## Testing

### 1. Unit Testing

**✅ Do: Test handlers independently**
```typescript
// Good - testing handler logic only
describe("CoinGeckoMCPReader", () => {
  it("should transform price data correctly", async () => {
    const reader = new CoinGeckoMCPReader(config);
    
    // Mock MCP call
    jest.spyOn(reader, 'callMCPTool').mockResolvedValue([{
      current_price: 50000,
      last_updated: "2023-01-01T00:00:00Z",
      total_volume: 1000000
    }]);
    
    const result = await reader.getPrice(context);
    
    expect(isSuccess(result)).toBe(true);
    expect(getData(result).price).toBe(50000);
  });
});
```

**✅ Do: Test functional utilities**
```typescript
// Good - testing partial application
describe("Context Binding", () => {
  it("should create zero-argument functions", () => {
    const mockReader = createMockReader();
    const boundReader = createPureReader(mockReader, exchange, symbol);
    
    // Should require no arguments
    expect(boundReader.getPrice.length).toBe(0);
  });
});
```

### 2. Integration Testing

**✅ Do: Test with real external services**
```typescript
// Good - integration test with live data
describe("CoinGecko Integration", () => {
  it("should fetch live Bitcoin price", async () => {
    const reader = createCoinGeckoMCPReader({
      name: "integration-test",
      timeout: 30000
    });
    
    await reader.initialize();
    
    const result = await reader.getPrice(
      createMarketContext(EXCHANGES.COINGECKO, SYMBOLS.BTC)
    );
    
    expect(isSuccess(result)).toBe(true);
    expect(getData(result).price).toBeGreaterThan(0);
    
    await reader.cleanup();
  });
});
```

## Architecture Patterns

### 1. Composition Over Inheritance

**✅ Do: Compose actors using functional patterns**
```typescript
// Good - functional composition
class TradingBot {
  constructor(
    private btcReader: BoundReader<MarketContext>,
    private ethReader: BoundReader<MarketContext>
  ) {}
  
  async analyzeArbitrage(): Promise<ArbitrageOpportunity | null> {
    const [btcPrice, ethPrice] = await parallel([
      this.btcReader.getPrice,
      this.ethReader.getPrice
    ]);
    
    if (isSuccess(btcPrice) && isSuccess(ethPrice)) {
      return this.calculateArbitrage(getData(btcPrice), getData(ethPrice));
    }
    
    return null;
  }
}
```

**❌ Don't: Create deep inheritance hierarchies**
```typescript
// Bad - complex inheritance
class BaseTradingBot extends CoinGeckoMCPReader {
  // Complex inheritance makes testing harder
}

class ArbitrageTradingBot extends BaseTradingBot {
  // Even more complex
}
```

### 2. Dependency Injection

**✅ Do: Use dependency injection for testability**
```typescript
// Good - injectable dependencies
class MarketAnalyzer {
  constructor(
    private readers: {
      btc: BoundReader<MarketContext>;
      eth: BoundReader<MarketContext>;
    }
  ) {}
  
  async analyze(): Promise<MarketAnalysis> {
    // Implementation using injected readers
  }
}

// Easy to test with mocks
const analyzer = new MarketAnalyzer({
  btc: mockBtcReader,
  eth: mockEthReader
});
```

**❌ Don't: Create tight coupling**
```typescript
// Bad - tight coupling
class MarketAnalyzer {
  private btcReader = createPureReader(/* hardcoded dependencies */);
  private ethReader = createPureReader(/* hardcoded dependencies */);
  
  // Hard to test, tightly coupled
}
```

## Configuration Management

### 1. Environment-Based Configuration

**✅ Do: Use environment-specific configurations**
```typescript
// Good - environment-based config
const createReaderConfig = (env: string) => ({
  name: `market-reader-${env}`,
  debug: env === "development",
  timeout: env === "production" ? 30000 : 60000,
  maxRetries: env === "production" ? 3 : 1
});

const reader = createCoinGeckoMCPReader(createReaderConfig(process.env.NODE_ENV));
```

**❌ Don't: Hardcode configuration**
```typescript
// Bad - hardcoded config
const reader = createCoinGeckoMCPReader({
  name: "reader",
  debug: true,  // Always debug mode
  timeout: 30000  // Fixed timeout
});
```

### 2. Configuration Validation

**✅ Do: Validate configuration at startup**
```typescript
// Good - config validation
interface ValidatedConfig {
  name: string;
  debug: boolean;
  timeout: number;
  maxRetries: number;
}

function validateConfig(config: any): ValidatedConfig {
  if (!config.name || typeof config.name !== "string") {
    throw new Error("Config must have a valid name");
  }
  
  if (config.timeout && config.timeout < 1000) {
    throw new Error("Timeout must be at least 1000ms");
  }
  
  return {
    name: config.name,
    debug: config.debug ?? false,
    timeout: config.timeout ?? 30000,
    maxRetries: config.maxRetries ?? 3
  };
}
```

## Monitoring and Observability

### 1. Status Monitoring

**✅ Do: Monitor reader status**
```typescript
// Good - regular status monitoring
setInterval(() => {
  const status = reader.getStatus();
  console.log(`Reader status:`, {
    isInitialized: status.isInitialized,
    totalQueries: status.totalQueries,
    errorCount: status.errorCount,
    errorRate: status.errorCount / status.totalQueries
  });
  
  if (status.errorCount / status.totalQueries > 0.1) {
    console.warn("High error rate detected");
  }
}, 60000);
```

### 2. Performance Metrics

**✅ Do: Track performance metrics**
```typescript
// Good - performance tracking
async function timedGetPrice(reader: BoundReader<MarketContext>) {
  const start = Date.now();
  const result = await reader.getPrice();
  const duration = Date.now() - start;
  
  // Log performance metrics
  console.log(`Price fetch took ${duration}ms`);
  
  return result;
}
```

## Security Considerations

### 1. API Key Management

**✅ Do: Secure API key handling**
```typescript
// Good - secure key management
const config = {
  name: "secure-reader",
  apiKey: process.env.COINGECKO_API_KEY, // From environment
  debug: false // Don't log sensitive data in production
};
```

**❌ Don't: Hardcode API keys**
```typescript
// Bad - hardcoded keys
const config = {
  name: "insecure-reader",
  apiKey: "abc123..." // Never hardcode keys
};
```

### 2. Input Validation

**✅ Do: Validate all inputs**
```typescript
// Good - input validation
function validateMarketSymbol(symbol: any): symbol is MarketSymbol {
  return symbol && 
         typeof symbol.ticker === "string" &&
         typeof symbol.name === "string" &&
         typeof symbol.currency === "string";
}

async function safeGetPrice(reader: any, symbol: any) {
  if (!validateMarketSymbol(symbol)) {
    return failure(createQiError("INVALID_SYMBOL", "Invalid market symbol"));
  }
  
  return await reader.getPrice(symbol);
}
```

## Documentation

### 1. Code Documentation

**✅ Do: Document complex functions**
```typescript
/**
 * Creates a bound reader for high-frequency price operations
 * 
 * @param reader - The base market data reader
 * @param exchange - The exchange to bind to
 * @param symbol - The symbol to bind to
 * @returns A bound reader with zero-argument price methods
 * 
 * @example
 * ```typescript
 * const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
 * const price = await btcReader.getPrice(); // No arguments needed
 * ```
 */
export function createPureReader(
  reader: FPMarketDataReader,
  exchange: Exchange,
  symbol: MarketSymbol
): BoundReader<MarketContext> {
  return bindContext(reader, { exchange, symbol });
}
```

### 2. Usage Examples

**✅ Do: Provide working examples**
```typescript
// Good - complete working example
/**
 * High-frequency trading example
 * 
 * @example
 * ```typescript
 * const reader = createCoinGeckoMCPReader({ name: "hft-bot" });
 * await reader.initialize();
 * 
 * const btcReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.BTC);
 * const ethReader = createPureReader(reader, EXCHANGES.COINGECKO, SYMBOLS.ETH);
 * 
 * for (let i = 0; i < 1000; i++) {
 *   const [btcPrice, ethPrice] = await parallel([
 *     btcReader.getPrice,
 *     ethReader.getPrice
 *   ]);
 *   
 *   // Process arbitrage opportunities
 * }
 * 
 * await reader.cleanup();
 * ```
 */
```

By following these best practices, you'll build robust, performant, and maintainable applications using the FP system. Remember to always prioritize type safety, proper error handling, and clean architecture patterns.