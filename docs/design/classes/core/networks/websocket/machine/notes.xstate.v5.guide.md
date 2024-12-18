# XState v5 Comprehensive Implementation and Migration Guide

This guide provides an in-depth look at implementing state machines using XState version 5. It covers the core concepts, highlights the differences from version 4, and offers best practices for effective usage, including migration steps for existing projects.

---

## Table of Contents

1. Core Concepts
   - 1. Pure Functions Over Special Types
     - Actions
     - Guards
   - 2. TypeScript Integration
     - Machine Type Definition
     - Type Inference Examples
   - 3. Testing Practices
     - Action Testing
     - Guard Testing
   - 4. Common Patterns and Best Practices
     - Context Updates
     - Guard Composition
   - 5. Migration Considerations
     - Deprecated Features
     - Common Migration Pitfalls
2. Practical Example: WebSocket Machine
3. Additional Resources
4. What's Next

---

## Core Concepts

### 1. Pure Functions Over Special Types

In XState v5, the emphasis is on simplicity and leveraging pure functions instead of special types or helper functions from the library.

#### Actions

**V4 Style (Deprecated):**

```typescript
// ❌ Don't use in v5
import { assign } from 'xstate';

const increment = assign({
  count: (context) => context.count + 1,
});
```

**V5 Style:**

```typescript
// ✅ Use pure functions
function increment(context: Context) {
  return {
    ...context,
    count: context.count + 1,
  };
}
```

- **Explanation:** Actions are now plain functions that receive `context` and optionally `event`, returning a new or updated context. There's no need to import or use `assign`.

#### Guards

**V4 Style (Deprecated):**

```typescript
// ❌ Don't use in v5
import { createGuard } from 'xstate';

const isAuthenticated = createGuard((context) => !!context.user);
```

**V5 Style:**

```typescript
// ✅ Use predicate functions
function isAuthenticated(context: Context) {
  return Boolean(context.user);
}
```

- **Explanation:** Guards are simple predicate functions that determine whether a transition should occur based on the `context` and `event`.

### 2. TypeScript Integration

TypeScript plays a significant role in XState v5, providing strong typing and improved type inference.

#### Machine Type Definition

Define your machine's context and events explicitly using TypeScript interfaces and types:

```typescript
interface MachineContext {
  count: number;
  user: User | null;
}

type MachineEvents =
  | { type: 'INCREMENT' }
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' };

const machine = createMachine({
  types: {} as {
    context: MachineContext;
    events: MachineEvents;
  },
  // ... rest of machine config
});
```

- **Explanation:** The `types` property in the machine configuration is used to explicitly define the types for context and events.

#### Type Inference Examples

Leverage TypeScript's type inference for actions and guards:

```typescript
// Action with inferred event type
function handleLogin(context: MachineContext, event: Extract<MachineEvents, { type: 'LOGIN' }>) {
  return {
    ...context,
    user: event.user,
  };
}

// Guard with explicit typing for complex events
function handleComplexEvent<T extends { type: 'COMPLEX'; data: unknown }>(
  context: MachineContext,
  event: T
): MachineContext {
  return {
    ...context,
    data: validateAndTransform(event.data),
  };
}
```

- **Explanation:** Using `Extract` helps narrow down the event type for better type safety within actions and guards.

### 3. Testing Practices

Testing is crucial to ensure the reliability of your state machines.

#### Action Testing

Test actions as pure functions:

```typescript
describe('Authentication Actions', () => {
  const initialContext = {
    user: null,
    error: null,
  };

  test('handleLogin updates user in context', () => {
    const user = { id: 1, name: 'Test' };
    const event = { type: 'LOGIN' as const, user };

    const result = handleLogin(initialContext, event);

    expect(result).toEqual({
      ...initialContext,
      user,
    });
  });

  test('handleError preserves existing context', () => {
    const error = new Error('Test error');
    const event = { type: 'ERROR' as const, error };

    const result = handleError(initialContext, event);

    expect(result).toEqual({
      ...initialContext,
      error,
    });
    expect(result.user).toBe(initialContext.user); // Verify unchanged properties
  });
});
```

- **Explanation:** Since actions are pure functions, they can be tested independently by passing in mock context and event objects.

#### Guard Testing

Test guards to ensure they return correct boolean values:

```typescript
describe('Authentication Guards', () => {
  const authenticatedContext = {
    user: { id: 1, permissions: ['read', 'write'] },
  };

  const unauthenticatedContext = {
    user: null,
  };

  test('isAuthenticated returns true for authenticated user', () => {
    expect(isAuthenticated(authenticatedContext)).toBe(true);
  });

  test('hasPermission checks specific permission', () => {
    const event = { type: 'ACCESS' as const, action: 'write' };

    expect(hasPermission(authenticatedContext, event)).toBe(true);
    expect(hasPermission(authenticatedContext, { ...event, action: 'admin' })).toBe(false);
  });
});
```

- **Explanation:** Guards are tested by checking their return values against different contexts and events.

### 4. Common Patterns and Best Practices

#### Context Updates

Handle various context update scenarios:

- **Nested Updates:**

  ```typescript
  function updateNestedData(context: Context, event: DataEvent) {
    return {
      ...context,
      data: {
        ...context.data,
        [event.key]: {
          ...context.data[event.key],
          value: event.value,
        },
      },
    };
  }
  ```

- **Array Updates:**

  ```typescript
  function addItem(context: Context, event: AddEvent) {
    return {
      ...context,
      items: [...context.items, event.item],
    };
  }
  ```

- **Conditional Updates:**

  ```typescript
  function conditionalUpdate(context: Context, event: UpdateEvent) {
    if (!event.shouldUpdate) return context;

    return {
      ...context,
      lastUpdate: Date.now(),
    };
  }
  ```

- **Explanation:** Always return a new context object to maintain immutability and ensure predictable state transitions.

#### Guard Composition

- **Combining Multiple Conditions:**

  ```typescript
  function canPerformAction(context: Context, event: ActionEvent) {
    return (
      isAuthenticated(context) &&
      hasPermission(context, event) &&
      isWithinRateLimit(context)
    );
  }
  ```

- **Parameterized Guards:**

  ```typescript
  function createMinimumValueGuard(minimum: number) {
    return (context: Context) => context.value >= minimum;
  }
  ```

- **Explanation:** Guards can be composed or parameterized for reuse and to handle complex conditional logic.

### 5. Migration Considerations

#### Deprecated Features

Remove or replace deprecated features from v4:

```typescript
// ❌ Deprecated v4 features
import { assign, send, raise } from 'xstate';
import { createModel } from '@xstate/model';

// ✅ V5 replacements
function updateContext(context: Context) {
  return { ...context, updated: true };
}

const machine = createMachine({
  // ...machine config
}, {
  actions: {
    // Actions as pure functions
  },
});
```

- **Explanation:** Deprecated functions like `assign`, `send`, and `raise` should be replaced with the newer v5 patterns.

#### Common Migration Pitfalls

1. **Forgetting to Remove v4 Imports:**
   - Ensure all imports from `xstate` that are specific to v4 are removed or updated.
2. **Using `assign` Instead of Direct Context Updates:**
   - Replace `assign` actions with functions that return updated context.
3. **Not Updating Guard Implementations:**
   - Rewrite guards as plain predicate functions.
4. **Missing Type Definitions in Complex Machines:**
   - Explicitly define types for context and events, especially in complex state machines.

---

## Practical Example: WebSocket Machine

Below is an example of implementing a WebSocket manager using XState v5, demonstrating the concepts discussed.

### Type Definitions

```typescript
type WebSocketEvent =
  | { type: 'CONNECT'; url: string }
  | { type: 'DISCONNECT' }
  | { type: 'MESSAGE'; data: unknown }
  | { type: 'ERROR'; error: Error };

interface WebSocketContext {
  connected: boolean;
  messages: unknown[];
  error: Error | null;
}
```

### Actions

```typescript
function handleConnect(
  context: WebSocketContext,
  event: Extract<WebSocketEvent, { type: 'CONNECT' }>
) {
  // Logic to initiate WebSocket connection
  return {
    ...context,
    connected: true,
  };
}

function handleMessage(
  context: WebSocketContext,
  event: Extract<WebSocketEvent, { type: 'MESSAGE' }>
) {
  return {
    ...context,
    messages: [...context.messages, event.data],
  };
}

function handleError(
  context: WebSocketContext,
  event: Extract<WebSocketEvent, { type: 'ERROR' }>
) {
  return {
    ...context,
    error: event.error,
  };
}
```

### Guards

```typescript
function canConnect(
  context: WebSocketContext,
  event: Extract<WebSocketEvent, { type: 'CONNECT' }>
) {
  return !context.connected && isValidUrl(event.url);
}

function isConnected(context: WebSocketContext) {
  return context.connected;
}
```

- **Helper Function:**

  ```typescript
  function isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
  ```

### Machine Definition

```typescript
import { createMachine } from 'xstate';

const webSocketMachine = createMachine(
  {
    types: {} as {
      context: WebSocketContext;
      events: WebSocketEvent;
    },
    id: 'webSocket',
    initial: 'disconnected',
    context: {
      connected: false,
      messages: [],
      error: null,
    },
    states: {
      disconnected: {
        on: {
          CONNECT: {
            target: 'connecting',
            guard: 'canConnect',
            actions: 'handleConnect',
          },
        },
      },
      connecting: {
        // Implementation for connecting state
        on: {
          '': [
            { target: 'connected', guard: 'isConnected' },
            { target: 'disconnected' },
          ],
        },
      },
      connected: {
        on: {
          MESSAGE: {
            actions: 'handleMessage',
          },
          DISCONNECT: {
            target: 'disconnected',
            actions: 'handleDisconnect',
          },
          ERROR: {
            actions: 'handleError',
          },
        },
      },
    },
  },
  {
    actions: {
      handleConnect,
      handleMessage,
      handleError,
      // Add other action implementations
    },
    guards: {
      canConnect,
      isConnected,
      // Add other guard implementations
    },
  }
);
```

- **Explanation:** This machine manages a WebSocket connection, handling events like `CONNECT`, `DISCONNECT`, and `MESSAGE`, and uses guards to control state transitions.

---

## Additional Resources

- [Official XState v5 Documentation](https://xstate.js.org/docs/)
- [Migration Guide from v4 to v5](https://xstate.js.org/docs/guides/migrating-from-v4/)
- [TypeScript Integration with XState](https://xstate.js.org/docs/guides/typescript.html)
- [XState GitHub Repository](https://github.com/statelyai/xstate)
- [XState Community Discussions](https://github.com/statelyai/xstate/discussions)

---

## What's Next

To further enhance your implementation and understanding of XState v5:

1. **Review Your Current Implementation Files:**
   - `machine.ts`
   - `actions.ts`
   - `guards.ts`
   - `types.ts`
   - `states.ts`

2. **Focus on Specific Areas:**
   - **Complex Type Scenarios:** Investigate areas where TypeScript inference may not be sufficient and add explicit type annotations.
   - **Testing Requirements:** Develop a comprehensive test suite for your machines, actions, and guards.
   - **Performance Considerations:** Optimize context updates and action executions for better performance.
   - **Error Handling Patterns:** Implement robust error handling within your state machines.

3. **Explore Advanced Features:**
   - **Interpretation and Service Integration:** Learn how to interpret machines and integrate them with React or other frameworks.
   - **Statecharts and Hierarchical States:** Utilize hierarchical states and parallel regions for complex workflows.
   - **Persistence and Hydration:** Implement state persistence across sessions if required.

---

By following this guide and leveraging the best practices outlined, you can effectively implement complex state machines using XState v5, ensuring robust, maintainable, and scalable applications.

If you have any specific questions or need further assistance with your project, feel free to reach out!