# WebSocket Implementation to Mathematical Model Mapping

## 1. Overview

This document provides formal mappings between the mathematical specification defined in `machine.part.1.md` and the implementation design specified in `machine.part.2.md`. It establishes the precise relationships between abstract mathematical constructs and their concrete implementations.

## 2. State Machine Mapping

### 2.1 State Space Mapping ($S$)

The state space $S$ maps to the xstate configuration as follows:

For $S = \{disconnected, connecting, connected, reconnecting\}$:

- Each $s \in S$ maps to a distinct xstate state node
- State value function $V: S \rightarrow StateValue$ where:
$$
V(s) = \begin{cases}
'disconnected' & \text{ if } s = disconnected \\
'connecting' & \text{ if } s = connecting \\
'connected' & \text{ if } s = connected \\
'reconnecting' & \text{ if } s = reconnecting
\end{cases}
$$

State configuration function $\Phi$ ensures:
- $\forall t, |\Phi(t)| = 1$ (exactly one state active)
- State transitions preserve configuration: $\Phi(t) \rightarrow \Phi(t+1)$ valid
- Initial state $\Phi(0) = \{disconnected\}$

### 2.2 Event Space Mapping ($E$)

The event space $E$ maps to xstate events through event mapping function $\Psi$:

$$
\Psi: E \rightarrow EventObject
$$

where:
$$
\begin{aligned}
\Psi(CONNECT\_REQUEST) &= \{type: "CONNECT", url: String\} \\
\Psi(CONNECTION\_SUCCESS) &= \{type: "SUCCESS"\} \\
\Psi(CONNECTION\_FAILURE) &= \{type: "FAILURE", error: Error\}
\end{aligned}
$$

Properties preserved:
1. Event uniqueness: $\forall e_1,e_2 \in E, e_1 \neq e_2 \implies \Psi(e_1) \neq \Psi(e_2)$
2. Completeness: $\forall e \in E, \exists \Psi(e)$
3. Type safety: $\Psi$ preserves event payload types

### 2.3 Action Space Mapping ($A$)

The action space $A$ maps to xstate actions through action mapping function $\Omega$:

$$
\Omega: A \rightarrow ActionObject
$$

where:
$$
\begin{aligned}
\Omega(InitiateConnection) &= \{type: "initiateConnection", exec: Context \rightarrow Context\} \\
\Omega(HandleConnectionSuccess) &= \{type: "handleSuccess", exec: Context \rightarrow Context\}
\end{aligned}
$$

Action composition preserved:
$$
\forall a_1,a_2 \in A: \Omega(a_1 \circ a_2) = \Omega(a_1) \circ \Omega(a_2)
$$

## 3. Context Mappings

### 3.1 Context Structure Mapping

The context space $C$ maps to xstate context through structure mapping $\Theta$:

$$
\Theta: C \rightarrow TypedContext
$$

where:
$$
\begin{aligned}
\Theta(url) &\rightarrow String \cup \{null\} \\
\Theta(socket) &\rightarrow WebSocket \cup \{null\} \\
\Theta(error) &\rightarrow Error \cup \{null\} \\
\Theta(retries) &\rightarrow \mathbb{N} \\
\Theta(window) &\rightarrow RateLimit \\
\Theta(queue) &\rightarrow MessageQueue
\end{aligned}
$$

Properties maintained:
1. Type preservation: $\forall x \in C, type(\Theta(x)) = type(x)$
2. Nullable handling: $\forall x \in C, x = \bot \iff \Theta(x) = null$
3. Range preservation: $\forall x \in C, range(\Theta(x)) = range(x)$

### 3.2 Context Transformer Mapping

Context transformers $\gamma$ map to xstate assign actions through transformer mapping $\Gamma$:

$$
\Gamma: \gamma \rightarrow AssignAction
$$

where:
$$
\begin{aligned}
\Gamma(\gamma_1) &\text{ maps StoreUrl to context assignment} \\
\Gamma(\gamma_2) &\text{ maps ResetRetries to context assignment} \\
\Gamma(\gamma_3) &\text{ maps HandleError to context assignment}
\end{aligned}
$$

Properties preserved:
1. Immutability: $\forall \gamma \in \Gamma, \gamma(c)$ creates new context
2. Type safety: $\forall \gamma \in \Gamma, \gamma$ preserves context types
3. Composition: $\Gamma(\gamma_1 \circ \gamma_2) = \Gamma(\gamma_1) \circ \Gamma(\gamma_2)$

## 4. Guards and Invariants

### 4.1 State Invariant Mapping

State invariants $I(s)$ map to type guards through invariant mapping $\Lambda$:

$$
\Lambda: I \rightarrow TypeGuard
$$

where:
$$
\begin{aligned}
\Lambda(I(disconnected)) &\text{ enforces } socket = null \land error = null \land retries = 0 \\
\Lambda(I(connecting)) &\text{ enforces } socket \neq null \land readyState = 0 \\
\Lambda(I(connected)) &\text{ enforces } socket \neq null \land readyState = 1 \land error = null \\
\Lambda(I(reconnecting)) &\text{ enforces } socket = null \land error \neq null \land retries > 0
\end{aligned}
$$

Properties maintained:
1. Completeness: $\forall s \in S, \exists \Lambda(I(s))$
2. Exclusivity: $\forall s_1,s_2 \in S, s_1 \neq s_2 \implies \Lambda(I(s_1)) \land \Lambda(I(s_2)) = \emptyset$
3. Runtime enforcement: Invariants checked on every transition

### 4.2 Transition Guard Mapping

Mathematical guards $G$ map to xstate guards through guard mapping $\Pi$:

$$
\Pi: G \rightarrow GuardPredicate
$$

where:
$$
\begin{aligned}
\Pi(CanConnect) &\text{ enforces } \lambda c.(c.socket = null \land c.error = null) \\
\Pi(CanReconnect) &\text{ enforces } \lambda c.(c.retries < MAX\_RETRIES) \\
\Pi(ShouldTerminate) &\text{ enforces } \lambda c.(c.retries \geq MAX\_RETRIES \lor c.error.fatal)
\end{aligned}
$$

## 5. Property Mappings

### 5.1 Safety Property Mapping

Safety properties $P$ map to runtime checks through safety mapping $\Sigma$:

$$
\Sigma: P \rightarrow RuntimeCheck
$$

where:
$$
\begin{aligned}
\Sigma(NoUndefinedStates) &\text{ ensures } state \in S \\
\Sigma(SingleActiveConnection) &\text{ ensures } |connections| \leq 1 \\
\Sigma(RateLimitEnforcement) &\text{ ensures } messageRate \leq MAX\_RATE
\end{aligned}
$$

### 5.2 Liveness Property Mapping

Liveness properties $L$ map to async validators through liveness mapping $\Delta$:

$$
\Delta: L \rightarrow AsyncValidator
$$

where:
$$
\begin{aligned}
\Delta(EventualConnection) &\text{ ensures } \Diamond(connected \lor error) \\
\Delta(EventualMessageDelivery) &\text{ ensures } \Box(queued \implies \Diamond delivered) \\
\Delta(EventualTermination) &\text{ ensures } \Diamond(terminated)
\end{aligned}
$$