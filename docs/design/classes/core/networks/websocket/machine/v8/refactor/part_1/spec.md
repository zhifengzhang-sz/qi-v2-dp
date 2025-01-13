# WebSocket Core Mathematical Changes for v9

## 1. State Space Extension

### 1.1 Current State Space (v8)
From machine.part.1.md:
$$
S = \{s_i \mid i=1,2,\dots,n;\ n=4\}
$$
where
$$
\begin{aligned}
s_1 &= \text{disconnected} \\
s_2 &= \text{connecting} \\
s_3 &= \text{connected} \\
s_4 &= \text{reconnecting}
\end{aligned}
$$

### 1.2 Proposed State Space (v9)
$$
S = \{s_i \mid i=1,2,\dots,n;\ n=6\}
$$
where
$$
\begin{aligned}
s_1 &= \text{disconnected} \\
s_2 &= \text{disconnecting} \\
s_3 &= \text{connecting} \\
s_4 &= \text{connected} \\
s_5 &= \text{reconnecting} \\
s_6 &= \text{reconnected}
\end{aligned}
$$

## 2. Transition Function Updates

### 2.1 New Transitions Required
$$
\begin{aligned}
\delta(s_4, e_{\text{disconnect}}) &= s_2 \\
\delta(s_2, e_{\text{disconnected}}) &= s_1 \\
\delta(s_5, e_{\text{reconnected}}) &= s_6 \\
\delta(s_6, e_{\text{stabilized}}) &= s_4
\end{aligned}
$$

### 2.2 Transition Determinism
Property must be preserved:
$$
\forall s \in S, e \in E: |\delta(s,e)| = 1
$$

## 3. Event Space Extension

### 3.1 New Events Required
$$
E = E \cup \{e_{\text{disconnected}}, e_{\text{reconnected}}, e_{\text{stabilized}}\}
$$

### 3.2 Event Characterization
$$
\begin{aligned}
\text{type}(e_{\text{disconnected}}) &= \text{internal} \\
\text{type}(e_{\text{reconnected}}) &= \text{internal} \\
\text{type}(e_{\text{stabilized}}) &= \text{internal}
\end{aligned}
$$

Let me give the complete Section 4.1 in spec.md showing how it should look with the necessary additions (additions marked with `(NEW)`):

## 4. Context Extension

### 4.1 New Context Properties
$$
\small
C = C \cup \left\{
\begin{aligned}
&\text{disconnectReason}: \text{String} \cup \{\bot\}, \\
&\text{reconnectCount}: \mathbb{N}, \\
&\text{lastStableConnection}: \mathbb{R}^+ \cup \{\bot\}
\end{aligned}
\right\}
$$

### 4.2 New Context Constraints
$$
\begin{aligned}
\text{Bounds}: &\\
&\text{reconnectCount} \leq \text{MAX\_RETRIES} \\
&\text{lastStableConnection} \leq \text{now}()
\end{aligned}
$$

### 4.3 New State-Context Relationships
$$
\begin{aligned}
s = s_2 &\implies \text{disconnectReason} \neq \bot \\
s = s_6 &\implies \text{reconnectCount} > 0 \\
s = s_4 &\implies \text{lastStableConnection} \neq \bot
\end{aligned}
$$

### 4.4 New Timing Bounds
$$
\begin{aligned}
s = s_2 &\implies \text{duration}(s) \leq \text{DISCONNECT\_TIMEOUT} \\
s = s_6 &\implies \text{duration}(s) \leq \text{STABILITY\_TIMEOUT}
\end{aligned}
$$

## 5. Action Space Extension

### 5.1 New Actions Required
$$
\gamma = \gamma \cup \{
\begin{aligned}
&\gamma_{\text{initDisconnect}}: C \times E \rightarrow C, \\
&\gamma_{\text{completeDisconnect}}: C \times E \rightarrow C, \\
&\gamma_{\text{stabilizeReconnection}}: C \times E \rightarrow C
\end{aligned}
\}
$$

### 5.2 Action Properties
$$
\begin{aligned}
\gamma_{\text{initDisconnect}}(c, e) &= c' \text{ where } c'.\text{disconnectReason} = e.\text{reason} \\
\gamma_{\text{completeDisconnect}}(c, e) &= c' \text{ where } c'.\text{socket} = \bot \\
\gamma_{\text{stabilizeReconnection}}(c, e) &= c' \text{ where } c'.\text{lastStableConnection} = \text{now}()
\end{aligned}
$$

### 5.3 Action Sequencing
$$
\begin{aligned}
s_4 \xrightarrow{\gamma_{\text{initDisconnect}}} s_2 &\implies \text{next}(\gamma) = \gamma_{\text{completeDisconnect}} \\
s_5 \xrightarrow{\gamma_{\text{stabilizeReconnection}}} s_6 &\implies \text{next}(\gamma) = \gamma_{\text{cleanupReconnect}}
\end{aligned}
$$

### 5.4 Action Invariants
$$
\begin{aligned}
\text{Pre}(\gamma_{\text{initDisconnect}}) &: \text{socket} \neq \bot \\
\text{Post}(\gamma_{\text{initDisconnect}}) &: \text{disconnectReason} \neq \bot \\
\text{Pre}(\gamma_{\text{stabilizeReconnection}}) &: \text{reconnectCount} > 0 \\
\text{Post}(\gamma_{\text{stabilizeReconnection}}) &: \text{lastStableConnection} \neq \bot
\end{aligned}
$$

## 6. Safety Properties

### 6.1 State Integrity
$$
\forall t: |\{s \in S \mid \text{active}(s,t)\}| = 1
$$

### 6.2 Transition Safety
$$
\begin{aligned}
s_2 &\implies \text{previous}(s) \in \{s_3, s_4\} \\
s_6 &\implies \text{previous}(s) = s_5
\end{aligned}
$$

### 6.3 Context Safety
$$
\begin{aligned}
s \in \{s_2, s_6\} &\implies c.\text{socket} \neq \bot \\
s = s_1 &\implies c.\text{socket} = \bot \\
s = s_2 &\implies c.\text{disconnectReason} \neq \bot \\
s = s_6 &\implies c.\text{reconnectCount} > 0
\end{aligned}
$$

### 6.4 Resource Safety
$$
\begin{aligned}
\forall s \in S: &\\
&\text{socket} \neq \bot \implies \text{valid}(\text{socket}) \\
&\text{reconnectCount} \leq \text{MAX\_RETRIES} \\
&\text{hasTimeout}(s) \implies \text{duration}(s) \leq \text{TIMEOUT}(s)
\end{aligned}
$$

## 7. Liveness Properties

### 7.1 Progress Guarantees
$$
\begin{aligned}
s = s_2 &\implies \Diamond(s = s_1) \\
s = s_6 &\implies \Diamond(s = s_4)
\end{aligned}
$$

### 7.2 Termination
$$
\begin{aligned}
s = s_2 &\implies \Diamond_{\leq t_{\text{max}}}(s = s_1) \\
s = s_6 &\implies \Diamond_{\leq t_{\text{max}}}(s = s_4)
\end{aligned}
$$

## 8. Property Preservation

### 8.1 Original Properties
$$
\begin{aligned}
&\text{Property}_{\text{v8}}(S, \delta, \gamma) \implies \\
&\text{Property}_{\text{v9}}(S', \delta', \gamma')
\end{aligned}
$$

### 8.2 New Properties
$$
\begin{aligned}
\text{Symmetry}_{\text{disconnect}}&: s_4 \xrightarrow{e} s_2 \xrightarrow{e'} s_1 \\
\text{Symmetry}_{\text{reconnect}}&: s_5 \xrightarrow{e} s_6 \xrightarrow{e'} s_4
\end{aligned}
$$

## 9. Implementation Requirements

### 9.1 State Requirements
- Unique state identification
- Clear transition conditions
- Context management
- Event handling

### 9.2 Context Requirements
- Safe property initialization
- Cleanup procedures
- Thread-safe modifications

### 9.3 Action Requirements
- Atomic execution
- Error handling
- Resource management
- State consistency
