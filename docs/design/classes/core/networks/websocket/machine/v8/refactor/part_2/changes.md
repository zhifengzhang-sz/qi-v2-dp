# Implementation Changes for v9 (changes.md)

## Preamble

### Document Dependencies
This document depends on and is constrained by:

1. `refactor/part_1/spec.md`: Core mathematical changes
2. `refactor/part_1/map.md`: Specification mapping
3. `refactor/part_2/plan.md`: Implementation planning
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
- Planning aspects
- Mathematical foundations
- Testing strategy
- Migration guidance

## 1. machine.part.2.abstract.md Changes

### 1.1 State Definition Changes
```diff
abstract class State {
  // Add new states
+ readonly disconnecting: StateType
+ readonly reconnected: StateType

  // Properties must be updated
- getAvailableStates(): StateType[]
+ getAvailableStates(): StateType[] {
+   return ['disconnected', 'disconnecting', 'connecting', 
+           'connected', 'reconnecting', 'reconnected']
+ }
}
```

### 1.2 Event Definition Changes
```diff
abstract class Event {
  // Add new events
+ readonly DISCONNECTED: EventType
+ readonly RECONNECTED: EventType
+ readonly STABILIZED: EventType

  // Update event mapping
- mapToProtocolEvent(event: EventType): ProtocolEvent
+ mapToProtocolEvent(event: EventType): ProtocolEvent {
+   // Add new mappings
+   if (event === 'DISCONNECTED') return { type: 'close' }
+   if (event === 'RECONNECTED') return { type: 'open' }
+   if (event === 'STABILIZED') return { type: 'open' }
+   // Existing mappings remain unchanged
+ }
}
```

## 2. machine.part.2.concrete.core.md Changes

### 2.1 State Machine Updates
```diff
class StateMachine {
  // Add new state handlers
+ private handleDisconnecting(event: Event): void {
+   this.validateDisconnectingState()
+   if (event.type === 'DISCONNECTED') {
+     this.transition('disconnected')
+   }
+ }

+ private handleReconnected(event: Event): void {
+   this.validateReconnectedState()
+   if (event.type === 'STABILIZED') {
+     this.transition('connected')
+   }
+ }

  // Update validation
+ private validateDisconnectingState(): void {
+   assert(this.context.socket !== null)
+   assert(this.context.disconnectReason !== null)
+ }

+ private validateReconnectedState(): void {
+   assert(this.context.socket !== null)
+   assert(this.context.reconnectCount > 0)
+ }
}
```

### 2.2 Context Updates
```diff
interface Context {
  // Add new properties
+ disconnectReason: string | null
+ reconnectCount: number
+ lastStableConnection: number | null

  // Update type validator
- validateContext(context: Context): boolean
+ validateContext(context: Context): boolean {
+   // Add new validations
+   if (this.state === 'disconnecting') {
+     if (context.disconnectReason === null) return false
+   }
+   if (this.state === 'reconnected') {
+     if (context.reconnectCount <= 0) return false
+   }
+   // Existing validations remain unchanged
+   return true
+ }
}
```

## 3. machine.part.2.concrete.protocol.md Changes

### 3.1 Protocol Handler Updates
```diff
class ProtocolHandler {
  // Add new handlers
+ private handleDisconnecting(): void {
+   this.socket.close(1000, this.context.disconnectReason)
+ }

+ private handleReconnected(): void {
+   this.emit('STABILIZED')
+ }

  // Update event mapping
- private mapSocketEvent(event: WebSocket.Event): Event
+ private mapSocketEvent(event: WebSocket.Event): Event {
+   // Add new mappings
+   if (event.type === 'close' && this.state === 'disconnecting') {
+     return { type: 'DISCONNECTED' }
+   }
+   if (event.type === 'open' && this.state === 'reconnecting') {
+     return { type: 'RECONNECTED' }
+   }
+   // Existing mappings remain unchanged
+ }
}
```

### 3.2 Error Handling Updates
```diff
class ErrorHandler {
  // Add new error handlers
+ private handleDisconnectingError(error: Error): void {
+   this.forceDisconnect(error.message)
+ }

+ private handleReconnectedError(error: Error): void {
+   this.retryConnection()
+ }

  // Update error mapping
- private mapErrorToAction(error: Error): Action
+ private mapErrorToAction(error: Error): Action {
+   // Add new mappings
+   if (this.state === 'disconnecting') {
+     return this.handleDisconnectingError
+   }
+   if (this.state === 'reconnected') {
+     return this.handleReconnectedError
+   }
+   // Existing mappings remain unchanged
+ }
}
```

## 4. Type Definition Changes

### 4.1 State Types
```diff
type State =
  | 'disconnected'
+ | 'disconnecting'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
+ | 'reconnected'
```

### 4.2 Event Types
```diff
type Event =
  | { type: 'CONNECT' }
  | { type: 'DISCONNECT' }
+ | { type: 'DISCONNECTED' }
+ | { type: 'RECONNECTED' }
+ | { type: 'STABILIZED' }
  // Existing event types remain unchanged
```

## 5. Interface Changes

### 5.1 Public API
```diff
interface WebSocketClient {
  // Add new methods
+ onDisconnecting(handler: (reason: string) => void): void
+ onReconnected(handler: () => void): void

  // Existing methods remain unchanged
  connect(url: string): Promise<void>
  disconnect(): Promise<void>
  send(data: unknown): Promise<void>
}
```

### 5.2 Internal Interfaces
```diff
interface StateHandler {
  // Add new handlers
+ handleDisconnecting(context: Context): void
+ handleReconnected(context: Context): void

  // Existing handlers remain unchanged
  handleConnecting(context: Context): void
  handleConnected(context: Context): void
}
```

## 6. Constants and Configuration

### 6.1 Timeout Constants
```diff
const TIMEOUTS = {
  // Add new timeouts
+ DISCONNECT: 5000,
+ STABILIZE: 1000,

  // Existing timeouts remain unchanged
  CONNECT: 30000,
  RECONNECT: 5000,
}
```

### 6.2 Error Codes
```diff
const ERROR_CODES = {
  // Add new error codes
+ DISCONNECT_TIMEOUT: 'DISCONNECT_TIMEOUT',
+ STABILIZATION_FAILED: 'STABILIZATION_FAILED',

  // Existing error codes remain unchanged
  CONNECT_TIMEOUT: 'CONNECT_TIMEOUT',
  RECONNECT_FAILED: 'RECONNECT_FAILED',
}
```