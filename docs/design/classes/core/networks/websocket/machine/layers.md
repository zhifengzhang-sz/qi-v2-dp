# WebSocket State Machine Layers

## Layer 1: Foundation
Purpose: Constants and error definitions
Files: constants.ts, errors.ts
Rules: No implementation, pure types

## Layer 2: Core Types
Purpose: Core type definitions
Files: types.ts, states.ts
Rules: No runtime code, XState types

## Layer 3: Utils
Purpose: Pure utility functions
Files: utils.ts, transitions.ts
Rules: Pure functions, no state

## Layer 4: Machine Components
Purpose: XState specific components
Files: 
- guards.ts: Guard conditions
- actions.ts: State updates
- services.ts: Actor services
- events.ts: Event definitions
- contexts.ts: Context operations
Rules: XState v5 integration

## Layer 5: Machine Implementation
Purpose: Final state machine
Files: setup.ts, machine.ts
Rules: XState v5 setup