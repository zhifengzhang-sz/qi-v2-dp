/**
 * @fileoverview WebSocket utility functions
 * @module @qi/core/network/websocket/utils
 */

import { logger } from "@qi/core/logger";
import { retryOperation, formatJsonWithColor } from "@qi/core/utils";
import { createNetworkError, HttpStatusCode, mapWebSocketErrorToStatus } from "../../errors.js";
import type { 
  WebSocketContext, 
  WebSocketErrorContext, 
  WebSocketError 
} from "./types.js";

export function createWebSocketError(
  message: string,
  originalError: Error,
  context: WebSocketErrorContext
): WebSocketError {
  const error = createNetworkError(
    message,
    mapWebSocketErrorToStatus(originalError),
    {
      ...context,
      error: originalError,
      readyState: context.socket?.readyState ?? WebSocket.CLOSED,
      timestamp: Date.now()
    }
  ) as WebSocketError;

  logger.error(`WebSocket Error: ${message}`, {
    error,
    context: formatJsonWithColor(context),
    stackTrace: originalError.stack
  });

  return error;
}

export function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: WebSocketContext
): Promise<T> {
  return retryOperation(
    operation,
    {
      retries: context.options.maxReconnectAttempts,
      minTimeout: context.options.reconnectInterval,
      onRetry: (attempt) => {
        logger.warn('Retrying WebSocket connection', {
          attempt,
          maxAttempts: context.options.maxReconnectAttempts,
          delay: context.options.reconnectInterval * Math.pow(2, attempt - 1)
        });
      }
    }
  );
}

export function isRecoverableError(error: WebSocketError): boolean {
  return error.statusCode !== HttpStatusCode.WEBSOCKET_POLICY_VIOLATION &&
         error.statusCode !== HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR;
}

export function calculateBackoffDelay(context: WebSocketContext): number {
  return Math.min(
    context.options.reconnectInterval * 
    Math.pow(context.options.reconnectBackoffRate, context.state.connectionAttempts),
    30000 // Maximum backoff delay
  );
}