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
