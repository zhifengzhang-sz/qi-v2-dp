# WebSocket Implementation Design: Refined Concrete Document Preambles

## 1. Core Component Preamble
```markdown
## Preamble

This document defines the core state machine implementation requirements that govern 
code generation based on the high-level architecture in machine.part.2.abstract.md. 
It provides specifications for generating implementations that maintain formal properties 
while enabling practical extensibility.

### Document Dependencies
This document depends on and is constrained by the following specifications, in order:

1. `machine.part.1.md`: Core mathematical specification
   - Formal state machine model ($\mathcal{WC}$)
   - System constants and properties
   - Formal proofs and invariants
   - Safety properties

2. `machine.part.1.websocket.md`: Protocol specification
   - Protocol state mappings
   - WebSocket-specific behaviors
   - Protocol invariants
   - Event mappings

3. `impl.map.md`: Implementation mappings
   - Type hierarchy definitions
   - Property preservation rules
   - Implementation constraints
   - Tool integration patterns

4. `governance.md`: Design stability guidelines
   - Core immutability rules
   - Extension point requirements
   - Implementation sequencing
   - Property preservation

### Document Purpose
- Define requirements for state machine implementation
- Specify interface and type definitions for code generation
- Establish validation and verification criteria
- Provide extension mechanisms that preserve core properties
- Define testing and verification requirements

### Document Scope

This document SPECIFIES:
- State machine implementation requirements
- Event and transition system specifications
- Action and guard implementation patterns
- Context management requirements
- Core property validation rules
- Type system requirements
- Testing criteria

This document EXCLUDES:
- Direct implementation code
- Protocol-specific behaviors
- Message handling details
- Tool-specific configurations
- Deployment aspects
```

## 2. Protocol Component Preamble
```markdown
## Preamble

This document defines the WebSocket protocol implementation requirements that govern
code generation based on the core state machine design. It specifies how protocol 
behaviors must be implemented while maintaining formal properties and enabling 
standardized connection management.

### Document Dependencies
[Previous dependencies remain, adding:]

Core implementation requirements:
- `machine.part.2.concrete.core.md`: Core design specifications
  - State machine implementation patterns
  - Interface and type definitions
  - Validation framework requirements
  - Extension mechanisms

### Document Purpose
- Define requirements for protocol implementation
- Specify connection lifecycle management patterns
- Establish error handling requirements
- Define protocol state mapping implementations
- Specify validation and verification criteria

### Document Scope

This document SPECIFIES:
- Protocol state management requirements
- Connection handling patterns
- Event processing specifications
- Error classification system
- Protocol constraint validations
- Implementation verification criteria

This document EXCLUDES:
[Previous exclusions with added specificity]
```

[Similar refinements for Message, Monitoring, and Config preambles, each emphasizing their role in governing implementation rather than providing implementation details]

## Governance Aspects Added to Each Preamble

### Implementation Requirements Section
Each preamble now includes:
```markdown
### Implementation Requirements

1. Code Generation Governance
   - Generated code must maintain formal properties
   - Implementation must follow specified patterns
   - Extensions must use defined mechanisms
   - Changes must preserve core guarantees

2. Verification Requirements
   - Property validation criteria
   - Test coverage requirements
   - Performance constraints
   - Error handling verification

3. Documentation Requirements
   - Implementation mapping documentation
   - Property preservation evidence
   - Extension point documentation
   - Test coverage reporting
```

### Property Preservation Section
Each preamble now includes:
```markdown
### Property Preservation

1. Formal Properties
   - State machine invariants
   - Protocol guarantees
   - Timing constraints
   - Safety properties

2. Implementation Properties
   - Type safety requirements
   - Error handling patterns
   - Extension mechanisms
   - Performance requirements

3. Verification Properties
   - Test coverage criteria
   - Validation requirements
   - Monitoring needs
   - Documentation standards
```