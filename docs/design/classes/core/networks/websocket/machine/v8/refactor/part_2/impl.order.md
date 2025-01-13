# Implementation Ordering for v9 (impl.order.md)

## Preamble

### Document Dependencies
This document depends on and is constrained by:

1. `refactor/part_1/spec.md`: Core mathematical changes
2. `refactor/part_1/map.md`: Specification mapping
3. `refactor/part_2/plan.md`: Implementation planning
4. `refactor/part_2/changes.md`: Implementation changes
5. `refactor/part_2/impl.verification.md`: Verification requirements
6. `refactor/part_2/migration.md`: Migration guidelines
7. `refactor/part_2/impact.md`: Impact analysis
8. `refactor/part_2/test.strategy.md`: Testing strategy

### Document Purpose
- Defines implementation sequence
- Establishes dependencies between changes
- Specifies verification points
- Provides rollback boundaries

### Document Scope
FOCUSES on:
- Change ordering
- Dependencies
- Verification points
- Rollback strategies

Does NOT cover:
- Implementation details
- Testing procedures
- Migration steps
- Performance optimization

## 1. Implementation Sequence

### 1.1 Phase 1: Core State Machine
1. State Space Extension
   - Add disconnecting state
   - Add reconnected state
   - Update state type system
   - Verify state completeness

2. Event Space Extension
   - Add disconnected event
   - Add reconnected event
   - Add stabilized event
   - Verify event completeness

3. Context Extension
   - Add disconnectReason property
   - Add reconnectCount property
   - Add lastStableConnection property
   - Verify context completeness

### 1.2 Phase 2: Protocol Integration
1. State Mapping
   - Map disconnecting to protocol
   - Map reconnected to protocol
   - Verify protocol states
   - Validate mappings

2. Event Mapping
   - Map disconnected to protocol
   - Map reconnected to protocol
   - Map stabilized to protocol
   - Verify protocol events

3. Error Mapping
   - Update error classifications
   - Map new error states
   - Verify error handling
   - Validate recovery paths

### 1.3 Phase 3: Core Properties
1. Safety Properties
   - Implement state invariants
   - Add transition guards
   - Verify safety properties
   - Validate constraints

2. Liveness Properties
   - Implement progress guarantees
   - Add termination proofs
   - Verify liveness properties
   - Validate progress

## 2. Dependency Graph

### 2.1 Core Dependencies
1. State Dependencies
   - State space → Event space
   - Event space → Context
   - Context → Properties
   - Properties → Verification

2. Protocol Dependencies
   - State mapping → Event mapping
   - Event mapping → Error mapping
   - Error mapping → Recovery
   - Recovery → Verification

### 2.2 Implementation Dependencies
1. Type System Dependencies
   - State types → Event types
   - Event types → Context types
   - Context types → Property types
   - Property types → Verification types

2. Feature Dependencies
   - Core states → Protocol states
   - Protocol states → Error states
   - Error states → Recovery states
   - Recovery states → Verification

## 3. Verification Points

### 3.1 Phase Verification
1. Core Verification
   - After state space changes
   - After event space changes
   - After context changes
   - Before protocol integration

2. Protocol Verification
   - After state mapping
   - After event mapping
   - After error mapping
   - Before property implementation

3. Property Verification
   - After safety properties
   - After liveness properties
   - After constraint implementation
   - Before completion

### 3.2 Integration Verification
1. State Integration
   - Verify state mappings
   - Validate transitions
   - Check invariants
   - Test boundaries

2. Protocol Integration
   - Verify protocol compliance
   - Validate event handling
   - Check error handling
   - Test recovery

## 4. Rollback Boundaries

### 4.1 Safe Points
1. State Space Rollback
   - After state verification
   - Before event changes
   - Before context changes
   - Before protocol integration

2. Protocol Rollback
   - After protocol verification
   - Before error mapping
   - Before recovery implementation
   - Before property changes

### 4.2 Recovery Points
1. State Recovery
   - Clean state rollback
   - Event space intact
   - Context preserved
   - Properties maintained

2. Protocol Recovery
   - Clean protocol rollback
   - Event mapping preserved
   - Error handling intact
   - Recovery paths maintained

## 5. Implementation Constraints

### 5.1 Order Constraints
1. Must Precede
   - State space before events
   - Events before context
   - Context before properties
   - Properties before completion

2. Must Follow
   - Protocol after state space
   - Error handling after protocol
   - Recovery after error handling
   - Verification after features

### 5.2 Timing Constraints
1. Phase Timing
   - Core changes: minimum 2 days
   - Protocol changes: minimum 2 days
   - Property changes: minimum 2 days
   - Verification: minimum 1 day

2. Integration Timing
   - State integration: minimum 1 day
   - Protocol integration: minimum 1 day
   - Error integration: minimum 1 day
   - Recovery integration: minimum 1 day

## 6. Critical Paths

### 6.1 Primary Path
1. Core Implementation
   - State space changes
   - Event space changes
   - Context changes
   - Property implementation

2. Integration Implementation
   - Protocol integration
   - Error handling
   - Recovery implementation
   - Verification completion

### 6.2 Alternate Paths
1. Parallel Development
   - Documentation updates
   - Test development
   - Tool updates
   - Support features

2. Independent Tasks
   - Monitoring updates
   - Logging changes
   - Metric collection
   - Analysis tools

## 7. Resource Requirements

### 7.1 Development Resources
1. Core Development
   - State machine expertise
   - Protocol knowledge
   - Type system experience
   - Verification skills

2. Integration Development
   - Protocol expertise
   - Error handling experience
   - Recovery implementation
   - Testing experience

### 7.2 Support Resources
1. Development Support
   - Documentation team
   - Testing team
   - Review team
   - Verification team

2. Operational Support
   - Deployment team
   - Monitoring team
   - Support team
   - Analysis team

## 8. Quality Gates

### 8.1 Phase Gates
1. Core Gates
   - State completeness
   - Event completeness
   - Context completeness
   - Property completeness

2. Integration Gates
   - Protocol compliance
   - Error handling
   - Recovery paths
   - Verification status

### 8.2 Release Gates
1. Primary Gates
   - All tests passing
   - All properties verified
   - All documentation complete
   - All reviews complete

2. Secondary Gates
   - Performance verified
   - Security verified
   - Stability verified
   - Support ready