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
 * @modified 2024-12-18
 */

import { assign, type AnyEventObject } from "xstate";
import type { WebSocketContext, WebSocketEvent } from "./types.js";
import { logger } from "@qi/core/logger";

type AssignAction = (
  context: WebSocketContext,
  event: WebSocketEvent | AnyEventObject
) => Partial<WebSocketContext>;

// Connection Management
export const establishConnection: AssignAction = assign((context, event) => {
  if (event.type !== "CONNECT") return {};
  return {
    socket: new WebSocket(event.url, event.protocols || []),
    url: event.url,
    state: {
      ...context.state,
      connectionAttempts: context.state.connectionAttempts + 1,
      lastConnectTime: Date.now(),
    },
  };
});

// Message Handling
export const enqueueMessage: AssignAction = assign((context, event) => {
  if (event.type !== "SEND") return {};
  return {
    queue: {
      ...context.queue,
      messages: [
        ...context.queue.messages,
        {
          id: crypto.randomUUID(),
          data: event.data,
          timestamp: Date.now(),
          attempts: 0,
          priority: "normal",
        },
      ],
    },
  };
});

// Health Checks
export const sendPing: AssignAction = assign((context) => ({
  state: {
    ...context.state,
    lastPingTime: Date.now(),
  },
}));

// Error Handling
export const recordError: AssignAction = assign((context, event) => {
  if (event.type !== "ERROR") return {};
  return {
    state: {
      ...context.state,
      lastError: event.error,
      errors: [
        ...context.errors,
        {
          timestamp: Date.now(),
          error: event.error,
        },
      ],
    },
  };
});

// Metrics
export const updateMetrics: AssignAction = assign((context, event) => {
  if (event.type !== "MESSAGE") return {};
  const now = Date.now();
  const messageSize =
    typeof event.data === "string" ? new Blob([event.data]).size : 0;

  return {
    metrics: {
      ...context.metrics,
      messagesReceived: context.metrics.messagesReceived + 1,
      bytesReceived: context.metrics.bytesReceived + messageSize,
      lastMessageTime: now,
      messageTimestamps: [...context.metrics.messageTimestamps, now].slice(-100),
    },
  };
});

// State Management
export const resetState: AssignAction = assign(() => ({
  state: {
    connectionAttempts: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    lastError: null,
    lastMessageTime: 0,
  },
  metrics: {
    messagesReceived: 0,
    messagesSent: 0,
    bytesReceived: 0,
    bytesSent: 0,
    messageTimestamps: [],
  },
  errors: [],
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0,
  },
}));

export const storeUrl: AssignAction = assign((context, event) => {
  if (event.type !== "CONNECT") return {};
  return { url: event.url };
});

export const bindSocketEvents: AssignAction = assign((context) => {
  if (!context.socket) return {};

  context.socket.onmessage = (event) => {
    logger.info("Received message", event.data);
  };
  context.socket.onerror = (error) => {
    logger.error("Socket error", error);
  };
  context.socket.onclose = () => {
    logger.info("Socket closed");
  };

  return {};
});

export const cleanupOnFailure: AssignAction = assign((context) => {
  if (context.socket) {
    context.socket.onmessage = null;
    context.socket.onerror = null;
    context.socket.onclose = null;
  }
  return {};
});

export const startHeartbeat: AssignAction = assign(() => ({}));
export const stopHeartbeat: AssignAction = assign(() => ({}));
export const processQueue: AssignAction = assign(() => ({}));
export const handleMessage: AssignAction = assign(() => ({}));
export const handlePong: AssignAction = assign(() => ({}));

export const initiateClose: AssignAction = assign((context) => {
  if (context.socket) {
    context.socket.close();
  }
  return {};
});

export const logClosure: AssignAction = assign(() => ({}));
export const logDisconnection: AssignAction = assign(() => ({}));
export const calculateBackoff: AssignAction = assign(() => ({}));
export const clearBackoff: AssignAction = assign(() => ({}));

export const incrementRetryCounter: AssignAction = assign((context) => ({
  state: {
    ...context.state,
    connectionAttempts: context.state.connectionAttempts + 1,
  },
}));

export const updateRateLimitState: AssignAction = assign(() => ({}));
export const clearRateLimitState: AssignAction = assign(() => ({}));
export const logMaxRetries: AssignAction = assign(() => ({}));
export const logSuspension: AssignAction = assign(() => ({}));

export const resetRetries: AssignAction = assign((context) => ({
  state: {
    ...context.state,
    connectionAttempts: 0,
  },
}));

export const updateConnectionState: AssignAction = assign((context) => ({
  state: {
    ...context.state,
    lastConnectTime: Date.now(),
  },
}));

export const actions = {
  establishConnection,
  enqueueMessage,
  sendPing,
  recordError,
  updateMetrics,
  resetState,
  storeUrl,
  bindSocketEvents,
  cleanupOnFailure,
  startHeartbeat,
  stopHeartbeat,
  processQueue,
  handleMessage,
  handlePong,
  initiateClose,
  logClosure,
  logDisconnection,
  calculateBackoff,
  clearBackoff,
  incrementRetryCounter,
  updateRateLimitState,
  clearRateLimitState,
  logMaxRetries,
  logSuspension,
  resetRetries,
  updateConnectionState,
};
```

### constants.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Constants
 * Default values and configuration constants
 */

// qi/core/src/networks/websocket/machine/constants.ts

// Default connection configuration
export const DEFAULT_CONFIG = {
  // Reconnection settings
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,

  // Health check settings
  pingInterval: 30000,
  pongTimeout: 5000,

  // Message handling
  messageQueueSize: 100,
  messageTimeout: 5000,

  // Rate limiting
  rateLimit: {
    messages: 100,
    window: 1000,
  },
} as const;

// WebSocket close codes
export const WS_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015,
} as const;

// Timing constants
export const TIMING = {
  MIN_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 30000,
  DEFAULT_PING_INTERVAL: 30000,
  DEFAULT_PONG_TIMEOUT: 5000,
  RATE_LIMIT_WINDOW: 1000,
} as const;

// Maximum values
export const LIMITS = {
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  MAX_QUEUE_SIZE: 1000,
  MAX_RETRY_ATTEMPTS: 10,
  MAX_ERROR_HISTORY: 100,
  MAX_LATENCY_SAMPLES: 50,
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  INVALID_URL: "Invalid WebSocket URL provided",
  CONNECTION_TIMEOUT: "Connection attempt timed out",
  MAX_RETRIES_EXCEEDED: "Maximum reconnection attempts exceeded",
  RATE_LIMIT_EXCEEDED: "Message rate limit exceeded",
  QUEUE_FULL: "Message queue is full",
  INVALID_STATE: "Invalid state transition attempted",
  PONG_TIMEOUT: "WebSocket pong response timeout",
  MESSAGE_TOO_LARGE: "Message exceeds maximum size limit",
} as const;

export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTING: "disconnecting",
  RECONNECTING: "reconnecting",
  BACKING_OFF: "backingOff",
  RATE_LIMITED: "rateLimited",
  SUSPENDED: "suspended",
} as const;
```

### guards.ts

```typescript
// src/networks/websocket/machine/guards.ts
import type { WebSocketContext, WebSocketEvent } from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";
import { isWebSocketOpen } from "./websocket-states.js";

type ConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTING"
  | "RECONNECTING"
  | "BACKING_OFF"
  | "RATE_LIMITED"
  | "SUSPENDED";

const validTransitions: Record<ConnectionState, ConnectionState[]> = {
  DISCONNECTED: ["CONNECTING"],
  CONNECTING: ["CONNECTED", "DISCONNECTED", "RECONNECTING"],
  CONNECTED: ["DISCONNECTING", "RECONNECTING"],
  RECONNECTING: ["CONNECTING", "DISCONNECTED", "BACKING_OFF"],
  DISCONNECTING: ["DISCONNECTED"],
  BACKING_OFF: ["CONNECTING", "DISCONNECTED"],
  RATE_LIMITED: ["CONNECTED", "DISCONNECTED"],
  SUSPENDED: ["CONNECTING"],
};

type GuardParams = {
  context: WebSocketContext;
  event: WebSocketEvent;
};

// Individual exports for commonly used guards
export const isWithinRetryLimit = ({ context }: GuardParams): boolean => {
  const maxAttempts = context.options?.maxReconnectAttempts || DEFAULT_CONFIG.maxReconnectAttempts;
  return context.state.connectionAttempts < maxAttempts;
};

export const isRateLimitCleared = ({ context }: GuardParams): boolean => {
  const { rateLimit } = context.options || DEFAULT_CONFIG;
  const now = Date.now();
  const recentMessages = context.metrics.messageTimestamps.filter(
    t => now - t <= rateLimit.window
  );
  return recentMessages.length < rateLimit.messages;
};

// Type for the guard factory return type
type TransitionGuard = (params: GuardParams) => boolean;

// Guards object with all implementations
export const guards = {
  canInitiateConnection: ({ context }: GuardParams): boolean => {
    if (!context.url) return false;

    try {
      const url = new URL(context.url);
      return (
        ["ws:", "wss:"].includes(url.protocol) &&
        (!context.socket || context.socket.readyState === WebSocket.CLOSED)
      );
    } catch {
      return false;
    }
  },

  canReconnect: ({ context }: GuardParams): boolean => {
    const maxAttempts =
      context.options?.maxReconnectAttempts ||
      DEFAULT_CONFIG.maxReconnectAttempts;
    const shouldReconnect = context.options?.reconnect !== false;
    const withinLimits = context.state.connectionAttempts < maxAttempts;
    const hasValidUrl = Boolean(context.url);

    return shouldReconnect && withinLimits && hasValidUrl;
  },

  canSendMessage: ({ context }: GuardParams): boolean => {
    if (!context.socket || !isWebSocketOpen(context.socket.readyState)) {
      return false;
    }

    // Check rate limiting
    const { rateLimit } = context.options || DEFAULT_CONFIG;
    const now = Date.now();
    const recentMessages = context.metrics.messageTimestamps.filter(
      (t) => now - t <= rateLimit.window
    );

    return recentMessages.length < rateLimit.messages;
  },

  // Factory function for transition guards
  canTransitionTo: (targetState: ConnectionState): TransitionGuard => 
    ({ context }) => validTransitions[context.status]?.includes(targetState) ?? false,

  isWithinRetryLimit,
  isRateLimitCleared,
} satisfies Record<string, TransitionGuard | ((state: ConnectionState) => TransitionGuard)>;
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
import type { WebSocketContext, WebSocketEvent } from "./types.js";
import { actions } from "./actions.js";
import { guards } from "./guards.js";
import { states } from "./states.js";
import { DEFAULT_CONFIG } from "./constants.js";
import { WebSocketStates } from "./websocket-states.js";

const initialContext: WebSocketContext = {
  socket: null,
  url: "",
  protocols: [],
  options: DEFAULT_CONFIG,
  status: "DISCONNECTED",
  readyState: WebSocketStates.CLOSED,
  state: {
    connectionAttempts: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    lastError: null,
    lastMessageTime: 0,
  },
  lastPingTime: 0,
  lastPongTime: 0,
  latency: [],
  messageCount: 0,
  windowStart: Date.now(),
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0,
  },
  metrics: {
    messagesSent: 0,
    messagesReceived: 0,
    bytesReceived: 0,
    bytesSent: 0,
    messageTimestamps: [],
  },
  errors: [],
};

export const webSocketMachine = createMachine(
  {
    id: "webSocket",
    initial: "disconnected",
    context: initialContext,
    states,
  },
  {
    actions: actions as any, // Temporary type assertion while we fix action types
    guards: guards as any, // Temporary type assertion while we fix guard types
  }
);
```

### states.ts

```typescript
// qi/core/src/networks/websocket/machine/states.ts

import type { WebSocketContext, WebSocketEvent } from "./types.js";
import { CONNECTION_STATES } from "./constants.js";
import type { actions } from "./actions.js";

// Type for state machine configuration with proper typing
type StateConfig = {
  [K in (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES]]: {
    entry?: Array<keyof typeof actions>;
    exit?: Array<keyof typeof actions>;
    on?: {
      [E in WebSocketEvent["type"]]?:
        | {
            target?: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
            guard?: keyof typeof import("./guards.js").guards;
            actions?: Array<keyof typeof actions>;
          }
        | Array<{
            target: (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];
            guard?: keyof typeof import("./guards.js").guards;
            actions?: Array<keyof typeof actions>;
          }>;
    };
  };
};

export const states: StateConfig = {
  disconnected: {
    on: {
      CONNECT: {
        target: "connecting",
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },

  connecting: {
    entry: ["bindSocketEvents"],
    exit: ["cleanupOnFailure"],
    on: {
      OPEN: {
        target: "connected",
        actions: ["resetRetries", "updateConnectionState", "startHeartbeat"],
      },
      ERROR: [
        {
          target: "reconnecting",
          guard: "canReconnect",
          actions: ["recordError", "incrementRetryCounter"],
        },
        {
          target: "disconnected",
          actions: ["recordError", "resetState"],
        },
      ],
      CLOSE: {
        target: "disconnected",
        actions: ["logClosure", "resetState"],
      },
    },
  },

  connected: {
    entry: ["startHeartbeat", "processQueue"],
    exit: ["stopHeartbeat"],
    on: {
      SEND: {
        guard: "canSendMessage",
        actions: ["enqueueMessage", "processQueue"],
      },
      MESSAGE: {
        actions: ["handleMessage", "updateMetrics"],
      },
      PING: {
        actions: ["sendPing"],
      },
      PONG: {
        actions: ["handlePong"],
      },
      ERROR: [
        {
          target: "reconnecting",
          guard: "canReconnect",
          actions: ["recordError", "incrementRetryCounter"],
        },
        {
          target: "disconnected",
          actions: ["recordError", "resetState"],
        },
      ],
      DISCONNECT: {
        target: "disconnecting",
        actions: ["initiateClose"],
      },
    },
  },

  reconnecting: {
    entry: ["calculateBackoff"],
    exit: ["clearBackoff"],
    on: {
      RETRY: {
        target: "connecting",
        guard: "isWithinRetryLimit",
        actions: ["establishConnection"],
      },
      MAX_RETRIES: {
        target: "disconnected",
        actions: ["logMaxRetries", "resetState"],
      },
      CONNECT: {
        target: "connecting",
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },

  disconnecting: {
    entry: ["initiateClose"],
    exit: ["resetState"],
    on: {
      CLOSE: {
        target: "disconnected",
        actions: ["logDisconnection"],
      },
    },
  },

  backingOff: {
    on: {
      RETRY: {
        target: "connecting",
        guard: "isWithinRetryLimit",
        actions: ["establishConnection"],
      },
      MAX_RETRIES: {
        target: "disconnected",
        actions: ["logMaxRetries", "resetState"],
      },
    },
  },

  rateLimited: {
    entry: ["updateRateLimitState"],
    exit: ["clearRateLimitState"],
    on: {
      RETRY: {
        target: "connected",
        guard: "isRateLimitCleared",
      },
    },
  },

  suspended: {
    entry: ["logSuspension"],
    on: {
      CONNECT: {
        target: "connecting",
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },
} as const;

```

### types.ts

```typescript
// qi/core/src/networks/websocket/machine/types.ts

import { CONNECTION_STATES, WS_CLOSE_CODES, DEFAULT_CONFIG } from "./constants.js";

// Connection States
export type ConnectionState = keyof typeof CONNECTION_STATES;

// Connection Options
export interface ConnectionOptions {
  // Reconnection settings
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;

  // Health check settings
  pingInterval: number;
  pongTimeout: number;

  // Message handling
  messageQueueSize: number;
  messageTimeout: number;

  // Rate limiting
  rateLimit: {
    messages: number;
    window: number;
  };
}

// Message-related types
export interface QueuedMessage {
  id: string;
  data: unknown;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: "high" | "normal";
}

export interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

export interface WebSocketMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  messageTimestamps: number[];
  lastMessageTime?: number;
}

// WebSocket Context
export interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  readyState: number;
  options: Required<ConnectionOptions>;

  // State tracking
  state: {
    connectionAttempts: number;
    lastConnectTime: number;
    lastDisconnectTime: number;
    lastError: Error | null;
    lastMessageTime: number;
  };

  // Message Queue
  queue: {
    messages: QueuedMessage[];
    pending: boolean;
    lastProcessed: number;
  };

  // Metrics
  metrics: WebSocketMetrics;

  // Health Check
  lastPingTime: number;
  lastPongTime: number;
  latency: number[];

  // Error tracking
  errors: ErrorRecord[];

  // Rate Limiting
  messageCount: number;
  windowStart: number;
}

// Event Types
export type WebSocketEvent =
  | {
      type: "CONNECT";
      url: string;
      protocols?: string[];
      options?: Partial<ConnectionOptions>;
      timestamp: number;
    }
  | { type: "DISCONNECT"; code?: number; reason?: string; timestamp: number }
  | { type: "OPEN"; event: Event; timestamp: number }
  | {
      type: "CLOSE";
      code: (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES];
      reason: string;
      wasClean: boolean;
      timestamp: number;
    }
  | { type: "ERROR"; error: Error; timestamp: number; attempt?: number }
  | { type: "MESSAGE"; data: unknown; timestamp: number; id?: string }
  | {
      type: "SEND";
      data: unknown;
      id?: string;
      timestamp: number;
      options?: { priority: "high" | "normal" };
    }
  | { type: "RETRY"; attempt: number; delay: number; timestamp: number }
  | {
      type: "MAX_RETRIES";
      attempts: number;
      lastError?: Error;
      timestamp: number;
    }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number };

// Default configuration type assert
export type DefaultConfig = typeof DEFAULT_CONFIG;

```

### websocket-states.ts

```typescript
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

