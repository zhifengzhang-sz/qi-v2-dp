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

## File Content Matrix

### Layer 1: Foundation

| File | Must Contain | Must Not Contain |
|------|--------------|------------------|
| constants.ts | • Socket states (as const assertion)<br>• Event types (as const assertion)<br>• Config constants (as const assertion)<br>• Close codes (as const assertion)<br>• Basic type exports (e.g., `type State = typeof STATES[keyof typeof STATES]`)<br>• Readonly property definitions | • Function declarations/implementations<br>• Type guards<br>• Validation logic<br>• Helper functions<br>• State management code<br>• Default values without const assertions |
| errors.ts | • Error codes (as const assertion)<br>• Error type definitions<br>• Error interface definitions<br>• Error context interfaces<br>• ErrorCode type union<br>• Readonly error properties<br>• Error metadata types | • Error class implementations<br>• Error throwing logic<br>• Error handling functions<br>• Validation methods<br>• Error creation utilities<br>• Helper functions<br>• Runtime checks |

### Layer 2: Core Types

| File | Must Contain | Must Not Contain |
|------|--------------|------------------|
| types.ts | • Base event interface<br>• WebSocket event type union<br>• Context interface with readonly props<br>• Timing metric interfaces<br>• Rate limit interfaces<br>• Message interfaces<br>• Queue state interfaces<br>• Configuration interfaces<br>• Generic type parameters where needed | • Type guard implementations<br>• Validation functions<br>• Helper utilities<br>• Actual values or instances<br>• Runtime checks<br>• State logic<br>• Default implementations |
| states.ts | • State metadata interfaces<br>• State definition interfaces<br>• State validation interfaces<br>• State history interfaces<br>• Transition type definitions<br>• Invariant interfaces<br>• State action interfaces<br>• State guard interfaces | • State validation logic<br>• State management code<br>• Helper functions<br>• Runtime checks<br>• Implementation logic<br>• State instances<br>• Default values |

### Layer 3: Implementations

| File | Must Contain | Must Not Contain |
|------|--------------|------------------|
| utils.ts | • Helper function implementations<br>• Type guard implementations<br>• Validation utility implementations<br>• Context creation/updates<br>• Error handling utilities<br>• URL validation<br>• Metric calculation<br>• Rate limit logic<br>• Byte formatting<br>• Data conversions | • Type definitions (use imports)<br>• Interface definitions<br>• Constant definitions<br>• State machine logic<br>• Direct WebSocket operations<br>• Non-pure functions |
| transitions.ts | • Transition validation implementation<br>• State change logic<br>• State history tracking<br>• Error recovery implementation<br>• Transition guards implementation<br>• Cleanup logic<br>• Event processing<br>• State invariant checks<br>• Transition timing tracking | • Type definitions (use imports)<br>• Interface definitions<br>• Constant values<br>• Direct WebSocket operations<br>• Non-pure functions |

## Layer Dependency Rules

1. Layer 1 (Foundation):
   - constants.ts: No dependencies
   - errors.ts: May depend on constants.ts

2. Layer 2 (Core Types):
   - types.ts: May depend on Layer 1
   - states.ts: May depend on types.ts and Layer 1

3. Layer 3 (Implementations):
   - utils.ts: May depend on Layer 1 and types.ts
   - transitions.ts: May depend on Layer 1, Layer 2, and utils.ts

4. Layer 4 (Behavior):
   - All files may depend on Layers 1-3
   - No circular dependencies allowed

5. Layer 5 (Machine):
   - May depend on all previous layers
   - No circular dependencies allowed

## XState v5 Compliance

### Type System
- [ ] Readonly type definitions where appropriate
- [ ] Proper use of const assertions
- [ ] Proper type inference setup
- [ ] No use of any without explicit reason

### Implementation Patterns
- [ ] Pure functions for all implementations
- [ ] No state mutations
- [ ] Proper actor model usage
- [ ] Proper service definitions

### Breaking Changes
- [ ] No v4 action objects
- [ ] Using new guard syntax
- [ ] Using new service syntax
- [ ] Proper type inference setup

## Testing Requirements

### Layer 1 & 2 Tests
Focus:
- Type compilation
- Constant immutability
- Interface compatibility
- Type relationships

Test Types:
- [ ] Type compilation tests
- [ ] Interface compilation tests
- [ ] Constant immutability tests
- [ ] NO runtime tests needed

### Layer 3 Tests
Focus:
- Implementation correctness
- Error handling
- Edge cases
- Performance

Test Types:
- [ ] Unit tests
- [ ] Integration tests
- [ ] Edge case tests
- [ ] Performance tests
- [ ] Error handling tests

## Implementation Verification Checklist

### Pre-implementation
- [ ] Layer boundaries clear
- [ ] Dependencies identified
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