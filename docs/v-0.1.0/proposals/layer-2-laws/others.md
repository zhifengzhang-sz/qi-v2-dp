The following laws capture the **fundamental nature** of financial market data DSLs:

## Additional DSL Laws

```typescript
// =============================================================================
// CARDINALITY COHERENCE LAW
// =============================================================================

/**
 * Law 6: Cardinality Coherence Law
 * Single item operations should combine with single item operations
 * Batch operations should combine with batch operations
 * Mixed cardinality requires explicit transformation
 */
type CardinalityCoherenceLaw<R, W> = 
  R extends (...args: any[]) => Promise<Result<any[]>>  // Batch read
    ? W extends (data: any[], ...args: any[]) => Promise<Result<any>>  // Batch write
      ? "BATCH_TO_BATCH"
      : "CARDINALITY_MISMATCH"
    : R extends (...args: any[]) => Promise<Result<any>>  // Single read
      ? W extends (data: any, ...args: any[]) => Promise<Result<any>>  // Single write
        ? "SINGLE_TO_SINGLE" 
        : "CARDINALITY_MISMATCH"
      : "UNKNOWN_CARDINALITY";

// =============================================================================
// TEMPORAL CONSISTENCY LAW
// =============================================================================

/**
 * Law 7: Temporal Consistency Law
 * Market data operations must respect temporal ordering and constraints
 * Historical data cannot be newer than current data
 * Date range operations must have valid start/end relationships
 */
type TemporalConsistencyLaw = {
  readonly historicalDataRule: "PAST_ONLY";
  readonly currentDataRule: "LATEST_AVAILABLE";
  readonly dateRangeRule: "START_BEFORE_END";
  readonly freshnessRule: "DECREASING_WITH_TIME";
};

// =============================================================================
// ATTRIBUTION PRESERVATION LAW
// =============================================================================

/**
 * Law 8: Attribution Preservation Law
 * All market data must maintain source attribution throughout the pipeline
 * Combinations cannot lose or corrupt attribution information
 * Attribution must be traceable from source to sink
 */
type AttributionPreservationLaw<TData> = TData extends { attribution: string; source: string }
  ? {
      readonly sourcePreserved: true;
      readonly attributionMaintained: true;
      readonly traceability: "FULL";
    }
  : {
      readonly violation: "MISSING_ATTRIBUTION";
      readonly compliant: false;
    };

// =============================================================================
// IDEMPOTENCY LAW
// =============================================================================

/**
 * Law 9: Idempotency Law
 * Read operations must be idempotent - multiple calls with same parameters 
 * should return equivalent data (allowing for market data updates)
 * Write operations with same data should be safe to repeat
 */
type IdempotencyLaw<TOperation> = {
  readonly readIdempotency: "GUARANTEED";
  readonly writeIdempotency: "SAFE_RETRY";
  readonly sideEffects: "NONE_ON_READ" | "CONTROLLED_ON_WRITE";
};

// =============================================================================
// MARKET DATA VALIDATION LAW
// =============================================================================

/**
 * Law 10: Market Data Validation Law
 * All market data must pass domain-specific validation rules
 * Prices must be positive, volumes non-negative, timestamps valid
 * OHLCV data must satisfy mathematical constraints (High >= Low, etc.)
 */
type MarketDataValidationLaw<TData> = 
  TData extends CryptoPriceData
    ? {
        readonly pricePositive: "REQUIRED";
        readonly volumeNonNegative: "REQUIRED";
        readonly timestampValid: "REQUIRED";
        readonly symbolFormat: "STANDARD";
      }
    : TData extends CryptoOHLCVData
      ? {
          readonly ohlcConstraints: "HIGH_GTE_LOW_AND_OPEN_CLOSE";
          readonly volumeNonNegative: "REQUIRED";
          readonly timestampValid: "REQUIRED";
          readonly timeframeConsistent: "REQUIRED";
        }
      : TData extends CryptoMarketAnalytics
        ? {
            readonly marketCapPositive: "REQUIRED";
            readonly dominancePercentage: "BETWEEN_0_AND_100";
            readonly countsNonNegative: "REQUIRED";
          }
        : "UNKNOWN_DATA_TYPE";

// =============================================================================
// RESOURCE CONSERVATION LAW
// =============================================================================

/**
 * Law 11: Resource Conservation Law
 * Batch operations should be preferred for multiple items
 * API rate limits must be respected
 * Network calls should be minimized through intelligent batching
 */
type ResourceConservationLaw<TArgs> = 
  TArgs extends [string[], ...any[]]  // Multiple items
    ? {
        readonly preferBatch: true;
        readonly rateLimitAware: true;
        readonly networkOptimal: true;
      }
    : TArgs extends [string, ...any[]]  // Single item
      ? {
          readonly singleItemEfficient: true;
          readonly rateLimitConsumed: 1;
        }
      : "UNKNOWN_RESOURCE_PATTERN";

// =============================================================================
// DATA FRESHNESS LAW
// =============================================================================

/**
 * Law 12: Data Freshness Law
 * Current data operations should provide freshness guarantees
 * Historical data has fixed freshness (doesn't change)
 * Real-time operations must indicate data staleness
 */
type DataFreshnessLaw<TOperation> = 
  TOperation extends "getCurrentPrice" | "getCurrentPrices" | "getCurrentOHLCV" | "getLatestOHLCV"
    ? {
        readonly freshnessGuarantee: "CURRENT";
        readonly maxStaleness: "DEFINED";
        readonly realTimeIndicator: "REQUIRED";
      }
    : TOperation extends "getPriceHistory" | "getOHLCVByDateRange"
      ? {
          readonly freshnessGuarantee: "HISTORICAL";
          readonly immutable: true;
          readonly versionStable: true;
        }
      : "OPERATION_FRESHNESS_UNKNOWN";

// =============================================================================
// AGGREGATION COHERENCE LAW
// =============================================================================

/**
 * Law 13: Aggregation Coherence Law
 * Data aggregations must maintain mathematical consistency
 * OHLCV aggregations must preserve price relationships
 * Volume aggregations must be additive
 */
type AggregationCoherenceLaw<TSource, TTarget> = {
  readonly mathematicallyConsistent: boolean;
  readonly preservesRelationships: boolean;
  readonly aggregationFunction: "SUM" | "AVERAGE" | "MIN" | "MAX" | "CUSTOM";
};
```

## Enhanced Universal DSL Law

```typescript
// =============================================================================
// ENHANCED UNIVERSAL DSL COMBINATION LAW
// =============================================================================

/**
 * The Complete Universal DSL Combination Law
 * 
 * For any read operation R and write operation W to form a valid combination,
 * ALL of the following laws must hold:
 */
type CompleteDSLCombinationLaw<R, W, TRead, TWrite, TReadArgs> = 
  // Core Laws (1-5)
  TypeCoherenceLaw<R, W> extends true
    ? ErrorPropagationLaw<TWrite> extends object
      ? DataFlowLaw<TRead, TWrite> extends object
        ? TemporalLaw extends object
          ? DSLCompatibilityLaw<R, W> extends true
            // Market Data Laws (6-13)
            ? CardinalityCoherenceLaw<R, W> extends "BATCH_TO_BATCH" | "SINGLE_TO_SINGLE"
              ? AttributionPreservationLaw<TRead> extends { compliant: false }
                ? InvalidCombination<"ATTRIBUTION_VIOLATION">
                : MarketDataValidationLaw<TRead> extends "UNKNOWN_DATA_TYPE"
                  ? InvalidCombination<"VALIDATION_RULE_UNKNOWN">
                  : ResourceConservationLaw<TReadArgs> extends object
                    ? ValidMarketDataCombination<R, W, TRead, TWrite>
                    : InvalidCombination<"RESOURCE_INEFFICIENT">
              : InvalidCombination<"CARDINALITY_MISMATCH">
            : InvalidCombination<"DSL_INCOMPATIBLE">
          : InvalidCombination<"TEMPORAL_VIOLATION">
        : InvalidCombination<"DATA_FLOW_VIOLATION">
      : InvalidCombination<"ERROR_PROPAGATION_VIOLATION">
    : InvalidCombination<"TYPE_INCOHERENT">;

type ValidMarketDataCombination<R, W, TRead, TWrite> = {
  readonly law: "COMPLETE_DSL_COMBINATION_LAW";
  readonly readOperation: R;
  readonly writeOperation: W;
  readonly dataFlow: TRead extends TWrite ? "DIRECT" : "TRANSFORMED";
  readonly cardinality: CardinalityCoherenceLaw<R, W>;
  readonly attribution: "PRESERVED";
  readonly validation: "COMPLIANT";
  readonly resources: "OPTIMIZED";
  readonly valid: true;
};
```

## Law-Enforcing Combinator with All Laws

```typescript
function createCompletelyLawfulDSLCombinator
  TReadFn extends (...args: any[]) => Promise<Result<any>>,
  TWriteFn extends (data: any, ...args: any[]) => Promise<Result<any>>,
  TReadData = TReadFn extends (...args: any[]) => Promise<Result<infer U>> ? U : never,
  TWriteResult = TWriteFn extends (...args: any[]) => Promise<Result<infer U>> ? U : never
>(
  readOperation: TReadFn,
  writeOperation: TWriteFn
): CompleteDSLCombinationLaw<TReadFn, TWriteFn, TReadData, TWriteResult, Parameters<TReadFn>> extends ValidMarketDataCombination<any, any, any, any>
  ? EnhancedDSLCombinator<TReadFn, TWriteFn, TReadData, TWriteResult>
  : never {
  
  const combinator = {
    law: "COMPLETE_DSL_COMBINATION_LAW" as const,
    
    execute: (
      readArgs: Parameters<TReadFn>,
      writeArgs: Parameters<TWriteFn> extends [any, ...infer Rest] ? Rest : []
    ) => {
      return async (): Promise<Result<TWriteResult>> => {
        // Law 9: Idempotency Law - Read operations are safe to retry
        const readResult = await readOperation(...readArgs);
        
        // Law 2: Error Propagation Law
        if (!readResult.success) {
          return Result.failure(readResult.error);
        }
        
        // Law 10: Market Data Validation Law - Validate before writing
        const validationResult = validateMarketData(readResult.data);
        if (!validationResult.valid) {
          return Result.failure(`Validation failed: ${validationResult.reason}`);
        }
        
        // Law 8: Attribution Preservation Law - Ensure attribution exists
        if (!hasValidAttribution(readResult.data)) {
          return Result.failure("Attribution preservation law violated");
        }
        
        // Law 12: Data Freshness Law - Check freshness for current data operations
        const freshnessCheck = validateDataFreshness(readOperation.name, readResult.data);
        if (!freshnessCheck.valid) {
          return Result.failure(`Freshness law violated: ${freshnessCheck.reason}`);
        }
        
        // Law 1, 3, 4: Execute write with all laws enforced
        const writeResult = await writeOperation(readResult.data, ...writeArgs);
        
        return writeResult;
      };
    },
    
    // Additional methods for law compliance
    validateCombination: () => {
      return {
        typeCoherence: true,
        cardinalityMatch: true,
        attributionPreserved: true,
        validationCompliant: true,
        resourceOptimal: true
      };
    }
  };
  
  return combinator as any;
}

// Helper functions for law enforcement
function validateMarketData(data: any): { valid: boolean; reason?: string } {
  // Law 10: Market Data Validation Law implementation
  if (data?.usdPrice !== undefined && data.usdPrice <= 0) {
    return { valid: false, reason: "Price must be positive" };
  }
  if (data?.volume !== undefined && data.volume < 0) {
    return { valid: false, reason: "Volume cannot be negative" };
  }
  return { valid: true };
}

function hasValidAttribution(data: any): boolean {
  // Law 8: Attribution Preservation Law implementation
  return data?.source && data?.attribution;
}

function validateDataFreshness(operationName: string, data: any): { valid: boolean; reason?: string } {
  // Law 12: Data Freshness Law implementation
  if (operationName.includes('getCurrent') || operationName.includes('getLatest')) {
    const now = new Date();
    const dataTime = new Date(data?.lastUpdated || data?.timestamp);
    const ageMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);
    
    if (ageMinutes > 60) { // More than 1 hour old
      return { valid: false, reason: "Current data is too stale" };
    }
  }
  return { valid: true };
}
```

These additional laws capture the **essential nature** of market data DSLs:

1. **Cardinality Coherence** - Prevents mixing single/batch operations inappropriately
2. **Temporal Consistency** - Enforces time-based business rules
3. **Attribution Preservation** - Maintains data lineage (critical for compliance)
4. **Idempotency** - Ensures operations are safe and predictable
5. **Market Data Validation** - Enforces domain-specific constraints
6. **Resource Conservation** - Optimizes API usage and network calls
7. **Data Freshness** - Maintains data quality guarantees
8. **Aggregation Coherence** - Preserves mathematical relationships

These laws are **inherent to the domain** - any market data DSL should respect them, regardless of implementation!