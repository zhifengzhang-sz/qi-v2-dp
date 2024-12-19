# WebSocket State Machine Implementation Guide (XState v5)

## 1. Dependency Structure

### Core Module Dependencies
```
errors.ts (base error types)
├── types.ts (core type definitions)
│   ├── services.ts (WebSocket lifecycle)
│   ├── actions.ts (state updates)
│   ├── guards.ts (transition conditions)
│   └── machine.ts (state machine definition)
└── constants.ts (shared constants)
    └── machine.ts
```

### Feature Dependencies

1. **Type System**
```
NetworkErrorContext (errors.ts)
└── WebSocketError (types.ts)
    ├── Error Events (types.ts)
    └── Error Handling (services.ts)
```

2. **State Management**
```
ConnectionState (constants.ts)
├── WebSocketContext (types.ts)
└── State Machine (machine.ts)
```

3. **Event Flow**
```
WebSocketEvents (types.ts)
├── Event Creation (services.ts)
├── Event Handling (actions.ts)
└── State Transitions (machine.ts)
```

## 2. XState v5 Key Patterns

### 2.1 Type System

1. **Machine Type Definition**
```typescript
// ✅ V5 Pattern
type WebSocketMachine = {
  context: WebSocketContext;
  events: WebSocketEvents;
};

const machine = createMachine({
  types: {} as WebSocketMachine,
  // ...
});
```

2. **Event Type Definitions**
```typescript
// ✅ V5 Pattern: Union Types for Events
type WebSocketEvents =
  | { type: "CONNECT"; url: string }
  | { type: "DISCONNECT" }
  | { type: "MESSAGE"; data: unknown };

// ❌ Avoid V4 Patterns:
// - No EventObject extension
// - No SCXML event types
```

3. **Context Types**
```typescript
// ✅ V5 Pattern: Explicit Readonly
interface WebSocketContext {
  readonly url: string;
  readonly protocols: readonly string[];
  socket: WebSocket | null;
  readonly status: ConnectionState;
}
```

### 2.2 Action Implementation

```typescript
// ✅ V5 Pattern: Pure Functions
function handleError(
  context: WebSocketContext,
  event: Extract<WebSocketEvents, { type: "ERROR" }>
): WebSocketContext {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      totalErrors: context.metrics.totalErrors + 1
    }
  };
}

// ❌ Avoid V4 Patterns:
// - No assign
// - No send or raise
```

### 2.3 Service Implementation

```typescript
// ✅ V5 Pattern
const webSocketService = fromCallback<WebSocketContext, WebSocketEvents>(
  ({ input: context, self }) => {
    // Implementation
    return () => {
      // Cleanup
    };
  }
);

// ❌ Avoid V4 Patterns:
// - No invoke
// - No service creators
```

## 3. Implementation Features

### 3.1 Error Handling

1. **Error Types**
```typescript
interface WebSocketError extends Error {
  readonly statusCode: number;
  readonly code: number;
  readonly details: WebSocketErrorContext;
}

interface WebSocketErrorContext {
  readonly connectionAttempts: number;
  readonly totalErrors: number;
}
```

2. **Error Creation**
```typescript
function createWebSocketError(
  message: string,
  originalError: Error,
  context: WebSocketErrorContext
): WebSocketError {
  // Implementation
}
```

### 3.2 State Management

1. **Context Updates**
```typescript
// Pure function approach
function updateMetrics(context: WebSocketContext): WebSocketContext {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      lastUpdate: Date.now()
    }
  };
}
```

2. **State Tracking**
```typescript
interface WebSocketMetrics {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly messageTimestamps: readonly number[];
}
```

## 4. Migration Considerations

### 4.1 Type System Updates

1. **Remove V4 Dependencies**
- Remove EventObject imports/usage
- Remove SCXML type references
- Remove v4-specific type constraints

2. **Add V5 Features**
- Add proper readonly markers
- Use union types for events
- Use type inference helpers

3. **Update Service Types**
- Use fromCallback with proper types
- Remove invoke patterns
- Update event sending types

### 4.2 Common Patterns to Keep

1. **Error Handling**
```typescript
// Keep these patterns
- Strong error typing
- Context enrichment
- Error recovery logic
```

2. **State Management**
```typescript
// Keep these patterns
- Immutable updates
- Metrics tracking
- Queue management
```

## 5. Best Practices

1. **Type Safety**
- Use Extract<> for event type narrowing
- Mark appropriate properties as readonly
- Use const assertions for literals

2. **Error Handling**
- Type all error scenarios
- Include context in errors
- Maintain error history

3. **State Updates**
- Use pure functions
- Maintain immutability
- Track metrics consistently

## 6. Testing Strategy

1. **Type Testing**
```typescript
// Test type constraints
const validContext: WebSocketContext = {
  // implementation
};

// Test event types
const validEvent: WebSocketEvents = {
  type: "CONNECT",
  url: "ws://example.com"
};
```

2. **Error Testing**
```typescript
test("creates proper error context", () => {
  const error = createWebSocketError(/*...*/);
  expect(error.details).toHaveProperty("connectionAttempts");
});
```