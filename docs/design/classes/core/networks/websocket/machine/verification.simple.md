# WebSocket State Machine Verification

## Project Timeline
1. Session 1: Foundation (2-3 hours)
   - Complete verification doc
   - Layer 1-2 implementation
   - Basic test setup

2. Session 2: Core Components (2-3 hours)
   - Layer 3: Utils
   - Layer 4: Events, Contexts
   - Unit tests

3. Session 3: Machine Parts (2-3 hours)
   - Layer 4: Guards, Actions, Services
   - Integration tests
   - Error handling

4. Session 4: Machine (2-3 hours)
   - Layer 5: Machine setup
   - Integration
   - Final tests

Total: 8-12 hours of focused development

## Core Principles
1. XState v5 compliance first
2. Simple implementation always
3. Quality-driven progress:
   - Must pass core requirements
   - Must be simply implemented
   - Must be type-safe
   - Must handle critical cases

## Quality Gates
1. Core Requirements:
   - XState v5 compliant
   - Simple implementation
   - Pure functions where possible
   - Clear interfaces

2. Critical Features:
   - Connection handling
   - Error management
   - Resource cleanup
   - State transitions

## Exit Criteria
1. All layers implemented
2. Tests passing
3. Types safe
4. Documentation complete
5. No known blockers

## Progress Rules
1. Fix blocking issues first
2. Keep implementations simple
3. Move forward when gates pass
4. Return only for critical bugs

## Universal Requirements
1. Pure functions preferred
2. Type safety required
3. No circular dependencies
4. Clear documentation
5. Simple test cases

## Layer Requirements

### Layer 1: Foundation

#### constants.ts
- Purpose: Define WebSocket states and codes
- Exports: 
  - STATES: Machine states
  - EVENTS: Event types
  - CLOSE_CODES: WebSocket close codes
  - State: State type
  - EventType: Event type
- Constraints:
  - Use 'as const'
  - Export types only
  - No implementation logic

#### errors.ts
- Purpose: Define error types and codes
- Exports:
  - ERROR_CODES: Error code constants
  - ErrorContext: Error details type
  - ErrorCategory: Error classification
- Constraints:
  - Pure type definitions
  - No error handling logic
  - Readonly properties only

## Layer 2: Types

### types.ts

- Purpose: Define core WebSocket interfaces
- Exports: WebSocketOptions, WebSocketContext, WebSocketEvent
- Constraints:
  - Interface definitions only
  - No implementation
  - No state machine logic

### states.ts

- Purpose: Define state machine types
- Exports: StateMetadata, ValidationResult, StateValue
- Constraints:
  - XState v5 compatible types
  - No runtime code
  - Pure type definitions

## Layer 3: Utils

### utils.ts

- Purpose: Provide utility functions
- Exports: isValidUrl, isValidState, isValidError
- Constraints:
  - Pure functions only
  - No state management
  - No side effects

### transitions.ts

- Purpose: Define state transitions
- Exports: canConnect, canDisconnect, isValidTransition
- Constraints:
  - Pure guard functions
  - No state mutations
  - XState v5 compatible

## Layer 4: Machine Components

### events.ts
- Purpose: Define event types and creators
- Exports: Event types, event creators
- Constraints:
  - Pure event creators
  - Type-safe events
  - XState v5 event pattern
  - Simple type hierarchy

### contexts.ts
- Purpose: Define context operations
- Exports: Context creators and updaters
- Constraints:
  - Pure context operations
  - No side effects
  - Type-safe updates
  - Immutable patterns

### guards.ts

- Purpose: Define XState guard conditions
- Exports: Guard factories and conditions
- Constraints:
  - Pure guard creators
  - No state mutations
  - XState v5 syntax
  - Simple boolean returns

### actions.ts

- Purpose: Define XState actions
- Exports: Action factories and creators
- Constraints:
  - Pure action creators
  - No side effects
  - Type-safe payloads
  - Simple assign operations

### services.ts

- Purpose: Define XState services
- Exports: Service creators and spawners
- Constraints:
  - Actor model compliant
  - Pure service creators
  - Type-safe message passing
  - Clean cleanup handlers

### Implementation Checklist
- [ ] Pure event creators
- [ ] Type-safe context operations
- [ ] Actor model services
- [ ] Pure action creators
- [ ] Type-safe guards
- [ ] Clean error handling
- [ ] Proper cleanup handlers
- [ ] XState v5 patterns
- [ ] No circular dependencies
- [ ] Clear layer boundaries

### Testing Requirements
- Unit tests for event creators
- Unit tests for context operations
- Integration tests for services
- Type safety verification
- XState v5 compatibility

## Layer 5: Machine Implementation

### setup.ts

- Purpose: Configure XState machine
- Exports: Machine setup and config
- Constraints:
  - Use setup() function
  - Type-safe context
  - Pure configuration

### machine.ts

- Purpose: Create state machine instance
- Exports: Machine instance and types
- Constraints:
  - Actor model compliance
  - Type-safe integration
  - Pure state handling

---

## Verification Rules

### 1. Each file must:

- Have single responsibility
- Export only defined types/functions
- Maintain layer boundaries
- Follow naming conventions

### 2. No file should:

- Import from higher layers
- Implement logic outside its purpose
- Mutate external state
- Break type safety

### 3. Testing requirements:

- Layer 1: Type compilation only
- Layer 2: Interface compatibility
- Layer 3: Unit tests + integration

---

## XState v5 Requirements

### Core Components

- [ ] State machine types from @xstate/types
- [ ] Actor model implementation
- [ ] Event-first approach
- [ ] Type-safe actions
- [ ] Type-safe context

### Breaking Changes

- [ ] No statecharts.machine()
- [ ] No createMachine()
- [ ] Use setup() function
- [ ] Type-safe events
- [ ] Pure action creators

### Integration Points

- [ ] State definitions
- [ ] Event handlers
- [ ] Guard conditions
- [ ] Action implementations
- [ ] Service spawning

---

## Implementation Checklists

### Layer 1: Foundation

- [ ] All constants are 'as const'
- [ ] All types are readonly
- [ ] No runtime code
- [ ] No external dependencies
- [ ] Pure TypeScript types

### Layer 2: Type System

- [ ] XState v5 compatible types
- [ ] No implementation details
- [ ] Clear type exports
- [ ] Proper type constraints
- [ ] Type-safe events

### Layer 3: Implementation
- [ ] Pure functions only
- [ ] No side effects
- [ ] Clear type signatures
- [ ] Minimal dependencies
- [ ] Unit test coverage

### Layer 4: Machine Components
- [ ] Pure guard conditions
- [ ] Type-safe action creators
- [ ] Actor model services
- [ ] No direct state mutations
- [ ] XState v5 syntax compliance

#### General Requirements
- [ ] XState v5 compliance first
- [ ] Simplest possible implementation
- [ ] Clear type safety
- [ ] No circular dependencies
- [ ] Pure functions preferred

#### Component Guidelines
- One responsibility per file
- Minimal exports
- Clear dependencies
- Simple type hierarchies
- Direct implementations

#### File Requirements

events.ts:
- [ ] Pure event creators
- [ ] Simple type hierarchy
- [ ] XState v5 event pattern
- [ ] Type-safe event handling

contexts.ts:
- [ ] Pure context operations
- [ ] Immutable updates
- [ ] Simple state management
- [ ] Type-safe context

guards.ts:
- [ ] Pure guard functions
- [ ] Simple boolean returns
- [ ] Clear conditions
- [ ] Type-safe checks

actions.ts:
- [ ] Pure action creators
- [ ] Simple state updates
- [ ] Clear side effects
- [ ] Type-safe assignments

services.ts:
- [ ] Actor model services
- [ ] Simple callbacks
- [ ] Clear cleanup
- [ ] Type-safe messaging

#### Exit Criteria
1. Implementation is minimal
2. XState v5 compliant
3. Types are correct
4. Tests pass
5. No circular deps
6. Clear documentation

#### Testing Strategy
1. Unit tests first
2. Integration tests second
3. Type tests third
4. Simple test cases
5. Clear assertions

## File Verification Process

### Core Requirements
- XState v5 compliance
- Type safety
- Pure functions
- Simple implementation

### Edge Cases
- Error handling
- Resource cleanup
- State transitions
- Network failures

### Testing Requirements
- Unit test coverage
- Integration tests
- Type safety tests
- Performance tests

### Documentation
- Clear purpose
- Usage examples
- Type definitions
- Error handling

## Implementation Order
1. Layer 1: Foundation
   - constants.ts
   - errors.ts

2. Layer 2: Types
   - types.ts
   - states.ts

3. Layer 3: Utils
   - utils.ts
   - transitions.ts

4. Layer 4: Components
   - events.ts
   - contexts.ts
   - guards.ts
   - actions.ts
   - services.ts

5. Layer 5: Machine
   - setup.ts
   - machine.ts

## Exit Criteria Details
1. Type Safety
   - No type assertions
   - Clear interfaces
   - Generic constraints
   - Error types

2. Implementation
   - Pure functions
   - Simple logic
   - Clear patterns
   - No duplicates

3. Testing
   - Core cases
   - Edge cases
   - Type checks
   - Integration

4. Documentation
   - Purpose
   - Exports
   - Examples
   - Errors

---

## Migration Notes

- Replace createMachine with setup()
- Use type-safe events
- Implement proper actor model
- Remove v4 action objects
- Use new transition syntax

---

## Implementation Principles

### Simplicity Guidelines
- Keep implementations minimal and focused
- One responsibility per function
- Avoid complex type hierarchies
- Use pure functions where possible
- Minimize state mutations

### Code Style
- Prefer simple over clever
- Clear over concise
- Direct over abstract
- Explicit over implicit
- Readable over optimal

### File Guidelines
- Minimal exports
- Clear dependencies 
- Simple type definitions
- Direct implementations
- No redundant code

### Testing Approach
- Simple unit tests
- Clear test cases
- Direct assertions
- Minimal mocking
- Focus on behavior

## Testing Requirements
- Unit tests for each export
- Type safety verification
- No circular dependencies
- Pure function validation
- XState v5 compatibility tests

## Exit Criteria Checklist
- [ ] XState v5 patterns verified
- [ ] Implementation is minimal
- [ ] All tests passing
- [ ] No type errors
- [ ] Documentation complete
- [ ] No circular deps
- [ ] Clean error handling

---

### Plan: Standardize Documentation Format

**Steps**
1. Keep existing key sections
2. Add clear file paths
3. Standardize format
4. Add implementation checklist


---

## Project Structure
```typescript
src/
  networks/
    websocket/
      machine/
        constants.ts    // Layer 1: States, events, codes
        errors.ts       // Layer 1: Error types, codes
        types.ts        // Layer 2: Core interfaces
        states.ts       // Layer 2: Machine types
        utils.ts        // Layer 3: Helpers
        transitions.ts  // Layer 3: Guards
        events.ts       // Layer 4: Event creators
        contexts.ts     // Layer 4: Context ops
        guards.ts       // Layer 4: Conditions
        actions.ts      // Layer 4: Updates
        services.ts     // Layer 4: Actors
        setup.ts        // Layer 5: Config
        machine.ts      // Layer 5: Instance
```

## Implementation Order
1. Layer 1: Foundation (1 hour)
   - [ ] constants.ts
   - [ ] errors.ts

2. Layer 2: Types (1 hour)
   - [ ] types.ts
   - [ ] states.ts

3. Layer 3: Utils (2 hours)
   - [ ] utils.ts
   - [ ] transitions.ts

4. Layer 4: Components (3 hours)
   - [ ] events.ts
   - [ ] contexts.ts
   - [ ] guards.ts
   - [ ] actions.ts
   - [ ] services.ts

5. Layer 5: Machine (1 hour)
   - [ ] setup.ts
   - [ ] machine.ts

## Requirements Per Layer

### Layer 1: Foundation
- Pure types only
- No runtime code
- Export constants
- Type-safe definitions

### Layer 2: Types
- XState v5 types
- Pure interfaces
- No implementations
- Clear type exports

### Layer 3: Utils
- Pure functions
- No side effects
- Type-safe operations
- Unit test coverage

### Layer 4: Components
- XState v5 patterns
- Actor model
- Pure creators
- Type safety

### Layer 5: Machine
- XState v5 setup
- Type-safe machine
- Clean integration
- Full test coverage

## Exit Criteria
- [ ] Types compile
- [ ] Tests pass
- [ ] XState v5 compliant
- [ ] No type errors
- [ ] Documentation complete
```
