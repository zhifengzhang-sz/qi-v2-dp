## 11. Appendices

### Appendix A: Formal Proofs

#### Proof of Single Active State

**Property:** The system is always in exactly one state at any given time.

**Proof:**

Based on the formal specification of $\mathcal{WC}$ defined by the State Transition System (STS) model, the system maintains exactly one active state at all times. 

1. **Initial State:** The system starts in the initial state $s_0 = \text{Disconnected}$.
2. **State Transitions:** For every event $e \in E$ received in a state $s \in S$, the transition function $\delta(s, e)$ maps to exactly one new state $s' \in S$ along with a set of actions $A' \subseteq A$.
3. **Determinism:** The transition rules are designed to be deterministic, ensuring that each state-event pair leads to a single, well-defined outcome.
4. **Exclusivity:** No two transitions can be triggered simultaneously for the same state-event pair.

Therefore, at any time $t$, the system $\mathcal{WC}$ resides in exactly one state $s \in S$, ensuring the single active state property holds.

#### Proof of Deterministic Transitions

**Property:** For each state and event pair, there is exactly one defined transition.

**Proof:**

The transition function $\delta: S \times E \rightarrow S \times 2^A$ is constructed such that:

1. **Unique Mapping:** Each combination of a current state $s \in S$ and an event $e \in E$ maps to a unique next state $s' \in S$ and a specific set of actions $A' \subseteq A$.
2. **Comprehensive Definition:** All possible state-event pairs are accounted for in the transition table, leaving no undefined transitions.
3. **Conflict-Free:** There are no overlapping or conflicting transitions for any state-event pair.

Given these conditions, the transition function ensures that the system behaves predictably and deterministically, with no ambiguity in state progression.

#### Proof of No Undefined States

**Property:** All transitions result in states within the defined set $S$.

**Proof:**

The set of defined states $S = \{\text{Disconnected}, \text{Connecting}, \text{Connected}, \text{Error}\}$ encompasses all possible states of the system. The transition rules are explicitly defined to map every state-event pair to one of these states. 

1. **Transition Targets:** Each transition explicitly references only the states within $S$ as possible targets.
2. **Exhaustiveness:** The transition table includes all relevant events for each state, ensuring no event leads to an undefined or external state.
3. **Validation Mechanism:** During implementation, state transitions are validated against the defined set $S$ to prevent inadvertent transitions to undefined states.

Thus, the system guarantees that it cannot enter an undefined state, maintaining consistency and integrity throughout its operation.

### Appendix B: Extended Performance Analysis

#### 1. Performance Metrics

To ensure the WebSocket Client operates efficiently and meets performance expectations, the following metrics are considered:

- **Latency:** The time elapsed between sending a message and receiving an acknowledgment or response.
- **Throughput:** The number of messages processed per unit of time.
- **Resource Utilization:** CPU and memory usage during peak and average loads.
- **Scalability:** Ability to handle an increasing number of concurrent connections and message volumes without degradation in performance.

#### 2. Performance Optimization Strategies

To enhance the performance of $\mathcal{WC}$, the following strategies are proposed:

- **Efficient State Management:** Utilize **xstate v5**'s hierarchical and parallel states to manage complex state transitions with minimal overhead.
- **Asynchronous Processing:** Implement non-blocking I/O operations with the **ws** library to handle multiple WebSocket connections concurrently.
- **Batch Processing:** Aggregate multiple messages and process them in batches to reduce the overhead of individual message handling.
- **Rate Limiting Optimization:** Fine-tune rate limiting parameters to balance between preventing overload and maintaining high throughput.
- **Resource Pooling:** Reuse resources like WebSocket connections and rate limiter instances to minimize the cost of resource initialization and teardown.
- **Monitoring and Logging:** Integrate comprehensive monitoring to identify and address performance bottlenecks in real-time.

#### 3. Benchmarking and Testing

Regular benchmarking and stress testing are essential to validate performance improvements and ensure the system meets required standards:

- **Load Testing:** Simulate high volumes of concurrent connections and message traffic to assess system behavior under stress.
- **Latency Measurements:** Continuously monitor message latency to ensure real-time communication is maintained.
- **Resource Profiling:** Analyze CPU and memory usage during different operational phases to detect inefficiencies.
- **Scalability Testing:** Evaluate system performance as the number of connections and message rates scale up, ensuring consistent behavior.

By implementing these performance analysis and optimization strategies, $\mathcal{WC}$ can achieve robust and efficient operation, capable of handling demanding real-time communication scenarios.

### Appendix C: Implementation Guidelines

#### 1. Component Interfaces and Definitions

To maintain consistency with the formal specification, the following interfaces and constants are defined:

- **Core State Machine Interfaces (`stateMachine/interfaces.js`):**
  
  ```javascript
  // Conceptual Definition
  export interface State {
    name: string;
    on: EventHandler;
  }

  export interface Event {
    type: string;
    payload?: any;
  }

  export interface Action {
    name: string;
    execute: (context: Context, event: Event) => void;
  }

  export interface EventHandler {
    [eventType: string]: Transition;
  }

  export interface Transition {
    target: string;
    actions: string[];
  }