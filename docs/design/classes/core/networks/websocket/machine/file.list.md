You're right. Let me provide a complete set of updated files based on XState v5. 

### `constants.ts`

```typescript
// constants.ts
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

export const TIMING = {
  MIN_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 30000,
  DEFAULT_PING_INTERVAL: 30000,
  DEFAULT_PONG_TIMEOUT: 5000,
  RATE_LIMIT_WINDOW: 1000,
} as const;

export const LIMITS = {
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  MAX_QUEUE_SIZE: 1000,
  MAX_RETRY_ATTEMPTS: 10,
  MAX_ERROR_HISTORY: 100,
  MAX_LATENCY_SAMPLES: 50,
} as const;

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

export const DEFAULT_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,
  pingInterval: 30000,
  pongTimeout: 5000,
  messageQueueSize: 100,
  messageTimeout: 5000,
  rateLimit: {
    messages: 100,
    window: 1000,
  },
} as const;
```

### `states.ts`

```typescript
// states.ts
import { CONNECTION_STATES } from "./constants.js";

export const states = {
  [CONNECTION_STATES.DISCONNECTED]: {
    on: {
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: ["storeUrl", "resetState", "establishConnection"],
      },
    },
  },

  [CONNECTION_STATES.CONNECTING]: {
    entry: "bindSocketEvents",
    exit: "cleanupOnFailure",
    on: {
      OPEN: {
        target: CONNECTION_STATES.CONNECTED,
        actions: ["resetRetries", "updateConnectionState"],
      },
      ERROR: [
        {
          target: CONNECTION_STATES.RECONNECTING,
          guard: "canReconnect",
          actions: ["recordError", "incrementRetryCounter"],
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["recordError", "resetState"],
        },
      ],
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["logClosure", "resetState"],
      },
    },
  },

  [CONNECTION_STATES.CONNECTED]: {
    entry: ["processQueue"],
    on: {
      SEND: {
        guard: ["canSendMessage", "hasValidQueue"],
        actions: ["enqueueMessage", "processQueue"],
      },
      MESSAGE: {
        actions: ["handleMessage", "updateMetrics"],
      },
      PING: {
        actions: "sendPing",
      },
      PONG: {
        actions: "handlePong",
      },
      ERROR: [
        {
          target: CONNECTION_STATES.RECONNECTING,
          guard: "canReconnect",
          actions: ["recordError", "incrementRetryCounter"],
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["recordError", "resetState"],
        },
      ],
      DISCONNECT: {
        target: CONNECTION_STATES.DISCONNECTING,
        actions: "initiateClose",
      },
    },
  },

  [CONNECTION_STATES.RECONNECTING]: {
    entry: "calculateBackoff",
    on: {
      RETRY: [
        {
          target: CONNECTION_STATES.CONNECTING,
          guard: "isWithinRetryLimit",
          actions: "establishConnection",
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["logMaxRetries", "resetState"],
        },
      ],
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: ["resetState", "establishConnection"],
      },
    },
  },

  [CONNECTION_STATES.DISCONNECTING]: {
    entry: "initiateClose",
    exit: "resetState",
    on: {
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: "logDisconnection",
      },
    },
  },

  [CONNECTION_STATES.BACKING_OFF]: {
    on: {
      RETRY: [
        {
          target: CONNECTION_STATES.CONNECTING,
          guard: "isWithinRetryLimit",
          actions: "establishConnection",
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["logMaxRetries", "resetState"],
        },
      ],
    },
  },

  [CONNECTION_STATES.RATE_LIMITED]: {
    entry: "updateRateLimitState",
    exit: "clearRateLimitState",
    on: {
      RETRY: {
        target: CONNECTION_STATES.CONNECTED,
        guard: "isRateLimitCleared",
      },
    },
  },

  [CONNECTION_STATES.SUSPENDED]: {
    entry: "logSuspension",
    on: {
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: ["resetState", "establishConnection"],
      },
    },
  },
} as const;
```

### `websocket-states.ts`

```typescript
// websocket-states.ts
export const WebSocketStates = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
} as const;

export type WebSocketReadyState = typeof WebSocketStates[keyof typeof WebSocketStates];

export function isWebSocketOpen(readyState: WebSocketReadyState): boolean {
  return readyState === WebSocketStates.OPEN;
}

export function isWebSocketClosed(readyState: WebSocketReadyState): boolean {
  return readyState === WebSocketStates.CLOSED;
}

export function isWebSocketClosing(readyState: WebSocketReadyState): boolean {
  return readyState === WebSocketStates.CLOSING;
}

export function isWebSocketConnecting(readyState: WebSocketReadyState): boolean {
  return readyState === WebSocketStates.CONNECTING;
}

export function getWebSocketStateString(readyState: WebSocketReadyState): string {
  switch (readyState) {
    case WebSocketStates.CONNECTING:
      return "CONNECTING";
    case WebSocketStates.OPEN:
      return "OPEN";
    case WebSocketStates.CLOSING:
      return "CLOSING";
    case WebSocketStates.CLOSED:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
}
```

### `types.ts`

```typescript
// types.ts
import { CONNECTION_STATES, WS_CLOSE_CODES, DEFAULT_CONFIG } from "./constants.js";

export type ConnectionState = keyof typeof CONNECTION_STATES;

export interface ConnectionOptions {
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;
  pingInterval: number;
  pongTimeout: number;
  messageQueueSize: number;
  messageTimeout: number;
  rateLimit: {
    messages: number;
    window: number;
  };
}

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

export interface WebSocketContext {
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  readyState: number;
  options: Required<ConnectionOptions>;
  state: {
    connectionAttempts: number;
    lastConnectTime: number;
    lastDisconnectTime: number;
    lastError: Error | null;
    lastMessageTime: number;
  };
  queue: {
    messages: QueuedMessage[];
    pending: boolean;
    lastProcessed: number;
  };
  metrics: WebSocketMetrics;
  lastPingTime: number;
  lastPongTime: number;
  latency: number[];
  errors: ErrorRecord[];
  messageCount: number;
  windowStart: number;
}

export type WebSocketEvents = 
  | { type: "CONNECT"; url: string; protocols?: string[]; options?: Partial<ConnectionOptions> }
  | { type: "DISCONNECT"; code?: number; reason?: string }
  | { type: "OPEN"; event: Event }
  | { type: "CLOSE"; code: (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES]; reason: string; wasClean: boolean }
  | { type: "ERROR"; error: Error; attempt?: number }
  | { type: "MESSAGE"; data: unknown; id?: string }
  | { type: "SEND"; data: unknown; id?: string; options?: { priority: "high" | "normal" } }
  | { type: "RETRY"; attempt: number; delay: number }
  | { type: "MAX_RETRIES"; attempts: number; lastError?: Error }
  | { type: "PING" }
  | { type: "PONG"; latency: number };
```

### `actions.ts`

```typescript
// actions.ts
import { logger } from "@qi/core/logger";
import type { WebSocketContext, WebSocketEvents } from "./types.js";
import { WS_CLOSE_CODES } from "./constants.js";

// Connection Management
export function establishConnection(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CONNECT" }>
) {
  const socket = new WebSocket(event.url, event.protocols || []);
  
  return {
    ...context,
    socket,
    url: event.url,
    state: {
      ...context.state,
      connectionAttempts: context.state.connectionAttempts + 1,
      lastConnectTime: Date.now(),
    },
    // Merge any provided options with current options
    options: event.options 
      ? { ...context.options, ...event.options }
      : context.options,
  };
}

export function storeUrl(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CONNECT" }>
) {
  return {
    ...context,
    url: event.url,
  };
}

// Socket Event Binding
export function bindSocketEvents(context: WebSocketContext) {
  if (!context.socket) return context;

  context.socket.onmessage = (event) => {
    logger.info("Received message", event.data);
  };
  
  context.socket.onerror = (error) => {
    logger.error("Socket error", error);
  };
  
  context.socket.onclose = (event) => {
    logger.info("Socket closed", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
  };

  return context;
}

export function cleanupOnFailure(context: WebSocketContext) {
  if (context.socket) {
    context.socket.onmessage = null;
    context.socket.onerror = null;
    context.socket.onclose = null;
    try {
      context.socket.close(WS_CLOSE_CODES.ABNORMAL_CLOSURE, "Cleaning up on failure");
    } catch (error) {
      logger.error("Error during socket cleanup", error);
    }
  }
  return context;
}

// Message Handling
export function enqueueMessage(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "SEND" }>
) {
  const maxQueueSize = context.options.messageQueueSize;
  if (context.queue.messages.length >= maxQueueSize) {
    logger.warn("Message queue full, dropping oldest message");
    context.queue.messages.shift(); // Remove oldest message
  }

  return {
    ...context,
    queue: {
      ...context.queue,
      messages: [
        ...context.queue.messages,
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

export function processQueue(context: WebSocketContext) {
  if (!context.socket || context.queue.pending || context.queue.messages.length === 0) {
    return context;
  }

  const messages = [...context.queue.messages];
  let processedCount = 0;
  const errors: Error[] = [];

  // Process high priority messages first
  const sortedMessages = messages.sort(
    (a, b) => (b.priority === "high" ? 1 : 0) - (a.priority === "high" ? 1 : 0)
  );

  for (const message of sortedMessages) {
    try {
      context.socket.send(JSON.stringify(message.data));
      processedCount++;
    } catch (error) {
      errors.push(error as Error);
      break;
    }
  }

  return {
    ...context,
    queue: {
      ...context.queue,
      messages: messages.slice(processedCount),
      lastProcessed: Date.now(),
      pending: false,
    },
    metrics: {
      ...context.metrics,
      messagesSent: context.metrics.messagesSent + processedCount,
    },
    errors: errors.length
      ? [...context.errors, ...errors.map(error => ({
          timestamp: Date.now(),
          error,
          context: "message_processing"
        }))]
      : context.errors,
  };
}

// Health Checks
export function sendPing(context: WebSocketContext) {
  if (context.socket && context.socket.readyState === WebSocket.OPEN) {
    try {
      context.socket.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
    } catch (error) {
      logger.error("Failed to send ping", error);
    }
  }

  return {
    ...context,
    lastPingTime: Date.now(),
  };
}

export function handlePong(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "PONG" }>
) {
  const latency = event.latency;
  const maxLatencySamples = 50; // Keep last 50 samples

  return {
    ...context,
    lastPongTime: Date.now(),
    latency: [...context.latency, latency].slice(-maxLatencySamples),
  };
}

// Error Handling
export function recordError(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "ERROR" }>
) {
  const maxErrors = 100; // Keep last 100 errors
  const newErrors = [
    ...context.errors,
    {
      timestamp: Date.now(),
      error: event.error,
      context: event.attempt ? `attempt_${event.attempt}` : undefined,
    },
  ].slice(-maxErrors);

  return {
    ...context,
    state: {
      ...context.state,
      lastError: event.error,
    },
    errors: newErrors,
  };
}

// Metrics
export function updateMetrics(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "MESSAGE" }>
) {
  const now = Date.now();
  const messageSize = typeof event.data === "string" 
    ? new Blob([event.data]).size 
    : 0;

  return {
    ...context,
    metrics: {
      ...context.metrics,
      messagesReceived: context.metrics.messagesReceived + 1,
      bytesReceived: context.metrics.bytesReceived + messageSize,
      lastMessageTime: now,
      messageTimestamps: [...context.metrics.messageTimestamps, now].slice(-100),
    },
  };
}

// State Management
export function resetState(context: WebSocketContext) {
  return {
    ...context,
    state: {
      connectionAttempts: 0,
      lastConnectTime: 0,
      lastDisconnectTime: 0,
      lastError: null,
      lastMessageTime: 0,
    },
    metrics: {
      messagesSent: 0,
      messagesReceived: 0,
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
  };
}

export function incrementRetryCounter(context: WebSocketContext) {
  return {
    ...context,
    state: {
      ...context.state,
      connectionAttempts: context.state.connectionAttempts + 1,
    },
  };
}

export function updateConnectionState(context: WebSocketContext) {
  return {
    ...context,
    state: {
      ...context.state,
      lastConnectTime: Date.now(),
    },
  };
}

// Connection Lifecycle
export function initiateClose(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "DISCONNECT" }>
) {
  if (context.socket) {
    try {
      context.socket.close(
        event.code || WS_CLOSE_CODES.NORMAL_CLOSURE,
        event.reason || "Client initiated closure"
      );
    } catch (error) {
      logger.error("Error during socket closure", error);
    }
  }
  return context;
}

export function calculateBackoff(context: WebSocketContext) {
  const backoffTime = Math.min(
    context.options.reconnectInterval * 
    Math.pow(context.options.reconnectBackoffRate, context.state.connectionAttempts),
    30000 // Max backoff of 30 seconds
  );
  
  return {
    ...context,
    state: {
      ...context.state,
      lastDisconnectTime: Date.now(),
    },
    backoffTime,
  };
}

// Export all actions
export const actions = {
  establishConnection,
  storeUrl,
  bindSocketEvents,
  cleanupOnFailure,
  enqueueMessage,
  processQueue,
  sendPing,
  handlePong,
  recordError,
  updateMetrics,
  resetState,
  incrementRetryCounter,
  updateConnectionState,
  initiateClose,
  calculateBackoff,
} as const;
```

### `guards.ts`

```typescript
// guards.ts
import type { WebSocketContext, WebSocketEvents } from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";
import { isWebSocketOpen } from "./websocket-states.js";

export function canInitiateConnection(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "CONNECT" }>
) {
  if (!event.url) return false;

  try {
    const url = new URL(event.url);
    return (
      ["ws:", "wss:"].includes(url.protocol) &&
      (!context.socket || context.socket.readyState === WebSocket.CLOSED)
    );
  } catch {
    return false;
  }
}

export function canReconnect(context: WebSocketContext) {
  const maxAttempts = context.options?.maxReconnectAttempts || DEFAULT_CONFIG.maxReconnectAttempts;
  const shouldReconnect = context.options?.reconnect !== false;
  const withinLimits = context.state.connectionAttempts < maxAttempts;
  const hasValidUrl = Boolean(context.url);

  return shouldReconnect && withinLimits && hasValidUrl;
}

export function canSendMessage(context: WebSocketContext) {
  if (!context.socket || !isWebSocketOpen(context.socket.readyState)) {
    return false;
  }

  const { rateLimit } = context.options || DEFAULT_CONFIG;
  const now = Date.now();
  const recentMessages = context.metrics.messageTimestamps.filter(
    (t) => now - t <= rateLimit.window
  );

  return recentMessages.length < rateLimit.messages;
}

export function isWithinRetryLimit(context: WebSocketContext) {
  const maxAttempts = context.options?.maxReconnectAttempts || DEFAULT_CONFIG.maxReconnectAttempts;
  return context.state.connectionAttempts < maxAttempts;
}

export function isRateLimitCleared(context: WebSocketContext) {
  const { rateLimit } = context.options || DEFAULT_CONFIG;
  const now = Date.now();
  const recentMessages = context.metrics.messageTimestamps.filter(
    (t) => now - t <= rateLimit.window
  );
  return recentMessages.length < rateLimit.messages;
}

export function hasValidQueue(context: WebSocketContext) {
  return (
    Array.isArray(context.queue.messages) &&
    context.queue.messages.length < context.options.messageQueueSize
  );
}

export const guards = {
  canInitiateConnection,
  canReconnect,
  canSendMessage,
  isWithinRetryLimit,
  isRateLimitCleared,
  hasValidQueue,
} as const;
```

### `machine.ts`

```typescript
// machine.ts
import { createMachine } from "xstate";
import type { WebSocketContext, WebSocketEvents } from "./types.js";
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

export const webSocketMachine = createMachine({
  id: "webSocket",
  initial: "disconnected",
  context: initialContext,
  states,
  types: {} as {
    context: WebSocketContext;
    events: WebSocketEvents;
  },
  // Enable dev tools for better debugging
  predictableActionArguments: true,
  preserveActionOrder: true,
}, {
  actions,
  guards,
  delays: {
    // Define any delay values used in the state machine
    RECONNECT_DELAY: (context: WebSocketContext) => 
      Math.min(
        context.options.reconnectInterval * 
        Math.pow(context.options.reconnectBackoffRate, context.state.connectionAttempts),
        30000
      ),
    PING_INTERVAL: (context: WebSocketContext) => context.options.pingInterval,
    PONG_TIMEOUT: (context: WebSocketContext) => context.options.pongTimeout,
  }
});

/**
 * Creates a new instance of the WebSocket state machine with optional custom configuration
 */
export function createWebSocketMachine(options?: Partial<WebSocketContext["options"]>) {
  return webSocketMachine.provide({
    context: {
      ...initialContext,
      options: options ? { ...DEFAULT_CONFIG, ...options } : DEFAULT_CONFIG,
    },
  });
}

// Type-safe event creators
export const webSocketEvents = {
  connect: (url: string, protocols?: string[], options?: Partial<ConnectionOptions>) => ({
    type: "CONNECT" as const,
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
  
  retry: (attempt: number, delay: number) => ({
    type: "RETRY" as const,
    attempt,
    delay,
  }),
} as const;

// Export type-safe hook creators if needed
export function createWebSocketHooks(machine: typeof webSocketMachine) {
  return {
    useWebSocket: () => {
      // Implementation for React/other framework hooks
      // This would be implemented based on the specific framework being used
    },
  };
}
```