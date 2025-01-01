# WebSocket Client Implementation Mapping

This document outlines the mapping between the formal specifications defined in **machine.md** and their corresponding implementation in the codebase. Each section from the specification is mapped to specific modules, files, and components within the implementation to ensure consistency and traceability.

## 1. Core Definitions (machine.md#1-core-definitions)

### 1.1 WebSocket Client Implementation (\(\mathcal{WC}\))

- **Specification Reference:** Section 1.1
- **Code File:** `src/client/WebSocketClient.ts`
- **Description:** Implements the main WebSocket client, managing connection states, integrating with the Message Queue and Rate Limiter, and handling communication with the WebSocket server.

### 1.2 System Constants

- **Specification Reference:** Section 1.1
- **Code File:** `src/constants/SystemConstants.ts`
- **Description:** Defines all system-wide constants such as `MAX_RETRIES`, `MAX_MESSAGES`, `WINDOW_SIZE`, `MAX_WINDOW_LIFETIME`, `MAX_QUEUE_SIZE`, `CONNECT_TIMEOUT`, `INITIAL_RETRY_DELAY`, `MAX_RETRY_DELAY`, and `RETRY_MULTIPLIER`.

## 2. Rate Limiting System (machine.md#1.2-rate-limiting-system)

- **Specification Reference:** Section 1.2
- **Code Files:**
  - `src/rateLimiter/RateLimiter.ts`
  - `src/rateLimiter/Window.ts`
- **Description:** Manages rate limiting using a window-based approach. The `RateLimiter` handles the creation, expiration, and incrementation of windows, enforcing constraints on message throughput.

## 3. Message Queue (machine.md#1.3-message-queue)

- **Specification Reference:** Section 1.3
- **Code File:** `src/messageQueue/MessageQueue.ts`
- **Description:** Manages the enqueueing and dequeueing of messages, ensuring that the queue does not exceed `MAX_QUEUE_SIZE` and maintains proper message ordering based on timestamps.

## 4. Message Operations (machine.md#1.4-message-operations)

### 4.1 Message Structure

- **Specification Reference:** Section 1.4
- **Code File:** `src/models/Message.ts`
- **Description:** Defines the `Message` data structure with attributes for data payload and timestamps (`t_s`, `t_x`, `t_r`, `t_d`).

### 4.2 Temporal Operators

- **Specification Reference:** Section 1.4
- **Code File:** `src/helpers/TemporalOperators.ts`
- **Description:** Implements functions to handle timestamp operations, including `send`, `transmit`, `receive`, and `deliver`.

### 4.3 Message Sequence Properties

- **Specification Reference:** Section 1.4
- **Code File:** Implemented within `Message.ts` and enforced in `MessageQueue.ts` and `MessageHandler.ts`
- **Description:** Ensures the logical order of message operations and maintains ordering based on send times.

### 4.4 Operation Definitions and Invariants

- **Specification Reference:** Section 1.4
- **Code Files:**
  - `src/message/operations/send.ts`
  - `src/message/operations/transmit.ts`
  - `src/message/operations/receive.ts`
  - `src/message/operations/deliver.ts`
- **Description:** Defines each message operation with input/output types, state transitions, and invariants to ensure correct timestamp updates.

## 5. State Machine (machine.md#5-transition-function)

- **Specification Reference:** Section 5
- **Code Files:**
  - `src/stateMachine/StateMachine.ts`
  - `src/stateMachine/States.ts`
  - `src/stateMachine/Events.ts`
- **Description:** Implements the state machine managing connection states (`disconnected`, `connecting`, `connected`, `reconnecting`) and transitions based on events (`CONNECT`, `CONNECTED`, `DISCONNECT`, `ERROR`, `RECONNECT`, `SEND`, `RECEIVE`).

## 6. Context Structure (machine.md#3-context-structure)

- **Specification Reference:** Section 3
- **Code File:** `src/context/Context.ts`
- **Description:** Defines the context structure `C` encompassing the URL, WebSocket instance, error state, retry count, rate limiting system, and message queue.

## 7. Transition Function (machine.md#5-transition-function)

- **Specification Reference:** Section 5
- **Code File:** `src/stateMachine/StateMachine.ts`
- **Description:** Implements the transition function `δ` handling state transitions based on current state and incoming events, updating the context accordingly.

## 8. Helper Functions (machine.md#1.7-helper-functions)

- **Specification Reference:** Section 1.7
- **Code Files:**
  - `src/helpers/Set.ts`
  - `src/helpers/Now.ts`
- **Description:** Implements utility functions:
  - `set`: Updates attributes of a message.
  - `now`: Retrieves the current timestamp.

## 9. Initial States (machine.md#Initial States)

- **Specification Reference:** Sections 3 and 1.7
- **Code File:** `src/context/InitialStates.ts`
- **Description:** Defines the initial states `R_0` for the rate limiting system and `Q_0` for the message queue, ensuring all components are properly initialized at system start.

## 10. Error Handling (machine.md#8-error-handling)

- **Specification Reference:** Section 8
- **Code Files:**
  - `src/errors/ErrorTypes.ts`
  - `src/errorHandler/ErrorHandler.ts`
- **Description:** Implements error types and propagation rules, integrating error management within the state machine and other system components.

## 11. WebSocket Type Definitions (machine.md#WebSocket Type Definitions)

- **Specification Reference:** Section related to WebSocket types
- **Code File:** `src/types/WebSocketTypes.ts`
- **Description:** Defines types and interfaces related to WebSocket operations and states, ensuring type safety and consistency across the codebase.

## 12. System Safety Properties (machine.md#System Safety Properties)

- **Specification Reference:** Section on safety properties
- **Code File:** `src/safety/SafetyProperties.ts`
- **Description:** Implements checks and validations to ensure system safety properties such as "No Message Loss," "Rate Limit Compliance," "Message Ordering," and "State Consistency."

## 13. Ordering Rules (impl.map.md#ordering-rules)

- **Specification Reference:** Section on Message Ordering
- **Code Files:**
  - `src/messageQueue/MessageQueue.ts`
  - `src/messageHandler/MessageHandler.ts`
- **Description:** Enforces message ordering rules within the Queue and MessageHandler components to maintain temporal consistency.

## 14. Extension Points (impl.design.md#extension-points)

- **Specification Reference:** Sections on Extension Points
- **Code Files:**
  - `src/extensions/MessageValidator.ts`
  - `src/extensions/MessageTransformer.ts`
  - `src/extensions/MetricsCollector.ts`
  - `src/extensions/HealthStrategy.ts`
- **Description:** Provides hooks and interfaces for extending functionality, allowing for message validation, transformation, metrics collection, and health monitoring.

## 15. Testing Modules (impl.map.md#testing-strategy)

- **Specification Reference:** Section on Testing Strategy
- **Code Files:**
  - `tests/unit/`: Contains unit tests for individual components.
  - `tests/integration/`: Contains integration tests ensuring components interact correctly.
- **Description:** Maps testing strategies to corresponding test suites, ensuring comprehensive coverage of both unit and integration aspects.

## 16. Performance Metrics (impl.map.md#performance-metrics)

- **Specification Reference:** Section on Performance Metrics
- **Code File:** `src/performance/PerformanceMetrics.ts`
- **Description:** Implements monitoring and reporting of performance metrics such as message throughput, latency, and resource utilization to ensure the system meets efficiency standards.

## 17. Scalability and Extensibility Considerations (impl.map.md#scalability-and-extensibility)

- **Specification Reference:** Section on Scalability and Extensibility
- **Code File:** `src/scalability/ScalabilityConsiderations.ts`
- **Description:** Outlines strategies for scaling the WebSocket client and extending its functionality without significant restructuring, including modular design and interface-driven development.

---
