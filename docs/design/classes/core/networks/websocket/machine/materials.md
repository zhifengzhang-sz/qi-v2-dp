Let's start with what we have and what we need:

Current Structure:
```
core/networks/
├── errors.ts           // Network error handling
├── http/              
│   └── client.ts      // HTTP client implementation
├── websocket/
│   ├── client.ts      // Current WebSocket client
│   ├── errors.ts      // WebSocket specific errors
│   ├── heartbeat.ts   // Heartbeat management
│   ├── state.ts       // State management
│   ├── subscription.ts // Subscription handling
│   └── types.ts       // Types and defaults
└── index.ts           // Module exports
```

Based on our specifications, here's what we need for the XState v5 implementation:

1. Proposed New Structure:
```
core/networks/
├── websocket/
│   ├── __tests__/
│   │   ├── machine.test.ts    // State machine tests
│   │   ├── client.test.ts     // Client integration tests
│   │   └── mocks.ts          // Test mocks and utilities
│   ├── machine/
│   │   ├── constants.ts      // Machine constants
│   │   ├── types.ts         // Event & Context types
│   │   ├── guards.ts        // Transition guards
│   │   ├── actions.ts       // State machine actions
│   │   └── machine.ts       // Core state machine
│   ├── client.ts            // New XState-based client
│   └── index.ts            // WebSocket module exports
```

2. Required Materials for Implementation:
   - Formal definition doc
   - Data specifications doc (events, context, types)
   - Transition specifications doc
   - Action specifications doc

3. Implementation Order:
   a. Core Types & Constants
   b. State Machine Definition
   c. Guards & Actions
   d. Client Integration
   e. Tests

