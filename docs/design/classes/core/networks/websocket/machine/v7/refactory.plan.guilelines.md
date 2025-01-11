# Minimal Change Implementation Plan v8

## Documentation Principles

1. Specifications MUST:
   - Define requirements and constraints
   - Describe patterns and relationships
   - Establish boundaries and interfaces
   - Document properties and invariants

2. Specifications MUST NOT:
   - Include source code implementations
   - Show specific coding patterns
   - Provide code examples
   - Define implementation details

3. Use diagrams and formal notation to:
   - Show relationships
   - Define interfaces
   - Describe state transitions
   - Express constraints

## Core Principle
MINIMIZE CHANGES: Each modification must be:
- Absolutely necessary to align with formal spec
- Targeted to specific mismatches
- Preserve existing working code
- Verifiable in isolation

## Phase 1: machine.part.2.abstract.md Changes
ONLY change:
1. State definitions:
   ```diff
   - S = {disconnected, connecting, connected, reconnecting, disconnecting}
   + S = {disconnected, connecting, connected, reconnecting, terminating, terminated}
   ```

2. Event mappings:
   ```diff
   - CONNECTION_SUCCESS
   + OPEN
   ```
   Only fix names to match machine.part.1.md exactly

DO NOT CHANGE:
- Component structures
- Existing interface definitions
- Working transitions
- Correct mappings

## Phase 2: machine.part.2.concrete.core.md Changes
ONLY change:
1. Action implementations:
   ```typescript
   // Add ONLY missing actions from machine.part.1.md
   class ActionExecutor {
     // Only add missing actions, don't modify existing
     handleTerminate(context: Context): Context {
       // Implementation
     }
   }
   ```

2. State names:
   ```diff
   - enum State { Disconnected, Connecting, Connected, Reconnecting }
   + enum State { disconnected, connecting, connected, reconnecting, terminating, terminated }
   ```

DO NOT CHANGE:
- Working action implementations
- Existing state handling
- Interface definitions
- Component boundaries

## Phase 3: machine.part.2.concrete.protocol.md Changes
ONLY change:
1. Error codes:
   ```diff
   - ERROR_CODES.TIMEOUT = 4000
   + ERROR_CODES.TIMEOUT = 1001  // Match formal spec exactly
   ```

2. Protocol mappings:
   ```diff
   - mapToProtocolState(CONNECTED)
   + mapToProtocolState(connected)  // Match formal spec names
   ```

DO NOT CHANGE:
- Protocol handling logic
- Connection management
- Frame processing
- Extension mechanisms

## Phase 4: machine.part.2.concrete.message.md Changes
ONLY change:
1. Queue properties:
   ```diff
   interface MessageQueue {
     // Add ONLY missing properties
   + readonly maxSize: number;
   + readonly overflowStrategy: OverflowStrategy;
   }
   ```

DO NOT CHANGE:
- Queue implementation
- Message handling
- Flow control
- Rate limiting

## Validation Strategy

For each change:
1. Verify in isolation
2. Test specific change only
3. Check no side effects
4. Confirm alignment with formal spec

## Change Tracking

Document each change:
```
File: machine.part.2.abstract.md
Change: Add missing states
Reason: Required by machine.part.1.md
Scope: State enum only
Related: No changes to transitions
```

## Risk Mitigation

1. Review boundaries:
   - Identify stable interfaces
   - Mark "DO NOT CHANGE" sections
   - Document dependencies

2. Change validation:
   - Test each change separately
   - Verify existing functionality
   - Check property preservation

3. Change tracking:
   - Log each modification
   - Document rationale
   - Track dependencies

## Success Criteria

1. Minimal changes:
   - Each change justifiable
   - No unnecessary modifications
   - Existing code preserved

2. Spec alignment:
   - All states present
   - Events match exactly
   - Actions implemented

3. Stability:
   - No regression
   - Properties preserved
   - Tests pass

## No-Change Areas

Explicitly marking areas that must NOT change:
1. Working implementations
2. Stable interfaces
3. Correct mappings
4. Verified properties
5. Extension points
6. Component boundaries

## Implementation Order

Strict sequence to minimize impact:
1. Fix state definitions
2. Align event names
3. Add missing actions
4. Update error codes
5. Add queue properties

Each step requires:
- Verification before proceeding
- No side effects confirmed
- Existing functionality preserved