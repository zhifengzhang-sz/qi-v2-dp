### `types.ts`

Current implementation:

```typescript
/**
 * @fileoverview WebSocket type definitions
 * @module @qi/core/network/websocket/types
 */

import { NetworkErrorContext } from "../../errors.js";
import { CONNECTION_STATES } from "./constants.js";

// Base type definitions
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

// Core state machine context
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
    lastErrorTime: number;
  };
  metrics: WebSocketMetrics;
  queue: {
    messages: QueuedMessage[];
    pending: boolean;
    lastProcessed: number;
  };
}

// Error handling types
export interface WebSocketErrorContext extends NetworkErrorContext {
  socket?: WebSocket | null;
  connectionAttempts: number;
  lastError?: Error;
  closeCode?: number;
  closeReason?: string;
  lastSuccessfulConnection?: number;
  totalErrors: number;
  consecutiveErrors: number;
  retryDelay?: number;
}

export interface WebSocketError extends Error {
  statusCode: number;
  code: number;
  details?: WebSocketErrorContext;
}

// Event definitions
export type WebSocketEvents =
  | { type: "CONNECT"; url: string; protocols?: string[]; options?: Partial<ConnectionOptions> }
  | { type: "DISCONNECT"; code?: number; reason?: string }
  | { type: "OPEN"; timestamp: number }
  | { type: "CLOSE"; code: number; reason: string; wasClean: boolean; error?: WebSocketError }
  | { type: "ERROR"; error: WebSocketError; timestamp: number; attempt?: number }
  | { type: "MESSAGE"; data: unknown; timestamp: number; id?: string }
  | { type: "SEND"; data: unknown; id?: string; options?: { priority: "high" | "normal" } }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number }
  | { type: "RETRY"; attempt: number; delay: number };

// Machine type definition helper
export type WebSocketMachine = {
  context: WebSocketContext;
  events: WebSocketEvents;
};
```

---

#### Review

Let's start with reviewing and updating `types.ts`. First, let's identify what needs to change for XState v5 compliance.

Current `types.ts` has:
```typescript
1. Base types: 
- ConnectionState
- ConnectionOptions
- QueuedMessage 

2. Error types:
- ErrorRecord
- WebSocketMetrics
- WebSocketContext
- WebSocketError

3. Events:
- WebSocketEvents union type

4. Machine type:
- WebSocketMachine helper
```

Key changes needed for v5:

1. Remove any v4-specific patterns:
```typescript
- Remove EventObject dependency
- Update actor model types
- Simplify event type structure
```

2. Add v5 specific type helpers:
```typescript
- Better type inference support
- State value typing
- Proper readonly markers
```

---

Questions:

1. Should we keep the current file structure but update internals?
2. Should we create a new interface for actors/spawning?
3. Do we need to add any new types for v5 features?

This will help ensure we start with a solid foundation.

---

Answers:

1. We should keep the current file structure and make as small change as possible unless the structure is not adequate.
2. We should create a new interface for actors/spawning
3. We need to add new types for v5 features.

---

