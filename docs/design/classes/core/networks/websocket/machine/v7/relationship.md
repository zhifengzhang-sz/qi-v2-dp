1. **machine.part.1.md** - Core Mathematical Specification
- Defines the formal mathematical model
- Complete system definition: $\mathcal{WC} = (S, E, \delta, s_0, C, \gamma, F)$
- Detailed state definitions, events, context, actions
- Includes formal proofs of properties
- Foundation for everything else

2. **machine.part.2.md** - Implementation Design & Guide
- Practical architecture using C4 diagrams
- Component structure and interactions
- Directory layout and organization
- Implementation guidelines
- Builds on mathematical spec but focuses on real-world implementation

3. **impl.map.md** - Mathematical to Implementation Mapping
- Bridges the gap between math spec and implementation
- Maps mathematical concepts to code structures:
  - States → xstate states
  - Events → xstate events
  - Context → TypeScript types
  - Properties → Runtime checks
- Ensures implementation maintains formal properties

4. **impl.plan.md** - Implementation Order
- Simple, focused implementation sequence
- Four main steps:
  1. Core State Machine
  2. WebSocket Manager
  3. Message Queue
  4. Rate Limiter
- Most concise document, but depends on all others

Relationships:
```
machine.part.1.md (Mathematical Foundation)
          ↓
impl.map.md (Mapping Layer)
          ↓
machine.part.2.md (Implementation Design)
          ↓
impl.plan.md (Implementation Order)
```

Key Insights:
1. Each document has a clear, distinct purpose
2. Documents form a clear hierarchy
3. Later documents depend on earlier ones
4. Implementation maintains mathematical properties
5. Design decisions are traceable to formal specs

