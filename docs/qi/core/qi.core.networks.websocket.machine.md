# Project Source Code Documentation

## machine

### actions.ts

```typescript
/**
 * @fileoverview WebSocket state machine actions
 * @module @qi/core/network/websocket/actions
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
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

```

### constants.ts

```typescript
/**
 * @fileoverview WebSocket constants and configuration
 * @module @qi/core/network/websocket/constants
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
 */

/**
 * Core WebSocket states
 */
export const STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
  TERMINATED: "terminated",
} as const;

export type State = (typeof STATES)[keyof typeof STATES];

/**
 * Core WebSocket events
 */
export const EVENTS = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  ERROR: "ERROR",
  MESSAGE: "MESSAGE",
  SEND: "SEND",
  RETRY: "RETRY",
  MAX_RETRIES: "MAX_RETRIES",
  TERMINATE: "TERMINATE",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Basic configuration defaults
 */
export const BASE_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  messageQueueSize: 100,
  maxLatencyHistory: 50,
  maxEventHistory: 100,
  maxStateHistory: 200,
} as const;

export type BaseConfig = typeof BASE_CONFIG;

/**
 * WebSocket close codes
 */
export const CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  INVALID_DATA: 1003,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
  CONNECTION_FAILED: 1006,
} as const;

export type CloseCode = (typeof CLOSE_CODES)[keyof typeof CLOSE_CODES];

```

### errors.ts

```typescript
/**
 * @fileoverview Basic WebSocket error definitions
 * @module @qi/core/network/websocket/errors
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
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

```

### guards.ts

```typescript
/**
 * @fileoverview WebSocket state machine guards
 * @module @qi/core/network/websocket/guards
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
 */

import { WebSocketContext, WebSocketEvent } from "./types.js";
import { validateUrl } from "./utils.js";

/**
 * Type-safe guard implementations for XState v5
 */
export const guards = {
  canConnect: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "CONNECT" }>;
  }): boolean => {
    return context.socket === null && validateUrl(event.url).isValid;
  },

  isSocketValid: ({ context }: { context: WebSocketContext }): boolean => {
    return (
      context.socket !== null && context.socket.readyState === WebSocket.OPEN
    );
  },

  canRetry: ({ context }: { context: WebSocketContext }): boolean => {
    return (
      context.options.reconnect &&
      context.retryCount < context.options.maxReconnectAttempts
    );
  },

  hasValidUrl: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "CONNECT" | "RETRY" }>;
  }): boolean => {
    if (event.type === "CONNECT") {
      return validateUrl(event.url).isValid;
    }
    return context.url !== null && validateUrl(context.url).isValid;
  },

  isRateLimited: ({ context }: { context: WebSocketContext }): boolean => {
    const { rateLimit } = context;
    const now = Date.now();

    // Reset rate limit window if needed
    if (now - rateLimit.lastReset >= rateLimit.window) {
      return false;
    }

    return rateLimit.count >= rateLimit.maxBurst;
  },
} as const;

```

### services.ts

```typescript
/**
 * @fileoverview WebSocket state machine services for XState v5
 * @module @qi/core/network/websocket/services
 *
 * @author zhifengzhang-sz
 * @created 2024-12-24
 * @modified 2024-12-24
 */

import { AnyActorRef } from "xstate";
import { WebSocketContext, WebSocketEvent } from "./types.js";
import { ApplicationError, ErrorCode, StatusCode } from "@qi/core/errors";
import { validateUrl } from "./utils.js";
import { mapTransitionCloseCodeToError } from "./transitions.js";

function isValidMessageData(
  data: unknown
): data is string | ArrayBufferLike | Blob | ArrayBufferView {
  return (
    typeof data === "string" ||
    data instanceof ArrayBuffer ||
    data instanceof Blob ||
    ArrayBuffer.isView(data)
  );
}

/**
 * Type-safe service implementations for XState v5
 */
export const services = {
  /**
   * Main WebSocket service implementation
   */
  webSocket: ({ context }: { context: WebSocketContext }) => ({
    init: ({ self }: { self: AnyActorRef }) => {
      let socket: WebSocket | null = null;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      // Cleanup function to handle resource disposal
      const cleanup = () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (socket) {
          try {
            socket.close();
          } catch (error) {
            console.error("Error closing socket:", error);
          }
          socket = null;
        }
      };

      // Validate URL before attempting connection
      const urlValidation = validateUrl(context.url || "");
      if (!urlValidation.isValid) {
        self.send({
          type: "ERROR",
          error: new ApplicationError(
            urlValidation.reason || "Invalid WebSocket URL",
            ErrorCode.WEBSOCKET_INVALID_URL,
            StatusCode.BAD_REQUEST,
            { url: context.url }
          ),
          timestamp: Date.now(),
        });
        return cleanup;
      }

      // Initialize WebSocket connection
      try {
        socket = new WebSocket(
          context.url!,
          context.options.protocols
            ? Array.from(context.options.protocols)
            : undefined
        );

        // Configure connection timeout
        const connectionTimeout = setTimeout(() => {
          if (socket?.readyState !== WebSocket.OPEN) {
            self.send({
              type: "ERROR",
              error: new ApplicationError(
                "Connection timeout",
                ErrorCode.WEBSOCKET_TIMEOUT,
                StatusCode.GATEWAY_TIMEOUT,
                { url: context.url }
              ),
              timestamp: Date.now(),
            });
            cleanup();
          }
        }, context.options.connectionTimeout || 10000);

        // WebSocket event handlers
        socket.onopen = () => {
          clearTimeout(connectionTimeout);
          self.send({ type: "OPEN", timestamp: Date.now() });

          // Setup heartbeat if configured
          if (context.options.heartbeatInterval) {
            heartbeatInterval = setInterval(() => {
              if (socket?.readyState === WebSocket.OPEN) {
                socket.send("ping");
              }
            }, context.options.heartbeatInterval);
          }
        };

        socket.onmessage = (event) => {
          // Skip processing of heartbeat messages
          if (event.data === "ping" || event.data === "pong") {
            return;
          }

          self.send({
            type: "MESSAGE",
            data: event.data,
            size: event.data.length,
            timestamp: Date.now(),
          });
        };

        socket.onerror = (error) => {
          self.send({
            type: "ERROR",
            error: new ApplicationError(
              "WebSocket error occurred",
              ErrorCode.WEBSOCKET_ERROR,
              StatusCode.INTERNAL_SERVER_ERROR,
              {
                error: error instanceof Error ? error.message : "Unknown error",
                url: context.url,
                readyState: socket?.readyState,
              }
            ),
            timestamp: Date.now(),
          });
        };

        socket.onclose = (event) => {
          const { errorCode, statusCode, recoverable } =
            mapTransitionCloseCodeToError(event.code);

          self.send({
            type: "CLOSE",
            code: event.code,
            reason: event.reason || "",
            wasClean: event.wasClean,
            timestamp: Date.now(),
          });

          if (!event.wasClean) {
            self.send({
              type: "ERROR",
              error: new ApplicationError(
                event.reason || `Connection closed with code ${event.code}`,
                errorCode,
                statusCode,
                {
                  code: event.code,
                  wasClean: event.wasClean,
                  recoverable,
                  url: context.url,
                }
              ),
              timestamp: Date.now(),
            });
          }

          cleanup();
        };
      } catch (error) {
        self.send({
          type: "ERROR",
          error: new ApplicationError(
            error instanceof Error
              ? error.message
              : "Failed to initialize WebSocket",
            ErrorCode.WEBSOCKET_ERROR,
            StatusCode.INTERNAL_SERVER_ERROR,
            { error, url: context.url }
          ),
          timestamp: Date.now(),
        });
        cleanup();
      }

      // Return cleanup function
      return cleanup;
    },

    /**
     * Handle machine events
     */
    update: ({ event }: { event: WebSocketEvent }) => {
      if (
        event.type === "SEND" &&
        context.socket?.readyState === WebSocket.OPEN
      ) {
        if (!isValidMessageData(event.data)) {
          return {
            type: "ERROR",
            error: new ApplicationError(
              "Invalid message data type",
              ErrorCode.WEBSOCKET_INVALID_DATA,
              StatusCode.UNPROCESSABLE_ENTITY,
              { dataType: typeof event.data }
            ),
            timestamp: Date.now(),
          };
        }

        try {
          context.socket.send(event.data);
        } catch (error) {
          return {
            type: "ERROR",
            error: new ApplicationError(
              "Failed to send message",
              ErrorCode.WEBSOCKET_SEND_FAILED,
              StatusCode.INTERNAL_SERVER_ERROR,
              { error, data: event.data }
            ),
            timestamp: Date.now(),
          };
        }
      }
    },
  }),

  /**
   * Health check service implementation
   */
  healthCheck: ({ context }: { context: WebSocketContext }) => ({
    init: ({ self }: { self: AnyActorRef }) => {
      const checkHealth = () => {
        if (!context.socket || context.socket.readyState !== WebSocket.OPEN) {
          self.send({
            type: "ERROR",
            error: new ApplicationError(
              "Health check failed - socket not connected",
              ErrorCode.WEBSOCKET_NOT_CONNECTED,
              StatusCode.SERVICE_UNAVAILABLE,
              { readyState: context.socket?.readyState }
            ),
            timestamp: Date.now(),
          });
          return;
        }

        try {
          context.socket.send("ping");
          self.send({ type: "HEALTH_OK", timestamp: Date.now() });
        } catch (error) {
          self.send({
            type: "ERROR",
            error: new ApplicationError(
              "Health check failed",
              ErrorCode.WEBSOCKET_ERROR,
              StatusCode.SERVICE_UNAVAILABLE,
              { error }
            ),
            timestamp: Date.now(),
          });
        }
      };

      // Initial check
      checkHealth();

      // Setup interval if configured
      const interval = context.options.healthCheckInterval;
      if (interval) {
        const timer = setInterval(checkHealth, interval);
        return () => clearInterval(timer);
      }

      return () => {};
    },
  }),
} as const;

```

### states.ts

```typescript
/**
 * @fileoverview WebSocket state type definitions
 * @module @qi/core/network/websocket/states
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
 */

import { State, EventType } from "./constants.js";
import { WebSocketContext } from "./types.js";

/**
 * State metadata
 */
export interface StateMetadata {
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly timeoutMs?: number;
  readonly maxDurationMs?: number;
  readonly retryable: boolean;
}

/**
 * State invariant
 */
export interface StateInvariant {
  readonly check: (context: WebSocketContext) => boolean;
  readonly description: string;
}

/**
 * State definition
 */
export interface StateDefinition {
  readonly name: State;
  readonly allowedEvents: ReadonlySet<EventType>;
  readonly invariants: ReadonlyArray<StateInvariant>;
  readonly metadata: StateMetadata;
}

/**
 * State validation result
 */
export interface StateValidationResult {
  readonly isValid: boolean;
  readonly failures: ReadonlyArray<string>;
}

/**
 * State transition definition
 */
export interface StateTransition {
  readonly from: State;
  readonly to: State;
  readonly event: EventType;
  readonly metadata?: Record<string, unknown>;
}

/**
 * State transition validation result
 */
export interface TransitionValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * State history entry
 */
export interface StateHistoryEntry {
  readonly state: State;
  readonly enteredAt: number;
  readonly exitedAt?: number;
  readonly duration?: number;
  readonly transitions: ReadonlyArray<StateTransition>;
}

```

### transitions.ts

```typescript
/**
 * @fileoverview WebSocket state transition definitions and validation
 * @module @qi/core/network/websocket/transitions
 *
 * @author zhifengzhang-sz
 * @created 2024-12-22
 * @modified 2024-12-24
 */

import { State, EventType, CLOSE_CODES } from "./constants.js";
import { ErrorCode, StatusCode } from "@qi/core/errors";
import { WebSocketContext, WebSocketEvent, ValidationResult } from "./types.js";

/**
 * Core state transition map
 */
export const transitions: Readonly<
  Record<State, Partial<Record<EventType, State>>>
> = {
  disconnected: {
    CONNECT: "connecting",
    TERMINATE: "terminated",
  },
  connecting: {
    OPEN: "connected",
    ERROR: "reconnecting",
    CLOSE: "disconnected",
    TERMINATE: "terminated",
  },
  connected: {
    DISCONNECT: "disconnecting",
    ERROR: "reconnecting",
    CLOSE: "disconnected",
    TERMINATE: "terminated",
  },
  reconnecting: {
    RETRY: "connecting",
    MAX_RETRIES: "disconnected",
    TERMINATE: "terminated",
  },
  disconnecting: {
    CLOSE: "disconnected",
    TERMINATE: "terminated",
  },
  terminated: {},
} as const;

/**
 * Transition metadata type
 */
export interface TransitionMetadata {
  readonly description: string;
  readonly guards: ReadonlyArray<string>;
  readonly actions: ReadonlyArray<string>;
  readonly timeout?: number;
  readonly retryable: boolean;
  readonly clearErrors: boolean;
}

/**
 * Transition metadata map
 */
export const transitionMeta: Readonly<
  Record<State, Partial<Record<EventType, TransitionMetadata>>>
> = {
  disconnected: {
    CONNECT: {
      description: "Initiate connection",
      guards: ["canConnect", "hasValidUrl"],
      actions: ["initConnection", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Permanent termination",
      guards: [],
      actions: ["cleanupResources", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  connecting: {
    OPEN: {
      description: "Connection established",
      guards: ["isSocketValid"],
      actions: ["onConnected", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    ERROR: {
      description: "Connection failed",
      guards: ["canRetry"],
      actions: ["onError", "scheduleReconnect", "logTransition"],
      timeout: 5000,
      retryable: true,
      clearErrors: false,
    },
    CLOSE: {
      description: "Connection closed",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Force termination during connect",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  connected: {
    DISCONNECT: {
      description: "Initiate disconnect",
      guards: ["isSocketValid"],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
    ERROR: {
      description: "Connection error",
      guards: ["canRetry"],
      actions: ["onError", "scheduleReconnect", "logTransition"],
      timeout: 5000,
      retryable: true,
      clearErrors: false,
    },
    CLOSE: {
      description: "Connection closed",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Force termination while connected",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  reconnecting: {
    RETRY: {
      description: "Retry connection",
      guards: ["canRetry", "hasValidUrl"],
      actions: ["initConnection", "logTransition"],
      timeout: 30000,
      retryable: true,
      clearErrors: true,
    },
    MAX_RETRIES: {
      description: "Max retries reached",
      guards: [],
      actions: ["onMaxRetries", "logTransition"],
      retryable: false,
      clearErrors: false,
    },
    TERMINATE: {
      description: "Force termination during reconnect",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  disconnecting: {
    CLOSE: {
      description: "Cleanup connection",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Force termination during disconnect",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  terminated: {},
} as const;

/**
 * Validate state transition
 */
export function validateTransition(
  from: State,
  event: WebSocketEvent,
  to: State,
  context: WebSocketContext
): ValidationResult {
  // Check if transition exists
  const allowedState = transitions[from]?.[event.type];
  if (!allowedState || allowedState !== to) {
    return {
      isValid: false,
      reason: `Invalid transition from ${from} to ${to} on ${event.type}`,
    };
  }

  // Special conditions based on event type
  switch (event.type) {
    case "RETRY":
      if (context.retryCount >= context.options.maxReconnectAttempts) {
        return {
          isValid: false,
          reason: "Maximum retry attempts exceeded",
        };
      }
      break;
    case "CONNECT":
      if (context.socket !== null) {
        return {
          isValid: false,
          reason: "Socket already exists",
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Maps WebSocket close codes to error codes and status codes
 */
export function mapTransitionCloseCodeToError(code: number): {
  errorCode: ErrorCode;
  statusCode: StatusCode;
  recoverable: boolean;
} {
  const closeCodeMap: Record<
    number,
    { errorCode: ErrorCode; statusCode: StatusCode; recoverable: boolean }
  > = {
    [CLOSE_CODES.NORMAL_CLOSURE]: {
      errorCode: ErrorCode.WEBSOCKET_CLOSED,
      statusCode: StatusCode.OK,
      recoverable: false,
    },
    [CLOSE_CODES.GOING_AWAY]: {
      errorCode: ErrorCode.WEBSOCKET_DISCONNECT,
      statusCode: StatusCode.SERVICE_UNAVAILABLE,
      recoverable: true,
    },
    [CLOSE_CODES.PROTOCOL_ERROR]: {
      errorCode: ErrorCode.WEBSOCKET_PROTOCOL,
      statusCode: StatusCode.BAD_REQUEST,
      recoverable: false,
    },
    [CLOSE_CODES.INVALID_DATA]: {
      errorCode: ErrorCode.WEBSOCKET_INVALID_DATA,
      statusCode: StatusCode.UNPROCESSABLE_ENTITY,
      recoverable: false,
    },
    [CLOSE_CODES.POLICY_VIOLATION]: {
      errorCode: ErrorCode.WEBSOCKET_POLICY,
      statusCode: StatusCode.FORBIDDEN,
      recoverable: false,
    },
    [CLOSE_CODES.MESSAGE_TOO_BIG]: {
      errorCode: ErrorCode.WEBSOCKET_MESSAGE_SIZE,
      statusCode: StatusCode.BAD_REQUEST,
      recoverable: true,
    },
    [CLOSE_CODES.INTERNAL_ERROR]: {
      errorCode: ErrorCode.WEBSOCKET_INTERNAL,
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      recoverable: true,
    },
    [CLOSE_CODES.CONNECTION_FAILED]: {
      errorCode: ErrorCode.WEBSOCKET_ABNORMAL,
      statusCode: StatusCode.BAD_GATEWAY,
      recoverable: true,
    },
  };

  return (
    closeCodeMap[code] ?? {
      errorCode: ErrorCode.WEBSOCKET_ERROR,
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      recoverable: true,
    }
  );
}

/**
 * Get available transitions for a state
 */
export function getAvailableTransitions(state: State): ReadonlyArray<{
  readonly event: EventType;
  readonly targetState: State;
  readonly metadata: TransitionMetadata;
}> {
  const stateTransitions = transitions[state];
  return Object.entries(stateTransitions).map(([event, targetState]) => ({
    event: event as EventType,
    targetState,
    metadata: transitionMeta[state][event as EventType]!,
  }));
}

```

### types.ts

```typescript
/**
 * @fileoverview Core WebSocket types with enhanced state tracking
 * @module @qi/core/network/websocket/types
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
 */

import { State, EventType, BaseConfig, CloseCode } from "./constants.js";
import { ErrorContext } from "./errors.js";

/**
 * Base event with timing
 */
export interface BaseEvent {
  readonly timestamp: number;
  readonly id?: string;
}

/**
 * WebSocket events
 */
export type WebSocketEvent =
  | ({ type: "CONNECT"; url: string } & BaseEvent)
  | ({ type: "DISCONNECT"; code?: CloseCode; reason?: string } & BaseEvent)
  | ({ type: "OPEN" } & BaseEvent)
  | ({
      type: "CLOSE";
      code: CloseCode;
      reason: string;
      wasClean: boolean;
    } & BaseEvent)
  | ({ type: "ERROR"; error: ErrorContext } & BaseEvent)
  | ({ type: "MESSAGE"; data: unknown; size?: number } & BaseEvent)
  | ({ type: "SEND"; data: unknown; size?: number } & BaseEvent)
  | ({ type: "RETRY"; attempt: number; delay: number } & BaseEvent)
  | ({ type: "MAX_RETRIES"; attempts: number } & BaseEvent)
  | ({ type: "TERMINATE"; code?: CloseCode; reason?: string } & BaseEvent);

/**
 * Timing metrics
 */
export interface Timing {
  readonly connectStart: number | null;
  readonly connectEnd: number | null;
  readonly lastMessageTime: number | null;
  readonly lastEventTime: number | null;
  readonly stateHistory: ReadonlyArray<{
    readonly state: State;
    readonly timestamp: number;
    readonly duration?: number;
  }>;
}

/**
 * Rate limiting configuration
 */
export interface RateLimit {
  readonly count: number;
  readonly window: number;
  readonly lastReset: number;
  readonly maxBurst: number;
  readonly history: ReadonlyArray<{
    readonly timestamp: number;
    readonly count: number;
  }>;
}

/**
 * Connection metrics
 */
export interface Metrics {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly errors: ReadonlyArray<ErrorContext>;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly latency: ReadonlyArray<number>;
  readonly eventHistory: ReadonlyArray<{
    readonly type: EventType;
    readonly timestamp: number;
    readonly metadata?: Record<string, unknown>;
  }>;
}

/**
 * WebSocket configuration options
 */
export interface Options extends BaseConfig {
  readonly protocols?: ReadonlyArray<string>;
  readonly headers?: ReadonlyMap<string, string>;
  readonly connectionTimeout?: number;
  readonly heartbeatInterval?: number;
  readonly healthCheckInterval?: number;
}

/**
 * Message processing state
 */
export interface MessageProcessingFlags {
  readonly isProcessing: boolean;
  readonly lastProcessedMessageId: string | null;
  readonly processingHistory: ReadonlyArray<{
    readonly messageId: string;
    readonly startTime: number;
    readonly endTime?: number;
    readonly status: "success" | "error" | "timeout";
  }>;
}

/**
 * Message queue state
 */
export interface QueueState {
  readonly messages: ReadonlyArray<string>;
  readonly pending: boolean;
  readonly droppedMessages: number;
}

/**
 * WebSocket context
 */
export interface WebSocketContext {
  readonly url: string | null;
  readonly status: State;
  readonly socket: WebSocket | null;
  readonly error: ErrorContext | null;
  readonly options: Options;
  readonly metrics: Metrics;
  readonly timing: Timing;
  readonly rateLimit: RateLimit;
  readonly messageFlags: MessageProcessingFlags;
  readonly queue: QueueState;
  readonly reconnectAttempts: number;
  readonly backoffDelay: number;
  readonly retryCount: number;
}

/**
 * Validation result types
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

export interface StateValidationResult extends ValidationResult {
  readonly failures: ReadonlyArray<string>;
}

export type TransitionValidationResult = ValidationResult;

```

### utils.ts

```typescript
/**
 * @fileoverview Pure utility functions for WebSocket operations
 * @module @qi/core/network/websocket/utils
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-24
 */

import {
  WebSocketEvent,
  WebSocketContext,
  StateValidationResult,
  TransitionValidationResult,
} from "./types.js";
import { StateDefinition } from "./states.js";

/**
 * Type guard for WebSocket events
 */
export function isWebSocketEvent(value: unknown): value is WebSocketEvent {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    !("timestamp" in value)
  ) {
    return false;
  }
  const event = value as Partial<WebSocketEvent>;
  return typeof event.type === "string" && typeof event.timestamp === "number";
}

/**
 * Validate event payload structure
 */
export function validateEventPayload(
  event: WebSocketEvent
): TransitionValidationResult {
  if (!event || typeof event !== "object") {
    return { isValid: false, reason: "Event must be an object" };
  }

  // Type-specific validations
  switch (event.type) {
    case "CONNECT":
      if (!event.url || typeof event.url !== "string") {
        return {
          isValid: false,
          reason: "CONNECT event must have a valid URL",
        };
      }
      break;

    case "MESSAGE":
    case "SEND":
      if (event.size !== undefined && typeof event.size !== "number") {
        return { isValid: false, reason: "Message size must be a number" };
      }
      break;

    case "RETRY":
      if (
        typeof event.attempt !== "number" ||
        typeof event.delay !== "number"
      ) {
        return {
          isValid: false,
          reason: "RETRY event must have valid attempt and delay",
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Validate WebSocket URL
 */
export function validateUrl(url: string): TransitionValidationResult {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return { isValid: false, reason: "URL must use ws: or wss: protocol" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, reason: "Invalid URL format" };
  }
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoff(
  retryCount: number,
  baseInterval: number,
  maxInterval: number = 30000
): number {
  const delay = baseInterval * Math.pow(2, retryCount);
  return Math.min(delay, maxInterval);
}

/**
 * Validate state invariants
 */
export function validateStateInvariants(
  state: StateDefinition,
  context: WebSocketContext
): StateValidationResult {
  const failures: string[] = [];

  state.invariants.forEach((invariant) => {
    if (!invariant.check(context)) {
      failures.push(invariant.description);
    }
  });

  return {
    isValid: failures.length === 0,
    failures: failures,
  };
}

/**
 * Format bytes for logging
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

```

