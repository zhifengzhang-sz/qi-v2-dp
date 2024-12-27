# WebSocket State Machine - Implementation Guide (Phase 1)

## XState v5 Patterns

### Machine Creation

```typescript
// ✅ Correct Pattern
const machine = setup({
  types: {
    context: {} as WebSocketContext,
    events: {} as WebSocketEvents,
    input: {} as WebSocketOptions,
  },
  guards: {
    // Guard implementations
  },
  actions: {
    // Action implementations
  },
  actors: {
    // Actor implementations
  },
}).createMachine({
  id: "webSocket",
  initial: "disconnected",
  context: ({ input }) => createInitialContext(input),
  states: {
    // State definitions
  },
});

// ❌ Wrong Pattern (v4 style)
createMachine({
  context: initialContext,
  states: {
    // State definitions
  },
});
```

### Actions Implementation

```typescript
// ✅ Correct Pattern
actions: {
  createSocket: ({ context, event }) => ({
    ...context,
    socket: new WebSocket(event.url)
  }),

  updateState: ({ context, event }) => ({
    ...context,
    status: event.status
  })
}

// ❌ Wrong Pattern (using assign)
actions: {
  createSocket: assign({
    socket: (context, event) => new WebSocket(event.url)
  }),

  updateState: assign({
    status: (context, event) => event.status
  })
}
```

### Actor Implementation

```typescript
// ✅ Correct Pattern
actors: {
  webSocketActor: fromPromise(async ({ input, emit }) => {
    const socket = new WebSocket(input.url);

    socket.onopen = () => emit({ type: 'OPEN' });
    socket.onclose = () => emit({ type: 'CLOSE' });

    return () => socket.close();
  })
}

// ❌ Wrong Pattern (v4 style)
invoke: {
  src: (context) => createWebSocket(context),
  onDone: 'connected',
  onError: 'error'
}
```

## Layer Implementation Guidelines

### Layer 1: Foundation

#### constants.ts

```typescript
export const STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
  TERMINATED: "terminated",
} as const;

export type State = (typeof STATES)[keyof typeof STATES];
```

#### errors.ts

```typescript
export const ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  INVALID_URL: "INVALID_URL",
  MAX_RETRIES_EXCEEDED: "MAX_RETRIES_EXCEEDED",
} as const;

export interface ErrorContext {
  code: keyof typeof ERROR_CODES;
  message: string;
  timestamp: number;
}

type ErrorHandler = {
  handleNetworkError: () => void;
  handleProtocolError: () => void;
  handleTimeoutError: () => void;
};
```

### Layer 2: Types

#### types.ts

```typescript
export interface WebSocketContext {
  url: string;
  socket: WebSocket | null;
  status: ConnectionStatus;
  // ... other properties
}

export interface WebSocketEvent {
  type: string;
  // ... event specific properties
}
```

### Layer 3: Utils

#### utils.ts

```typescript
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const generateMessageId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
```

### Layer 4: Components

#### events.ts

```typescript
export const createConnectEvent = (url: string) => ({
  type: "CONNECT",
  url,
});

export const createDisconnectEvent = (reason?: string) => ({
  type: "DISCONNECT",
  reason,
});
```

## State Transition Matrix

The following matrix defines all valid state transitions:

| From          | To            | Guard         | Valid |
| ------------- | ------------- | ------------- | ----- |
| disconnected  | connecting    | canConnect    | ✓     |
| connecting    | connected     | -             | ✓     |
| connected     | disconnecting | canDisconnect | ✓     |
| disconnecting | disconnected  | -             | ✓     |
| \*            | reconnecting  | shouldRetry   | ✓     |

### Implementation Guidelines

```typescript
// Guard implementations
guards: {
  canConnect: ({ context }) =>
    !context.socket && context.reconnectAttempts < context.maxReconnectAttempts,

  canDisconnect: ({ context }) =>
    context.socket && context.status === 'connected',

  shouldRetry: ({ context, event }) =>
    context.status !== 'terminated' &&
    event.type === 'ERROR' &&
    context.reconnectAttempts < context.maxReconnectAttempts
}
```

## Resource Management Guidelines

### 1. Cleanup Triggers

Implement cleanup for all scenarios:

```typescript
// Cleanup implementation
const cleanup = () => {
  // 1. Explicit disconnect
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }

  // 2. Error conditions
  removeEventListeners();
  clearBuffers();

  // 3. Page unload
  window.removeEventListener("beforeunload", cleanup);

  // 4. Timeout cleanup
  clearTimeout(reconnectTimer);
  clearTimeout(pingTimer);

  // 5. Max retries cleanup
  resetRetryCount();
  clearMessageQueue();
};
```

### 2. Memory Management

Implement strict memory controls:

```typescript
// Message queue size management
const queueMessage = ({ context, message }) => {
  if (context.messageQueue.length >= context.messageQueueSize) {
    // Remove oldest low-priority message
    const filteredQueue = context.messageQueue
      .filter((msg) => msg.priority === "high")
      .slice(-context.messageQueueSize);
    return {
      ...context,
      messageQueue: [...filteredQueue, message],
    };
  }
  return {
    ...context,
    messageQueue: [...context.messageQueue, message],
  };
};
```

## Best Practices

### Type Safety

1. Define types explicitly
2. Use type inference wisely
3. Avoid type assertions
4. Maintain proper interfaces

### Pure Functions

1. No side effects in actions
2. Return new context objects
3. Keep functions focused
4. Use immutable patterns

### Resource Management

1. Clean up WebSocket connections
2. Handle timeouts properly
3. Manage message queues
4. Clear event listeners

### Error Handling

1. Define clear error types
2. Implement recovery paths
3. Clean up on errors
4. Propagate meaningful errors

## Common Pitfalls

### 1. Context Updates

```typescript
// ❌ Wrong: Mutating context
actions: {
  updateQueue: ({ context }) => {
    context.queue.push(newItem); // Mutation!
    return context;
  };
}

// ✅ Correct: Immutable update
actions: {
  updateQueue: ({ context }) => ({
    ...context,
    queue: [...context.queue, newItem],
  });
}
```

### 2. WebSocket Handling

```typescript
// ❌ Wrong: No cleanup
actors: {
  socketActor: fromPromise(async () => {
    const socket = new WebSocket(url);
    socket.onopen = () => {};
  });
}

// ✅ Correct: Proper cleanup
actors: {
  socketActor: fromPromise(async () => {
    const socket = new WebSocket(url);
    socket.onopen = () => {};
    return () => socket.close();
  });
}
```

### 3. Error Recovery

```typescript
// ❌ Wrong: No error handling
guards: {
  canConnect: ({ context }) => context.attempts < maxAttempts;
}

// ✅ Correct: Proper error handling
guards: {
  canConnect: ({ context }) =>
    context.status !== "terminated" &&
    context.attempts < context.maxAttempts &&
    !context.fatalError;
}
```

## Testing Strategies

### Unit Testing

```typescript
describe("WebSocket Actions", () => {
  test("createSocket should return new context", () => {
    const result = actions.createSocket({
      context: initialContext,
      event: { type: "CONNECT", url: "ws://test" },
    });

    expect(result.socket).toBeDefined();
    expect(result).not.toBe(initialContext);
  });
});
```

### Integration Testing

```typescript
describe("WebSocket Machine", () => {
  test("should handle connection lifecycle", () => {
    const machine = createWebSocketMachine();
    const actor = createActor(machine);

    actor.start();
    actor.send({ type: "CONNECT", url: "ws://test" });

    expect(actor.getSnapshot().value).toBe("connecting");
  });
});
```
