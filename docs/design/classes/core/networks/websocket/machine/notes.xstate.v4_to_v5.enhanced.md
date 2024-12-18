# XState v5 Comprehensive Implementation Guide

## Core Concepts

### 1. Pure Functions Over Special Types

#### Actions
```typescript
// ❌ V4 Style - Don't use
import { assign } from 'xstate';
const increment = assign({
  count: (context) => context.count + 1
});

// ✅ V5 Style - Pure function
function increment(context: Context) {
  return {
    ...context,
    count: context.count + 1
  };
}
```

#### Guards
```typescript
// ❌ V4 Style - Don't use
import { createGuard } from 'xstate';
const isAuthenticated = createGuard((context) => !!context.user);

// ✅ V5 Style - Predicate function
function isAuthenticated(context: Context) {
  return Boolean(context.user);
}
```

### 2. TypeScript Integration

#### Machine Type Definition
```typescript
interface MachineContext {
  count: number;
  user: User | null;
}

type MachineEvents = 
  | { type: "INCREMENT" }
  | { type: "LOGIN"; user: User }
  | { type: "LOGOUT" };

const machine = createMachine({
  types: {} as {
    context: MachineContext;
    events: MachineEvents;
  },
  // ... rest of machine config
});
```

#### Type Inference Examples
```typescript
// Let TypeScript infer event type
function handleLogin(context: Context, event: Extract<MachineEvents, { type: "LOGIN" }>) {
  return {
    ...context,
    user: event.user
  };
}

// Explicit typing for complex scenarios
function handleComplexEvent<T extends { type: "COMPLEX"; data: unknown }>(
  context: Context,
  event: T
): Context {
  return {
    ...context,
    data: validateAndTransform(event.data)
  };
}
```

### 3. Testing Practices

#### Action Testing
```typescript
describe('Authentication Actions', () => {
  const initialContext = {
    user: null,
    error: null
  };

  test('handleLogin updates user in context', () => {
    const user = { id: 1, name: 'Test' };
    const event = { type: 'LOGIN' as const, user };
    
    const result = handleLogin(initialContext, event);
    
    expect(result).toEqual({
      ...initialContext,
      user
    });
  });

  test('handleError preserves existing context', () => {
    const error = new Error('Test error');
    const event = { type: 'ERROR' as const, error };
    
    const result = handleError(initialContext, event);
    
    expect(result).toEqual({
      ...initialContext,
      error
    });
    expect(result.user).toBe(initialContext.user); // Verify unchanged properties
  });
});
```

#### Guard Testing
```typescript
describe('Authentication Guards', () => {
  const authenticatedContext = {
    user: { id: 1, permissions: ['read', 'write'] }
  };
  
  const unauthenticatedContext = {
    user: null
  };

  test('isAuthenticated returns true for authenticated user', () => {
    expect(isAuthenticated(authenticatedContext)).toBe(true);
  });

  test('hasPermission checks specific permission', () => {
    const event = { type: 'ACCESS' as const, permission: 'write' };
    
    expect(hasPermission(authenticatedContext, event)).toBe(true);
    expect(hasPermission(authenticatedContext, { ...event, permission: 'admin' })).toBe(false);
  });
});
```

### 4. Common Patterns and Best Practices

#### Context Updates
```typescript
// Nested updates
function updateNestedData(context: Context, event: DataEvent) {
  return {
    ...context,
    data: {
      ...context.data,
      [event.key]: {
        ...context.data[event.key],
        value: event.value
      }
    }
  };
}

// Array updates
function addItem(context: Context, event: AddEvent) {
  return {
    ...context,
    items: [...context.items, event.item]
  };
}

// Conditional updates
function conditionalUpdate(context: Context, event: UpdateEvent) {
  if (!event.shouldUpdate) return context;
  
  return {
    ...context,
    lastUpdate: Date.now()
  };
}
```

#### Guard Composition
```typescript
// Combine multiple conditions
function canPerformAction(context: Context, event: ActionEvent) {
  return (
    isAuthenticated(context) &&
    hasPermission(context, event) &&
    isWithinRateLimit(context)
  );
}

// Parameterized guards
function createMinimumValueGuard(minimum: number) {
  return (context: Context) => context.value >= minimum;
}
```

### 5. Migration Considerations

#### Deprecated Features
```typescript
// ❌ Deprecated v4 features
import { assign, send, raise } from 'xstate';
import { createModel } from '@xstate/model';

// ✅ V5 replacements
function updateContext(context: Context) {
  return { ...context, updated: true };
}

const machine = createMachine({
  on: {
    EVENT: {
      actions: (context) => {
        // Direct side effects or context updates
      }
    }
  }
});
```

#### Common Migration Pitfalls
1. Forgetting to remove v4 imports
2. Using assign instead of direct context updates
3. Not updating guard implementations
4. Missing type definitions in complex machines

## Practical Example: WebSocket Machine

```typescript
// Type definitions
type WebSocketEvent = 
  | { type: "CONNECT"; url: string }
  | { type: "DISCONNECT" }
  | { type: "MESSAGE"; data: unknown };

interface WebSocketContext {
  connected: boolean;
  messages: unknown[];
  error: Error | null;
}

// Actions
function handleConnect(context: WebSocketContext, event: Extract<WebSocketEvent, { type: "CONNECT" }>) {
  return {
    ...context,
    connected: true
  };
}

// Guards
function canConnect(context: WebSocketContext, event: Extract<WebSocketEvent, { type: "CONNECT" }>) {
  return !context.connected && isValidUrl(event.url);
}

// Machine definition
const wsManager = createMachine({
  types: {} as {
    context: WebSocketContext;
    events: WebSocketEvent;
  },
  context: {
    connected: false,
    messages: [],
    error: null
  },
  states: {
    disconnected: {
      on: {
        CONNECT: {
          target: 'connecting',
          guard: 'canConnect',
          actions: 'handleConnect'
        }
      }
    },
    // ... other states
  }
});
```

## What's Next

For the next chat session, provide:

1. Current implementation files:
   - machine.ts
   - actions.ts
   - guards.ts
   - types.ts
   - states.ts

2. Specific areas needing attention:
   - Complex type scenarios
   - Testing requirements
   - Performance considerations
   - Error handling patterns

3. Any specific features or patterns you want to implement

This will help focus the discussion on practical implementation details and improvements.