# WebSocket DSL Project Constraints and Guidelines

## 1. Core Project Boundaries

### 1.1 Foundational Principles 

This project:
- Uses WebSocket protocol and XState v5 as foundational tools
- Functions as a user/consumer of these tools, not an implementer
- Focuses on DSL development for effective tool usage
- Prioritizes abstraction and integration over implementation

### 1.2 Explicit Boundaries

Explicitly OUT OF SCOPE:
- Reimplementing WebSocket protocol features
- Creating new state machine mechanisms
- Bypassing or replacing XState functionality 
- Modifying protocol behaviors
- Building custom protocol layers
- Creating state management utilities

### 1.3 Core Requirements

Development approach must:
- Always prefer standard patterns from WebSocket/XState
- Use XState's built-in capabilities before creating abstractions
- Follow WebSocket protocol behavior, don't modify it
- Create abstractions only when needed for use case
- Maintain protocol compliance
- Follow tool documentation and patterns

## 2. Technology Usage Guidelines

### 2.1 WebSocket Protocol Usage

Must:
- Use standard WebSocket API
- Follow protocol specifications
- Use standard event system
- Maintain protocol compliance
- Use standard connection lifecycle
- Follow established error handling patterns

Must Not:
- Extend protocol features
- Create custom protocol layers
- Add non-standard behaviors
- Modify event handling patterns
- Implement custom connection management
- Build protocol utilities

### 2.2 XState Usage

Must:
- Use standard machine definitions
- Follow actor model patterns
- Use built-in typestates
- Leverage existing services
- Use standard action creators
- Follow service invocation patterns

Must Not:
- Create custom action systems
- Modify state machine behavior
- Build state management utilities
- Implement custom service types
- Create new machine patterns
- Extend core functionality

## 3. Design Process Constraints

### 3.1 Integration Focus

Must:
- Connect to WebSocket servers using standard protocol
- Define state machines using XState patterns
- Handle WebSocket events through XState
- Manage connections using protocol features
- Use standard retry/reconnect patterns
- Follow tool integration guidelines

### 3.2 Pattern Usage

Required:
- Use XState's built-in action creators
- Use WebSocket's standard event handlers
- Follow XState service patterns
- Use standard retry/reconnect patterns
- Implement standard error handling
- Follow state management patterns

### 3.3 Common Pitfalls

Avoid:
- Adding custom WebSocket protocol layers
- Building state management utilities
- Creating custom action systems
- Reimplementing connection management
- Extending protocol capabilities
- Creating unnecessary abstractions

## 4. Implementation Constraints

### 4.1 Protocol Implementation

Must Use:
- Standard WebSocket connection handling
- Protocol-defined event types
- Standard message formats
- Built-in error codes
- Default timeout mechanisms
- Specified close procedures

Must Not:
- Create custom protocols
- Extend message formats
- Add new event types
- Define custom error codes
- Implement custom timeouts
- Modify close sequences

### 4.2 State Machine Implementation

Must Use:
- XState machine definitions
- Standard state configurations
- Built-in action types
- Provided guard conditions
- Default service patterns
- Core machine features

Must Not:
- Create custom machine types
- Extend state behaviors
- Build action utilities
- Implement guard systems
- Modify service patterns
- Add core features

## 5. Design Quality Requirements

### 5.1 Integration Quality

Must Ensure:
- Clean tool integration
- Standard pattern usage
- Proper error handling
- Resource management
- Performance optimization
- Documentation completeness

### 5.2 Validation Requirements

Must Validate:
- Correct use of WebSocket features
- Proper XState pattern application
- Standard protocol compliance
- Tool integration correctness
- Resource usage patterns
- Error handling approaches

### 5.3 Anti-patterns to Avoid

Do Not:
- Create unnecessary abstractions
- Build custom utilities
- Extend tool capabilities
- Implement core features
- Add complexity layers
- Modify standard patterns

## 6. Development Process Guidelines

### 6.1 Design Approach

Focus on:
- Using existing capabilities
- Following standard patterns
- Maintaining simplicity
- Ensuring maintainability
- Leveraging tool features
- Following documentation

### 6.2 Implementation Strategy

Prioritize:
- Standard implementations
- Tool documentation compliance
- Pattern consistency
- Code maintainability
- Performance optimization
- Resource efficiency

### 6.3 Quality Assurance

Ensure:
- Protocol compliance
- Pattern correctness
- Resource efficiency
- Error handling
- Performance targets
- Documentation quality

## 7. Resource Management

### 7.1 Connection Resources

Manage:
- Connection lifecycles
- Event handlers
- Message queues
- Error scenarios
- Timeout handling
- Cleanup procedures

### 7.2 State Management

Handle:
- State transitions
- Action execution
- Guard conditions
- Service invocations
- Context updates
- Event processing

## 8. Documentation Requirements

### 8.1 Implementation Documentation

Document:
- Tool usage patterns
- Integration approaches
- Error handling
- Resource management
- Performance considerations
- Maintenance procedures

### 8.2 Validation Documentation

Record:
- Compliance checks
- Pattern validation
- Resource validation
- Performance validation
- Integration testing
- Error handling verification