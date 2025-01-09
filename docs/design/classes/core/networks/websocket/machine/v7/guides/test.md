## WebSocket Test Specifications

### 1. Test Structure

#### 1.1 Directory Layout
```
qi/core/tests/unit/networks/websocket/
├── state-machine/               # State machine tests
│   ├── StateMachine.test.ts
│   └── transitions.test.ts
├── socket/                      # WebSocket manager tests
│   ├── WebSocketManager.test.ts
│   └── connection.test.ts
├── queue/                       # Message queue tests
│   ├── MessageQueue.test.ts
│   └── operations.test.ts
├── rate-limiter/               # Rate limiter tests
│   ├── RateLimiter.test.ts
│   └── window.test.ts
└── client/                     # Integration tests
    └── WebSocketClient.test.ts
```

### 2. Test Categories

#### 2.1 State Machine Tests
1. **State Transitions** (StateMachine.test.ts)
   - Verify each state transition from formal spec
   - Test invalid transitions are prevented
   - Verify state invariants are maintained
   ```typescript
   // Example:
   expect(machine.getState()).toBe('disconnected');
   await machine.transition({ type: 'CONNECT', url: 'ws://test' });
   expect(machine.getState()).toBe('connecting');
   ```

2. **Context Management**
   - Verify context updates during transitions
   - Test context immutability
   - Verify error handling in context

#### 2.2 WebSocket Manager Tests
1. **Connection Lifecycle**
   - Test connection establishment
   - Verify reconnection behavior
   - Test disconnection cleanup

2. **Error Handling**
   - Test various error scenarios
   - Verify error propagation
   - Test recovery mechanisms

#### 2.3 Message Queue Tests
1. **Queue Operations**
   - Test FIFO ordering
   - Verify size constraints
   - Test overflow handling

2. **Message Handling**
   - Test message validation
   - Verify message processing
   - Test message persistence

#### 2.4 Rate Limiter Tests
1. **Window Management**
   - Test sliding window behavior
   - Verify rate calculations
   - Test window cleanup

2. **Limit Enforcement**
   - Test message counting
   - Verify limit enforcement
   - Test rate reset behavior

#### 2.5 Integration Tests
1. **Component Interaction**
   - Test end-to-end message flow
   - Verify state propagation
   - Test error handling across components

### 3. Test Requirements

#### 3.1 State Coverage
- Must test all states defined in formal spec
- Must verify all valid transitions
- Must test all error conditions

#### 3.2 Property Testing
- Must verify mathematical properties
- Must test invariants
- Must verify type safety

#### 3.3 Stability Testing
- Must verify core boundaries
- Must test extension points
- Must verify immutable interfaces

### 4. Test Implementation Guidelines

#### 4.1 Test Structure
```typescript
describe('Component', () => {
  let instance: Component;

  beforeEach(() => {
    instance = new Component();
  });

  describe('Category', () => {
    it('should behave as expected', () => {
      // Test implementation
    });
  });
});
```

#### 4.2 Mock Guidelines
- Mock external dependencies
- Use vi.fn() for function mocks
- Use vi.spyOn() for monitoring

#### 4.3 Assertion Guidelines
- Use type-safe assertions
- Test both positive and negative cases
- Verify error conditions

### 5. Stability Requirements

#### 5.1 Test Stability
- Tests must not depend on timing
- Tests must be deterministic
- Tests must be isolated

#### 5.2 Core Protection
- Tests must verify core immutability
- Tests must validate extension points
- Tests must maintain boundaries

### 6. Test Coverage Requirements

#### 6.1 Code Coverage
- Lines: ≥ 90%
- Branches: ≥ 85%
- Functions: ≥ 90%
- Statements: ≥ 90%

#### 6.2 Scenario Coverage
- All state transitions
- All error conditions
- All message patterns

### 7. Performance Test Requirements

#### 7.1 Timing Tests
- Connection: ≤ 1000ms
- Message processing: ≤ 100ms
- Queue operations: ≤ 50ms

#### 7.2 Load Tests
- Message throughput
- Queue capacity
- Rate limit accuracy


## WebSocket Unit Test Design

### 1. StateMachine Test Design

#### 1.1 Core State Transition Tests
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

#### 1.2 Context Management Tests
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

#### 1.3 Error Handling Tests
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

### 2. WebSocketManager Test Design

#### 2.1 Connection Tests
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

#### 2.2 Message Handling Tests
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

### 3. MessageQueue Test Design

#### 3.1 Queue Operation Tests
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

#### 3.2 Overflow Tests
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

### 4. RateLimiter Test Design

#### 4.1 Window Tests
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

#### 4.2 Rate Enforcement Tests
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

### 5. Integration Test Design

#### 5.1 End-to-End Flow Tests
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

### 6. Mock Design

#### 6.1 WebSocket Mock
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

#### 6.2 Timer Mock
```typescript
const mockTimer = {
  now: 0,
  advance(ms: number) {
    this.now += ms;
    vi.advanceTimersByTime(ms);
  }
};
```

### 7. Test Utilities

#### 7.1 State Assertions
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

#### 7.2 Event Helpers
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

### 8. Coverage Goals

#### 8.1 State Coverage
- All states must be reached
- All transitions must be tested
- All error paths must be exercised

#### 8.2 Branch Coverage
- All conditional logic must be tested
- All error handling branches must be tested
- All event handling paths must be covered

#### 8.3 Property Coverage
- All invariants must be verified
- All mathematical properties must be tested
- All type safety must be verified
