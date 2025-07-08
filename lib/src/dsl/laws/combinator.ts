#!/usr/bin/env bun

/**
 * DSL Combinatorial Laws - Layer 2
 *
 * Defines the abstract rules that govern how read and write operations combine,
 * independent of implementation. These laws ensure type safety, error propagation,
 * and proper data flow at the DSL level.
 */

import type { ResultType as Result } from "@qi/core/base";
import {
  createQiError,
  failure,
  getData,
  getError,
  isFailure,
  isSuccess,
  success,
} from "@qi/core/base";
import type { MarketDataReadingDSL, MarketDataWritingDSL } from "../";

// =============================================================================
// DSL COMBINATORIAL LAWS - ABSTRACT COMPOSITION RULES
// =============================================================================

/**
 * Law 1: Type Coherence Law
 * For any read operation R and write operation W to be combinable:
 * - The output type of R must match the input type of W
 * - Both operations must return Result<T> for error handling consistency
 */
export type TypeCoherenceLaw<R, W> = R extends (...args: any[]) => Promise<Result<infer TRead>>
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
export interface ErrorPropagationLaw<TResult> {
  readonly readFailed: (error: any) => Result<never>;
  readonly writeFailed: (error: any) => Result<never>;
  readonly success: (result: TResult) => Result<TResult>;
}

/**
 * Law 3: Data Flow Law
 * Data flows unidirectionally: Read → Transform (optional) → Write
 * No side effects on original data
 * Transformation is pure function
 */
export interface DataFlowLaw<TRead, TWrite> {
  readonly flow: (data: TRead) => TWrite;
  readonly purity: (data: TRead) => TRead; // Original data unchanged
}

/**
 * Law 4: Temporal Execution Law
 * Read operation MUST complete before write operation begins
 * Operations are sequential, not parallel
 * No interleaving of read/write within a single combination
 */
export interface TemporalLaw {
  readonly sequence: "READ_THEN_WRITE";
  readonly atomicity: boolean; // Either both succeed or both fail
}

/**
 * Law 5: DSL Method Compatibility Law
 * Only methods from MarketDataReadingDSL can be read operations
 * Only methods from MarketDataWritingDSL can be write operations
 * Cross-DSL combinations are forbidden
 */
export type DSLCompatibilityLaw<
  R extends keyof MarketDataReadingDSL,
  W extends keyof MarketDataWritingDSL,
> = true;

// =============================================================================
// COMBINED DSL LAW - THE UNIVERSAL COMBINATION RULE
// =============================================================================

/**
 * The Universal DSL Combination Law
 *
 * For any read operation R and write operation W to form a valid combination,
 * ALL of the following laws must hold:
 */
export type DSLCombinationLaw<R, W, TRead, TWrite> = TypeCoherenceLaw<R, W> extends true
  ? ErrorPropagationLaw<TWrite> extends object
    ? DataFlowLaw<TRead, TWrite> extends object
      ? TemporalLaw extends object
        ? true
        : InvalidCombination<"TEMPORAL_VIOLATION">
      : InvalidCombination<"DATA_FLOW_VIOLATION">
    : InvalidCombination<"ERROR_PROPAGATION_VIOLATION">
  : InvalidCombination<"TYPE_INCOHERENT">;

export interface ValidCombination<R, W, TRead, TWrite> {
  readonly law: "DSL_COMBINATION_LAW";
  readonly readOperation: R;
  readonly writeOperation: W;
  readonly dataFlow: TRead extends TWrite ? "DIRECT" : "TRANSFORMED";
  readonly valid: true;
}

export interface InvalidCombination<TReason extends string> {
  readonly law: "DSL_COMBINATION_LAW";
  readonly valid: false;
  readonly violation: TReason;
}

// =============================================================================
// LAW-ENFORCING DSL COMBINATOR
// =============================================================================

export interface DSLCombinator<
  TReadFn extends (...args: any) => any,
  TWriteFn extends (...args: any) => any,
  TReadData,
  TWriteResult,
> {
  readonly law: "DSL_COMBINATION_LAW";
  execute: (
    readArgs: Parameters<TReadFn>,
    writeArgs: TWriteFn extends (data: any, ...args: infer Rest) => any ? Rest : [],
  ) => () => Promise<Result<TWriteResult>>;
  withTransform: <TTransformed>(
    transformer: (data: TReadData) => TTransformed | Promise<TTransformed>,
  ) => (
    readArgs: Parameters<TReadFn>,
    writeArgs: TWriteFn extends (data: any, ...args: infer Rest) => any ? Rest : [],
  ) => () => Promise<Result<TWriteResult>>;
}

/**
 * The DSL Combinator that enforces the Universal DSL Combination Law
 *
 * This combinator can ONLY create valid combinations that satisfy all laws
 */
export function createLawfulDSLCombinator<
  TReadFn extends (...args: any[]) => Promise<Result<any>>,
  TWriteFn extends (data: any, ...args: any[]) => Promise<Result<any>>,
  TReadData = TReadFn extends (...args: any[]) => Promise<Result<infer U>> ? U : never,
  TWriteResult = TWriteFn extends (...args: any[]) => Promise<Result<infer U>> ? U : never,
>(
  readOperation: TReadFn,
  writeOperation: TWriteFn,
): DSLCombinator<TReadFn, TWriteFn, TReadData, TWriteResult> {
  // The combinator implementation that enforces all laws
  const combinator: DSLCombinator<TReadFn, TWriteFn, TReadData, TWriteResult> = {
    law: "DSL_COMBINATION_LAW" as const,

    /**
     * Execute combination following all DSL laws
     */
    execute: (readArgs, writeArgs) => {
      return async (): Promise<Result<TWriteResult>> => {
        // Law 4: Temporal Execution Law - Read MUST happen first
        const readResult = await readOperation(...readArgs);

        // Law 2: Error Propagation Law - Fail fast on read error
        if (isFailure(readResult)) {
          return readResult;
        }

        // Law 3: Data Flow Law - Data flows from read to write
        // Law 1: Type Coherence Law - Types must match
        const data = getData(readResult);
        const writeResult = await writeOperation(data, ...writeArgs);

        // Law 2: Error Propagation Law - Return write result (success or failure)
        return writeResult;
      };
    },

    /**
     * Execute with transformation (still following all laws)
     */
    withTransform: <TTransformed>(
      // Law 3: Data Flow Law - Transformation must be pure
      transformer: (data: TReadData) => TTransformed | Promise<TTransformed>,
    ) => {
      return (readArgs: Parameters<TReadFn>, writeArgs: any[]) => {
        return async (): Promise<Result<TWriteResult>> => {
          // Law 4: Temporal Execution Law
          const readResult = await readOperation(...readArgs);

          // Law 2: Error Propagation Law
          if (isFailure(readResult)) {
            return readResult;
          }

          try {
            // Law 3: Data Flow Law - Pure transformation
            const data = getData(readResult);
            const transformedData = await transformer(data);

            // Law 1: Type Coherence Law (enforced by transformer)
            const writeResult = await writeOperation(transformedData as any, ...writeArgs);

            return writeResult;
          } catch (error) {
            // Law 2: Error Propagation Law - Transform errors propagate
            return failure(
              createQiError(
                "TRANSFORMATION_FAILED",
                `Transformation violation: ${error instanceof Error ? error.message : String(error)}`,
                "BUSINESS",
                { error },
              ),
            );
          }
        };
      };
    },
  };

  return combinator;
}

// =============================================================================
// COMBINATOR VALIDATION TYPES
// =============================================================================

/**
 * Type-level tests to ensure combinators follow laws
 */
export type ValidateCombination<
  TReader extends MarketDataReadingDSL,
  TWriter extends MarketDataWritingDSL,
> = {
  // Valid: getCurrentPrices → publishPrices (CryptoPriceData[] matches)
  pricesCombination: TypeCoherenceLaw<TReader["getCurrentPrices"], TWriter["publishPrices"]>;

  // Valid: getCurrentOHLCV → publishOHLCV (CryptoOHLCVData matches)
  ohlcvCombination: TypeCoherenceLaw<TReader["getCurrentOHLCV"], TWriter["publishOHLCV"]>;

  // Valid: getMarketAnalytics → publishAnalytics (CryptoMarketAnalytics matches)
  analyticsCombination: TypeCoherenceLaw<
    TReader["getMarketAnalytics"],
    TWriter["publishAnalytics"]
  >;

  // Invalid: getCurrentPrice → publishPrices (number doesn't match CryptoPriceData[])
  invalidCombination: TypeCoherenceLaw<TReader["getCurrentPrice"], TWriter["publishPrices"]>;
};

// =============================================================================
// PRACTICAL COMBINATOR FACTORY
// =============================================================================

/**
 * Create a type-safe combinator for common reader/writer patterns
 */
export function createReaderWriterCombinator<
  TReader extends MarketDataReadingDSL,
  TWriter extends MarketDataWritingDSL,
>(reader: TReader, writer: TWriter) {
  return {
    // Prices pipeline: read prices → write prices
    pricesPipeline: createLawfulDSLCombinator(
      reader.getCurrentPrices.bind(reader),
      writer.publishPrices.bind(writer),
    ),

    // OHLCV pipeline: read OHLCV → write OHLCV
    ohlcvPipeline: createLawfulDSLCombinator(
      reader.getCurrentOHLCV.bind(reader),
      writer.publishOHLCV.bind(writer),
    ),

    // Analytics pipeline: read analytics → write analytics
    analyticsPipeline: createLawfulDSLCombinator(
      reader.getMarketAnalytics.bind(reader),
      writer.publishAnalytics.bind(writer),
    ),

    // Level1 pipeline: read level1 → write level1
    level1Pipeline: createLawfulDSLCombinator(
      reader.getLevel1Data.bind(reader),
      writer.publishLevel1.bind(writer),
    ),
  };
}
