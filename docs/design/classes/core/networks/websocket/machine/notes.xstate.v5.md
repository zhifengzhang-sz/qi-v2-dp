# XState v5 Migration Guide and Patterns

---

<blockquote>

Questions:
1.How does v5's new type system differ from v4, particularly around action and guard typing?
2. What are the changes to event type handling and context updates in v5?
3. How does v5 handle machine configuration types compared to v4?
4. What's the proper way to type assign actions in v5?
5. Are there specific best practices for typing guard functions in v5?

</blockquote>

---

**1. How does XState v5's new type system differ from v4, particularly around action and guard typing?**

In XState v5, the type system has been overhauled for better type inference and simplicity. Key differences include:

- **Simplified Typing**: V5 reduces the need for manual generic type annotations. The `createMachine` function can often infer types from the machine configuration.

- **Action Typing**: Actions are now plain functions that receive `context`, `event`, and an optional `meta` parameter. You no longer need to import or use complex types like `assign` from XState for typing actions.

  ```typescript
  // actions.ts
  import type { WebSocketContext, WebSocketEvent } from './types';

  export const establishConnection = (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== 'CONNECT') return;
    // Action logic...
  };

  export const actions = {
    establishConnection,
    // ...other actions
  };
  ```

- **Guard Typing**: Guards are also plain functions that receive `context` and `event` and return a boolean. There's no need to import guard types from XState.

  ```typescript
  // guards.ts
  import type { WebSocketContext, WebSocketEvent } from './types';

  export const canInitiateConnection = (context: WebSocketContext, event: WebSocketEvent): boolean => {
    return !context.socket || context.socket.readyState === WebSocket.CLOSED;
  };

  export const guards = {
    canInitiateConnection,
    // ...other guards
  };
  ```

---

**2. What are the changes to event type handling and context updates in v5?**

- **Event Type Handling**:
  - **Improved Inference**: V5 can better infer event types from your machine's transition definitions.
  - **Simpler Definitions**: You often don't need to specify event types explicitly; TypeScript can infer them from the events you use in the machine.

- **Context Updates**:
  - **Direct Context Mutation**: In actions, you can directly return the new context without using `assign`.
  - **No `assign` Function Needed**: The need to import and use the `assign` action creator is eliminated in most cases.

  ```typescript
  // Example action updating context
  export const incrementCounter = (context: MyContext) => {
    return {
      ...context,
      counter: context.counter + 1,
    };
  };
  ```

---

**3. How does v5 handle machine configuration types compared to v4?**

- **Enhanced Type Inference**:
  - **Automatic Inference**: V5 infers state, context, event, action, and guard types from the machine configuration.
  - **Less Boilerplate**: You don't need to specify generic parameters for `createMachine` manually.

- **Machine Configuration**:
  - **Unified Typing**: The machine configuration and options are more tightly integrated, which helps TypeScript provide better type checking.
  - **Simplified Options**: Actions, guards, and services in the machine options are inferred from their usage in the machine configuration.

  ```typescript
  // machine.ts
  import { createMachine } from 'xstate';
  import { actions } from './actions';
  import { guards } from './guards';
  import type { WebSocketContext, WebSocketEvent } from './types';

  export const webSocketMachine = createMachine({
    id: 'webSocket',
    initial: 'disconnected',
    context: {/* initial context */},
    states: {/* state definitions */},
  }, {
    actions,
    guards,
  });
  ```

---

**4. What's the proper way to type assign actions in v5?**

- **Direct Context Updates**:
  - **No `assign` Needed**: Return the updated context directly from the action function.
  - **Type the Action Function**: Define the action function with your context and event types.

  ```typescript
  // actions.ts
  import type { WebSocketContext, WebSocketEvent } from './types';

  export const updateConnectionAttempts = (context: WebSocketContext, event: WebSocketEvent) => {
    return {
      ...context,
      state: {
        ...context.state,
        connectionAttempts: context.state.connectionAttempts + 1,
      },
    };
  };

  export const actions = {
    updateConnectionAttempts,
    // ...other actions
  };
  ```

- **Usage in Machine**:
  - **No Special Typing Required**: When you specify actions in the machine, you don't need additional type annotations.
  - **Simpler Action Assignments**: Assign actions directly in the machine transitions.

  ```typescript
  // machine.ts
  states: {
    disconnected: {
      on: {
        CONNECT: {
          target: 'connecting',
          actions: 'updateConnectionAttempts',
        },
      },
    },
    // ...other states
  }
  ```

---

**5. Are there specific best practices for typing guard functions in v5?**

- **Define Guards as Functions**:
  - **Simple Function Signature**: Guards are functions that take `context` and `event` and return a boolean.
  - **Type Annotations**: Use your context and event types for the parameters.

  ```typescript
  // guards.ts
  import type { WebSocketContext, WebSocketEvent } from './types';

  export const isRateLimitCleared = (context: WebSocketContext, event: WebSocketEvent): boolean => {
    const now = Date.now();
    const recentMessages = context.metrics.messageTimestamps.filter(
      (t) => now - t <= context.options.rateLimit.window
    );
    return recentMessages.length < context.options.rateLimit.messages;
  };

  export const guards = {
    isRateLimitCleared,
    // ...other guards
  };
  ```

- **Best Practices**:
  - **No XState Imports Needed**: Avoid importing guard-related types from XState; they're unnecessary.
  - **Pure Functions**: Ensure guards are pure and side-effect-free, relying only on `context` and `event`.
  - **Type Safety**: Use your defined types for `context` and `event` to leverage TypeScript's type checking.

---

## Key Differences from v4

### Overall Philosophy
- Simpler, more straightforward API
- Better type inference with less manual type annotations
- Direct state mutations instead of complex action creators
- Plain functions over specialized types

### Type System Changes

#### 1. Actions
- No longer need to import `assign` from XState
- Actions are pure functions returning partial context updates
- Simpler signature: `(context, event) => PartialContext`
```typescript
// v4
export const updateCounter = assign({
  count: (context) => context.count + 1
});

// v5
export const updateCounter = (context) => ({
  ...context,
  count: context.count + 1
});
```

#### 2. Guards
- Pure functions returning boolean
- Simple signature: `(context, event) => boolean`
- No special types needed from XState
```typescript
// v4
export const isValid: GuardPredicate<Context, Event> = (context, event) => {...}

// v5
export const isValid = (context: Context, event: Event): boolean => {...}
```

#### 3. Event Handling
- Better type inference for event discrimination
- Cleaner event type definitions using discriminated unions
```typescript
// Clear discriminated union
type MachineEvent = 
  | { type: "CONNECT"; url: string }
  | { type: "DISCONNECT" }
  | { type: "ERROR"; error: Error };
```

### State Machine Configuration

#### 1. Machine Creation
```typescript
// v5 approach
export const machine = createMachine({
  id: "example",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        START: {
          target: "running",
          guard: "canStart",
          actions: "initialize"
        }
      }
    }
  }
}, {
  actions,
  guards
});
```

#### 2. State Definitions
- Use computed property names for state values
- Direct string references for actions and guards
- Single string syntax for lone actions/guards
```typescript
export const states = {
  [STATES.IDLE]: {
    entry: "initialize", // Single action as string
    on: {
      START: {
        target: STATES.RUNNING,
        actions: ["prepare", "start"], // Multiple actions as array
        guard: "canStart" // Single guard as string
      }
    }
  }
} as const;
```

### Best Practices

#### 1. Context Updates
- Return partial context updates
- Always spread existing context
- Validate event type before processing
```typescript
export const updateMetrics = (context: Context, event: Event) => {
  if (event.type !== "UPDATE") return context;
  return {
    ...context,
    metrics: {
      ...context.metrics,
      count: context.metrics.count + 1
    }
  };
};
```

#### 2. Type Safety
- Use discriminated unions for events
- Add explicit return types when needed
- Leverage const assertions for literal types
```typescript
const guardFn = (context: Context, event: Event): boolean => {
  if (event.type !== "CHECK") return false;
  return context.isValid && event.value > 0;
};
```

#### 3. State Organization
- Group related states together
- Use constants for state names
- Keep state definitions pure
```typescript
const CONNECTION_STATES = {
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected"
} as const;

export const states = {
  [CONNECTION_STATES.IDLE]: {...},
  [CONNECTION_STATES.CONNECTING]: {...},
  [CONNECTION_STATES.CONNECTED]: {...}
} as const;
```

### Common Patterns

#### 1. Event Type Checking
```typescript
export const handleEvent = (context: Context, event: Event) => {
  if (event.type !== "SPECIFIC_EVENT") return context;
  
  // Now TypeScript knows event is SpecificEvent type
  return {
    ...context,
    data: event.payload
  };
};
```

#### 2. Guard Functions
```typescript
export const isValidTransition = (context: Context, event: Event): boolean => {
  if (event.type !== "TRANSITION") return false;
  return context.canTransition && event.target in VALID_STATES;
};
```

#### 3. Action Composition
```typescript
export const actions = {
  initialize: (context) => ({...context, initialized: true}),
  cleanup: (context) => ({...context, data: null}),
  resetState: () => initialState
} as const;
```

### Testing Considerations

#### 1. Action Testing
```typescript
test('updateMetrics updates the context correctly', () => {
  const context = { metrics: { count: 0 } };
  const event = { type: 'UPDATE' as const };
  
  const result = updateMetrics(context, event);
  expect(result.metrics.count).toBe(1);
});
```

#### 2. Guard Testing
```typescript
test('canTransition guards the transition correctly', () => {
  const context = { canTransition: true };
  const event = { type: 'TRANSITION', target: 'valid' };
  
  expect(isValidTransition(context, event)).toBe(true);
});
```

### Migration Tips

1. Start with Event Types
   - Define clear discriminated unions
   - Remove redundant type information

2. Update Actions
   - Convert assign actions to direct context updates
   - Add type checking for events

3. Simplify Guards
   - Remove guard-specific types
   - Use plain boolean functions

4. Update State Definitions
   - Remove explicit type annotations
   - Use computed property names
   - Add const assertions

5. Update Machine Configuration
   - Remove manual type parameters
   - Rely on type inference
   - Split implementation and types

### Common Gotchas

1. Event Type Discrimination
   - Always check event.type before processing
   - Return unchanged context for unhandled events

2. Context Updates
   - Don't forget to spread existing context
   - Handle nested updates carefully

3. Type Assertions
   - Use `as const` for literal type inference
   - Avoid `as any` type assertions

4. Guard Functions
   - Return boolean explicitly
   - Handle all possible event types

This documentation represents our current understanding of XState v5's patterns and best practices based on the WebSocket state machine refactoring. It should be updated as we learn more or discover better patterns.