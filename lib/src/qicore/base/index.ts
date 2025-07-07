/**
 * QiCore v4.0 Base Components
 *
 * Clean fp-ts-based implementation following QiCore v4 TypeScript template.
 * Exports foundational types and operations with proven mathematical properties.
 */

// ============================================================================
// Result Type and Operations (fp-ts Either-based)
// ============================================================================

export type { Either, Left, Result as ResultType, Right } from "./result.js";
// Core factory functions
// Functor operations
// Monad operations
// Applicative operations
// Alternative operations
// Extraction operations
// Pattern matching
// Collection operations
// Query operations
// Complete API and alternative names
export {
  alt,
  ap,
  bimap,
  chain,
  chainFirst,
  failure,
  flatMap,
  fold,
  fromAsyncTryCatch,
  fromMaybe,
  fromPredicate,
  fromTryCatch,
  getData,
  getError,
  isFailure,
  isSuccess,
  liftA2,
  map,
  mapError,
  match,
  orElse,
  QiResult,
  ResultImpl,
  ResultOps,
  sequence,
  success,
  traverse,
  unwrap,
  unwrapOr,
  unwrapOrElse,
} from "./result.js";

// ============================================================================
// Error Types and Operations
// ============================================================================

export type {
  ErrorCategory,
  ErrorData,
  ErrorSeverity,
  QiError,
  RetryStrategy,
} from "./error.js";

export {
  aggregate,
  CommonErrors,
  chain as chainError,
  createQiError,
  fromException,
  fromString,
  getRetryStrategy,
  isQiError,
  isRetryable,
  withCause,
  withContext,
  withSeverity,
} from "./error.js";

// ============================================================================
// Complete Base API Object
// ============================================================================

import {
  CommonErrors as errorCommonErrors,
  createQiError as errorCreate,
  fromException as errorFromException,
  fromString as errorFromString,
  isQiError as errorIsQiError,
  isRetryable as errorIsRetryable,
  withCause as errorWithCause,
  withContext as errorWithContext,
} from "./error.js";
// Import functions for API object construction
import {
  chain as resultChain,
  failure as resultFailure,
  flatMap as resultFlatMap,
  fromAsyncTryCatch as resultFromAsyncTryCatch,
  fromMaybe as resultFromMaybe,
  fromPredicate as resultFromPredicate,
  fromTryCatch as resultFromTryCatch,
  isFailure as resultIsFailure,
  isSuccess as resultIsSuccess,
  map as resultMap,
  match as resultMatch,
  sequence as resultSequence,
  success as resultSuccess,
} from "./result.js";

/**
 * Complete QiCore Base API
 *
 * Provides both individual function exports and organized API objects
 * for different usage patterns.
 */
export const QiBase = {
  Result: {
    // Core construction
    success: resultSuccess,
    failure: resultFailure,
    fromTryCatch: resultFromTryCatch,
    fromAsyncTryCatch: resultFromAsyncTryCatch,
    fromMaybe: resultFromMaybe,
    fromPredicate: resultFromPredicate,

    // Core operations
    map: resultMap,
    flatMap: resultFlatMap,
    chain: resultChain,
    match: resultMatch,
    sequence: resultSequence,

    // Query operations
    isSuccess: resultIsSuccess,
    isFailure: resultIsFailure,
  },
  Error: {
    // Construction
    create: errorCreate,
    fromException: errorFromException,
    fromString: errorFromString,

    // Utilities
    withContext: errorWithContext,
    withCause: errorWithCause,
    CommonErrors: errorCommonErrors,
    isRetryable: errorIsRetryable,
    isQiError: errorIsQiError,
  },
} as const;
