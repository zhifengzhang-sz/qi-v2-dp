# Resource Cleanup Guidelines

## Core Cleanup Requirements

### 1. Connection Cleanup
```typescript
class WebSocketManager {
  cleanup() {
    // Clear socket
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Clear timers
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    
    // Reset state
    this.resetState();
  }
}
```

### 2. Queue Cleanup
```typescript
class MessageQueue {
  clear() {
    // Clear messages
    this.messages = [];
    
    // Reset counters
    this.size = 0;
    this.head = 0;
    this.tail = 0;
  }
}
```

### 3. Client Shutdown
```typescript
class WebSocketClient {
  async shutdown() {
    // 1. Stop accepting new messages
    this.accepting = false;
    
    // 2. Process remaining queue
    await this.processRemainingMessages();
    
    // 3. Close connection
    await this.disconnect();
    
    // 4. Clear resources
    this.cleanup();
  }
}
```

## Implementation Checklist

1. Always call cleanup on:
   - Permanent disconnection
   - Client shutdown
   - Error with max retries reached

2. Verify cleanup of:
   - WebSocket connection
   - Message queue
   - Timers and intervals
   - Event listeners
   - Internal state

3. Monitor cleanup with:
   - Resource usage logging
   - Connection state verification
   - Memory leak detection