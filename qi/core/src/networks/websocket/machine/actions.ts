/**
 * @fileoverview
 * @module actions.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-18
 */

import { logger } from "@qi/core/logger";
import type { WebSocketContext, WebSocketEvents } from "./types.js";

export function prepareConnection(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CONNECT" }>
): WebSocketContext {
  return {
    ...context,
    url: event.url,
    protocols: event.protocols || [],
    options: { ...context.options, ...event.options },
    state: {
      ...context.state,
      connectionAttempts: 0
    }
  };
}

export function handleOpen(context: WebSocketContext): WebSocketContext {
  logger.info("WebSocket connection established", {
    url: context.url,
    attempts: context.state.connectionAttempts
  });

  return {
    ...context,
    metrics: {
      ...context.metrics,
      consecutiveErrors: 0,
      lastSuccessfulConnection: Date.now()
    },
    state: {
      ...context.state,
      connectionAttempts: 0,
      lastConnectTime: Date.now(),
      lastError: null
    }
  };
}

export function handleError(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "ERROR" }>
): WebSocketContext {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      totalErrors: context.metrics.totalErrors + 1,
      consecutiveErrors: context.metrics.consecutiveErrors + 1,
      errors: [
        ...context.metrics.errors.slice(-99),
        {
          timestamp: Date.now(),
          error: event.error,
          attempt: context.state.connectionAttempts
        }
      ]
    },
    state: {
      ...context.state,
      lastError: event.error,
      lastErrorTime: Date.now()
    }
  };
}

export function handleMessage(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "MESSAGE" }>
): WebSocketContext {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      messagesReceived: context.metrics.messagesReceived + 1,
      bytesReceived: context.metrics.bytesReceived + 
        (typeof event.data === 'string' ? new Blob([event.data]).size : 0),
      messageTimestamps: [
        ...context.metrics.messageTimestamps.slice(-99),
        event.timestamp
      ]
    },
    state: {
      ...context.state,
      lastMessageTime: event.timestamp
    }
  };
}

export function enqueueMessage(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "SEND" }>
): WebSocketContext {
  if (context.queue.messages.length >= context.options.messageQueueSize) {
    logger.warn("Message queue full, dropping oldest message");
  }

  return {
    ...context,
    queue: {
      ...context.queue,
      messages: [
        ...(context.queue.messages.length >= context.options.messageQueueSize
          ? context.queue.messages.slice(1)
          : context.queue.messages),
        {
          id: event.id || crypto.randomUUID(),
          data: event.data,
          timestamp: Date.now(),
          attempts: 0,
          priority: event.options?.priority ?? "normal"
        }
      ]
    }
  };
}

export function handleClose(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CLOSE" }>
): WebSocketContext {
  logger.info("WebSocket connection closed", {
    code: event.code,
    reason: event.reason,
    wasClean: event.wasClean
  });

  return {
    ...context,
    state: {
      ...context.state,
      lastDisconnectTime: Date.now()
    }
  };
}

export function cleanup(context: WebSocketContext): WebSocketContext {
  return {
    ...context,
    socket: null,
    queue: {
      messages: [],
      pending: false,
      lastProcessed: 0
    }
  };
}

export const actions = {
  prepareConnection,
  handleOpen,
  handleError,
  handleMessage,
  enqueueMessage,
  handleClose,
  cleanup
};