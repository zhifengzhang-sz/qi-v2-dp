# XState v5 Migration Guide

## Core Concepts

### Machine Creation Pattern

```typescript
import { setup } from "xstate";

const machine = setup({
  types: {
    context: {} as Context,
    events: {} as Events,
    input: {} as Input,
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
  id: "myMachine",
  initial: "idle",
  context: ({ input }) => input,
  states: {
    // State definitions
  },
});
```

### Type Definitions

- Define types before machine creation
- Use TypeScript interfaces for clarity
- Leverage type inference where possible

```typescript
interface Context {
  count: number;
  data: string[];
}

type Events =
  | { type: "INCREMENT" }
  | { type: "RESET" }
  | { type: "UPDATE"; data: string };
```

### Actions

- Return updated context directly
- No need for assign helper
- Can access event data type-safely

```typescript
actions: {
  increment: ({ context }) => ({
    ...context,
    count: context.count + 1
  }),
  updateData: ({ context, event }) => ({
    ...context,
    data: [...context.data, event.data]
  })
}
```

### Guards

- Receive context and event objects
- Return boolean values
- Can be composed and reused

```typescript
guards: {
  isMaxCount: ({ context }) => context.count >= 10,
  hasData: ({ context }) => context.data.length > 0,
  canUpdate: ({ context, event }) =>
    context.count < 10 && event.type === 'UPDATE'
}
```

### Actors

- Use fromPromise for async operations
- Emit events for state transitions
- Provide cleanup functions

```typescript
actors: {
  fetcher: fromPromise(async ({ input, emit }) => {
    const response = await fetch(input.url);
    const data = await response.json();
    emit({ type: "DONE", data });
    return () => {
      // Cleanup logic
    };
  });
}
```

### State Configuration

- Define states with transitions
- Use guards and actions
- Invoke actors when needed

```typescript
states: {
  idle: {
    on: {
      START: {
        target: 'loading',
        guard: 'canStart'
      }
    }
  },
  loading: {
    invoke: {
      src: 'fetcher',
      onDone: 'success',
      onError: 'error'
    }
  }
}
```

## Best Practices

1. **Type Safety**

- Always define types in setup
- Use strict TypeScript configurations
- Leverage type inference

2. **Action Organization**

- Keep actions pure and simple
- Return new context objects
- Avoid side effects in actions

3. **Guard Implementation**

- Make guards reusable
- Keep logic simple and focused
- Use composition for complex conditions

4. **Actor Management**

- Clean up resources properly
- Handle errors gracefully
- Use appropriate actor patterns

5. **State Structure**

- Keep states focused
- Use hierarchical states when needed
- Consider parallel states for independent processes

## Migration Notes

1. **From v4**

- Replace assign with direct returns
- Update actor definitions
- Refactor guard implementations

2. **Common Patterns**

- Input handling through context
- Event emission vs sending
- Cleanup management

## Examples

Check our WebSocket implementation for a real-world example:

- WebSocket Machine
- WebSocket Actions
- WebSocket Guards
- WebSocket Services
