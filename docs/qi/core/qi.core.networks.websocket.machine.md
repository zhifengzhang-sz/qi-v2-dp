# Project Source Code Documentation

## machine

### actions.ts

```typescript
/**
 * @fileoverview
 * @module actions.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-19
 */

import { logger } from "@qi/core/logger";
import type { WebSocketContext, WebSocketEvents } from "./types.js";

/**
 * Action: Prepare new WebSocket connection
 */
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
      connectionAttempts: 0,
    },
  };
}

/**
 * Action: Handle successful WebSocket connection
 */
export function handleOpen(context: WebSocketContext): WebSocketContext {
  logger.info("WebSocket connection established", {
    url: context.url,
    attempts: context.state.connectionAttempts,
  });

  return {
    ...context,
    metrics: {
      ...context.metrics,
      consecutiveErrors: 0,
      lastSuccessfulConnection: Date.now(),
    },
    state: {
      ...context.state,
      connectionAttempts: 0,
      lastConnectTime: Date.now(),
      lastError: null,
    },
  };
}

/**
 * Action: Handle WebSocket error
 */
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
          attempt: context.state.connectionAttempts,
        },
      ],
    },
    state: {
      ...context.state,
      lastError: event.error,
      lastErrorTime: Date.now(),
    },
  };
}

/**
 * Action: Process received WebSocket message
 */
export function handleMessage(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "MESSAGE" }>
): WebSocketContext {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      messagesReceived: context.metrics.messagesReceived + 1,
      bytesReceived:
        context.metrics.bytesReceived +
        (typeof event.data === "string" ? new Blob([event.data]).size : 0),
      messageTimestamps: [
        ...context.metrics.messageTimestamps.slice(-99),
        event.timestamp,
      ],
    },
    state: {
      ...context.state,
      lastMessageTime: event.timestamp,
    },
  };
}

/**
 * Action: Add message to send queue
 */
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
          priority: event.options?.priority ?? "normal",
        },
      ],
    },
  };
}

/**
 * Action: Handle WebSocket connection close
 */
export function handleClose(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CLOSE" }>
): WebSocketContext {
  return {
    ...context,
    state: {
      ...context.state,
      lastDisconnectTime: Date.now(),
    },
  };
}

/**
 * Action: Clean up resources
 */
export function cleanup(context: WebSocketContext): WebSocketContext {
  return {
    ...context,
    socket: null,
    queue: {
      messages: [],
      pending: false,
      lastProcessed: 0,
    },
  };
}

export const actions = {
  prepareConnection,
  handleOpen,
  handleError,
  handleMessage,
  enqueueMessage,
  handleClose,
  cleanup,
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

### guards.ts

```typescript
/**
 * @fileoverview WebSocket state machine guards
 * @module @qi/core/network/websocket/guards
 */

import { logger } from "@qi/core/logger";
import type {
  WebSocketContext,
  WebSocketEvents,
  WebSocketError,
} from "./types.js";
import { isRecoverableError, validateConnectionParams } from "./utils.js";

/**
 * Guard: Can initiate new WebSocket connection
 */
export function canInitiateConnection(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CONNECT" }>
): boolean {
  if (!event.url) {
    logger.error("Invalid WebSocket URL", { url: event.url });
    return false;
  }

  const validUrl = validateConnectionParams(event.url, event.protocols);
  const validState =
    !context.socket || context.socket.readyState === WebSocket.CLOSED;

  if (!validUrl) {
    logger.error("Invalid WebSocket URL or protocols", {
      url: event.url,
      protocols: event.protocols,
    });
  }

  return validUrl && validState;
}

/**
 * Guard: Can attempt reconnection after failure
 */
export function canReconnect(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "ERROR" }>
): boolean {
  if (!context.options.reconnect) {
    logger.debug("Reconnection disabled by configuration");
    return false;
  }

  if (
    context.state.connectionAttempts >= context.options.maxReconnectAttempts
  ) {
    logger.warn("Maximum reconnection attempts reached", {
      attempts: context.state.connectionAttempts,
      max: context.options.maxReconnectAttempts,
    });
    return false;
  }

  const error = event.error as WebSocketError;
  return isRecoverableError(error);
}

/**
 * Guard: Should throttle reconnection attempts
 */
export function shouldThrottle(context: WebSocketContext): boolean {
  const { consecutiveErrors } = context.metrics;
  const timeSinceLastError = Date.now() - (context.state.lastErrorTime || 0);
  const backoffDelay =
    context.options.reconnectInterval *
    Math.pow(context.options.reconnectBackoffRate, consecutiveErrors - 3);

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

/**
 * Guard: Can send message through WebSocket
 */
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

/**
 * Guard: Has space in message queue
 */
export function hasQueueSpace(context: WebSocketContext): boolean {
  return context.queue.messages.length < context.options.messageQueueSize;
}

export const guards = {
  canInitiateConnection,
  canReconnect,
  shouldThrottle,
  canSendMessage,
  hasQueueSpace,
} as const;

```

### machine.ts

```typescript
/**
 * @fileoverview
 * @module machine.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-18
 */

import { createMachine } from "xstate";
import { actions } from "./actions.js";
import { guards } from "./guards.js";
import { services } from "./services.js";
import { states } from "./states.js";
import { INITIAL_CONTEXT, CONNECTION_STATES } from "./constants.js";
import type {
  WebSocketContext,
  WebSocketEvents,
  ConnectionOptions,
} from "./types.js";

const defaultContext: WebSocketContext = {
  ...INITIAL_CONTEXT,
  protocols: [],
  metrics: {
    ...INITIAL_CONTEXT.metrics,
    errors: [],
    messageTimestamps: [],
  },
  queue: {
    ...INITIAL_CONTEXT.queue,
    messages: [],
  }
} satisfies WebSocketContext;

export const webSocketMachine = createMachine({
  id: "webSocket",
  initial: CONNECTION_STATES.DISCONNECTED,
  context: defaultContext,
  states: {
    [CONNECTION_STATES.DISCONNECTED]: {
      on: {
        CONNECT: {
          target: CONNECTION_STATES.CONNECTING,
          guard: 'canInitiateConnection',
          actions: 'prepareConnection'
        }
      }
    },
    [CONNECTION_STATES.CONNECTING]: {
      invoke: {
        src: 'webSocketService',
        onError: {
          target: CONNECTION_STATES.RECONNECTING,
          actions: 'handleError'
        }
      },
      on: {
        OPEN: {
          target: CONNECTION_STATES.CONNECTED,
          actions: 'handleOpen'
        }
      }
    }
  }
} satisfies {
  context: WebSocketContext,
  events: WebSocketEvents
});

export function createWebSocketMachine(options?: Partial<ConnectionOptions>) {
  return createMachine({
    ...webSocketMachine.definition,
    context: {
      ...defaultContext,
      options: {
        ...defaultContext.options,
        ...options,
      },
    },
  }).provide({
    actions,
    guards,
    services,
  });
}

export const createWebSocketEvent = {
  connect: (url: string, protocols?: string[], options?: Partial<ConnectionOptions>) => ({
    type: "CONNECT",
    url,
    protocols,
    options,
  }),
  disconnect: (code?: number, reason?: string) => ({
    type: "DISCONNECT" as const,
    code,
    reason,
  }),
  send: (data: unknown, options?: { priority: "high" | "normal" }) => ({
    type: "SEND" as const,
    data,
    id: crypto.randomUUID(),
    options,
  }),
} as const;

```

### services.ts

```typescript
/**
 * @fileoverview WebSocket state machine services
 * @module @qi/core/network/websocket/services
 */

/// <reference lib="dom" />

import { createActor } from "xstate";
import { logger } from "@qi/core/logger";
import type {
  WebSocketContext,
  WebSocketEvents,
  WebSocketActor,
  WebSocketError,
} from "./types.js";
import { createWebSocketError, retryWithBackoff } from "./utils.js";
import { HttpStatusCode } from "../../errors.js";

interface WebSocketCloseEvent extends Event {
  code: number;
  reason: string;
  wasClean: boolean;
}

type WebSocketType = globalThis.WebSocket;
type WebSocketErrorType = Event & {
  error?: Error;
};
type WebSocketMessageType = MessageEvent;
type WebSocketCloseType = WebSocketCloseEvent;

function cleanupWebSocket(
  socket: WebSocketType | null,
  reason = "Service cleanup"
): void {
  if (!socket) return;

  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
  socket.onopen = null;

  if (
    socket.readyState !== WebSocket.CLOSED &&
    socket.readyState !== WebSocket.CLOSING
  ) {
    socket.close(HttpStatusCode.WEBSOCKET_NORMAL_CLOSURE, reason);
  }
}

export const webSocketService = ({ input: context, self }: WebSocketActor) => {
  let socket: WebSocket | null = null;

  const handleConnectionError = (error: Error) => {
    const wsError = createWebSocketError(
      "Failed to establish WebSocket connection",
      error,
      {
        url: context.url,
        connectionAttempts: context.state.connectionAttempts,
        totalErrors: context.metrics.totalErrors + 1,
        consecutiveErrors: context.metrics.consecutiveErrors + 1,
        readyState: socket?.readyState ?? WebSocket.CLOSED,
        socket,
      }
    );

    self.send({
      type: "ERROR",
      error: wsError,
      timestamp: Date.now(),
    });
  };

  const handleSocketError = (event: WebSocketErrorType) => {
    const wsError = createWebSocketError(
      "WebSocket encountered an error",
      event.error || new Error("WebSocket error occurred"),
      {
        url: context.url,
        connectionAttempts: context.state.connectionAttempts,
        totalErrors: context.metrics.totalErrors + 1,
        consecutiveErrors: context.metrics.consecutiveErrors + 1,
        lastSuccessfulConnection: context.metrics.lastSuccessfulConnection,
        readyState: socket?.readyState ?? WebSocket.CLOSED,
        socket,
      }
    );

    self.send({
      type: "ERROR",
      error: wsError,
      timestamp: Date.now(),
    });
  };

  const handleClose = (event: WebSocketCloseType) => {
    const wsError = createWebSocketError(
      "WebSocket connection closed",
      new Error(event.reason || "Connection closed"),
      {
        closeCode: event.code,
        closeReason: event.reason,
        wasClean: event.wasClean,
        url: context.url,
        totalErrors: context.metrics.totalErrors,
        consecutiveErrors: context.metrics.consecutiveErrors,
        connectionAttempts: context.state.connectionAttempts,
        readyState: socket?.readyState ?? WebSocket.CLOSED,
        socket,
      }
    );

    self.send({
      type: "CLOSE",
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
      error: wsError,
    });
  };

  const connect = async () => {
    try {
      socket = await retryWithBackoff(async () => {
        // Convert readonly array to mutable
        const protocols = context.protocols ? Array.from(context.protocols) : undefined;
        const ws = new WebSocket(context.url, protocols);

        return new Promise<WebSocket>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("Connection timeout"));
          }, context.options.connectionTimeout);

          ws.onopen = function (this: WebSocket) {
            clearTimeout(timeout);
            resolve(ws);
          };

          ws.onerror = function (this: WebSocket, event: Event) {
            reject(new Error("Connection failed"));
          };
        });
      }, context);

      if (socket) {
        socket.onmessage = function (this: WebSocket, ev: MessageEvent) {
          self.send({
            type: "MESSAGE",
            data: ev.data,
            timestamp: Date.now(),
          });
        };

        socket.onerror = function (this: WebSocket, event: Event) {
          handleSocketError(event);
        };

        socket.onclose = handleClose;
      }

      self.send({ type: "OPEN", timestamp: Date.now() });
    } catch (error) {
      handleConnectionError(error as Error);
    }
  };

  connect();

  return () => {
    if (socket) {
      cleanupWebSocket(socket);
    }
  };
};

export const pingService = ({ input: context, self }: WebSocketActor) => {
  const interval = setInterval(() => {
    if (context.socket?.readyState === WebSocket.OPEN) {
      self.send({
        type: "PING",
        timestamp: Date.now(),
      });
    }
  }, context.options.pingInterval);

  return () => clearInterval(interval);
};

export const services = {
  webSocketService,
  pingService,
} as const;

```

### states.ts

```typescript
/**
 * @fileoverview WebSocket state machine states
 * @module @qi/core/network/websocket/states
 */

import { CONNECTION_STATES } from "./constants.js";

export const states = {
  [CONNECTION_STATES.DISCONNECTED]: {
    on: {
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: "prepareConnection",
      },
    },
  },

  [CONNECTION_STATES.CONNECTING]: {
    invoke: {
      src: "webSocketService",
      onError: {
        target: CONNECTION_STATES.RECONNECTING,
        actions: "handleError",
      },
    },
    on: {
      OPEN: {
        target: CONNECTION_STATES.CONNECTED,
        actions: "handleOpen",
      },
      ERROR: [
        {
          target: CONNECTION_STATES.RECONNECTING,
          guard: "canReconnect",
          actions: "handleError",
        },
      ],
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["handleClose", "cleanup"],
      },
    },
  },

  [CONNECTION_STATES.CONNECTED]: {
    invoke: {
      src: "pingService",
    },
    on: {
      SEND: {
        guard: "canSendMessage",
        actions: "enqueueMessage",
      },
      MESSAGE: {
        actions: "handleMessage",
      },
      ERROR: {
        target: CONNECTION_STATES.RECONNECTING,
        guard: "canReconnect",
        actions: "handleError",
      },
      CLOSE: {
        target: CONNECTION_STATES.RECONNECTING,
        guard: "canReconnect",
        actions: "handleClose",
      },
      DISCONNECT: {
        target: CONNECTION_STATES.DISCONNECTING,
      },
    },
  },

  [CONNECTION_STATES.RECONNECTING]: {
    on: {
      RETRY: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canReconnect",
      },
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: "prepareConnection",
      },
    },
  },

  [CONNECTION_STATES.DISCONNECTING]: {
    on: {
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["handleClose", "cleanup"],
      },
    },
  },
} as const;

```

### types.ts

```typescript
/**
 * @fileoverview WebSocket type definitions
 * @module @qi/core/network/websocket/types
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-19
 */

import { NetworkErrorContext } from "../../errors.js";
import { ApplicationError } from "@qi/core/errors";
import {
  CONNECTION_STATES,
  DEFAULT_CONFIG,
  WS_CLOSE_CODES,
} from "./constants.js";

// === 1. Base Types ===

/**
 * Connection state type derived from constants
 */
export type ConnectionState =
  (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];

/**
 * WebSocket connection configuration options
 */
export interface ConnectionOptions {
  readonly reconnect: boolean;
  readonly maxReconnectAttempts: number;
  readonly reconnectInterval: number;
  readonly reconnectBackoffRate: number;
  readonly connectionTimeout: number;
  readonly pingInterval: number;
  readonly pongTimeout: number;
  readonly messageQueueSize: number;
  readonly messageTimeout: number;
  readonly rateLimit: {
    readonly messages: number;
    readonly window: number;
  };
}

/**
 * Message in the send queue
 */
export interface QueuedMessage {
  readonly id: string;
  readonly data: unknown;
  readonly timestamp: number;
  readonly attempts: number;
  readonly timeout?: number;
  readonly priority: "high" | "normal";
}

// === 2. Error Types ===

/**
 * WebSocket-specific error context
 */
export interface WebSocketErrorContext extends NetworkErrorContext {
  readonly socket?: WebSocket | null;
  readonly connectionAttempts: number;
  readonly lastError?: Error;
  readonly closeCode?: number;
  readonly closeReason?: string;
  readonly lastSuccessfulConnection?: number;
  readonly totalErrors: number;
  readonly consecutiveErrors: number;
  readonly retryDelay?: number;
}

/**
 * WebSocket specific error
 */
export interface WebSocketError extends ApplicationError {
  readonly statusCode: number;
  readonly code: number;
  readonly details?: WebSocketErrorContext;
}

/**
 * Error record for tracking
 */
export interface ErrorRecord {
  readonly timestamp: number;
  readonly error: Error;
  readonly attempt?: number;
  readonly context?: string;
}

// === 3. Context and Metrics ===

/**
 * WebSocket metrics tracking
 */
export interface WebSocketMetrics {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly bytesReceived: number;
  readonly bytesSent: number;
  readonly messageTimestamps: readonly number[];
  readonly totalErrors: number;
  readonly consecutiveErrors: number;
  readonly lastSuccessfulConnection: number;
  readonly errors: readonly ErrorRecord[];
}

/**
 * Core WebSocket context
 */
export interface WebSocketContext {
  readonly url: string;
  readonly protocols: readonly string[];
  readonly socket: WebSocket | null;
  readonly status: ConnectionState;
  readonly readyState: number;
  readonly options: Required<ConnectionOptions>;
  readonly state: {
    readonly connectionAttempts: number;
    readonly lastConnectTime: number;
    readonly lastDisconnectTime: number;
    readonly lastError: Error | null;
    readonly lastMessageTime: number;
    readonly lastErrorTime: number;
  };
  readonly metrics: WebSocketMetrics;
  readonly queue: {
    readonly messages: readonly QueuedMessage[];
    readonly pending: boolean;
    readonly lastProcessed: number;
  };
}

// === 4. Event Types ===

/**
 * WebSocket events union type
 */
export type WebSocketEvents =
  | {
      readonly type: "CONNECT";
      readonly url: string;
      readonly protocols?: string[];
      readonly options?: Partial<ConnectionOptions>;
    }
  | {
      readonly type: "DISCONNECT";
      readonly code?: number;
      readonly reason?: string;
    }
  | { readonly type: "OPEN"; readonly timestamp: number }
  | {
      readonly type: "CLOSE";
      readonly code: number;
      readonly reason: string;
      readonly wasClean: boolean;
      readonly error?: WebSocketError;
    }
  | {
      readonly type: "ERROR";
      readonly error: WebSocketError;
      readonly timestamp: number;
      readonly attempt?: number;
    }
  | {
      readonly type: "MESSAGE";
      readonly data: unknown;
      readonly timestamp: number;
      readonly id?: string;
    }
  | {
      readonly type: "SEND";
      readonly data: unknown;
      readonly id?: string;
      readonly options?: { readonly priority: "high" | "normal" };
    }
  | { readonly type: "PING"; readonly timestamp: number }
  | {
      readonly type: "PONG";
      readonly latency: number;
      readonly timestamp: number;
    }
  | {
      readonly type: "RETRY";
      readonly attempt: number;
      readonly delay: number;
    };

/**
 * WebSocket machine type helper
 */
export type WebSocketMachine = {
  context: WebSocketContext;
  events: WebSocketEvents;
};

/**
 * WebSocket actor type for services
 */
export interface WebSocketActor {
  input: WebSocketContext;
  self: {
    send: (event: WebSocketEvents) => void;
  };
}

```

### utils.ts

```typescript
/**
 * @fileoverview WebSocket utility functions
 * @module @qi/core/network/websocket/utils
 */

import { logger } from "@qi/core/logger";
import { HttpStatusCode } from "../../errors.js";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
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
  context: WebSocketErrorContext
): WebSocketError {
  const statusCode = mapWebSocketErrorToStatus(originalError);
  const timestamp = Date.now();

  // Create error by extending ApplicationError with proper ErrorCode
  const error = new ApplicationError(
    message,
    ErrorCode.WEBSOCKET_ERROR, // Use proper enum value
    statusCode,
    {
      ...context,
      error: originalError,
      readyState: context.socket?.readyState ?? WebSocket.CLOSED,
      timestamp,
    }
  ) as WebSocketError;

  logger.error(`WebSocket Error: ${message}`, {
    error,
    context,
    stackTrace: originalError.stack,
  });

  return error;
}

/**
 * Maps common WebSocket errors to HTTP status codes
 */
function mapWebSocketErrorToStatus(
  error: Error
): (typeof HttpStatusCode)[keyof typeof HttpStatusCode] {
  switch (error.name) {
    case "SecurityError":
      return HttpStatusCode.WEBSOCKET_POLICY_VIOLATION;
    case "InvalidStateError":
      return HttpStatusCode.WEBSOCKET_INVALID_FRAME;
    case "SyntaxError":
      return HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR;
    case "NetworkError":
      return HttpStatusCode.SERVICE_UNAVAILABLE;
    default:
      return HttpStatusCode.WEBSOCKET_INTERNAL_ERROR;
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
  return (
    error.statusCode !== HttpStatusCode.WEBSOCKET_POLICY_VIOLATION &&
    error.statusCode !== HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR &&
    error.statusCode !== HttpStatusCode.WEBSOCKET_INVALID_FRAME
  );
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
    (t) => t >= windowStart
  );

  return recentMessages.length < messages;
}

// Add retryWithBackoff implementation
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  context: {
    options: {
      reconnectInterval: number;
      reconnectBackoffRate: number;
    };
    state: {
      connectionAttempts: number;
    };
  }
): Promise<T> {
  const delay = context.options.reconnectInterval * 
    Math.pow(context.options.reconnectBackoffRate, context.state.connectionAttempts - 1);
  
  await new Promise(resolve => setTimeout(resolve, delay));
  return operation();
}

export const utils = {
  createWebSocketError,
  calculateBackoffDelay,
  isRecoverableError,
  validateConnectionParams,
  checkRateLimit,
} as const;

```

### websocket-states.ts

```typescript
/**
 * @fileoverview
 * @module websocket-states.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-18
 * @modified 2024-12-18
 */

// qi/core/src/networks/websocket/machine/websocket-states.ts

export type WebSocketReadyState = 0 | 1 | 2 | 3;

export const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export const isWebSocketOpen = (readyState: number): boolean =>
  readyState === WebSocketStates.OPEN;

export default WebSocketStates;
```

