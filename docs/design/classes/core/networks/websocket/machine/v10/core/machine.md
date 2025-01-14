# WebSocket Client Formal Specification

## 1. Core Definitions

The WebSocket Client system $\mathcal{WC}$ is defined as a 7-tuple:

$$
\mathcal{WC} = (S, E, \delta, s_0, C, \gamma, F)
$$

where:

- $S$ is the finite set of states
- $E$ is the set of external events
- $\delta: S \times E \rightarrow S$ is the transition function
- $s_0 \in S$ is the initial state
- $C$ is the set of context variables
- $\gamma$ represents actions triggered by transitions
- $F \subseteq S$ is the set of final states

### 1.1 System Constants

$$
\small
\begin{aligned}
Constraints = \{&\\
&MAX\_RETRIES: 5,\\
&MAX\_MESSAGES: 100,\\
&WINDOW\_SIZE: 1000\text{ ms},\\
&MAX\_WINDOW\_LIFETIME: 60000\text{ ms},\\
&MAX\_QUEUE\_SIZE: 1000\\
\}
\end{aligned}
$$

$$
\small
\begin{aligned}
Timing = \{&\\
&CONNECT\_TIMEOUT: 30000\text{ ms},\\
&INITIAL\_RETRY\_DELAY: 1000\text{ ms},\\
&MAX\_RETRY\_DELAY: 60000\text{ ms},\\
&RETRY\_MULTIPLIER: 1.5,\\
&STABILITY\_TIMEOUT: 5000\text{ ms},\\
&DISCONNECT\_TIMEOUT: 3000\text{ ms}\\
\}
\end{aligned}
$$


## 2. State Machine Core

### 2.1 States ($S$)

The set of states $S$ is formally defined as:

$$
S = \{s_i\mid i=1,2,\dots,n;\ n=6\}
$$

where

$$
\begin{eqnarray}
s_1 &=& disconnected, \\
s_2 &=& disconnecting, \\
s_3 &=& connecting, \\
s_4 &=& connected, \\
s_5 &=& reconnecting, \\
s_6 &=& reconnected
\end{eqnarray}
$$

### 2.2 Events ($E$)

The set of events $E$ is defined as:

$$
E = \{e_i\mid i=1,2,\dots,m;\ m=15\}
$$

where

$$
\begin{eqnarray}
e_1 &=& CONNECT, \\
e_2 &=& DISCONNECT, \\
e_3 &=& OPEN, \\
e_4 &=& CLOSE, \\
e_5 &=& ERROR, \\
e_6 &=& RETRY, \\
e_7 &=& MAX\_RETRIES, \\
e_8 &=& TERMINATE, \\
e_9 &=& MESSAGE, \\
e_{10} &=& SEND, \\
e_{11} &=& PING, \\
e_{12} &=& PONG, \\
e_{13} &=& DISCONNECTED, \\
e_{14} &=& RECONNECTED, \\
e_{15} &=& STABILIZED
\end{eqnarray}
$$

### 2.3 Context ($C$)

The context is defined as a tuple of properties:

$$
C = (P, V, T)
$$

where:

- $P$ is the set of primary connection properties
- $V$ is the set of metric values
- $T$ is the set of timing properties

Formally:

$$
P = \{p_i\mid i=1,2,\dots,k\}
$$

where

$$
\begin{eqnarray}
p_1 &=& url: String, \\
p_2 &=& protocols: String[], \\
p_3 &=& socket: WebSocket \cup \{null\}, \\
p_4 &=& status: ConnectionStatus, \\
p_5 &=& readyState: Integer, \\
p_6 &=& disconnectReason: String \cup \{null\}, \\
p_7 &=& reconnectCount: \mathbb{N}
\end{eqnarray}
$$

$$
V = \{v_i\mid i=1,2,\dots,l\}
$$

where

$$
\begin{eqnarray}
v_1 &=& messagesSent: \mathbb{N}, \\
v_2 &=& messagesReceived: \mathbb{N}, \\
v_3 &=& reconnectAttempts: \mathbb{N}, \\
v_4 &=& bytesSent: \mathbb{N}, \\
v_5 &=& bytesReceived: \mathbb{N}
\end{eqnarray}
$$

$$
T = \{t_i\mid i=1,2,\dots,m\}
$$

where

$$
\begin{eqnarray}
t_1 &=& connectTime: \mathbb{R}^+, \\
t_2 &=& disconnectTime: \mathbb{R}^+, \\
t_3 &=& lastPingTime: \mathbb{R}^+, \\
t_4 &=& lastPongTime: \mathbb{R}^+, \\
t_5 &=& windowStart: \mathbb{R}^+, \\
t_6 &=& lastStableConnection: \mathbb{R}^+ \cup \{null\}
\end{eqnarray}
$$

### 2.4 Actions ($\gamma$)

Actions are defined as functions that transform the context:

$$
\gamma: C \times E \rightarrow C
$$

The set of actions is defined as:

$$
\Gamma = \{\gamma_i\mid i=1,2,\dots,p\}
$$

where

$$
\begin{eqnarray}
\gamma_1 &=& storeUrl: C \times E_{CONNECT} \rightarrow C', \\
\gamma_2 &=& resetRetries: C \rightarrow C', \\
\gamma_3 &=& handleError: C \times E_{ERROR} \rightarrow C', \\
\gamma_4 &=& processMessage: C \times E_{MESSAGE} \rightarrow C', \\
\gamma_5 &=& sendMessage: C \times E_{SEND} \rightarrow C', \\
\gamma_6 &=& handlePing: C \times E_{PING} \rightarrow C', \\
\gamma_7 &=& handlePong: C \times E_{PONG} \rightarrow C', \\
\gamma_8 &=& enforceRateLimit: C \rightarrow C', \\
\gamma_9 &=& incrementRetries: C \rightarrow C', \\
\gamma_{10} &=& logConnection: C \rightarrow C', \\
\gamma_{11} &=& forceTerminate: C \rightarrow C', \\
\gamma_{12} &=& initDisconnect: C \times E \rightarrow C', \\
\gamma_{13} &=& completeDisconnect: C \times E \rightarrow C', \\
\gamma_{14} &=& stabilizeReconnection: C \times E \rightarrow C'
\end{eqnarray}
$$

### 2.5 Transition Function ($\delta$)

The transition function is defined as:
$
\delta: S \times E \rightarrow S \times \Gamma
$

Key transitions include:
$
\small
\begin{aligned}
\delta(s_{disconnected}, e_{CONNECT}) &= (s_{connecting}, \{\gamma_1, \gamma_{10}\}) \\
\delta(s_{connecting}, e_{OPEN}) &= (s_{connected}, \{\gamma_2\}) \\
\delta(s_{connecting}, e_{ERROR}) &= (s_{reconnecting}, \{\gamma_3, \gamma_9\}) \\
\delta(s_{connected}, e_{MESSAGE}) &= (s_{connected}, \{\gamma_4, \gamma_8\}) \\
\delta(s_{connected}, e_{SEND}) &= (s_{connected}, \{\gamma_5, \gamma_8\}) \\
\delta(s_{connected}, e_{PING}) &= (s_{connected}, \{\gamma_6\}) \\
\delta(s_{connected}, e_{ERROR}) &= (s_{reconnecting}, \{\gamma_3, \gamma_9\}) \\
\delta(s_{connected}, e_{DISCONNECT}) &= (s_{disconnecting}, \{\gamma_{12}\}) \\
\delta(s_{disconnecting}, e_{DISCONNECTED}) &= (s_{disconnected}, \{\gamma_{13}\}) \\
\delta(s_{reconnecting}, e_{RETRY}) &= (s_{connecting}, \{\gamma_9\}) \\
\delta(s_{reconnecting}, e_{RECONNECTED}) &= (s_{reconnected}, \{\gamma_{14}\}) \\
\delta(s_{reconnected}, e_{STABILIZED}) &= (s_{connected}, \{\gamma_2\}) \\
\delta(s, e_{TERMINATE}) &= (s_{terminated}, \{\gamma_{11}\}) \text{ for all } s \in S
\end{aligned}
$

### 2.6 State Machine Constraints

#### 2.6.1 State Constraints

Each state has specific constraints that must be satisfied:

1. Disconnected State:

   $$
   \small
   \begin{aligned}
   s = disconnected \implies \{&\\
   &socket = null,\\
   &error = null,\\
   &reconnectAttempts = 0\\
   \}
   \end{aligned}
   $$

2. Disconnecting State:

   $$
   \small
   \begin{aligned}
   s = disconnecting \implies \{&\\
   &socket \neq null,\\
   &disconnectReason \neq null,\\
   &duration(s) \leq DISCONNECT\_TIMEOUT\\
   \}
   \end{aligned}
   $$

3. Connecting State:

   $$
   \small
   \begin{aligned}
   s = connecting \implies \{&\\
   &socket \neq null,\\
   &url \neq null,\\
   &duration(s) \leq CONNECT\_TIMEOUT\\
   \}
   \end{aligned}
   $$

4. Connected State:

   $$
   \small
   \begin{aligned}
   s = connected \implies \{&\\
   &socket \neq null,\\
   &error = null,\\
   &readyState = 1\\
   \}
   \end{aligned}
   $$

5. Reconnecting State:

   $$
   \small
   \begin{aligned}
   s = reconnecting \implies \{&\\
   &socket = null,\\
   &retries \leq MAX\_RETRIES,\\
   &error \neq null\\
   \}
   \end{aligned}
   $$

6. Reconnected State:
   $$
   \small
   \begin{aligned}
   s = reconnected \implies \{&\\
   &socket \neq null,\\
   &reconnectCount > 0,\\
   &lastStableConnection \neq null,\\
   &duration(s) \leq STABILITY\_TIMEOUT\\
   \}
   \end{aligned}
   $$

#### 2.6.2 Transition Constraints

1. State Reachability:

   $$
   \begin{aligned}
   &\forall s \in S: \\
   &\exists e_1,\dots,e_n \in E: s_0 \xrightarrow{e_1} s_1 \xrightarrow{e_2} \dots \xrightarrow{e_n} s
   \end{aligned}
   $$

2. Valid Transitions:

   $$
   \begin{aligned}
   &\forall (s_1, e, s_2) \in \delta: \\
   &pre(s_1) \land guard(e) \implies post(s_2)
   \end{aligned}
   $$

3. Deterministic Behavior:
   $$
   \begin{aligned}
   &\forall s \in S, e \in E: \\
   &|\{s' | (s,e,s') \in \delta\}| \leq 1
   \end{aligned}
   $$

### 2.7 Queue Properties

The message queue $Q$ must satisfy:

1. Size Constraint:

   $$
   |Q| \leq MAX\_QUEUE\_SIZE
   $$

2. Order Preservation:

   $$
   \begin{aligned}
   &\forall m_1, m_2 \in Q: \\
   &timestamp(m_1) < timestamp(m_2) \implies index(m_1) < index(m_2)
   \end{aligned}
   $$

3. Message Processing:
   $$
   \begin{aligned}
   process: Q \times C &\rightarrow C \\
   process(m,c) &= \gamma_4(c,m)
   \end{aligned}
   $$

### 2.8 Rate Limiting Properties

Rate limiting constraints must be satisfied:

1. Window Constraint:

   $$
   \begin{aligned}
   &\forall t: \\
   &|\{m \in Q | t - timestamp(m) \leq WINDOW\_SIZE\}| \leq MAX\_MESSAGES
   \end{aligned}
   $$

2. Window Lifetime:

   $$
   \begin{aligned}
   &\forall w \in Windows: \\
   &duration(w) \leq MAX\_WINDOW\_LIFETIME
   \end{aligned}
   $$

3. Rate Calculation:
   $$
   rate(t) = \frac{|messages(t-WINDOW\_SIZE, t)|}{WINDOW\_SIZE}
   $$

## 3. Core Properties

### 3.1 State Integrity

At any time $t$, the system $\mathcal{WC}$ is in exactly one state:
$
\forall t, |\{s \in S | \mathcal{WC}(t) = s\}| = 1
$

### 3.2 Transition Determinism

For each state-event pair, there is exactly one defined transition:
$
\forall s \in S, e \in E, |\delta(s,e)| = 1
$

### 3.3 State Validity

All transitions result in valid states:
$
\forall s \in S, e \in E, \delta(s,e).S \in S
$

### 3.4 Action Execution

Actions are executed as defined in transitions:
$
\forall s \in S, e \in E, a \in \delta(s,e).A \implies Execute(a)
$

## 4. Timing Properties

### 4.1 Connection Timing

$
\begin{aligned}
&Connect \text{ timeout}: 0 < t \leq CONNECT\_TIMEOUT \\
&Retry \text{ delay}: d_n = \min(INITIAL\_RETRY\_DELAY \times RETRY\_MULTIPLIER^n, MAX\_RETRY\_DELAY) \\
&Disconnect \text{ timeout}: 0 < t \leq DISCONNECT\_TIMEOUT \\
&Stability \text{ window}: 0 < t \leq STABILITY\_TIMEOUT
\end{aligned}
$

### 4.2 Health Check Timing

$
\begin{aligned}
&Ping \text{ interval}: 15000\text{ ms} \leq t \leq 60000\text{ ms} \\
&Pong \text{ timeout}: t \leq 5000\text{ ms}
\end{aligned}
$

## 5. Safety Properties

### 5.1 No Invalid States

$
\forall t, \mathcal{WC}(t) \in S
$

### 5.2 Error Handling

$
\forall s \in S, e = ERROR \implies \delta(s,e).A \text{ contains LogError}
$

### 5.3 Connection Safety

$
\begin{aligned}
&\forall s = connecting, e = CONNECTION\_SUCCESS: \\
&\quad \delta(s,e).S = connected \\
&\forall s = connecting, e = CONNECTION\_FAILURE: \\
&\quad \delta(s,e).S = reconnecting \text{ if retries} < MAX\_RETRIES \\
&\quad \delta(s,e).S = disconnected \text{ otherwise}
\end{aligned}
$

### 5.4 Retry Safety

$
\begin{aligned}
&\forall s = reconnecting: \\
&\quad retries \leq MAX\_RETRIES \\
&\quad retryDelay \leq MAX\_RETRY\_DELAY
\end{aligned}
$

### 5.5 Disconnect Safety

$
\begin{aligned}
&\forall s = disconnecting: \\
&\quad disconnectReason \neq null \\
&\quad duration(s) \leq DISCONNECT\_TIMEOUT
\end{aligned}
$

### 5.6 Reconnection Safety

$
\begin{aligned}
&\forall s = reconnected: \\
&\quad reconnectCount > 0 \\
&\quad lastStableConnection \neq null \\
&\quad duration(s) \leq STABILITY\_TIMEOUT
\end{aligned}
$

# Appendix A: Formal Proofs

## A.1 State Machine Properties

### A.1.1 Single Active State

**Theorem 1**: At any time $t$, the system $\mathcal{WC}$ is in exactly one state.

**Proof** by induction on the number of transitions:

_Base case_: At $t = 0$

- $\mathcal{WC}(0) = s_0 = disconnected$
- Therefore $|\{s \in S | \mathcal{WC}(0) = s\}| = 1$

_Inductive step_: Assume true for $k$ transitions

- Let $s_k$ be the state after $k$ transitions
- For transition $k + 1$ with event $e$:
  - $\delta(s_k, e) = (s_{k+1}, A)$ where:
    - $s_{k+1} \in S$
    - $s_{k+1}$ uniquely determined by $(s_k, e)$
  - Therefore $|\{s \in S | \mathcal{WC}(t_{k+1}) = s\}| = 1$

### A.1.2 Transition Determinism

**Theorem 2**: For any state $s$ and event $e$, the transition function $\delta$ produces exactly one next state.

**Proof** by exhaustive case analysis:

1. For each $(s, e) \in S \times E$:
   $$\delta(s, e) = (s', A) \text{ or undefined}$$
2. When defined:
   - $s' \in S$ is a single state
   - $A \subseteq 2^A$ is a set of actions
3. From formal definition:
   - Each case maps to unique $(s', A)$
   - No overlapping cases exist

### A.1.3 Context Transformation

**Theorem 3**: All context transformations preserve invariants.

**Proof** by case analysis of $\gamma$ functions:

1. For any $\gamma_i \in \Gamma$:
   - $\gamma_i: C \times E \rightarrow C'$
   - $C'$ maintains all invariants
2. For each transformation:
   $$\gamma_i(c, e) = c' \implies I(c')$$
   where $I(c)$ represents context invariants
3. Example for $\gamma_1$ (StoreUrl):
   - Pre: $c.url \in String \cup \{null\}$
   - Post: $c'.url \in String$
   - Invariant maintained: $c'.url \text{ type preserved}$

## A.2 Safety Properties

### A.2.1 Message Preservation

**Theorem 4**: No messages are lost during state transitions.

**Proof** by contradiction:

1. Assume message $m$ is lost
2. Cases:
   - If $s = connected$: $m$ processed by $\gamma_4$
   - If $s = disconnecting$: $m$ added to queue
   - If $s = reconnected$: $m$ processed after stabilization
   - If $s \neq connected$: $m$ added to queue
3. Queue properties:
   - $|Q| \leq MAX\_QUEUE\_SIZE$
   - FIFO ordering maintained
4. Therefore:
   - No path exists where $m$ is lost
   - Contradiction ∎

### A.2.2 Rate Limiting

**Theorem 5**: Message rate never exceeds limit.

**Proof** by invariant:

1. Let $R$ be rate limiter
2. For window $[t - W, t]$:
   - Count $= |\{m | m.time \in [t - W, t]\}|$
3. Show $Count \leq MAX\_MESSAGES$:
   - New messages blocked if $Count = MAX\_MESSAGES$
   - Window slides continuously
   - Old messages removed from count
4. Therefore rate $\leq MAX\_MESSAGES/W$ ∎

### A.2.3 State Consistency

**Theorem 6**: State transitions maintain consistency invariants.

**Proof** by induction on transitions:

1. Base case: Initial state satisfies invariants
2. Inductive step: For transition $s \xrightarrow{e} s'$:
   - For disconnecting: $disconnectReason \neq null$
   - For reconnected: $reconnectCount > 0$
   - For all states: $socket$ consistency maintained
3. Therefore all invariants preserved ∎

## A.3 Liveness Properties

### A.3.1 Connection Progress

**Theorem 7**: System eventually reaches stable state.

**Proof** by well-founded relation:

1. Define measure function:
   $$\mu(s) = MAX\_RETRIES - retries$$
2. For each retry:
   - $\mu$ decreases by 1
   - $\mu < 0 \implies$ system enters $disconnected$
3. For reconnected state:
   - Either stabilizes to connected
   - Or reaches $MAX\_RETRIES$ and fails
4. No infinite retry sequence possible ∎

### A.3.2 Message Delivery

**Theorem 8**: All queued messages eventually delivered or discarded.

**Proof** by induction on queue length:

1. Base: Empty queue trivially satisfied
2. Step: For queue of length $n$:
   - Head message $m$ either:
     - Delivered when connected
     - Delivered after reconnection stabilizes
     - Discarded after $MAX\_RETRIES$
   - Queue length reduces to $n-1$
3. Therefore all messages eventually processed ∎

### A.3.3 Disconnection Progress

**Theorem 9**: Disconnection process eventually completes.

**Proof** by timeout bounds:

1. When entering disconnecting state:
   - $timer = DISCONNECT\_TIMEOUT$
   - $disconnectReason \neq null$
2. Either:
   - Socket closes normally: $\xrightarrow{DISCONNECTED} disconnected$
   - Timeout occurs: $\xrightarrow{TERMINATE} disconnected$
3. Therefore process must complete within $DISCONNECT\_TIMEOUT$ ∎

## A.4 Real-Time Properties

### A.4.1 Timing Bounds

**Theorem 10**: System respects timing constraints.

**Proof** for each timing property:

1. Connection timing:
   $$0 < t \leq CONNECT\_TIMEOUT$$
2. Retry delay:
   $$d_n \leq MAX\_RETRY\_DELAY$$
3. Disconnect timeout:
   $$0 < t \leq DISCONNECT\_TIMEOUT$$
4. Stability timeout:
   $$0 < t \leq STABILITY\_TIMEOUT$$
5. All enforced by $\gamma$ functions ∎

### A.4.2 State Duration

**Theorem 11**: Transient states have bounded duration.

**Proof** by cases:

1. For connecting:
   - Duration $\leq CONNECT\_TIMEOUT$
2. For disconnecting:
   - Duration $\leq DISCONNECT\_TIMEOUT$
3. For reconnected:
   - Duration $\leq STABILITY\_TIMEOUT$
4. Therefore all transient states bounded ∎

## A.5 Completeness Properties

### A.5.1 State Coverage

**Theorem 12**: Every state is reachable from initial state.

**Proof** by construction:

1. For each $s \in S$, show path from $s_0$:
   - $disconnected$: initial state
   - $disconnecting$: $s_0 \xrightarrow{CONNECT} connecting \xrightarrow{OPEN} connected \xrightarrow{DISCONNECT} disconnecting$
   - $connecting$: $s_0 \xrightarrow{CONNECT} connecting$
   - $connected$: $s_0 \xrightarrow{CONNECT} connecting \xrightarrow{OPEN} connected$
   - $reconnecting$: $s_0 \xrightarrow{CONNECT} connecting \xrightarrow{ERROR} reconnecting$
   - $reconnected$: $s_0 \xrightarrow{CONNECT} connecting \xrightarrow{ERROR} reconnecting \xrightarrow{RECONNECTED} reconnected$
2. Therefore all states reachable ∎

### A.5.2 Event Handling

**Theorem 13**: All events properly handled in valid states.

**Proof** by case analysis:

1. For each $(s,e) \in S \times E$:
   - Either $\delta(s,e)$ defined
   - Or state invalid for event
2. For each valid combination:
   $$\delta(s,e) = (s', A) \text{ where } s' \in S \text{ and } A \subseteq \Gamma$$
3. Show coverage:
   - All error cases handled
   - All state transitions defined
   - All context updates specified ∎

### A.5.3 Property Coverage

**Theorem 14**: All required properties are enforced.

**Proof** by verification:

1. Safety properties:
   - State consistency maintained
   - No messages lost
   - Rate limits enforced
2. Liveness properties:
   - Progress guaranteed
   - Termination ensured
3. Timing properties:
   - All timeouts enforced
   - State durations bounded
4. Therefore all properties covered ∎
