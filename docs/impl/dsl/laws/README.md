# DSL Composition Laws

## Overview

The DSL composition laws define the fundamental rules that govern how reading and writing operations can be combined in the QiCore platform. These laws ensure type safety, proper error propagation, and correct data flow at compile time and runtime.

## The Five Fundamental Laws

### Law 1: Type Coherence Law

**Purpose**: Ensures that the output type of a read operation matches the input type of a write operation.

**Definition**:
```typescript
type TypeCoherenceLaw<R, W> = R extends (...args: any[]) => Promise<Result<infer TRead>>
  ? W extends (data: TRead, ...args: any[]) => Promise<Result<any>>
    ? true
    : false
  : false;
```

**Examples**:
```typescript
// ✅ Valid: Types match perfectly
type ValidPricesCombo = TypeCoherenceLaw<
  MarketDataReadingDSL["getCurrentPrices"],    // Returns Result<CryptoPriceData[]>
  MarketDataWritingDSL["publishPrices"]        // Accepts CryptoPriceData[]
>; // Result: true

// ✅ Valid: Single OHLCV to single OHLCV
type ValidOHLCVCombo = TypeCoherenceLaw<
  MarketDataReadingDSL["getCurrentOHLCV"],     // Returns Result<CryptoOHLCVData>
  MarketDataWritingDSL["publishOHLCV"]         // Accepts CryptoOHLCVData
>; // Result: true

// ❌ Invalid: Type mismatch
type InvalidCombo = TypeCoherenceLaw<
  MarketDataReadingDSL["getCurrentPrice"],     // Returns Result<number>
  MarketDataWritingDSL["publishPrices"]        // Expects CryptoPriceData[]
>; // Result: false
```

**Enforcement**: The type system prevents creation of combinators with mismatched types.

### Law 2: Error Propagation Law

**Purpose**: Defines how errors must propagate through read-write combinations.

**Rules**:
1. If read operation fails → combination fails without executing write
2. If write operation fails → combination fails with write error
3. Success only when both operations succeed

**Definition**:
```typescript
interface ErrorPropagationLaw<TResult> {
  readonly readFailed: (error: any) => Result<never>;
  readonly writeFailed: (error: any) => Result<never>;
  readonly success: (result: TResult) => Result<TResult>;
}
```

**Implementation**:
```typescript
// In the combinator execution
const readResult = await readOperation(...readArgs);

// Law 2: Error Propagation - Fail fast on read error
if (isFailure(readResult)) {
  return readResult; // Propagate read error immediately
}

// Only execute write if read succeeded
const data = getData(readResult);
const writeResult = await writeOperation(data, ...writeArgs);

// Return write result (success or failure)
return writeResult;
```

**Examples**:
```typescript
// Scenario 1: Read fails
const result1 = await pricesPipeline();
// → Returns read error, write never executed

// Scenario 2: Read succeeds, write fails
const result2 = await pricesPipeline();
// → Returns write error

// Scenario 3: Both succeed
const result3 = await pricesPipeline();
// → Returns success result
```

### Law 3: Data Flow Law

**Purpose**: Ensures data flows unidirectionally and transformations are pure.

**Rules**:
1. Data flows: Read → Transform (optional) → Write
2. No side effects on original data
3. Transformations must be pure functions

**Definition**:
```typescript
interface DataFlowLaw<TRead, TWrite> {
  readonly flow: (data: TRead) => TWrite;
  readonly purity: (data: TRead) => TRead; // Original data unchanged
}
```

**Implementation**:
```typescript
// Pure transformation example
const transformer = (prices: CryptoPriceData[]): CryptoPriceData[] => {
  // ✅ Good: Creates new array, doesn't mutate original
  return prices
    .filter(p => p.usdPrice > 1000)
    .map(p => ({ ...p, filtered: true }));
};

// ❌ Bad: Mutates original data
const badTransformer = (prices: CryptoPriceData[]): CryptoPriceData[] => {
  prices.forEach(p => p.filtered = true); // Mutation!
  return prices;
};
```

**Combinator Support**:
```typescript
const pipeline = combinator.pricesPipeline.withTransform(
  (prices) => prices.filter(p => p.usdPrice > 1000) // Pure function
);
```

### Law 4: Temporal Execution Law

**Purpose**: Enforces the sequence and atomicity of read-write operations.

**Rules**:
1. Read operation MUST complete before write operation begins
2. Operations are sequential, not parallel
3. Either both succeed or both fail (atomicity)

**Definition**:
```typescript
interface TemporalLaw {
  readonly sequence: "READ_THEN_WRITE";
  readonly atomicity: boolean; // Either both succeed or both fail
}
```

**Implementation**:
```typescript
// Correct temporal sequence
async function executeCombination() {
  // Step 1: Read operation completes first
  const readResult = await readOperation(...readArgs);
  
  if (isFailure(readResult)) {
    return readResult; // Fail atomically
  }
  
  // Step 2: Write operation begins only after read completes
  const writeResult = await writeOperation(getData(readResult), ...writeArgs);
  
  return writeResult; // Atomic success or failure
}

// ❌ Wrong: Parallel execution violates temporal law
async function badExecution() {
  const [readResult, writeResult] = await Promise.all([
    readOperation(...readArgs),
    writeOperation(someData, ...writeArgs) // Starts before read completes!
  ]);
}
```

### Law 5: DSL Method Compatibility Law

**Purpose**: Ensures only valid DSL methods can be combined.

**Rules**:
1. Read operations must be from `MarketDataReadingDSL`
2. Write operations must be from `MarketDataWritingDSL`
3. Cross-DSL combinations are forbidden

**Definition**:
```typescript
type DSLCompatibilityLaw<
  R extends keyof MarketDataReadingDSL,
  W extends keyof MarketDataWritingDSL,
> = true;
```

**Enforcement**:
```typescript
// ✅ Valid: Both methods are from correct DSL interfaces
const validCombinator = createLawfulDSLCombinator(
  reader.getCurrentPrices,    // From MarketDataReadingDSL
  writer.publishPrices        // From MarketDataWritingDSL
);

// ❌ Invalid: Type system prevents this at compile time
// const invalidCombinator = createLawfulDSLCombinator(
//   reader.someInvalidMethod,   // Not from DSL interface
//   writer.publishPrices
// );
```

## Universal DSL Combination Law

All five laws must hold for a valid combination:

```typescript
type DSLCombinationLaw<R, W, TRead, TWrite> = 
  TypeCoherenceLaw<R, W> extends true
    ? ErrorPropagationLaw<TWrite> extends object
      ? DataFlowLaw<TRead, TWrite> extends object
        ? TemporalLaw extends object
          ? true
          : InvalidCombination<"TEMPORAL_VIOLATION">
        : InvalidCombination<"DATA_FLOW_VIOLATION">
      : InvalidCombination<"ERROR_PROPAGATION_VIOLATION">
    : InvalidCombination<"TYPE_INCOHERENT">;
```

## Law-Enforcing Combinator

The `createLawfulDSLCombinator` function creates combinators that enforce all laws:

### Basic Usage

```typescript
const combinator = createLawfulDSLCombinator(
  reader.getCurrentPrices.bind(reader),
  writer.publishPrices.bind(writer)
);

// Execute with law enforcement
const pipeline = combinator.execute(
  [["bitcoin", "ethereum"]], // reader args
  []                         // writer args
);

const result = await pipeline();
```

### With Transformation

```typescript
const transformedPipeline = combinator.withTransform(
  // Pure transformation (Law 3: Data Flow Law)
  (prices: CryptoPriceData[]) => prices.filter(p => p.usdPrice > 1000)
).execute([["bitcoin", "ethereum"]], []);

const result = await transformedPipeline();
```

## Pre-Built Combinators

For common patterns, use the factory function:

```typescript
import { createReaderWriterCombinator } from './laws/combinator';

const combinators = createReaderWriterCombinator(reader, writer);

// All laws automatically enforced
await combinators.pricesPipeline.execute([["bitcoin"]], [])();
await combinators.ohlcvPipeline.execute([["bitcoin"]], [])();
await combinators.analyticsPipeline.execute([], [])();
await combinators.level1Pipeline.execute([{ticker: "BTC"}], [])();
```

## Law Validation Examples

### Valid Combinations

```typescript
// 1. Prices: CryptoPriceData[] → CryptoPriceData[]
const pricesCombo = createLawfulDSLCombinator(
  reader.getCurrentPrices.bind(reader),
  writer.publishPrices.bind(writer)
); // ✅ All laws satisfied

// 2. OHLCV: CryptoOHLCVData → CryptoOHLCVData
const ohlcvCombo = createLawfulDSLCombinator(
  reader.getCurrentOHLCV.bind(reader),
  writer.publishOHLCV.bind(writer)
); // ✅ All laws satisfied

// 3. Analytics: CryptoMarketAnalytics → CryptoMarketAnalytics
const analyticsCombo = createLawfulDSLCombinator(
  reader.getMarketAnalytics.bind(reader),
  writer.publishAnalytics.bind(writer)
); // ✅ All laws satisfied
```

### Invalid Combinations

```typescript
// ❌ Type incoherent: number ≠ CryptoPriceData[]
// This will not compile due to Law 1 violation
const invalidCombo = createLawfulDSLCombinator(
  reader.getCurrentPrice.bind(reader),     // Returns number
  writer.publishPrices.bind(writer)        // Expects CryptoPriceData[]
);

// ❌ DSL compatibility violation
// Non-DSL methods cannot be used
const nonDSLCombo = createLawfulDSLCombinator(
  reader.somePrivateMethod,                // Not from DSL interface
  writer.publishPrices.bind(writer)
);
```

## Error Scenarios and Handling

### Law 1 Violation: Type Incoherence

```typescript
// Compile-time error prevention
type Check = TypeCoherenceLaw<
  () => Promise<Result<number>>,
  (data: string[]) => Promise<Result<void>>
>; // Result: false - types don't match
```

### Law 2 Violation: Improper Error Handling

```typescript
// ❌ Bad: Swallowing errors
async function badErrorHandling() {
  try {
    const readResult = await readOperation();
    // Ignoring potential read failures!
    const data = getData(readResult); // Could throw
    await writeOperation(data);
  } catch {
    // Silent failure violates error propagation law
  }
}

// ✅ Good: Proper error propagation
const result = await combinator.execute([args], [])();
if (isFailure(result)) {
  const error = getError(result);
  // Handle error appropriately
}
```

### Law 3 Violation: Impure Transformation

```typescript
// ❌ Bad: Side effects in transformation
const impureTransform = (prices: CryptoPriceData[]) => {
  prices.forEach(p => console.log(p)); // Side effect!
  return prices.filter(p => p.usdPrice > 1000);
};

// ✅ Good: Pure transformation
const pureTransform = (prices: CryptoPriceData[]) => {
  return prices.filter(p => p.usdPrice > 1000); // No side effects
};
```

### Law 4 Violation: Temporal Ordering

```typescript
// ❌ Bad: Parallel execution
const badTemporal = Promise.all([
  readOperation(),
  writeOperation(someData) // Violates temporal ordering
]);

// ✅ Good: Sequential execution (handled by combinator)
const goodTemporal = combinator.execute([readArgs], [writeArgs]);
```

## Testing Laws

### Compile-Time Tests

```typescript
// Type-level tests to ensure laws are enforced
type Tests = {
  // Should be true for valid combinations
  validPrices: TypeCoherenceLaw<
    MarketDataReadingDSL["getCurrentPrices"],
    MarketDataWritingDSL["publishPrices"]
  >;
  
  // Should be false for invalid combinations
  invalidCombo: TypeCoherenceLaw<
    MarketDataReadingDSL["getCurrentPrice"],
    MarketDataWritingDSL["publishPrices"]
  >;
};
```

### Runtime Tests

```typescript
describe("DSL Laws", () => {
  it("enforces error propagation law", async () => {
    const mockReader = {
      getCurrentPrices: () => Promise.resolve(failure(createQiError("TEST", "Read failed")))
    };
    
    const combinator = createLawfulDSLCombinator(
      mockReader.getCurrentPrices,
      writer.publishPrices.bind(writer)
    );
    
    const result = await combinator.execute([["bitcoin"]], [])();
    
    // Write should never be called due to read failure
    expect(isFailure(result)).toBe(true);
    expect(getError(result).code).toBe("TEST");
  });
  
  it("enforces temporal execution law", async () => {
    const executionOrder: string[] = [];
    
    const mockReader = {
      getCurrentPrices: async () => {
        executionOrder.push("read");
        return success([]);
      }
    };
    
    const mockWriter = {
      publishPrices: async () => {
        executionOrder.push("write");
        return success(undefined);
      }
    };
    
    const combinator = createLawfulDSLCombinator(
      mockReader.getCurrentPrices,
      mockWriter.publishPrices
    );
    
    await combinator.execute([["bitcoin"]], [])();
    
    expect(executionOrder).toEqual(["read", "write"]);
  });
});
```

## Performance Considerations

### Law Enforcement Overhead

The law enforcement adds minimal runtime overhead:

1. **Type checking**: Zero runtime cost (compile-time only)
2. **Error propagation**: Single conditional check
3. **Temporal execution**: Natural async/await sequence
4. **Purity checks**: Developer responsibility (not runtime checked)

### Optimization Strategies

```typescript
// For high-frequency operations, pre-create combinators
const pricesCombo = createLawfulDSLCombinator(reader.getCurrentPrices, writer.publishPrices);

// Reuse the same combinator instance
for (const batch of batches) {
  await pricesCombo.execute([batch], [])();
}
```

---

**Benefits**: The five laws ensure that all data operations in the QiCore platform are type-safe, reliable, and composable while maintaining excellent performance characteristics.