# WebSocket Implementation Design: Abstract Layer

## Preamble

This document defines the high-level architecture and domain language for implementing the WebSocket Client ($\mathcal{WC}$) specified in `machine.part.1.md`. It establishes the core abstractions and component boundaries that bridge between:

1. Formal mathematical model ($\mathcal{WC}$ and protocol mappings)
2. Implementation tools (xstate v5 and ws library)

### Document Purpose

- Defines domain-specific language (DSL) for our WebSocket Client
- Establishes core abstractions and boundaries
- Maps formal concepts to implementation components
- Creates clear separation of concerns

### Document Scope

This document FOCUSES on:

- System context and container design
- Core domain language definitions
- Primary component relationships
- Type hierarchies and boundaries
- Directory structure
- Property mappings

This document does NOT cover:

- Detailed component designs (see machine.part.2.concrete.md)
- Implementation code
- Tool-specific configurations
- Deployment concerns

### Related Documents

- `machine.part.1.md`: Core mathematical specification
- `machine.part.1.websocket.md`: Protocol formal specification
- `machine.part.2.concrete.md`: Detailed component designs
- `impl.map.md`: Implementation to model mappings
- `governance.md`: Design stability guidelines

### Design Philosophy

Following our governance rules, this design:

1. Uses but does not implement state machines
2. Uses but does not implement WebSocket protocol
3. Maintains clear boundaries between domain and tools
4. Preserves formal properties while enabling extension
5. Creates stable interfaces for implementation

## 1. Domain Language

Our WebSocket Client domain model uses a specific language that maps formal concepts to implementation tools:

### 1.1 Core Types

```mermaid
classDiagram
    class State {
        <<enumeration>>
        DISCONNECTED
        CONNECTING
        CONNECTED
        RECONNECTING
    }

    class Event {
        <<enumeration>>
        CONNECT
        DISCONNECT
        OPEN
        CLOSE
        ERROR
        MESSAGE
    }

    class Context {
        <<interface>>
        url: string?
        socket: WebSocket?
        retries: number
        error: Error?
        closeCode: number?
    }

    class Guard {
        <<interface>>
        name: string
        predicate(context: Context): boolean
    }

    class Action {
        <<interface>>
        name: string
        execute(context: Context): void
    }
```

### 1.2 Protocol Types

```mermaid
classDiagram
    class WebSocketState {
        <<interface>>
        readyState: number
        protocol: string
        bufferedAmount: number
    }

    class WebSocketEvent {
        <<interface>>
        type: string
        target: WebSocket
        code?: number
        reason?: string
        data?: any
    }

    class WebSocketContext {
        <<interface>>
        url: string
        protocols: string[]
        lastError: Error?
        closeCode: number?
        message: Queue~Message~
    }

    WebSocketContext --|> Context
```

## 2. Component Design

### 2.1 Core Component Relations

```mermaid
classDiagram
    class WebSocketClient {
        <<interface>>
        +connect(url: string): Promise
        +disconnect(): Promise
        +send(data: unknown): Promise
        +onStateChange(listener: StateListener)
        +onMessage(listener: MessageListener)
    }

    class StateMachine {
        <<interface>>
        +current: State
        +context: Context
        +transition(event: Event): void
        +canTransition(event: Event): boolean
    }

    class SocketManager {
        <<interface>>
        +connect(url: string): void
        +send(data: unknown): void
        +close(code?: number): void
        +onEvent(listener: EventListener)
    }

    class MessageQueue {
        <<interface>>
        +enqueue(message: Message): void
        +dequeue(): Message?
        +peek(): Message?
        +clear(): void
    }

    WebSocketClient --> StateMachine
    WebSocketClient --> SocketManager
    SocketManager --> MessageQueue
```

### 2.2 State Machine Design

Maps our domain states and events to xstate:

```mermaid
classDiagram
    class MachineDefinition {
        <<interface>>
        +id: string
        +initial: State
        +context: Context
        +states: StateDefinition
    }

    class StateDefinition {
        <<interface>>
        +states: Map~State, StateConfig~
        +on: Map~Event, Transition~
        +entry?: Action[]
        +exit?: Action[]
    }

    class TransitionDefinition {
        <<interface>>
        +target: State
        +guards?: Guard[]
        +actions?: Action[]
    }

    class ActionDefinition {
        <<interface>>
        +type: string
        +exec(context: Context): void
    }

    MachineDefinition --> StateDefinition
    StateDefinition --> TransitionDefinition
    StateDefinition --> ActionDefinition
```

### 2.3 Socket Management Design

Maps socket operations to ws library:

```mermaid
classDiagram
    class SocketConfig {
        <<interface>>
        +url: string
        +protocols?: string[]
        +closeTimeout: number
        +pingInterval: number
    }

    class SocketOperations {
        <<interface>>
        +create(config: SocketConfig): void
        +destroy(): void
        +send(data: unknown): void
        +ping(): void
    }

    class EventHandling {
        <<interface>>
        +onOpen(handler: Handler): void
        +onClose(handler: Handler): void
        +onError(handler: Handler): void
        +onMessage(handler: Handler): void
    }

    class HealthMonitoring {
        <<interface>>
        +isAlive(): boolean
        +lastPing: number
        +lastPong: number
        +trackHealth(): void
    }

    SocketOperations --> SocketConfig
    SocketOperations --> EventHandling
    SocketOperations --> HealthMonitoring
```

## 3. Component Boundaries

### 3.1 Client Layer

Owns the domain model and coordinates between state and socket layers:

- Exposes public client API
- Manages state transitions
- Coordinates socket operations
- Handles message flow
- Enforces protocol constraints

### 3.2 State Layer

Manages state machine behavior through xstate:

- Defines state configurations
- Manages transitions
- Executes actions
- Evaluates guards
- Maintains context

### 3.3 Socket Layer

Handles WebSocket operations through ws:

- Manages socket lifecycle
- Handles protocol events
- Buffers messages
- Monitors connection health
- Implements reconnection

## 4. Type Hierarchies

### 4.1 Event Hierarchy

```mermaid
classDiagram
    class BaseEvent {
        <<interface>>
        +type: string
        +timestamp: number
    }

    class ConnectionEvent {
        +url: string
        +protocols?: string[]
    }

    class MessageEvent {
        +data: unknown
        +size: number
    }

    class ErrorEvent {
        +error: Error
        +code?: number
    }

    BaseEvent <|-- ConnectionEvent
    BaseEvent <|-- MessageEvent
    BaseEvent <|-- ErrorEvent
```

### 4.2 Context Hierarchy

```mermaid
classDiagram
    class BaseContext {
        <<interface>>
        +id: string
        +timestamp: number
    }

    class ConnectionContext {
        +url: string?
        +socket: any?
        +retries: number
    }

    class MessageContext {
        +queue: Queue
        +sent: number
        +received: number
    }

    class MetricsContext {
        +uptime: number
        +bytesIn: number
        +bytesOut: number
    }

    BaseContext <|-- ConnectionContext
    BaseContext <|-- MessageContext
    BaseContext <|-- MetricsContext
```

## 5. Directory Structure

Organized by domain concepts:

```
src/
├── client/          # Main domain interfaces
├── state/           # State management interfaces
├── socket/          # Socket management interfaces
└── types/           # Type definitions
```

## 6. Property Mappings

### 6.1 State Machine Properties ($\mathcal{WC}$)

- States map to xstate state nodes
- Events map to xstate events
- Context maps to xstate context
- Transitions map to xstate transitions
- Actions map to xstate actions

### 6.2 Protocol Properties ($E_{ws}$)

- Socket states map to ws readyState
- Protocol events map to ws event handlers
- Socket operations map to ws methods
- Protocol constraints map to runtime checks
