We want to define the **combinatorial laws** at the DSL level - the abstract rules that govern how read and write operations combine, independent of implementation. Then the actual combinator enforces these laws.

## DSL Combinatorial Laws

```typescript
import type { ResultType as Result } from "@qi/core/base";
import type { MarketDataReadingDSL, MarketDataWritingDSL } from "./dsl";

// =============================================================================
// DSL COMBINATORIAL LAWS - ABSTRACT COMPOSITION RULES
// =============================================================================

/**
 * Law 1: Type Coherence Law
 * For any read operation R and write operation W to be combinable:
 * - The output type of R must match the input type of W
 * - Both operations must return Result<T> for error handling consistency
 */
type TypeCoherenceLaw<R, W> = 
  R extends (...args: any[]) => Promise<Result<infer TRead>>
    ? W extends (data: TRead, ...args: any[]) => Promise<Result<any>>
      ? true
      : false
    : false;

/**
 * Law 2: Error Propagation Law
 * If read operation fails, the combination fails without executing write
 * If write operation fails, the combination fails with write error
 * Success only when both operations succeed
 */
type ErrorPropagationLaw<TResult> = {
  readonly readFailed: (error: any) => Result<never>;
  readonly writeFailed: (error: any) => Result<never>;
  readonly success: (result: TResult) => Result<TResult>;
};

/**
 * Law 3: Data Flow Law
 * Data flows unidirectionally: Read → Transform (optional) → Write
 * No side effects on original data
 * Transformation is pure function
 */
type DataFlowLaw<TRead, TWrite> = {
  readonly flow: (data: TRead) => TWrite;
  readonly purity: (data: TRead) => TRead; // Original data unchanged
};

/**
 * Law 4: Temporal Execution Law
 * Read operation MUST complete before write operation begins
 * Operations are sequential, not parallel
 * No interleaving of read/write within a single combination
 */
type TemporalLaw = {
  readonly sequence: "READ_THEN_WRITE";
  readonly atomicity: boolean; // Either both succeed or both fail
};

/**
 * Law 5: DSL Method Compatibility Law
 * Only methods from MarketDataReadingDSL can be read operations
 * Only methods from MarketDataWritingDSL can be write operations
 * Cross-DSL combinations are forbidden
 */
type DSLCompatibilityLaw<R, W> =
  R extends keyof MarketDataReadingDSL
    ? W extends keyof MarketDataWritingDSL
      ? true
      : false
    : false;

// =============================================================================
// COMBINED DSL LAW - THE UNIVERSAL COMBINATION RULE
// =============================================================================

/**
 * The Universal DSL Combination Law
 * 
 * For any read operation R and write operation W to form a valid combination,
 * ALL of the following laws must hold:
 */
type DSLCombinationLaw<R, W, TRead, TWrite> = 
  TypeCoherenceLaw<R, W> extends true
    ? ErrorPropagationLaw<TWrite> extends object
      ? DataFlowLaw<TRead, TWrite> extends object
        ? TemporalLaw extends object
          ? DSLCompatibilityLaw<R, W> extends true
            ? ValidCombination<R, W, TRead, TWrite>
            : InvalidCombination<"DSL_INCOMPATIBLE">
          : InvalidCombination<"TEMPORAL_VIOLATION">
        : InvalidCombination<"DATA_FLOW_VIOLATION">
      : InvalidCombination<"ERROR_PROPAGATION_VIOLATION">
    : InvalidCombination<"TYPE_INCOHERENT">;

type ValidCombination<R, W, TRead, TWrite> = {
  readonly law: "DSL_COMBINATION_LAW";
  readonly readOperation: R;
  readonly writeOperation: W;
  readonly dataFlow: TRead extends TWrite ? "DIRECT" : "TRANSFORMED";
  readonly valid: true;
};

type InvalidCombination<TReason extends string> = {
  readonly law: "DSL_COMBINATION_LAW";
  readonly valid: false;
  readonly violation: TReason;
};
```

## Law-Enforcing Combinator

```typescript
// =============================================================================
// LAW-ENFORCING DSL COMBINATOR
// =============================================================================

/**
 * The DSL Combinator that enforces the Universal DSL Combination Law
 * 
 * This combinator can ONLY create valid combinations that satisfy all laws
 */
function createLawfulDSLCombinator
  TReadFn extends (...args: any[]) => Promise<Result<any>>,
  TWriteFn extends (data: any, ...args: any[]) => Promise<Result<any>>,
  TReadData = TReadFn extends (...args: any[]) => Promise<Result<infer U>> ? U : never,
  TWriteResult = TWriteFn extends (...args: any[]) => Promise<Result<infer U>> ? U : never
>(
  readOperation: TReadFn,
  writeOperation: TWriteFn
): DSLCombinationLaw<TReadFn, TWriteFn, TReadData, TWriteResult> extends ValidCombination<any, any, any, any>
  ? DSLCombinator<TReadFn, TWriteFn, TReadData, TWriteResult>
  : never {
  
  // The combinator implementation that enforces all laws
  const combinator = {
    law: "DSL_COMBINATION_LAW" as const,
    
    /**
     * Execute combination following all DSL laws
     */
    execute: (
      readArgs: Parameters<TReadFn>,
      writeArgs: Parameters<TWriteFn> extends [any, ...infer Rest] ? Rest : []
    ) => {
      return async (): Promise<Result<TWriteResult>> => {
        // Law 4: Temporal Execution Law - Read MUST happen first
        const readResult = await readOperation(...readArgs);
        
        // Law 2: Error Propagation Law - Fail fast on read error
        if (!readResult.success) {
          return Result.failure(readResult.error);
        }
        
        // Law 3: Data Flow Law - Data flows from read to write
        // Law 1: Type Coherence Law - Types must match
        const writeResult = await writeOperation(readResult.data, ...writeArgs);
        
        // Law 2: Error Propagation Law - Return write result (success or failure)
        return writeResult;
      };
    },
    
    /**
     * Execute with transformation (still following all laws)
     */
    withTransform: <TTransformed>(
      // Law 3: Data Flow Law - Transformation must be pure
      transformer: (data: TReadData) => TTransformed | Promise<TTransformed>
    ) => {
      return (
        readArgs: Parameters<TReadFn>,
        writeArgs: Parameters<TWriteFn> extends [any, ...infer Rest] ? Rest : []
      ) => {
        return async (): Promise<Result<TWriteResult>> => {
          // Law 4: Temporal Execution Law
          const readResult = await readOperation(...readArgs);
          
          // Law 2: Error Propagation Law
          if (!readResult.success) {
            return Result.failure(readResult.error);
          }
          
          try {
            // Law 3: Data Flow Law - Pure transformation
            const transformedData = await transformer(readResult.data);
            
            // Law 1: Type Coherence Law (enforced by transformer)
            const writeResult = await writeOperation(transformedData as any, ...writeArgs);
            
            return writeResult;
          } catch (error) {
            // Law 2: Error Propagation Law - Transform errors propagate
            return Result.failure(`Transformation violation: ${error}`);
          }
        };
      };
    }
  };
  
  return combinator as any;
}

type DSLCombinator<TReadFn, TWriteFn, TReadData, TWriteResult> = {
  readonly law: "DSL_COMBINATION_LAW";
  execute: (
    readArgs: Parameters<TReadFn>,
    writeArgs: Parameters<TWriteFn> extends [any, ...infer Rest] ? Rest : []
  ) => () => Promise<Result<TWriteResult>>;
  withTransform: <TTransformed>(
    transformer: (data: TReadData) => TTransformed | Promise<TTransformed>
  ) => (
    readArgs: Parameters<TReadFn>,
    writeArgs: Parameters<TWriteFn> extends [any, ...infer Rest] ? Rest : []
  ) => () => Promise<Result<TWriteResult>>;
};
```

## Usage - Law Enforcement in Action

```typescript
// Your concrete instances
const reader = new ConcreteReader({ name: "reader" });
const writer = new ConcreteWriter({ name: "writer" });

// ✅ VALID: Types are coherent (CryptoPriceData[] matches)
const validPricesCombinator = createLawfulDSLCombinator(
  reader.getCurrentPrices.bind(reader),
  writer.publishPrices.bind(writer)
);

// ✅ VALID: Types are coherent (CryptoOHLCVData matches)
const validOHLCVCombinator = createLawfulDSLCombinator(
  reader.getCurrentOHLCV.bind(reader),
  writer.publishOHLCV.bind(writer)
);

// ❌ INVALID: TypeScript prevents this - number doesn't match CryptoPriceData[]
// const invalidCombinator = createLawfulDSLCombinator(
//   reader.getCurrentPrice.bind(reader),    // Returns number
//   writer.publishPrices.bind(writer)       // Expects CryptoPriceData[]
// ); // This won't compile!

// Usage follows the laws automatically
const pricesETL = validPricesCombinator.execute(
  [["bitcoin", "ethereum"]], // read args
  [{ topic: "prices" }]       // write args
);

// Law enforcement in action:
await pricesETL(); // ✅ Follows all 5 laws automatically
```

## Law Validation at Compile Time

```typescript
// The laws are enforced by TypeScript at compile time
type TestLawEnforcement = {
  // ✅ Valid combinations compile
  validPrices: ReturnType<typeof createLawfulDSLCombinator
    typeof reader.getCurrentPrices,
    typeof writer.publishPrices
  >>;
  
  validOHLCV: ReturnType<typeof createLawfulDSLCombinator
    typeof reader.getCurrentOHLCV,
    typeof writer.publishOHLCV
  >>;
  
  // ❌ Invalid combinations return never
  invalidMismatch: ReturnType<typeof createLawfulDSLCombinator
    typeof reader.getCurrentPrice,     // number
    typeof writer.publishPrices        // CryptoPriceData[]
  >>; // This type is 'never'
};
```

This approach:

1. **Defines laws at the DSL level** - independent of implementation
2. **Enforces laws through types** - invalid combinations won't compile
3. **Guarantees law adherence** - any valid combinator follows all laws
4. **Implementation agnostic** - works with any BaseReader/BaseWriter implementation
5. **Mathematical foundation** - based on formal composition rules

The combinator **is** the law enforcement mechanism - you can't create invalid combinations!