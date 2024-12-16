## Phase 1: Core Types and Constants.

### Directory structure

```
core/networks/
├── websocket/
    ├── machine/
    │   ├── constants.ts
    │   ├── types.ts
    │   ├── guards.ts
    │   ├── actions.ts
    │   └── machine.ts
    ├── client.ts
    └── index.ts
```

### `machine/types.ts`

```typescript
/**
 * @fileoverview WebSocket State Machine Types
 * Core type definitions for the WebSocket state machine implementation
 */

// Connection States
export const ConnectionStates = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
  RECONNECTING: 'reconnecting',
  BACKING_OFF: 'backingOff',
  RATE_LIMITED: 'rateLimited',
  SUSPENDED: 'suspended'
} as const;

export type ConnectionState = typeof ConnectionStates[keyof typeof ConnectionStates];

// Event Types
export const EventTypes = {
  // Connection Events
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
  ERROR: 'ERROR',
  
  // Message Events
  MESSAGE: 'MESSAGE',
  SEND: 'SEND',
  
  // Health Check Events
  PING: 'PING',
  PONG: 'PONG',
  
  // Reconnection Events
  RETRY: 'RETRY',
  MAX_RETRIES: 'MAX_RETRIES',
  TERMINATE: 'TERMINATE'
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

// Event Payloads
export interface BaseEvent {
  type: EventType;
  timestamp: number;
}

export interface ConnectEvent extends BaseEvent {
  type: typeof EventTypes.CONNECT;
  url: string;
  protocols?: string[];
  options?: ConnectionOptions;
}

export interface DisconnectEvent extends BaseEvent {
  type: typeof EventTypes.DISCONNECT;
  code?: number;
  reason?: string;
}

export interface OpenEvent extends BaseEvent {
  type: typeof EventTypes.OPEN;
  event: Event;
}

export interface CloseEvent extends BaseEvent {
  type: typeof EventTypes.CLOSE;
  code: number;
  reason: string;
  wasClean: boolean;
}

export interface ErrorEvent extends BaseEvent {
  type: typeof EventTypes.ERROR;
  error: Error;
  attempt?: number;
}

export interface MessageEvent extends BaseEvent {
  type: typeof EventTypes.MESSAGE;
  data: unknown;
  id?: string;
}

export interface SendEvent extends BaseEvent {
  type: typeof EventTypes.SEND;
  data: unknown;
  id?: string;
  options?: SendOptions;
}

export interface PingEvent extends BaseEvent {
  type: typeof EventTypes.PING;
}

export interface PongEvent extends BaseEvent {
  type: typeof EventTypes.PONG;
  latency: number;
}

export interface RetryEvent extends BaseEvent {
  type: typeof EventTypes.RETRY;
  attempt: number;
  delay: number;
}

export interface MaxRetriesEvent extends BaseEvent {
  type: typeof EventTypes.MAX_RETRIES;
  attempts: number;
  lastError?: Error;
}

export interface TerminateEvent extends BaseEvent {
  type: typeof EventTypes.TERMINATE;
  code?: number;
  reason?: string;
  immediate?: boolean;
}

export type WebSocketEvent =
  | ConnectEvent
  | DisconnectEvent
  | OpenEvent
  | CloseEvent
  | ErrorEvent
  | MessageEvent
  | SendEvent
  | PingEvent
  | PongEvent
  | RetryEvent
  | MaxRetriesEvent
  | TerminateEvent;

// Configuration Types
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

export interface SendOptions {
  retry: boolean;
  timeout: number;
  priority: 'high' | 'normal';
  queueIfOffline: boolean;
}

// Context Types
export interface QueuedMessage {
  id: string;
  data: unknown;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: 'high' | 'normal';
}

export interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

export interface ConnectionMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
}

export interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  readyState: number;
  
  // Timing
  connectTime: number;
  disconnectTime: number;
  isCleanDisconnect: boolean;
  
  // Reconnection
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  lastReconnectTime: number;
  nextReconnectDelay: number;
  
  // Message Queue
  messageQueue: QueuedMessage[];
  messageQueueSize: number;
  processingMessage: boolean;
  lastMessageId: string;
  
  // Health Check
  pingInterval: number;
  pongTimeout: number;
  lastPingTime: number;
  lastPongTime: number;
  latency: number[];
  
  // Metrics
  metrics: ConnectionMetrics;
  errors: ErrorRecord[];
  
  // Rate Limiting
  messageCount: number;
  windowStart: number;
  rateLimit: {
    messages: number;
    window: number;
  };
}

```

### `machine/constants.ts`

```typescript
/**
 * @fileoverview WebSocket State Machine Constants
 * Default values and configuration constants
 */

import { ConnectionOptions, SendOptions } from './types';

// Default connection configuration
export const DEFAULT_CONFIG: Required<ConnectionOptions> = {
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
    window: 1000
  }
};

// Default send options
export const DEFAULT_SEND_OPTIONS: Required<SendOptions> = {
  retry: true,
  timeout: 5000,
  priority: 'normal',
  queueIfOffline: true
};

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
  TLS_HANDSHAKE: 1015
} as const;

// Timing constants
export const TIMING = {
  MIN_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 30000,
  DEFAULT_PING_INTERVAL: 30000,
  DEFAULT_PONG_TIMEOUT: 5000,
  RATE_LIMIT_WINDOW: 1000
} as const;

// Maximum values
export const LIMITS = {
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  MAX_QUEUE_SIZE: 1000,
  MAX_RETRY_ATTEMPTS: 10,
  MAX_ERROR_HISTORY: 100,
  MAX_LATENCY_SAMPLES: 50
} as const;

// Metric collection intervals
export const METRIC_INTERVALS = {
  LATENCY: 60000,    // 1 minute
  RATE_LIMITING: 1000, // 1 second
  ERROR_CLEANUP: 300000 // 5 minutes
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  INVALID_URL: 'Invalid WebSocket URL provided',
  CONNECTION_TIMEOUT: 'Connection attempt timed out',
  MAX_RETRIES_EXCEEDED: 'Maximum reconnection attempts exceeded',
  RATE_LIMIT_EXCEEDED: 'Message rate limit exceeded',
  QUEUE_FULL: 'Message queue is full',
  INVALID_STATE: 'Invalid state transition attempted',
  PONG_TIMEOUT: 'WebSocket pong response timeout',
  MESSAGE_TOO_LARGE: 'Message exceeds maximum size limit'
} as const;

```

---

These two files establish the foundation for our state machine implementation. The types file defines all the necessary interfaces and types for events, states, and context, while the constants file provides default values and configuration settings.

