/**
 * @fileoverview WebSocket state machine guards
 * @module @qi/core/network/websocket/guards
 */

import { logger } from "@qi/core/logger";
import { formatJsonWithColor } from "@qi/core/utils";
import type {
  WebSocketContext,
  WebSocketEvents,
  WebSocketError,
} from "./types.js";
import { isRecoverableError } from "./utils.js";

export function canInitiateConnection(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CONNECT" }>
): boolean {
  if (!event.url) {
    logger.error("Invalid WebSocket URL", { url: event.url });
    return false;
  }

  try {
    const url = new URL(event.url);
    const validProtocol = ["ws:", "wss:"].includes(url.protocol);
    const validState =
      !context.socket || context.socket.readyState === WebSocket.CLOSED;

    if (!validProtocol) {
      logger.error("Invalid WebSocket protocol", { protocol: url.protocol });
    }

    return validProtocol && validState;
  } catch (error) {
    logger.error("URL parsing failed", { error });
    return false;
  }
}

export function canReconnect(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "ERROR" }>
): boolean {
  if (!context.options.reconnect) {
    logger.debug("Reconnection disabled by configuration", {
      context: formatJsonWithColor(context.options),
    });
    return false;
  }

  if (
    context.state.connectionAttempts >= context.options.maxReconnectAttempts
  ) {
    logger.warn("Maximum reconnection attempts reached", {
      attempts: context.state.connectionAttempts,
      maxAttempts: context.options.maxReconnectAttempts,
    });
    return false;
  }

  const error = event.error as WebSocketError;
  const canRetry = isRecoverableError(error);

  logger.debug("Reconnection evaluation", {
    canRetry,
    error: error.message,
    attempts: context.state.connectionAttempts,
    consecutiveErrors: context.metrics.consecutiveErrors,
  });

  return canRetry;
}

export function shouldThrottle(context: WebSocketContext): boolean {
  const { consecutiveErrors } = context.metrics;
  const timeSinceLastError = Date.now() - (context.state.lastErrorTime || 0);
  const backoffDelay =
    context.options.reconnectInterval * Math.pow(2, consecutiveErrors - 3);

  const shouldThrottle =
    consecutiveErrors > 3 && timeSinceLastError < backoffDelay;

  if (shouldThrottle) {
    logger.warn("Connection attempts throttled", {
      consecutiveErrors,
      backoffDelay,
      timeSinceLastError,
    });
  }

  return shouldThrottle;
}

export function canSendMessage(context: WebSocketContext): boolean {
  if (!context.socket || context.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  const { window, messages: limit } = context.options.rateLimit;
  const now = Date.now();
  const recentMessages = context.metrics.messageTimestamps.filter(
    (t) => now - t <= window
  );

  return recentMessages.length < limit;
}

export function hasQueueSpace(context: WebSocketContext): boolean {
  return context.queue.messages.length < context.options.messageQueueSize;
}

export const guards = {
  canInitiateConnection,
  canReconnect,
  shouldThrottle,
  canSendMessage,
  hasQueueSpace
};
