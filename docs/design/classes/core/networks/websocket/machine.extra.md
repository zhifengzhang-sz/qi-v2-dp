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

