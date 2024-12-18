# WebSocket Implementation Updates

## Directory Structure
```
qi/core/src/network/websocket/
├── constants.ts    [UPDATE] - Configuration and constants
├── types.ts       [UPDATE] - Add service types
├── actions.ts     [UPDATE] - Remove side effects
├── guards.ts      [KEEP]   - Already well implemented
├── services.ts    [NEW]    - WebSocket services
├── states.ts      [UPDATE] - Add service invocations
├── machine.ts     [UPDATE] - Add services configuration
└── index.ts       [KEEP]   - Public exports
```

## Critical Updates Required

### 1. `services.ts` [NEW]
```typescript
// services.ts
export const services = {
  webSocketService: (context: WebSocketContext) => (send: Sender) => {
    const socket = new WebSocket(context.url, context.protocols);
    
    socket.onopen = () => send({ type: 'OPEN', event: socket });
    socket.onclose = (event) => send({ 
      type: 'CLOSE', 
      code: event.code, 
      reason: event.reason,
      wasClean: event.wasClean 
    });
    socket.onerror = (error) => send({ type: 'ERROR', error });
    socket.onmessage = (event) => send({ type: 'MESSAGE', data: event.data });

    return () => {
      socket.close();
    };
  },

  pingService: (context: WebSocketContext) => (send: Sender) => {
    const interval = setInterval(() => {
      send({ type: 'PING', timestamp: Date.now() });
    }, context.options.pingInterval);

    return () => clearInterval(interval);
  }
};
```

### 2. `actions.ts` [UPDATE]
```typescript
// actions.ts
export const actions = {
  // Remove socket manipulation, only update context
  prepareConnection: (context: WebSocketContext, event: ConnectEvent) => ({
    ...context,
    url: event.url,
    protocols: event.protocols || [],
    options: { ...context.options, ...event.options }
  }),

  handleOpen: (context: WebSocketContext) => ({
    ...context,
    state: {
      ...context.state,
      connectionAttempts: 0,
      lastConnectTime: Date.now(),
      lastError: null
    }
  }),

  // Other pure actions...
};
```

### 3. `machine.ts` [UPDATE]
```typescript
// machine.ts
export const webSocketMachine = createMachine({
  id: 'webSocket',
  types: {} as {
    context: WebSocketContext;
    events: WebSocketEvents;
  },
  initial: 'disconnected',
  context: initialContext,
  states: {
    connecting: {
      invoke: {
        src: 'webSocketService',
        onError: {
          target: 'reconnecting',
          actions: 'handleError'
        }
      },
      on: {
        OPEN: {
          target: 'connected',
          actions: 'handleOpen'
        }
      }
    },
    connected: {
      invoke: {
        src: 'pingService'
      },
      // ... rest of the states
    }
  }
}, {
  actions,
  guards,
  services
});

// Update creation function
export function createWebSocketMachine(options?: Partial<WebSocketContext["options"]>) {
  return webSocketMachine.withContext({
    ...initialContext,
    options: { ...DEFAULT_CONFIG, ...options }
  });
}
```

### 4. `types.ts` [UPDATE]
```typescript
// types.ts
export type WebSocketServices = {
  webSocketService: (context: WebSocketContext) => (send: Sender) => Cleanup;
  pingService: (context: WebSocketContext) => (send: Sender) => Cleanup;
};

export type Cleanup = void | (() => void);

export type Sender = <E extends WebSocketEvents>(event: E) => void;

// Update machine types
export type WebSocketMachine = ReturnType<typeof createMachine<
  WebSocketContext,
  WebSocketEvents,
  {
    actions: typeof actions;
    guards: typeof guards;
    services: WebSocketServices;
  }
>>;
```

## No Changes Required
- `guards.ts` - Already implements pure predicate functions
- `index.ts` - Exports remain the same
- `constants.ts` - Constants remain the same

## Implementation Steps

1. Create `services.ts` first - this will contain all side effects
2. Update `actions.ts` to remove side effects
3. Update `machine.ts` to use services
4. Update types to support services
5. Test the changes

Would you like me to provide more detailed implementation guidance for any of these components?