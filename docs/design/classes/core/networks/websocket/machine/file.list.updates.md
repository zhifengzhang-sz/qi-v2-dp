# WebSocket Machine Module Implementation

## Directory Structure
```
qi/core/src/network/websocket/
├── constants.ts    
├── types.ts        
├── actions.ts      
├── guards.ts       
├── services.ts     
├── states.ts       
├── utils.ts
├── machine.ts      
└── index.ts        
```

Let me provide each file separately:

### 1. `constants.ts`
```typescript
/**
 * @fileoverview WebSocket constants and configuration
 * @module @qi/core/network/websocket/constants
 */

export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
} as const;

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

// Initial context state
export const INITIAL_CONTEXT = {
  url: "",
  protocols: [],
  socket: null,
  status: CONNECTION_STATES.DISCONNECTED,
  readyState: WebSocket.CLOSED,
  options: DEFAULT_CONFIG,
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
    totalErrors: 0,
    consecutiveErrors: 0,
    lastSuccessfulConnection: 0,
    errors: []
  },
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0
  }
} as const;
```

### 2. `types.ts`
```typescript
/**
 * @fileoverview WebSocket type definitions
 * @module @qi/core/network/websocket/types
 */

import { NetworkErrorContext } from "@qi/core/network/errors";
import { CONNECTION_STATES, DEFAULT_CONFIG } from "./constants";

export type ConnectionState = typeof CONNECTION_STATES[keyof typeof CONNECTION_STATES];

export interface ConnectionOptions {
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;
  connectionTimeout: number;
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
  attempt?: number;
  context?: string;
}

export interface WebSocketMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  messageTimestamps: number[];
  totalErrors: number;
  consecutiveErrors: number;
  lastSuccessfulConnection?: number;
  errors: ErrorRecord[];
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
  metrics: WebSocketMetrics;
  queue: {
    messages: QueuedMessage[];
    pending: boolean;
    lastProcessed: number;
  };
}

export interface WebSocketErrorContext extends NetworkErrorContext {
  connectionAttempts: number;
  lastError?: Error;
  closeCode?: number;
  closeReason?: string;
  lastSuccessfulConnection?: number;
  totalErrors: number;
  consecutiveErrors: number;
  retryDelay?: number;
}

export type WebSocketEvents =
  | { type: "CONNECT"; url: string; protocols?: string[]; options?: Partial<ConnectionOptions> }
  | { type: "DISCONNECT"; code?: number; reason?: string }
  | { type: "OPEN"; timestamp: number }
  | { type: "CLOSE"; code: number; reason: string; wasClean: boolean; error?: Error }
  | { type: "ERROR"; error: Error; timestamp: number; attempt?: number }
  | { type: "MESSAGE"; data: unknown; timestamp: number; id?: string }
  | { type: "SEND"; data: unknown; id?: string; options?: { priority: "high" | "normal" } }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number }
  | { type: "RETRY"; attempt: number; delay: number };

export type WebSocketServices = {
  webSocketService: (context: WebSocketContext) => (send: Sender) => Cleanup;
  pingService: (context: WebSocketContext) => (send: Sender) => Cleanup;
};

export type Cleanup = void | (() => void);
export type Sender = <E extends WebSocketEvents>(event: E) => void;
```

### 3. `utils.ts`
```typescript
/**
 * @fileoverview WebSocket utility functions
 * @module @qi/core/network/websocket/utils
 */

import { logger } from "@qi/core/logger";
import { retryOperation, formatJsonWithColor } from "@qi/core/utils";
import { createNetworkError, HttpStatusCode, mapWebSocketErrorToStatus } from "@qi/core/network/errors";
import type { WebSocketContext, WebSocketErrorContext, WebSocketError } from "./types";

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
      readyState: context.socket?.readyState,
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
    30000
  );
}
```

### 4. `actions.ts`
```typescript
/**
 * @fileoverview WebSocket state machine actions
 * @module @qi/core/network/websocket/actions
 */

import { logger } from "@qi/core/logger";
import type { WebSocketContext, WebSocketEvents } from "./types";

export const actions = {
  prepareConnection: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "CONNECT" }>
  ) => ({
    ...context,
    url: event.url,
    protocols: event.protocols || [],
    options: { ...context.options, ...event.options },
    state: {
      ...context.state,
      connectionAttempts: 0
    }
  }),

  handleOpen: (context: WebSocketContext) => {
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
  },

  handleError: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "ERROR" }>
  ) => ({
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
  }),

  handleMessage: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "MESSAGE" }>
  ) => ({
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
  }),

  enqueueMessage: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "SEND" }>
  ) => {
    if (context.queue.messages.length >= context.options.messageQueueSize) {
      logger.warn("Message queue full, dropping oldest message");
      context.queue.messages.shift();
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
            priority: event.options?.priority ?? "normal"
          }
        ]
      }
    };
  },

  handleClose: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "CLOSE" }>
  ) => {
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
  },

  cleanup: (context: WebSocketContext) => ({
    ...context,
    socket: null,
    queue: {
      messages: [],
      pending: false,
      lastProcessed: 0
    }
  })
};
```

### 5. `guards.ts`
```typescript
/**
 * @fileoverview WebSocket state machine guards
 * @module @qi/core/network/websocket/guards
 */

import { logger } from "@qi/core/logger";
import { formatJsonWithColor } from "@qi/core/utils";
import type { WebSocketContext, WebSocketEvents, WebSocketError } from "./types";
import { isRecoverableError } from "./utils";

export const guards = {
  canInitiateConnection: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "CONNECT" }>
  ) => {
    if (!event.url) {
      logger.error("Invalid WebSocket URL", { url: event.url });
      return false;
    }

    try {
      const url = new URL(event.url);
      const validProtocol = ["ws:", "wss:"].includes(url.protocol);
      const validState = !context.socket || context.socket.readyState === WebSocket.CLOSED;

      if (!validProtocol) {
        logger.error("Invalid WebSocket protocol", { protocol: url.protocol });
      }

      return validProtocol && validState;
    } catch (error) {
      logger.error("URL parsing failed", { error });
      return false;
    }
  },

  canReconnect: (
    context: WebSocketContext,
    event: Extract<WebSocketEvents, { type: "ERROR" }>
  ) => {
    if (!context.options.reconnect) {
      logger.debug("Reconnection disabled by configuration", {
        context: formatJsonWithColor(context.options)
      });
      return false;
    }

    if (context.state.connectionAttempts >= context.options.maxReconnectAttempts) {
      logger.warn("Maximum reconnection attempts reached", {
        attempts: context.state.connectionAttempts,
        maxAttempts: context.options.maxReconnectAttempts
      });
      return false;
    }

    const error = event.error as WebSocketError;
    const canRetry = isRecoverableError(error);

    logger.debug("Reconnection evaluation", {
      canRetry,
      error: error.message,
      attempts: context.state.connectionAttempts,
      consecutiveErrors: context.metrics.consecutiveErrors
    });

    return canRetry;
  },

  shouldThrottle: (context: WebSocketContext) => {
    const { consecutiveErrors } = context.metrics;
    const timeSinceLastError = Date.now() - (context.state.lastErrorTime || 0);
    const backoffDelay = context.options.reconnectInterval * 
      Math.pow(2, consecutiveErrors - 3);

    const shouldThrottle = consecutiveErrors > 3 && timeSinceLastError < backoffDelay;

    if (shouldThrottle) {
      logger.warn("Connection attempts throttled", {
        consecutiveErrors,
        backoffDelay,
        timeSinceLastError
      });
    }

    return shouldThrottle;
  },

  canSendMessage: (context: WebSocketContext) => {
    if (!context.socket || context.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    const { window, messages: limit } = context.options.rateLimit;
    const now = Date.now();
    const recentMessages = context.metrics.messageTimestamps.filter(
      t => (now - t) <= window
    );

    return recentMessages.length < limit;
  },

  hasQueueSpace: (context: WebSocketContext) => 
    context.queue.messages.length < context.options.messageQueueSize
};
```

### 6. `services.ts`
```typescript
/**
 * @fileoverview WebSocket state machine services
 * @module @qi/core/network/websocket/services
 */

import { logger } from "@qi/core/logger";
import type { WebSocketContext, WebSocketEvents, Sender } from "./types";
import { createWebSocketError, retryWithBackoff } from "./utils";
import { HttpStatusCode } from "@qi/core/network/errors";

export const services = {
  webSocketService: (context: WebSocketContext) => async (send: Sender) => {
    let socket: WebSocket;
    
    try {
      socket = await retryWithBackoff(
        async () => {
          const ws = new WebSocket(context.url, context.protocols);
          
          return new Promise<WebSocket>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, context.options.connectionTimeout);

            ws.onopen = () => {
              clearTimeout(timeout);
              resolve(ws);
            };

            ws.onerror = (event) => reject(event.error);
          });
        },
        context
      );

      socket.onmessage = (event) => {
        logger.debug('WebSocket message received', {
          size: event.data.length,
          type: typeof event.data
        });
        
        send({ 
          type: 'MESSAGE', 
          data: event.data, 
          timestamp: Date.now() 
        });
      };

      socket.onerror = (event) => {
        const wsError = createWebSocketError(
          "WebSocket encountered an error",
          event.error,
          {
            url: context.url,
            connectionAttempts: context.state.connectionAttempts,
            totalErrors: context.metrics.totalErrors + 1,
            consecutiveErrors: context.metrics.consecutiveErrors + 1,
            lastSuccessfulConnection: context.metrics.lastSuccessfulConnection
          }
        );
        
        send({ 
          type: 'ERROR', 
          error: wsError, 
          timestamp: Date.now() 
        });
      };

      socket.onclose = (event) => {
        const wsError = createWebSocketError(
          "WebSocket connection closed",
          new Error(event.reason || 'Connection closed'),
          {
            closeCode: event.code,
            closeReason: event.reason,
            wasClean: event.wasClean,
            url: context.url,
            totalErrors: context.metrics.totalErrors,
            consecutiveErrors: context.metrics.consecutiveErrors
          }
        );

        send({ 
          type: 'CLOSE',
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          error: wsError
        });
      };

      return () => {
        logger.info('Cleaning up WebSocket connection', {
          url: context.url,
          readyState: socket.readyState
        });
        
        socket.close(
          HttpStatusCode.WEBSOCKET_NORMAL_CLOSURE, 
          "Service cleanup"
        );
      };

    } catch (error) {
      const wsError = createWebSocketError(
        "Failed to establish WebSocket connection",
        error as Error,
        {
          url: context.url,
          connectionAttempts: context.state.connectionAttempts,
          totalErrors: context.metrics.totalErrors + 1,
          consecutiveErrors: context.metrics.consecutiveErrors + 1
        }
      );
      
      send({ 
        type: 'ERROR', 
        error: wsError, 
        timestamp: Date.now() 
      });
    }
  },

  pingService: (context: WebSocketContext) => (send: Sender) => {
    const pingInterval = setInterval(() => {
      if (context.socket?.readyState === WebSocket.OPEN) {
        const timestamp = Date.now();
        send({ type: 'PING', timestamp });
      }
    }, context.options.pingInterval);

    return () => clearInterval(pingInterval);
  }
};
```

### 7. `states.ts`
```typescript
/**
 * @fileoverview WebSocket state machine states
 * @module @qi/core/network/websocket/states
 */

import { CONNECTION_STATES } from "./constants";

export const states = {
  [CONNECTION_STATES.DISCONNECTED]: {
    on: {
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: ["prepareConnection"]
      }
    }
  },

  [CONNECTION_STATES.CONNECTING]: {
    invoke: {
      src: "webSocketService",
      onError: {
        target: CONNECTION_STATES.RECONNECTING,
        actions: ["handleError"]
      }
    },
    on: {
      OPEN: {
        target: CONNECTION_STATES.CONNECTED,
        actions: ["handleOpen"]
      },
      ERROR: [
        {
          target: CONNECTION_STATES.RECONNECTING,
          guard: "canReconnect",
          actions: ["handleError"]
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["handleError", "cleanup"]
        }
      ],
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["handleClose", "cleanup"]
      }
    }
  },

  [CONNECTION_STATES.CONNECTED]: {
    invoke: {
      src: "pingService"
    },
    on: {
      SEND: {
        guard: ["canSendMessage", "hasQueueSpace"],
        actions: ["enqueueMessage"]
      },
      MESSAGE: {
        actions: ["handleMessage"]
      },
      ERROR: [
        {
          target: CONNECTION_STATES.RECONNECTING,
          guard: "canReconnect",
          actions: ["handleError"]
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["handleError", "cleanup"]
        }
      ],
      CLOSE: {
        target: CONNECTION_STATES.RECONNECTING,
        guard: "canReconnect",
        actions: ["handleClose"]
      },
      DISCONNECT: {
        target: CONNECTION_STATES.DISCONNECTING
      }
    }
  },

  [CONNECTION_STATES.RECONNECTING]: {
    on: {
      RETRY: [
        {
          target: CONNECTION_STATES.CONNECTING,
          guard: "canReconnect"
        },
        {
          target: CONNECTION_STATES.DISCONNECTED,
          actions: ["cleanup"]
        }
      ],
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: ["prepareConnection"]
      }
    }
  },

  [CONNECTION_STATES.DISCONNECTING]: {
    on: {
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["handleClose", "cleanup"]
      }
    }
  }
};
```

### 8. `machine.ts`
```typescript
/**
 * @fileoverview WebSocket state machine definition
 * @module @qi/core/network/websocket/machine
 */

import { createMachine } from "xstate";
import { actions } from "./actions";
import { guards } from "./guards";
import { services } from "./services";
import { states } from "./states";
import { INITIAL_CONTEXT, CONNECTION_STATES } from "./constants";
import type { WebSocketContext, WebSocketEvents, ConnectionOptions } from "./types";

export const webSocketMachine = createMachine({
  id: 'webSocket',
  types: {} as {
    context: WebSocketContext;
    events: WebSocketEvents;
  },
  initial: CONNECTION_STATES.DISCONNECTED,
  context: INITIAL_CONTEXT,
  states,
  predictableActionArguments: true,
  preserveActionOrder: true,
}, {
  actions,
  guards,
  services
});

export function createWebSocketMachine(options?: Partial<ConnectionOptions>) {
  return webSocketMachine.withContext({
    ...INITIAL_CONTEXT,
    options: {
      ...INITIAL_CONTEXT.options,
      ...options
    }
  });
}

export const webSocketEvents = {
  connect: (url: string, protocols?: string[], options?: Partial<ConnectionOptions>) => ({
    type: "CONNECT" as const,
    url,
    protocols,
    options
  }),
  
  disconnect: (code?: number, reason?: string) => ({
    type: "DISCONNECT" as const,
    code,
    reason
  }),
  
  send: (data: unknown, options?: { priority: "high" | "normal" }) => ({
    type: "SEND" as const,
    data,
    id: crypto.randomUUID(),
    options
  })
};
```

### 9. `index.ts`
```typescript
/**
 * @fileoverview WebSocket module exports
 * @module @qi/core/network/websocket
 */

export { createWebSocketMachine, webSocketEvents } from "./machine";
export type { 
  WebSocketContext,
  WebSocketEvents,
  ConnectionOptions,
  QueuedMessage,
  ErrorRecord,
  WebSocketMetrics,
  WebSocketErrorContext,
  ConnectionState
} from "./types";
export { CONNECTION_STATES } from "./constants";
```

This completes the full implementation of the WebSocket module. Key features include:

1. Comprehensive error handling with proper logging
2. Retry logic with exponential backoff
3. Metrics tracking and error reporting
4. Rate limiting and message queueing
5. Clean service implementation with proper cleanup
6. Type-safe event creators and context management
