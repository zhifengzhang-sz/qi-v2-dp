# WebSocket Protocol State Machine

Prerequisites:

- [machine.part.1.md](./machine.part.1.md): Core state machine formal specification

This specification extends the core state machine for WebSocket protocol implementation.

## 1. Mapping to Core Machine

This specification extends the core state machine defined in `machine.part.1.md` for WebSocket protocol implementation.

### 1.1 State Mapping

The WebSocket states map to core states $S$ as follows:

$$
\begin{aligned}
disconnected &\mapsto s_1 \\
disconnecting &\mapsto s_2 \\
connecting &\mapsto s_3 \\
connected &\mapsto s_4 \\
reconnecting &\mapsto s_5 \\
reconnected &\mapsto s_6
\end{aligned}
$$

### 1.2 WebSocket-Specific Constants

Additional protocol constants:

$$
\small
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
E_{ws} = \{open, close, error, message, disconnected, reconnected, stabilized\} \subseteq E
$$

### 1.4 Protocol Transition Mappings

For WebSocket protocol events, the transition function $\delta$ maps as follows:

$$
\begin{aligned}
\delta(connecting, open) &\rightarrow (connected, \{\gamma_{store}, \gamma_{reset}\}) \\
\delta(connecting, error) &\rightarrow (reconnecting, \{\gamma_{error}, \gamma_{retry}\}) \\
\delta(connected, close) &\rightarrow (disconnecting, \{\gamma_{initDisconnect}\}) \\
\delta(disconnecting, disconnected) &\rightarrow (disconnected, \{\gamma_{completeDisconnect}\}) \\
\delta(connected, error) &\rightarrow (reconnecting, \{\gamma_{error}, \gamma_{retry}\}) \\
\delta(reconnecting, retry) &\rightarrow (connecting, \{\gamma_{connect}\}) \\
\delta(reconnecting, reconnected) &\rightarrow (reconnected, \{\gamma_{stabilizeReconnection}\}) \\
\delta(reconnected, stabilized) &\rightarrow (connected, \{\gamma_{reset}\})
\end{aligned}
$$

### 1.5 Protocol-Specific Context

The WebSocket context $C_{ws}$ extends the base context with:

$$
C_{ws} = C \cup \left\{
\begin{aligned}
&url: String,\\
&socket: WebSocket \cup \{null\},\\
&retries: \mathbb{N},\\
&lastError: Error \cup \{null\},\\
&closeCode: WebSocketConstants \cup \{null\},\\
&disconnectReason: String \cup \{null\},\\
&reconnectCount: \mathbb{N},\\
&lastStableConnection: \mathbb{R}^+ \cup \{null\}
\end{aligned}
\right\}
$$

### 1.6 Protocol Invariants

The following invariants must hold for all WebSocket states:

1. **Connection Uniqueness**:
   $$\forall t, |\{s \in socket | s \neq null\}| \leq 1$$

2. **State-Socket Consistency**:

   $$
   \begin{aligned}
   s = disconnected &\implies socket = null \\
   s = disconnecting &\implies socket \neq null \\
   s = connected &\implies socket \neq null \\
   s = connecting &\implies socket \neq null \\
   s = reconnecting &\implies socket = null \\
   s = reconnected &\implies socket \neq null
   \end{aligned}
   $$

3. **Retry Bounds**:
   $$
   \scriptsize
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

4. **Disconnect Safety**:

   $$
   \begin{aligned}
   &s = disconnecting \implies \\
   &\quad disconnectReason \neq null \land duration(s) \leq DISCONNECT\_TIMEOUT
   \end{aligned}
   $$

5. **Reconnection Safety**:
   $$
   \begin{aligned}
   &s = reconnected \implies \\
   &\quad reconnectCount > 0 \land lastStableConnection \neq null
   \end{aligned}
   $$

### 1.8 Protocol Liveness Properties

1. **Connection Progress**:

   $$
   \forall s = connecting: \Diamond(connected \lor disconnected)
   $$

2. **Disconnection Progress**:

   $$
   \forall s = disconnecting: \Diamond(disconnected)
   $$

3. **Retry Progress**:

   $$
   \forall s = reconnecting: \Diamond(connected \lor disconnected)
   $$

4. **Stability Progress**:

   $$
   \forall s = reconnected: \Diamond(connected)
   $$

5. **Eventual Consistency**:
   $$
   \forall e = error: \Diamond(connected \lor (disconnected \land retries = MAX\_RETRIES))
   $$

### 1.9 Protocol Actions ($\gamma$)

Actions are defined as context transformers:
$$\gamma: C_{ws} \times E \rightarrow C_{ws}$$

Core action set:

$$
\begin{aligned}
\Gamma_{ws} = \{&\gamma_{store}, \gamma_{connect}, \gamma_{reset}, \\
&\gamma_{error}, \gamma_{retry}, \gamma_{cleanup}, \\
&\gamma_{enqueue}, \gamma_{dequeue}, \gamma_{send}, \\
&\gamma_{initDisconnect}, \gamma_{completeDisconnect}, \\
&\gamma_{stabilizeReconnection}\}
\end{aligned}
$$

Each action is defined formally:

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
   c'.closeCode = null \\
   c'.reconnectCount = 0
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

4. Initialize Disconnect:

   $$
   \gamma_{initDisconnect}(c, e) = c' \text{ where } \begin{cases}
   c'.disconnectReason = e.reason \\
   c'.status = disconnecting
   \end{cases}
   $$

5. Complete Disconnect:

   $$
   \gamma_{completeDisconnect}(c) = c' \text{ where } \begin{cases}
   c'.socket = null \\
   c'.disconnectTime = now() \\
   c'.disconnectReason = null
   \end{cases}
   $$

6. Stabilize Reconnection:
   $$
   \gamma_{stabilizeReconnection}(c) = c' \text{ where } \begin{cases}
   c'.lastStableConnection = now() \\
   c'.status = reconnected
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
   \gamma_{enqueue}(c, m) & \text{if } s \notin \{connected, reconnected\} \\
   transmit(m) & \text{if } s \in \{connected, reconnected\}
   \end{cases}
   \end{aligned}
   $$

3. **Queue Invariants**:
   $$
   \begin{aligned}
   &\forall m_i, m_j \in Q: i < j \implies timestamp_i < timestamp_j \\
   &\forall s \notin \{connected, reconnected\}: transmit(m) \implies m \in Q
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

1. Assume $\exists t$ where there are two active connections $c_1, c_2$
2. By state invariants, $socket \neq null \implies s \in \{connecting, connected, disconnecting, reconnected\}$
3. By state transitions, only $\gamma_{store}$ creates new connections
4. $\gamma_{store}$ requires $s = disconnected$
5. By state machine properties, system can only be in one state
6. Therefore, cannot have two simultaneous active connections
7. Contradiction ∎

### 2.2 Message Delivery Properties

**Theorem 2** (Message Preservation): No messages are lost during state transitions.

**Proof** by cases:

1. Case $s \in \{connected, reconnected\}$:
   - Messages transmitted directly via $transmit(m)$
   - By socket protocol, delivery confirmed or error raised
2. Case $s \notin \{connected, reconnected\}$:
   - Messages enqueued via $\gamma_{enqueue}$
   - Queue preserves FIFO ordering
   - Messages dequeued only after successful transmission
3. Therefore, all messages either:
   - Successfully transmitted, or
   - Retained in queue
     ∎

### 2.3 Retry Logic Properties

**Theorem 3** (Retry Termination): The retry process eventually terminates.

**Proof** by well-founded induction:

1. Define measure function $\mu(s) = MAX\_RETRIES - retries$
2. For each retry:
   - $\mu$ decreases by 1 ($\gamma_{retry}$ increments $retries$)
   - $\mu < 0 \implies$ system enters $disconnected$ state
3. $\mu$ is well-founded on $\mathbb{N}$
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
   duration(disconnecting) &\leq DISCONNECT\_TIMEOUT \\
   duration(reconnecting) &\leq delay_n \\
   duration(reconnected) &\leq STABILITY\_TIMEOUT \\
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
   &disconnecting \xrightarrow{t \leq DISCONNECT\_TIMEOUT} disconnected \\
   &reconnecting \xrightarrow{t \leq delay_n} connecting \\
   &reconnected \xrightarrow{t \leq STABILITY\_TIMEOUT} connected
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

The abstract states map to concrete implementation states via mapping function $\Phi$:

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
\Phi(disconnecting) &\mapsto \{
  \text{readyState}: 1,
  \text{socket}: \text{WebSocket},
  \text{disconnectReason}: \text{String}
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
\} \\
\Phi(reconnected) &\mapsto \{
  \text{readyState}: 2,
  \text{socket}: \text{WebSocket},
  \text{reconnectCount}: \mathbb{N},
  \text{stabilityStart}: timestamp
\}
\end{aligned}
$$

### 4.2 Event Handler Mapping

Events map to concrete handlers via mapping function $\Psi$:

$$
\Psi: E \rightarrow \text{Handler}
$$

where:

$$
\begin{aligned}
\Psi(CONNECT) &\mapsto \text{handleConnect}(url: string): void \\
\Psi(DISCONNECT) &\mapsto \text{handleDisconnect}(code?: number): void \\
\Psi(MESSAGE) &\mapsto \text{handleMessage}(data: unknown): void \\
\Psi(ERROR) &\mapsto \text{handleError}(error: Error): void \\
\Psi(DISCONNECTED) &\mapsto \text{handleDisconnected}(): void \\
\Psi(RECONNECTED) &\mapsto \text{handleReconnected}(): void \\
\Psi(STABILIZED) &\mapsto \text{handleStabilized}(): void
\end{aligned}
$$

### 4.3 Action Implementation Mapping

Actions map to concrete implementations via mapping function $\Omega$:

$$
\begin{aligned}
\Omega(\gamma_{store}) &\mapsto \text{initializeSocket}(url) \\
\Omega(\gamma_{retry}) &\mapsto \text{scheduleReconnect}(retryCount) \\
\Omega(\gamma_{send}) &\mapsto \text{sendMessage}(data) \\
\Omega(\gamma_{enqueue}) &\mapsto \text{queue.push}(message) \\
\Omega(\gamma_{dequeue}) &\mapsto \text{queue.shift}() \\
\Omega(\gamma_{initDisconnect}) &\mapsto \text{startDisconnect}(reason) \\
\Omega(\gamma_{completeDisconnect}) &\mapsto \text{finalizeDisconnect}() \\
\Omega(\gamma_{stabilizeReconnection}) &\mapsto \text{stabilizeConnection}()
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

3. **Connection Race**:
   $$
   \begin{aligned}
   &\forall e_1 \in RECONNECTED, e_2 \in CONNECT: \\
   &timestamp(e_1) < timestamp(e_2) \land state = reconnecting \\
   &\implies prioritize(e_1)
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

3. **State Recovery**:
   $$
   \begin{aligned}
   recover(s) = \begin{cases}
   \gamma_{retry} & \text{if } s = reconnecting \land retries < MAX\_RETRIES \\
   \gamma_{stabilizeReconnection} & \text{if } s = reconnected \\
   \gamma_{cleanup} & \text{otherwise}
   \end{cases}
   \end{aligned}
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
   &heartbeatTimer, \\
   &stabilityTimer, \\
   &disconnectTimer\}
   \end{aligned}
   $$

3. **Resource Limits**:
   $$
   \begin{aligned}
   &maxBufferSize \leq MAX\_BUFFER\_SIZE \\
   &maxEventListeners \leq MAX\_LISTENERS \\
   &maxTimers \leq MAX\_TIMERS
   \end{aligned}
   $$

## 6. Algorithmic Complexity

### 6.1 Operation Complexities

1. **State Transitions**: $O(1)$

2. **Queue Operations**:

   $$
   \begin{aligned}
   &Enqueue: O(1) \\
   &Dequeue: O(1) \\
   &Message \text{ Search}: O(n)
   \end{aligned}
   $$

3. **Retry Logic**: $O(log \space n)$ due to exponential backoff calculation

4. **State Validation**:
   $$
   \begin{aligned}
   &validateTransition: O(1) \\
   &validateInvariants: O(1) \\
   &validateQueue: O(n)
   \end{aligned}
   $$

### 6.2 Memory Complexity

1. **Queue Memory**:

   $$
   M_{queue} \leq MAX\_QUEUE\_SIZE \times MAX\_MESSAGE\_SIZE
   $$

2. **State Memory**:

   $$
   M_{state} = O(1) \text{ per connection}
   $$

3. **Buffer Memory**:
   $$
   M_{buffer} \leq MAX\_BUFFER\_SIZE \text{ per connection}
   $$

### 6.3 Performance Constraints

1. **Operation Latency**:

   $$
   \begin{aligned}
   &latency(transition) \leq 10ms \\
   &latency(enqueue) \leq 5ms \\
   &latency(dequeue) \leq 5ms
   \end{aligned}
   $$

2. **Memory Usage**:
   $$
   \begin{aligned}
   &memory_{peak} \leq MAX\_MEMORY \\
   &memory_{idle} \leq IDLE\_MEMORY
   \end{aligned}
   $$

## 7. Configuration Schema Mappings

### 7.1 Configuration Space

Configuration schema $\mathcal{C}$ maps to JSON Schema via mapping function $\Theta$:

$$
\Theta: \mathcal{C} \rightarrow \text{JsonSchema}
$$

where:

$$
\begin{aligned}
\mathcal{C} = \{&url: String, \\
&protocols: String[], \\
&reconnect: ReconnectConfig, \\
&timeout: TimeoutConfig, \\
&queue: QueueConfig\}
\end{aligned}
$$

### 7.2 Configuration Types

1. **Reconnect Configuration**:

   $$
   \begin{aligned}
   ReconnectConfig = \{&\\
   &maxRetries: \mathbb{N}, \\
   &initialDelay: \mathbb{N}, \\
   &maxDelay: \mathbb{N}, \\
   &multiplier: \mathbb{R}^+\}
   \end{aligned}
   $$

2. **Timeout Configuration**:

   $$
   \begin{aligned}
   TimeoutConfig = \{&\\
   &connect: \mathbb{N}, \\
   &disconnect: \mathbb{N}, \\
   &stability: \mathbb{N}, \\
   &heartbeat: \mathbb{N}\}
   \end{aligned}
   $$

3. **Queue Configuration**:
   $$
   \begin{aligned}
   QueueConfig = \{&\\
   &maxSize: \mathbb{N}, \\
   &maxMessageSize: \mathbb{N}, \\
   &clearOnClose: Boolean\}
   \end{aligned}
   $$

### 7.3 Environment Variable Mappings

$$
\begin{aligned}
ENV = \{&WS\_MAX\_RETRIES, \\
&WS\_INITIAL\_DELAY, \\
&WS\_MAX\_DELAY, \\
&WS\_RETRY\_MULTIPLIER, \\
&WS\_CONNECT\_TIMEOUT, \\
&WS\_DISCONNECT\_TIMEOUT, \\
&WS\_STABILITY\_TIMEOUT\}
\end{aligned}
$$

### 7.4 Configuration Validation

1. **Value Constraints**:

   $$
   \begin{aligned}
   &maxRetries \in [0, 10] \\
   &initialDelay \in [100, 5000] \\
   &maxDelay \in [1000, 60000] \\
   &multiplier \in [1.0, 2.0]
   \end{aligned}
   $$

2. **Type Validation**:

   $$
   \begin{aligned}
   &validate: \mathcal{C} \rightarrow Boolean \\
   &validate(c) = \bigwedge_{x \in c} typeCheck(x)
   \end{aligned}
   $$

3. **Dependency Rules**:
   $$
   \begin{aligned}
   &maxDelay \geq initialDelay \\
   &stability\_timeout \leq connect\_timeout \\
   &disconnect\_timeout \leq connect\_timeout
   \end{aligned}
   $$
