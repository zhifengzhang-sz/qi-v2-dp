/**
 * @fileoverview WebSocket state machine actions
 * @module @qi/core/network/websocket/actions
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

import { ApplicationError, ErrorCode, StatusCode } from "@qi/core/errors";
import { WebSocketContext, WebSocketEvent } from "./types.js";
import { NetworkErrorContext } from "@qi/core/networks/errors";
import { calculateBackoff } from "./utils.js";
import { mapTransitionCloseCodeToError } from "./transitions.js";
import { ErrorSeverity } from "./errors.js";

/**
 * WebSocket specific error class
 */
class WebSocketError extends Error {
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;

  constructor({
    code,
    message,
    severity,
    metadata,
  }: {
    code: ErrorCode;
    message: string;
    severity: ErrorSeverity;
    metadata?: Record<string, unknown>;
  }) {
    super(message);
    this.name = "WebSocketError";
    this.code = code;
    this.severity = severity;
    this.timestamp = Date.now();
    this.metadata = metadata;
  }
}

/**
 * Creates a WebSocket error with context
 */
export function createWebSocketError(
  code: ErrorCode,
  message: string,
  severity: ErrorSeverity,
  metadata?: Record<string, unknown>
): WebSocketError {
  return new WebSocketError({
    code,
    message,
    severity,
    metadata,
  });
}

/**
 * Type-safe action implementations for XState v5
 */
export const actions = {
  initConnection: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "CONNECT" }>;
  }) => ({
    url: event.url,
    socket: null,
    error: null,
    retryCount: 0,
    timing: {
      ...context.timing,
      connectStart: Date.now(),
      connectEnd: null,
    },
  }),

  onConnected: ({ context }: { context: WebSocketContext }) => ({
    timing: {
      ...context.timing,
      connectEnd: Date.now(),
      lastEventTime: Date.now(),
    },
    error: null,
    retryCount: 0,
    backoffDelay: 0,
  }),

  onError: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "ERROR" }>;
  }) => {
    const errorContext: NetworkErrorContext = {
      url: context.url || undefined,
      readyState: context.socket?.readyState,
      currentState: context.status,
      ...event.error,
    };

    const error = new ApplicationError(
      event.error.message || "WebSocket error",
      ErrorCode.WEBSOCKET_ERROR,
      StatusCode.INTERNAL_SERVER_ERROR,
      errorContext
    );

    return {
      error,
      metrics: {
        ...context.metrics,
        errors: [...context.metrics.errors, error],
        eventHistory: [
          ...context.metrics.eventHistory,
          {
            type: "ERROR",
            timestamp: Date.now(),
            metadata: { error: errorContext },
          },
        ],
      },
    };
  },

  cleanup: ({ context }: { context: WebSocketContext }) => {
    if (context.socket?.readyState === WebSocket.OPEN) {
      context.socket.close();
    }

    return {
      socket: null,
      error: null,
      messageFlags: {
        ...context.messageFlags,
        isProcessing: false,
        lastProcessedMessageId: null,
      },
    };
  },

  scheduleReconnect: ({ context }: { context: WebSocketContext }) => {
    const retryCount = context.retryCount + 1;
    const backoffDelay = calculateBackoff(
      retryCount,
      context.options.reconnectInterval
    );

    return {
      retryCount,
      backoffDelay,
      metrics: {
        ...context.metrics,
        eventHistory: [
          ...context.metrics.eventHistory,
          {
            type: "RETRY",
            timestamp: Date.now(),
            metadata: { attempt: retryCount, delay: backoffDelay },
          },
        ],
      },
    };
  },

  handleMessage: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "MESSAGE" }>;
  }) => {
    const messageId = crypto.randomUUID();
    const timestamp = Date.now();

    return {
      messageFlags: {
        ...context.messageFlags,
        isProcessing: true,
        lastProcessedMessageId: messageId,
        processingHistory: [
          ...context.messageFlags.processingHistory,
          { messageId, startTime: timestamp, status: "success" as const },
        ],
      },
      metrics: {
        ...context.metrics,
        messagesReceived: context.metrics.messagesReceived + 1,
        bytesReceived: context.metrics.bytesReceived + (event.size || 0),
        lastMessageTime: timestamp,
        eventHistory: [
          ...context.metrics.eventHistory,
          { type: "MESSAGE", timestamp, metadata: { size: event.size } },
        ],
      },
      timing: {
        ...context.timing,
        lastMessageTime: timestamp,
        lastEventTime: timestamp,
      },
    };
  },

  handleClose: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "CLOSE" }>;
  }) => {
    const { errorCode, statusCode, recoverable } =
      mapTransitionCloseCodeToError(event.code);

    const error = new ApplicationError(
      event.reason || `WebSocket closed with code ${event.code}`,
      errorCode,
      statusCode,
      {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        url: context.url || undefined,
        readyState: context.socket?.readyState,
        currentState: context.status,
      }
    );

    return {
      socket: null,
      error: recoverable ? error : null,
      metrics: {
        ...context.metrics,
        errors: recoverable
          ? [...context.metrics.errors, error]
          : context.metrics.errors,
        eventHistory: [
          ...context.metrics.eventHistory,
          {
            type: "CLOSE",
            timestamp: Date.now(),
            metadata: {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
              recoverable,
            },
          },
        ],
      },
    };
  },

  onMaxRetries: ({ context }: { context: WebSocketContext }) => ({
    error: new ApplicationError(
      "Maximum retry attempts exceeded",
      ErrorCode.WEBSOCKET_ERROR,
      StatusCode.SERVICE_UNAVAILABLE,
      { maxAttempts: context.options.maxReconnectAttempts }
    ),
    retryCount: 0,
    backoffDelay: 0,
  }),

  logTransition: ({ context }: { context: WebSocketContext }) => ({
    timing: {
      ...context.timing,
      lastEventTime: Date.now(),
      stateHistory: [
        ...context.timing.stateHistory,
        { state: context.status, timestamp: Date.now() },
      ],
    },
  }),
} as const;
