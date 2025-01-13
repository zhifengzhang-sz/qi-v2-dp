# Migration Guidelines for v9 (migration.md)

## Preamble

### Document Dependencies
This document depends on and is constrained by:

1. `refactor/part_1/spec.md`: Core mathematical changes
2. `refactor/part_1/map.md`: Specification mapping
3. `refactor/part_2/plan.md`: Implementation planning
4. `refactor/part_2/changes.md`: Implementation changes
5. `refactor/part_2/impl.verification.md`: Verification requirements

### Document Purpose
- Provides step-by-step migration guidance from v8 to v9
- Defines upgrade paths for different integration scenarios
- Specifies backward compatibility requirements
- Details breaking changes and their mitigations

### Document Scope
FOCUSES on:
- Migration procedures
- Breaking changes
- Compatibility requirements
- Upgrade paths

Does NOT cover:
- Implementation details
- Verification procedures
- Mathematical foundations
- Performance optimization

## 1. Breaking Changes

### 1.1 State Machine Changes
```typescript
// v8 State Definition
type StateV8 = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

// v9 State Definition
type StateV9 = 
  | 'disconnected'
  | 'disconnecting'  // New
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'reconnected';   // New
```

### 1.2 Context Changes
```typescript
// v8 Context
interface ContextV8 {
  url: string | null;
  socket: WebSocket | null;
  retries: number;
}

// v9 Context
interface ContextV9 {
  url: string | null;
  socket: WebSocket | null;
  retries: number;
  disconnectReason: string | null;    // New
  reconnectCount: number;             // New
  lastStableConnection: number | null; // New
}
```

## 2. Migration Paths

### 2.1 Direct Integration
For applications directly using the WebSocket client:

1. Update Dependencies
```json
{
  "dependencies": {
    "@websocket/client": "^9.0.0"
  }
}
```

2. Update State Handling
```typescript
// v8
client.on('state', (state: StateV8) => {
  if (state === 'disconnected') {
    // Handle disconnect
  }
});

// v9
client.on('state', (state: StateV9) => {
  if (state === 'disconnecting') {
    // Handle graceful disconnect
  } else if (state === 'disconnected') {
    // Handle final disconnect
  }
});
```

3. Update Context Usage
```typescript
// v8
const { url, socket, retries } = client.context;

// v9
const {
  url,
  socket,
  retries,
  disconnectReason,    // New
  reconnectCount,      // New
  lastStableConnection // New
} = client.context;
```

### 2.2 Framework Integration
For applications using framework integrations:

1. Update Framework Adapters
```typescript
// v8 Adapter
class WebSocketAdapter {
  mapState(state: StateV8): FrameworkState {
    // Old mapping
  }
}

// v9 Adapter
class WebSocketAdapter {
  mapState(state: StateV9): FrameworkState {
    // Include new states
    if (state === 'disconnecting') return FrameworkState.CLOSING;
    if (state === 'reconnected') return FrameworkState.STABLE;
    // Existing mappings
  }
}
```

2. Update Event Handlers
```typescript
// v8
framework.handleWebSocket({
  onDisconnect: () => {
    // Direct disconnect
  }
});

// v9
framework.handleWebSocket({
  onDisconnecting: (reason) => {
    // Graceful disconnect initiated
  },
  onDisconnect: () => {
    // Final disconnect
  }
});
```

## 3. Backward Compatibility

### 3.1 State Mapping Layer
```typescript
class CompatibilityLayer {
  mapToV8State(v9State: StateV9): StateV8 {
    switch (v9State) {
      case 'disconnecting':
        return 'connected';  // Still connected until fully disconnected
      case 'reconnected':
        return 'connected';  // Appears as connected to v8 clients
      default:
        return v9State as StateV8;
    }
  }

  mapToV8Context(v9Context: ContextV9): ContextV8 {
    const { url, socket, retries } = v9Context;
    return { url, socket, retries };
  }
}
```

### 3.2 Legacy Event Support
```typescript
class LegacyEventSupport {
  private emitLegacyEvents(state: StateV9, context: ContextV9) {
    if (state === 'disconnecting') {
      // Emit both new and legacy events
      this.emit('disconnecting', context.disconnectReason);
      // Don't emit disconnect yet
    }
    if (state === 'reconnected') {
      // Emit both new and legacy events
      this.emit('reconnected');
      this.emit('connected');  // Legacy event
    }
  }
}
```

## 4. Phased Migration Strategy

### 4.1 Phase 1: Preparation
- Update to latest v8 release
- Remove deprecated features
- Add new state handlers (as no-ops)
- Verify current functionality

### 4.2 Phase 2: Core Update
- Update core dependency to v9
- Implement basic new state handling
- Keep compatibility layer active
- Monitor for issues

### 4.3 Phase 3: Feature Adoption
- Implement new state features
- Update application logic
- Remove compatibility layers
- Test new functionality

### 4.4 Phase 4: Cleanup
- Remove v8 compatibility code
- Update all handlers
- Remove legacy event handling
- Final verification

## 5. Common Issues and Solutions

### 5.1 State Management Issues
Problem: State handlers not accounting for new states
Solution: Add explicit handling for disconnecting/reconnected states

### 5.2 Context Access Issues
Problem: Missing new context properties
Solution: Add null checks and fallbacks for new properties

### 5.3 Event Handling Issues
Problem: Event handlers not updated for new flow
Solution: Update event handling logic for graceful disconnection

## 6. Testing Migration

### 6.1 Integration Test Updates
```typescript
describe('v8 to v9 Migration', () => {
  test('graceful disconnect works with v8 handlers', () => {
    const client = createClientWithV8Compatibility();
    client.disconnect();
    // Should still work with v8 events
  });

  test('reconnection works with v8 handlers', () => {
    const client = createClientWithV8Compatibility();
    client.reconnect();
    // Should still work with v8 events
  });
});
```

### 6.2 Compatibility Layer Tests
```typescript
describe('Compatibility Layer', () => {
  test('v9 states map correctly to v8', () => {
    const layer = new CompatibilityLayer();
    expect(layer.mapToV8State('disconnecting')).toBe('connected');
    expect(layer.mapToV8State('reconnected')).toBe('connected');
  });
});
```

## 7. Rollback Procedures

### 7.1 Quick Rollback
Steps for immediate rollback to v8:
1. Revert dependency version
2. Restore previous state handlers
3. Remove new state logic
4. Verify v8 functionality

### 7.2 Gradual Rollback
Steps for gradual rollback:
1. Enable full compatibility layer
2. Remove v9 features incrementally
3. Monitor for issues
4. Complete rollback when safe

## 8. Migration Checklist

### 8.1 Pre-Migration
- [ ] Audit current usage
- [ ] Identify breaking changes
- [ ] Update test suite
- [ ] Prepare rollback plan

### 8.2 During Migration
- [ ] Update dependencies
- [ ] Apply compatibility layer
- [ ] Update state handling
- [ ] Test new features

### 8.3 Post-Migration
- [ ] Verify all features
- [ ] Remove compatibility code
- [ ] Update documentation
- [ ] Monitor production