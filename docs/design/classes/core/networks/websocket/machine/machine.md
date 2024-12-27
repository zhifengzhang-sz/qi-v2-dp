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

\[
E = \{e*i\mid i=1,2,\dots,m;\ m=12\}
\]
where
\[
\begin{eqnarray}
e_1 &=& \text{CONNECT}, \\
e_2 &=& \text{DISCONNECT}, \\
e_3 &=& \text{OPEN}, \\
e_4 &=& \text{CLOSE}, \\
e_5 &=& \text{ERROR}, \\
e_6 &=& \text{RETRY}, \\
e_7 &=& \text{MAX_RETRIES}, \\
e_8 &=& \text{TERMINATE}, \\
e_9 &=& \text{MESSAGE}, \\
e*{10} &=& \text{SEND}, \\
e*{11} &=& \text{PING}, \\
e*{12} &=& \text{PONG}
\end{eqnarray}
\]

### 1.4 Context (\( C \))

The context is defined as a tuple of properties:

\[
C = (P, V, T)
\]

where:

- \( P \) is the set of primary connection properties
- \( V \) is the set of metric values
- \( T \) is the set of timing properties

Formally:

\[
P = \{p_i\mid i=1,2,\dots,k\}
\]
where
\[
\begin{eqnarray}
p_1 &=& \text{url}: \text{String}, \\
p_2 &=& \text{protocols}: \text{String[]}, \\
p_3 &=& \text{socket}: \text{WebSocket} \cup \{\text{null}\}, \\
p_4 &=& \text{status}: \text{ConnectionStatus}, \\
p_5 &=& \text{readyState}: \text{Integer}
\end{eqnarray}
\]

\[
V = \{v_i\mid i=1,2,\dots,l\}
\]
where
\[
\begin{eqnarray}
v_1 &=& \text{messagesSent}: \mathbb{N}, \\
v_2 &=& \text{messagesReceived}: \mathbb{N}, \\
v_3 &=& \text{reconnectAttempts}: \mathbb{N}, \\
v_4 &=& \text{bytesSent}: \mathbb{N}, \\
v_5 &=& \text{bytesReceived}: \mathbb{N}
\end{eqnarray}
\]

\[
T = \{t_i\mid i=1,2,\dots,m\}
\]
where
\[
\begin{eqnarray}
t_1 &=& \text{connectTime}: \mathbb{R}^+, \\
t_2 &=& \text{disconnectTime}: \mathbb{R}^+, \\
t_3 &=& \text{lastPingTime}: \mathbb{R}^+, \\
t_4 &=& \text{lastPongTime}: \mathbb{R}^+, \\
t_5 &=& \text{windowStart}: \mathbb{R}^+
\end{eqnarray}
\]

### 1.5 Actions (\( \gamma \))

Actions are defined as functions that transform the context:

\[
\gamma: C \times E \rightarrow C
\]

The set of actions is defined as:

\[
\Gamma = \{\gamma*i\mid i=1,2,\dots,p\}
\]
where
\[
\begin{eqnarray}
\gamma_1 &=& \text{storeUrl}: C \times E*{\text{CONNECT}} \rightarrow C', \\
\gamma_2 &=& \text{resetRetries}: C \rightarrow C', \\
\gamma_3 &=& \text{handleError}: C \times E*{\text{ERROR}} \rightarrow C', \\
\gamma_4 &=& \text{processMessage}: C \times E*{\text{MESSAGE}} \rightarrow C', \\
\gamma_5 &=& \text{sendMessage}: C \times E*{\text{SEND}} \rightarrow C', \\
\gamma_6 &=& \text{handlePing}: C \times E*{\text{PING}} \rightarrow C', \\
\gamma_7 &=& \text{handlePong}: C \times E*{\text{PONG}} \rightarrow C', \\
\gamma_8 &=& \text{enforceRateLimit}: C \rightarrow C', \\
\gamma_9 &=& \text{incrementRetries}: C \rightarrow C', \\
\gamma_{10} &=& \text{logConnection}: C \rightarrow C', \\
\gamma_{11} &=& \text{forceTerminate}: C \rightarrow C'
\end{eqnarray}
\]

Each action is defined formally as follows:

1. Store URL:
   \[
   \gamma*1(c, e*{\text{CONNECT}}) = c' \text{ where } c'.\text{url} = e\_{\text{CONNECT}}.\text{url}
   \]

2. Reset Retries:
   \[
   \gamma_2(c) = c' \text{ where } c'.\text{reconnectAttempts} = 0
   \]

3. Handle Error:
   \[
   \gamma*3(c, e*{\text{ERROR}}) = c' \text{ where } \begin{cases}
   c'.\text{error} = e\_{\text{ERROR}}.\text{error} \\
   c'.\text{status} = \text{error} \\
   c'.\text{lastError} = \text{timestamp}
   \end{cases}
   \]

4. Process Message:
   \[
   \gamma*4(c, e*{\text{MESSAGE}}) = c' \text{ where } \begin{cases}
   c'.\text{messagesReceived} = c.\text{messagesReceived} + 1 \\
   c'.\text{bytesReceived} = c.\text{bytesReceived} + \text{size}(e\_{\text{MESSAGE}}.\text{data})
   \end{cases}
   \]

5. Send Message:
   \[
   \gamma*5(c, e*{\text{SEND}}) = c' \text{ where } \begin{cases}
   c'.\text{messagesSent} = c.\text{messagesSent} + 1 \\
   c'.\text{bytesSent} = c.\text{bytesSent} + \text{size}(e\_{\text{SEND}}.\text{data})
   \end{cases}
   \]

6. Handle Ping:
   \[
   \gamma*6(c, e*{\text{PING}}) = c' \text{ where } c'.\text{lastPingTime} = e\_{\text{PING}}.\text{timestamp}
   \]

7. Handle Pong:
   \[
   \gamma*7(c, e*{\text{PONG}}) = c' \text{ where } \begin{cases}
   c'.\text{lastPongTime} = e*{\text{PONG}}.\text{timestamp} \\
   c'.\text{latency} = e*{\text{PONG}}.\text{latency}
   \end{cases}
   \]

8. Enforce Rate Limit:
   \[
   \gamma_8(c) = c' \text{ where } \begin{cases}
   c'.\text{messageCount} = \text{currentWindowCount}(c) \\
   c'.\text{windowStart} = \text{now}() \text{ if windowExpired}(c)
   \end{cases}
   \]

9. Increment Retries:
   \[
   \gamma_9(c) = c' \text{ where } c'.\text{reconnectAttempts} = c.\text{reconnectAttempts} + 1
   \]

10. Log Connection:
    \[
    \gamma\_{10}(c) = c' \text{ where } c'.\text{connectTime} = \text{now}()
    \]

11. Force Terminate:
    \[
    \gamma\_{11}(c) = c' \text{ where } \begin{cases}
    c'.\text{socket} = \text{null} \\
    c'.\text{status} = \text{terminated} \\
    c'.\text{disconnectTime} = \text{now}()
    \end{cases}
    \]

### 1.6 Transition Function (\( \delta \))

The transition function is defined as:

\[
\delta: S \times E \rightarrow S \times \Gamma
\]

Key transitions include:

\[
\begin{aligned}
\delta(s*{\text{Disconnected}}, e*{\text{CONNECT}}) &= (s*{\text{Connecting}}, \{\gamma_1, \gamma*{10}\}) \\
\delta(s*{\text{Connecting}}, e*{\text{OPEN}}) &= (s*{\text{Connected}}, \{\gamma_2\}) \\
\delta(s*{\text{Connecting}}, e*{\text{ERROR}}) &= (s*{\text{Reconnecting}}, \{\gamma*3, \gamma_9\}) \\
\delta(s*{\text{Connected}}, e*{\text{MESSAGE}}) &= (s*{\text{Connected}}, \{\gamma*4, \gamma_8\}) \\
\delta(s*{\text{Connected}}, e*{\text{SEND}}) &= (s*{\text{Connected}}, \{\gamma*5, \gamma_8\}) \\
\delta(s*{\text{Connected}}, e*{\text{PING}}) &= (s*{\text{Connected}}, \{\gamma*6\}) \\
\delta(s*{\text{Connected}}, e*{\text{ERROR}}) &= (s*{\text{Reconnecting}}, \{\gamma*3, \gamma_9\}) \\
\delta(s*{\text{Reconnecting}}, e*{\text{RETRY}}) &= (s*{\text{Connecting}}, \{\gamma*9\}) \\
\delta(s, e*{\text{TERMINATE}}) &= (s*{\text{Terminated}}, \{\gamma*{11}\}) \text{ for all } s \in S
\end{aligned}
\]

### 1.7 Final States (\( F \))

The set of final states consists of a single state:
\[
F = \{s\_{\text{Terminated}}\}
\]

Once the machine enters the Terminated state, no further transitions are possible.


## 2. State machine specification of the `WebSocketClient`

### 2.1. Overview

The `WebSocketClient` manages a WebSocket connection's lifecycle, handling various states such as connecting, connected, disconnected, and handling errors. It incorporates reconnection logic, health checks, message queueing, and rate limiting to ensure robust and efficient operation.

### 2.2. States

| **State**       | **Description**                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `disconnected`  | The client is not connected to the WebSocket server.                                                |
| `connecting`    | The client is in the process of establishing a connection to the WebSocket server.                  |
| `connected`     | The client has successfully established a connection and is actively communicating with the server. |
| `reconnecting`  | The client is attempting to re-establish a connection after a disconnection or error.               |
| `disconnecting` | The client is in the process of gracefully closing the connection.                                  |
| `terminated`    | The client has been permanently terminated and cannot be reused.                                    |

### 2.3. Events

| **Event**     | **Payload**                                | **Description**                                                                  |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `CONNECT`     | `{ url: string, protocols?: string[] }`    | Initiates a connection to the specified WebSocket server URL.                    |
| `DISCONNECT`  | `{ code?: number, reason?: string }`       | Initiates a graceful disconnection from the WebSocket server.                    |
| `OPEN`        | `{ event: Event, timestamp: number }`      | Indicates that the WebSocket connection has been successfully established.       |
| `CLOSE`       | `{ code: number, reason: string }`         | Indicates that the WebSocket connection has been closed.                         |
| `ERROR`       | `{ error: Error, timestamp: number }`      | Indicates that an error has occurred with the WebSocket connection.              |
| `RETRY`       | `{ attempt: number, delay: number }`       | Triggers a reconnection attempt after a disconnection or error.                  |
| `MAX_RETRIES` | `{ attempts: number, lastError?: Error }`  | Indicates that the maximum number of reconnection attempts has been reached.     |
| `TERMINATE`   | `{ code?: number, reason?: string }`       | Forcefully terminates the WebSocket connection without attempting reconnections. |
| `MESSAGE`     | `{ data: any, timestamp: number }`         | Indicates a message has been received from the server.                           |
| `SEND`        | `{ data: any, id?: string }`              | Request to send a message to the server.                                         |
| `PING`        | `{ timestamp: number }`                    | Health check ping sent to server.                                                |
| `PONG`        | `{ latency: number, timestamp: number }`   | Health check response received from server.                                      |

### 2.4. Transitions

| **From State**  | **Event**     | **To State** | **Actions**                                                                                          |
| --------------- | ------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `disconnected`  | `CONNECT`     | `connecting` | - Store the `url` from the event payload.<br>- Initialize connection metrics.                         |
| `connecting`    | `OPEN`        | `connected`  | - Reset reconnection attempts.<br>- Log successful connection.<br>- Start health checks.             |
| `connecting`    | `ERROR`       | `reconnecting`| - Store the error.<br>- Log the error.<br>- Increment reconnection attempts.                        |
| `connecting`    | `CLOSE`       | `disconnected`| - Log the closure reason.<br>- Clean up resources.                                                  |
| `connected`     | `DISCONNECT`  | `disconnecting`| - Initiate graceful shutdown.<br>- Log disconnection initiation.                                   |
| `connected`     | `ERROR`       | `reconnecting`| - Store the error.<br>- Log the error.<br>- Increment reconnection attempts.                        |
| `connected`     | `CLOSE`       | `reconnecting`| - Log the closure.<br>- Increment reconnection attempts.                                            |
| `connected`     | `MESSAGE`     | `connected`  | - Process received message.<br>- Update metrics.                                                     |
| `connected`     | `SEND`        | `connected`  | - Send message to server.<br>- Update metrics.                                                       |
| `connected`     | `PING`        | `connected`  | - Send health check ping.<br>- Update timing metrics.                                                |
| `connected`     | `PONG`        | `connected`  | - Update latency metrics.<br>- Reset health check timer.                                             |
| `reconnecting`  | `RETRY`       | `connecting` | - Attempt to reconnect using the stored `url`.<br>- Apply backoff delay.                            |
| `reconnecting`  | `MAX_RETRIES` | `disconnected`| - Log that maximum reconnection attempts have been reached.<br>- Stop further reconnection attempts.|
| `disconnecting` | `CLOSE`       | `disconnected`| - Log successful disconnection.<br>- Clean up resources.                                            |
| Any State       | `TERMINATE`   | `terminated` | - Forcefully close the WebSocket.<br>- Log termination.<br>- Clean up all resources.                |

### 2.5. Context

| **Property**          | **Type**                | **Description**                                                |
| -------------------- | ----------------------- | ------------------------------------------------------------- |
| `url`                | `string`                | The WebSocket server URL to connect to.                        |
| `protocols`          | `string[]`              | WebSocket subprotocols to use.                                |
| `socket`             | `WebSocket \| null`     | Active socket instance.                                       |
| `reconnectAttempts`  | `number`               | The current number of reconnection attempts made.              |
| `error`              | `Error \| null`         | The last error encountered during connection or communication.|
| `connectTime`        | `number`               | Timestamp of last successful connection.                       |
| `disconnectTime`     | `number`               | Timestamp of last disconnection.                              |
| `messageQueue`       | `QueuedMessage[]`      | Queue of messages pending transmission.                       |
| `messageQueueSize`   | `number`               | Maximum size of message queue.                                |
| `lastPingTime`       | `number`               | Timestamp of last health check ping sent.                     |
| `lastPongTime`       | `number`               | Timestamp of last health check pong received.                 |
| `latency`            | `number[]`             | Recent connection latency measurements.                       |
| `messagesSent`       | `number`               | Total count of messages sent.                                 |
| `messagesReceived`   | `number`               | Total count of messages received.                             |
| `rateLimit`          | `RateLimit`            | Rate limiting configuration and state.                        |

### 2.6. Actions

| **Action Name**         | **Description**                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `storeUrl`            | Saves the WebSocket server URL from the `CONNECT` event into the machine's context for future reconnections. |
| `resetRetries`        | Resets the reconnection attempts counter to zero upon a successful connection.                               |
| `logConnection`       | Logs successful connection establishment and updates metrics.                                                |
| `handleError`         | Logs the error and updates the context with the error details.                                               |
| `incrementRetries`    | Increments the reconnection attempts counter each time a reconnection is attempted.                          |
| `logClosure`          | Logs the reason for the WebSocket connection closure.                                                        |
| `initiateShutdown`    | Starts the graceful disconnection process.                                                                   |
| `logDisconnection`    | Logs that a disconnection has been initiated.                                                                |
| `attemptReconnection` | Attempts to reconnect by sending the `RETRY` event after a specified delay.                                  |
| `logMaxRetries`       | Logs that the maximum number of reconnection attempts has been reached.                                      |
| `forceTerminate`      | Forcefully terminates the WebSocket connection and cleans up all resources.                                  |
| `processMessage`      | Processes received messages and updates relevant metrics.                                                    |
| `sendMessage`         | Sends messages to the server and handles queueing if necessary.                                             |
| `handlePing`          | Manages health check ping operations and timing.                                                            |
| `handlePong`          | Processes health check responses and updates latency metrics.                                               |
| `enforceRateLimit`    | Ensures message sending adheres to rate limiting rules.                                                     |

## 3. Implementation Specification

### 3.1 Event Types

```typescript
type WebSocketEvents =
  | {
      type: "CONNECT";
      url: string;
      protocols?: string[];
      options?: ConnectionOptions;
    }
  | { type: "DISCONNECT"; code?: number; reason?: string }
  | { type: "OPEN"; event: Event; timestamp: number }
  | { type: "CLOSE"; code: number; reason: string; wasClean: boolean }
  | { type: "ERROR"; error: Error; timestamp: number; attempt?: number }
  | { type: "MESSAGE"; data: any; timestamp: number; id?: string }
  | { type: "SEND"; data: any; id?: string; options?: SendOptions }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number }
  | { type: "RETRY"; attempt: number; delay: number }
  | { type: "MAX_RETRIES"; attempts: number; lastError?: Error }
  | { type: "TERMINATE"; code?: number; reason?: string; immediate?: boolean };

interface ConnectionOptions {
  reconnect: boolean; // Enable/disable auto-reconnect
  maxReconnectAttempts: number; // Maximum number of retry attempts
  reconnectInterval: number; // Base delay between retries in ms
  reconnectBackoffRate: number; // Exponential backoff multiplier
  pingInterval: number; // Interval between pings in ms
  pongTimeout: number; // Time to wait for pong response
  messageQueueSize: number; // Maximum queued messages
  messageTimeout: number; // Default message timeout
  rateLimit: RateLimit;
}

interface SendOptions {
  retry: boolean; // Retry failed sends
  timeout: number; // Message timeout in ms
  priority: "high" | "normal"; // Message priority
  queueIfOffline: boolean; // Queue if disconnected
}

interface RateLimit {
  messages: number; // Messages per window
  window: number; // Time window in ms
}
```

### 3.2 Context

```typescript
interface WebSocketContext {
  // Connection
  url: string; // WebSocket server URL
  protocols: string[]; // Subprotocols to use
  socket: WebSocket | null; // Active socket instance
  status: ConnectionStatus; // Current connection status
  readyState: number; // WebSocket ready state
  isCleanDisconnect: boolean; // Was last disconnect clean

  // Timing
  connectTime: number; // Last successful connect time
  disconnectTime: number; // Last disconnect time

  // Reconnection
  reconnectAttempts: number; // Current retry attempt count
  maxReconnectAttempts: number; // Maximum retry attempts
  reconnectInterval: number; // Base delay between retries
  reconnectBackoffRate: number; // Exponential backoff multiplier
  lastReconnectTime: number; // Last retry attempt time
  nextReconnectDelay: number; // Next retry delay in ms

  // Message Queue
  messageQueue: QueuedMessage[]; // Pending messages
  messageQueueSize: number; // Max queue size
  processingMessage: boolean; // Queue processing flag
  lastMessageId: string; // Last processed message

  // Health Check
  pingInterval: number; // Ms between pings
  pongTimeout: number; // Ms to wait for pong
  lastPingTime: number; // Last ping sent time
  lastPongTime: number; // Last pong received time
  latency: number[]; // Recent latency samples

  // Metrics
  messagesSent: number; // Total messages sent
  messagesReceived: number; // Total messages received
  bytesReceived: number; // Total bytes received
  bytesSent: number; // Total bytes sent
  errors: ErrorRecord[]; // Error history

  // Rate Limiting
  messageCount: number; // Messages in window
  windowStart: number; // Current window start
  rateLimit: RateLimit; // Rate limit config
}

interface QueuedMessage {
  id: string;
  data: any;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: "high" | "normal";
}

interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "reconnecting"
  | "backingOff"
  | "rateLimited"
  | "suspended";
```

### 3.3 Actions and Guards

```typescript
type ActionArgs = {
  context: WebSocketContext;
  event: WebSocketEvent;
};

type Guard = (args: ActionArgs) => boolean;
type Action = (args: ActionArgs) => Partial<WebSocketContext>;

// Guard Functions
const guards = {
  canConnect: ({ context }: ActionArgs): boolean => 
    !context.socket && !context.error,

  canReconnect: ({ context }: ActionArgs): boolean =>
    context.reconnectAttempts < context.maxReconnectAttempts,

  isConnected: ({ context }: ActionArgs): boolean =>
    !!context.socket && context.socket.readyState === WebSocket.OPEN,

  hasError: ({ context }: ActionArgs): boolean =>
    !!context.error,

  shouldRetry: ({ context }: ActionArgs): boolean =>
    context.reconnectAttempts < context.maxReconnectAttempts
};

// Action Functions
const actions = {
  storeUrl: ({ context, event }: ActionArgs): Partial<WebSocketContext> => ({
    url: event.type === "CONNECT" ? event.url : context.url
  }),

  resetRetries: (): Partial<WebSocketContext> => ({
    reconnectAttempts: 0,
    error: null
  }),

  handleError: ({ event }: ActionArgs): Partial<WebSocketContext> => ({
    error: event.type === "ERROR" ? event.error : null,
    disconnectTime: Date.now()
  }),

  incrementRetries: ({ context }: ActionArgs): Partial<WebSocketContext> => ({
    reconnectAttempts: context.reconnectAttempts + 1
  }),

  logConnection: (): Partial<WebSocketContext> => ({
    connectTime: Date.now(),
    error: null
  }),

  processMessage: ({ context, event }: ActionArgs): Partial<WebSocketContext> => ({
    messagesReceived: context.messagesReceived + 1,
    lastMessageTime: event.type === "MESSAGE" ? event.timestamp : context.lastMessageTime
  }),

  sendMessage: ({ context, event }: ActionArgs): Partial<WebSocketContext> => ({
    messagesSent: context.messagesSent + 1,
    lastSendTime: Date.now()
  }),

  handlePing: ({ event }: ActionArgs): Partial<WebSocketContext> => ({
    lastPingTime: event.type === "PING" ? event.timestamp : Date.now()
  }),

  handlePong: ({ event }: ActionArgs): Partial<WebSocketContext> => ({
    lastPongTime: event.type === "PONG" ? event.timestamp : Date.now(),
    latency: event.type === "PONG" ? [...context.latency, event.latency].slice(-5) : context.latency
  }),

  forceTerminate: (): Partial<WebSocketContext> => ({
    socket: null,
    error: null,
    reconnectAttempts: 0,
    disconnectTime: Date.now()
  })
};
```

### 3.4 Integration

```typescript
interface ExternalSystemEvent {
  type: "websocket" | "network" | "user";
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

### 3.5 State Persistence

```typescript
interface PersistenceConfig {
  enabled: boolean;
  storage: "memory" | "local" | "session";
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

### 3.6 Error Recovery

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

### 3.7 Protocol Requirements

1. **WebSocket Protocol**

   - RFC 6455 compliance
   - Binary and text frame support
   - Connection health monitoring
   - Error recovery integration

2. **Health Check**
   ```typescript
   interface HealthCheck {
     ping: {
       interval: number; // Ping interval in ms (default: 30000)
       timeout: number; // Pong response timeout (default: 5000)
       maxAttempts: number; // Max ping attempts before close
     };
     monitor: {
       enabled: boolean; // Enable health monitoring
       timeout: number; // Connection timeout
     };
   }
   ```

### 3.8 Invariants

1. **State Invariants**

   - Only one active socket connection at any time
   - Socket must be null in disconnected state
   - Socket must be non-null in connected state

2. **Transition Invariants**

   - Any state can transition to disconnected via TERMINATE
   - Reconnecting can only transition to connecting or disconnected
   - Disconnecting can only transition to disconnected
   - All error transitions must check reconnection eligibility

3. **Protocol Invariants**

   - Must implement RFC 6455 ping/pong frames
   - Must close connection on ping timeout
   - Must track connection health state
   - Must integrate with error recovery strategies

4. **Context Invariants**

   - Message queue size must never exceed messageQueueSize
   - Reconnection attempts must not exceed maxReconnectAttempts
   - Rate limiting must be enforced across all states

5. **Action Invariants**

   - Actions must maintain context immutability
   - Actions must handle all error cases
   - Actions must preserve message order

6. **Guard Invariants**
   - Guards must be pure predicates
   - Guards must not modify context
   - Guards must be deterministic
