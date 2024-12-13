# WebSocket Implementation Analysis and Plan

## 1. Current Implementation Analysis

### 1.1 Current Types
```typescript
// From current types.ts
interface WebSocketConfig {
  pingInterval?: number;
  pongTimeout?: number;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  connectionTimeout?: number;
}

interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

// From state.ts
type ConnectionState = 
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";
```

### 1.2 Current Architecture Components
- StateManager: Simple state transitions
- HeartbeatManager: Ping/Pong handling
- SubscriptionManager: Channel subscriptions
- Error handling: WebSocket specific errors

## 2. Mapping to New Specifications

### 2.1 State Expansion
```typescript
type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "reconnecting"    // New
  | "backingOff"      // New
  | "rateLimited"     // New
  | "suspended";      // New
```

### 2.2 Context Consolidation
```typescript
interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  
  // Configuration
  config: Required<WebSocketConfig>;
  
  // State Management
  connectTime: number;
  disconnectTime: number;
  isCleanDisconnect: boolean;
  
  // Current functionality mapping
  reconnectAttempts: number;
  messageQueue: QueuedMessage[];
  subscriptions: Map<string, Set<MessageHandler>>;
  
  // New functionality
  latency: number[];
  errorHistory: ErrorRecord[];
  metrics: ConnectionMetrics;
}
```

## 3. Implementation Plan

### Phase 1: Core Types and Constants
1. Create new `machine/types.ts`:
   - Event types
   - Context interface
   - Configuration types
   - Helper types

2. Create `machine/constants.ts`:
   - State constants
   - Event type constants
   - Configuration defaults
   - Timing constants

### Phase 2: State Machine Definition
1. Create base machine with states
2. Define events and transitions
3. Add guards
4. Implement actions
5. Add activity handlers

### Phase 3: Integration
1. Create new WebSocket client class
2. Implement service creation and management
3. Add event handlers and subscriptions
4. Migrate existing functionality

### Phase 4: Testing Infrastructure
1. Setup test utilities and mocks
2. Create state machine tests
3. Add integration tests
4. Implement E2E tests

## 4. Migration Strategy

### 4.1 Gradual Migration Steps
1. Keep existing client as `WebSocketClientLegacy`
2. Create new implementation as `WebSocketClient`
3. Allow both to coexist during migration
4. Add deprecation warnings to legacy client

### 4.2 Breaking Changes
```typescript
// Old usage
const client = new WebSocketClient({
  reconnect: true
});

// New usage
const client = createWebSocketClient({
  reconnection: {
    enabled: true,
    maxAttempts: 5
  }
});
```

## 5. Next Steps

### Immediate Tasks
1. Create new directory structure
2. Setup types and constants
3. Create basic state machine definition
4. Setup test infrastructure

### Future Tasks
1. Implement advanced features
2. Add metrics and monitoring
3. Create migration guides
4. Update documentation
