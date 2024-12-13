## Lessons learned in testing

### From `qi/tests/unit/services/timescaledb/client.test.ts`

The key issue was indeed the retry functionality causing timeouts. By mocking the retry utility, we avoided the actual delays while still testing the error handling behavior.

Some key takeaways from this exercise:

1. Always mock time-based operations in tests to avoid timeouts and make tests run faster
2. Keep mocks as simple as possible - we just needed basic mock functions at module level
3. Remember to mock all dependencies, including utilities like retry operations
4. Clear mocks before each test to ensure test isolation

### From `qi/tests/unit/networks/websocket/client.test.ts`

The main lesson here is that when mocking a `Node.js` module, we should stick to its native patterns (`EventEmitter`) rather than trying to implement multiple event systems. This makes the mock simpler, more reliable, and better aligned with how the actual module works.

Here are the key lessons learned from our WebSocket testing journey:

1. Mock Design Principles:
- Mock implementation should closely match the actual implementation patterns (Node.js EventEmitter vs DOM events)
- Need proper type definitions and interfaces
- Spies must be properly set up and tracked
- Method bindings must be maintained for correct `this` context

2. Testing Challenges:
- Asynchronous event handling requires careful timing
- Timer-based operations need proper async handling
- Event propagation needs to be properly simulated
- Multiple event handlers need careful management
- Reconnection logic is complex and requires state tracking

3. Common Pitfalls:
- Using DOM-style event methods with Node.js style WebSocket
- Not properly binding event emitter methods
- Losing spy tracking when binding methods
- Not properly handling async/await with timers
- Not maintaining mockWs state across reconnections

4. Best Practices:
- Maintain clear separation between event emitter and WebSocket functionality
- Track method calls explicitly with spies
- Use proper TypeScript types for all callbacks and data
- Handle async operations carefully with proper timer control
- Keep mock state synchronized with real behavior

5. Areas That Need Special Attention:
- Event handler registration and cleanup
- Connection state management
- Timer-based operations (heartbeat, reconnection)
- Error propagation
- Subscription handling

This has been a good example of how complex testing modern network protocols can be, especially when dealing with event-driven architectures.

---

Yes, there are several important lessons from this WebSocket testing experience:

1. State Management in WebSocket Tests:
```typescript
// Bad - Using auto-connect logic complicates tests
constructor(url: string | URL) {
  setTimeout(() => mockWs.connect(), 0); 
}

// Good - Explicit state control
mockWs.readyState = WebSocket.OPEN;
mockWs.emit("open");
```

2. Timer Handling:
```typescript
// Bad - Using real timers in async tests
setTimeout(() => mockWs.connect(), 1000);

// Good - Using Vitest timer controls
vi.useFakeTimers();
await vi.advanceTimersByTimeAsync(1000);
```

3. Mock Implementation:
```typescript
// Bad - Complex mock with multiple responsibilities
class MockWebSocket extends EventEmitter {
  private autoConnect: boolean;
  private setupAutoConnect() { ... }
}

// Good - Simple mock focused on test needs
class MockWebSocket extends EventEmitter {
  public readyState = WebSocket.CONNECTING;
  close = vi.fn();
  terminate = vi.fn();
}
```

Key Lessons:

1. **Keep Mocks Simple**: 
   - Minimize mock complexity and avoid auto behaviors
   - Only implement what's needed for each test
   - Use Node.js EventEmitter patterns correctly

2. **Control Timing**:
   - Always use fake timers in WebSocket tests
   - Clear timing controls between tests
   - Properly sequence async operations

3. **State Management**:
   - Explicit state transitions are better than automatic ones
   - Control WebSocket readyState directly
   - Match state changes with appropriate events

4. **Test Isolation**:
   - Clear mocks and timers between tests
   - Reset mock implementations for specific tests
   - Avoid state leaks between tests

5. **Common Pitfalls**:
   - Race conditions between timers and events
   - Unhandled promise rejections
   - State transitions not matching real WebSocket behavior
   - Mock cleanup between tests

Would you like me to elaborate on any of these points?

---

>yes, please

---

# WebSocket Testing Best Practices

## 1. Keep Mocks Simple

### Problem
Complex mocks with automatic behaviors lead to:
- Hard to predict test behavior
- Race conditions
- Difficult to debug failures
- State management issues

### Solution
```typescript
// Bad: Complex mock with auto-behaviors
class MockWebSocket extends EventEmitter {
  constructor() {
    super();
    setTimeout(() => this.connect(), 0);
    this.setupPingPong();
    this.handleReconnection();
  }
}

// Good: Simple, controllable mock
class MockWebSocket extends EventEmitter {
  public readyState = WebSocket.CONNECTING;
  close = vi.fn();
  terminate = vi.fn();
  
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    this.emit("open");
  }
}
```

## 2. Timer Control

### Problem
WebSocket operations involve many timers:
- Connection timeouts
- Heartbeat intervals
- Reconnection delays
- Event timing

### Solution
```typescript
describe("WebSocket tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("handles connection timeout", async () => {
    const connectPromise = client.connect();
    await vi.advanceTimersByTimeAsync(5000);
    await expect(connectPromise).rejects.toThrow();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
```

## 3. State Management

### Problem
WebSocket has complex state transitions:
- connecting → connected
- connected → disconnecting
- disconnecting → disconnected
- Reconnection states

### Solution
```typescript
it("handles connection lifecycle", async () => {
  // Explicit state control
  mockWs.readyState = WebSocket.CONNECTING;
  const connectPromise = client.connect();

  // State transition with event
  mockWs.readyState = WebSocket.OPEN;
  mockWs.emit("open");
  
  await connectPromise;
  expect(client.getState()).toBe("connected");
});
```

## 4. Test Isolation

### Problem
Tests can affect each other through:
- Shared mock state
- Timer interference
- Uncleared event listeners
- Pending promises

### Solution
```typescript
describe("WebSocket suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockWs = new MockWebSocket();
    // Reset mock implementation for each test
    vi.mocked(WebSocket).mockImplementation(() => mockWs);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    // Clear any pending promises
    return new Promise(resolve => setImmediate(resolve));
  });
});
```

## 5. Handle Edge Cases

### Problem
WebSocket interactions have many edge cases:
- Connection errors
- Timeout races
- Reconnection limits
- State mismatches

### Solution
```typescript
describe("edge cases", () => {
  it("handles error during connect", async () => {
    const connectPromise = client.connect();
    
    // Simulate error before connection establishes
    mockWs.readyState = WebSocket.CLOSING;
    mockWs.emit("error", new Error("ECONNREFUSED"));
    mockWs.readyState = WebSocket.CLOSED;
    mockWs.emit("close");

    await expect(connectPromise).rejects.toThrow();
    expect(client.getState()).toBe("disconnected");
  });
});
```

## Key Takeaways

1. **Predictability Over Convenience**
   - Avoid auto-behaviors in mocks
   - Control state transitions explicitly
   - Make test flow clear and linear

2. **Proper Timer Management**
   - Use fake timers consistently
   - Clear timers between tests
   - Handle async operations properly

3. **Clean Test Environment**
   - Reset all mocks between tests
   - Clear timers and listeners
   - Prevent test interdependence

4. **Match Real Behavior**
   - Follow WebSocket protocol states
   - Emit events in correct order
   - Handle edge cases properly

5. **Debug Friendly**
   - Keep mock implementations simple
   - Make state transitions visible
   - Add helper methods for common operations

## Common Mistakes to Avoid

1. Not controlling timers properly in async tests
2. Complex mock implementations with automatic behaviors
3. Not cleaning up between tests
4. Missing edge cases in error scenarios
5. Race conditions in event handling