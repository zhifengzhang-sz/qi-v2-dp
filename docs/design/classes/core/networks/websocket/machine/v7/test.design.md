# WebSocket Unit Test Design

## 1. StateMachine Test Design

### 1.1 Core State Transition Tests
```typescript
// Transition matrix to test:
const transitions = [
  { from: 'disconnected', event: 'CONNECT', to: 'connecting' },
  { from: 'connecting', event: 'OPEN', to: 'connected' },
  { from: 'connecting', event: 'ERROR', to: 'reconnecting' },
  { from: 'connected', event: 'ERROR', to: 'reconnecting' },
  { from: 'connected', event: 'DISCONNECT', to: 'disconnecting' },
  { from: 'reconnecting', event: 'RETRY', to: 'connecting' },
  { from: 'disconnecting', event: 'CLOSE', to: 'disconnected' }
];
```

### 1.2 Context Management Tests
```typescript
interface ContextTestCase {
  state: State;
  event: Event;
  initialContext: MachineContext;
  expectedContext: MachineContext;
}

const contextTests: ContextTestCase[] = [
  {
    state: 'disconnected',
    event: { type: 'CONNECT', url: 'ws://test' },
    initialContext: { url: null, socket: null, retries: 0, error: null },
    expectedContext: { url: 'ws://test', socket: null, retries: 0, error: null }
  },
  // Add more context test cases
];
```

### 1.3 Error Handling Tests
```typescript
interface ErrorTestCase {
  state: State;
  error: WebSocketError;
  expectedState: State;
  expectedContext: Partial<MachineContext>;
}

const errorTests: ErrorTestCase[] = [
  {
    state: 'connecting',
    error: new WebSocketError('Connection failed', 1006),
    expectedState: 'reconnecting',
    expectedContext: { retries: 1 }
  },
  // Add more error test cases
];
```

## 2. WebSocketManager Test Design

### 2.1 Connection Tests
```typescript
interface ConnectionTestCase {
  url: string;
  options?: WebSocketConfig;
  expectedEvents: string[];
  mockResponses?: Array<{ type: string; data?: any }>;
}

const connectionTests: ConnectionTestCase[] = [
  {
    url: 'ws://test',
    options: { maxRetries: 3 },
    expectedEvents: ['connecting', 'open', 'connected'],
    mockResponses: [{ type: 'open' }]
  },
  // Add more connection test cases
];
```

### 2.2 Message Handling Tests
```typescript
interface MessageTestCase {
  input: unknown;
  expectedOutput: Message | Error;
  validateOutput: (result: any) => boolean;
}

const messageTests: MessageTestCase[] = [
  {
    input: { id: '1', data: 'test' },
    expectedOutput: { id: '1', data: 'test', timestamp: expect.any(Number) },
    validateOutput: (result) => result.id === '1' && result.data === 'test'
  },
  // Add more message test cases
];
```

## 3. MessageQueue Test Design

### 3.1 Queue Operation Tests
```typescript
interface QueueOperationTest {
  operations: Array<{
    type: 'enqueue' | 'dequeue' | 'peek';
    input?: Message;
    expectedResult?: Message | undefined;
  }>;
  finalState: {
    size: number;
    isEmpty: boolean;
  };
}

const queueTests: QueueOperationTest[] = [
  {
    operations: [
      { type: 'enqueue', input: { id: '1', data: 'test' } },
      { type: 'peek', expectedResult: { id: '1', data: 'test' } },
      { type: 'dequeue', expectedResult: { id: '1', data: 'test' } }
    ],
    finalState: { size: 0, isEmpty: true }
  },
  // Add more queue operation test cases
];
```

### 3.2 Overflow Tests
```typescript
interface OverflowTestCase {
  maxSize: number;
  messages: Message[];
  dropOldest: boolean;
  expectedQueue: Message[];
  expectedDropped: Message[];
}

const overflowTests: OverflowTestCase[] = [
  {
    maxSize: 2,
    messages: [msg1, msg2, msg3],
    dropOldest: true,
    expectedQueue: [msg2, msg3],
    expectedDropped: [msg1]
  },
  // Add more overflow test cases
];
```

## 4. RateLimiter Test Design

### 4.1 Window Tests
```typescript
interface WindowTestCase {
  operations: Array<{
    type: 'check';
    timestamp: number;
    size: number;
    expectedResult: boolean;
  }>;
  expectedWindow: {
    size: number;
    count: number;
  };
}

const windowTests: WindowTestCase[] = [
  {
    operations: [
      { type: 'check', timestamp: 1000, size: 1, expectedResult: true },
      { type: 'check', timestamp: 1100, size: 1, expectedResult: true },
      { type: 'check', timestamp: 1200, size: 1, expectedResult: false }
    ],
    expectedWindow: { size: 1000, count: 2 }
  },
  // Add more window test cases
];
```

### 4.2 Rate Enforcement Tests
```typescript
interface RateTestCase {
  maxMessages: number;
  windowSize: number;
  operations: Array<{
    messageSize: number;
    delayMs: number;
    shouldAccept: boolean;
  }>;
}

const rateTests: RateTestCase[] = [
  {
    maxMessages: 2,
    windowSize: 1000,
    operations: [
      { messageSize: 1, delayMs: 0, shouldAccept: true },
      { messageSize: 1, delayMs: 100, shouldAccept: true },
      { messageSize: 1, delayMs: 200, shouldAccept: false }
    ]
  },
  // Add more rate test cases
];
```

## 5. Integration Test Design

### 5.1 End-to-End Flow Tests
```typescript
interface FlowTestCase {
  setup: {
    config: WebSocketConfig;
    initialState: State;
  };
  operations: Array<{
    type: 'connect' | 'send' | 'receive' | 'disconnect';
    data?: any;
    expectedState: State;
    expectedResult?: any;
  }>;
}

const flowTests: FlowTestCase[] = [
  {
    setup: {
      config: defaultConfig,
      initialState: 'disconnected'
    },
    operations: [
      { type: 'connect', data: 'ws://test', expectedState: 'connected' },
      { type: 'send', data: { id: '1' }, expectedState: 'connected' },
      { type: 'disconnect', expectedState: 'disconnected' }
    ]
  },
  // Add more flow test cases
];
```

## 6. Mock Design

### 6.1 WebSocket Mock
```typescript
class MockWebSocket {
  private listeners: Record<string, Function[]> = {};
  readyState: number = WebSocket.CONNECTING;

  constructor(url: string) {
    setTimeout(() => this.simulate('open'), 0);
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  simulate(event: string, data?: any) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(cb => cb(data));
  }
}
```

### 6.2 Timer Mock
```typescript
const mockTimer = {
  now: 0,
  advance(ms: number) {
    this.now += ms;
    vi.advanceTimersByTime(ms);
  }
};
```

## 7. Test Utilities

### 7.1 State Assertions
```typescript
const assertState = (
  machine: WebSocketStateMachine,
  expectedState: State,
  context?: Partial<MachineContext>
) => {
  expect(machine.getState()).toBe(expectedState);
  if (context) {
    expect(machine.getContext()).toMatchObject(context);
  }
};
```

### 7.2 Event Helpers
```typescript
const createEvent = (type: string, data?: any): Event => ({
  type,
  ...(data && { data })
});

const waitForState = async (
  machine: WebSocketStateMachine,
  state: State,
  timeout: number = 1000
): Promise<void> => {
  // Implementation
};
```

## 8. Coverage Goals

### 8.1 State Coverage
- All states must be reached
- All transitions must be tested
- All error paths must be exercised

### 8.2 Branch Coverage
- All conditional logic must be tested
- All error handling branches must be tested
- All event handling paths must be covered

### 8.3 Property Coverage
- All invariants must be verified
- All mathematical properties must be tested
- All type safety must be verified
