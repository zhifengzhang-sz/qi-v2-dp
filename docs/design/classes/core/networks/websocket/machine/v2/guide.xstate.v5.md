# XState v5 Technical Implementation Guide

## 1. Development Environment Setup

### 1.1 Project Initialization
```bash
# Create new project
pnpm create vite websocket-machine --template typescript
cd websocket-machine

# Install dependencies
pnpm add xstate@beta ws @types/ws
pnpm add -D vitest @vitest/coverage-v8 @testing-library/jest-dom
```

### 1.2 Configuration Files

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebSocketMachine',
      fileName: 'websocket-machine'
    }
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## 2. XState v5 Core Patterns

### 2.1 Factory Pattern
```typescript
// ✅ Correct: Use factory function with setup
export const createWebSocketMachine = (config: WebSocketConfig) => {
  return setup({
    types: {
      context: {} as WebSocketContext,
      events: {} as WebSocketEvent
    },
    guards: {
      canConnect: ({ context }) => !context.socket && !context.error
    },
    actions: {
      createSocket: ({ context, event }) => ({
        ...context,
        socket: new WebSocket(event.url)
      })
    }
  }).createMachine({
    id: 'webSocket',
    initial: 'disconnected',
    context: config, // Direct context assignment
    states: {
      // State definitions
    }
  });
};

// ❌ Wrong: Anti-patterns to avoid
// Don't create machine directly
const machine = createMachine({/*...*/});

// Don't use callable machines
const configuredMachine = machine.provide({/*...*/});

// Don't use withContext
const withContext = machine.withContext({/*...*/});
```

### 2.2 Context Management
```typescript
// ✅ Correct: Direct context assignment in factory
export const createWebSocketMachine = (config: WebSocketConfig) => {
  return setup({
    types: {
      context: {} as WebSocketContext,
      events: {} as WebSocketEvent
      // No input type needed
    }
  }).createMachine({
    context: {
      url: config.url,
      socket: null,
      retryCount: 0,
      maxRetries: config.maxRetries
    }
  });
};

// ❌ Wrong: Anti-patterns
// Don't use provide for context
const withContext = machine.provide({
  context: {/*...*/}
});

// Don't specify input type
setup({
  types: {
    input: {} as Config,  // Don't do this
    context: {} as Context
  }
});
```

### 2.3 Actions Implementation
```typescript
// ✅ Correct: Pure functions returning new context
const actions = {
  createSocket: ({ context, event }) => ({
    ...context,
    socket: new WebSocket(event.url)
  }),

  incrementRetry: ({ context }) => ({
    ...context,
    retryCount: context.retryCount + 1
  })
};

// ❌ Wrong: Using assign
const actions = {
  createSocket: assign({
    socket: (_, event) => new WebSocket(event.url)
  }),

  incrementRetry: assign({
    retryCount: (context) => context.retryCount + 1
  })
};
```

### 2.4 Guards Implementation
```typescript
// ✅ Correct: Pure boolean functions
const guards = {
  canConnect: ({ context }) => (
    !context.socket && 
    context.retryCount < context.maxRetries
  ),

  isHealthy: ({ context }) => (
    !!context.socket && 
    context.socket.readyState === WebSocket.OPEN
  )
};

// ❌ Wrong: Side effects or non-boolean returns
const guards = {
  canConnect: ({ context }) => {
    validateSocket(context.socket); // Side effect!
    return "yes"; // Non-boolean!
  }
};
```

### 2.5 Actor Implementation
```typescript
// ✅ Correct: Using fromPromise with cleanup
const socketActor = fromPromise(async ({ input, emit }) => {
  const socket = new WebSocket(input.url);
  
  const handlers = {
    open: () => emit({ type: 'OPEN' }),
    close: () => emit({ type: 'CLOSE' }),
    error: (error: Error) => emit({ type: 'ERROR', error })
  };

  // Attach handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.addEventListener(event, handler);
  });
  
  // Important: Return cleanup function
  return () => {
    // Remove handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.removeEventListener(event, handler);
    });
    socket.close();
  };
});

// ❌ Wrong: Using invoke
const service = {
  invoke: {
    src: (context) => setupSocket(context),
    onDone: 'connected',
    onError: 'error'
  }
};
```

## 3. Type Safety

### 3.1 Type Definitions
```typescript
// ✅ Correct: Define types in setup
export const createWebSocketMachine = (config: WebSocketConfig) => {
  return setup({
    types: {
      context: {} as {
        url: string;
        socket: WebSocket | null;
        retryCount: number;
        maxRetries: number;
      },
      events: {} as
        | { type: 'CONNECT'; url: string }
        | { type: 'DISCONNECT' }
        | { type: 'ERROR'; error: Error }
    }
  }).createMachine({
    // Machine definition
  });
};

// Export machine type
export type WebSocketMachine = ReturnType<typeof createWebSocketMachine>;
```

### 3.2 Using Satisfies
```typescript
// ✅ Correct: Use satisfies for type checking
const actions = {
  createSocket: ({ context, event }) => ({
    ...context,
    socket: new WebSocket(event.url)
  }),
  resetConnection: ({ context }) => ({
    ...context,
    socket: null,
    error: null
  })
} satisfies MachineActions;

const guards = {
  canConnect: ({ context }) => !context.socket,
  canRetry: ({ context }) => context.retryCount < context.maxRetries
} satisfies MachineGuards;
```

### 3.3 Strict Event Typing
```typescript
// ✅ Correct: Union type for events
type WebSocketEvent =
  | { type: 'CONNECT'; url: string }
  | { type: 'DISCONNECT' }
  | { type: 'OPEN' }
  | { type: 'CLOSE'; code: number; reason: string }
  | { type: 'ERROR'; error: Error }
  | { type: 'RETRY' };

// Event type guard
const isWebSocketEvent = (event: unknown): event is WebSocketEvent => {
  if (!event || typeof event !== 'object' || !('type' in event)) {
    return false;
  }
  
  const { type } = event as { type: string };
  return [
    'CONNECT', 'DISCONNECT', 'OPEN', 
    'CLOSE', 'ERROR', 'RETRY'
  ].includes(type);
};
```

## 4. Testing Patterns

### 4.1 Basic Machine Testing
```typescript
import { describe, test, expect } from 'vitest';
import { createActor } from 'xstate';
import { createWebSocketMachine } from '../src/machine';

describe('WebSocket Machine', () => {
  test('initial state', () => {
    const machine = createWebSocketMachine({
      maxRetries: 3
    });
    const actor = createActor(machine);
    
    actor.start();
    expect(actor.getSnapshot().value).toBe('disconnected');
  });

  test('connect transition', () => {
    const machine = createWebSocketMachine({
      maxRetries: 3
    });
    const actor = createActor(machine);
    
    actor.start();
    actor.send({ type: 'CONNECT', url: 'ws://test' });
    
    expect(actor.getSnapshot().value).toBe('connecting');
    expect(actor.getSnapshot().context.socket).toBeDefined();
  });
});
```

### 4.2 Mock Socket Testing
```typescript
import { vi } from 'vitest';

class MockWebSocket {
  private listeners: Record<string, Set<Function>> = {
    open: new Set(),
    close: new Set(),
    error: new Set()
  };

  readyState = WebSocket.CONNECTING;

  constructor(public url: string) {}

  addEventListener(event: string, callback: Function) {
    this.listeners[event]?.add(callback);
  }

  removeEventListener(event: string, callback: Function) {
    this.listeners[event]?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.listeners[event]?.forEach(cb => cb(data));
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.emit('close', { code: 1000, reason: 'Normal closure' });
  }

  // Helper methods for testing
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    this.emit('open');
  }

  simulateError(error: Error) {
    this.emit('error', error);
  }
}

vi.mock('ws', () => ({
  WebSocket: MockWebSocket
}));
```

### 4.3 Testing Complex Scenarios
```typescript
describe('WebSocket Complex Scenarios', () => {
  test('reconnection flow', async () => {
    const machine = createWebSocketMachine({
      maxRetries: 3
    });
    const actor = createActor(machine);
    actor.start();
    
    // Initial connection
    actor.send({ type: 'CONNECT', url: 'ws://test' });
    const socket = actor.getSnapshot().context.socket as MockWebSocket;
    
    // Simulate successful connection
    socket.simulateOpen();
    expect(actor.getSnapshot().value).toBe('connected');
    
    // Simulate error
    socket.simulateError(new Error('Connection lost'));
    expect(actor.getSnapshot().value).toBe('reconnecting');
    
    // Verify retry count
    expect(actor.getSnapshot().context.retryCount).toBe(1);
  });

  test('max retries exceeded', () => {
    const machine = createWebSocketMachine({
      maxRetries: 2
    });
    const actor = createActor(machine);
    actor.start();
    
    // Simulate multiple failures
    for (let i = 0; i <= 2; i++) {
      actor.send({ type: 'CONNECT', url: 'ws://test' });
      const socket = actor.getSnapshot().context.socket as MockWebSocket;
      socket.simulateError(new Error('Connection failed'));
    }
    
    expect(actor.getSnapshot().value).toBe('disconnected');
    expect(actor.getSnapshot().context.retryCount).toBe(2);
  });
});
```

## 5. Common Pitfalls & Solutions

### 5.1 Actor Creation
```typescript
// ❌ Wrong: Using deprecated interpret
const service = interpret(machine).start();

// ✅ Correct: Using createActor
const actor = createActor(machine);
actor.start();
```

### 5.2 Context Updates
```typescript
// ❌ Wrong: Mutating context
const updateContext = (context) => {
  context.retryCount += 1; // Mutation!
  return context;
};

// ✅ Correct: Immutable updates
const updateContext = (context) => ({
  ...context,
  retryCount: context.retryCount + 1
});
```

### 5.3 Event Handling
```typescript
// ❌ Wrong: Unsafe event handling
const handleEvent = (event) => {
  socket.send(event.data); // Unsafe!
};

// ✅ Correct: Type-safe event handling
const handleEvent = (event: WebSocketEvent) => {
  if (event.type !== 'MESSAGE') return;
  if (!isValidMessage(event.data)) return;
  socket.send(event.data);
};
```

### 5.4 Resource Cleanup
```typescript
// ❌ Wrong: Missing cleanup
const socketActor = fromPromise(async () => {
  const socket = new WebSocket(url);
  socket.onopen = () => {};
});

// ✅ Correct: Proper cleanup
const socketActor = fromPromise(async () => {
  const socket = new WebSocket(url);
  const cleanup = setupSocketListeners(socket);
  return () => {
    cleanup();
    socket.close();
  };
});
```

## 6. Best Practices Summary

1. **Machine Creation**
   - Always use `setup()` and factory pattern
   - Avoid direct machine creation
   - Don't use callable machines

2. **Context Management**
   - Use direct context assignment
   - Avoid `.provide()` and `.withContext()`
   - Maintain immutability

3. **Type Safety**
   - Define types in `setup()`
   - Use `satisfies` for type checking
   - Export machine types

4. **Actions and Guards**
   - Keep them pure
   - Return new context from actions
   - Return booleans from guards

5. **Resource Management**
   - Always implement cleanup
   - Remove event listeners
   - Close connections

6. **Testing**
   - Use `createActor`
   - Mock external dependencies
   - Test complex scenarios
   - Verify state transitions

7. **Error Handling**
   - Type-safe error handling
   - Proper error states
   - Recovery strategies