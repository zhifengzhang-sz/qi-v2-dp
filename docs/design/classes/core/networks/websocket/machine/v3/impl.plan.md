You're absolutely right. Let's first analyze the documents carefully to create a proper implementation plan.

1. First, let's create a directory structure based on the architecture diagram from guide.impl.md:

```
src/
├── core/               # Core Machine components
│   ├── machine/       # Main state machine
│   ├── states/        # States module
│   ├── events/        # Events module
│   ├── context/       # Context module
│   └── actions/       # Actions module
│
├── support/           # Support Systems
│   ├── types/         # Type System (𝒯)
│   ├── guards/        # Guards System (𝒢)
│   ├── errors/        # Error System (ε)
│   ├── resources/     # Resource System (ℛ)
│   ├── health/        # Health Monitor (ℋ)
│   ├── rate/          # Rate Limiter (ρ)
│   └── metrics/       # Metrics System (ℳ)
│
├── integration/       # Integration Patterns
│   ├── event-flow/    # Event Flow implementations
│   ├── error-flow/    # Error Handling flows
│   └── resource-flow/ # Resource Management flows
│
└── testing/          # Testing Strategy Implementation
    ├── unit/         # Unit tests
    ├── integration/  # Integration tests
    └── performance/  # Performance tests
```

2. Implementation Steps (following the formal spec and implementation guide):

A. Core Implementation Phase:
```
1. Type System (𝒯) Implementation
   - Base types (B)
   - Composite types (C)
   - Validation functions (V)
   Dependencies: None

2. Core Modules Implementation
   a. States Module
      - State definitions (S)
      - Valid transitions
      - State invariants
      Dependencies: Type System

   b. Events Module
      - Event definitions (E)
      - Event categories
      - Event validation
      Dependencies: Type System

   c. Context Module
      - Primary properties (P)
      - Metric values (V)
      - Timing properties (T)
      Dependencies: Type System

   d. Actions Module
      - Action definitions (γ)
      - Context transformations
      Dependencies: Context Module, Events Module

3. Support Systems Implementation
   a. Guards System (𝒢)
      Dependencies: Type System, Context Module

   b. Error System (ε)
      Dependencies: Type System

   c. Resource Management (ℛ)
      Dependencies: Error System

   d. Rate Limiting (ρ)
      Dependencies: Type System

   e. Health Monitoring (ℋ)
      Dependencies: Metrics Collection

   f. Metrics Collection (ℳ)
      Dependencies: Context Module

4. Main State Machine Implementation
   Dependencies: All Core Modules, Support Systems
```

B. Integration Phase:
```
1. Event Flow Integration
   - Client-Machine-Support flow
   Dependencies: Core Implementation

2. Error Handling Integration
   - Action-Error-Recovery flow
   Dependencies: Error System, Actions Module

3. Resource Management Integration
   - Resource lifecycle management
   Dependencies: Resource System
```

C. Testing Phase:
```
1. Unit Testing
   - State transitions
   - Action execution
   - Guard conditions

2. Integration Testing
   - Connection lifecycle
   - Error recovery
   - Resource management

3. Performance Testing
   - Message throughput
   - Memory usage
   - Error overhead
```

D. Implementation Order (based on dependencies):
```
1. src/support/types/        (No dependencies)
2. src/support/errors/       (Depends on types)
3. src/core/states/         (Depends on types)
4. src/core/events/         (Depends on types)
5. src/core/context/        (Depends on types)
6. src/support/guards/      (Depends on context)
7. src/core/actions/        (Depends on context, events)
8. src/support/resources/   (Depends on errors)
9. src/support/rate/        (Depends on types)
10. src/support/metrics/    (Depends on context)
11. src/support/health/     (Depends on metrics)
12. src/core/machine/       (Depends on all core modules)
13. src/integration/        (Depends on everything)
14. src/testing/           (Depends on everything)
```
