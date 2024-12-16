1. **websocket-states.ts**:
   - Defines WebSocket ready states (0-3)
   - Provides utility function `isWebSocketOpen()`

2. **types.ts**:
   - Defines comprehensive TypeScript interfaces for:
     - ConnectionState
     - ConnectionOptions 
     - WebSocketContext
     - WebSocketEvent

3. **states.ts**:
   - Implements state machine configuration
   - Defines transitions and actions for each state

4. **constants.ts**:
   - Contains configuration constants
   - Defines error messages and connection states

5. **actions.ts**:
   - State machine action creators
   - Context mutations handlers
   - Functionality groups:
     - Connection management (establish, cleanup)
     - Message handling (queue, process)
     - Health checks (ping/pong)
     - Error handling
     - Metrics updates
     - State resets
   - Action implementations:
     - `establishConnection`
     - `enqueueMessage`
     - `sendPing`
     - `recordError`
     - `updateMetrics`
     - `resetState`

6. **guards.ts**:
   - Transition guard conditions:
     - `canInitiateConnection`
     - `canReconnect`
     - `canSendMessage`
     - `isWithinRetryLimit`
     - `isRateLimitCleared`
     - Rate limiting checks
     - Queue status checks

7. **machine.ts**:
   - Main XState machine configuration
   - Initial context setup
   - Integration of:
     - States from states.ts
     - Actions from actions.ts
     - Guards from guards.ts
   - Type-safe event handlers
   - Service creation

8. **__tests__/machine.test.ts**:
   - Test suites for:
     - Connection lifecycle
     - Message handling
     - Error recovery
     - Rate limiting
     - State transitions
     - Guard conditions
     - Context mutations
     - Health check mechanics
