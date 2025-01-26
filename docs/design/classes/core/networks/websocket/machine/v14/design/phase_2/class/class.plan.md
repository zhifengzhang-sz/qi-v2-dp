# Project Class-Level Design

## 1. Overview

- **Purpose**: Define class-level design organization and implementation through layered DSL architecture
- **Goal**: Maintain traceability to formal specs while enabling code generation
- **Reference**: Maps containers and components into class structures

### Terminology
- **Layer 0–4**: Internal class-level design sublayers  
- **machine.md & websocket.md**: Source of formal definitions
- **xstate v5**: State machine implementation
- **ws**: WebSocket transport

---

## 2. Layer 0: Core Types Foundation 

```
phase_2/class/types/
├── common.types.md      # Core type definitions from specs
├── events.types.md      # Event hierarchies and transitions
├── states.types.md      # State definitions and invariants
└── errors.types.md      # Error classification system
```

### Purpose & Scope

1. **Formal Type System**: Direct mapping to `machine.md` and `websocket.md` definitions

2. **DSL Foundation**: Base types for all layers:
   - State enumeration (`disconnected`, `connecting`, etc.)
   - Event definitions (`CONNECT`, `ERROR`, etc.)
   - Context structures
   - Error categories
   
3. **Invariant Capture**: 
   - Resource bounds (`MAX_RETRIES`, `WINDOW_SIZE`)
   - State constraints
   - Timing requirements

### Example Contents

- **`common.types.md`**: Base types and constraints
- **`events.types.md`**: Event hierarchy from formal specs
- **`states.types.md`**: State definitions with transition rules
- **`errors.types.md`**: Error classification per `websocket.md`

### Dependencies
- Core language features only for maximum reusability

---

## 3. Layer 1: Base Interfaces & DSL Components

```
phase_2/class/
├── interfaces/
│   └── internal.interface.md     # Inter-component protocols
└── state/
    ├── context.class.md         # Context management
└── protocol/
    ├── errors.class.md          # Error handling core
└── message/
    └── queue.class.md           # Message queue system
```

### Purpose & Scope

1. **DSL Implementation**: Convert container DSLs to interfaces
2. **Resource Protocols**: Define resource acquisition and release
3. **State Management**: Core state machine behaviors

### Example Contents

- **`internal.interface.md`**: Container communication protocols
- **`context.class.md`**: State context management
- **`errors.class.md`**: Error handling system
- **`queue.class.md`**: Message queue implementation

### Dependencies
- Layer 0 types only
- No external libraries

---

## 4. Layer 2: Core Implementation

```
phase_2/class/
├── state/
│   └── machine.class.md        # State machine integration
├── protocol/
│   ├── socket.class.md         # WebSocket management
│   └── frame.class.md          # Frame processing
├── message/
│   └── rate.class.md          # Rate limiting
└── connection/
    ├── retry.class.md         # Retry logic
    └── timeout.class.md       # Timeout handling
```

### Purpose & Scope

1. **External Integration**:  
   - `xstate v5` state machine
   - `ws` transport layer
   
2. **Resource Management**:
   - Message rate limiting
   - Connection retry logic
   - Timeout management

3. **Protocol Implementation**:
   - Frame validation
   - Error handling
   - State transitions

### Example Contents

- **`machine.class.md`**: XState integration
- **`socket.class.md`**: WebSocket wrapper
- **`frame.class.md`**: Protocol validation
- **`rate.class.md`**: Rate limiting
- **`retry.class.md`**: Backoff implementation
- **`timeout.class.md`**: Timer management

### Dependencies
- Layers 0 & 1
- External libraries (`xstate`, `ws`)

---

## 5. Layer 3: Container Integration

```
phase_2/class/
├── state/
│   └── transition.class.md     # State transition control
├── message/
│   └── dispatch.class.md      # Message routing
└── connection/
    └── lifecycle.class.md     # Connection management
```

### Purpose & Scope

1. **Container Orchestration**: 
   - State machine transitions
   - Message dispatch
   - Connection lifecycle

2. **Resource Coordination**:
   - Queue management
   - Rate limiting
   - Error recovery

3. **Protocol Flow**:
   - Message routing
   - State updates
   - Error propagation

### Example Contents

- **`transition.class.md`**: State control
- **`dispatch.class.md`**: Message handling
- **`lifecycle.class.md`**: Connection control

### Dependencies
- All lower layers
- Container interfaces

---

## 6. Layer 4: External API

```
phase_2/class/interfaces/
└── external.interface.md      # Public API specification
```

### Purpose & Scope

1. **Public Interface**: Client API entry points
2. **Usage Constraints**: Method preconditions
3. **Integration Patterns**: Setup guidance

### Example Contents

- Connection management API
- Message handling API  
- State observation API
- Configuration API

---

## 7. Class Documentation Structure

1. **Type & Interface Definitions**
   - Method signatures
   - Property constraints
   - Formal spec references

2. **Dependencies**
   - Layer requirements
   - Component relationships

3. **State & Behavior**
   - Valid states
   - Transitions
   - Side effects

4. **Implementation Rules**
   - Resource management
   - Error handling
   - Code generation

---

## 8. Implementation Strategy

1. **Layer 0 Foundation**
   - Define core types
   - Map formal specs
   - Establish constraints

2. **Layer 1 Base**
   - Create interfaces
   - Implement core classes
   - Define protocols

3. **Layer 2 Core**
   - Integrate external libs
   - Implement logic
   - Add resource management

4. **Layer 3 Integration**
   - Connect containers
   - Add orchestration
   - Implement flows

5. **Layer 4 API**
   - Define public interface
   - Add documentation
   - Specify patterns

6. **Iteration**
   - Review against specs
   - Update interfaces
   - Maintain consistency

---

## 9. Summary

This layered design provides:

1. **Direct mapping** to formal specs
2. **Clear boundaries** between components
3. **Resource management** at each layer
4. **Implementation guidance** for developers
5. **Testability** through interfaces

The design supports both manual implementation and code generation while maintaining formal specification compliance.