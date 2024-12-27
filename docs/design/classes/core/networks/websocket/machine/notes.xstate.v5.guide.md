# XState v5 Complete Guide

## Table of Contents
1. [Overview](#overview)
   - Core Changes from v4
   - Key Benefits
2. [Implementation Guide](#implementation-guide)
   - Machine Creation
   - Type Definitions
   - Actions
   - Guards
   - Actor Pattern
3. [Best Practices](#best-practices)
   - Type Safety
   - Context Updates
   - Guard Implementation
   - Actor Implementation
4. [Testing](#testing)
   - Action Testing
   - Guard Testing
   - Actor Testing
   - Machine Testing
5. [WebSocket Example](#websocket-machine-example)
6. [Migration Notes](#migration-notes)
7. [Resources](#resources)

## Overview

### Core Changes from v4

- **TypeScript-first Approach:** Enhanced TypeScript support encourages strong type safety and better developer experience.
- **Simplified Type System:** Streamlined type definitions reduce complexity and improve maintainability.
- **Direct Context Updates:** Actions now return updated context directly, eliminating the need for the `assign` helper.
- **Pure Function Patterns:** Emphasis on pure functions promotes predictable and testable state transitions.
- **Better Type Inference:** Improved type inference reduces boilerplate and enhances developer productivity.

### Key Benefits

- **Reduced Boilerplate:** Less code required to achieve the same functionality, making state machines easier to write and maintain.
- **Clearer Type Definitions:** Enhanced type safety prevents runtime errors and improves code reliability.
- **Simpler Testing:** Pure functions and direct context updates simplify the testing process.
- **Better Error Handling:** More intuitive patterns for handling errors enhance robustness.
- **Improved Performance:** Optimizations in the core library lead to faster state transitions and better overall performance.

## Implementation Guide

### 1. Machine Creation Pattern

XState v5 introduces a `setup()` function to configure and type your state machine before creating it with `.createMachine()`. This promotes a TypeScript-first approach and better type safety.

```typescript
import { setup } from "xstate";

// Define your types
interface Context {
  count: number;
  data: string[];
}

type Events =
  | { type: "INCREMENT" }
  | { type: "RESET" }
  | { type: "UPDATE"; data: string };

type Input = {
  initialCount: number;
};

// Setup the machine with types, guards, actions, and actors
const machine = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
    input: {} as Input,
  },
  guards: {
    isMaxCount: ({ context }) => context.count >= 10,
    hasData: ({ context }) => context.data.length > 0,
    canUpdate: ({ context, event }) =>
      context.count < 10 && event.type === "UPDATE",
  },
  actions: {
    increment: ({ context }) => ({
      ...context,
      count: context.count + 1,
    }),
    updateData: ({ context, event }) => ({
      ...context,
      data: [...context.data, event.data],
    }),
  },
  actors: {
    // Define actors if needed
  },
}).createMachine({
  id: "myMachine",
  initial: "idle",
  context: ({ input }) => ({
    count: input.initialCount,
    data: [],
  }),
  states: {
    idle: {
      on: {
        INCREMENT: {
          target: "active",
          actions: "increment",
          guard: "isMaxCount",
        },
        UPDATE: {
          actions: "updateData",
          guard: "canUpdate",
        },
      },
    },
    active: {
      on: {
        RESET: {
          target: "idle",
          actions: () => ({
            count: 0,
            data: [],
          }),
        },
      },
    },
  },
});
```

### 2. Type Definitions

Define your `Context`, `Events`, and `Input` using TypeScript interfaces and types to ensure type safety throughout your state machine.

```typescript
interface Context {
  count: number;
  data: string[];
}

type Events =
  | { type: "INCREMENT" }
  | { type: "RESET" }
  | { type: "UPDATE"; data: string };

type Input = {
  initialCount: number;
};
```

### 3. Actions

Actions in XState v5 are pure functions that return the updated context. This removes the need for the `assign` helper and promotes immutability.

```typescript
// ✅ V5 Style - Pure function
function increment({ context }) {
  return {
    ...context,
    count: context.count + 1,
  };
}

function updateData({ context, event }) {
  return {
    ...context,
    data: [...context.data, event.data],
  };
}

// ❌ V4 Style - Don't use
import { assign } from "xstate";
const increment = assign({
  count: (context) => context.count + 1,
});
```

### 4. Guards

Guards are predicate functions that determine whether a transition should occur. They receive the current context and event and return a boolean value.

```typescript
// ✅ V5 Style - Predicate function
function canProceed({ context, event }) {
  return context.isReady && event.type === "PROCEED";
}

// ❌ V4 Style - Don't use
import { createGuard } from "xstate";
const canProceed = createGuard((context) => context.isReady);
```

### 5. Actor Pattern and Error Handling

```typescript
import { fromPromise } from "xstate";

// Basic Actor
const fetchActor = fromPromise(async ({ input, emit }) => {
  try {
    const response = await fetch(input.url);
    const data = await response.json();
    emit({ type: "SUCCESS", data });
  } catch (error) {
    emit({ type: "ERROR", error });
  }
  
  return () => {
    // Cleanup
  };
});

// WebSocket Actor with Error Boundaries
const webSocketActor = fromPromise(async ({ input, emit }) => {
  const socket = new WebSocket(input.url);
  let pingInterval: NodeJS.Timer;

  // Error boundary
  const errorBoundary = (fn: Function) => {
    try {
      fn();
    } catch (error) {
      emit({ type: "ERROR", error });
    }
  };

  // Event handlers with error boundaries
  socket.onopen = () => errorBoundary(() => {
    emit({ type: "CONNECTED", socket });
    pingInterval = setInterval(() => {
      socket.send("ping");
    }, 30000);
  });

  socket.onclose = () => errorBoundary(() => {
    emit({ type: "DISCONNECTED" });
  });

  socket.onerror = (error) => errorBoundary(() => {
    emit({ type: "ERROR", error });
  });

  // Cleanup function
  return () => {
    clearInterval(pingInterval);
    socket.close();
  };
});
```

## Best Practices

### 1. Type Safety

- **Define Explicit Types:** Always define types in the `setup()` function to leverage TypeScript's full potential.
  
  ```typescript
  interface WebSocketContext {
    url: string;
    socket: WebSocket | null;
    error: Error | null;
    retryCount: number;
  }

  type WebSocketEvent =
    | { type: "CONNECT"; url: string }
    | { type: "CONNECTED"; socket: WebSocket }
    | { type: "DISCONNECT" }
    | { type: "ERROR"; error: Error };
  ```

- **Use Type Inference:** Let TypeScript infer types where possible to reduce boilerplate.

  ```typescript
  const updateSocket = ({ context, event }) => ({
    ...context,
    socket: event.socket,
  });
  ```

### 2. Context Updates

- **Immutable Updates:** Always return new context objects to maintain immutability.

  ```typescript
  const updateData = ({ context, event }) => ({
    ...context,
    data: {
      ...context.data,
      [event.key]: event.value,
    },
  });

  const addItem = ({ context, event }) => ({
    ...context,
    items: [...context.items, event.item],
  });
  ```

- **Explain Why:** Immutable updates prevent unintended side effects and make state changes predictable.

### 3. Guard Implementation

- **Simple Conditions:** Keep guards simple and focused on a single condition.

  ```typescript
  const isConnected = ({ context }) => context.socket !== null;
  ```

- **Complex Guards:** Combine multiple conditions within a guard as needed.

  ```typescript
  const canReconnect = ({ context }) =>
    !context.socket && context.retryCount < 3;
  ```

- **Usage Context:** Use guards within machine configurations to control transitions.

  ```typescript
  states: {
    disconnected: {
      on: {
        CONNECT: {
          target: "connecting",
          guard: "canConnect",
        },
      },
    },
    // ...
  }
  ```

### 4. Actor Pattern

- **WebSocket Actor Example:** Demonstrates how to handle WebSocket connections with actors.

  ```typescript
  const webSocketActor = fromPromise(async ({ input, emit }) => {
    const socket = new WebSocket(input.url);

    socket.onopen = () => emit({ type: "CONNECTED", socket });
    socket.onclose = () => emit({ type: "DISCONNECTED" });
    socket.onerror = (error) => emit({ type: "ERROR", error });

    // Cleanup function
    return () => socket.close();
  });
  ```

- **Error Handling in Actors:** Ensure actors emit appropriate error events and handle cleanup gracefully.

  ```typescript
  socket.onerror = (error) => {
    emit({ type: "ERROR", error });
    socket.close();
  };
  ```

## Testing

### 1. Action Testing

Ensure your actions correctly update the context.

```typescript
describe("Actions", () => {
  test("increment updates count", () => {
    const context = { count: 0, data: [] };
    const result = increment({ context });
    expect(result.count).toBe(1);
  });

  test("updateData updates data array", () => {
    const context = { count: 1, data: ["initial"] };
    const event = { type: "UPDATE", data: "new" };
    const result = updateData({ context, event });
    expect(result.data).toContain("new");
  });
});
```

### 2. Guard Testing

Verify that guards correctly determine transition eligibility.

```typescript
describe("Guards", () => {
  test("canProceed validates correctly", () => {
    const context = { isReady: true };
    const event = { type: "PROCEED" };
    expect(canProceed({ context, event })).toBe(true);
  });

  test("canProceed returns false when conditions not met", () => {
    const context = { isReady: false };
    const event = { type: "PROCEED" };
    expect(canProceed({ context, event })).toBe(false);
  });
});
```

### 3. Actor Testing

Ensure your actors handle events and cleanup correctly.

```typescript
describe("WebSocket Actor", () => {
  test("should handle connection success", async () => {
    const mockSocket = {
      onopen: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    };

    global.WebSocket = jest.fn().mockImplementation(() => mockSocket);

    const events: any[] = [];
    const actor = webSocketActor.create({
      input: { url: "ws://test" },
      emit: (event) => events.push(event),
    });

    // Trigger onopen
    mockSocket.onopen();

    expect(events).toContainEqual({
      type: "CONNECTED",
      socket: mockSocket,
    });
  });

  test("should clean up resources", async () => {
    const mockSocket = {
      close: jest.fn(),
    };

    const cleanup = await webSocketActor.create({
      input: { url: "ws://test" },
      emit: () => {},
    });

    cleanup();
    expect(mockSocket.close).toHaveBeenCalled();
  });
});
```

## WebSocket Machine Example

### Complete Implementation

This example demonstrates a complete WebSocket state machine using XState v5, incorporating type safety, actions, guards, and actors.

```typescript
// Types
interface WebSocketContext {
  url: string;
  socket: WebSocket | null;
  error: Error | null;
  retryCount: number;
}

type WebSocketEvent =
  | { type: "CONNECT"; url: string }
  | { type: "CONNECTED"; socket: WebSocket }
  | { type: "DISCONNECT" }
  | { type: "ERROR"; error: Error }
  | { type: "RETRY" };

// Machine
const webSocketMachine = setup({
  types: {
    context: {} as WebSocketContext,
    events: {} as WebSocketEvent,
  },
  guards: {
    canConnect: ({ context }) => context.socket === null,
    canRetry: ({ context }) => context.retryCount < 3,
  },
  actions: {
    assignSocket: ({ context, event }) => ({
      ...context,
      socket: "socket" in event ? event.socket : null,
      error: null,
    }),
    assignError: ({ context, event }) => ({
      ...context,
      error: "error" in event ? event.error : null,
    }),
    incrementRetry: ({ context }) => ({
      ...context,
      retryCount: context.retryCount + 1,
    }),
    resetRetry: () => ({
      retryCount: 0,
    }),
  },
  actors: {
    webSocket: fromPromise(async ({ input, emit }) => {
      const socket = new WebSocket(input.url);

      socket.onopen = () => emit({ type: "CONNECTED", socket });
      socket.onclose = () => emit({ type: "DISCONNECTED" });
      socket.onerror = (error) => emit({ type: "ERROR", error });

      // Cleanup function
      return () => socket.close();
    }),
  },
}).createMachine({
  id: "webSocket",
  initial: "disconnected",
  context: ({ input }) => ({
    url: input.url,
    socket: null,
    error: null,
    retryCount: 0,
  }),
  states: {
    disconnected: {
      on: {
        CONNECT: {
          target: "connecting",
          guard: "canConnect",
        },
      },
    },
    connecting: {
      invoke: {
        src: "webSocket",
        onDone: {
          target: "connected",
          actions: "assignSocket",
        },
        onError: {
          target: "disconnected",
          actions: ["assignError", "incrementRetry"],
        },
      },
      after: {
        5000: {
          target: "disconnected",
          actions: "assignError",
        },
      },
    },
    connected: {
      on: {
        DISCONNECT: {
          target: "disconnected",
          actions: "resetRetry",
        },
        ERROR: {
          target: "reconnecting",
          actions: ["assignError", "incrementRetry"],
        },
      },
    },
    reconnecting: {
      on: {
        RETRY: {
          target: "connecting",
          guard: "canRetry",
        },
        ERROR: {
          target: "disconnected",
          actions: "assignError",
        },
      },
      after: {
        10000: {
          target: "disconnected",
          actions: "assignError",
        },
      },
    },
  },
});
```

## Migration Notes

### From v4 to v5

1. **Remove v4-specific Imports:**
   - Eliminate imports like `assign`, `send`, etc.
   
   ```typescript
   // ❌ V4 Style
   import { assign } from "xstate";
   
   // ✅ V5 Style
   // No need to import assign
   ```

2. **Convert Actions to Pure Functions:**
   - Replace `assign` actions with pure functions that return updated context.
   
   ```typescript
   // ❌ V4 Style
   const increment = assign({
     count: (context) => context.count + 1,
   });
   
   // ✅ V5 Style
   function increment({ context }) {
     return {
       ...context,
       count: context.count + 1,
     };
   }
   ```

3. **Update Guard Implementations:**
   - Ensure guards are pure predicate functions without side effects.
   
   ```typescript
   // ❌ V4 Style
   const canProceed = createGuard((context) => context.isReady);
   
   // ✅ V5 Style
   function canProceed({ context }) {
     return context.isReady;
   }
   ```

4. **Use New Actor Patterns:**
   - Utilize `fromPromise` for defining actors and handle event emissions appropriately.
   
   ```typescript
   // ❌ V4 Style
   invoke: {
     src: (context) => createWebSocket(context),
     onDone: 'connected',
     onError: 'error'
   }
   
   // ✅ V5 Style
   invoke: {
     src: "webSocket",
     onDone: {
       target: "connected",
       actions: "assignSocket",
     },
     onError: {
       target: "disconnected",
       actions: ["assignError", "incrementRetry"],
     },
   }
   ```

5. **Add Explicit Types in Setup:**
   - Define `context`, `events`, and `input` types within the `setup()` function for better type safety.
   
   ```typescript
   const machine = setup({
     types: {
       context: {} as Context,
       events: {} as Events,
       input: {} as Input,
     },
     // ...
   }).createMachine({
     // ...
   });
   ```

### Common Pitfalls

1. **Using Old `assign` Pattern:**
   - Forgetting to replace `assign` with pure function actions leads to type inconsistencies.
   
2. **Missing Context Spreads:**
   - Not spreading the existing context object can result in incomplete context updates.
   
3. **Incorrect Event Type Checking:**
   - Failing to correctly narrow event types in actions and guards causes type errors.
   
4. **Complex Nested Updates:**
   - Overcomplicating context updates within actions can make the state machine harder to maintain.
   
5. **Side Effects in Actions:**
   - Introducing side effects within actions violates the pure function pattern and can lead to unpredictable behavior.

**Solutions:**

- **Replace `assign` with Pure Functions:** Ensure all actions return new context objects.
- **Spread Existing Context:** Always spread the current context when returning updates.
- **Type Narrowing:** Use TypeScript's type guards to correctly handle different event types.
- **Simplify Context Updates:** Break down complex updates into smaller, manageable functions.
- **Maintain Pure Functions:** Avoid side effects within actions; handle them within actors or services.

## Resources

- [Official XState v5 Docs](https://stately.ai/docs)
- [TypeScript Integration](https://stately.ai/docs/typescript)
- [Migration Guide](https://stately.ai/docs/migration)
- [XState GitHub Repository](https://github.com/statelyai/xstate)
- [Community Discussions](https://github.com/statelyai/xstate/discussions)
- [XState Examples](https://github.com/statelyai/xstate/tree/main/examples)

## Conclusion

XState v5 brings significant enhancements to state management with a focus on type safety, simplicity, and performance. By adopting the new patterns and best practices outlined in this guide, developers can build robust and maintainable state machines tailored to their application's needs. Embrace the changes to leverage the full potential of XState v5 and streamline your state management workflows.

