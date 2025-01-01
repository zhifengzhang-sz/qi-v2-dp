# WebSocket Client Formal Specification

## 1. Core Definitions

Let $\mathcal{WC}$ be a WebSocket client implementation:
$$\small\mathcal{WC} = (S, E, C, \delta, s_0, c_0, Q, R)$$
where
- $S$ is the finite set of states
- $E$ is the finite set of events  
- $C$ is the context structure
- $\delta: S \times E \rightarrow S$ is the transition function
- $s_0$ is the initial state
- $c_0$ is the initial context
- $Q$ is the message queue
- $R$ is the rate limiting system

### 1.1 System Constants

$$
\small
\begin{aligned}
\text{Constraints} &= \{\\
&\quad MAX\_RETRIES: 5,\\
&\quad MAX\_MESSAGES: 100,\\
&\quad WINDOW\_SIZE: 1000\ \text{ms},\\
&\quad MAX\_WINDOW\_LIFETIME: 60000\ \text{ms},\\
&\quad MAX\_QUEUE\_SIZE: 1000\\
\}\\
\\
\text{Timing} &= \{\\
&\quad CONNECT\_TIMEOUT: 30000\ \text{ms},\\
&\quad INITIAL\_RETRY\_DELAY: 1000\ \text{ms},\\
&\quad MAX\_RETRY\_DELAY: 60000\ \text{ms},\\
&\quad RETRY\_MULTIPLIER: 1.5\\
\}
\end{aligned}
$$

### 1.2 Rate Limiting System

Let $R$ be a rate limiting system:
$$\small R = (W, n: \mathbb{N}, t: \mathbb{R}^+)$$
where:
- $W$ is the set of active windows
- $n$ is the current window count
- $t$ is the timestamp of the oldest window

For any window $w \in W$:
$$\small w = (\text{start}: \mathbb{R}^+, \text{count}: \mathbb{N}, \text{expiry}: \mathbb{R}^+)$$

Window lifecycle:

$$
\small
\begin{aligned}
&\text{create}: () \rightarrow w_0\\
&\text{expire}: W \times t \rightarrow W'\\
&\text{increment}: w \times \text{Message} \rightarrow w'
\end{aligned}
$$

Window invariants:
$$
\small
\begin{aligned}
&\forall w \in W:\\
&\quad w.\text{count} \leq MAX\_MESSAGES \land\\
&\quad (\text{now}() - w.\text{start}) \leq WINDOW\_SIZE \land\\
&\quad w.\text{expiry} \leq MAX\_WINDOW\_LIFETIME \land\\
&\quad w.\text{start} < w.\text{expiry}
\end{aligned}
$$

### 1.3 Message Queue

Let $Q$ be a message queue:
$$\small Q = (M: \text{Set}[\text{Message}], \text{cap}: \mathbb{N}, \text{head}: \mathbb{N}, \text{tail}: \mathbb{N})$$

Queue invariants:
$$
\small
\begin{aligned}
&|M| \leq MAX\_QUEUE\_SIZE\\
&\forall m_1, m_2 \in M: \text{index}(m_1) < \text{index}(m_2) \implies\\
&\quad \text{send}(m_1) <_t \text{send}(m_2) \land\\
&\quad \text{receive}(m_1) <_t \text{receive}(m_2)
\end{aligned}
$$

Queue operations:
$$
\small
\begin{aligned}
&\text{enqueue}: Q \times \text{Message} \rightarrow Q\\
&\text{dequeue}: Q \rightarrow \text{Message} \times Q\\
&\text{clear}: Q \rightarrow Q_0
\end{aligned}
$$

### 1.4 Message Operations 

Let $M$ be a message:
$$
\small M = (\text{data}: \text{Bytes},\ t_s: \mathbb{R}^+ \cup \{\bot\}, t_r: \mathbb{R}^+ \cup \{\bot\}, t_x: \mathbb{R}^+ \cup \{\bot\}, t_d: \mathbb{R}^+ \cup \{\bot\})
$$

Define temporal operators:
$$
\small
\begin{aligned}
&t_s: M \rightarrow \mathbb{R}^+ \cup \{\bot\} &&\text{(send timestamp)}\\
&t_x: M \rightarrow \mathbb{R}^+ \cup \{\bot\} &&\text{(transmit timestamp)}\\
&t_r: M \rightarrow \mathbb{R}^+ \cup \{\bot\} &&\text{(receive timestamp)}\\
&t_d: M \rightarrow \mathbb{R}^+ \cup \{\bot\} &&\text{(deliver timestamp)}
\end{aligned}
$$

Message sequence properties:
$$
\small
\begin{aligned}
&\forall m \in M: t_s(m) < t_x(m) < t_r(m) < t_d(m)\\
&\forall m_1,m_2 \in M: t_s(m_1) < t_s(m_2) \implies t_x(m_1) < t_x(m_2)
\end{aligned}
$$

Define message operations:
$$
\small
\begin{aligned}
&\text{send}: \text{Bytes} \rightarrow M\\
&\text{transmit}: M \rightarrow \text{WebSocket}\\
&\text{receive}: \text{WebSocket} \rightarrow M\\
&\text{deliver}: M \rightarrow \text{Application}
\end{aligned}
$$

Operation state transitions:
$$
\small
\begin{aligned}
&\text{send}(d) = (d, \text{now}(), \bot, \bot, \bot)\\
&\text{transmit}(m) = \{ m' \mid m' = m.\text{set}(t_x, \text{now}()) \} \\
&\text{receive}(m) = \{ m' \mid m' = m.\text{set}(t_r, \text{now}()) \} \\
&\text{deliver}(m) = \{ m' \mid m' = m.\text{set}(t_d, \text{now}()) \}
\end{aligned}
$$

Operation invariants:
$$
\small
\begin{aligned}
&\forall d \in \text{Bytes}: \\
&\quad \text{send}(d).\text{t_s} = \text{now}() \land \\
&\quad \text{send}(d).\text{t_r} = \bot \land \\
&\quad \text{send}(d).\text{t_x} = \bot \land \\
&\quad \text{send}(d).\text{t_d} = \bot\\[2ex]
&\forall m \in M: \\
&\quad \text{transmit}(m).\text{t_x} = \text{now}() \land \\
&\quad \text{transmit}(m).\text{t_s} = m.\text{t_s}\\[2ex]
&\forall m \in M: \\
&\quad \text{receive}(m).\text{t_r} = \text{now}() \land \\
&\quad \text{receive}(m).\text{t_x} = m.\text{t_x}\\[2ex]
&\forall m \in M: \\
&\quad \text{deliver}(m).\text{t_d} = \text{now}() \land \\
&\quad \text{deliver}(m).\text{t_r} = m.\text{t_r}
\end{aligned}
$$

### 1.5 Queue-Message Integration

Queue state transitions with message operations:
$$
\small
\begin{aligned}
&\text{enqueue}(Q, m) = \{ Q' \mid Q'.M = Q.M \cup \{m\} \land\\
&\quad Q'.\text{tail} = Q.\text{tail} + 1 \land\\
&\quad |Q'.M| \leq MAX\_QUEUE\_SIZE \}\\[2ex]
&\text{dequeue}(Q) = (m, Q') \text{ where }\\
&\quad m = Q.M[\text{head}] \land\\
&\quad Q'.M = Q.M \setminus \{m\} \land\\
&\quad Q'.\text{head} = Q.\text{head} + 1
\end{aligned}
$$

Operation effects on rate limiting:
$$
\small
\begin{aligned}
&\forall w \in W, m \in M:\\
&\quad \text{transmit}(m) \implies \text{increment}(w, m)\\[1ex]
&\forall Q, m \in M:\\
&\quad \text{send}(m) \implies \text{enqueue}(Q, m)
\end{aligned}
$$

## 2. States and Events

States:
$$\small S = \{\text{disconnected}, \text{connecting}, \text{connected}, \text{reconnecting}\}$$

Events:
$$
\small
\begin{aligned}
E = \{&\text{CONNECT}, \text{CONNECTED}, \text{DISCONNECT},\\
&\text{ERROR}, \text{RECONNECT}, \text{SEND}, \text{RECEIVE}\}
\end{aligned}
$$

## 3. Context Structure

$$
\small
\begin{aligned}
C = \{&\text{url}: \text{String} \cup \{\bot\},\\
&\text{socket}: \text{WebSocket} \cup \{\bot\},\\
&\text{error}: \text{Error} \cup \{\bot\},\\
&\text{retries}: \mathbb{N},\\
&\text{window}: R,\\
&\text{queue}: Q\}
\end{aligned}
$$

Initial context:
$$
\small
\begin{aligned}
c_0 = \{&\text{url}: \bot,\\
&\text{socket}: \bot,\\
&\text{error}: \bot,\\
&\text{retries}: 0,\\
&\text{window}: R_0,\\
&\text{queue}: Q_0\}
\end{aligned}
$$

## 4. State Invariants

For each state $s \in S$:
$$
\small
\begin{aligned}
I(s) \equiv
\begin{cases}
\text{socket} = \bot \land \text{error} = \bot \land\\
\quad\text{retries} = 0 \land \text{queue} = Q_0
  & \text{if } s = \text{disconnected}\\[2ex]
\text{socket} \neq \bot \land \text{socket.readyState} = 0
  & \text{if } s = \text{connecting}\\[2ex]
\text{socket} \neq \bot \land \text{socket.readyState} = 1 \land\\
\quad\text{error} = \bot
  & \text{if } s = \text{connected}\\[2ex]
\text{socket} = \bot \land \text{error} \neq \bot \land\\
\quad\text{retries} > 0
  & \text{if } s = \text{reconnecting}
\end{cases}
\end{aligned}
$$

## 5. Transition Function

$$
\small
\begin{aligned}
\delta(s,e) =
\begin{cases}
\text{connecting} & \text{if } s = \text{disconnected} \land e = \text{CONNECT}\\[1ex]
\text{connected} & \text{if } s = \text{connecting} \land e = \text{CONNECTED}\\[1ex]
\text{reconnecting} & \text{if } s \in \{\text{connecting}, \text{connected}\} \land\\
& \quad e = \text{ERROR}\\[1ex]
\text{disconnected} & \text{if } s = \text{connected} \land e = \text{DISCONNECT}\\[1ex]
\text{connecting} & \text{if } s = \text{reconnecting} \land e = \text{RECONNECT} \land\\
& \quad \text{retries} \leq MAX\_RETRIES\\[1ex]
\text{disconnected} & \text{if } s = \text{reconnecting} \land\\
& \quad \text{retries} > MAX\_RETRIES
\end{cases}
\end{aligned}
$$

## 6. Timing Properties

Connection timing:
$$
\small
\begin{aligned}
&\text{Connect timeout}: 0 < t \leq CONNECT\_TIMEOUT\\[1ex]
&\text{Retry delay}: d_n = \min(INITIAL\_RETRY\_DELAY \times RETRY\_MULTIPLIER^n,\\
&\quad MAX\_RETRY\_DELAY)
\end{aligned}
$$

Health check timing:
$$
\small
\begin{aligned}
&\text{Ping interval}: 15000\ \text{ms} \leq t \leq 60000\ \text{ms}\\
&\text{Pong timeout}: t \leq 5000\ \text{ms}
\end{aligned}
$$

## 7. Message Ordering

For messages $m_1, m_2$:
$$
\small
\begin{aligned}
&t_s(m_1) < t_s(m_2) \implies t_x(m_1) < t_x(m_2)\\[1ex]
&t_r(m_1) < t_r(m_2) \implies t_d(m_1) < t_d(m_2)
\end{aligned}
$$

Queue ordering constraints:
$$
\small
\begin{aligned}
&\forall m_1, m_2 \in Q.M:\\
&\quad \text{index}(m_1) < \text{index}(m_2) \implies\\
&\quad t_s(m_1) < t_s(m_2) \land t_d(m_1) < t_d(m_2)
\end{aligned}
$$

## 8. Error Handling

Define error types:
$$
\small
\begin{aligned}
\text{Error} &= \{\text{ConnectionError}, \text{TimeoutError}, \text{RateLimitError}\}\\
\text{ErrorState} &= (\text{type}: \text{Error}, \text{message}: \text{String}, t: \mathbb{R}^+)
\end{aligned}
$$

Error propagation rules:
$$
\small
\begin{aligned}
&\forall e \in \text{Error}:\\
&\quad s = \text{connected} \land \text{raise}(e) \implies\\
&\quad \delta(s, \text{ERROR}) = \text{reconnecting} \land\\
&\quad c.\text{error} = \text{ErrorState}(e, m, \text{now}())
\end{aligned}
$$

## 9. Initial States

Let $R_0$ be the initial rate limiting system:
$$
\small
\begin{aligned}
R_0 &= (W_0, 0, t_0)\\
\text{where}& \begin{cases}
W_0 = \emptyset\\
t_0 = \text{now}()
\end{cases}
\end{aligned}
$$

Let $Q_0$ be the initial message queue:
$$
\small Q_0 = (\emptyset, MAX\_QUEUE\_SIZE, 0, 0)
$$

## 10. Helper Functions

Define the attribute update function:
$$
\small
\begin{aligned}
&\text{set}: M \times (\text{Attribute} \times \mathbb{R}^+) \rightarrow M\\
&\text{set}(m, (attr, value)) = m'\\
&\quad \text{where } m'.attr = value \land\\
&\quad \forall a \neq attr: m'.a = m.a
\end{aligned}
$$

Define the current time function:
$$
\small
\begin{aligned}
&\text{now}: () \rightarrow \mathbb{R}^+\\
&\text{now}() = t \text{ where } t \text{ is current UTC timestamp}
\end{aligned}
$$

## 11. Window Management

Define window expiration:
$$
\small
\begin{aligned}
&\text{expire}: W \times t \rightarrow W'\\
&\text{expire}(W, t) = \{w \in W \mid w.\text{expiry} > t\}
\end{aligned}
$$

Define window creation:
$$
\small
\begin{aligned}
&\text{create}: () \rightarrow w_0\\
&\text{create}() = (\text{now}(), 0, \text{now}() + WINDOW\_SIZE)
\end{aligned}
$$

## 12. Queue Management

Define queue overflow behavior:
$$
\small
\begin{aligned}
&\text{enqueue}(Q, m) = \begin{cases}
(Q', \text{true}) & \text{if } |Q.M| < MAX\_QUEUE\_SIZE\\
(Q, \text{false}) & \text{otherwise}
\end{cases}\\
&\text{where } Q'.M = Q.M \cup \{m\}
\end{aligned}
$$

Define queue clear operation:
$$
\small
\begin{aligned}
&\text{clear}: Q \rightarrow Q_0\\
&\text{clear}(Q) = (\emptyset, Q.\text{cap}, 0, 0)
\end{aligned}
$$

## 13. WebSocket Type Definition

Define WebSocket type:
$$
\small
\begin{aligned}
\text{WebSocket} &= (\\
&\quad \text{url}: \text{String},\\
&\quad \text{readyState}: \{0, 1, 2, 3\},\\
&\quad \text{protocol}: \text{String} \cup \{\bot\},\\
&\quad \text{extensions}: \text{Set}[\text{String}]\\
)
\end{aligned}
$$

Where readyState values represent:
$$
\small
\begin{aligned}
&0 \implies \text{CONNECTING}\\
&1 \implies \text{OPEN}\\
&2 \implies \text{CLOSING}\\
&3 \implies \text{CLOSED}
\end{aligned}
$$

## 14. System Safety Properties

Define global safety properties:
$$
\small
\begin{aligned}
&\text{Property 1 (No Message Loss):}\\
&\quad \forall m \in M: t_s(m) \neq \bot \implies\\
&\quad \exists t: t_d(m) \neq \bot \lor m \in Q.M\\[2ex]
&\text{Property 2 (Rate Limit Compliance):}\\
&\quad \forall w \in W: w.\text{count} \leq MAX\_MESSAGES\\[2ex]
&\text{Property 3 (Message Ordering):}\\
&\quad \forall m_1, m_2 \in M:\\
&\quad t_s(m_1) < t_s(m_2) \implies t_d(m_1) < t_d(m_2)\\[2ex]
&\text{Property 4 (State Consistency):}\\
&\quad \forall s \in S: I(s) \text{ holds}
\end{aligned}
$$

## 15. Transition Effects

Define context update function:
$$
\small
\begin{aligned}
&\text{updateContext}: C \times S \times E \rightarrow C\\
&\text{incrementRetries}: C \rightarrow C
\end{aligned}
$$

Extended transition function with context effects:
$$
\small
\begin{aligned}
\delta(s,e,c) =
\begin{cases}
(\text{connecting}, c') & \text{if } s = \text{disconnected} \land e = \text{CONNECT}\\
& \text{where } c' = c.\text{set}(\text{socket}, \text{new WebSocket}())\\[1ex]
(\text{connected}, c') & \text{if } s = \text{connecting} \land e = \text{CONNECTED}\\
& \text{where } c' = c.\text{set}(\text{error}, \bot)\\[1ex]
(\text{reconnecting}, c') & \text{if } s \in \{\text{connecting}, \text{connected}\} \land\\
& \quad e = \text{ERROR}\\
& \text{where } c' = \text{incrementRetries}(c)\\[1ex]
(\text{disconnected}, c') & \text{if } s = \text{connected} \land e = \text{DISCONNECT}\\
& \text{where } c' = c_0\\[1ex]
(\text{connecting}, c') & \text{if } s = \text{reconnecting} \land e = \text{RECONNECT}\\
& \quad \land c.\text{retries} \leq MAX\_RETRIES\\
& \text{where } c' = c.\text{set}(\text{socket}, \text{new WebSocket}())\\[1ex]
(\text{disconnected}, c_0) & \text{if } s = \text{reconnecting} \land\\
& \quad c.\text{retries} > MAX\_RETRIES
\end{cases}
\end{aligned}
$$

## 16. Core Properties

Define essential system properties:
$$
\small
\begin{aligned}
&\text{1. Message Preservation:}\\
&\quad \forall m \in M: t_s(m) \neq \bot \implies t_d(m) \neq \bot \lor m \in Q.M\\[2ex]
&\text{2. Rate Limiting:}\\
&\quad \forall w \in W: w.\text{count} \leq MAX\_MESSAGES\\[2ex]
&\text{3. Message Ordering:}\\
&\quad t_s(m_1) < t_s(m_2) \implies t_d(m_1) < t_d(m_2)\\[2ex]
&\text{4. State Validity:}\\
&\quad \forall s \in S: I(s) \text{ holds}
\end{aligned}
$$

## 17. Scalability and Extensibility

Define message type extensions:
$$
\small
\begin{aligned}
\text{MessageType} &= \{\text{TEXT}, \text{BINARY}, \text{PING}, \text{PONG}\}\\[1ex]
M_{ext} &= (M \times \text{MessageType} \times \text{Priority})\\[1ex]
\text{Priority} &= \{\text{HIGH}, \text{NORMAL}, \text{LOW}\}
\end{aligned}
$$

## 18. Performance Requirements

Define critical performance bounds:
$$
\small
\begin{aligned}
&\text{1. Message Rate:}\\
&\quad \text{rate}(t) = |\{m \in M \mid t_s(m) \in [t, t+1000]\}| \leq 1000\\[2ex]
&\text{2. Message Latency:}\\
&\quad \text{latency}(m) = t_d(m) - t_s(m) \leq 100\ \text{ms}\\[2ex]
&\text{3. Memory Usage:}\\
&\quad |Q.M| \leq MAX\_QUEUE\_SIZE
\end{aligned}
$$

# Appendices

## Appendix A: Formal Proofs

### A.1 Proof of Message Preservation

**Claim:** For all messages $m \in M$, if $t_s(m) \neq \bot$, then $t_d(m) \neq \bot \lor m \in Q.M$.

**Proof:**
$$
\small
\begin{aligned}
&\text{Base case:}\\
&\quad \text{When message } m \text{ is sent:}\\
&\quad t_s(m) = \text{now}() \land m \in Q.M\\[1ex]
&\text{Inductive step:}\\
&\quad \text{For any message } m \text{ in transition:}\\
&\quad m \in Q.M \implies\\
&\quad (\exists t: \text{transmit}(m) \land t_x(m) = t) \lor\\
&\quad (\exists t: \text{receive}(m) \land t_r(m) = t) \lor\\
&\quad (\exists t: \text{deliver}(m) \land t_d(m) = t)\\[1ex]
&\text{Therefore:}\\
&\quad t_s(m) \neq \bot \implies t_d(m) \neq \bot \lor m \in Q.M
\end{aligned}
$$

### A.2 Proof of Rate Limiting

**Claim:** For all windows $w \in W$, $w.\text{count} \leq MAX\_MESSAGES$.

**Proof:**
$$
\small
\begin{aligned}
&\text{For any window } w \in W:\\
&\quad \text{increment}(w, m) \text{ is only called by transmit}(m)\\
&\quad \text{transmit}(m) \text{ checks window constraints before execution}\\
&\quad \therefore w.\text{count} \leq MAX\_MESSAGES \text{ is preserved}
\end{aligned}
$$

## Appendix B: Extended Performance Analysis

### B.1 Performance Monitoring Functions

Define comprehensive monitoring capabilities:
$$
\small
\begin{aligned}
&\text{measureLatency}: M \rightarrow \mathbb{R}^+\\
&\text{measureThroughput}: \mathbb{R}^+ \times \mathbb{R}^+ \rightarrow \mathbb{N}\\
&\text{measureResourceUsage}: (Q \cup W) \rightarrow \mathbb{R}^+
\end{aligned}
$$

### B.2 Resource Usage Details

Extended resource constraints:
$$
\small
\begin{aligned}
&\text{Queue Memory:}\\
&\quad |Q.M| \times \text{sizeof}(M) \leq 100\ \text{MB}\\[1ex]
&\text{Window Memory:}\\
&\quad |W| \times \text{sizeof}(w) \leq 10\ \text{MB}\\[1ex]
&\text{Total Memory Bound:}\\
&\quad \text{totalMemory}(Q, W) \leq 120\ \text{MB}
\end{aligned}
$$

## Appendix C: Implementation Guidelines

### C.1 Error Handling Implementation

Detailed error handling strategies:
$$
\small
\begin{aligned}
&\text{1. Connection Errors:}\\
&\quad \text{handleConnectionError}: \text{Error} \rightarrow \text{reconnecting}\\[1ex]
&\text{2. Rate Limit Errors:}\\
&\quad \text{handleRateLimit}: \text{Error} \rightarrow \text{backoff}\\[1ex]
&\text{3. Protocol Errors:}\\
&\quad \text{handleProtocolError}: \text{Error} \rightarrow \text{reset}
\end{aligned}
$$

### C.2 Message Processing Guidelines

Message handling recommendations:
$$
\small
\begin{aligned}
&\text{1. Buffering Strategy:}\\
&\quad \text{buffer}(m) = \begin{cases}
\text{enqueue}(m) & \text{if } |Q.M| < 0.9 \times MAX\_QUEUE\_SIZE\\
\text{dropOldest}() + \text{enqueue}(m) & \text{otherwise}
\end{cases}\\[2ex]
&\text{2. Processing Priority:}\\
&\quad \text{priority}(m) = \begin{cases}
\text{HIGH} & \text{if } m.\text{type} \in \{\text{PING}, \text{PONG}\}\\
\text{NORMAL} & \text{otherwise}
\end{cases}
\end{aligned}
$$