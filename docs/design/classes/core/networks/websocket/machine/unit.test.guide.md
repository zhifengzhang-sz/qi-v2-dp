### Test Helpers Design & Usage Guide

1. **Design Principles**
```markdown
1. MockWebSocket
   - Simulates WebSocket behavior
   - Implements WebSocket interface
   - Controls event emission
   - Tracks connection state
   - Provides test hooks

2. createTestContext
   - Creates isolated test environments
   - Provides default configuration
   - Allows partial overrides
   - Maintains type safety
   - Resets between tests

3. Test Environment Management
   - State isolation
   - Event simulation
   - Error handling
   - Metrics tracking
   - Connection lifecycle
```

2. **Usage Patterns**
```markdown
1. Basic Context Testing
   - Create test context
   - Modify state
   - Validate behavior

2. WebSocket Event Testing
   - Create mock socket
   - Emit events
   - Validate handlers

3. State Transition Testing
   - Setup initial state
   - Trigger transitions
   - Verify outcomes

4. Error Handling
   - Simulate failures
   - Validate recovery
   - Check error states
```

3. **Example Implementation**

```typescript


import { describe, test, expect } from "vitest";
import { validateTransition } from "@qi/core/networks/websocket/machine/transitions";
import { STATES, EVENTS } from "@qi/core/networks/websocket/machine/constants";
import { MockWebSocket, createTestContext } from "../test-helpers";
import type { WebSocketEvent } from "@qi/core/networks/websocket/machine/types";

describe("WebSocket State Transitions", () => {
  test("completes connection lifecycle", () => {
    // 1. Setup mock socket
    const ws = new MockWebSocket("ws://localhost:8080");
    
    // 2. Initial state (DISCONNECTED)
    const context = createTestContext({
      socket: null,
      options: {
        reconnect: true,
        maxReconnectAttempts: 3
      }
    });

    // 3. Connect transition
    const connectEvent: WebSocketEvent = {
      type: EVENTS.CONNECT,
      url: "ws://localhost:8080",
      timestamp: Date.now()
    };

    let result = validateTransition(
      STATES.DISCONNECTED,
      connectEvent,
      STATES.CONNECTING,
      context
    );
    expect(result.isValid).toBe(true);

    // 4. Socket connection
    context.socket = ws;
    ws.mockEmitOpen();

    // 5. Connected state
    const openEvent: WebSocketEvent = {
      type: EVENTS.OPEN,
      timestamp: Date.now()
    };

    result = validateTransition(
      STATES.CONNECTING,
      openEvent,
      STATES.CONNECTED,
      context
    );
    expect(result.isValid).toBe(true);

    // 6. Message handling
    ws.mockEmitMessage("test data");
    expect(ws.dispatchEvent).toHaveBeenCalled();

    // 7. Error handling
    ws.mockEmitError(new Error("test error"));
    expect(context.error).not.toBeNull();

    // 8. Cleanup
    ws.mockEmitClose(1000, "normal closure");
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });
});
```

4. **Common Patterns**
```markdown
1. Context Creation
   ```typescript
   const context = createTestContext({
     status: STATES.DISCONNECTED,
     options: { ...customOptions }
   });
   ```

2. WebSocket Events
   ```typescript
   const ws = new MockWebSocket(url);
   ws.mockEmitOpen();
   ws.mockEmitMessage(data);
   ws.mockEmitError(error);
   ws.mockEmitClose(code, reason);
   ```

3. State Transitions
   ```typescript
   const result = validateTransition(
     fromState,
     event,
     toState,
     context
   );
   ```

4. Event Listeners
   ```typescript
   ws.addEventListener('open', handler);
   ws.addEventListener('message', handler);
   ws.addEventListener('error', handler);
   ws.addEventListener('close', handler);
   ```
```