# WebSocket Machine Formal Specification {#websocket-spec}

## 1. Mathematical Foundations {#math-foundations}

### 1.1 Set Theory Foundations {#set-theory}

For any set $A$, its power set $\mathfrak{P}(A)$ is defined as:
$$\mathfrak{P}(A) = \{B \mid B \subseteq A\}$$

For sets $A$ and $B$, their Cartesian product $A \times B$ is defined as:
$$A \times B = \{(a,b) \mid a \in A \land b \in B\}$$

### 1.2 Basic Domains {#basic-domains}

Let $\Sigma$ be a finite alphabet. The basic mathematical domains used throughout the specification are:

- Boolean domain: $\mathbb{B} = \{\text{true}, \text{false}\}$
- Natural numbers: $\mathbb{N} = \{n \in \mathbb{Z} \mid n \geq 0\}$
- Positive real numbers: $\mathbb{R}^+ = \{r \in \mathbb{R} \mid r > 0\}$
- String domain: $\mathbb{S} = \Sigma^* = \bigcup_{n=0}^{\infty} \Sigma^n$ where $\Sigma^n$ is the set of all sequences of length n over $\Sigma$
- Binary data: $\mathbb{D} = \{0,1\}^*$ (finite sequences of bits)

### 1.3 Internal Socket States {#socket-states}

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

### 1.4 WebSocket Domain {#websocket-domain}

The WebSocket domain $\mathbb{W}$ is defined as:
$$\mathbb{W} = \mathbb{D} \times \mathbb{S} \times \mathbb{I}$$

where elements are triples of (buffer, protocol, internalState)

### 1.5 Connection Status {#connection-status}

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

### 1.6 Time Domain {#time-domain}

Time is represented as milliseconds since Unix epoch:
$$\mathbb{T} = \{t \in \mathbb{R}^+ \mid t \geq 1672531200000\}$$

The time domain has the following properties:
1. Monotonicity: $\forall t_1, t_2 \in \mathbb{T}: t_1 < t_2 \implies now(t_1) < now(t_2)$
2. Continuity: $\forall t_1, t_2 \in \mathbb{T}: t_1 < t_2 \implies \exists t_3 \in \mathbb{T}: t_1 < t_3 < t_2$
3. Bounded delay: $\forall t \in \mathbb{T}: now(t) - t \leq \text{MAX\_DELAY}$ where $\text{MAX\_DELAY}$ is implementation-defined
4. Window compatibility: $\forall w \in \mathbb{W}\text{in}: w.start \in \mathbb{T} \land w.start + w.duration \in \mathbb{T}$

The current time function is defined as:
$$now: \emptyset \rightarrow \mathbb{T}$$
where $now()$ returns the current Unix timestamp in milliseconds.

### 1.7 Window Domain {#window-domain}

A time window $w$ is defined as a tuple:
$$w = (start: \mathbb{T}, duration: \mathbb{R}^+, count: \mathbb{N}, limit: \mathbb{N})$$

The set of all windows $\mathbb{W}\text{in}$ is defined as:
$$\mathbb{W}\text{in} = \mathbb{T} \times \mathbb{R}^+ \times \mathbb{N} \times \mathbb{N}$$

(See [Rate Limiting Specification](#rate-limiting) for detailed window behavior and properties)

### 1.8 Message Domain {#message-domain}

A Message $m$ is formally defined as a 4-tuple:
$$m = (id: \mathbb{N}, data: \mathbb{D}, metadata: \mathbb{S}, timestamp: \mathbb{T})$$

The set of all possible messages $\mathbb{M}$ is defined as:
$$\mathbb{M} = \mathbb{N} \times \mathbb{D} \times \mathbb{S} \times \mathbb{T}$$

### 1.9 Auxiliary Functions {#auxiliary-functions}

Time function:
$$t: \mathbb{M} \rightarrow \mathbb{T}, \text{ where } t(m) = m.timestamp$$

Order function:
$$order: \mathbb{M} \rightarrow \mathbb{N}, \text{ where } order(m) = m.id$$

Size function:
$$size: \mathbb{D} \rightarrow \mathbb{N}, \text{ where } size(d) = |d|$$

Window count function:
$$currentWindowCount: \mathbb{W}\text{in} \rightarrow \mathbb{N}$$
$$currentWindowCount(w) = |\{m \in \mathbb{M} \mid w.start \leq t(m) \leq w.start + w.duration\}|$$
(See [Window Properties](#window-properties) for complete window count requirements)

Window expiry function:
$$windowExpired: \mathbb{W}\text{in} \rightarrow \mathbb{B}$$
$$windowExpired(w) = now() > w.start + w.duration$$
(See [Window Expiry](#window-expiry) for complete expiry properties)

Type function:
$$type: D \to T$$
where
$$D = \mathbb{B} \cup \mathbb{N} \cup \mathbb{R}^+ \cup \mathbb{S} \cup \mathbb{D} \cup \mathbb{W} \cup \mathbb{K} \cup \mathbb{T} \cup \mathbb{W}\text{in} \cup \mathbb{M}$$
$$T = \{\mathbb{B}, \mathbb{N}, \mathbb{R}^+, \mathbb{S}, \mathbb{D}, \mathbb{W}, \mathbb{K}, \mathbb{T}, \mathbb{W}\text{in}, \mathbb{M}\}$$

Edge cases:
1. $type(\emptyset) = \bot$
2. $type(undefined) = \bot$
3. $\forall s \in S: type(s) = type(S)$

Message ordering relation:
For any $m_1, m_2 \in \mathbb{M}$:
$$m_1 < m_2 \iff (t(m_1) < t(m_2)) \lor (t(m_1) = t(m_2) \land order(m_1) < order(m_2))$$

### 1.10 Implementation-Defined Constants {#implementation-constants}

1. Time Constants $\mathbb{C}_{\text{time}}$:

    $
    \mathbb{C}_{\text{time}} = \scriptsize\left\{
      \begin{align*}
      &\text{MAX_DELAY} \in \mathbb{N} \mid 1000 \leq \text{MAX_DELAY} \leq 5000,\\
      &\text{RTT_TIMEOUT} \in \mathbb{N} \mid 100 \leq \text{RTT_TIMEOUT} \leq 1000,\\
      &\text{MAX_PING_INTERVAL} \in \mathbb{N} \mid 15000 \leq \text{MAX_PING_INTERVAL} \leq 60000, \\
      &\text{MAX_PONG_DELAY} \in \mathbb{N} \mid 1000 \leq \text{MAX_PONG_DELAY}\leq 10000
      \end{align*}
    \right\}
    $

    Default values:
    - $\scriptsize\text{MAX_DELAY} = 3000$
    - $\scriptsize\text{RTT_TIMEOUT} = 500$
    - $\scriptsize\text{MAX_PING_INTERVAL} = 30000$
    - $\scriptsize\text{MAX_PONG_DELAY} = 5000$

    Constraints:
    - $\scriptsize\text{RTT_TIMEOUT} < \text{MAX_DELAY}$
    - $\scriptsize\text{MAX_PING\_INTERVAL} > 2 \cdot\text{MAX_DELAY}$
    - $\scriptsize\text{MAX_PONG\_DELAY} > \text{MAX_DELAY}$

2. Retry Constants $\mathbb{C}_{\text{retry}}$:

    $\mathbb{C}_{\text{retry}} = \scriptsize\left\{
      \begin{align*}
      &\text{MAX_RETRIES} \in \mathbb{N} \mid 3 \leq \text{MAX_RETRIES} \leq 10,\\
      &\text{RETRY_BACKOFF_BASE} \in \mathbb{R}^+ \mid 1.5 \leq \text{RETRY_BACKOFF_BASE} \leq 3.0,\\
      &\text{MAX_ERRORS_PER_STATE} \in \mathbb{N} \mid 3 \leq \text{MAX_ERRORS_PER_STATE} \leq 10
      \end{align*}
    \right\}$

    Default values:
    - $\scriptsize\text{MAX_RETRIES} = 5$
    - $\scriptsize\text{RETRY_BACKOFF_BASE} = 2.0$
    - $\scriptsize\text{MAX_ERRORS_PER_STATE} = 5$

    Constraints:
    - $\scriptsize\text{MAX_ERRORS_PER\_STATE} \leq \text{MAX_RETRIES}$

3. Rate Limiting Constants $\mathbb{C}_{\text{rate}}$:

    $
    \mathbb{C}_{\text{rate}} = \scriptsize\left\{
      \begin{align*}
      &\text{RATE_LIMIT_WINDOW} \in \mathbb{N} \mid 1000 \leq \text{RATE_LIMIT_WINDOW} \leq 60000, \\
      &\text{MAX_MESSAGES_PER_WINDOW} \in \mathbb{N} \mid 100 \leq \text{MAX_MESSAGES_PER_WINDOW} \leq 1000,\\
      &\text{MAX_BYTES_PER_MESSAGE} \in \mathbb{N} \mid 1024 \leq \text{MAX_BYTES_PER_MESSAGE} \leq 1048576
      \end{align*}
    \right\}
    $

    Default values:
    - $\scriptsize\text{RATE_LIMIT_WINDOW} = 10000$
    - $\scriptsize\text{MAX_MESSAGES_PER_WINDOW} = 500$
    - $\scriptsize\text{MAX_BYTES_PER_MESSAGE} = 65536$

    Constraints:
    - $\scriptsize\text{RATE_LIMIT_WINDOW} > \text{MAX_DELAY}$

4. Buffer Constants $\mathbb{C}_{\text{buffer}}$:

    $
    \mathbb{C}_{\text{buffer}} = \scriptsize\left\{
      \begin{align*}
      &\text{MAX_QUEUE_SIZE} \in \mathbb{N} \mid 100 \leq \text{MAX_QUEUE_SIZE} \leq 10000,\\
      &\text{MAX_BUFFER_SIZE} \in \mathbb{N} \mid 1048576 \leq \text{MAX_BUFFER_SIZE} \leq 16777216
      \end{align*}
    \right\}
    $

    Default values:
    - $\scriptsize\text{MAX_QUEUE_SIZE} = 1000$
    - $\scriptsize\text{MAX_BUFFER_SIZE} = 4194304$

    Constraints:
    - $\scriptsize\text{MAX_BUFFER_SIZE} > \text{MAX_BYTES_PER_MESSAGE}$

5. Cross-Cutting Constraints:

1. $\scriptsize\text{RETRY_BACKOFF_BASE}^{\text{MAX_RETRIES}} \cdot \text{RTT_TIMEOUT} < 3600000$ (1 hour)
2. $\scriptsize\text{MAX_MESSAGES_PER_WINDOW} \cdot \text{MAX_BYTES_PER_MESSAGE} < \text{MAX_BUFFER_SIZE}$
3. $\scriptsize\text{MAX_QUEUE_SIZE} \cdot \text{MAX_BYTES_PER_MESSAGE} < \text{MAX_BUFFER_SIZE}$
4. $\scriptsize\text{MAX_PING_INTERVAL} > 2 \cdot \text{MAX_PONG_DELAY}$


Implementation Requirements:
1. All constants must be defined within their specified ranges
2. All constraints must be validated at initialization time
3. Any implementation-specific constants must be documented
4. All cross-cutting constraints must be maintained throughout operation

## 2. State Machine Definition {#state-machine}

### 2.1 Basic Machine {#basic-machine}

A WebSocket Machine is formally defined as a 9-tuple:

$$\mathfrak{M} = (S, E, \delta, s_0, C, \Gamma, F, A, R)$$

Where:
- $S$ is the finite set of states
- $E$ is the finite set of events
- $\delta: S \times E \rightarrow (S \times \mathfrak{P}(\Gamma)) \cup \{\bot\}$ is the transition function
- $s_0 \in S$ is the initial state
- $C$ is the context structure (defined in [Context](#context))
- $\Gamma$ is the set of actions
- $F \subseteq S$ is the set of final states
- $A: \mathfrak{P}(\Gamma) \times C \rightarrow C$ is the action application function
- $R: S \times E \times C \rightarrow C$ is the error recovery function

### 2.2 States ($S$) {#states}

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

### 2.3 Events ($E$) {#events}

The event set $E$ is defined as the union of control events $E_c$ and data events $E_d$:

$$E = E_c \cup E_d$$

Control Events:
$$E_c = \{e_{\text{CONNECT}}, e_{\text{DISCONNECT}}, e_{\text{OPEN}}, e_{\text{CLOSE}}, e_{\text{ERROR}}, e_{\text{RETRY}}, e_{\text{MAX\_RETRIES}}, e_{\text{TERMINATE}}\}$$

Data Events:
$$E_d = \{e_{\text{MESSAGE}}, e_{\text{SEND}}, e_{\text{PING}}, e_{\text{PONG}}\}$$

Each event $e \in E$ is a tuple:
$$e = (type: E_c \cup E_d, payload: \mathbb{D} \cup \{\emptyset\}, metadata: \mathbb{S} \cup \{\emptyset\}, timestamp: \mathbb{T}, error: \mathbb{S} \cup \{\emptyset\})$$

The error field is non-empty if and only if $type = e_{\text{ERROR}}$.

Event ordering relation:
$$e_1 < e_2 \iff e_1.timestamp < e_2.timestamp$$

### 2.4 Context ($C$) {#context}

The context is defined as a record structure:

$$C = \{properties: P, metrics: V, timing: T, window: \mathbb{W}\text{in} \cup \{\emptyset\}\}$$

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

Context Invariants:
1. Window-Status Consistency: $c.properties.status = \text{connected} \implies c.window \neq \emptyset$
2. Socket-Window Consistency: $c.window \neq \emptyset \implies c.properties.socket \neq \emptyset$
3. Metric Monotonicity: For any context transition $c \rightarrow c'$, all metrics must be non-decreasing:
   $$\forall m \in V: c'.metrics[m] \geq c.metrics[m]$$

### 2.5 Actions ($\Gamma$) {#actions}

Actions are pure functions that transform context:

$$\Gamma: C \times E \rightarrow C$$

The set of actions $\Gamma$ is defined as:

$$\Gamma = \Gamma_c \cup \Gamma_d \cup \Gamma_e$$

Control Actions ($\Gamma_c$):
$$\Gamma_c = \{\gamma_{\text{storeUrl}}, \gamma_{\text{resetRetries}}, \gamma_{\text{incrementRetries}}, \gamma_{\text{logConnection}}, \gamma_{\text{forceTerminate}}\}$$

Data Actions ($\Gamma_d$):
$$\Gamma_d = \{\gamma_{\text{processMessage}}, \gamma_{\text{sendMessage}}, \gamma_{\text{handlePing}}, \gamma_{\text{handlePong}}, \gamma_{\text{enforceRateLimit}}\}$$
(See [Rate Limiting Integration](#rate-limiting-integration) for rate limit enforcement behavior)

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

$$\gamma_{\text{enforceRateLimit}}(c, e) = c' \text{ where } \begin{cases}
\text{pre: } c.window \neq \emptyset \\
\text{post: } \begin{cases}
windowExpired(c.window) \implies c'.window = newWindow() \\
\neg windowExpired(c.window) \land c.window.count < c.window.limit \implies \\
\quad c'.window = updateWindow(c.window) \\
\neg windowExpired(c.window) \land c.window.count \geq c.window.limit \implies \\
\quad R(s, e, c) \text{ is called}
\end{cases}
\end{cases}$$

### 2.6 Action Application ($A$) {#action-application}

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

### 2.7 Error Recovery ($R$) {#error-recovery}

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

### 2.8 State Transition Function ($\delta$) {#state-transitions}

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

I'll provide the complete updated section 2.8.1 State Transition Properties:

#### 2.8.1 State Transition Properties {#transition-properties}

The following properties must hold for all transitions defined by $\delta$:

1. Transition Determinism:
   $$\forall s \in S, e \in E: |\{(s', \Gamma') \mid \delta(s,e) = (s',\Gamma')\}| \leq 1$$

2. Action Type Safety:
   $$\forall s \in S, e \in E, \Gamma': \delta(s,e) = (s',\Gamma') \implies \begin{cases}
   \forall \gamma \in \Gamma': type(\gamma) \in \{\Gamma_c, \Gamma_d, \Gamma_e\} \\
   \forall x \in c: type(x) \text{ preserved in } \gamma(c,e)
   \end{cases}$$

3. Action Consistency:
   $$\forall s \in S, e \in E, \Gamma': \delta(s,e) = (s',\Gamma') \implies \begin{cases}
   e \in E_c \implies \exists \gamma \in \Gamma' \cap \Gamma_c \\
   e \in E_d \implies \exists \gamma \in \Gamma' \cap \Gamma_d
   \end{cases}$$

4. Socket State Preservation:
   $$\forall s,s' \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies \sigma(s', c.properties.socket) = c.properties.readyState$$

5. Error Handling:
   $
   \begin{align*}
   \forall &s \in S \setminus \{s_{Terminated}\}: \delta(s,e_{ERROR}) = (s',\Gamma') \implies \\
   &1.\ \gamma_{handleError} \in \Gamma' \\
   &2.\ c'.properties.status = error \\
   &3.\ c'.properties.socket = \emptyset \\
   &4.\ c'.metrics.errorCount = c.metrics.errorCount + 1 \\
   &5.\ c'.timing.lastError = now()
   \end{align*}
   $

6. State Monotonicity:
   $
   \begin{align*}
   \forall &s_1,s_2,s_3 \in S: s_1 \xrightarrow{e_1} s_2 \xrightarrow{e_2} s_3 \implies \\
   &1.\ s_2 = s_{Disconnected} \implies s_1 \neq s_{Connected} \lor e_1 = e_{CLOSE} \\
   &2.\ s_2 = s_{Connected} \implies s_1 = s_{Connecting} \land e_1 = e_{OPEN} \\
   &3.\ s_3 = s_{Terminated} \implies s_2 \in \{s_{Disconnecting}, s_{Reconnecting}\} \\
   &4.\ s_2 = s_{Reconnecting} \implies s_1.metrics.reconnectAttempts < \text{MAX\_RETRIES}
   \end{align*}
   $

7. Retry Limit Enforcement:
   $$\forall s \in S: c.metrics.reconnectAttempts > \text{MAX\_RETRIES} \implies \delta(s,e_{\text{RETRY}}) = \bot$$

8. Rate Limit Compliance:
   $$\forall s \in S, e \in E_d: \delta(s,e) = (s',\Gamma') \implies \gamma_{\text{enforceRateLimit}} \in \Gamma'$$

9. Termination Irreversibility:
   $$\forall s \in F, e \in E, s' \in S: \delta(s,e) = (s',\Gamma') \implies s' \in F$$

10. State-Action Consistency:
    $$\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies \begin{cases}
    s' = s_{\text{Connected}} \implies \exists \gamma \in \Gamma': \gamma \in \Gamma_c \\
    s' = s_{\text{Disconnected}} \implies \exists \gamma \in \Gamma': \gamma = \gamma_{\text{logConnection}}
    \end{cases}$$

11. Event Processing Guarantees:
    $$\forall s \in S, e \in E: \delta(s,e) \neq \bot \implies \begin{cases}
    \text{exactly one state transition occurs} \\
    \text{all actions in } \Gamma' \text{ are executed} \\
    \text{context is updated atomically}
    \end{cases}$$

12. Rate Limit Integration:
    $$\forall s \in S, e \in E_d: \delta(s,e) = (s',\Gamma') \implies \begin{cases}
    \gamma_{\text{enforceRateLimit}} \in \Gamma' \\
    accept(m_e, c.window) = \text{true}
    \end{cases}$$
    
    where $m_e$ is the message associated with event $e$

#### 2.8.2 Action Consistency
Action consistency property is formally defined as:

$\forall s \in S, e \in E, \Gamma': \delta(s,e) = (s',\Gamma') \implies$

  1. $|\Gamma'| \geq 1$
  2. $\forall \gamma \in \Gamma': type(\gamma) \in \{\Gamma_c, \Gamma_d, \Gamma_e\}$
  3. $e \in E_c \implies \exists \gamma \in \Gamma' \cap \Gamma_c$
  4. $e \in E_d \implies \exists \gamma \in \Gamma' \cap \Gamma_d$
  5. $e = e_{ERROR} \implies \exists \gamma \in \Gamma' \cap \Gamma_e$

### 2.9 State-Specific Invariants {#state-invariants}

For each state $s \in S$, the following invariants must hold:

$$s = s_{\text{Disconnected}} \implies \begin{cases}
c.properties.socket = \emptyset \\
c.properties.status = \text{disconnected} \\
c.metrics.reconnectAttempts = 0 \\
\sigma(s, c.properties.socket) = 3 \\
c.window = \emptyset
\end{cases}$$

$$s = s_{\text{Connected}} \implies \begin{cases}
c.properties.socket \neq \emptyset \\
c.properties.status = \text{connected} \\
c.timing.connectTime \neq \emptyset \\
\sigma(s, c.properties.socket) = 1 \\
c.window \neq \emptyset
\end{cases}$$

$$s = s_{\text{Reconnecting}} \implies \begin{cases}
c.properties.socket = \emptyset \\
c.properties.status = \text{error} \\
c.metrics.reconnectAttempts > 0 \\
\sigma(s, c.properties.socket) = 3 \\
c.window = \emptyset
\end{cases}$$

### 2.10 Window Expiry and Rate Limiting {#rate-limiting}

#### 2.10.1 Window Definition and Properties {#window-expiry}

A rate limiting window $w \in \mathbb{W}\text{in}$ must maintain the following properties:

1. Time Bounds:
   $$\forall w \in \mathbb{W}\text{in}: now() - w.start \leq w.duration$$

2. Count Invariant:
   $$\forall w \in \mathbb{W}\text{in}: w.count \leq w.limit$$

3. Window Reset Condition:
   $$windowExpired(w) \iff now() > w.start + w.duration$$

4. Window Succession:
   Define window succession relation $\prec$ on $\mathbb{W}\text{in}$:
   $$w_1 \prec w_2 \iff w_1.start + w_1.duration < w_2.start$$

   $
   \begin{align*}
      \forall &w_1,w_2 \in \mathbb{W}\text{in}: w_1 \prec w_2 \iff \\
      &\text{1.}\ w_1.start + w_1.duration < w_2.start \\
      &2.\ w_1.count = w_1.limit \lor windowExpired(w_1) \\
      &3.\ w_2.count = 0 \\
      &4.\ now() - w_2.start \leq \scriptsize\text{MAX\_WINDOW\_LIFETIME} \\
   \end{align*}
   $

   With properties:
   - Transitivity: $w_1 \prec w_2 \land w_2 \prec w_3 \implies w_1 \prec w_3$
   - Irreflexivity: $\neg(w \prec w)$
   - Asymmetry: $w_1 \prec w_2 \implies \neg(w_2 \prec w_1)$

#### 2.10.2 Rate Limiting Behavior {#rate-limiting-behavior}

The rate limiting mechanism enforces the following rules:

1. Message Acceptance Rule:
    - $accept: \mathbb{M} \times \mathbb{W}\text{in} \to \mathbb{B}$
    - for $m\in\mathbb{M}$ and $w\in\mathbb{W}\text{in}$,
      $
      \begin{align*}
      accept(m,w) &\iff \\
      &(\neg windowExpired(w) \land w.count < w.limit) \lor\\
      &(windowExpired(w) \land \nexists m' \in \mathbb{M}: t(m') >\\
      & w.start + w.duration)
      \end{align*}
      $

2. Window State Rules:
    $\forall w \in \mathbb{W}\text{in}$, the following properties must hold:
    - $w.count \leq w.limit$
    - $now() - w.start \leq w.duration$
    - $\forall m \in \mathbb{M}: accept(m,w) \implies t(m) \geq w.start$

3. Rate Limits:
    $$\forall w \in \mathbb{W}\text{in}, s \in S: \begin{cases}
    s = s_{Connected} \implies w.limit = \scriptsize\text{MAX_MESSAGES_PER_WINDOW} \\
    w.duration = \scriptsize\text{RATE_LIMIT_WINDOW}
    \end{cases}$$

4. Window Transitions:
    $$nextWindow: \mathbb{W}\text{in} \to \mathbb{W}\text{in}$$
    $$
    nextWindow(w) = \begin{cases}
    newWindow() & \text{if } windowExpired(w) \\
    updateWindow(w) & \text{if } w.count < w.limit \\
    \bot & \text{otherwise}
    \end{cases}
    $$

#### 2.10.3 Integration with Actions {#rate-limiting-integration}

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
   For any state $s$ where $\delta(s, e) = (s', \Gamma')$:
   1. If $e \in E_d$ then $\gamma_{\text{enforceRateLimit}} \in \Gamma'$
   2. Window state is updated before message processing
   3. Window constraints are checked atomically

#### 2.10.4 Error Handling {#rate-limiting-errors}

1. Rate Limit Violations:
   When $w.count = w.limit$:
   - Further messages in current window are rejected
   - Error recovery is invoked with specific error: $e_{\text{ERROR}}$ with metadata "RATE_LIMIT_EXCEEDED"
   - Window statistics are logged

2. Recovery Behavior:
   After rate limit violation:
   - Current window must expire naturally
   - No new messages accepted until window expiry
   - Exponential backoff may be applied to new windows

#### 2.10.5 Window Properties Preservation {#window-properties}

The following invariants must be maintained across all operations:

1. Time Monotonicity:
   $$\forall w_1, w_2 \in \mathbb{W}\text{in}: w_2 \text{ succeeds } w_1 \implies w_2.start > w_1.start$$

2. Count Accuracy:
   $$w.count = |\{m \in \mathbb{M} \mid w.start \leq t(m) \leq now() \land t(m) < w.start + w.duration\}|$$

3. Limit Consistency:
   $$\forall w \in \mathbb{W}\text{in}: w.limit = \text{MAX\_MESSAGES\_PER\_WINDOW}$$

4. Duration Consistency:
   $$\forall w \in \mathbb{W}\text{in}: w.duration = \text{RATE\_LIMIT\_WINDOW}$$

#### 2.10.6 Implementation Requirements {#rate-limiting-implementation}

Implementations must:
1. Process window expiry checks atomically
2. Maintain accurate message counts
3. Handle clock skew gracefully
4. Document any additional rate limiting strategies
5. Provide monitoring and metrics for rate limiting

## 3. Machine Properties {#machine-properties}

### 3.1 Structural Properties {#structural-properties}

1. Completeness:
   $$\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \lor \delta(s,e) = \bot \land R(s,e,c) \text{ is defined}$$

2. Determinism:
   $$\forall s \in S, e \in E: |\{s' \mid \exists \Gamma': \delta(s,e) = (s',\Gamma')\}| \leq 1$$

3. Action Composition:
   $$\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies A(\Gamma',c) \text{ is well-defined}$$

4. State Reachability:
   $$\forall s \in S \setminus \{s_0\}: \exists \text{ sequence } (e_1,...,e_n) \in E^n: s_0 \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s$$

5. Termination:
   $$\forall s \in S \setminus F: \exists \text{ sequence } (e_1,...,e_n) \in E^n: s \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s_f$$
   where $s_f \in F$

### 3.2 Time Properties {#time-properties}

1. Monotonicity:
   $$\forall t_1, t_2 \in \mathbb{T}: t_1 < t_2 \implies now(t_1) < now(t_2)$$

2. Bounded Delay:
   $$\forall e \in E: now() - e.timestamp \leq \text{MAX\_EVENT\_DELAY}$$

3. Ordered Events:
   $$\forall e_1, e_2 \in E: e_1 \text{ processed before } e_2 \implies e_1.timestamp \leq e_2.timestamp$$

4. Timing Constraints:
   $$\forall s \in S: s = s_{\text{Connected}} \implies now() - c.timing.lastPingTime \leq \text{MAX\_PING\_INTERVAL}$$
   
   $$\forall e_{\text{PONG}} \in E_d: now() - c.timing.lastPingTime \leq \text{MAX\_PONG\_DELAY}$$

5. Window Time Bounds:
   $$\forall w \in \mathbb{W}\text{in}: \begin{cases}
   w.start \leq now() \\
   now() - w.start \leq \text{MAX\_WINDOW\_LIFETIME}
   \end{cases}$$
   
   where $\text{MAX\_WINDOW\_LIFETIME}$ is an implementation-defined constant

### 3.3 Context Properties {#context-properties}

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

### 3.4 Action Properties {#action-properties}

1. Purity:
   $$\forall \gamma \in \Gamma, c_1, c_2 \in C, e \in E: c_1 = c_2 \implies \gamma(c_1,e) = \gamma(c_2,e)$$

2. Composition:
   $$\forall \gamma_1, \gamma_2 \in \Gamma, c \in C, e \in E: \gamma_1(\gamma_2(c,e),e) = \gamma_2(\gamma_1(c,e),e)$$

3. Error Safety:
   $$\forall \gamma \in \Gamma_e, c \in C, e \in E: type(\gamma(c,e)) = type(c)$$

### 3.5 Message Properties {#message-properties}

1. Ordering:
   $$\forall m_1, m_2 \in \mathbb{M}: t(m_1) < t(m_2) \implies order(m_1) < order(m_2)$$

2. Rate Limiting:
   $$\forall w \in \mathbb{W}\text{in}: currentWindowCount(w) \leq w.limit$$

3. Delivery Guarantees:
   For any connected state where $\delta(s_{\text{Connected}}, e_{\text{SEND}}) = (s_{\text{Connected}}, \Gamma')$:
   $$\exists e_{\text{MESSAGE}} \in E_d: e_{\text{MESSAGE}}.payload = e_{\text{SEND}}.payload \lor R(s,e,c) \text{ is called}$$

### 3.6 Error Recovery Properties {#recovery-properties}

1. Type Preservation:
   $$\forall s \in S, e \in E, c \in C: type(R(s,e,c)) = type(c)$$

2. State Consistency:
   $$\forall s \in S, e \in E, c \in C: R(s,e,c).properties.status \in \mathbb{K}$$

3. Recovery Bounds:
   $$\forall s \in S \setminus F: |\{e \in E \mid \delta(s,e) = \bot\}| \leq \text{MAX\_ERRORS\_PER\_STATE}$$

4. Progress Guarantee:
   $$\exists \text{ sequence } (e_1,...,e_n) \in E^n: R(s,e,c) \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s'$$
   where $s'$ is a valid state

### 3.7 System Invariants {#system-invariants}

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
  