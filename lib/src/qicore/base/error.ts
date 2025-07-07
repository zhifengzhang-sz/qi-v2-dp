/**
 * QiCore v4.0 Base Component - Structured Error System
 *
 * Mathematical Foundation:
 * - Product Type: QiError = Code × Message × Category × Context × Cause × Timestamp
 * - Error Categories: Coproduct of 8 distinct categories
 * - Performance Tier: TypeScript (interpreted) = 100× baseline
 *
 * Derived from:
 * - Abstract Contract: Product type with context accumulation
 * - Concrete Specification: QiError from formal.spec.md
 * - Design Pattern: Builder pattern with immutable updates
 */

// ============================================================================
// Error Category System (Coproduct Type)
// ============================================================================

/**
 * Error Categories (Sum Type)
 * Mathematical Structure: ErrorCategory = ∑(i=1 to 8) Category_i
 */
export type ErrorCategory =
  | "VALIDATION" // Input constraint violations
  | "NETWORK" // Communication failures and timeouts
  | "SYSTEM" // Resource and infrastructure problems
  | "BUSINESS" // Domain rule violations
  | "SECURITY" // Authorization and authentication failures
  | "PARSING" // Data format and syntax errors
  | "TIMEOUT" // Operation time limit exceeded
  | "UNKNOWN"; // Unclassified or unexpected errors

/**
 * Severity Levels (Ordered)
 * Mathematical Structure: TRACE < DEBUG < INFO < WARN < ERROR < FATAL
 */
export type ErrorSeverity =
  | "LOW" // Minor issues, degraded performance
  | "MEDIUM" // Significant issues, partial functionality lost
  | "HIGH" // Critical issues, major functionality lost
  | "CRITICAL"; // System-threatening issues

// ============================================================================
// Core QiError Type (Product Type)
// ============================================================================

/**
 * QiError represents structured error information
 *
 * Mathematical Structure:
 * QiError = Code × Message × Category × Context × Cause × Timestamp
 *
 * Performance: Error creation < 100μs (TypeScript interpreted tier)
 */
export interface QiError {
  readonly code: string;
  readonly message: string;
  readonly category: ErrorCategory;
  readonly context: ReadonlyMap<string, unknown>;
  readonly cause: QiError | null;
  readonly timestamp: number;
  readonly severity: ErrorSeverity;

  // Methods for structured operations
  toString(): string;
  toStructuredData(): ErrorData;
  getCategory(): ErrorCategory;
  getSeverity(): ErrorSeverity;
  getRootCause(): QiError;
  getErrorChain(): QiError[];
}

/**
 * Serializable error data structure
 */
export interface ErrorData {
  readonly code: string;
  readonly message: string;
  readonly category: ErrorCategory;
  readonly context: Record<string, unknown>;
  readonly cause: ErrorData | null;
  readonly timestamp: number;
  readonly severity: ErrorSeverity;
}

// ============================================================================
// QiError Implementation
// ============================================================================

class QiErrorImpl implements QiError {
  constructor(
    readonly code: string,
    readonly message: string,
    readonly category: ErrorCategory,
    readonly context: ReadonlyMap<string, unknown>,
    readonly cause: QiError | null,
    readonly timestamp: number,
    readonly severity: ErrorSeverity,
  ) {}

  /**
   * toString: QiError → String
   * Lazy string formatting with template-based approach
   * Performance: < 500μs (TypeScript interpreted tier)
   */
  toString(): string {
    const contextStr =
      this.context.size > 0
        ? ` [${Array.from(this.context.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}]`
        : "";

    const causeStr = this.cause ? ` (caused by: ${this.cause.code})` : "";

    return `[${this.category}:${this.severity}] ${this.code}: ${this.message}${contextStr}${causeStr}`;
  }

  /**
   * toStructuredData: QiError → ErrorData
   * Convert to serializable structure
   * Performance: < 1ms (TypeScript interpreted tier)
   */
  toStructuredData(): ErrorData {
    return {
      code: this.code,
      message: this.message,
      category: this.category,
      context: Object.fromEntries(this.context),
      cause: this.cause?.toStructuredData() ?? null,
      timestamp: this.timestamp,
      severity: this.severity,
    };
  }

  /**
   * getCategory: QiError → ErrorCategory
   * Direct field access
   * Performance: < 1μs (TypeScript interpreted tier)
   */
  getCategory(): ErrorCategory {
    return this.category;
  }

  /**
   * getSeverity: QiError → ErrorSeverity
   * Direct field access
   * Performance: < 1μs (TypeScript interpreted tier)
   */
  getSeverity(): ErrorSeverity {
    return this.severity;
  }

  /**
   * getRootCause: QiError → QiError
   * Traverse cause chain to find root cause
   * Performance: O(chain_length) < 10μs typical
   */
  getRootCause(): QiError {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: QiError = this;
    while (current.cause !== null) {
      current = current.cause;
    }
    return current;
  }

  /**
   * getErrorChain: QiError → QiError[]
   * Get complete error chain from root to current
   * Performance: O(chain_length) < 50μs typical
   */
  getErrorChain(): QiError[] {
    const chain: QiError[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: QiError | null = this;

    while (current !== null) {
      chain.unshift(current); // Add to beginning to get root-to-current order
      current = current.cause;
    }

    return chain;
  }
}

// ============================================================================
// Factory Functions (Construction)
// ============================================================================

/**
 * create: (Code, Message, Category, Context?, Cause?, Severity?) → QiError
 * Primary factory function for QiError creation
 * Performance: < 100μs (TypeScript interpreted tier)
 */
export const create = (
  code: string,
  message: string,
  category: ErrorCategory,
  context?: Record<string, unknown> | null,
  cause?: QiError | null,
  severity?: ErrorSeverity,
): QiError => {
  const contextMap = context ? new Map(Object.entries(context)) : new Map<string, unknown>();
  const inferredSeverity = severity ?? inferSeverityFromCategory(category);

  return new QiErrorImpl(
    code,
    message,
    category,
    contextMap,
    cause ?? null,
    Date.now(),
    inferredSeverity,
  );
};

/**
 * fromException: (Error, Category?) → QiError
 * Convert JavaScript Error to QiError
 * Performance: < 200μs (includes stack trace processing)
 */
export const fromException = (error: Error, category: ErrorCategory = "UNKNOWN"): QiError =>
  create(
    error.name ?? "UNKNOWN_EXCEPTION",
    error.message ?? "Unknown error occurred",
    category,
    {
      name: error.name,
      stack: error.stack,
      originalError: error.constructor.name,
    },
    null,
    "HIGH", // Exceptions are generally high severity
  );

/**
 * fromString: (string, Category?) → QiError
 * Create QiError from simple string message
 * Performance: < 50μs (TypeScript interpreted tier)
 */
export const fromString = (message: string, category: ErrorCategory = "UNKNOWN"): QiError =>
  create("STRING_ERROR", message, category);

// ============================================================================
// Immutable Update Operations
// ============================================================================

/**
 * withContext: (QiError, Context) → QiError
 * Immutable update with context merge (union operation)
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const withContext = (
  error: QiError,
  additionalContext: Record<string, unknown>,
): QiError => {
  const newContext = new Map(error.context);
  for (const [key, value] of Object.entries(additionalContext)) {
    newContext.set(key, value);
  }

  return new QiErrorImpl(
    error.code,
    error.message,
    error.category,
    newContext,
    error.cause,
    error.timestamp,
    error.severity,
  );
};

/**
 * withCause: (QiError, QiError) → QiError
 * Immutable update with cause chaining
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const withCause = (error: QiError, cause: QiError): QiError =>
  new QiErrorImpl(
    error.code,
    error.message,
    error.category,
    error.context,
    cause,
    error.timestamp,
    error.severity,
  );

/**
 * withSeverity: (QiError, ErrorSeverity) → QiError
 * Immutable update with severity change
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const withSeverity = (error: QiError, severity: ErrorSeverity): QiError =>
  new QiErrorImpl(
    error.code,
    error.message,
    error.category,
    error.context,
    error.cause,
    error.timestamp,
    severity,
  );

/**
 * chain: (QiError, QiError) → QiError
 * Chain two errors (second becomes cause of first)
 * Performance: < 10μs (TypeScript interpreted tier)
 */
export const chain = (primary: QiError, secondary: QiError): QiError =>
  withCause(primary, secondary);

// ============================================================================
// Error Aggregation and Analysis
// ============================================================================

/**
 * aggregate: QiError[] → QiError
 * Combine multiple errors into single aggregated error
 * Uses highest severity and accumulates all contexts
 * Performance: O(n) where n = number of errors
 */
export const aggregate = (errors: readonly QiError[]): QiError => {
  if (errors.length === 0) {
    return create("NO_ERRORS", "Empty error list provided", "VALIDATION");
  }

  if (errors.length === 1) {
    return errors[0];
  }

  // Find highest severity
  const maxSeverity = errors.reduce(
    (max, error) => (compareSeverity(error.severity, max) > 0 ? error.severity : max),
    "LOW" as ErrorSeverity,
  );

  // Aggregate contexts
  const aggregatedContext = new Map<string, unknown>();
  errors.forEach((error, index) => {
    error.context.forEach((value, key) => {
      aggregatedContext.set(`error_${index}_${key}`, value);
    });
  });

  // Use first error as primary, rest as context
  const [primary] = errors;

  return new QiErrorImpl(
    "AGGREGATED_ERRORS",
    `Multiple errors occurred: ${errors.map((e) => e.code).join(", ")}`,
    primary.category,
    aggregatedContext,
    primary.cause,
    Date.now(),
    maxSeverity,
  );
};

// ============================================================================
// Error Category Utilities
// ============================================================================

/**
 * isRetryable: ErrorCategory → boolean
 * Determine if error category suggests retry might succeed
 */
export const isRetryable = (category: ErrorCategory): boolean => {
  switch (category) {
    case "NETWORK":
    case "TIMEOUT":
    case "SYSTEM":
      return true;
    case "VALIDATION":
    case "BUSINESS":
    case "SECURITY":
    case "PARSING":
    case "UNKNOWN":
      return false;
    default:
      return false;
  }
};

/**
 * getRetryStrategy: ErrorCategory → RetryStrategy
 * Get recommended retry strategy for error category
 */
export interface RetryStrategy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly exponentialBackoff: boolean;
}

export const getRetryStrategy = (category: ErrorCategory): RetryStrategy => {
  switch (category) {
    case "NETWORK":
      return {
        maxAttempts: 3,
        baseDelayMs: 100,
        maxDelayMs: 5000,
        exponentialBackoff: true,
      };
    case "TIMEOUT":
      return {
        maxAttempts: 2,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        exponentialBackoff: true,
      };
    case "SYSTEM":
      return {
        maxAttempts: 2,
        baseDelayMs: 500,
        maxDelayMs: 2000,
        exponentialBackoff: false,
      };
    case "VALIDATION":
    case "BUSINESS":
    case "SECURITY":
    case "PARSING":
    case "UNKNOWN":
      return {
        maxAttempts: 0,
        baseDelayMs: 0,
        maxDelayMs: 0,
        exponentialBackoff: false,
      };
    default:
      return {
        maxAttempts: 0,
        baseDelayMs: 0,
        maxDelayMs: 0,
        exponentialBackoff: false,
      };
  }
};

// ============================================================================
// Severity Utilities
// ============================================================================

/**
 * compareSeverity: (ErrorSeverity, ErrorSeverity) → number
 * Compare two severity levels (-1, 0, 1)
 */
const compareSeverity = (a: ErrorSeverity, b: ErrorSeverity): number => {
  const order: Record<ErrorSeverity, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  return order[a] - order[b];
};

/**
 * inferSeverityFromCategory: ErrorCategory → ErrorSeverity
 * Infer default severity based on error category
 */
const inferSeverityFromCategory = (category: ErrorCategory): ErrorSeverity => {
  switch (category) {
    case "VALIDATION":
    case "PARSING":
      return "LOW";
    case "BUSINESS":
    case "TIMEOUT":
      return "MEDIUM";
    case "NETWORK":
    case "SYSTEM":
      return "HIGH";
    case "SECURITY":
    case "UNKNOWN":
      return "CRITICAL";
    default:
      return "MEDIUM";
  }
};

// ============================================================================
// Common Error Constructors
// ============================================================================

/**
 * Common error patterns for frequent use cases
 */
export const CommonErrors = {
  validation: (message: string, context?: Record<string, unknown>) =>
    create("VALIDATION_ERROR", message, "VALIDATION", context),

  network: (message: string, context?: Record<string, unknown>) =>
    create("NETWORK_ERROR", message, "NETWORK", context),

  timeout: (message: string, timeoutMs: number, context?: Record<string, unknown>) =>
    create("TIMEOUT_ERROR", message, "TIMEOUT", { timeoutMs, ...context }),

  notFound: (resource: string, context?: Record<string, unknown>) =>
    create("NOT_FOUND", `Resource not found: ${resource}`, "BUSINESS", { resource, ...context }),

  unauthorized: (message: string, context?: Record<string, unknown>) =>
    create("UNAUTHORIZED", message, "SECURITY", context),

  forbidden: (message: string, context?: Record<string, unknown>) =>
    create("FORBIDDEN", message, "SECURITY", context),

  conflict: (message: string, context?: Record<string, unknown>) =>
    create("CONFLICT", message, "BUSINESS", context),

  rateLimit: (message: string, retryAfterMs?: number, context?: Record<string, unknown>) =>
    create("RATE_LIMIT_EXCEEDED", message, "NETWORK", { retryAfterMs, ...context }),

  unknown: (message: string, context?: Record<string, unknown>) =>
    create("UNKNOWN_ERROR", message, "UNKNOWN", context),
} as const;

// ============================================================================
// Type Guards and Validation
// ============================================================================

/**
 * isQiError: unknown → boolean
 * Type guard for QiError interface
 */
export const isQiError = (value: unknown): value is QiError =>
  typeof value === "object" &&
  value !== null &&
  "code" in value &&
  "message" in value &&
  "category" in value &&
  "context" in value &&
  "timestamp" in value &&
  "severity" in value &&
  typeof (value as Record<string, unknown>).code === "string" &&
  typeof (value as Record<string, unknown>).message === "string" &&
  isValidCategory((value as Record<string, unknown>).category) &&
  typeof (value as Record<string, unknown>).timestamp === "number" &&
  isValidSeverity((value as Record<string, unknown>).severity);

/**
 * isValidCategory: unknown → boolean
 * Validate error category
 */
const isValidCategory = (value: unknown): value is ErrorCategory =>
  typeof value === "string" &&
  [
    "VALIDATION",
    "NETWORK",
    "SYSTEM",
    "BUSINESS",
    "SECURITY",
    "PARSING",
    "TIMEOUT",
    "UNKNOWN",
  ].includes(value);

/**
 * isValidSeverity: unknown → boolean
 * Validate error severity
 */
const isValidSeverity = (value: unknown): value is ErrorSeverity =>
  typeof value === "string" && ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(value);

// ============================================================================
// Export Aliases for Compatibility
// ============================================================================

/**
 * Complete QiError API following QiCore v4 mathematical specification
 */
export const QiError = {
  // Factory functions
  create,
  fromException,
  fromString,

  // Immutable updates
  withContext,
  withCause,
  withSeverity,
  chain,

  // Aggregation
  aggregate,

  // Utilities
  isRetryable,
  getRetryStrategy,

  // Type guards
  isQiError,

  // Common patterns
  ...CommonErrors,
} as const;

// Re-export main factory function for convenience
export { create as createQiError };

// ============================================================================
// Default Export for Module
// ============================================================================

export default QiError;
