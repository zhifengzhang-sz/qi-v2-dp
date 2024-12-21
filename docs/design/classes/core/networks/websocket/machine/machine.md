# WebSocket Machine Specification (XState v5)

## 1. Formal Definition

### 1.1 Mathematical Representation

A Finite State Machine (FSM) is formally defined as a 5-tuple:

\[
\mathcal{M} = (S, \Sigma, \delta, s_0, F)
\]

For our WebSocket client with context and actions, we extend this to a 7-tuple:

\[
\mathcal{M} = (S, E, \delta, s_0, C, \gamma, F)
\]

Where:
- \( S \) is the finite set of states
- \( E \) is the set of external events
- \( \delta: S \times E \rightarrow S \) is the transition function
- \( s_0 \in S \) is the initial state
- \( C \) is the set of context variables
- \( \gamma \) represents actions triggered by transitions
- \( F \subseteq S \) is the set of final states

### 1.2 States ($S$)

\[
S = \{s_i\mid i=1,2,\dots,n;\ n=6\}
\]
where
\[
\begin{eqnarray}
s_1 &=& \text{Disconnected}, \\
s_2 &=& \text{Connecting}, \\
s_3 &=& \text{Connected}, \\
s_4 &=& \text{Reconnecting}, \\
s_5 &=& \text{Disconnecting}, \\
s_6 &=& \text{Terminated}
\end{eqnarray}
\]

### 1.3 Events (\( E \))

[Events section remains unchanged]

### 1.4 Transition Function (\( \delta \))

Formal definition:
\[
\delta: S \times E \rightarrow S
\]

Applied to our states:
\[
\begin{aligned}
\delta(s_{\tiny\text{Disconnected}}, \sigma_{\tiny\text{CONNECT}}) & = s_{\tiny\text{Connecting}} \\
\delta(s_{\tiny\text{Connecting}}, \sigma_{\tiny\text{OPEN}}) & = s_{\tiny\text{Connected}} \\
\delta(s_{\tiny\text{Connecting}}, \sigma_{\tiny\text{ERROR}}) & = s_{\tiny\text{Reconnecting}} \\
\delta(s_{\tiny\text{Connected}}, \sigma_{\tiny\text{DISCONNECT}}) & = s_{\tiny\text{Disconnecting}} \\
\delta(s_{\tiny\text{Connected}}, \sigma_{\tiny\text{ERROR}}) & = s_{\tiny\text{Reconnecting}} \\
\delta(s_{\tiny\text{Connected}}, \sigma_{\tiny\text{CLOSE}}) & = s_{\tiny\text{Reconnecting}} \\
\delta(s_{\tiny\text{Reconnecting}}, \sigma_{\tiny\text{RETRY}}) & = s_{\tiny\text{Connecting}} \\
\delta(s_{\tiny\text{Reconnecting}}, \sigma_{\tiny\text{MAX\_RETRIES}}) & = s_{\tiny\text{Disconnected}} \\
\delta(s_{\tiny\text{Disconnecting}}, \sigma_{\tiny\text{CLOSE}}) & = s_{\tiny\text{Disconnected}} \\
\delta(s, \sigma_{\tiny\text{TERMINATE}}) & = s_{\tiny\text{Terminated}}, \forall s\in S
\end{aligned}
\]

### 1.5 Final States (\( F \))

The set of final states \( F \) consists of a single state:
\[
F = \{s_{\tiny\text{Terminated}}\}
\]

Once the machine enters the Terminated state, it cannot transition to any other state. This represents a complete shutdown of the WebSocket connection with no possibility of reconnection.

## 2. Implementation Specification

### 2.1 Event Types

```typescript
type WebSocketEvents =
  | { type: 'CONNECT'; url: string; protocols?: string[]; options?: ConnectionOptions }
  | { type: 'DISCONNECT'; code?: number; reason?: string }
  | { type: 'OPEN'; event: Event; timestamp: number }
  | { type: 'CLOSE'; code: number; reason: string; wasClean: boolean }
  | { type: 'ERROR'; error: Error; timestamp: number; attempt?: number }
  | { type: 'MESSAGE'; data: any; timestamp: number; id?: string }
  | { type: 'SEND'; data: any; id?: string; options?: SendOptions }
  | { type: 'PING'; timestamp: number }
  | { type: 'PONG'; latency: number; timestamp: number }
  | { type: 'RETRY'; attempt: number; delay: number }
  | { type: 'MAX_RETRIES'; attempts: number; lastError?: Error }
  | { type: 'TERMINATE'; code?: number; reason?: string; immediate?: boolean };

interface ConnectionOptions {
  reconnect: boolean;                // Enable/disable auto-reconnect
  maxReconnectAttempts: number;      // Maximum number of retry attempts
  reconnectInterval: number;         // Base delay between retries in ms
  reconnectBackoffRate: number;      // Exponential backoff multiplier
  pingInterval: number;              // Interval between pings in ms
  pongTimeout: number;               // Time to wait for pong response
  messageQueueSize: number;          // Maximum queued messages
  messageTimeout: number;            // Default message timeout
  rateLimit: RateLimit;
}

interface SendOptions {
  retry: boolean;                    // Retry failed sends
  timeout: number;                   // Message timeout in ms
  priority: 'high' | 'normal';       // Message priority
  queueIfOffline: boolean;          // Queue if disconnected
}

interface RateLimit {
  messages: number;                  // Messages per window
  window: number;                    // Time window in ms
}
```

### 2.2 Context

```typescript
interface WebSocketContext {
  // Connection
  url: string;                     // WebSocket server URL
  protocols: string[];             // Subprotocols to use
  socket: WebSocket | null;        // Active socket instance
  status: ConnectionStatus;        // Current connection status
  readyState: number;             // WebSocket ready state
  isCleanDisconnect: boolean;     // Was last disconnect clean
  
  // Timing
  connectTime: number;            // Last successful connect time
  disconnectTime: number;         // Last disconnect time
  
  // Reconnection
  reconnectAttempts: number;      // Current retry attempt count
  maxReconnectAttempts: number;   // Maximum retry attempts
  reconnectInterval: number;      // Base delay between retries
  reconnectBackoffRate: number;   // Exponential backoff multiplier
  lastReconnectTime: number;      // Last retry attempt time
  nextReconnectDelay: number;     // Next retry delay in ms
  
  // Message Queue
  messageQueue: QueuedMessage[];   // Pending messages
  messageQueueSize: number;       // Max queue size
  processingMessage: boolean;     // Queue processing flag
  lastMessageId: string;          // Last processed message
  
  // Health Check
  pingInterval: number;           // Ms between pings
  pongTimeout: number;           // Ms to wait for pong
  lastPingTime: number;          // Last ping sent time
  lastPongTime: number;          // Last pong received time
  latency: number[];             // Recent latency samples
  
  // Metrics
  messagesSent: number;          // Total messages sent
  messagesReceived: number;      // Total messages received
  bytesReceived: number;         // Total bytes received
  bytesSent: number;            // Total bytes sent
  errors: ErrorRecord[];         // Error history
  
  // Rate Limiting
  messageCount: number;          // Messages in window
  windowStart: number;           // Current window start
  rateLimit: RateLimit;         // Rate limit config
}

interface QueuedMessage {
  id: string;
  data: any;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: 'high' | 'normal';
}

interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'disconnecting'
  | 'reconnecting'
  | 'backingOff'
  | 'rateLimited'
  | 'suspended';
```

### 2.3 Actions and Guards

[Previous actions and guards sections remain the same...]

### 2.4 Integration

```typescript
interface ExternalSystemEvent {
  type: 'websocket' | 'network' | 'user';
  priority: number;
  timestamp: number;
  data: any;
}

interface IntegrationPoint {
  system: string;
  events: ExternalSystemEvent[];
  handlers: Map<string, (event: ExternalSystemEvent) => void>;
}

type EventProcessor = {
  preProcess?: (event: WebSocketEvent) => WebSocketEvent;
  process: (event: WebSocketEvent) => void;
  postProcess?: (event: WebSocketEvent) => void;
  cleanup?: () => void;
};

interface EventProcessingPipeline {
  processors: EventProcessor[];
  errorHandlers: Map<string, (error: Error) => void>;
  timeout: number;
}
```

### 2.5 State Persistence

```typescript
interface PersistenceConfig {
  enabled: boolean;
  storage: 'memory' | 'local' | 'session';
  key: string;
  serialize?: (state: WebSocketContext) => string;
  deserialize?: (data: string) => WebSocketContext;
}

interface PersistenceHooks {
  beforeSave?: (state: WebSocketContext) => WebSocketContext;
  afterLoad?: (state: WebSocketContext) => WebSocketContext;
  onError?: (error: Error) => void;
}

type PersistenceOperation = {
  saveState: (state: WebSocketContext) => void;
  loadState: () => WebSocketContext | null;
  clearState: () => void;
  migrateState: (oldState: WebSocketContext) => WebSocketContext;
};
```

### 2.6 Error Recovery

```typescript
type RecoveryStrategy = {
  maxAttempts: number;
  timeout: number;
  backoff: BackoffStrategy;
  fallback: () => void;
  cleanup: () => void;
};

interface ActionRecovery {
  [actionName: string]: RecoveryStrategy;
}

interface ActionError {
  action: string;
  error: Error;
  context: WebSocketContext;
  event: WebSocketEvent;
  recovery?: TransitionAction;
}

const recoveryStrategies: ActionRecovery = {
  createSocket: {
    maxAttempts: 5,
    timeout: 30000,
    backoff: 'exponential',
    fallback: () => 'disconnect',
    cleanup: () => void
  },
  sendMessage: {
    maxAttempts: 3,
    timeout: 5000,
    backoff: 'linear',
    fallback: () => 'queue',
    cleanup: () => void
  },
  processQueue: {
    maxAttempts: 2,
    timeout: 3000,
    backoff: 'immediate',
    fallback: () => 'clear',
    cleanup: () => void
  },
  ping: {
    maxAttempts: 1,
    timeout: 1000,
    backoff: 'none',
    fallback: () => 'reset',
    cleanup: () => void
  }
};
```

### 2.7 Invariants

1. **State Invariants**
   - Only one active socket connection at any time
   - Socket must be null in disconnected state
   - Socket must be non-null in connected state

2. **Transition Invariants**
   - Any state can transition to disconnected via TERMINATE
   - Reconnecting can only transition to connecting or disconnected
   - Disconnecting can only transition to disconnected
   - All error transitions must check reconnection eligibility

3. **Context Invariants**
   - Message queue size must never exceed messageQueueSize
   - Reconnection attempts must not exceed maxReconnectAttempts
   - Rate limiting must be enforced across all states

4. **Action Invariants**
   - Actions must maintain context immutability
   - Actions must handle all error cases
   - Actions must preserve message order

5. **Guard Invariants**
   - Guards must be pure predicates
   - Guards must not modify context
   - Guards must be deterministic