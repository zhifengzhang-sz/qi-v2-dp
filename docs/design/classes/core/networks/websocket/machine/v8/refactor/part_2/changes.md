# Implementation Changes for v9 (changes.md)

## Preamble

### Document Dependencies
This document depends on and is constrained by:

1. `machine.part.1.md`: Core state machine specification
2. `machine.part.1.websocket.md`: Protocol extensions
3. `impl.map.md`: Implementation mappings
4. `governance.md`: Design stability guidelines

### Document Purpose
- Specifies exact changes needed in each implementation file
- Provides diffs and modifications required
- Maps formal changes to concrete code

### Document Scope
FOCUSES on:
- Concrete file changes
- Code modifications
- Interface updates
- Type changes

Does NOT cover:
- Mathematical foundations
- Testing strategy
- Migration guidance

## 1. machine.part.2.abstract.md Changes

### 1.1 State Diagram Changes
```diff
classDiagram
    class State {
        <<enumeration>>
        DISCONNECTED
        + DISCONNECTING
        CONNECTING
        CONNECTED
        RECONNECTING
        - TERMINATING
        - TERMINATED
        + RECONNECTED
    }
```

### 1.2 Event Diagram Changes
```diff
classDiagram
    class Event {
        <<enumeration>>
        CONNECT_REQUEST
        CONNECTION_SUCCESS
        CONNECTION_FAILURE
        DISCONNECT_REQUEST
        DISCONNECTED
        MESSAGE_RECEIVED
        MESSAGE_SEND
        RETRY_ATTEMPT
        MAX_RETRIES_REACHED
        - TERMINATE_REQUEST
        PING
        PONG
        + RECONNECTED
        + STABILIZED
    }
```

### 1.3 Context Changes
```diff
classDiagram
    class Context {
        <<interface>>
        url: string?
        socket: WebSocket?
        retries: number
        error: Error?
        closeCode: number?
        + disconnectReason: string?
        + reconnectCount: number
        + lastStableConnection: number?
    }
```

### 1.4 State Machine Component Changes
```diff
classDiagram
    class StateMachine {
        <<interface>>
        +current: State
        +context: Context
        +transition(event: Event): void
        +canTransition(event: Event): boolean
        + getDisconnectReason(): string?
        + isStabilized(): boolean
    }
```

### 1.5 WebSocket Protocol Types Changes
```diff
classDiagram
    class WebSocketContext {
        <<interface>>
        url: string
        protocols: string[]
        lastError: Error?
        closeCode: number?
        + disconnectReason: string?
        + reconnectCount: number
        + lastStableConnection: number?
        message: Queue~Message~
    }
```

### 1.6 Action Diagram Changes
```diff
classDiagram
    class ActionDefinition {
        <<interface>>
        +type: string
        +exec(context: Context): void
        + preExec?(context: Context): boolean
        + postExec?(context: Context): boolean
    }
```

## 2. Component Relations Changes

### 2.1 State Transition Diagram Changes
```diff
Add transitions:
+ connected → disconnecting
+ disconnecting → disconnected
+ reconnecting → reconnected
+ reconnected → connected
```

### 2.2 Socket Management Changes
```diff
classDiagram
    class SocketOperations {
        <<interface>>
        +create(config: SocketConfig): void
        +destroy(): void
        +send(data: unknown): void
        +ping(): void
        + initiateDisconnect(reason: string): void
        + isStabilized(): boolean
    }
```

## 3. Directory Structure Changes
```diff
src/
├── client/          # Main domain interfaces
├── state/           # State management interfaces
├── socket/          # Socket management interfaces
└── types/           # Type definitions
+ └── protocol/      # Protocol-specific types
```

## 4. Property Mapping Changes

### 4.1 State Machine Property Updates
```diff
Add mappings:
+ disconnecting → xstate 'disconnecting' node
+ reconnected → xstate 'reconnected' node
+ stabilized → xstate event
```

### 4.2 Protocol Property Updates
```diff
Add mappings:
+ disconnectReason → ws close reason
+ reconnectCount → internal counter
+ lastStableConnection → connection timestamp
```

## 5. Required Test Changes

### 5.1 State Transition Tests
- Add tests for new disconnecting state transitions
- Add tests for new reconnected state transitions
- Add stability verification tests

### 5.2 Context Property Tests
- Add tests for disconnectReason management
- Add tests for reconnectCount tracking
- Add tests for connection stability checks

## 6. Migration Requirements

### 6.1 Breaking Changes
- State enumeration changes
- Event type changes
- Context interface changes

### 6.2 Backward Compatibility
- Maintain existing connection behaviors
- Preserve message handling
- Support existing event listeners

This updated changes.md now:
1. Properly reflects all state changes from v8 to v9
2. Includes all new events and context properties
3. Updates component relations and property mappings
4. Specifies required implementation updates
5. Follows minimum change principle while maintaining functionality
