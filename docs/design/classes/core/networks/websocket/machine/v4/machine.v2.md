# WebSocket Machine Formal Specification

## 1. Mathematical Foundations

### 1.1 Set Theory Foundations

For any set $A$, its power set $\mathfrak{P}(A)$ is defined as:
$$\mathfrak{P}(A) = \{B \mid B \subseteq A\}$$

For sets $A$ and $B$, their Cartesian product $A \times B$ is defined as:
$$A \times B = \{(a,b) \mid a \in A \land b \in B\}$$

### 1.2 Basic Domains

Let $\Sigma$ be a finite alphabet. The basic mathematical domains used throughout the specification are:

- Boolean domain: $\mathbb{B} = \{\text{true}, \text{false}\}$
- Natural numbers: $\mathbb{N} = \{n \in \mathbb{Z} \mid n \geq 0\}$
- Positive real numbers: $\mathbb{R}^+ = \{r \in \mathbb{R} \mid r > 0\}$
- String domain: $\mathbb{S} = \Sigma^* = \bigcup_{n=0}^{\infty} \Sigma^n$ where $\Sigma^n$ is the set of all sequences of length n over $\Sigma$
- Binary data: $\mathbb{D} = \{0,1\}^*$ (finite sequences of bits)

### 1.3 Internal Socket States

The internal socket state domain $\mathbb{I}$ is defined as:
$$\mathbb{I} = \{0, 1, 2, 3\}$$

With the following mapping:
- 0: CONNECTING
- 1: OPEN
- 2: CLOSING
- 3: CLOSED

This mapping is formalized by the function $socketState: \mathbb{I} \rightarrow \mathbb{S}$:
$$socketState(i) = \begin{cases}
\text{CONNECTING} & \text{if } i = 0 \\
\text{OPEN} & \text{if } i = 1 \\
\text{CLOSING} & \text{if } i = 2 \\
\text{CLOSED} & \text{if } i = 3
\end{cases}$$

### 1.4 WebSocket Domain

The WebSocket domain $\mathbb{W}$ is defined as:
$$\mathbb{W} = \mathbb{D} \times \mathbb{S} \times \mathbb{I}$$

where elements are triples of (buffer, protocol, internalState)

### 1.5 Connection Status

The connection status domain $\mathbb{K}$ is defined as:
$$\mathbb{K} = \{\text{connected}, \text{disconnected}, \text{error}\}$$

With the following formal properties:
1. Exhaustiveness: $\forall k \in \mathbb{K}: k \in \{\text{connected}, \text{disconnected}, \text{error}\}$
2. Mutual exclusivity: $\forall k_1, k_2 \in \mathbb{K}: k_1 = k_2 \lor k_1 \cap k_2 = \emptyset$
3. Valid transitions: $\text{connected} \rightarrow \{\text{disconnected}, \text{error}\}$, $\text{disconnected} \rightarrow \{\text{connected}\}$, $\text{error} \rightarrow \{\text{disconnected}\}$

The status transition function $\tau: \mathbb{K} \times \mathbb{K} \rightarrow \mathbb{B}$ is defined as:
$$\tau(k_1, k_2) = \begin{cases}
\text{true} & \text{if transition } k_1 \rightarrow k_2 \text{ is valid} \\
\text{false} & \text{otherwise}
\end{cases}$$

### 1.6 Time Domain

Time is represented as milliseconds since Unix epoch:
$$\mathbb{T} = \{t \in \mathbb{R}^+ \mid t \geq 1672531200000\}$$

The time domain has the following properties:
1. Monotonicity: $\forall t_1, t_2 \in \mathbb{T}: t_1 < t_2 \implies now(t_1) < now(t_2)$
2. Continuity: $\forall t_1, t_2 \in \mathbb{T}: t_1 < t_2 \implies \exists t_3 \in \mathbb{T}: t_1 < t_3 < t_2$
3. Bounded delay: $\forall t \in \mathbb{T}: now(t) - t \leq \text{MAX\_DELAY}$ where $\text{MAX\_DELAY}$ is implementation-defined

The current time function is defined as:
$$now: \emptyset \rightarrow \mathbb{T}$$
where $now()$ returns the current Unix timestamp in milliseconds.

### 1.7 Window Domain

A time window $w$ is defined as a tuple:
$$w = (start: \mathbb{T}, duration: \mathbb{R}^+, count: \mathbb{N}, limit: \mathbb{N})$$

The set of all windows $\mathbb{W}\text{in}$ is defined as:
$$\mathbb{W}\text{in} = \mathbb{T} \times \mathbb{R}^+ \times \mathbb{N} \times \mathbb{N}$$

### 1.8 Message Domain

A Message $m$ is formally defined as a 4-tuple:
$$m = (id: \mathbb{N}, data: \mathbb{D}, metadata: \mathbb{S}, timestamp: \mathbb{T})$$

The set of all possible messages $\mathbb{M}$ is defined as:
$$\mathbb{M} = \mathbb{N} \times \mathbb{D} \times \mathbb{S} \times \mathbb{T}$$

### 1.9 Auxiliary Functions

Time function:
$$t: \mathbb{M} \rightarrow \mathbb{T}, \text{ where } t(m) = m.timestamp$$

Order function:
$$order: \mathbb{M} \rightarrow \mathbb{N}, \text{ where } order(m) = m.id$$

Size function:
$$size: \mathbb{D} \rightarrow \mathbb{N}, \text{ where } size(d) = |d|$$

Window count function:
$$currentWindowCount: \mathbb{W}\text{in} \rightarrow \mathbb{N}$$
$$currentWindowCount(w) = |\{m \in \mathbb{M} \mid w.start \leq t(m) \leq w.start + w.duration\}|$$

Window expiry function:
$$windowExpired: \mathbb{W}\text{in} \rightarrow \mathbb{B}$$
$$windowExpired(w) = now() > w.start + w.duration$$

Type function:
$$type: \bigcup_{D \in \{\mathbb{B}, \mathbb{N}, \mathbb{R}^+, \mathbb{S}, \mathbb{D}, \mathbb{W}, \mathbb{K}, \mathbb{T}, \mathbb{W}\text{in}, \mathbb{M}\}} D \rightarrow \{\mathbb{B}, \mathbb{N}, \mathbb{R}^+, \mathbb{S}, \mathbb{D}, \mathbb{W}, \mathbb{K}, \mathbb{T}, \mathbb{W}\text{in}, \mathbb{M}\}$$

Message ordering relation:
For any $m_1, m_2 \in \mathbb{M}$:
$$m_1 < m_2 \iff (t(m_1) < t(m_2)) \lor (t(m_1) = t(m_2) \land order(m_1) < order(m_2))$$

### 1.10 Implementation-Defined Constants

The following constants are used throughout the specification and must be defined by implementations:

1. Time and Delay Constants:
   ```
   MAX_DELAY: number            // Maximum allowed delay for any operation
   Range: 1000ms to 5000ms
   Default: 3000ms
   Constraint: Must be greater than RTT_TIMEOUT
   
   RTT_TIMEOUT: number         // Round-trip-time timeout
   Range: 100ms to 1000ms
   Default: 500ms
   Constraint: Must be less than MAX_DELAY
   
   MAX_PING_INTERVAL: number   // Maximum time between ping messages
   Range: 15000ms to 60000ms
   Default: 30000ms
   Constraint: Must be greater than 2 * MAX_DELAY
   
   MAX_PONG_DELAY: number      // Maximum allowed delay for pong response
   Range: 1000ms to 10000ms
   Default: 5000ms
   Constraint: Must be greater than MAX_DELAY
   ```

2. Retry and Recovery Constants:
   ```
   MAX_RETRIES: number         // Maximum number of reconnection attempts
   Range: 3 to 10
   Default: 5
   Constraint: Must be positive integer
   
   RETRY_BACKOFF_BASE: number  // Base for exponential backoff
   Range: 1.5 to 3.0
   Default: 2.0
   Constraint: Must be greater than 1.0
   
   MAX_ERRORS_PER_STATE: number // Maximum errors before forcing termination
   Range: 3 to 10
   Default: 5
   Constraint: Must be less than or equal to MAX_RETRIES
   ```

3. Rate Limiting Constants:
   ```
   RATE_LIMIT_WINDOW: number   // Time window for rate limiting (ms)
   Range: 1000ms to 60000ms
   Default: 10000ms
   Constraint: Must be greater than MAX_DELAY
   
   MAX_MESSAGES_PER_WINDOW: number // Maximum messages in rate limit window
   Range: 100 to 1000
   Default: 500
   Constraint: Must be positive integer
   
   MAX_BYTES_PER_MESSAGE: number // Maximum message size in bytes
   Range: 1024 to 1048576 (1MB)
   Default: 65536 (64KB)
   Constraint: Must be positive integer
   ```

4. Buffer and Queue Constants:
   ```
   MAX_QUEUE_SIZE: number      // Maximum message queue size
   Range: 100 to 10000
   Default: 1000
   Constraint: Must be positive integer
   
   MAX_BUFFER_SIZE: number     // Maximum WebSocket buffer size
   Range: 1048576 (1MB) to 16777216 (16MB)
   Default: 4194304 (4MB)
   Constraint: Must be greater than MAX_BYTES_PER_MESSAGE
   ```

5. Cross-Cutting Constraints:
   ```
   1. RETRY_BACKOFF_BASE^MAX_RETRIES * RTT_TIMEOUT < 1 hour
   2. MAX_MESSAGES_PER_WINDOW * MAX_BYTES_PER_MESSAGE < MAX_BUFFER_SIZE
   3. MAX_QUEUE_SIZE * MAX_BYTES_PER_MESSAGE < MAX_BUFFER_SIZE
   4. MAX_PING_INTERVAL > 2 * MAX_PONG_DELAY
   ```

Each implementation must:
1. Define all constants within the specified ranges
2. Maintain all cross-cutting constraints
3. Document any additional implementation-specific constants
4. Validate constants at initialization time

## 2. State Machine Definition

### 2.1 Basic Machine

A WebSocket Machine is formally defined as a 9-tuple:

$$\mathfrak{M} = (S, E, \delta, s_0, C, \Gamma, F, A, R)$$

Where:
- $S$ is the finite set of states
- $E$ is the finite set of events
- $\delta: S \times E \rightarrow (S \times \mathfrak{P}(\Gamma)) \cup \{\bot\}$ is the transition function
- $s_0 \in S$ is the initial state
- $C$ is the context structure (defined in 2.4)
- $\Gamma$ is the set of actions
- $F \subseteq S$ is the set of final states
- $A: \mathfrak{P}(\Gamma) \times C \rightarrow C$ is the action application function
- $R: S \times E \times C \rightarrow C$ is the error recovery function

### 2.2 States ($S$)

The state set $S$ is defined as:

$$S = \{s_{\text{Disconnected}}, s_{\text{Connecting}}, s_{\text{Connected}}, s_{\text{Reconnecting}}, s_{\text{Disconnecting}}, s_{\text{Terminated}}\}$$

With formal properties:
1. $S$ is finite and fixed: $|S| = 6$
2. States are mutually exclusive: $\forall s_1, s_2 \in S: s_1 = s_2 \lor s_1 \cap s_2 = \emptyset$
3. Initial state: $s_0 = s_{\text{Disconnected}}$
4. Final states: $F = \{s_{\text{Terminated}}\}$

The state-socket mapping function $\sigma: S \times \mathbb{W} \rightarrow \mathbb{I}$ defines valid internal socket states for each machine state:

$$\sigma(s, w) = \begin{cases}
0 & \text{if } s = s_{\text{Connecting}} \\
1 & \text{if } s = s_{\text{Connected}} \\
2 & \text{if } s = s_{\text{Disconnecting}} \\
3 & \text{if } s \in \{s_{\text{Disconnected}}, s_{\text{Reconnecting}}, s_{\text{Terminated}}\}
\end{cases}$$

### 2.3 Events ($E$)

The event set $E$ is defined as the union of control events $E_c$ and data events $E_d$:

$$E = E_c \cup E_d$$

Control Events:
$$E_c = \{e_{\text{CONNECT}}, e_{\text{DISCONNECT}}, e_{\text{OPEN}}, e_{\text{CLOSE}}, e_{\text{ERROR}}, e_{\text{RETRY}}, e_{\text{MAX\_RETRIES}}, e_{\text{TERMINATE}}\}$$

Data Events:
$$E_d = \{e_{\text{MESSAGE}}, e_{\text{SEND}}, e_{\text{PING}}, e_{\text{PONG}}\}$$

Each event $e \in E$ is a tuple:
$$e = (type: E_c \cup E_d, payload: \mathbb{D} \cup \{\emptyset\}, metadata: \mathbb{S} \cup \{\emptyset\}, timestamp: \mathbb{T}, error: \mathbb{S} \cup \{\emptyset\})$$

The error field is non-empty if and only if $type = e_{\text{ERROR}}$.

### 2.4 Context ($C$)

The context is defined as a record structure:

$$C = \{properties: P, metrics: V, timing: T, window: \mathbb{W}\text{in}\}$$

where:

Primary Connection Properties ($P$):
$$P = \{
  url: \mathbb{S},
  protocols: \mathfrak{P}(\mathbb{S}),
  socket: \mathbb{W} \cup \{\emptyset\},
  status: \mathbb{K},
  readyState: \mathbb{I}
\}$$

Metric Values ($V$):
$$V = \{
  messagesSent: \mathbb{N},
  messagesReceived: \mathbb{N},
  reconnectAttempts: \mathbb{N},
  bytesSent: \mathbb{N},
  bytesReceived: \mathbb{N},
  errorCount: \mathbb{N}
\}$$

Timing Properties ($T$):
$$T = \{
  connectTime: \mathbb{T} \cup \{\emptyset\},
  disconnectTime: \mathbb{T} \cup \{\emptyset\},
  lastPingTime: \mathbb{T} \cup \{\emptyset\},
  lastPongTime: \mathbb{T} \cup \{\emptyset\},
  lastError: \mathbb{T} \cup \{\emptyset\}
\}$$

### 2.5 Actions ($\Gamma$)

Actions are pure functions that transform context:

$$\Gamma: C \times E \rightarrow C$$

The set of actions $\Gamma$ is defined as:

$$\Gamma = \Gamma_c \cup \Gamma_d \cup \Gamma_e$$

Control Actions ($\Gamma_c$):
$$\Gamma_c = \{\gamma_{\text{storeUrl}}, \gamma_{\text{resetRetries}}, \gamma_{\text{incrementRetries}}, \gamma_{\text{logConnection}}, \gamma_{\text{forceTerminate}}\}$$

Data Actions ($\Gamma_d$):
$$\Gamma_d = \{\gamma_{\text{processMessage}}, \gamma_{\text{sendMessage}}, \gamma_{\text{handlePing}}, \gamma_{\text{handlePong}}, \gamma_{\text{enforceRateLimit}}\}$$

Error Actions ($\Gamma_e$):
$$\Gamma_e = \{\gamma_{\text{handleError}}, \gamma_{\text{logError}}, \gamma_{\text{recoverError}}\}$$

Each action is defined formally with pre- and post-conditions:

$$\gamma_{\text{storeUrl}}(c, e) = c' \text{ where } \begin{cases}
\text{pre: } type(e.payload) = \mathbb{S} \\
\text{post: } c'.properties.url = e.payload
\end{cases}$$

$$\gamma_{\text{resetRetries}}(c, e) = c' \text{ where } \begin{cases}
\text{pre: } true \\
\text{post: } c'.metrics.reconnectAttempts = 0
\end{cases}$$

$$\gamma_{\text{handleError}}(c, e) = c' \text{ where } \begin{cases}
\text{pre: } e.error \neq \emptyset \\
\text{post: } \begin{cases}
c'.properties.status = \text{error} \\
c'.timing.lastError = now() \\
c'.properties.socket = \emptyset \\
c'.metrics.errorCount = c.metrics.errorCount + 1
\end{cases}
\end{cases}$$

### 2.6 Action Application ($A$)

The action application function $A$ defines how multiple actions are composed:

$$A: \mathfrak{P}(\Gamma) \times C \rightarrow C$$

For any set of actions $\{\gamma_1, ..., \gamma_n\} \subseteq \Gamma$ and context $c \in C$:

$$A(\{\gamma_1, ..., \gamma_n\}, c) = \gamma_n(...\gamma_2(\gamma_1(c)))$$

The following properties hold:

1. Identity: $A(\emptyset, c) = c$
2. Associativity: $A(\gamma_1, A(\gamma_2, c)) = A(A(\gamma_1, \gamma_2), c)$
3. Type preservation: $type(A(\Gamma', c)) = type(c)$ for all $\Gamma' \subseteq \Gamma$

Action composition rules:
1. Control actions are applied before data actions
2. Error actions are applied last
3. Within each category, actions are applied in index order

### 2.7 Error Recovery ($R$)

The error recovery function $R$ defines how the machine handles undefined transitions:

$$R: S \times E \times C \rightarrow C$$

For any state $s \in S$, event $e \in E$, and context $c \in C$:

$$R(s, e, c) = \begin{cases}
A(\{\gamma_{\text{handleError}}, \gamma_{\text{logError}}\}, c) & \text{if } \delta(s,e) = \bot \\
c & \text{otherwise}
\end{cases}$$

Recovery guarantees:
1. Type preservation: $type(R(s,e,c)) = type(c)$
2. Status consistency: $R(s,e,c).properties.status \in \mathbb{K}$
3. Error logging: $R(s,e,c).timing.lastError = now()$ if $\delta(s,e) = \bot$

### 2.8 State Transition Function ($\delta$)

The transition function maps states and events to new states and sets of actions:

$$\delta: S \times E \rightarrow (S \times \mathfrak{P}(\Gamma)) \cup \{\bot\}$$

Complete transition function definition:

1. Disconnected State Transitions:
$$\delta(s_{\text{Disconnected}}, e_{\text{CONNECT}}) = (s_{\text{Connecting}}, \{\gamma_{\text{storeUrl}}, \gamma_{\text{logConnection}}\})$$
$$\delta(s_{\text{Disconnected}}, e_{\text{TERMINATE}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$$

2. Connecting State Transitions:
$$\delta(s_{\text{Connecting}}, e_{\text{OPEN}}) = (s_{\text{Connected}}, \{\gamma_{\text{resetRetries}}, \gamma_{\text{logConnection}}\})$$
$$\delta(s_{\text{Connecting}}, e_{\text{ERROR}}) = (s_{\text{Reconnecting}}, \{\gamma_{\text{handleError}}, \gamma_{\text{incrementRetries}}\})$$
$$\delta(s_{\text{Connecting}}, e_{\text{TERMINATE}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$$

3. Connected State Transitions:
$$\delta(s_{\text{Connected}}, e_{\text{MESSAGE}}) = (s_{\text{Connected}}, \{\gamma_{\text{processMessage}}, \gamma_{\text{enforceRateLimit}}\})$$
$$\delta(s_{\text{Connected}}, e_{\text{SEND}}) = (s_{\text{Connected}}, \{\gamma_{\text{sendMessage}}, \gamma_{\text{enforceRateLimit}}\})$$
$$\delta(s_{\text{Connected}}, e_{\text{PING}}) = (s_{\text{Connected}}, \{\gamma_{\text{handlePing}}\})$$
$$\delta(s_{\text{Connected}}, e_{\text{PONG}}) = (s_{\text{Connected}}, \{\gamma_{\text{handlePong}}\})$$
$$\delta(s_{\text{Connected}}, e_{\text{ERROR}}) = (s_{\text{Reconnecting}}, \{\gamma_{\text{handleError}}, \gamma_{\text{incrementRetries}}\})$$
$$\delta(s_{\text{Connected}}, e_{\text{DISCONNECT}}) = (s_{\text{Disconnecting}}, \{\gamma_{\text{logConnection}}\})$$
$$\delta(s_{\text{Connected}}, e_{\text{TERMINATE}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$$

4. Reconnecting State Transitions:
$$\delta(s_{\text{Reconnecting}}, e_{\text{RETRY}}) = (s_{\text{Connecting}}, \{\gamma_{\text{logConnection}}\})$$
$$\delta(s_{\text{Reconnecting}}, e_{\text{MAX\_RETRIES}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$$
$$\delta(s_{\text{Reconnecting}}, e_{\text{TERMINATE}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$$

5. Disconnecting State Transitions:
$$\delta(s_{\text{Disconnecting}}, e_{\text{CLOSE}}) = (s_{\text{Disconnected}}, \{\gamma_{\text{logConnection}}\})$$
$$\delta(s_{\text{Disconnecting}}, e_{\text{ERROR}}) = (s_{\text{Disconnected}}, \{\gamma_{\text{handleError}}, \gamma_{\text{logConnection}}\})$$
$$\delta(s_{\text{Disconnecting}}, e_{\text{TERMINATE}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$$

6. Terminated State Transitions:
$$\delta(s_{\text{Terminated}}, e) = (s_{\text{Terminated}}, \emptyset) \text{ for all } e \in E$$

For all other state-event pairs $(s,e)$ not explicitly defined above, the transition is undefined:
$$\delta(s,e) = \bot$$

When a transition is undefined, the error recovery function is invoked:
$$\delta(s,e) = \bot \implies R(s,e,c) \text{ is called}$$

#### 2.8.1 State Transition Properties

The following properties must hold for all transitions defined by $\delta$:

1. Transition Determinism:
   $$\forall s \in S, e \in E: |\{(s', \Gamma') \mid \delta(s,e) = (s',\Gamma')\}| \leq 1$$

2. Action Consistency:
   $$\forall s \in S, e \in E, \Gamma': \delta(s,e) = (s',\Gamma') \implies \begin{cases}
   e \in E_c \implies \exists \gamma \in \Gamma' \cap \Gamma_c \\
   e \in E_d \implies \exists \gamma \in \Gamma' \cap \Gamma_d
   \end{cases}$$

3. Socket State Preservation:
   $$\forall s,s' \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies \sigma(s', c.properties.socket) = c.properties.readyState$$

4. Error Transition Safety:
   $$\forall s \in S \setminus \{s_{\text{Terminated}}\}: \delta(s,e_{\text{ERROR}}) = (s',\Gamma') \implies \begin{cases}
   \gamma_{\text{handleError}} \in \Gamma' \\
   c'.properties.status = \text{error} \\
   c'.properties.socket = \emptyset
   \end{cases}$$

5. Connection State Monotonicity:
   $$\forall s_1, s_2, s_3 \in S: s_1 \xrightarrow{e_1} s_2 \xrightarrow{e_2} s_3 \implies \begin{cases}
   s_2 = s_{\text{Disconnected}} \implies s_1 \neq s_{\text{Connected}} \lor e_1 = e_{\text{CLOSE}} \\
   s_2 = s_{\text{Connected}} \implies s_1 = s_{\text{Connecting}} \land e_1 = e_{\text{OPEN}}
   \end{cases}$$

6. Retry Limit Enforcement:
   $$\forall s \in S: c.metrics.reconnectAttempts > \text{MAX\_RETRIES} \implies \delta(s,e_{\text{RETRY}}) = \bot$$

7. Rate Limit Compliance:
   $$\forall s \in S, e \in E_d: \delta(s,e) = (s',\Gamma') \implies \gamma_{\text{enforceRateLimit}} \in \Gamma'$$

8. Termination Irreversibility:
   $$\forall s \in F, e \in E, s' \in S: \delta(s,e) = (s',\Gamma') \implies s' \in F$$

9. State-Action Consistency:
   $$\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies \begin{cases}
   s' = s_{\text{Connected}} \implies \exists \gamma \in \Gamma': \gamma \in \Gamma_c \\
   s' = s_{\text{Disconnected}} \implies \exists \gamma \in \Gamma': \gamma = \gamma_{\text{logConnection}}
   \end{cases}$$

10. Event Processing Guarantees:
    $$\forall s \in S, e \in E: \delta(s,e) \neq \bot \implies \begin{cases}
    \text{exactly one state transition occurs} \\
    \text{all actions in } \Gamma' \text{ are executed} \\
    \text{context is updated atomically}
    \end{cases}$$

### 2.9 State-Specific Invariants

For each state $s \in S$, the following invariants must hold:

$$s = s_{\text{Disconnected}} \implies \begin{cases}
c.properties.socket = \emptyset \\
c.properties.status = \text{disconnected} \\
c.metrics.reconnectAttempts = 0 \\
\sigma(s, c.properties.socket) = 3
\end{cases}$$

$$s = s_{\text{Connected}} \implies \begin{cases}
c.properties.socket \neq \emptyset \\
c.properties.status = \text{connected} \\
c.timing.connectTime \neq \emptyset \\
\sigma(s, c.properties.socket) = 1
\end{cases}$$

$$s = s_{\text{Reconnecting}} \implies \begin{cases}
c.properties.socket = \emptyset \\
c.properties.status = \text{error} \\
c.metrics.reconnectAttempts > 0 \\
\sigma(s, c.properties.socket) = 3
\end{cases}$$

### 2.10 Window Expiry and Rate Limiting

#### 2.10.1. Window Definition and Properties

A rate limiting window $w \in \mathbb{W}\text{in}$ must maintain the following properties:

1. Time Bounds:
   $$\forall w \in \mathbb{W}\text{in}: now() - w.start \leq w.duration$$

2. Count Invariant:
   $$\forall w \in \mathbb{W}\text{in}: w.count \leq w.limit$$

3. Window Reset Condition:
   $$windowExpired(w) \iff now() > w.start + w.duration$$

#### 2.10.2. Rate Limiting Behavior

The rate limiting mechanism enforces the following rules:

1. Message Acceptance Rule:
   ```
   For any message m:
   Accept m iff:
   1. ¬windowExpired(w) ∧ w.count < w.limit
   OR
   2. windowExpired(w) ∧ new window can be started
   ```

2. Window Creation:
   ```
   When windowExpired(w):
   w' = (
     start: now(),
     duration: RATE_LIMIT_WINDOW,
     count: 1,
     limit: MAX_MESSAGES_PER_WINDOW
   )
   ```

3. Window Update:
   ```
   When ¬windowExpired(w):
   w' = (
     start: w.start,
     duration: w.duration,
     count: w.count + 1,
     limit: w.limit
   )
   ```

#### 2.10.3. Integration with Actions

1. Rate Limit Enforcement:
   ```
   γ_enforceRateLimit(c, e) = c' where:
   
   if windowExpired(c.window):
     c'.window = newWindow()
   else if c.window.count >= c.window.limit:
     return R(s, e, c)  // Invoke error recovery
   else:
     c'.window = updateWindow(c.window)
   ```

2. Window State Transitions:
   ```
   For any state s where δ(s, e) = (s', Γ'):
   1. If e ∈ E_d then γ_enforceRateLimit ∈ Γ'
   2. Window state is updated before message processing
   3. Window constraints are checked atomically
   ```

#### 2.10.4. Error Handling

1. Rate Limit Violations:
   ```
   When w.count = w.limit:
   1. Further messages in current window are rejected
   2. Error recovery is invoked with specific error:
      e_ERROR with metadata "RATE_LIMIT_EXCEEDED"
   3. Window statistics are logged
   ```

2. Recovery Behavior:
   ```
   After rate limit violation:
   1. Current window must expire naturally
   2. No new messages accepted until window expiry
   3. Exponential backoff may be applied to new windows
   ```

#### 2.10.5. Window Properties Preservation

The following invariants must be maintained across all operations:

1. Time Monotonicity:
   $$\forall w_1, w_2 \in \mathbb{W}\text{in}: w_2 \text{ succeeds } w_1 \implies w_2.start > w_1.start$$

2. Count Accuracy:
   $$w.count = |\{m \in \mathbb{M} \mid w.start \leq t(m) \leq now() \land t(m) < w.start + w.duration\}|$$

3. Limit Consistency:
   $$\forall w \in \mathbb{W}\text{in}: w.limit = \text{MAX\_MESSAGES\_PER\_WINDOW}$$

4. Duration Consistency:
   $$\forall w \in \mathbb{W}\text{in}: w.duration = \text{RATE\_LIMIT\_WINDOW}$$

#### 2.10.6. Implementation Requirements

Implementations must:
1. Process window expiry checks atomically
2. Maintain accurate message counts
3. Handle clock skew gracefully
4. Document any additional rate limiting strategies
5. Provide monitoring and metrics for rate limiting

## 3. Machine Properties

### 3.1 Structural Properties

1. Completeness:
   $$\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \lor \delta(s,e) = \bot \land R(s,e,c) \text{ is defined}$$

2. Determinism:
   $$\forall s \in S, e \in E: |\{s' \mid \exists \Gamma': \delta(s,e) = (s',\Gamma')\}| \leq 1$$

3. Action Composition:
   $$\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies A(\Gamma',c) \text{ is well-defined}$$

4. State Reachability:
   $$\forall s \in S \setminus \{s_0\}: \exists \text{ sequence } (e_1,...,e_n) \in E^n: s_0 \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s$$
   where $s_i \xrightarrow{e} s_j$ denotes $\delta(s_i,e) = (s_j,\Gamma')$ for some $\Gamma'$

5. Termination:
   $$\forall s \in S \setminus F: \exists \text{ sequence } (e_1,...,e_n) \in E^n: s \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s_f$$
   where $s_f \in F$

### 3.2 Time Properties

1. Monotonicity:
   $$\forall t_1, t_2 \in \mathbb{T}: t_1 < t_2 \implies now(t_1) < now(t_2)$$

2. Bounded Delay:
   $$\forall e \in E: now() - e.timestamp \leq \text{MAX\_EVENT\_DELAY}$$

3. Ordered Events:
   $$\forall e_1, e_2 \in E: e_1 \text{ processed before } e_2 \implies e_1.timestamp \leq e_2.timestamp$$

4. Timing Constraints:
   $$\forall s \in S: s = s_{\text{Connected}} \implies now() - c.timing.lastPingTime \leq \text{MAX\_PING\_INTERVAL}$$
   
   $$\forall e_{\text{PONG}} \in E_d: now() - c.timing.lastPingTime \leq \text{MAX\_PONG\_DELAY}$$

### 3.3 Context Properties

1. Type Safety:
   $$\forall \gamma \in \Gamma, c \in C, e \in E: \begin{cases}
     type(\gamma(c,e)) = type(c) \\
     \forall x \in c: type(x) \text{ preserved in } \gamma(c,e)
   \end{cases}$$

2. Value Constraints:
   $$\forall c \in C: \begin{cases}
     \forall v \in c.metrics: v \in \mathbb{N} \\
     \forall t \in c.timing: t \in \mathbb{T} \cup \{\emptyset\} \\
     c.metrics.reconnectAttempts \leq \text{MAX\_RETRIES} \\
     c.window.count \leq c.window.limit
   \end{cases}$$

3. Socket State Consistency:
   $$\forall c \in C: c.properties.socket \neq \emptyset \implies \sigma(s, c.properties.socket) = c.properties.readyState$$

### 3.4 Action Properties

1. Purity:
   $$\forall \gamma \in \Gamma, c_1, c_2 \in C, e \in E: c_1 = c_2 \implies \gamma(c_1,e) = \gamma(c_2,e)$$

2. Composition:
   $$\forall \gamma_1, \gamma_2 \in \Gamma, c \in C, e \in E: \gamma_1(\gamma_2(c,e),e) = \gamma_2(\gamma_1(c,e),e)$$

3. Error Safety:
   $$\forall \gamma \in \Gamma_e, c \in C, e \in E: type(\gamma(c,e)) = type(c)$$

### 3.5 Message Properties

1. Ordering:
   $$\forall m_1, m_2 \in \mathbb{M}: t(m_1) < t(m_2) \implies order(m_1) < order(m_2)$$

2. Rate Limiting:
   $$\forall w \in \mathbb{W}\text{in}: currentWindowCount(w) \leq w.limit$$

3. Delivery Guarantees:
   For any connected state where $\delta(s_{\text{Connected}}, e_{\text{SEND}}) = (s_{\text{Connected}}, \Gamma')$:
   $$\exists e_{\text{MESSAGE}} \in E_d: e_{\text{MESSAGE}}.payload = e_{\text{SEND}}.payload \lor R(s,e,c) \text{ is called}$$

### 3.6 Error Recovery Properties

1. Type Preservation:
   $$\forall s \in S, e \in E, c \in C: type(R(s,e,c)) = type(c)$$

2. State Consistency:
   $$\forall s \in S, e \in E, c \in C: R(s,e,c).properties.status \in \mathbb{K}$$

3. Recovery Bounds:
   $$\forall s \in S \setminus F: |\{e \in E \mid \delta(s,e) = \bot\}| \leq \text{MAX\_ERRORS\_PER\_STATE}$$

4. Progress Guarantee:
   $$\exists \text{ sequence } (e_1,...,e_n) \in E^n: R(s,e,c) \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s'$$
   where $s'$ is a valid state

### 3.7 System Invariants

1. Socket Uniqueness:
   $$\forall c \in C: |\{s \in S \mid c.properties.socket \neq \emptyset\}| \leq 1$$

2. State-Status Consistency:
   $$\forall s \in S, c \in C: \begin{cases}
     s = s_{\text{Connected}} \implies c.properties.status = \text{connected} \\
     s = s_{\text{Terminated}} \implies c.properties.status = \text{disconnected} \\
     s = s_{\text{Reconnecting}} \implies c.properties.status = \text{error}
   \end{cases}$$

3. Termination Consistency:
   $$\forall s \in F, e \in E: \delta(s,e) = (s,\emptyset) \lor \delta(s,e) = \bot$$

