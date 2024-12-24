/**
 * @fileoverview Basic WebSocket error definitions
 * @module @qi/core/network/websocket/errors
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

/**
 * Basic error codes
 */
export const ERROR_CODES = {
  INVALID_URL: "INVALID_URL",
  CONNECTION_FAILED: "CONNECTION_FAILED",
  MESSAGE_FAILED: "MESSAGE_FAILED",
  TIMEOUT: "TIMEOUT",
  INVALID_STATE: "INVALID_STATE",
  PROTOCOL_ERROR: "PROTOCOL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type ErrorSeverity =
  (typeof ERROR_SEVERITY)[keyof typeof ERROR_SEVERITY];

/**
 * Basic error context
 */
export interface ErrorContext {
  readonly code: ErrorCode;
  readonly timestamp: number;
  readonly message: string;
  readonly severity?: ErrorSeverity;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Error recovery options
 */
export const ERROR_RECOVERY = {
  RETRY: "retry",
  RESET: "reset",
  TERMINATE: "terminate",
} as const;

export type ErrorRecovery =
  (typeof ERROR_RECOVERY)[keyof typeof ERROR_RECOVERY];
