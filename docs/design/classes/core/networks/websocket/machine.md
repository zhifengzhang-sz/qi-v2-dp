  
## 1. Data Specifications
  
### 1.1 Event Specifications
  
#### Base Event Types
| Type | Description |
|------|-------------|
| `timestamp` | Number representing Unix timestamp in milliseconds |
| `messageId` | String UUID v4 |
| `code` | Number representing WebSocket close codes (1000-4999) |
| `reason` | String explanation for errors or closures |
  
#### Event Definitions
| Event | Payload | Description |
|-------|---------|-------------|
| `CONNECT` | `{ url: string; protocols?: string[]; options?: ConnectionOptions }` | Initiates a connection |
| `DISCONNECT` | `{ code?: number; reason?: string }` | Initiates graceful disconnection |
| `OPEN` | `{ event: Event; timestamp: number }` | Connection established |
| `CLOSE` | `{ code: number; reason: string; wasClean: boolean }` | Connection closed |
| `ERROR` | `{ error: Error; timestamp: number; attempt?: number }` | Connection error |
| `MESSAGE` | `{ data: any; timestamp: number; id?: string }` | Message received |
| `SEND` | `{ data: any; id?: string; options?: SendOptions }` | Send message |
| `PING` | `{ timestamp: number }` | Connection health check |
| `PONG` | `{ latency: number; timestamp: number }` | Health check response |
| `RETRY` | `{ attempt: number; delay: number }` | Reconnection attempt |
| `MAX_RETRIES` | `{ attempts: number; lastError?: Error }` | Max retries reached |
| `TERMINATE` | `{ code?: number; reason?: string; immediate?: boolean }` | Force termination |
  
#### Option Types
```typescript
interface ConnectionOptions {
  // Reconnection settings
  reconnect: boolean;                // Enable/disable auto-reconnect
  maxReconnectAttempts: number;      // Maximum number of retry attempts
  reconnectInterval: number;         // Base delay between retries in ms
  reconnectBackoffRate: number;      // Exponential backoff multiplier
  
  // Health check settings
  pingInterval: number;              // Interval between pings in ms
  pongTimeout: number;              // Time to wait for pong response
  
  // Message handling
  messageQueueSize: number;         // Maximum queued messages
  messageTimeout: number;           // Default message timeout
  
  // Rate limiting
  rateLimit: {
    messages: number;               // Messages per window
    window: number;                 // Time window in ms
  };
}
  
interface SendOptions {
  retry: boolean;                   // Retry failed sends
  timeout: number;                  // Message timeout in ms
  priority: 'high' | 'normal';      // Message priority
  queueIfOffline: boolean;         // Queue if disconnected
}
```
  
#### Event Type
  
```typescript
// Full event type definitions
type WebSocketEvents = {
  CONNECT: {
    url: string;
    protocols?: string[];
    options?: ConnectionOptions;
  };
  DISCONNECT: {
    code?: number;
    reason?: string;
  };
  OPEN: {
    event: Event;
    timestamp: number;
  };
  CLOSE: {
    code: number;
    reason: string;
    wasClean: boolean;
  };
  ERROR: {
    error: Error;
    timestamp: number;
    attempt?: number;
  };
  MESSAGE: {
    data: any;
    timestamp: number;
    id?: string;
  };
  SEND: {
    data: any;
    id?: string;
    options?: SendOptions;
  };
  PING: {
    timestamp: number;
  };
  PONG: {
    latency: number;
    timestamp: number;
  };
  RETRY: {
    attempt: number;
    delay: number;
  };
  MAX_RETRIES: {
    attempts: number;
    lastError?: Error;
  };
  TERMINATE: {
    code?: number;
    reason?: string;
    immediate?: boolean;
  };
};
```
  
### 1.2 Context Specifications
  
#### Context State Properties
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `url` | `string` | WebSocket server URL | Required |
| `protocols` | `string[]` | Subprotocols to use | `[]` |
| `socket` | `WebSocket \| null` | Active socket instance | `null` |
  
#### Connection State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `status` | `ConnectionStatus` | Current connection status | `'disconnected'` |
| `readyState` | `number` | WebSocket ready state | `0` |
| `connectTime` | `number` | Last successful connect time | `0` |
| `disconnectTime` | `number` | Last disconnect time | `0` |
| `isCleanDisconnect` | `boolean` | Was last disconnect clean | `true` |
  
#### Reconnection State  
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `reconnectAttempts` | `number` | Current retry attempt count | `0` |
| `maxReconnectAttempts` | `number` | Maximum retry attempts | `5` |
| `reconnectInterval` | `number` | Base delay between retries | `1000` |
| `lastReconnectTime` | `number` | Last retry attempt time | `0` |
| `nextReconnectDelay` | `number` | Next retry delay in ms | `0` |
  
#### Message Queue State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `messageQueue` | `QueuedMessage[]` | Pending messages | `[]` |
| `messageQueueSize` | `number` | Max queue size | `100` |
| `processingMessage` | `boolean` | Queue processing flag | `false` |
| `lastMessageId` | `string` | Last processed message | `''` |
  
#### Health Check State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `pingInterval` | `number` | Ms between pings | `30000` |
| `pongTimeout` | `number` | Ms to wait for pong | `5000` |
| `lastPingTime` | `number` | Last ping sent time | `0` |
| `lastPongTime` | `number` | Last pong received time | `0` |
| `latency` | `number[]` | Recent latency samples | `[]` |
  
#### Metrics State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `messagesSent` | `number` | Total messages sent | `0` |
| `messagesReceived` | `number` | Total messages received | `0` |
| `bytesReceived` | `number` | Total bytes received | `0` |
| `bytesSent` | `number` | Total bytes sent | `0` |
| `errors` | `ErrorRecord[]` | Error history | `[]` |
  
#### Rate Limiting State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `messageCount` | `number` | Messages in window | `0` |
| `windowStart` | `number` | Current window start | `0` |
| `rateLimit` | `RateLimit` | Rate limit config | Required |
  
```typescript
// Supporting Types
type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'disconnecting'
  | 'reconnecting'
  | 'backingOff'
  | 'rateLimited'
  | 'suspended';
  
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
  
interface RateLimit {
  messages: number;
  window: number;
}
  
// Full Context Type
interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionStatus;
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
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  errors: ErrorRecord[];
  
  // Rate Limiting
  messageCount: number;
  windowStart: number;
  rateLimit: RateLimit;
}
```
  
### 1.3 Configuration
  
The client should accept configuration for all tunable parameters with sensible defaults:
  
```typescript
interface WebSocketConfig {
  // Connection
  url: string;                      // Required
  protocols?: string[];             // Default: []
  
  // Reconnection
  reconnect?: boolean;              // Default: true
  maxReconnectAttempts?: number;    // Default: 5
  reconnectInterval?: number;       // Default: 1000
  reconnectBackoffRate?: number;    // Default: 1.5
  
  // Health Check
  pingInterval?: number;            // Default: 30000
  pongTimeout?: number;            // Default: 5000
  
  // Message Handling
  messageQueueSize?: number;        // Default: 100
  messageTimeout?: number;          // Default: 5000
  
  // Rate Limiting
  rateLimit?: {
    messages: number;               // Default: 100
    window: number;                 // Default: 1000
  };
}
```
  
  
  
## 2. Transition Specifications
  
### 2.1 State: `disconnected`
  
#### Incoming Transitions
| From State | Event | Guard Conditions | Context Updates |
|------------|-------|------------------|-----------------|
| `connecting` | `CLOSE` | None | Clear socket reference |
| `reconnecting` | `MAX_RETRIES` | `reconnectAttempts >= maxReconnectAttempts` | Reset retry counters |
| `disconnecting` | `CLOSE` | None | Record disconnect time |
| Any | `TERMINATE` | None | Reset all state |
  
#### Outgoing Transitions
| To State | Event | Guard Conditions | Context Updates |
|----------|-------|------------------|-----------------|
| `connecting` | `CONNECT` | Valid URL provided | Store connection config |
  
### 2.2 State: `connecting`
  
#### Incoming Transitions
| From State | Event | Guard Conditions | Context Updates |
|------------|-------|------------------|-----------------|
| `disconnected` | `CONNECT` | Valid URL | Initialize connection attempt |
| `reconnecting` | `RETRY` | Within retry limits | Increment retry counter |
  
#### Outgoing Transitions
| To State | Event | Guard Conditions | Context Updates |
|----------|-------|------------------|-----------------|
| `connected` | `OPEN` | None | Record connect time |
| `reconnecting` | `ERROR` | `reconnect === true` | Store error information |
| `disconnected` | `ERROR` | `reconnect === false` | Store error, cleanup |
| `disconnected` | `CLOSE` | None | Record disconnect time |
  
### 2.3 State: `connected`
  
#### Incoming Transitions
| From State | Event | Guard Conditions | Context Updates |
|------------|-------|------------------|-----------------|
| `connecting` | `OPEN` | None | Initialize connection state |
  
#### Outgoing Transitions
| To State | Event | Guard Conditions | Context Updates |
|----------|-------|------------------|-----------------|
| `reconnecting` | `ERROR` | `reconnect === true` | Store error information |
| `disconnected` | `ERROR` | `reconnect === false` | Store error, cleanup |
| `reconnecting` | `CLOSE` | `reconnect === true` | Record disconnect time |
| `disconnecting` | `DISCONNECT` | None | Prepare for disconnect |
  
### 2.4 State: `reconnecting`
  
#### Incoming Transitions
| From State | Event | Guard Conditions | Context Updates |
|------------|-------|------------------|-----------------|
| `connecting` | `ERROR` | Within retry limits | Store error, increment counter |
| `connected` | `ERROR` | Within retry limits | Store error, increment counter |
| `connected` | `CLOSE` | Within retry limits | Store reason, increment counter |
  
#### Outgoing Transitions
| To State | Event | Guard Conditions | Context Updates |
|----------|-------|------------------|-----------------|
| `connecting` | `RETRY` | Within retry limits | Calculate backoff |
| `disconnected` | `MAX_RETRIES` | Exceeded retry limits | Reset retry state |
  
### 2.5 State: `disconnecting`
  
#### Incoming Transitions
| From State | Event | Guard Conditions | Context Updates |
|------------|-------|------------------|-----------------|
| `connected` | `DISCONNECT` | None | Prepare for disconnect |
  
#### Outgoing Transitions
| To State | Event | Guard Conditions | Context Updates |
|----------|-------|------------------|-----------------|
| `disconnected` | `CLOSE` | None | Record disconnect time |
  
## 3. Action Specifications
  
### 3.1 Entry Actions
  
| State | Action | Description |
|-------|--------|-------------|
| `disconnected` | `cleanupResources` | Clear socket, timers, queues |
| `connecting` | `initializeConnection` | Create WebSocket, bind events |
| `connected` | `startHeartbeat` | Initialize ping/pong cycle |
| `reconnecting` | `calculateBackoff` | Determine next retry delay |
| `disconnecting` | `initiateClose` | Begin graceful shutdown |
  
### 3.2 Exit Actions
  
| State | Action | Description |
|-------|--------|-------------|
| `disconnected` | `prepareConnect` | Setup new connection attempt |
| `connecting` | `cleanupOnFailure` | Remove event listeners on failure |
| `connected` | `stopHeartbeat` | Clear ping/pong timers |
| `reconnecting` | `clearBackoff` | Clear retry timers |
| `disconnecting` | None | No special cleanup needed |
  
### 3.3 Transition Actions
  
```typescript
interface TransitionAction {
  name: string;
  execute: (context: WebSocketContext, event: WebSocketEvent) => void;
  rollback?: (context: WebSocketContext, event: WebSocketEvent) => void;
}
```
  
#### Connection Management
| Action | Description | Context Updates | Side Effects |
|--------|-------------|-----------------|--------------|
| `createSocket` | Create new WebSocket | Store socket reference | WebSocket constructor |
| `bindSocketEvents` | Attach event handlers | None | DOM event listeners |
| `unbindSocketEvents` | Remove event handlers | None | Remove listeners |
| `closeSocket` | Close active connection | Clear socket | WebSocket.close() |
  
#### State Management
| Action | Description | Context Updates | Side Effects |
|--------|-------------|-----------------|--------------|
| `updateConnectionState` | Update connection info | Status, timing | None |
| `incrementRetryCounter` | Track retry attempts | Retry count | None |
| `resetRetryState` | Clear retry tracking | Reset counters | Clear timers |
| `updateHealthMetrics` | Update health data | Latency, status | None |
  
#### Message Handling
| Action | Description | Context Updates | Side Effects |
|--------|-------------|-----------------|--------------|
| `enqueueMessage` | Add to send queue | Queue state | None |
| `processQueue` | Send queued messages | Queue state | WebSocket.send() |
| `handleMessage` | Process received | Message counts | None |
| `clearMessageQueue` | Reset queue | Queue state | None |
  
#### Health Check
| Action | Description | Context Updates | Side Effects |
|--------|-------------|-----------------|--------------|
| `sendPing` | Send ping message | Ping timing | WebSocket.send() |
| `handlePong` | Process pong | Pong timing, latency | None |
| `schedulePing` | Setup next ping | None | Set timeout |
| `clearPingTimer` | Cancel ping cycle | None | Clear timeout |
  
#### Error Handling
| Action | Description | Context Updates | Side Effects |
|--------|-------------|-----------------|--------------|
| `recordError` | Log error details | Error history | None |
| `triggerReconnect` | Initiate retry | Retry state | None |
| `notifyError` | External error report | None | Callbacks |
  
### 3.4 Action Compositions
  
Common sequences of actions that work together:
  
```typescript
// Connection Establishment
const establishConnection = sequence([
  createSocket,
  bindSocketEvents,
  updateConnectionState,
  startHeartbeat
]);
  
// Graceful Shutdown
const performShutdown = sequence([
  stopHeartbeat,
  unbindSocketEvents,
  closeSocket,
  updateConnectionState
]);
  
// Reconnection Attempt
const attemptReconnect = sequence([
  calculateBackoff,
  incrementRetryCounter,
  createSocket,
  bindSocketEvents
]);
  
// Message Processing
const processMessage = sequence([
  handleMessage,
  updateHealthMetrics,
  processQueue
]);
```
  
### 3.5 Action Error Handling
  
```typescript
interface ActionError {
  action: string;
  error: Error;
  context: WebSocketContext;
  event: WebSocketEvent;
  recovery?: TransitionAction;
}
  
// Error handling strategy for each action type
const actionErrorHandlers: Record<string, (error: ActionError) => void> = {
  createSocket: (error) => {
    recordError(error);
    triggerReconnect();
  },
  sendPing: (error) => {
    recordError(error);
    clearPingTimer();
  },
  processQueue: (error) => {
    recordError(error);
    clearMessageQueue();
  }
  // ... other handlers
};
```
  
  
  
## 4. Transition Guard Specifications
  
### 4.1 Guard Conditions
  
```typescript
interface GuardCondition {
  name: string;
  predicate: (context: WebSocketContext, event: WebSocketEvent) => boolean;
  errorMessage?: string;
}
```
  
#### Connection Guards
| Guard | Logic | Error Message |
|-------|-------|---------------|
| `isValidUrl` | `URL.canParse(url) && ['ws:', 'wss:'].includes(new URL(url).protocol)` | "Invalid WebSocket URL" |
| `isWithinRetryLimit` | `context.reconnectAttempts < context.maxReconnectAttempts` | "Max retry attempts exceeded" |
| `canReconnect` | `context.options.reconnect && !context.isCleanDisconnect` | "Reconnection not allowed" |
| `isRateLimited` | `(context.messageCount / windowSize) >= context.rateLimit.messages` | "Rate limit exceeded" |
| `hasActiveConnection` | `context.socket?.readyState === WebSocket.OPEN` | "No active connection" |
  
#### Message Guards
| Guard | Logic | Error Message |
|-------|-------|---------------|
| `canSendMessage` | `hasActiveConnection && !isRateLimited` | "Cannot send message" |
| `hasQueueSpace` | `context.messageQueue.length < context.messageQueueSize` | "Message queue full" |
| `isValidMessage` | `event.data !== undefined && event.data !== null` | "Invalid message data" |
| `canProcessQueue` | `!context.processingMessage && hasActiveConnection` | "Cannot process queue" |
  
### 4.2 Guard Composition
  
```typescript
const canAttemptReconnect = all([
  canReconnect,
  isWithinRetryLimit,
  not(isRateLimited)
]);
  
const canInitiateConnection = all([
  isValidUrl,
  not(hasActiveConnection),
  not(isRateLimited)
]);
```
  
## 5. Action Error Recovery
  
### 5.1 Recovery Strategies
  
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
```
  
#### Core Recovery Strategies
| Action | Strategy | Max Attempts | Timeout | Fallback |
|--------|----------|--------------|---------|-----------|
| `createSocket` | Exponential Backoff | 5 | 30s | Force Disconnect |
| `sendMessage` | Linear Retry | 3 | 5s | Queue Message |
| `processQueue` | Immediate Retry | 2 | 3s | Clear Queue |
| `ping` | Skip | 1 | 1s | Reset Connection |
  
## 6. State Machine Integration
  
### 6.1 External System Integration
  
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
```
  
### 6.2 Event Processing
  
```typescript
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
  
## 7. State Persistence
  
### 7.1 Persistence Configuration
  
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
```
  
### 7.2 Persistence Operations
| Operation | Description | Failure Handling |
|-----------|-------------|------------------|
| `saveState` | Persist current state | Retry with backoff |
| `loadState` | Restore saved state | Use defaults |
| `clearState` | Remove saved state | Force clear |
| `migrateState` | Update state format | Keep original |
  
## 8. Testing Requirements
  
### 8.1 Unit Test Scenarios
  
#### State Transitions
| **Test Case** | **Initial State** | **Event** | **Expected State** | **Description** |
|---------------|-------------------|-----------|-------------------|-----------------|
| Basic Connect | `disconnected` | `CONNECT` | `connecting` | Connect with valid URL |
| Connect Error | `connecting` | `ERROR` | `reconnecting` | Handle connection failure |
| Connect Success | `connecting` | `OPEN` | `connected` | Handle successful connection |
| Clean Disconnect | `connected` | `DISCONNECT` | `disconnecting` | Handle clean disconnection |
| Error Reconnect | `connected` | `ERROR` | `reconnecting` | Handle error with reconnection |
| Max Retries | `reconnecting` | `MAX_RETRIES` | `disconnected` | Stop after max attempts |
  
#### Action Tests
| **Action** | **Context Changes** | **Success Criteria** | **Side Effects** |
|------------|-------------------|---------------------|------------------|
| `createSocket` | Set socket instance | Valid WebSocket instance | New WebSocket() |
| `updateMetrics` | Increment counters | Updated metric values | None |
| `queueMessage` | Add to message queue | Queue length increased | None |
| `resetState` | Clear state data | Initial state values | Clear timers |
  
### 8.2 Integration Test Scenarios
  
#### Network Conditions
| **Scenario** | **Setup** | **Validation** |
|-------------|-----------|----------------|
| Stable Connection | Normal latency | Messages delivered |
| High Latency | 500ms delay | Timeout handling |
| Packet Loss | Drop 10% | Retry mechanism |
| Network Change | Switch connection | Auto reconnect |
  
#### Load Testing
| **Scenario** | **Parameters** | **Success Criteria** |
|-------------|---------------|-------------------|
| Message Flood | 100 msg/sec | No message loss |
| Concurrent Connections | 10 clients | Stable performance |
| Long Duration | 24 hour test | No memory leaks |
| Reconnection Storm | 10 retries/sec | Proper backoff |
  
### 8.3 Mock Requirements
  
| **Method** | **Parameters** | **Description** |
|------------|---------------|-----------------|
| `simulateOpen` | None | Trigger open event |
| `simulateError` | `error: Error` | Trigger error event |
| `simulateClose` | `code: number, reason: string` | Trigger close event |
| `simulateMessage` | `data: any` | Trigger message event |
| `getState` | None | Get mock state |
| `getSentMessages` | None | Get sent message history |
  
### 8.4 Test Infrastructure
  
#### Directory Structure
```
qi/core/tests/unit/network/websocket/
├── machine.test.ts    // State machine tests
├── client.test.ts     // Client integration tests
└── mocks.ts          // Test mocks and utilities
```
  
#### Essential Test Utilities
| **Utility** | **Purpose** | **Usage** |
|------------|------------|-----------|
| `createTestActor` | Create machine instance | Setup test cases |
| `waitForState` | Wait for state transition | Async assertions |
| `sendTestMessage` | Send test data | Message testing |
| `assertTransition` | Verify state change | Transition testing |
  
### 8.5 Coverage Requirements
  
| **Category** | **Minimum %** | **Critical Paths** |
|-------------|--------------|------------------|
| Statements | 90% | State transitions |
| Branches | 85% | Error handling |
| Functions | 90% | Reconnection logic |
| Lines | 90% | Message processing |
  
### 8.6 Test Implementation Example
  
```typescript
describe('WebSocket Machine', () => {
  it('connect: disconnected -> connecting', () => {
    const actor = createTestActor();
    actor.start();
  
    actor.send({ 
      type: 'CONNECT', 
      url: 'ws://localhost:8080' 
    });
  
    expect(actor.getSnapshot().value).toBe('connecting');
  });
  
  it('error: connecting -> reconnecting', async () => {
    const actor = createTestActor();
    actor.start();
  
    // Transition to connecting
    actor.send({ type: 'CONNECT', url: 'ws://localhost' });
  
    // Simulate error
    actor.send({ 
      type: 'ERROR', 
      error: new Error('Connection failed') 
    });
  
    expect(actor.getSnapshot().value).toBe('reconnecting');
  });
});
```
  
## 9. Performance Requirements
  
### 9.1 Metrics
  
| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Connection Time | < 1s | > 3s |
| Message Latency | < 100ms | > 500ms |
| Reconnection Time | < 2s | > 5s |
| Memory Usage | < 50MB | > 100MB |
  
### 9.2 Rate Limiting
  
```typescript
interface RateLimitConfig {
  messages: {
    window: number;      // Time window in ms
    maxCount: number;    // Max messages per window
    burstSize: number;   // Max burst size
  };
  connections: {
    window: number;      // Time window in ms
    maxCount: number;    // Max connections per window
  };
}
```
  
## 10. Security Requirements
  
### 10.1 Connection Security
  
```typescript
interface SecurityConfig {
  // TLS Configuration
  tls: {
    enabled: boolean;
    minVersion: string;
    ciphers: string[];
  };
  
  // Authentication
  auth: {
    type: 'token' | 'basic' | 'custom';
    credentials?: () => Promise<string>;
    headers?: Record<string, string>;
  };
  
  // Message Security
  messages: {
    validateIncoming: boolean;
    sanitizeOutgoing: boolean;
    maxSize: number;
  };
}
```
  
### 10.2 Security Validations
| Check | Timing | Action on Failure |
|-------|---------|------------------|
| URL Validation | Pre-connect | Reject connection |
| Token Expiry | Pre-message | Reconnect |
| Message Size | Pre-send | Reject message |
| Origin Check | Connection | Close connection |
  
  
  
  