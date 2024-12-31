# WebSocket Machine Formal Specification

## 1. Mathematical Foundations

### 1.1 Basic Domains

Let $\Sigma$ be a finite alphabet. The basic mathematical domains used throughout the specification are:

- Boolean domain: $\mathbb{B} = \{\text{true}, \text{false}\}$
- Natural numbers: $\mathbb{N} = \{n \in \mathbb{Z} \mid n \geq 0\}$
- Positive real numbers: $\mathbb{R}^+ = \{r \in \mathbb{R} \mid r > 0\}$
- String domain: $\mathbb{S} = \Sigma^* = \bigcup_{n=0}^{\infty} \Sigma^n$ where $\Sigma^n$ is the set of all sequences of length n over $\Sigma$
- Binary data: $\mathbb{D} = \{0,1\}^*$ (finite sequences of bits)
- WebSocket domain: $\mathbb{W} = \mathbb{D} \times \mathbb{S} \times \mathbb{N}$ where elements are triples of (buffer, protocol, state)
- Connection status: $\mathbb{K} = \{\text{connected}, \text{disconnected}, \text{error}\}$ with no other values permitted

For any set $A$, its power set $\mathfrak{P}(A)$ is defined as:
$$\mathfrak{P}(A) = \{B \mid B \subseteq A\}$$

### 1.2 Time Domain

Time is represented as milliseconds since Unix epoch:
$$\mathbb{T} = \{t \in \mathbb{R}^+ \mid t \geq 1672531200000\}$$

The current time function is defined as:
$$now: \emptyset \rightarrow \mathbb{T}$$
where $now()$ returns the current Unix timestamp in milliseconds.

### 1.3 Window Domain

A time window $w$ is defined as a tuple:
$$w = (start: \mathbb{T}, duration: \mathbb{R}^+, count: \mathbb{N}, limit: \mathbb{N})$$

The set of all windows $\mathbb{W}\text{in}$ is defined as:
$$\mathbb{W}\text{in} = \mathbb{T} \times \mathbb{R}^+ \times \mathbb{N} \times \mathbb{N}$$

### 1.4 Message Domain

A Message $m$ is formally defined as a 4-tuple:
$$m = (id: \mathbb{N}, data: \mathbb{D}, metadata: \mathbb{S}, timestamp: \mathbb{T})$$

The set of all possible messages $\mathbb{M}$ is defined as:
$$\mathbb{M} = \mathbb{N} \times \mathbb{D} \times \mathbb{S} \times \mathbb{T}$$

### 1.5 Auxiliary Functions

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

## 2. State Machine Definition

### 2.1 Basic Machine

A WebSocket Machine is formally defined as an 8-tuple:

$$\mathfrak{M} = (S, E, \delta, s_0, C, \Gamma, F, A)$$

Where:
- $S$ is the finite set of states
- $E$ is the finite set of events
- $\delta: S \times E \rightarrow S \times \mathfrak{P}(\Gamma)$ is the transition function
- $s_0 \in S$ is the initial state
- $C$ is the context structure (defined in 2.4)
- $\Gamma$ is the set of actions
- $F \subseteq S$ is the set of final states
- $A: \mathfrak{P}(\Gamma) \times C \rightarrow C$ is the action application function

### 2.2 States ($S$)

The state set $S$ is defined as:

$$S = \{s_{\text{Disconnected}}, s_{\text{Connecting}}, s_{\text{Connected}}, s_{\text{Reconnecting}}, s_{\text{Disconnecting}}, s_{\text{Terminated}}\}$$

With formal properties:
1. $S$ is finite and fixed: $|S| = 6$
2. States are mutually exclusive: $\forall s_1, s_2 \in S: s_1 = s_2 \lor s_1 \cap s_2 = \emptyset$
3. Initial state: $s_0 = s_{\text{Disconnected}}$
4. Final states: $F = \{s_{\text{Terminated}}\}$

### 2.3 Events ($E$)

The event set $E$ is defined as the union of control events $E_c$ and data events $E_d$:

$$E = E_c \cup E_d$$

Control Events:
$$E_c = \{e_{\text{CONNECT}}, e_{\text{DISCONNECT}}, e_{\text{OPEN}}, e_{\text{CLOSE}}, e_{\text{ERROR}}, e_{\text{RETRY}}, e_{\text{MAX\_RETRIES}}, e_{\text{TERMINATE}}\}$$

Data Events:
$$E_d = \{e_{\text{MESSAGE}}, e_{\text{SEND}}, e_{\text{PING}}, e_{\text{PONG}}\}$$

Each event $e \in E$ is a tuple:
$$e = (type: E_c \cup E_d, payload: \mathbb{D} \cup \{\emptyset\}, metadata: \mathbb{S} \cup \{\emptyset\}, timestamp: \mathbb{T})$$

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
  readyState: \mathbb{N}
\}$$

Metric Values ($V$):
$$V = \{
  messagesSent: \mathbb{N},
  messagesReceived: \mathbb{N},
  reconnectAttempts: \mathbb{N},
  bytesSent: \mathbb{N},
  bytesReceived: \mathbb{N}
\}$$

Timing Properties ($T$):
$$T = \{
  connectTime: \mathbb{T} \cup \{\emptyset\},
  disconnectTime: \mathbb{T} \cup \{\emptyset\},
  lastPingTime: \mathbb{T} \cup \{\emptyset\},
  lastPongTime: \mathbb{T} \cup \{\emptyset\}
\}$$

### 2.5 Actions ($\Gamma$)

Actions are pure functions that transform context:

$$\Gamma: C \times E \rightarrow C$$

The set of actions $\Gamma$ is defined as:

$$\Gamma = \{\gamma_{\text{storeUrl}}, \gamma_{\text{resetRetries}}, \gamma_{\text{handleError}}, \gamma_{\text{processMessage}}, \gamma_{\text{sendMessage}}, \gamma_{\text{handlePing}}, \gamma_{\text{handlePong}}, \gamma_{\text{enforceRateLimit}}, \gamma_{\text{incrementRetries}}, \gamma_{\text{logConnection}}, \gamma_{\text{forceTerminate}}\}$$

Each action is defined formally:

$$\gamma_{\text{storeUrl}}(c, e) = c' \text{ where } c'.properties.url = e.payload \text{ if } type(e.payload) = \mathbb{S}$$

$$\gamma_{\text{resetRetries}}(c, e) = c' \text{ where } c'.metrics.reconnectAttempts = 0$$

$$\gamma_{\text{handleError}}(c, e) = c' \text{ where } \begin{cases}
  c'.properties.status = \text{error} \\
  c'.timing.lastError = now() \\
  c'.properties.socket = \emptyset
\end{cases}$$

$$\gamma_{\text{processMessage}}(c, e) = c' \text{ where } \begin{cases}
  c'.metrics.messagesReceived = c.metrics.messagesReceived + 1 \\
  c'.metrics.bytesReceived = c.metrics.bytesReceived + size(e.payload)
\end{cases}$$

$$\gamma_{\text{sendMessage}}(c, e) = c' \text{ where } \begin{cases}
  c'.metrics.messagesSent = c.metrics.messagesSent + 1 \\
  c'.metrics.bytesSent = c.metrics.bytesSent + size(e.payload)
\end{cases}$$

$$\gamma_{\text{handlePing}}(c, e) = c' \text{ where } \begin{cases}
  c'.timing.lastPingTime = now() \\
  c'.metrics.messagesSent = c.metrics.messagesSent + 1
\end{cases}$$

$$\gamma_{\text{handlePong}}(c, e) = c' \text{ where } \begin{cases}
  c'.timing.lastPongTime = now() \\
  c'.metrics.messagesReceived = c.metrics.messagesReceived + 1
\end{cases}$$

$$\gamma_{\text{enforceRateLimit}}(c, e) = c' \text{ where } \begin{cases}
  c'.window.count = currentWindowCount(c.window) + 1 \text{ if } \neg windowExpired(c.window) \\
  c'.window = (now(), c.window.duration, 1, c.window.limit) \text{ otherwise}
\end{cases}$$

$$\gamma_{\text{incrementRetries}}(c, e) = c' \text{ where } \begin{cases}
  c'.metrics.reconnectAttempts = c.metrics.reconnectAttempts + 1 \\
  c'.timing.lastRetry = now()
\end{cases}$$

$$\gamma_{\text{logConnection}}(c, e) = c' \text{ where } \begin{cases}
  c'.timing.connectTime = now() \text{ if } e.type = e_{\text{CONNECT}} \\
  c'.timing.disconnectTime = now() \text{ if } e.type = e_{\text{DISCONNECT}}
\end{cases}$$

$$\gamma_{\text{forceTerminate}}(c, e) = c' \text{ where } \begin{cases}
  c'.properties.socket = \emptyset \\
  c'.properties.status = \text{disconnected} \\
  c'.timing.disconnectTime = now()
\end{cases}$$

### 2.6 Action Application ($A$)

The action application function $A$ defines how multiple actions are composed:

$$A: \mathfrak{P}(\Gamma) \times C \rightarrow C$$

For any set of actions $\{\gamma_1, ..., \gamma_n\} \subseteq \Gamma$ and context $c \in C$:

$$A(\{\gamma_1, ..., \gamma_n\}, c) = \gamma_n(...\gamma_2(\gamma_1(c)))$$

Actions are applied in order of their indices. The empty set of actions is the identity function:

$$A(\emptyset, c) = c$$

### 2.7 Transition Function ($\delta$)

The transition function maps states and events to new states and sets of actions:

$$\delta: S \times E \rightarrow S \times \mathfrak{P}(\Gamma)$$

Complete transition function definition:

$$\delta(s_{\text{Disconnected}}, e_{\text{CONNECT}}) = (s_{\text{Connecting}}, \{\gamma_{\text{storeUrl}}, \gamma_{\text{logConnection}}\})$$

$$\delta(s_{\text{Connecting}}, e_{\text{OPEN}}) = (s_{\text{Connected}}, \{\gamma_{\text{resetRetries}}\})$$

$$\delta(s_{\text{Connecting}}, e_{\text{ERROR}}) = (s_{\text{Reconnecting}}, \{\gamma_{\text{handleError}}, \gamma_{\text{incrementRetries}}\})$$

$$\delta(s_{\text{Connected}}, e_{\text{MESSAGE}}) = (s_{\text{Connected}}, \{\gamma_{\text{processMessage}}, \gamma_{\text{enforceRateLimit}}\})$$

$$\delta(s_{\text{Connected}}, e_{\text{SEND}}) = (s_{\text{Connected}}, \{\gamma_{\text{sendMessage}}, \gamma_{\text{enforceRateLimit}}\})$$

$$\delta(s_{\text{Connected}}, e_{\text{PING}}) = (s_{\text{Connected}}, \{\gamma_{\text{handlePing}}\})$$

$$\delta(s_{\text{Connected}}, e_{\text{PONG}}) = (s_{\text{Connected}}, \{\gamma_{\text{handlePong}}\})$$

$\delta(s_{\text{Connected}}, e_{\text{ERROR}}) = (s_{\text{Reconnecting}}, \{\gamma_{\text{handleError}}, \gamma_{\text{incrementRetries}}\})$

$\delta(s_{\text{Connected}}, e_{\text{DISCONNECT}}) = (s_{\text{Disconnecting}}, \{\gamma_{\text{logConnection}}\})$

$\delta(s_{\text{Reconnecting}}, e_{\text{RETRY}}) = (s_{\text{Connecting}}, \{\gamma_{\text{logConnection}}\})$

$\delta(s_{\text{Reconnecting}}, e_{\text{MAX\_RETRIES}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\})$

$\delta(s_{\text{Disconnecting}}, e_{\text{CLOSE}}) = (s_{\text{Disconnected}}, \{\gamma_{\text{logConnection}}\})$

$\delta(s_{\text{Disconnecting}}, e_{\text{ERROR}}) = (s_{\text{Disconnected}}, \{\gamma_{\text{handleError}}, \gamma_{\text{logConnection}}\})$

$\delta(s, e_{\text{TERMINATE}}) = (s_{\text{Terminated}}, \{\gamma_{\text{forceTerminate}}\}) \text{ for all } s \in S \setminus \{s_{\text{Terminated}}\}$

For all other state-event pairs $(s,e)$, the transition is undefined, denoted as:
$\delta(s,e) = \bot$

### 2.8 State-Specific Invariants

For each state $s \in S$, the following invariants must hold:

$s = s_{\text{Disconnected}} \implies \begin{cases}
  c.properties.socket = \emptyset \\
  c.properties.status = \text{disconnected} \\
  c.metrics.reconnectAttempts = 0
\end{cases}$

$s = s_{\text{Connecting}} \implies \begin{cases}
  c.properties.url \neq \emptyset \\
  c.properties.status = \text{disconnected}
\end{cases}$

$s = s_{\text{Connected}} \implies \begin{cases}
  c.properties.socket \neq \emptyset \\
  c.properties.status = \text{connected} \\
  c.timing.connectTime \neq \emptyset
\end{cases}$

$s = s_{\text{Reconnecting}} \implies \begin{cases}
  c.properties.socket = \emptyset \\
  c.properties.status = \text{error} \\
  c.metrics.reconnectAttempts > 0
\end{cases}$

$s = s_{\text{Disconnecting}} \implies \begin{cases}
  c.properties.socket \neq \emptyset \\
  c.timing.disconnectTime = \emptyset
\end{cases}$

$s = s_{\text{Terminated}} \implies \begin{cases}
  c.properties.socket = \emptyset \\
  c.properties.status = \text{disconnected} \\
  c.timing.disconnectTime \neq \emptyset
\end{cases}$

## 3. Machine Properties

### 3.1 Structural Properties

1. State Completeness:
   $\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \lor \delta(s,e) = \bot$

2. Determinism:
   $\forall s \in S, e \in E: |\{s' \mid \exists \Gamma': \delta(s,e) = (s',\Gamma')\}| \leq 1$

3. Action Composition:
   $\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies A(\Gamma',c) \text{ is well-defined}$

4. State Reachability:
   $\forall s \in S \setminus \{s_0\}: \exists \text{ sequence } (e_1,...,e_n) \in E^n: s_0 \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s$
   where $s_i \xrightarrow{e} s_j$ denotes $\delta(s_i,e) = (s_j,\Gamma')$ for some $\Gamma'$

5. Termination:
   $\forall s \in S \setminus F: \exists \text{ sequence } (e_1,...,e_n) \in E^n: s \xrightarrow{e_1} s_1 \xrightarrow{e_2} ... \xrightarrow{e_n} s_f$
   where $s_f \in F$

### 3.2 Context Properties

1. Type Safety:
   $\forall \gamma \in \Gamma, c \in C, e \in E: \begin{cases}
     type(\gamma(c,e)) = type(c) \\
     \forall x \in c: type(x) \text{ preserved in } \gamma(c,e)
   \end{cases}$

2. Value Constraints:
   $\forall c \in C: \begin{cases}
     \forall v \in c.metrics: v \in \mathbb{N} \\
     \forall t \in c.timing: t \in \mathbb{T} \cup \{\emptyset\} \\
     c.metrics.reconnectAttempts \leq \text{MAX\_RETRIES} \\
     c.window.count \leq c.window.limit
   \end{cases}$

3. Temporal Consistency:
   $\forall c \in C: \begin{cases}
     c.timing.connectTime \leq now() \\
     c.timing.disconnectTime \leq now() \\
     c.timing.lastPingTime \leq now() \\
     c.timing.lastPongTime \leq now() \\
     c.window.start \leq now()
   \end{cases}$

### 3.3 Action Properties

1. Purity:
   $\forall \gamma \in \Gamma, c \in C, e \in E: \gamma(c,e) \text{ depends only on } c \text{ and } e$

2. Context Preservation:
   $\forall \gamma \in \Gamma, c \in C, e \in E: \text{dom}(\gamma(c,e)) = \text{dom}(c)$

3. Action Composability:
   $\forall \gamma_1,\gamma_2 \in \Gamma, c \in C, e \in E: \gamma_2(\gamma_1(c,e),e) \text{ is well-defined}$

### 3.4 System Invariants

1. Socket Uniqueness:
   $\forall c \in C: |\{s \in S \mid c.properties.socket \neq \emptyset\}| \leq 1$

2. Message Rate Limiting:
   $\forall c \in C: currentWindowCount(c.window) \leq c.window.limit$

3. Message Ordering:
   $\forall m_1,m_2 \in \mathbb{M}: t(m_1) < t(m_2) \implies order(m_1) < order(m_2)$

4. Event-Action Consistency:
   $\forall s \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies \begin{cases}
     e \in E_c \implies \exists \gamma \in \Gamma': type(\gamma) = \text{control} \\
     e \in E_d \implies \exists \gamma \in \Gamma': type(\gamma) = \text{data}
   \end{cases}$

5. State Transition Consistency:
   $\forall s,s' \in S, e \in E: \delta(s,e) = (s',\Gamma') \implies \begin{cases}
     s = s_{\text{Terminated}} \implies s' = s_{\text{Terminated}} \\
     s' = s_{\text{Connected}} \implies c.properties.socket \neq \emptyset \\
     s' = s_{\text{Disconnected}} \implies c.properties.socket = \emptyset
   \end{cases}$

6. Retry Limit Enforcement:
   $\forall c \in C: c.metrics.reconnectAttempts > \text{MAX\_RETRIES} \implies \nexists e \in E: \delta(s_{\text{Reconnecting}},e) = (s_{\text{Connecting}},\Gamma')$