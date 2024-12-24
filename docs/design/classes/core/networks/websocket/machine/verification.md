# WebSocket State Machine Verification Document

## Module Dependencies

```mermaid
graph TD
    L1[Layer 1: Type Definitions] --> L2[Layer 2: Type Extensions]
    L2 --> L3[Layer 3: Implementations]
    L3 --> L4[Layer 4: Behavior]
    L4 --> L5[Layer 5: Machine]

    %% Layer 1 - Type Definitions
    subgraph "Layer 1: Foundation"
        constants[constants.ts - Basic types]
        errors[errors.ts - Error types]
    end

    %% Layer 2 - Type Extensions
    subgraph "Layer 2: Core Types"
        types[types.ts - Complex types]
        states[states.ts - State types]
    end

    %% Layer 3 - Implementations
    subgraph "Layer 3: Utils & Transitions"
        utils[utils.ts - Helper implementations]
        transitions[transitions.ts - State logic]
    end

    %% Layer 4
    subgraph "Layer 4: Behavior"
        guards[guards.ts]
        actions[actions.ts]
        services[services.ts]
    end

    %% Layer 5
    subgraph "Layer 5: Machine"
        machine[machine.ts]
    end

    %% Detailed Dependencies
    constants --> types
    errors --> types
    types --> states
    types --> utils
    types --> transitions
    states --> transitions
    utils --> guards
    utils --> actions
    utils --> services
    transitions --> machine
    guards --> machine
    actions --> machine
    services --> machine
```

## Layer Implementations

### Layer 1: Foundation

#### constants.ts
**Purpose**: 
Define all constant values and their basic types for the WebSocket state machine. This file serves as the single source of truth for all constant values used throughout the system.

**Usage**:
- Import when you need access to predefined constants
- Use for type definitions directly derived from constants
- Reference when you need standard configuration values
- Base other type definitions on these constants

| Must Contain | Must Not Contain |
|--------------|------------------|
| • Socket states (as const assertion)<br>• Event types (as const assertion)<br>• Config constants (as const assertion)<br>• Close codes (as const assertion)<br>• Basic type exports (e.g., `type State = typeof STATES[keyof typeof STATES]`)<br>• Readonly property definitions | • Function declarations/implementations<br>• Type guards<br>• Validation logic<br>• Helper functions<br>• State management code<br>• Default values without const assertions |

#### errors.ts
**Purpose**: 
Define the type system for error handling across the WebSocket state machine. This file establishes the error type hierarchy and interfaces for error handling.

**Usage**:
- Import when defining error-related types
- Use for creating error handling interfaces
- Reference when implementing error handling logic
- Base error implementations on these definitions

| Must Contain | Must Not Contain |
|--------------|------------------|
| • Error codes (as const assertion)<br>• Error type definitions<br>• Error interface definitions<br>• Error context interfaces<br>• ErrorCode type union<br>• Readonly error properties<br>• Error metadata types | • Error class implementations<br>• Error throwing logic<br>• Error handling functions<br>• Validation methods<br>• Error creation utilities<br>• Helper functions<br>• Runtime checks |

### Layer 2: Core Types

#### types.ts
**Purpose**: 
Define the core type system for the WebSocket state machine. This file provides the fundamental type definitions that describe the shape and structure of the system's data.

**Usage**:
- Import when you need core type definitions
- Use as the foundation for complex type compositions
- Reference when implementing interfaces
- Base implementation types on these definitions

| Must Contain | Must Not Contain |
|--------------|------------------|
| • Base event interface<br>• WebSocket event type union<br>• Context interface with readonly props<br>• Timing metric interfaces<br>• Rate limit interfaces<br>• Message interfaces<br>• Queue state interfaces<br>• Configuration interfaces<br>• Generic type parameters where needed | • Type guard implementations<br>• Validation functions<br>• Helper utilities<br>• Actual values or instances<br>• Runtime checks<br>• State logic<br>• Default implementations |

#### states.ts
**Purpose**: 
Define the type system for states and their metadata in the WebSocket state machine. This file establishes the structure for state definitions and their relationships.

**Usage**:
- Import when defining state-related structures
- Use for creating state type hierarchies
- Reference when implementing state logic
- Base state implementations on these definitions

| Must Contain | Must Not Contain |
|--------------|------------------|
| • State metadata interfaces<br>• State definition interfaces<br>• State validation interfaces<br>• State history interfaces<br>• Transition type definitions<br>• Invariant interfaces<br>• State action interfaces<br>• State guard interfaces | • State validation logic<br>• State management code<br>• Helper functions<br>• Runtime checks<br>• Implementation logic<br>• State instances<br>• Default values |

### Layer 3: Implementations

#### utils.ts
**Purpose**: 
Provide generic, reusable utility functions that handle common operations and data manipulations. This file serves as the foundation layer for all basic operations that aren't specific to state machine logic.

**Usage**:
- Use for any generic operations that could be used outside the state machine context
- Import when you need basic data manipulation, validation, or helper functions
- Use as the foundation layer for higher-level operations in transitions.ts
- Call these utilities from any layer above to handle common tasks

| Must Contain | Must Not Contain |
|--------------|------------------|
| **Generic Utilities:**<br>• Generic helper functions (data conversion, formatting)<br>• Generic type guards (isWebSocketEvent, isValidPayload)<br>• Generic validation (URLs, data formats)<br>• Generic context manipulation (create, update)<br>• Generic error handling utilities<br>• Metric calculations (bytes, timing)<br>• Rate limiting calculations<br>• Pure mathematical functions<br>• Data structure manipulation<br>**Generic State Utilities:**<br>• Context validation<br>• Basic state checks<br>• Event payload validation<br>• Message queue operations | • State transition logic<br>• State machine logic<br>• Transition validation<br>• State history tracking<br>• State-specific guards<br>• Machine-specific logic<br>• WebSocket operations<br>• Non-pure functions<br>• Type definitions (use imports)<br>• Circular dependencies |

#### transitions.ts
**Purpose**: 
Handle all state machine-specific logic and manage the lifecycle of states and transitions. This file is responsible for the core state machine behavior and ensures state transitions are valid and properly managed.

**Usage**:
- Use for all state machine-specific operations and logic
- Import when implementing state changes or transition validation
- Use to manage state history and transition sequences
- Call from the machine layer to handle state changes

| Must Contain | Must Not Contain |
|--------------|------------------|
| **State Machine Specifics:**<br>• State transition logic<br>• State change validation<br>• Transition mapping implementation<br>• State invariant checking<br>• State history tracking<br>• State-specific error handling<br>• Transition guards implementation<br>• State cleanup logic<br>• State timing tracking<br>**Transition-specific:**<br>• Transition event handling<br>• Transition validation rules<br>• State sequence management<br>• State recovery logic | • Generic utility functions<br>• Generic validation logic<br>• Generic type guards<br>• Basic context operations<br>• General purpose helpers<br>• WebSocket operations<br>• Non-pure functions<br>• Type definitions (use imports)<br>• Data formatting<br>• Metric calculations |

## XState v5 Compliance

### Type System Requirements
- [ ] Use readonly type definitions for immutable data
- [ ] Use proper const assertions
- [ ] Implement proper type inference
- [ ] Avoid `any` type unless explicitly needed
- [ ] Use proper discriminated unions for events

### Implementation Requirements
- [ ] Pure functions only
- [ ] No direct state mutations
- [ ] Proper actor model usage
- [ ] Type-safe action implementations
- [ ] Proper service definitions

### Breaking Changes from v4
- [ ] Remove v4 action objects
- [ ] Use new guard syntax
- [ ] Use new service syntax
- [ ] Implement proper type inference
- [ ] Use new action creators

## Testing Strategy

### Layer 1 & 2 Tests
- Type compilation tests only
- Interface compatibility tests
- Constant immutability tests
- NO runtime tests needed

### Layer 3 Tests
- Implementation unit tests
- Integration tests
- Edge case testing
- Performance testing
- Error handling tests

## Implementation Verification

### Pre-implementation
- [ ] Layer boundaries are clear
- [ ] Dependencies are identified
- [ ] XState v5 patterns reviewed
- [ ] Testing strategy defined

### During Implementation
- [ ] Layer separation maintained
- [ ] No cross-layer implementation leaks
- [ ] Pure functions used
- [ ] Type safety maintained

### Post-implementation
- [ ] All tests passing
- [ ] No type errors
- [ ] Documentation complete
- [ ] Performance acceptable

## Review Checklist

### Code Review
- [ ] Layer boundary compliance
- [ ] Implementation correctness
- [ ] Error handling
- [ ] Type safety
- [ ] Documentation

### Architecture Review
- [ ] Layer separation
- [ ] Dependency management
- [ ] XState v5 compliance
- [ ] Testing coverage