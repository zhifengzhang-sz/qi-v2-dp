# Enhanced WebSocket State Machine Verification Guide

## 1. Layer Boundary Verification Process

### 1.1 Content Placement Verification
For each file in each layer, perform the following checks:

```markdown
1. IDENTIFY phase:
   □ List every exported function, type, and constant
   □ Mark each export with its primary purpose:
     - [GENERIC] Generic utility/helper
     - [DOMAIN] Domain-specific logic
     - [STATE] State machine specific
     - [TYPE] Type definition
     - [CONST] Constant definition

2. VALIDATE phase:
   □ Cross-reference each marked item against layer requirements
   □ For each item that violates layer boundaries:
     - Document current location
     - Identify correct layer
     - Note dependencies that would be affected
     - Mark for relocation

3. DEPENDENCY phase:
   □ Draw dependency graph for current implementation
   □ Compare with allowed dependencies
   □ Identify circular dependencies
   □ Mark dependency violations
```

### 1.2 Layer-Specific Checklists

#### Layer 1: Foundation
```markdown
constants.ts validation:
□ Contains ONLY constants and their type exports
□ NO implementation logic
□ NO helper functions
□ ALL constants use 'as const'
□ NO mutable exports

errors.ts validation:
□ Contains ONLY error type definitions
□ NO error handling logic
□ NO error creation utilities
□ ALL types are readonly
□ NO implementation details
```

#### Layer 2: Core Types
```markdown
types.ts validation:
□ Contains ONLY type definitions
□ NO type guards
□ NO validation logic
□ NO helper functions
□ ALL properties are readonly
□ NO implementation logic

states.ts validation:
□ Contains ONLY state-related types
□ NO state implementation logic
□ NO validation code
□ NO helper functions
□ ALL types are pure definitions
```

#### Layer 3: Utils & Transitions
```markdown
utils.ts LOCATION CHECK:
□ Each function categorized as one of:
  - Data transformation
  - Generic validation
  - Generic type guard
  - Generic helper
□ FORBIDDEN content check:
  ⚠ NO state machine specific logic
  ⚠ NO transition logic
  ⚠ NO state validation
  ⚠ NO event type specifics

transitions.ts LOCATION CHECK:
□ Each function categorized as one of:
  - State transition logic
  - State machine validation
  - Event validation
  - Transition mapping
□ FORBIDDEN content check:
  ⚠ NO generic utilities
  ⚠ NO non-state logic
```

### 1.3 Cross-Layer Dependency Verification

```markdown
For each pair of files (A, B):
□ If A imports B:
  - Verify layer ordering is correct
  - Check if import is necessary
  - Verify no circular dependencies
  - Document dependency reason
```

## 2. Implementation Verification Process

### 2.1 Function Implementation Checklist
```markdown
For each function:
□ Verify function location matches purpose
□ Check if function has mixed concerns
□ Validate pure function implementation
□ Check for layer-appropriate dependencies
```

### 2.2 Type Implementation Checklist
```markdown
For each type definition:
□ Verify type is in correct layer
□ Check for readonly properties
□ Validate type dependencies
□ Check for proper type exports
```

## 3. Common Anti-Patterns to Check

### 3.1 Location Anti-Patterns
```markdown
□ Generic utilities in state-specific files
□ State logic in utility files
□ Implementation details in type files
□ Mixed concerns in single file
```

### 3.2 Implementation Anti-Patterns
```markdown
□ Impure functions
□ Circular dependencies
□ Leaked abstractions
□ Mixed responsibility
```

## 4. Review Process

### 4.1 Initial Review
```markdown
□ Run layer boundary verification
□ Check implementation checklists
□ Validate dependencies
□ Document violations
```

### 4.2 Correction Review
```markdown
□ Verify each correction
□ Recheck affected dependencies
□ Validate layer boundaries
□ Update documentation
```

## 5. Example Violation Analysis

### 5.1 Incorrect Implementation
```typescript
// In utils.ts - VIOLATION
export function isWebSocketEvent(value: unknown): value is WebSocketEvent {
  // State machine specific logic in utils layer
}
```

### 5.2 Correct Implementation
```typescript
// In utils.ts
export function isValidEvent(value: unknown): event is { type: string; timestamp: number } {
  // Generic event validation
}

// In transitions.ts
export function validateWebSocketEvent(event: WebSocketEvent): ValidationResult {
  // State machine specific validation
}
```

## 6. Verification Tools

### 6.1 Required Tooling
```markdown
□ TypeScript compiler with strict mode
□ ESLint with custom rules for:
  - Layer boundary enforcement
  - Dependency validation
  - Pure function checking
□ Custom validation scripts
```

### 6.2 Automated Checks
```markdown
□ Layer dependency validation
□ Type export verification
□ Implementation location verification
□ Pure function validation
```