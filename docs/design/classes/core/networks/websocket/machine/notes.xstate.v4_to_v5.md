# XState v5 Migration and Implementation Guide

## Core Changes from v4 to v5

### 1. TypeScript-First Approach

#### Type Inference
- V5 provides better type inference out of the box
- Use `types` property in machine config for explicit typing:
```typescript
createMachine({
  types: {} as {
    context: MyContext;
    events: MyEvents;
  }
})
```

#### Event Types
- Use discriminated unions for events
- Events should be defined with literal type properties
```typescript
type MyEvents = 
  | { type: "FETCH"; id: string }
  | { type: "SUCCESS"; data: any }
  | { type: "ERROR"; error: Error };
```

### 2. Actions

#### Function-Based Actions
- Actions are now plain functions instead of objects
- Return partial context for context updates
```typescript
// V5 action
function increment(context: Context) {
  return {
    ...context,
    count: context.count + 1
  };
}
```

#### No More assign()
- `assign` is no longer needed for context updates
- Actions directly return partial context
```typescript
// V4
assign({ count: (ctx) => ctx.count + 1 })

// V5
(ctx) => ({ ...ctx, count: ctx.count + 1 })
```

### 3. Guards

#### Predicate Functions
- Guards are plain predicate functions
- Return boolean directly
```typescript
function canProceed(context: Context, event: Event) {
  return context.isReady && event.type === "PROCEED";
}
```

### 4. Machine Configuration

#### Type Definition
```typescript
export const machine = createMachine({
  id: "example",
  types: {} as {
    context: Context;
    events: Events;
  },
  context: initialContext,
  initial: "idle",
  states: {
    idle: {
      on: {
        START: {
          target: "active",
          guard: "canStart",
          actions: "initialize"
        }
      }
    }
  }
});
```

#### State Node Configuration
- Simpler syntax for common patterns
- Direct function references for actions and guards

## Best Practices

### 1. Type Safety

#### Context Updates
```typescript
function updateContext(
  context: Context,
  event: Extract<Events, { type: "UPDATE" }>
) {
  return {
    ...context,
    data: event.data
  };
}
```

#### Guard Type Safety
```typescript
function isValid(
  context: Context,
  event: Extract<Events, { type: "VALIDATE" }>
): boolean {
  return context.isReady && event.data.isValid;
}
```

### 2. State Organization

#### Use Constants
```typescript
const STATES = {
  IDLE: "idle",
  ACTIVE: "active"
} as const;

const states = {
  [STATES.IDLE]: {
    on: {
      START: { target: STATES.ACTIVE }
    }
  }
};
```

#### Type-Safe Events
```typescript
type Events = {
  type: "START";
  data: string;
} | {
  type: "STOP";
};
```

### 3. Testing

#### Action Testing
```typescript
test("updateContext updates correctly", () => {
  const context = { data: null };
  const event = { type: "UPDATE", data: "new" };
  
  const result = updateContext(context, event);
  expect(result.data).toBe("new");
});
```

## Common Patterns

### 1. Context Updates
```typescript
function updateMetrics(context: Context, event: MetricEvent) {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      [event.metric]: event.value
    }
  };
}
```

### 2. Guard Composition
```typescript
function isAuthenticated(context: Context) {
  return Boolean(context.user);
}

function hasPermission(context: Context, event: ActionEvent) {
  return context.user?.permissions.includes(event.action);
}
```

### 3. Action Sequences
```typescript
const states = {
  idle: {
    on: {
      START: {
        target: "active",
        actions: ["log", "initialize", "notify"]
      }
    }
  }
};
```

## Migration Steps

1. Update TypeScript Types
   - Define explicit event types
   - Update context interfaces
   - Remove v4-specific type imports

2. Transform Actions
   - Convert assign actions to functions
   - Update context mutations
   - Remove action creators

3. Update Guards
   - Convert to predicate functions
   - Update type signatures
   - Remove guard creators

4. Update Machine Config
   - Add explicit types
   - Update state definitions
   - Simplify transitions

## Troubleshooting

### Common Issues

1. Type Inference
   - Use explicit types when inference fails
   - Check discriminated unions
   - Verify event type literals

2. Context Updates
   - Always spread existing context
   - Handle nested updates carefully
   - Check partial type returns

3. Action Results
   - Ensure proper return types
   - Verify context updates
   - Check event type narrowing

## Advanced Patterns

### 1. Custom Action Types
```typescript
type CustomAction = {
  type: "custom";
  exec: (context: Context, event: Event) => void;
};
```

### 2. Dynamic Guards
```typescript
function createGuard(condition: string) {
  return (context: Context) => context[condition];
}
```

### 3. Composable Machines
```typescript
const childMachine = createMachine({/*...*/});
const parentMachine = createMachine({
  invoke: {
    id: "child",
    src: childMachine
  }
});
```

## Performance Considerations

1. Context Updates
   - Minimize unnecessary spreads
   - Use selective updates
   - Consider immutability helpers

2. Guard Evaluation
   - Keep guards simple
   - Cache expensive calculations
   - Use memoization when needed

3. Action Execution
   - Avoid heavy computations
   - Consider async actions
   - Use batching when possible

## References

- [Official Migration Guide](https://stately.ai/docs/migration)
- [XState v5 Documentation](https://stately.ai/docs)
- [TypeScript Integration](https://stately.ai/docs/typescript)