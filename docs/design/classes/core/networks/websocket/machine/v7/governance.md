# WebSocket Client: Governance and Stability Guidelines

## 1. AI Engineering Insights

### 1.1 Core Challenges
1. **The Optimality Trap**
   - AI tends toward mathematically optimal but brittle solutions
   - Each change can trigger cascade of "optimizations"
   - Optimal solutions often lack practical stability

2. **Documentation Balance**
   - Too little leads to drift
   - Too much leads to paralysis
   - Need clear boundaries and flexibility zones

3. **Engineering Process**
   - Avoid specification refinement loops
   - Resist constant optimization
   - Focus on stability over perfection

## 2. Stability Governance

### 2.1 Fixed Core Elements
These MUST NOT change after initial implementation:
- State names: disconnected, connecting, connected, reconnecting
- Basic transitions between states
- Core event types
- Primary interfaces

### 2.2 Extension Points
Changes and additions MUST happen through:
- Adding handlers (not modifying existing ones)
- Configuration options (not core logic)
- Middleware (not core components)

### 2.3 Implementation Order
1. Start with minimal, working core
2. Add features through extension points
3. Never modify working core components

## 3. Working with AI

### 3.1 Preventing Drift
Before accepting AI suggestions:
- Verify against machine.part.1.md spec
- Check alignment with existing implementation
- Reject "creative" alternatives to working code

### 3.2 Change Management
When requesting changes:
- Be explicit about what cannot change
- Reference specific parts of formal spec
- Require extensions over modifications

### 3.3 Documentation Updates
- Keep mathematical spec (machine.part.1.md) unchanged
- Update implementation docs to reflect extensions
- Maintain clear mapping in impl.map.md

## 4. Implementation Guidelines

### 4.1 Component Boundaries
Each component must have:
- Clear, minimal interface
- Explicit dependencies
- No direct access to other components

### 4.2 Extension Mechanism
All extensions must:
- Use predefined extension points
- Not require core changes
- Be optional at runtime

### 4.3 Configuration
All configurable elements must:
- Have sensible defaults
- Be optional
- Not affect core behavior when changed

## 5. Review Process

### 5.1 Change Checklist
Before accepting changes:
1. Does it respect core state machine?
2. Are changes additive only?
3. Are component boundaries maintained?
4. Can it be reverted without affecting core?
5. Does it follow formal spec?

### 5.2 Testing Requirements
1. Core Tests (Must Pass)
   - State transitions match formal spec
   - Invariants are maintained
   - Component boundaries respected

2. Extension Tests
   - Extensions can be added/removed
   - Core functions without extensions
   - No extension affects core behavior

### 5.3 Documentation Requirements
1. For Core Changes
   - Must reference formal spec
   - Must maintain existing mappings
   - Must preserve proven properties

2. For Extensions
   - Must document extension points used
   - Must specify default behavior
   - Must list configuration options

# 6. Interface Definitions

## 6.1 Handler Interfaces

### Core Event Handler
```typescript
type CoreEventHandler<T> = {
  // Core handler interface - DO NOT MODIFY
  handle: (event: T, context: Context) => void;
}

// Extension point for custom handlers
interface CustomEventHandler<T> extends CoreEventHandler<T> {
  // Add custom methods here
}
```

### Middleware Handler
```typescript
type MiddlewareHandler = {
  // Core middleware interface - DO NOT MODIFY
  before?: (context: Context) => Context;
  after?: (context: Context) => Context;
}
```

## 6.2 Configuration Boundaries

### Immutable Core Configuration
```typescript
interface CoreConfig {
  // These cannot be modified after initial setup
  readonly states: ['disconnected', 'connecting', 'connected', 'reconnecting'];
  readonly maxRetries: number;
  readonly initialRetryDelay: number;
}
```

### Extensible Configuration
```typescript
interface ExtensibleConfig {
  // Can be modified or extended
  customHandlers?: CustomEventHandler[];
  middleware?: MiddlewareHandler[];
  logging?: LogConfig;
}
```

## 6.3 Component Interfaces

### Core Components
Each core component has a minimal, stable interface:

1. State Machine
```typescript
interface StateMachine {
  // Core methods - DO NOT MODIFY
  transition(event: CoreEvent): void;
  getState(): State;
  
  // Extension point
  use(middleware: MiddlewareHandler): void;
}
```

2. WebSocket Manager
```typescript
interface WebSocketManager {
  // Core methods - DO NOT MODIFY
  connect(url: string): void;
  disconnect(): void;
  send(message: unknown): void;
  
  // Extension point
  onMessage(handler: MessageHandler): void;
}
```

3. Message Queue
```typescript
interface MessageQueue {
  // Core methods - DO NOT MODIFY
  enqueue(message: unknown): void;
  dequeue(): unknown | undefined;
  
  // Extension point
  onOverflow(handler: OverflowHandler): void;
}
```

## 6.4 Type Guards

```typescript
// Core state type guard - DO NOT MODIFY
function isValidState(state: unknown): state is State {
  return ['disconnected', 'connecting', 'connected', 'reconnecting'].includes(state as string);
}

// Core event type guard - DO NOT MODIFY
function isValidEvent(event: unknown): event is CoreEvent {
  return ['CONNECT', 'DISCONNECT', 'MESSAGE', 'ERROR'].includes((event as CoreEvent).type);
}

// Extension point for custom type guards
interface CustomTypeGuards {
  isValidCustomEvent?: (event: unknown) => boolean;
  isValidCustomState?: (state: unknown) => boolean;
}
```

## 6.5 Implementation Rules

1. **Core Stability**
   - Never modify core interfaces
   - Always extend through designated extension points
   - Keep core logic simple and focused

2. **Extension Pattern**
   - Add new handlers through registration
   - Use middleware for cross-cutting concerns
   - Keep extensions optional and removable

3. **Configuration Management**
   - Core config is immutable after initialization
   - Extensions must provide defaults
   - Validate all configuration changes

4. **Type Safety**
   - Use type guards for runtime validation
   - Maintain strict typing for core components
   - Keep type definitions simple and clear

## 6.6 Review Checklist Addition

Before accepting any code changes:

1. Core Interface Check
   - Are core interfaces unchanged?
   - Are changes made through extension points?
   - Can changes be reverted without affecting core?

2. Type Safety Check
   - Are type guards in place?
   - Is type safety maintained?
   - Are interfaces properly typed?

3. Configuration Check
   - Is core config protected?
   - Are defaults provided?
   - Is validation in place?

