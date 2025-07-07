/**
 * QiCore v4.0 Base Result Implementation
 *
 * Clean fp-ts Either<QiError, T> approach following QiCore v4 TypeScript template.
 * Result is defined directly as fp-ts Either for maximum compatibility and performance.
 *
 * Mathematical Contracts:
 * - Monad Laws: Left identity, right identity, associativity ✅ (fp-ts proven)
 * - Functor Laws: Identity, composition ✅ (fp-ts proven)
 * - Performance: < 100μs per operation (TypeScript interpreted tier)
 *
 * Based on: QiCore v4.0 TypeScript Template (qi.v4.ts.template.md)
 * Implements: Result<T> = Either<QiError, T>
 */

import { type Either, isLeft, isRight, left, right } from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import { type QiError, createQiError } from "./error.js";

// ============================================================================
// Core Type Definition
// ============================================================================

/**
 * Result<T> type - Direct fp-ts Either for maximum compatibility
 *
 * This is the foundational type for all operations in QiCore.
 * Uses fp-ts Either<QiError, T> directly for proven mathematical properties.
 */
export type Result<T> = Either<QiError, T>;

// Re-export fp-ts types for convenience
export type { Either } from "fp-ts/Either";
export type Left<E> = { _tag: "Left"; left: E };
export type Right<A> = { _tag: "Right"; right: A };

// ============================================================================
// Factory Functions (Monad Return/Unit)
// ============================================================================

/**
 * Create a successful result (Monad return/η)
 *
 * @example
 * ```typescript
 * const result = success(42);
 * // result: Right(42)
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const success = <T>(data: T): Result<T> => right(data);

/**
 * Create a failed result
 *
 * @example
 * ```typescript
 * const result = failure(myError);
 * // result: Left(myError)
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const failure = <T>(error: QiError): Result<T> => left(error);

/**
 * Safely execute synchronous operation, converting exceptions to Result
 *
 * @example
 * ```typescript
 * const result = fromTryCatch(() => JSON.parse(input));
 * ```
 *
 * Performance: < 100μs (includes exception handling overhead)
 */
export const fromTryCatch = <T>(operation: () => T): Result<T> => {
  try {
    const result = operation();
    return right(result);
  } catch (error) {
    const qiError =
      error instanceof Error
        ? createQiError("OPERATION_FAILED", error.message, "UNKNOWN", {
            name: error.name,
            stack: error.stack,
          })
        : createQiError("OPERATION_FAILED", String(error), "UNKNOWN");
    return left(qiError);
  }
};

/**
 * Safely execute async operation, converting exceptions to Result
 *
 * @example
 * ```typescript
 * const result = await fromAsyncTryCatch(async () => {
 *   return await fetch('/api/data');
 * });
 * ```
 *
 * Performance: < 200μs (includes exception handling overhead)
 */
export const fromAsyncTryCatch = async <T>(operation: () => Promise<T>): Promise<Result<T>> => {
  try {
    const result = await operation();
    return right(result);
  } catch (error) {
    const qiError =
      error instanceof Error
        ? createQiError("ASYNC_OPERATION_FAILED", error.message, "UNKNOWN", {
            name: error.name,
            stack: error.stack,
          })
        : createQiError("ASYNC_OPERATION_FAILED", String(error), "UNKNOWN");
    return left(qiError);
  }
};

/**
 * Convert nullable values to Result with default error
 *
 * @example
 * ```typescript
 * const result = fromMaybe(defaultError, possiblyNull);
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const fromMaybe = <T>(defaultError: QiError, value: T | null | undefined): Result<T> =>
  value != null ? right(value) : left(defaultError);

/**
 * Convert predicate result to Result
 *
 * @example
 * ```typescript
 * const result = fromPredicate(
 *   (x) => x > 0,
 *   positiveError,
 *   42
 * );
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const fromPredicate = <T>(
  predicate: (value: T) => boolean,
  onFalse: QiError,
  value: T,
): Result<T> => (predicate(value) ? right(value) : left(onFalse));

// ============================================================================
// Functor Operations (map)
// ============================================================================

/**
 * Transform success value while preserving failures (Functor map)
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   success(42),
 *   map((x) => x * 2)
 * );
 * // result: Right(84)
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const map =
  <T, U>(fn: (value: T) => U) =>
  (result: Result<T>): Result<U> =>
    pipe(result, (r) => (isRight(r) ? right(fn(r.right)) : r));

/**
 * Transform error while preserving success values
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   failure(originalError),
 *   mapError((err) => enhanceError(err))
 * );
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const mapError =
  <T>(transform: (error: QiError) => QiError) =>
  (result: Result<T>): Result<T> =>
    pipe(result, (r) => (isLeft(r) ? left(transform(r.left)) : r));

/**
 * Map both success and error cases simultaneously (Bifunctor bimap)
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   someResult,
 *   bimap(
 *     (error) => enhanceError(error),
 *     (value) => transformValue(value)
 *   )
 * );
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const bimap =
  <T, U>(errorTransform: (error: QiError) => QiError, successTransform: (value: T) => U) =>
  (result: Result<T>): Result<U> =>
    pipe(result, (r) =>
      isRight(r) ? right(successTransform(r.right)) : left(errorTransform(r.left)),
    );

// ============================================================================
// Monad Operations (flatMap/chain)
// ============================================================================

/**
 * Chain operations that return Results (Monad bind)
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   success(42),
 *   flatMap((x) => x > 0 ? success(x * 2) : failure(negativeError))
 * );
 * ```
 *
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const flatMap =
  <T, U>(fn: (value: T) => Result<U>) =>
  (result: Result<T>): Result<U> =>
    pipe(result, (r) => (isRight(r) ? fn(r.right) : r));

/**
 * Alias for flatMap (more intuitive naming)
 */
export const chain = flatMap;

/**
 * Execute chained operation but return original value on success
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   success(42),
 *   chainFirst((x) => logValue(x)) // Returns Result<void>
 * );
 * // result: Right(42) if logValue succeeds
 * ```
 *
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const chainFirst =
  <T, U>(operation: (value: T) => Result<U>) =>
  (result: Result<T>): Result<T> =>
    pipe(
      result,
      flatMap((value) =>
        pipe(
          operation(value),
          map(() => value),
        ),
      ),
    );

// ============================================================================
// Applicative Operations
// ============================================================================

/**
 * Apply a function wrapped in Result to a value wrapped in Result
 *
 * @example
 * ```typescript
 * const add = (a: number) => (b: number) => a + b;
 * const result = pipe(
 *   success(10),
 *   ap(success(add))
 * );
 * // Then apply to second value...
 * ```
 *
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const ap =
  <T, U>(result: Result<T>) =>
  (wrappedFunction: Result<(value: T) => U>): Result<U> =>
    pipe(
      wrappedFunction,
      flatMap((fn) => pipe(result, map(fn))),
    );

/**
 * Lift a binary function to work on Results
 *
 * @example
 * ```typescript
 * const add = (a: number, b: number) => a + b;
 * const result = liftA2(add)(success(10))(success(20));
 * // result: Right(30)
 * ```
 *
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const liftA2 =
  <T, U, V>(binaryFunction: (a: T, b: U) => V) =>
  (resultA: Result<T>) =>
  (resultB: Result<U>): Result<V> => {
    if (isRight(resultA) && isRight(resultB)) {
      return right(binaryFunction(resultA.right, resultB.right));
    }
    // Return the first error encountered
    if (isLeft(resultA)) {
      return left(resultA.left);
    }
    return left((resultB as Left<QiError>).left);
  };

// ============================================================================
// Alternative Operations
// ============================================================================

/**
 * Choose first successful result, fallback to second on failure
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   failure(primaryError),
 *   alt(success(fallbackValue))
 * );
 * // result: Right(fallbackValue)
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const alt =
  <T>(alternative: Result<T>) =>
  (result: Result<T>): Result<T> =>
    isRight(result) ? result : alternative;

/**
 * Error recovery with alternative computation
 *
 * @example
 * ```typescript
 * const result = pipe(
 *   failure(originalError),
 *   orElse((error) => tryAlternative(error))
 * );
 * ```
 *
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const orElse =
  <T>(alternativeFunction: (error: QiError) => Result<T>) =>
  (result: Result<T>): Result<T> =>
    isRight(result) ? result : alternativeFunction(result.left);

// ============================================================================
// Extraction Operations
// ============================================================================

/**
 * Extract value or throw error (unsafe)
 *
 * @example
 * ```typescript
 * const value = unwrap(success(42)); // 42
 * const error = unwrap(failure(err)); // throws
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const unwrap = <T>(result: Result<T>): T => {
  if (isRight(result)) {
    return result.right;
  }
  throw new Error(`Result unwrap failed: ${result.left.message}`);
};

/**
 * Extract value or return default
 *
 * @example
 * ```typescript
 * const value = unwrapOr("default")(success("hello")); // "hello"
 * const defaulted = unwrapOr("default")(failure(err)); // "default"
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const unwrapOr =
  <T>(defaultValue: T) =>
  (result: Result<T>): T =>
    isRight(result) ? result.right : defaultValue;

/**
 * Extract value or compute default from error
 *
 * @example
 * ```typescript
 * const value = pipe(
 *   someResult,
 *   unwrapOrElse((error) => `Error: ${error.message}`)
 * );
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const unwrapOrElse =
  <T>(computeDefault: (error: QiError) => T) =>
  (result: Result<T>): T =>
    isRight(result) ? result.right : computeDefault(result.left);

// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Pattern match on success and error cases
 *
 * @example
 * ```typescript
 * const message = match(
 *   (value) => `Success: ${value}`,
 *   (error) => `Error: ${error.message}`
 * )(someResult);
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const match =
  <T, R>(onSuccess: (value: T) => R, onError: (error: QiError) => R) =>
  (result: Result<T>): R =>
    isRight(result) ? onSuccess(result.right) : onError(result.left);

/**
 * Fold/catamorphism with error case first (conventional order)
 *
 * @example
 * ```typescript
 * const message = fold(
 *   (error) => `Error: ${error.message}`,
 *   (value) => `Success: ${value}`
 * )(someResult);
 * ```
 *
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const fold =
  <T, R>(onError: (error: QiError) => R, onSuccess: (value: T) => R) =>
  (result: Result<T>): R =>
    isRight(result) ? onSuccess(result.right) : onError(result.left);

// ============================================================================
// Collection Operations
// ============================================================================

/**
 * Convert array of Results to Result of array
 *
 * @example
 * ```typescript
 * const results = [success(1), success(2), success(3)];
 * const combined = sequence(results);
 * // combined: Right([1, 2, 3])
 * ```
 *
 * Performance: O(n) where n = length of array
 */
export const sequence = <T>(results: readonly Result<T>[]): Result<T[]> => {
  const values: T[] = [];
  for (const result of results) {
    if (isRight(result)) {
      values.push(result.right);
    } else {
      return result; // Fail fast
    }
  }
  return right(values);
};

/**
 * Map and sequence in one operation
 *
 * @example
 * ```typescript
 * const numbers = [1, 2, 3];
 * const results = traverse((x) =>
 *   x > 0 ? success(x * 2) : failure(negativeError)
 * )(numbers);
 * // results: Right([2, 4, 6])
 * ```
 *
 * Performance: O(n) where n = length of array
 */
export const traverse =
  <T, U>(transform: (value: T) => Result<U>) =>
  (values: readonly T[]): Result<U[]> =>
    sequence(values.map(transform));

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Check if result is a success
 *
 * @example
 * ```typescript
 * if (isSuccess(result)) {
 *   // TypeScript knows result is Right<T>
 *   console.log(result.right);
 * }
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const isSuccess = <T>(result: Result<T>): result is Right<T> => isRight(result);

/**
 * Check if result is a failure
 *
 * @example
 * ```typescript
 * if (isFailure(result)) {
 *   // TypeScript knows result is Left<QiError>
 *   console.log(result.left.message);
 * }
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const isFailure = <T>(result: Result<T>): result is Left<QiError> => isLeft(result);

/**
 * Extract success value as Option
 *
 * @example
 * ```typescript
 * const value = getData(success(42)); // 42
 * const nothing = getData(failure(err)); // null
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const getData = <T>(result: Result<T>): T | null => (isRight(result) ? result.right : null);

/**
 * Extract error as Option
 *
 * @example
 * ```typescript
 * const noError = getError(success(42)); // null
 * const error = getError(failure(err)); // err
 * ```
 *
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const getError = <T>(result: Result<T>): QiError | null =>
  isLeft(result) ? result.left : null;

// ============================================================================
// Complete API Export (for compatibility)
// ============================================================================

/**
 * Complete Result API object
 *
 * Usage patterns:
 * - Functional: import { success, map, flatMap } from './result.js';
 * - Object-oriented: import { QiResult } from './result.js';
 * - Mixed: import what you need for each context
 */
export const QiResult = {
  success,
  failure,
  fromTryCatch,
  fromAsyncTryCatch,
  fromMaybe,
  fromPredicate,
  map,
  mapError,
  bimap,
  flatMap,
  chain,
  chainFirst,
  ap,
  liftA2,
  alt,
  orElse,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  match,
  fold,
  sequence,
  traverse,
  isSuccess,
  isFailure,
  getData,
  getError,
} as const;

// ============================================================================
// Alternative Exports for Different Usage Patterns
// ============================================================================

/**
 * Alternative names for common operations
 */
export const ResultOps = {
  // Monad operations
  andThen: flatMap,
  bind: flatMap,

  // Extraction operations
  getWithDefault: unwrapOr,
  caseOf: match,

  // Query operations
  isOk: isSuccess,
  isErr: isFailure,
} as const;

// Legacy compatibility - remove class implementation
export const ResultImpl = QiResult;

// ============================================================================
// Class-like Result Interface for Test Compatibility
// ============================================================================

/**
 * Result class interface that provides both static methods and instance methods
 * for compatibility with test expectations
 */
export class ResultClass<T> {
  private constructor(private readonly _either: Either<QiError, T>) {}

  /**
   * Create successful result - static method
   */
  static success<T>(value: T): ResultClass<T> {
    return new ResultClass(success(value));
  }

  /**
   * Create failed result - static method
   */
  static failure<T>(error: QiError): ResultClass<T> {
    return new ResultClass(failure(error));
  }

  /**
   * Check if result is successful - instance method
   */
  isSuccess(): boolean {
    return isSuccess(this._either);
  }

  /**
   * Check if result is failed - instance method
   */
  isFailure(): boolean {
    return isFailure(this._either);
  }

  /**
   * Unwrap the value - instance method
   */
  unwrap(): T {
    return unwrap(this._either);
  }

  /**
   * Map over the value - instance method
   */
  map<U>(fn: (value: T) => U): ResultClass<U> {
    return new ResultClass(map(fn)(this._either));
  }

  /**
   * FlatMap/chain operation - instance method
   */
  flatMap<U>(fn: (value: T) => ResultClass<U>): ResultClass<U> {
    return new ResultClass(flatMap((value: T) => fn(value)._either)(this._either));
  }

  /**
   * Get the underlying Either
   */
  get either(): Either<QiError, T> {
    return this._either;
  }

  /**
   * Get error - instance method
   */
  error(): QiError {
    if (isFailure(this._either)) {
      return this._either.left;
    }
    throw new Error("Cannot get error from successful result");
  }

  /**
   * Recover from error - instance method
   */
  recover(fn: () => T): ResultClass<T> {
    if (isFailure(this._either)) {
      return ResultClass.success(fn());
    }
    return this;
  }
}

// ResultClass available as named export
// Note: ResultClass can be imported directly if needed for test compatibility
