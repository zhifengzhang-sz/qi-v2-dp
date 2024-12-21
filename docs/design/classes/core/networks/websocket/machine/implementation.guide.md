# WebSocket State Machine Implementation Guide (XState v5)

## Implementation Layers

### Layer 1: Foundation

#### constants.ts
```typescript
export const STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTING: 'disconnecting',
  TERMINATED: 'terminated'
} as const;

export const EVENTS = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  ERROR: 'ERROR',
  MESSAGE: 'MESSAGE'
} as const;

export const CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,
  messageQueueSize: 100,
  pingInterval: 30000,
  pongTimeout: 5000
} as const;
```

#### errors.ts
```typescript
export enum ErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  MESSAGE_FAILED = 'MESSAGE_FAILED',
  TIMEOUT = 'TIMEOUT'
}

export class WebSocketError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context: ErrorContext
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export interface ErrorContext {
  readonly url?: string;
  readonly state?: string;
  readonly attempt?: number;
}
```

### Layer 2: Core Types

#### types.ts
```typescript
type State = typeof STATES[keyof typeof STATES];
type EventType = typeof EVENTS[keyof typeof EVENTS];

interface BaseEvent {
  readonly timestamp: number;
}

type WebSocketEvent =
  | { type: 'CONNECT'; url: string; options?: ConnectionOptions }
  | { type: 'DISCONNECT'; code?: number }
  | { type: 'MESSAGE'; data: unknown }
  & BaseEvent;

interface WebSocketContext {
  readonly url: string | null;
  readonly socket: WebSocket | null;
  readonly status: State;
  readonly options: Readonly<ConnectionOptions>;
  readonly metrics: Readonly<Metrics>;
  isCleanDisconnect: boolean;
  connectTime: number;
  disconnectTime: number;
  latency: number[];
  bytesReceived: number;
  bytesSent: number;
  processingMessage: boolean;
  lastMessageId: string;
  windowStart: number;
}

interface ConnectionOptions {
  readonly reconnect: boolean;
  readonly maxReconnectAttempts: number;
  readonly reconnectInterval: number;
}

interface Metrics {
  readonly messagesReceived: number;
  readonly messagesSent: number;
  readonly errors: ReadonlyArray<ErrorRecord>;
}
```

### Layer 3: Utils & States

#### states.ts
```typescript
export interface StateDefinition {
  readonly name: State;
  readonly allowedEvents: ReadonlySet<EventType>;
  readonly invariants: ReadonlyArray<(context: WebSocketContext) => boolean>;
}

export const states: Record<State, StateDefinition> = {
  disconnected: {
    name: 'disconnected',
    allowedEvents: new Set(['CONNECT']),
    invariants: [
      (ctx) => ctx.socket === null,
      (ctx) => ctx.status === 'disconnected'
    ]
  },
  // ... other states
};
```

#### utils.ts
```typescript
export function calculateBackoff(
  attempts: number,
  options: ConnectionOptions
): number {
  return Math.min(
    options.reconnectInterval * Math.pow(options.reconnectBackoffRate, attempts),
    30000
  );
}

export function validateState(
  context: WebSocketContext,
  state: State
): boolean {
  return states[state].invariants.every(inv => inv(context));
}

export function createError(
  code: ErrorCode,
  message: string,
  context: ErrorContext
): WebSocketError {
  return new WebSocketError(message, code, context);
}
```

### Layer 4: Behavior

#### actions.ts
```typescript
function initializeConnection(
  context: WebSocketContext,
  event: WebSocketEvent & { type: 'CONNECT' }
): WebSocketContext {
  return {
    ...context,
    url: event.url,
    status: 'connecting',
    reconnectAttempts: 0
  };
}

function handleMessage(
  context: WebSocketContext,
  event: WebSocketEvent & { type: 'MESSAGE' }
): WebSocketContext {
  return {
    ...context,
    metrics: {
      ...context.metrics,
      messagesReceived: context.metrics.messagesReceived + 1
    }
  };
}

export const actions = {
  initializeConnection,
  handleMessage
} as const;
```

#### guards.ts
```typescript
function canConnect(
  context: WebSocketContext,
  event: WebSocketEvent & { type: 'CONNECT' }
): boolean {
  return (
    context.status === 'disconnected' &&
    !context.socket &&
    event.url.startsWith('ws')
  );
}

function canReconnect(context: WebSocketContext): boolean {
  return (
    context.options.reconnect &&
    context.reconnectAttempts < context.options.maxReconnectAttempts
  );
}

export const guards = {
  canConnect,
  canReconnect
} as const;
```

#### services.ts
```typescript
import { fromCallback } from 'xstate';

function createWebSocketService({ input }: { input: WebSocketContext }) {
  return fromCallback(({ self }) => {
    const socket = new WebSocket(input.url!);
    
    socket.onopen = () => self.send({ 
      type: 'OPEN',
      timestamp: Date.now() 
    });
    
    socket.onmessage = (event) => self.send({ 
      type: 'MESSAGE',
      data: event.data,
      timestamp: Date.now()
    });

    return () => socket.close();
  });
}

export const services = {
  webSocket: createWebSocketService
} as const;
```

### Layer 5: Machine

#### machine.ts
```typescript
const webSocketMachine = createMachine({
  id: 'webSocket',
  types: {} as {
    context: WebSocketContext,
    events: WebSocketEvent
  },
  context: {
    url: null,
    socket: null,
    status: 'disconnected',
    options: CONFIG,
    metrics: {
      messagesReceived: 0,
      messagesSent: 0,
      errors: []
    },
    isCleanDisconnect: false,
    connectTime: 0,
    disconnectTime: 0,
    latency: [],
    bytesReceived: 0,
    bytesSent: 0,
    processingMessage: false,
    lastMessageId: '',
    windowStart: 0
  },
  initial: 'disconnected',
  states: {
    disconnected: {
      on: {
        CONNECT: {
          target: 'connecting',
          guard: 'canConnect',
          action: 'initializeConnection'
        }
      }
    },
    connecting: {
      invoke: {
        src: 'webSocket',
        onDone: 'connected',
        onError: [{
          target: 'reconnecting',
          guard: 'canReconnect'
        }]
      }
    },
    terminated: {
      type: 'final',
      entry: 'cleanupResources'
    }
    // ... other states
  }
}, {
  actions,
  guards,
  services
});
```

## Testing

### Type Tests
```typescript
describe('Types', () => {
  test('context is immutable', () => {
    const context: WebSocketContext = {
      url: 'ws://test',
      socket: null,
      status: 'disconnected',
      options: CONFIG,
      metrics: {
        messagesReceived: 0,
        messagesSent: 0,
        errors: []
      },
      isCleanDisconnect: false,
      connectTime: 0,
      disconnectTime: 0,
      latency: [],
      bytesReceived: 0,
      bytesSent: 0,
      processingMessage: false,
      lastMessageId: '',
      windowStart: 0
    };

    // @ts-expect-error - Should not allow mutation
    context.url = 'new-url';
  });
});
```

### Action Tests
```typescript
describe('Actions', () => {
  test('initializeConnection', () => {
    const context = createTestContext();
    const event = {
      type: 'CONNECT' as const,
      url: 'ws://test',
      timestamp: Date.now()
    };

    const result = actions.initializeConnection(context, event);
    
    expect(result.url).toBe('ws://test');
    expect(result.status).toBe('connecting');
    expect(result.reconnectAttempts).toBe(0);
  });
});
```

### Guard Tests
```typescript
describe('Guards', () => {
  test('canConnect', () => {
    const context = createTestContext();
    const event = {
      type: 'CONNECT' as const,
      url: 'ws://test',
      timestamp: Date.now()
    };

    const result = guards.canConnect(context, event);
    expect(result).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('WebSocket Machine', () => {
  test('full connection lifecycle', () => {
    const machine = createWebSocketMachine();
    
    let state = machine.initialState;
    expect(state.value).toBe('disconnected');
    
    state = machine.transition(state, {
      type: 'CONNECT',
      url: 'ws://test',
      timestamp: Date.now()
    });
    
    expect(state.value).toBe('connecting');
    expect(state.context.url).toBe('ws://test');
  });
});
```

## Helper Functions

### Test Context Creation
```typescript
function createTestContext(overrides?: Partial<WebSocketContext>): WebSocketContext {
  return {
    url: null,
    socket: null,
    status: 'disconnected',
    options: CONFIG,
    metrics: {
      messagesReceived: 0,
      messagesSent: 0,
      errors: []
    },
    isCleanDisconnect: false,
    connectTime: 0,
    disconnectTime: 0,
    latency: [],
    bytesReceived: 0,
    bytesSent: 0,
    processingMessage: false,
    lastMessageId: '',
    windowStart: 0,
    ...overrides
  };
}
```

### State Validation
```typescript
function validateMachineState(state: State): void {
  const definition = states[state.value];
  if (!definition) {
    throw new Error(`Invalid state: ${state.value}`);
  }

  definition.invariants.forEach(invariant => {
    if (!invariant(state.context)) {
      throw new Error(`State invariant violation in ${state.value}`);
    }
  });
}
```

## Implementation Workflow

1. Start with foundation layer (constants.ts, errors.ts)
2. Build core types (types.ts, states.ts)
3. Implement utilities (utils.ts, transitions.ts)
4. Add behavior (guards.ts, actions.ts, services.ts)
5. Create machine definition (machine.ts)
6. Add comprehensive tests

## Best Practices

1. Always use pure functions for actions and guards
2. Maintain immutability in context updates
3. Use explicit typing over inference
4. Test each component in isolation
5. Validate state transitions
6. Handle all error cases
7. Document all public interfaces