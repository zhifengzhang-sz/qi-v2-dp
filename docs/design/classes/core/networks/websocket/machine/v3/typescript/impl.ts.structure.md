1. Core Module Files:
```
src/core/
├── machine/
│   ├── index.ts             # Main WebSocket Machine implementation
│   └── machine.types.ts     # Machine-specific types
├── states/
│   ├── index.ts             # States module implementation
│   └── state.types.ts       # State-specific types
├── events/
│   ├── index.ts             # Events module implementation
│   └── event.types.ts       # Event-specific types
├── context/
│   ├── index.ts             # Context module implementation
│   └── context.types.ts     # Context-specific types
└── actions/
    ├── index.ts             # Actions module implementation
    └── action.types.ts      # Action-specific types
```

2. Support Systems Files:
```
src/support/
├── types/
│   └── index.ts             # Type System implementation (𝒯)
├── guards/
│   ├── index.ts             # Guards System implementation (𝒢)
│   └── guard.types.ts       # Guard-specific types
├── errors/
│   ├── index.ts             # Error System implementation (ε)
│   └── error.types.ts       # Error-specific types
├── resources/
│   ├── index.ts             # Resource System implementation (ℛ)
│   └── resource.types.ts    # Resource-specific types
├── health/
│   ├── index.ts             # Health Monitor implementation (ℋ)
│   └── health.types.ts      # Health-specific types
├── rate/
│   ├── index.ts             # Rate Limiter implementation (ρ)
│   └── rate.types.ts        # Rate-specific types
└── metrics/
    ├── index.ts             # Metrics System implementation (ℳ)
    └── metric.types.ts      # Metric-specific types
```

Key Dependencies:
1. The Machine depends on all core modules (States, Events, Context, Actions)
2. Actions depend on Context and Events
3. Guards depend on Context
4. Health Monitor depends on Metrics
5. Resources depend on Errors
6. Metrics depend on Context
7. All modules depend on their respective types
8. The Type System (𝒯) is foundational and used by all modules
