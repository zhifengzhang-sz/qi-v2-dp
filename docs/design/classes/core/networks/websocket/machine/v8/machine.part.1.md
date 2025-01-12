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
\begin{aligned}
Timing = \{&\\
&CONNECT\_TIMEOUT: 30000\text{ ms},\\
&INITIAL\_RETRY\_DELAY: 1000\text{ ms},\\
&MAX\_RETRY\_DELAY: 60000\text{ ms},\\
&RETRY\_MULTIPLIER: 1.5\\
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
s_2 &=& connecting, \\
s_3 &=& connected, \\
s_4 &=& reconnecting, \\
s_5 &=& disconnecting, \\
s_6 &=& terminated
\end{eqnarray}
$$

### 2.2 Events ($E$)

The set of events $E$ is defined as:
$$
E = \{e_i\mid i=1,2,\dots,m;\ m=12\}
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
e_{12} &=& PONG
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
p_5 &=& readyState: Integer
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
t_5 &=& windowStart: \mathbb{R}^+
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
\gamma_{11} &=& forceTerminate: C \rightarrow C'
\end{eqnarray}
$$

Each action is defined formally as follows:

1. Store URL:
   $$
   \gamma_1(c, e_{CONNECT}) = c' \text{ where } c'.url = e_{CONNECT}.url
   $$

2. Reset Retries:
   $$
   \gamma_2(c) = c' \text{ where } c'.reconnectAttempts = 0
   $$

3. Handle Error:
   $$
   \gamma_3(c, e_{ERROR}) = c' \text{ where } \begin{cases}
   c'.error = e_{ERROR}.error \\
   c'.status = error \\
   c'.lastError = timestamp
   \end{cases}
   $$

4. Process Message:
   $$
   \gamma_4(c, e_{MESSAGE}) = c' \text{ where } \begin{cases}
   c'.messagesReceived = c.messagesReceived + 1 \\
   c'.bytesReceived = c.bytesReceived + size(e_{MESSAGE}.data)
   \end{cases}
   $$

5. Send Message:
   $$
   \gamma_5(c, e_{SEND}) = c' \text{ where } \begin{cases}
   c'.messagesSent = c.messagesSent + 1 \\
   c'.bytesSent = c.bytesSent + size(e_{SEND}.data)
   \end{cases}
   $$

6. Handle Ping:
   $
   \gamma_6(c, e_{PING}) = c' \text{ where } c'.lastPingTime = e_{PING}.timestamp
   $

7. Handle Pong:
   $
   \gamma_7(c, e_{PONG}) = c' \text{ where } \begin{cases}
   c'.lastPongTime = e_{PONG}.timestamp \\
   c'.latency = e_{PONG}.latency
   \end{cases}
   $

8. Enforce Rate Limit:
   $
   \gamma_8(c) = c' \text{ where } \begin{cases}
   c'.messageCount = currentWindowCount(c) \\
   c'.windowStart = now() \text{ if windowExpired}(c)
   \end{cases}
   $

9. Increment Retries:
   $
   \gamma_9(c) = c' \text{ where } c'.reconnectAttempts = c.reconnectAttempts + 1
   $

10. Log Connection:
    $
    \gamma_{10}(c) = c' \text{ where } c'.connectTime = now()
    $

11. Force Terminate:
    $
    \gamma_{11}(c) = c' \text{ where } \begin{cases}
    c'.socket = null \\
    c'.status = terminated \\
    c'.disconnectTime = now()
    \end{cases}
    $

### 2.5 Transition Function ($\delta$)

The transition function is defined as:
$
\delta: S \times E \rightarrow S \times \Gamma
$

Key transitions include:
$
\begin{aligned}
\delta(s_{disconnected}, e_{CONNECT}) &= (s_{connecting}, \{\gamma_1, \gamma_{10}\}) \\
\delta(s_{connecting}, e_{OPEN}) &= (s_{connected}, \{\gamma_2\}) \\
\delta(s_{connecting}, e_{ERROR}) &= (s_{reconnecting}, \{\gamma_3, \gamma_9\}) \\
\delta(s_{connected}, e_{MESSAGE}) &= (s_{connected}, \{\gamma_4, \gamma_8\}) \\
\delta(s_{connected}, e_{SEND}) &= (s_{connected}, \{\gamma_5, \gamma_8\}) \\
\delta(s_{connected}, e_{PING}) &= (s_{connected}, \{\gamma_6\}) \\
\delta(s_{connected}, e_{ERROR}) &= (s_{reconnecting}, \{\gamma_3, \gamma_9\}) \\
\delta(s_{reconnecting}, e_{RETRY}) &= (s_{connecting}, \{\gamma_9\}) \\
\delta(s, e_{TERMINATE}) &= (s_{terminated}, \{\gamma_{11}\}) \text{ for all } s \in S
\end{aligned}
$

## 3. Core Properties

### 3.1 State Integrity
At any time $t$, the system is in exactly one state:
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
&Retry \text{ delay}: d_n = \min(INITIAL\_RETRY\_DELAY \times RETRY\_MULTIPLIER^n, MAX\_RETRY\_DELAY)
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

# Appendix A: Formal Proofs

## A.1 State Machine Properties

### A.1.1 Single Active State

**Theorem 1**: At any time $t$, the system $\mathcal{WC}$ is in exactly one state.

**Proof** by induction on the number of transitions:

*Base case*: At $t = 0$
- $\mathcal{WC}(0) = s_0 = disconnected$
- Therefore $|\{s \in S | \mathcal{WC}(0) = s\}| = 1$

*Inductive step*: Assume true for $k$ transitions
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
   - If $s \neq connected$: $m$ added to queue
3. Queue properties:
   - $|Q| \leq MAX\_QUEUE\_SIZE$
   - FIFO ordering maintained
4. Therefore:
   - No path exists where $m$ is lost
   - Contradiction

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
4. Therefore rate $\leq MAX\_MESSAGES/W$

## A.3 Liveness Properties

### A.3.1 Connection Progress

**Theorem 6**: System eventually connects or fails.

**Proof** by well-founded relation:
1. Define measure function:
   $$\mu(s) = MAX\_RETRIES - retries$$
2. For each retry:
   - $\mu$ decreases by 1
   - $\mu < 0 \implies$ system enters $disconnected$
3. Therefore:
   - Either connects successfully
   - Or reaches $MAX\_RETRIES$ and fails
   - No infinite retry sequence possible

### A.3.2 Message Delivery

**Theorem 7**: All queued messages eventually delivered or discarded.

**Proof** by induction on queue length:
1. Base: Empty queue trivially satisfied
2. Step: For queue of length $n$:
   - Head message $m$ either:
     - Delivered when connected
     - Discarded after $MAX\_RETRIES$
   - Queue length reduces to $n-1$
3. Therefore all messages eventually processed

## A.4 Real-Time Properties

### A.4.1 Timing Bounds

**Theorem 8**: System respects timing constraints.

**Proof** for each timing property:
1. Connection timing:
   $$0 < t \leq CONNECT\_TIMEOUT$$
2. Retry delay:
   $$d_n \leq MAX\_RETRY\_DELAY$$
3. Health check:
   $$15000 \leq pingInterval \leq 60000$$
4. All enforced by $\gamma$ functions

## A.5 Completeness Properties

### A.5.1 State Coverage

**Theorem 9**: Every state is reachable from initial state.

**Proof** by construction:
1. For each $s \in S$, show path from $s_0$:
   - $disconnected$: initial state
   - $connecting$: $s_0 \xrightarrow{CONNECT} connecting$
   - $connected$: $s_0 \xrightarrow{CONNECT} connecting \xrightarrow{OPEN} connected$
   - $reconnecting$: $s_0 \xrightarrow{CONNECT} connecting \xrightarrow{ERROR} reconnecting$
   - $terminated$: $s_0 \xrightarrow{TERMINATE} terminated$
2. Therefore all states reachable

### A.5.2 Event Handling

**Theorem 10**: All events properly handled in valid states.

**Proof** by case analysis:
1. For each $(s,e) \in S \times E$:
   - Either $\delta(s,e)$ defined
   - Or state invalid for event
2. For each valid combination:
   $$\delta(s,e) = (s', A) \text{ where } s' \in S \text{ and } A \subseteq \Gamma$$
3. Show coverage:
   - All error cases handled
   - All state transitions defined
   - All context updates specified
