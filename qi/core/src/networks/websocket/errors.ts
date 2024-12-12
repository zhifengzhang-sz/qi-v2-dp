/**
 * @fileoverview
 * @module errors.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/errors.ts
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import {
  HttpStatusCode,
  NetworkErrorContext,
  mapWebSocketErrorToStatus,
} from "../errors.js";

/**
 * Creates a WebSocket specific error with additional context
 */
export function createWebSocketError(
  message: string,
  context?: NetworkErrorContext
): ApplicationError {
  return new ApplicationError(
    message,
    ErrorCode.WEBSOCKET_ERROR,
    HttpStatusCode.SERVICE_UNAVAILABLE,
    context
  );
}

/**
 * Transforms WebSocket errors into application errors
 */
export function transformWebSocketError(
  error: unknown,
  context?: NetworkErrorContext
): ApplicationError {
  const status = mapWebSocketErrorToStatus(error);
  const errorCode =
    status === HttpStatusCode.GATEWAY_TIMEOUT
      ? ErrorCode.TIMEOUT_ERROR
      : ErrorCode.WEBSOCKET_ERROR;

  return new ApplicationError("WebSocket operation failed", errorCode, status, {
    ...context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
