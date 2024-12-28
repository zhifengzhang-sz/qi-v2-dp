# WebSocket Machine Class Diagram

## 1. Layer Structure
```mermaid
graph TD
    L1[Layer 1: Foundation] --> |uses| L2[Layer 2: Types]
    L2 --> |uses| L3[Layer 3: Utils]
    L3 --> |uses| L4[Layer 4: Components]
    L4 --> |uses| L5[Layer 5: Machine]

    subgraph "Layer 1"
        C[constants.ts]
        E[errors.ts]
    end

    subgraph "Layer 2"
        T[types.ts]
        S[states.ts]
    end

    subgraph "Layer 3"
        U[utils.ts]
        TR[transitions.ts]
    end

    subgraph "Layer 4"
        EV[events.ts]
        A[actions.ts]
        G[guards.ts]
        SV[services.ts]
    end

    subgraph "Layer 5"
        M[machine.ts]
    end
```

## 2. Component Relations

```mermaid
classDiagram
    %% Layer 5
    class WebSocketMachine {
        +createWebSocketMachine(url)
        -setup()
        -createMachine()
        +WebSocketContext
        +WebSocketEvent
    }
    
    %% Layer 4
    class Actions {
        +assignSocket(socket)
        +assignError(error)
        +incrementRetryCount()
        +resetRetryCount()
        +handlePing()
        +handlePong()
    }

    class Guards {
        +canConnect(context)
        +canRetry(context)
        +shouldReconnect(context)
        +isPingTimeout(context)
    }

    class Events {
        +createEvent
        +EventSchema
        +isEvent
        +EVENTS
    }

    class Services {
        +webSocketActor
        -handleError()
        -heartbeat()
        -setupSocket()
    }

    %% Layer 3 - Add More Details
    class StateSchema {
        +initial: State
        +states: Record~State, StateMetadata~
        +getMetadata(state)
        +validateState(state)
        +createSchema()
        +getStateConfig(state)
        +isValidState(state)
    }

    class Transitions {
        +validTransitions: Map~State, State[]~
        +isValidTransition(from, to)
        +canTransition(from, to)
        +validateTransition(from, to)
        +getNextStates(state)
        +getPreviousStates(state)
    }

    class Utils {
        +validateUrl(url)
        +calculateRetryDelay(attempt)
        +createTimeout(ms)
        +debounce(fn, ms)
        +isValidConfig(config)
        +validateMetadata(meta)
    }

    %% Layer 2
    class Types {
        +WebSocketContext
        +WebSocketState
        +WebSocketEvent
        +StateMetadata
    }

    class States {
        +STATES
        +StateSchema
        +isState()
    }

    %% Layer 1
    class Constants {
        +CONFIG
        +EVENTS
        +STATES
    }

    class Errors {
        +ERROR_CODES
        +ErrorContext
        +createError()
    }

    %% Relationships
    WebSocketMachine --> StateSchema
    WebSocketMachine --> Transitions
    WebSocketMachine --> Utils
    WebSocketMachine --> Actions
    WebSocketMachine --> Events
    WebSocketMachine --> Guards
    WebSocketMachine --> Services

    StateSchema ..> Transitions
    Utils ..> StateSchema
    Guards ..> Utils
    Actions ..> StateSchema
    Services ..> StateSchema

    Actions --> Utils
    Actions --> Events
    Actions --> Types

    Guards --> Transitions
    Guards --> Types

    Services --> Utils
    Services --> Events
    Services --> Types

    StateSchema --> States
    StateSchema --> Types

    Transitions --> States
    Transitions --> Types

    Utils --> Constants
    Utils --> Errors

    Events --> Types
    Events --> Constants

    Types --> Constants
    Types --> Errors
```

## 3. File Dependencies

## File Dependencies
```
/machine/
├── Layer 5
│   └── machine.ts
│       ├── actions.ts [L4]
│       ├── guards.ts [L4]
│       ├── services.ts [L4]
│       ├── events.ts [L4]
│       ├── states.ts [L3]
│       └── types.ts [L2]
│
├── Layer 4
│   ├── actions.ts
│   │   ├── events.ts [L4]
│   │   ├── types.ts [L2]
│   │   ├── states.ts [L3]
│   │   └── utils.ts [L3]
│   ├── guards.ts
│   │   ├── transitions.ts [L3]
│   │   └── types.ts [L2]
│   ├── services.ts
│   │   ├── events.ts [L4]
│   │   ├── types.ts [L2]
│   │   └── utils.ts [L3]
│   └── events.ts
│       ├── types.ts [L2]
│       └── constants.ts [L1]
│
├── Layer 3
│   ├── utils.ts
│   │   ├── constants.ts [L1]
│   │   └── errors.ts [L1]
│   ├── transitions.ts
│   │   ├── states.ts [L2]
│   │   └── types.ts [L2]
│   └── states.ts
│       └── types.ts [L2]
│
├── Layer 2
│   ├── types.ts
│   │   ├── constants.ts [L1]
│   │   └── errors.ts [L1]
│   └── states.ts
│       └── constants.ts [L1]
│
└── Layer 1
    ├── constants.ts
    └── errors.ts
```

## 4. Implementation Rules

1. Layer Access:
   - Higher layers can use lower layers
   - Lower layers cannot use higher layers
   - Same layer components can interact

2. Component Rules:
   - Actions: Pure functions, no side effects
   - Guards: Boolean conditions only
   - Events: Type definitions and creators
   - Services: Side effects and IO
   - Utils: Pure utility functions
   - Transitions: State validation logic
   - StateSchema: State metadata and validation

3. Design Patterns:
   - Factory Pattern for machine creation
   - Builder Pattern for state transitions
   - Observer Pattern for event handling
   - Strategy Pattern for guards and actions
   
4. Error Prevention:
   - Type safety through interfaces
   - State validation in transitions
   - Guard conditions for state changes
   - Pure functions for predictability