# Project Source Code Documentation

## machine

### constants.ts

```typescript
/**
 * @fileoverview WebSocket constants and configuration
 * @module @qi/core/network/websocket/constants
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-19
 */

import { HttpStatusCode } from "../../errors.js";

/**
 * WebSocket connection states
 */
export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
  TERMINATED: "terminated",
} as const;

/**
 * WebSocket events
 */
export const EVENTS = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  ERROR: "ERROR",
  MESSAGE: "MESSAGE",
  SEND: "SEND",
  PING: "PING",
  PONG: "PONG",
  RETRY: "RETRY",
  MAX_RETRIES: "MAX_RETRIES",
  TERMINATE: "TERMINATE",
} as const;

/**
 * Default WebSocket configuration
 */
export const DEFAULT_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,
  connectionTimeout: 30000,
  pingInterval: 30000,
  pongTimeout: 5000,
  messageQueueSize: 100,
  messageTimeout: 5000,
  rateLimit: {
    messages: 100,
    window: 1000,
  },
} as const;

/**
 * WebSocket closure codes aligned with HTTP status codes
 */
export const WS_CLOSE_CODES = {
  NORMAL_CLOSURE: HttpStatusCode.WEBSOCKET_NORMAL_CLOSURE,
  GOING_AWAY: HttpStatusCode.WEBSOCKET_GOING_AWAY,
  PROTOCOL_ERROR: HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR,
  UNSUPPORTED_DATA: HttpStatusCode.WEBSOCKET_UNSUPPORTED_DATA,
  INVALID_FRAME: HttpStatusCode.WEBSOCKET_INVALID_FRAME,
  POLICY_VIOLATION: HttpStatusCode.WEBSOCKET_POLICY_VIOLATION,
  MESSAGE_TOO_BIG: HttpStatusCode.WEBSOCKET_MESSAGE_TOO_BIG,
  INTERNAL_ERROR: HttpStatusCode.WEBSOCKET_INTERNAL_ERROR,
} as const;

```

### errors.ts

```typescript
import { ErrorCode } from "@qi/core/errors";

/**
 * Enumerates WebSocket HTTP Status Codes.
 */
export enum WebSocketHttpStatus {
  NORMAL_CLOSURE = 1000,
  GOING_AWAY = 1001,
  PROTOCOL_ERROR = 1002,
  UNSUPPORTED_DATA = 1003,
  INVALID_FRAME = 1007,
  POLICY_VIOLATION = 1008,
  MESSAGE_TOO_BIG = 1009,
  INTERNAL_ERROR = 1011,
  ABNORMAL_CLOSURE = 1006,
}

/**
 * Maps WebSocket HTTP Status Codes to internal Error Codes.
 */
export const WS_ERROR_CODES = {
  WEBSOCKET_CLOSED: ErrorCode.WEBSOCKET_CLOSED,
  WEBSOCKET_DISCONNECT: ErrorCode.WEBSOCKET_DISCONNECT,
  WEBSOCKET_PROTOCOL: ErrorCode.WEBSOCKET_PROTOCOL,
  WEBSOCKET_INVALID_DATA: ErrorCode.WEBSOCKET_INVALID_DATA,
  WEBSOCKET_POLICY: ErrorCode.WEBSOCKET_POLICY,
  WEBSOCKET_MESSAGE_SIZE: ErrorCode.WEBSOCKET_MESSAGE_SIZE,
  WEBSOCKET_ERROR: ErrorCode.WEBSOCKET_ERROR,
  WEBSOCKET_ABNORMAL: ErrorCode.WEBSOCKET_ABNORMAL,
  WEBSOCKET_INTERNAL: ErrorCode.WEBSOCKET_INTERNAL,
} as const;

export type WebSocketErrorCode =
  (typeof WS_ERROR_CODES)[keyof typeof WS_ERROR_CODES];

/**
 * NetworkErrorContext Interface
 * Defines the structure for network-related error contexts.
 */
export interface NetworkErrorContext {
  readonly errorMessage: string;
  readonly errorCode?: number;
  readonly timestamp: number;
  readonly url?: string;
  // Add other relevant properties as needed
}

/**
 * Maps WebSocket HTTP Status Codes to internal Error Codes.
 * @param code - The WebSocket HTTP status code.
 * @returns The corresponding internal ErrorCode.
 */
export const mapCloseCodeToErrorCode = (code: number): ErrorCode => {
  switch (code) {
    case WebSocketHttpStatus.NORMAL_CLOSURE:
      return WS_ERROR_CODES.WEBSOCKET_CLOSED;
    case WebSocketHttpStatus.GOING_AWAY:
      return WS_ERROR_CODES.WEBSOCKET_DISCONNECT;
    case WebSocketHttpStatus.PROTOCOL_ERROR:
      return WS_ERROR_CODES.WEBSOCKET_PROTOCOL;
    case WebSocketHttpStatus.UNSUPPORTED_DATA:
      return WS_ERROR_CODES.WEBSOCKET_INVALID_DATA;
    case WebSocketHttpStatus.INVALID_FRAME:
      return WS_ERROR_CODES.WEBSOCKET_INVALID_DATA;
    case WebSocketHttpStatus.POLICY_VIOLATION:
      return WS_ERROR_CODES.WEBSOCKET_POLICY;
    case WebSocketHttpStatus.MESSAGE_TOO_BIG:
      return WS_ERROR_CODES.WEBSOCKET_MESSAGE_SIZE;
    case WebSocketHttpStatus.INTERNAL_ERROR:
      return WS_ERROR_CODES.WEBSOCKET_INTERNAL;
    case WebSocketHttpStatus.ABNORMAL_CLOSURE:
      return WS_ERROR_CODES.WEBSOCKET_ABNORMAL;
    default:
      return WS_ERROR_CODES.WEBSOCKET_ERROR;
  }
};

/**
 * Maps common WebSocket errors to HTTP status codes.
 * @param error - The error object to map.
 * @returns The corresponding WebSocketHttpStatus.
 */
export function mapWebSocketErrorToStatus(error: Error): WebSocketHttpStatus {
  if ("statusCode" in error && typeof (error as any).statusCode === "number") {
    return (error as any).statusCode as WebSocketHttpStatus;
  }
  return WebSocketHttpStatus.ABNORMAL_CLOSURE;
}

```

### states.ts

```typescript
import { WebSocketContext, WebSocketEvents, ConnectionState } from "./types.js";

/**
 * StateDefinition defines the structure for each state in the WebSocket machine.
 */
export interface StateDefinition {
  /**
   * The name of the state.
   */
  name: ConnectionState;

  /**
   * A set of event types that are allowed in this state.
   */
  allowedEvents: ReadonlySet<WebSocketEvents["type"]>;

  /**
   * A list of invariant functions that must hold true for the state to be valid.
   */
  invariants: ReadonlyArray<(context: WebSocketContext) => boolean>;

  /**
   * Transition definitions for the state.
   * Made partial to allow for states not handling every event.
   */
  transitions: Partial<Record<WebSocketEvents["type"], ConnectionState>>;
}

/**
 * States Configuration aligned with the formal specification
 * States and transitions include:
 * - Regular states: disconnected, connecting, connected, reconnecting, disconnecting
 * - Final state: terminated
 * - All TERMINATE events transition to terminated state
 */
export const states: Record<ConnectionState, StateDefinition> = {
  disconnected: {
    name: "disconnected",
    allowedEvents: new Set(["CONNECT", "TERMINATE"]),
    invariants: [
      (ctx) => ctx.socket === null,
      (ctx) => ctx.status === "disconnected",
    ],
    transitions: {
      CONNECT: "connecting",
      TERMINATE: "terminated",
    },
  },
  connecting: {
    name: "connecting",
    allowedEvents: new Set(["OPEN", "CLOSE", "ERROR", "TERMINATE"]),
    invariants: [
      (ctx) => ctx.socket !== null,
      (ctx) => ctx.status === "connecting",
    ],
    transitions: {
      OPEN: "connected",
      ERROR: "reconnecting",
      CLOSE: "reconnecting",
      TERMINATE: "terminated",
    },
  },
  connected: {
    name: "connected",
    allowedEvents: new Set([
      "SEND",
      "MESSAGE",
      "DISCONNECT",
      "CLOSE",
      "ERROR",
      "PING",
      "PONG",
      "TERMINATE",
    ]),
    invariants: [
      (ctx) => ctx.socket !== null,
      (ctx) => ctx.status === "connected",
    ],
    transitions: {
      DISCONNECT: "disconnecting",
      CLOSE: "reconnecting",
      ERROR: "reconnecting",
      TERMINATE: "terminated",
    },
  },
  reconnecting: {
    name: "reconnecting",
    allowedEvents: new Set(["RETRY", "MAX_RETRIES", "TERMINATE"]),
    invariants: [
      (ctx) => ctx.reconnectAttempts <= ctx.options.maxReconnectAttempts,
      (ctx) => ctx.status === "reconnecting",
    ],
    transitions: {
      RETRY: "connecting",
      MAX_RETRIES: "disconnected",
      TERMINATE: "terminated",
    },
  },
  disconnecting: {
    name: "disconnecting",
    allowedEvents: new Set(["CLOSE", "TERMINATE"]),
    invariants: [(ctx) => ctx.status === "disconnecting"],
    transitions: {
      CLOSE: "disconnected",
      TERMINATE: "terminated",
    },
  },
  terminated: {
    name: "terminated",
    allowedEvents: new Set([]), // No events allowed in terminated state
    invariants: [
      (ctx) => ctx.socket === null,
      (ctx) => ctx.status === "terminated",
    ],
    transitions: {}, // No transitions out of terminated state
  },
};

/**
 * Validate a transition between states
 */
export function validateTransition(
  from: ConnectionState,
  event: WebSocketEvents["type"],
  to: ConnectionState
): boolean {
  const state = states[from];
  const allowedTransition = state.transitions[event];
  return allowedTransition === to;
}

/**
 * Check if an event is allowed in the current state
 */
export function isEventAllowed(
  state: ConnectionState,
  event: WebSocketEvents["type"]
): boolean {
  return states[state].allowedEvents.has(event);
}

/**
 * Validate state invariants
 */
export function validateStateInvariants(
  state: ConnectionState,
  context: WebSocketContext
): boolean {
  return states[state].invariants.every((inv) => inv(context));
}

```

### types.ts

```typescript
/**
 * @fileoverview WebSocket type definitions
 * @module @qi/core/network/websocket/types
 */

import { Snapshot, EventObject, ActorLogic } from "xstate";
import { WebSocketErrorCode, NetworkErrorContext } from "./errors.js";
import { ApplicationError } from "@qi/core/errors";

/**
 * Base Types
 */
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnecting"
  | "terminated";

export interface ConnectionOptions {
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;
  pingInterval: number;
  pongTimeout: number;
  messageQueueSize: number;
  messageTimeout: number;
  rateLimit: RateLimit;
}

export interface RateLimit {
  messages: number;
  window: number;
}

export interface QueuedMessage {
  id: string;
  data: any;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: "high" | "normal";
}

export interface SendOptions {
  retry: boolean;
  timeout: number;
  priority: "high" | "normal";
  queueIfOffline: boolean;
}

export interface WebSocketMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  errors: ErrorRecord[];
  messageTimestamps: number[];
}

export interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

export interface WebSocketErrorContext extends NetworkErrorContext {
  readonly url: string;
  readonly connectionAttempts: number;
  readonly totalErrors: number;
  readonly consecutiveErrors: number;
  readonly readyState?: number;
  readonly socket?: WebSocket | null;
  readonly closeCode?: number;
  readonly closeReason?: string;
  readonly wasClean?: boolean;

  // Included metrics from WebSocketContext
  readonly metrics: WebSocketMetrics;
}

export class WebSocketError extends ApplicationError {
  readonly context: WebSocketErrorContext;

  constructor(
    message: string,
    code: WebSocketErrorCode,
    context: WebSocketErrorContext
  ) {
    super(message, code);
    this.context = context;
  }
}

export interface WebSocketErrorEntry {
  error: WebSocketError;
  timestamp: number;
}

// 1. Complete WebSocketContext with all required properties
export interface WebSocketContext {
  readonly url: string | null;
  readonly protocols: ReadonlyArray<string>;
  readonly socket: WebSocket | null;
  readonly status: ConnectionState;

  // Connection tracking
  readonly reconnectAttempts: number;
  readonly lastConnectTime: number | null;
  readonly lastError: WebSocketError | null;
  readonly connectionTimeout: number | null;

  // Message queue
  readonly queue: {
    readonly messages: ReadonlyArray<QueuedMessage>;
    readonly pending: boolean;
    readonly lastProcessed: number | null;
    readonly capacity: number;
    readonly droppedMessages: number;
  };

  // Connection settings
  readonly options: Readonly<ConnectionOptions>;

  // Metrics
  readonly metrics: Readonly<WebSocketMetrics>;

  // Health checks
  readonly health: Readonly<{
    lastPingTime: number | null;
    lastPongTime: number | null;
    latencies: ReadonlyArray<number>;
    averageLatency: number | null;
    status: "healthy" | "degraded" | "unhealthy";
  }>;
}

// 2. Complete event types with proper discriminated unions
export type WebSocketEvents =
  | {
      type: "CONNECT";
      url: string;
      protocols?: string[];
      options?: Partial<ConnectionOptions>;
    }
  | { type: "DISCONNECT"; code?: number; reason?: string }
  | { type: "OPEN"; timestamp: number }
  | { type: "CLOSE"; code: number; reason: string; wasClean: boolean }
  | {
      type: "ERROR";
      error: WebSocketError;
      timestamp: number;
      attempt?: number;
    }
  | { type: "MESSAGE"; data: unknown; timestamp: number; id?: string }
  | { type: "SEND"; data: unknown; id?: string; options?: SendOptions }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number }
  | { type: "RETRY"; attempt: number; delay: number }
  | { type: "MAX_RETRIES"; attempts: number; lastError?: WebSocketError }
  | { type: "TERMINATE"; code?: number; reason?: string; immediate?: boolean }
  | { type: "QUEUE_OVERFLOW"; dropped: QueuedMessage }
  | { type: "CONNECTION_TIMEOUT" }
  | { type: "HEALTH_CHECK" };

/**
 * WebSocket machine state schema
 */
export type WebSocketState = {
  value: ConnectionState;
  context: WebSocketContext;
};

/**
 * Correctly defined WebSocketSnapshot as an intersection type
 */
export type WebSocketSnapshot = Snapshot<ConnectionState> & {
  context: WebSocketContext;
};

/**
 * Correct WebSocketActor type with proper generics
 */
export type WebSocketActor = ActorLogic<
  WebSocketSnapshot, // TSnapshot
  WebSocketEvents // TEvent
>;

// 3. XState v5 specific type definitions
// Remove duplicate type
// export type WebSocketMachineTypes = {...}

/**
 * WebSocket service types
 */
export type WebSocketServices = {
  connect: {
    data: WebSocket;
  };
  disconnect: {
    data: void;
  };
};

// 1. State Schema
export type WebSocketStateValue = {
  idle:
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnecting";
};

// 2. Machine Configuration Types
export type WebSocketMachineConfig = {
  context: WebSocketContext;
  events: WebSocketEvents;
  input: ConnectionOptions;
  output: void;
};

// 3. Event Creators (Type-safe event factories)
export const createWebSocketEvent = {
  connect: (
    url: string,
    options?: Partial<ConnectionOptions>
  ): WebSocketEvent<"CONNECT"> => ({
    type: "CONNECT",
    url,
    options,
  }),
  disconnect: (
    code?: number,
    reason?: string
  ): WebSocketEvent<"DISCONNECT"> => ({
    type: "DISCONNECT",
    code,
    reason,
  }),
  // ... other event creators
};

// 4. Guard Types
export type WebSocketGuards = {
  canConnect: (
    context: WebSocketContext,
    event: WebSocketEvent<"CONNECT">
  ) => boolean;
  canReconnect: (
    context: WebSocketContext,
    event: WebSocketEvent<"RETRY">
  ) => boolean;
  hasReachedMaxRetries: (context: WebSocketContext) => boolean;
  isValidMessage: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "SEND" | "MESSAGE" }>
  ) => boolean;
  isHealthy: (context: WebSocketContext) => boolean;
};

// 5. Action Types (as pure functions returning partial context updates)
export type WebSocketActions = {
  connect: (
    context: WebSocketContext,
    event: WebSocketEvent<"CONNECT">
  ) => Partial<WebSocketContext>;
  disconnect: (
    context: WebSocketContext,
    event: WebSocketEvent<"DISCONNECT">
  ) => Partial<WebSocketContext>;
  handleMessage: (
    context: WebSocketContext,
    event: WebSocketEvent<"MESSAGE">
  ) => Partial<WebSocketContext>;
  handleError: (
    context: WebSocketContext,
    event: WebSocketEvent<"ERROR">
  ) => Partial<WebSocketContext>;
  updateMetrics: (
    context: WebSocketContext,
    event: WebSocketEvents
  ) => Partial<WebSocketContext>;
  enqueueMessage: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "SEND" }>
  ) => WebSocketContext;
  updateHealth: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "HEALTH_CHECK" }>
  ) => WebSocketContext;
};

// 6. Helper type for event extraction
export type WebSocketEvent<T extends WebSocketEvents["type"]> = Extract<
  WebSocketEvents,
  { type: T }
>;

// 7. XState v5 Machine Types
export type WebSocketMachine = {
  types: {
    context: WebSocketContext;
    events: WebSocketEvents;
    input: ConnectionOptions;
    output: void;
    actions: WebSocketActions;
    guards: WebSocketGuards;
    actors: WebSocketActors;
  };
};

// 8. Actor Types
export type WebSocketActors = {
  websocket: {
    src: typeof WebSocket;
    input: ConnectionOptions;
  };
  healthCheck: {
    src: () => Promise<void>;
  };
  messageQueue: {
    src: () => Promise<void>;
  };
};

// Remove WebSocketState type as it's handled by XState v5's internal types

```

### utils.ts

```typescript
/**
 * @fileoverview WebSocket utility functions
 * @module @qi/core/network/websocket/utils
 */

import { logger } from "@qi/core/logger";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import {
  WebSocketErrorCode,
  WebSocketHttpStatus,
  WS_ERROR_CODES,
  mapWebSocketErrorToStatus,
} from "./errors.js";
import { retryOperation, formatBytes, truncate } from "@qi/core/utils";
import type {
  WebSocketContext,
  WebSocketErrorContext,
  WebSocketError,
  ConnectionOptions,
} from "./types.js";

/**
 * Creates a WebSocket error with proper context and logging
 */
export function createWebSocketError(
  message: string,
  originalError: Error,
  errorContext: WebSocketErrorContext,
  wsContext: WebSocketContext // Added parameter
): WebSocketError {
  const truncatedMessage = truncate(message, 100);

  const bytesReceived =
    typeof wsContext.metrics.bytesReceived === "number"
      ? wsContext.metrics.bytesReceived
      : 0;

  const statusCode = mapWebSocketErrorToStatus(originalError);
  const errorCode = mapHttpStatusToErrorCode(statusCode);
  const timestamp = Date.now();

  const error = new ApplicationError(truncatedMessage, errorCode, statusCode, {
    ...errorContext,
    error: originalError,
    readyState: errorContext.socket?.readyState ?? WebSocket.CLOSED,
    timestamp,
    bytesReceived, // Include bytesReceived in the error context
  }) as WebSocketError;

  logger.error(`WebSocket Error: ${truncatedMessage}`, {
    error,
    bytesReceived: formatBytes(bytesReceived),
    stackTrace: originalError.stack,
  });

  return error;
}

export function mapHttpStatusToErrorCode(
  status: WebSocketHttpStatus
): ErrorCode {
  switch (status) {
    case WebSocketHttpStatus.NORMAL_CLOSURE:
      return WS_ERROR_CODES.WEBSOCKET_CLOSED;
    case WebSocketHttpStatus.GOING_AWAY:
      return WS_ERROR_CODES.WEBSOCKET_DISCONNECT;
    case WebSocketHttpStatus.PROTOCOL_ERROR:
      return WS_ERROR_CODES.WEBSOCKET_PROTOCOL;
    case WebSocketHttpStatus.UNSUPPORTED_DATA:
      return WS_ERROR_CODES.WEBSOCKET_INVALID_DATA;
    case WebSocketHttpStatus.POLICY_VIOLATION:
      return WS_ERROR_CODES.WEBSOCKET_POLICY;
    case WebSocketHttpStatus.MESSAGE_TOO_BIG:
      return WS_ERROR_CODES.WEBSOCKET_MESSAGE_SIZE;
    case WebSocketHttpStatus.INTERNAL_ERROR:
    default:
      return WS_ERROR_CODES.WEBSOCKET_ERROR;
  }
}

/**
 * Calculates the next retry delay using exponential backoff
 */
export function calculateBackoffDelay(
  attempts: number,
  options: ConnectionOptions
): number {
  const { reconnectInterval, reconnectBackoffRate } = options;
  const delay =
    reconnectInterval * Math.pow(reconnectBackoffRate, attempts - 1);

  // Cap maximum delay at 30 seconds
  return Math.min(delay, 30_000);
}

/**
 * Determines if an error type allows for reconnection attempts
 */
export function isRecoverableError(error: WebSocketError): boolean {
  switch (error.statusCode) {
    case WebSocketHttpStatus.POLICY_VIOLATION:
    case WebSocketHttpStatus.PROTOCOL_ERROR:
      // Add additional recoverable status codes as needed
      return false;
    // ... other cases
    default:
      return true;
  }
}

/**
 * Validates connection parameters
 */
export function validateConnectionParams(
  url: string,
  protocols?: string[]
): boolean {
  try {
    const wsUrl = new URL(url);
    const validProtocol = ["ws:", "wss:"].includes(wsUrl.protocol);

    // If protocols provided, ensure they are valid strings
    if (protocols?.length) {
      return (
        validProtocol &&
        protocols.every((p) => typeof p === "string" && p.length > 0)
      );
    }

    return validProtocol;
  } catch {
    return false;
  }
}

/**
 * Calculates rate limit status
 */
export function checkRateLimit(
  context: WebSocketContext,
  timestamp: number = Date.now()
): boolean {
  const { messages, window } = context.options.rateLimit;
  const windowStart = timestamp - window;

  const recentMessages = context.metrics.messageTimestamps.filter(
    (t: number) => t >= windowStart
  );

  return recentMessages.length < messages;
}

export interface RetryContext {
  options: {
    reconnectInterval: number;
    reconnectBackoffRate: number;
    maxReconnectAttempts: number;
  };
  state: {
    connectionAttempts: number;
  };
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: RetryContext
): Promise<T> {
  return retryOperation(operation, {
    retries: context.options.maxReconnectAttempts,
    minTimeout: context.options.reconnectInterval,
    onRetry: (times) => {
      logger.info(
        `Retry attempt ${times}/${context.options.maxReconnectAttempts}`
      );
    },
  });
}

export const utils = {
  createWebSocketError,
  calculateBackoffDelay,
  isRecoverableError,
  validateConnectionParams,
  checkRateLimit,
} as const;

```

