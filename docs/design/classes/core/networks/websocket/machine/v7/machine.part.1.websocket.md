# WebSocket Protocol State Machine

## 1. Mapping to Core Machine

This specification extends the core state machine defined in `machine.part.1.md` for WebSocket protocol implementation.

### 1.1 State Mapping

The WebSocket states map to core states $S$ as follows:

$$
\begin{aligned}
disconnected &\mapsto s_1 \\
connecting &\mapsto s_2 \\
connected &\mapsto s_3 \\
reconnecting &\mapsto s_4 \\
\end{aligned}
$$

### 1.2 WebSocket-Specific Constants

Additional protocol constants:
$$
\begin{aligned}
WebSocketConstants = \{&\\
&NORMAL\_CLOSURE: 1000,\\
&GOING\_AWAY: 1001,\\
&PROTOCOL\_ERROR: 1002,\\
&UNSUPPORTED\_DATA: 1003,\\
&POLICY\_VIOLATION: 1008,\\
&MESSAGE\_TOO\_BIG: 1009,\\
&INTERNAL\_ERROR: 1011\\
\}
\end{aligned}
$$

### 1.3 Protocol Event Types

The event space $E$ includes WebSocket-specific events:
$$
E_{ws} = \{open, close, error, message\} \subseteq E
$$

### 1.4 Protocol Transition Mappings

For WebSocket protocol events, the transition function $\delta$ maps as follows:

$$
\begin{aligned}
\delta(connecting, open) &\rightarrow (connected, \{\gamma_{store}, \gamma_{reset}\}) \\
\delta(connecting, error) &\rightarrow (reconnecting, \{\gamma_{error}, \gamma_{retry}\}) \\
\delta(connected, close) &\rightarrow (disconnected, \{\gamma_{cleanup}\}) \\
\delta(connected, error) &\rightarrow (reconnecting, \{\gamma_{error}, \gamma_{retry}\}) \\
\delta(reconnecting, retry) &\rightarrow (connecting, \{\gamma_{connect}\})
\end{aligned}
$$

### 1.5 Protocol-Specific Context

The WebSocket context $C_{ws}$ extends the base context with:

$$
C_{ws} = C \cup \{
\begin{aligned}
&url: String,\\
&socket: WebSocket \cup \{null\},\\
&retries: \mathbb{N},\\
&lastError: Error \cup \{null\},\\
&closeCode: WebSocketConstants \cup \{null\}
\end{aligned}
\}
$$

### 1.6 Protocol Invariants

The following invariants must hold for all WebSocket states:

1. **Connection Uniqueness**:
   $$\forall t, |\{s \in socket | s \neq null\}| \leq 1$$

2. **State-Socket Consistency**:
   $$
   \begin{aligned}
   s = disconnected &\implies socket = null \\
   s = connected &\implies socket \neq null \\
   s = connecting &\implies socket \neq null \\
   s = reconnecting &\implies socket = null
   \end{aligned}
   $$

3. **Retry Bounds**:
   $$
   \begin{aligned}
   &s = reconnecting \implies retries \leq MAX\_RETRIES \\
   &retryDelay = min(INITIAL\_RETRY\_DELAY \times RETRY\_MULTIPLIER^{retries}, MAX\_RETRY\_DELAY)
   \end{aligned}
   $$

### 1.7 Protocol Safety Properties

1. **Connection Safety**:
   $$
   \begin{aligned}
   &\forall s = connecting, e = open: \\
   &\quad \delta(s,e).S = connected \\
   &\forall s = connecting, e = error: \\
   &\quad \delta(s,e).S = reconnecting \text{ if } retries < MAX\_RETRIES \\
   &\quad \delta(s,e).S = disconnected \text{ otherwise}
   \end{aligned}
   $$

2. **Close Code Validity**:
   $$closeCode \in WebSocketConstants \cup \{null\}$$

3. **Error State Consistency**:
   $$lastError \neq null \iff s \in \{reconnecting, disconnected\}$$

### 1.8 Protocol Liveness Properties

1. **Connection Progress**:
   $$
   \forall s = connecting: \Diamond(connected \lor disconnected)
   $$

2. **Retry Progress**:
   $$
   \forall s = reconnecting: \Diamond(connected \lor disconnected)
   $$

3. **Eventual Consistency**:
   $$
   \forall e = error: \Diamond(connected \lor (disconnected \land retries = MAX\_RETRIES))
   $$

   ### 1.9 Protocol Actions ($\gamma$)

Actions are defined as context transformers:
$$\gamma: C_{ws} \times E \rightarrow C_{ws}$$

Core action set:
$$
\begin{aligned}
\Gamma_{ws} = \{
&\gamma_{store}, \gamma_{connect}, \gamma_{reset}, \\
&\gamma_{error}, \gamma_{retry}, \gamma_{cleanup}, \\
&\gamma_{enqueue}, \gamma_{dequeue}, \gamma_{send}
\}
\end{aligned}
$$

Each action is formally defined:

1. Store URL and Initialize:
   $$
   \gamma_{store}(c, e_{CONNECT}) = c' \text{ where } \begin{cases}
   c'.url = e_{CONNECT}.url \\
   c'.socket = \text{new WebSocket}(url) \\
   c'.retries = 0
   \end{cases}
   $$

2. Connection Reset:
   $$
   \gamma_{reset}(c) = c' \text{ where } \begin{cases}
   c'.retries = 0 \\
   c'.lastError = null \\
   c'.closeCode = null
   \end{cases}
   $$

3. Error Handling:
   $$
   \gamma_{error}(c, e_{ERROR}) = c' \text{ where } \begin{cases}
   c'.lastError = e_{ERROR}.error \\
   c'.socket = null \\
   c'.closeCode = e_{ERROR}.code
   \end{cases}
   $$

4. Retry Management:
   $$
   \gamma_{retry}(c) = c' \text{ where } \begin{cases}
   c'.retries = c.retries + 1 \\
   c'.socket = null
   \end{cases}
   $$

### 1.10 Message Handling Properties

1. **Message Queue Definition**:
   $$
   Q = \{m_i | i \in \mathbb{N}\} \text{ where } m_i = (data_i, timestamp_i)
   $$

2. **Queue Operations**:
   $$
   \begin{aligned}
   \gamma_{enqueue}(c, m) &= c' \text{ where } c'.queue = c.queue \cup \{m\} \\
   \gamma_{dequeue}(c) &= c' \text{ where } c'.queue = c.queue \setminus \{m_0\} \\
   \gamma_{send}(c, m) &= \begin{cases}
   \gamma_{enqueue}(c, m) & \text{if } s \neq connected \\
   transmit(m) & \text{if } s = connected
   \end{cases}
   \end{aligned}
   $$

3. **Queue Invariants**:
   $$
   \begin{aligned}
   &\forall m_i, m_j \in Q: i < j \implies timestamp_i < timestamp_j \\
   &\forall s \neq connected: transmit(m) \implies m \in Q
   \end{aligned}
   $$

### 1.11 Error Handling Properties

1. **Error Classification**:
   $$
   E_{error} = \begin{cases}
   Recoverable & \text{if } e.code \in \{1001, 1006\} \\
   Fatal & \text{if } e.code \in \{1002, 1003, 1008\} \\
   Transient & \text{otherwise}
   \end{cases}
   $$

2. **Error Recovery Rules**:
   $$
   \begin{aligned}
   &\forall e \in E_{error}: \\
   &\quad Recoverable \implies \gamma_{retry} \\
   &\quad Fatal \implies \gamma_{cleanup} \\
   &\quad Transient \land retries < MAX\_RETRIES \implies \gamma_{retry}
   \end{aligned}
   $$

3. **Error State Transitions**:
   $$
   \begin{aligned}
   &\forall e \in E_{error}: \\
   &\quad s' = \begin{cases}
   reconnecting & \text{if } Recoverable \lor (Transient \land retries < MAX\_RETRIES) \\
   disconnected & \text{otherwise}
   \end{cases}
   \end{aligned}
   $$

## 2. Formal Proofs

### 2.1 Connection Safety Properties

**Theorem 1** (Connection State Safety): At any time, there exists at most one active connection.

**Proof** by contradiction:
1. Assume ∃t where there are two active connections c₁, c₂
2. By state invariants, socket ≠ null ⟹ s ∈ {connecting, connected}
3. By state transitions, only γ_{store} creates new connections
4. γ_{store} requires s = disconnected
5. By state machine properties, system can only be in one state
6. Therefore, cannot have two simultaneous active connections
7. Contradiction ∎

### 2.2 Message Delivery Properties

**Theorem 2** (Message Preservation): No messages are lost during state transitions.

**Proof** by cases:
1. Case s = connected:
   - Messages transmitted directly via transmit(m)
   - By socket protocol, delivery confirmed or error raised
2. Case s ≠ connected:
   - Messages enqueued via γ_{enqueue}
   - Queue preserves FIFO ordering
   - Messages dequeued only after successful transmission
3. Therefore, all messages either:
   - Successfully transmitted, or
   - Retained in queue
   ∎

### 2.3 Retry Logic Properties

**Theorem 3** (Retry Termination): The retry process eventually terminates.

**Proof** by well-founded induction:
1. Define measure function μ(s) = MAX_RETRIES - retries
2. For each retry:
   - μ decreases by 1 (γ_{retry} increments retries)
   - μ < 0 ⟹ system enters disconnected state
3. μ is well-founded on ℕ
4. Therefore, retry sequence must terminate
   ∎

## 3. Timing Properties and Constraints

### 3.1 Real-Time Constraints

1. **Connection Timeout**:
   $$
   \forall s = connecting: duration(s) \leq CONNECT\_TIMEOUT
   $$

2. **Retry Delay Calculation**:
   $$
   delay_n = min(INITIAL\_RETRY\_DELAY \times RETRY\_MULTIPLIER^n, MAX\_RETRY\_DELAY)
   $$

3. **State Duration Bounds**:
   $$
   \begin{aligned}
   duration(connecting) &\leq CONNECT\_TIMEOUT \\
   duration(reconnecting) &\leq delay_n \\
   duration(disconnected) &\leq \infty \\
   duration(connected) &\leq \infty
   \end{aligned}
   $$

### 3.2 Temporal Ordering Properties

1. **Event Processing Order**:
   $$
   \forall e_i, e_j: timestamp(e_i) < timestamp(e_j) \implies process(e_i) \prec process(e_j)
   $$

2. **Message Queue Timing**:
   $$
   \forall m_i, m_j \in Q: i < j \implies enqueue(m_i) \prec enqueue(m_j)
   $$

3. **State Transition Timing**:
   $$
   \begin{aligned}
   &connecting \xrightarrow{t \leq CONNECT\_TIMEOUT} (connected \lor reconnecting) \\
   &reconnecting \xrightarrow{t \leq delay_n} connecting
   \end{aligned}
   $$

### 3.3 Progress Properties

1. **Connection Progress**:
   $$
   \forall s = connecting: \Diamond_{\leq CONNECT\_TIMEOUT}(connected \lor reconnecting)
   $$

2. **Message Progress**:
   $$
   \forall m \in Q: \Diamond(transmitted(m) \lor cancelled(m))
   $$

3. **Retry Progress**:
   $$
   \begin{aligned}
   &\forall s = reconnecting: \\
   &\quad \Diamond_{\leq delay_n}(connecting) \land \\
   &\quad \Diamond_{\leq MAX\_RETRIES \times MAX\_RETRY\_DELAY}(connected \lor disconnected)
   \end{aligned}
   $$

## 4. Implementation Mappings

### 4.1 State Implementation Mapping

The abstract states map to concrete implementation states via mapping function Φ:

$$
\Phi: S \rightarrow \text{ImplState}
$$

where:
$$
\begin{aligned}
\Phi(disconnected) &\mapsto \{ 
  \text{readyState}: 0,
  \text{socket}: null,
  \text{queue}: \text{new Queue}()
\} \\
\Phi(connecting) &\mapsto \{
  \text{readyState}: 1,
  \text{socket}: \text{WebSocket},
  \text{connectionStart}: timestamp
\} \\
\Phi(connected) &\mapsto \{
  \text{readyState}: 2,
  \text{socket}: \text{WebSocket},
  \text{lastMessageAt}: timestamp
\} \\
\Phi(reconnecting) &\mapsto \{
  \text{readyState}: 0,
  \text{socket}: null,
  \text{retryCount}: \mathbb{N},
  \text{nextRetryAt}: timestamp
\}
\end{aligned}
$$

### 4.2 Event Handler Mapping

Events map to concrete handlers via mapping function Ψ:

$$
\Psi: E \rightarrow \text{Handler}
$$

where:
$$
\begin{aligned}
\Psi(CONNECT) &\mapsto \text{handleConnect}(url: string): void \\
\Psi(DISCONNECT) &\mapsto \text{handleDisconnect}(code?: number): void \\
\Psi(MESSAGE) &\mapsto \text{handleMessage}(data: unknown): void \\
\Psi(ERROR) &\mapsto \text{handleError}(error: Error): void
\end{aligned}
$$

### 4.3 Action Implementation Mapping

Actions map to concrete implementations via mapping function Ω:

$$
\begin{aligned}
\Omega(\gamma_{store}) &\mapsto \text{initializeSocket}(url) \\
\Omega(\gamma_{retry}) &\mapsto \text{scheduleReconnect}(retryCount) \\
\Omega(\gamma_{send}) &\mapsto \text{sendMessage}(data) \\
\Omega(\gamma_{enqueue}) &\mapsto \text{queue.push}(message) \\
\Omega(\gamma_{dequeue}) &\mapsto \text{queue.shift}()
\end{aligned}
$$

## 5. Edge Case Handling

### 5.1 Race Conditions

1. **Multiple Connect Attempts**:
   $$
   \begin{aligned}
   &\forall e_1, e_2 \in CONNECT: \\
   &timestamp(e_1) < timestamp(e_2) \land state = connecting \\
   &\implies ignore(e_2)
   \end{aligned}
   $$

2. **Disconnect During Reconnect**:
   $$
   \begin{aligned}
   &\forall e \in DISCONNECT: \\
   &state = reconnecting \implies \begin{cases}
   cancelRetry() \\
   \gamma_{cleanup}() \\
   state \leftarrow disconnected
   \end{cases}
   \end{aligned}
   $$

### 5.2 Error Recovery Strategies

1. **Network Error Recovery**:
   $$
   \begin{aligned}
   &\forall e \in \text{NetworkError}: \\
   &backoff(n) = \begin{cases}
   INITIAL\_RETRY\_DELAY & \text{if } n = 0 \\
   min(INITIAL\_RETRY\_DELAY \times RETRY\_MULTIPLIER^n, MAX\_RETRY\_DELAY) & \text{otherwise}
   \end{cases}
   \end{aligned}
   $$

2. **Resource Cleanup**:
   $$
   \gamma_{cleanup} = \begin{cases}
   socket.close() & \text{if } socket \neq null \\
   cancelTimers() & \text{if } \exists \text{ pending timers} \\
   queue.clear() & \text{if } clearQueueOnClose
   \end{cases}
   $$

### 5.3 Resource Management

1. **Memory Bounds**:
   $$
   \begin{aligned}
   &|queue| \leq MAX\_QUEUE\_SIZE \\
   &\forall m \in queue: size(m) \leq MAX\_MESSAGE\_SIZE
   \end{aligned}
   $$

2. **Timer Management**:
   $$
   \begin{aligned}
   timers = \{&connectTimer, \\
   &retryTimer, \\
   &heartbeatTimer\}
   \end{aligned}
   $$

## 6. Algorithmic Complexity

### 6.1 Operation Complexities

1. **State Transitions**: O(1)
2. **Queue Operations**:
   - Enqueue: O(1)
   - Dequeue: O(1)
   - Message Search: O(n)

3. **Retry Logic**: O(log n) due to exponential backoff calculation

### 6.2 Memory Complexity

1. **Queue Memory**:
   $$
   M_{queue} \leq MAX\_QUEUE\_SIZE \times MAX\_MESSAGE\_SIZE
   $$

2. **State Memory**:
   $$
   M_{state} = O(1) \text{ per connection}
   $$

## 7. Configuration Schema Mappings

### 7.1 Configuration Space

Configuration schema $\mathcal{C}$ maps to JSON Schema via mapping function $\Theta$:

$$
\Theta: \mathcal{C} \rightarrow \text{JsonSchema}
$$

```typescript
{
  "$id": "ws://core/websocket/config.schema",
  "type": "object",
  "required": ["url", "options"],
  "properties": {
    "url": {
      "type": "string",
      "format": "uri-reference"
    },
    "options": {
      "type": "object",
      "properties": {
        "protocols": {
          "type": "array",
          "items": { "type": "string" }
        },
        "reconnect": {
          "type": "object",
          "properties": {
            "maxRetries": { 
              "type": "integer", 
              "minimum": 0,
              "default": 5
            },
            "initialDelay": {
              "type": "integer",
              "minimum": 100,
              "default": 1000
            },
            "maxDelay": {
              "type": "integer",
              "minimum": 1000,
              "default": 60000
            },
            "multiplier": {
              "type": "number",
              "minimum": 1,
              "default": 1.5
            }
          }
        },
        "timeout": {
          "type": "object",
          "properties": {
            "connection": {
              "type": "integer",
              "minimum": 1000,
              "default": 30000
            }
          }
        }
      }
    }
  }
}
```

### 7.2 Environment Variable Mappings

$$
\begin{aligned}
ENV = \{&WS\_MAX\_RETRIES, \\
&WS\_INITIAL\_DELAY, \\
&WS\_MAX\_DELAY, \\
&WS\_RETRY\_MULTIPLIER, \\
&WS\_CONNECT\_TIMEOUT\}
\end{aligned}
$$

## 8. Testing Requirements

### 8.1 State Transition Coverage

1. **Direct Transitions**:
   $$
   \begin{aligned}
   &\forall s_i, s_j \in S: \\
   &\exists \delta(s_i, e) = s_j \implies TestCase(s_i \xrightarrow{e} s_j)
   \end{aligned}
   $$

2. **State Invariant Tests**:
   $$
   \begin{aligned}
   &\forall s \in S: \\
   &TestCase(invariants(s))
   \end{aligned}
   $$

3. **Error Path Coverage**:
   $$
   \forall e \in E_{error}: TestCase(handleError(e))
   $$

### 8.2 Property-Based Testing

1. **Message Ordering**:
   $$
   \begin{aligned}
   &\forall m_1, m_2 \in Queue: \\
   &timestamp(m_1) < timestamp(m_2) \implies \\
   &TestCase(delivery(m_1) \prec delivery(m_2))
   \end{aligned}
   $$

2. **Retry Properties**:
   $$
   \begin{aligned}
   &\forall n \in [0, MAX\_RETRIES]: \\
   &TestCase(retryDelay(n) = backoff(n))
   \end{aligned}
   $$

### 8.3 Performance Testing Requirements

1. **Latency Bounds**:
   $$
   \begin{aligned}
   &P_{95}(connect) \leq 1000ms \\
   &P_{99}(messageDelivery) \leq 100ms
   \end{aligned}
   $$

2. **Memory Bounds**:
   $$
   \begin{aligned}
   &peak(heapUsage) \leq 50MB \\
   &leak(24hours) \leq 1MB
   \end{aligned}
   $$

## 9. Performance Constraints

### 9.1 Timing Guarantees

1. **Operation Latency**:
   $$
   \begin{aligned}
   latency(connect) &\leq 1000ms \\
   latency(send) &\leq 50ms \\
   latency(close) &\leq 100ms
   \end{aligned}
   $$

2. **Event Processing**:
   $$
   \begin{aligned}
   throughput(messages) &\geq 1000/second \\
   jitter(processing) &\leq 10ms
   \end{aligned}
   $$

### 9.2 Resource Utilization

1. **Memory Usage**:
   $$
   \begin{aligned}
   memory(connection) &\leq 1MB \\
   memory(queue) &\leq 5MB \\
   memory(buffers) &\leq 10MB
   \end{aligned}
   $$

2. **CPU Utilization**:
   $$
   \begin{aligned}
   cpu(idle) &\leq 0.1\% \\
   cpu(active) &\leq 5\% \\
   cpu(peak) &\leq 20\%
   \end{aligned}
   $$

## 10. Extended Error Mappings

### 10.1 WebSocket Close Codes

$$
\begin{aligned}
CloseCode = \{&\\
&NORMAL(1000): "Normal closure", \\
&GOING\_AWAY(1001): "Endpoint going away", \\
&PROTOCOL\_ERROR(1002): "Protocol error", \\
&INVALID\_DATA(1003): "Invalid data", \\
&POLICY\_VIOLATION(1008): "Policy violation", \\
&MESSAGE\_TOO\_BIG(1009): "Message too big", \\
&INTERNAL\_ERROR(1011): "Internal error"\\
\}
\end{aligned}
$$

### 10.2 Error Recovery Actions

$$
\begin{aligned}
ErrorAction = \{&\\
&RECONNECT: \gamma_{retry}, \\
&TERMINATE: \gamma_{cleanup}, \\
&RESET: \gamma_{reset}, \\
&REQUEUE: \gamma_{enqueue}\\
\}
\end{aligned}
$$

## 11. Core Stability Properties

### 11.1 Immutable Core

These elements MUST NOT change after initial implementation:

1. **Base States**:
   $$
   S_{core} = \{disconnected, connecting, connected, reconnecting\}
   $$

2. **Core Transitions**:
   $$
   \begin{aligned}
   \delta_{core} = \{&disconnected \rightarrow connecting, \\
   &connecting \rightarrow connected, \\
   &connecting \rightarrow reconnecting, \\
   &connected \rightarrow disconnected\}
   \end{aligned}
   $$

3. **Essential Context**:
   $$
   C_{core} = \{url, socket, retries, lastError\}
   $$

### 11.2 Extension Points

Changes and additions MUST occur through:

1. **Event Handlers**:
   $$
   H_{ext} = H_{core} \cup H_{custom}
   $$
   where $H_{core}$ remains unchanged

2. **State Metadata**:
   $$
   M(s) = M_{core}(s) \cup M_{ext}(s)
   $$
   where $M_{core}$ remains unchanged

3. **Configuration Options**:
   $$
   Config = Config_{core} \cup Config_{ext}
   $$
   where $Config_{core}$ remains unchanged

### 11.3 Simple Security Model

1. **Message Origin Verification**:
   $$
   origin(message) \in allowedOrigins \lor reject(message)
   $$

2. **Basic Authentication**:
   $$
   auth(url) = \begin{cases}
   url & \text{if no auth required} \\
   url + \text{'?token=' + token} & \text{if token auth}
   \end{cases}
   $$

### 11.4 Minimal Production Requirements

1. **Essential Logging**:
   ```typescript
   type LogEvent = {
     level: 'error' | 'warn' | 'info',
     state: S_core,
     message: string,
     timestamp: number
   }
   ```

2. **Basic Metrics**:
   $$
   M_{prod} = \{connectTime, messageCount, errorCount, retryCount\}
   $$

3. **Health Check**:
   $$
   health() = \begin{cases}
   true & \text{if } s = connected \\
   false & \text{otherwise}
   \end{cases}
   $$

## 12. Implementation Stability Guidelines

### 12.1 Modification Boundaries

1. **Protected Core**:
   $$
   Protected = \{S_{core}, \delta_{core}, C_{core}, \Gamma_{core}\}
   $$
   These elements form the immutable foundation.

2. **Extension Interface**:
   $$
   \begin{aligned}
   Extension = \{&middleware: C_{ws} \rightarrow C_{ws}, \\
   &handlers: E_{custom} \rightarrow \gamma, \\
   &options: Config_{ext}\}
   \end{aligned}
   $$

### 12.2 Safe Configuration Extensions

1. **Configuration Layering**:
   $$
   Config_{final} = Config_{core} \oplus Config_{ext}
   $$
   where $\oplus$ ensures core values cannot be overridden

2. **Default Behaviors**:
   $$
   \begin{aligned}
   default: Config_{ext} &\rightarrow Config_{core} \\
   \forall c \in Config_{ext}&: default(c) \text{ must be defined}
   \end{aligned}
   $$

### 12.3 Minimal Production Additions

1. **Required Monitoring**:
   $$
   Monitor_{min} = \{state, lastError, retryCount\}
   $$

2. **Core Health Signal**:
   $$
   healthy = connected \land lastError = null
   $$

