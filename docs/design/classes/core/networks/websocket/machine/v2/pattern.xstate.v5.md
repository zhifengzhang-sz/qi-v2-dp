# XState v5 Implementation Patterns

## 1. Factory Pattern

### 1.1 Correct Implementation
```typescript
// ✅ Correct: Use factory function with setup
export const createWebSocketMachine = (config: WebSocketConfig) => {
  return setup({
    types: {
      context: {} as WebSocketContext,
      events: {} as WebSocketEvent
    },
    guards: {
      canConnect: /* ... */
    },
    actions: {
      createSocket: /* ... */
    }
  }).createMachine({
    id: 'webSocket',
    initial: 'disconnected',
    context: config, // Direct context assignment
    states: {
      // ... state definitions
    }
  });
};

// Usage
const machine = createWebSocketMachine({
  url: 'ws://example.com',
  maxRetries: 3
});
```

### 1.2 Anti-patterns to Avoid
```typescript
// ❌ Wrong: Direct machine creation without setup
const machine = createMachine({
  context: initialContext,
  states: {/* ... */}
});

// ❌ Wrong: Using callable machines
const machine = createWebSocketMachine();
const configuredMachine = machine.provide({
  context: config  // Don't do this!
});

// ❌ Wrong: Using .withContext
const configuredMachine = machine.withContext(config);  // Don't do this!
```

## 2. Context Management

### 2.1 Direct Context Assignment
```typescript
// ✅ Correct: Direct context in factory
export const createWebSocketMachine = (config: WebSocketConfig) => {
  return setup({
    // No input type needed in types
    types: {
      context: {} as WebSocketContext,
      events: {} as WebSocketEvent
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
```

### 2.2 Anti-patterns to Avoid
```typescript
// ❌ Wrong: Using .provide() for context
const machine = createWebSocketMachine();
const withContext = machine.provide({
  context: {
    url: 'ws://example.com'
  }
});

// ❌ Wrong: Using input type in setup
setup({
  types: {
    input: {} as WebSocketConfig,  // Don't specify input type
    context: {} as WebSocketContext,
    events: {} as WebSocketEvent
  }
});
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

// ✅ Correct: Export machine type
export type WebSocketMachine = ReturnType<typeof createWebSocketMachine>;
```

### 3.2 Using Satisfies
```typescript
// ✅ Correct: Use satisfies for strict typing
const machine = setup({
  /* ... */
}).createMachine({
  context: {
    url: config.url,
    socket: null,
    retryCount: 0
  } satisfies WebSocketContext
});
```

### 3.3 Type Checking Examples
```typescript
// ✅ Correct: Type checking in actions
const actions = {
  createSocket: ({ context, event }: {
    context: WebSocketContext;
    event: { type: 'CONNECT'; url: string }
  }) => ({
    ...context,
    socket: new WebSocket(event.url)
  })
} satisfies ActionObject;

// ✅ Correct: Type checking in guards
const guards = {
  canConnect: ({ context }: {
    context: WebSocketContext
  }) => !context.socket && context.retryCount < context.maxRetries
} satisfies GuardObject;
```

## 4. Integration with Modules

### 4.1 Combining with Core Modules
```typescript
// ✅ Correct: Integrating with modular structure
import { actions } from './core/actions';
import { guards } from './support/guards';
import { transitions } from './core/transitions';

export const createWebSocketMachine = (config: WebSocketConfig) => {
  return setup({
    types: {
      context: {} as WebSocketContext,
      events: {} as WebSocketEvent
    },
    guards,
    actions
  }).createMachine({
    id: 'webSocket',
    initial: STATES.DISCONNECTED,
    context: config,
    states: transitions
  });
};
```

### 4.2 Testing Type Safety
```typescript
// test/types.test.ts
import { expect, test } from 'vitest';
import { createWebSocketMachine } from '../src/machine';

test('types are correctly inferred', () => {
  const machine = createWebSocketMachine({
    url: 'ws://example.com',
    maxRetries: 3
  });

  // Type checking
  type MachineContext = typeof machine extends {
    context: infer C;
  } ? C : never;

  expectTypeOf<MachineContext>().toMatchTypeOf<WebSocketContext>();
});
```

## 5. Common Pitfalls

### 5.1 Actor Creation
```typescript
// ❌ Wrong: Using deprecated interpret
const service = interpret(machine).start();

// ✅ Correct: Using createActor
const actor = createActor(machine);
actor.start();
```

### 5.2 Action Implementation
```typescript
// ❌ Wrong: Using assign
const actions = {
  incrementRetry: assign({
    retryCount: (context) => context.retryCount + 1
  })
};

// ✅ Correct: Direct context updates
const actions = {
  incrementRetry: ({ context }) => ({
    ...context,
    retryCount: context.retryCount + 1
  })
};
```

### 5.3 Type Assertions
```typescript
// ❌ Wrong: Using type assertions
setup({
  types: {
    context: {} as any,  // Don't do this!
    events: {} as unknown
  }
});

// ✅ Correct: Proper type definitions
setup({
  types: {
    context: {} as WebSocketContext,
    events: {} as WebSocketEvent
  }
});
```

## 6. Best Practices

1. **Always use setup()**: Never create machines directly with createMachine()
2. **Direct context assignment**: Avoid .provide() and .withContext()
3. **Type definitions in setup**: Define all types within setup() config
4. **Use satisfies**: For better type inference and checking
5. **Export machine types**: For consumer type safety
6. **Avoid type assertions**: Use proper type definitions
7. **Use createActor**: Instead of interpret for actor creation
8. **Pure actions**: Return new context instead of using assign

These patterns ensure type safety, maintainability, and correct usage of XState v5 features while avoiding common pitfalls from v4 patterns.