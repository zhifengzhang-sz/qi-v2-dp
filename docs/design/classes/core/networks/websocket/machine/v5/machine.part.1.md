# WebSocket Client Formal Specification

## 1. Introduction

This document provides a **formal specification** for the **WebSocket Client** system, denoted as $\mathcal{WC}$. The specification is structured to emphasize the **core state machine**, defining the fundamental states, events, actions, and transitions that govern the primary behavior of the WebSocket Client. Additionally, it includes sections for **optional features** such as rate limiting and message queuing to enhance system functionality without complicating the core specifications.

## 2. Underlying Machine Model

The formal specification of $\mathcal{WC}$ is based on the **State Transition System (STS)** model, defined as follows:

$$
\mathcal{M} = (S, E, A, \delta, s_0)
$$

where:

- **$S$** is a finite set of **states**.
- **$E$** is a finite set of **events**.
- **$A$** is a finite set of **actions**.
- **$\delta: S \times E \rightarrow S \times 2^A$** is the **state transition function**, mapping a state and an event to a new state and a set of actions.
- **$s_0 \in S$** is the **initial state**.

## 3. Core State Machine Specification

### 3.1 States ($S$)

Each state represents a distinct mode of operation for the WebSocket Client. The set of states is defined as:

$$
S = \{\text{Disconnected}, \text{Connecting}, \text{Connected}, \text{Error}\}
$$

- **Disconnected:** No active WebSocket connection.
- **Connecting:** Attempting to establish a WebSocket connection.
- **Connected:** Successfully established and active WebSocket connection.
- **Error:** An error has occurred within the system.

### 3.2 Events ($E$)

Events are occurrences that trigger state transitions within $\mathcal{WC}$. The set of events is defined as:

$$
E = \{\text{CONNECT\_REQUEST}, \text{CONNECTION\_SUCCESS}, \text{CONNECTION\_FAILURE}, \text{DISCONNECT\_REQUEST}, \text{CONNECTION\_CLOSED}, \text{SEND\_MESSAGE}, \text{MESSAGE\_RECEIVED}, \text{ERROR\_OCCURRED}\}
$$

- **CONNECT\_REQUEST:** Request to establish a WebSocket connection.
- **CONNECTION\_SUCCESS:** Notification of a successful WebSocket connection.
- **CONNECTION\_FAILURE:** Notification of a failed WebSocket connection attempt.
- **DISCONNECT\_REQUEST:** Request to terminate the WebSocket connection.
- **CONNECTION\_CLOSED:** Notification that the WebSocket connection has been closed.
- **SEND\_MESSAGE:** Request to send a message through the WebSocket.
- **MESSAGE\_RECEIVED:** Notification of a received message from the WebSocket.
- **ERROR\_OCCURRED:** Notification of an error within the system.

### 3.3 Actions ($A$)

Actions are operations performed in response to events, potentially resulting in state transitions or modifications to system components. The set of actions is defined as:

$$
A = \{\text{InitiateConnection}, \text{HandleConnectionSuccess}, \text{HandleConnectionFailure}, \text{TerminateConnection}, \text{SendMessage}, \text{ReceiveMessage}, \text{LogError}\}
$$

- **InitiateConnection:** Start establishing a WebSocket connection.
- **HandleConnectionSuccess:** Handle the successful establishment of a WebSocket connection.
- **HandleConnectionFailure:** Manage failed connection attempts, possibly initiating retries.
- **TerminateConnection:** Close the active WebSocket connection.
- **SendMessage:** Transmit a message through the WebSocket.
- **ReceiveMessage:** Process a message received from the WebSocket.
- **LogError:** Record error details for debugging and monitoring.

### 3.4 Transition Function ($\delta$)

The transition function defines how $\mathcal{WC}$ moves from one state to another in response to events, executing corresponding actions.

$$
\delta: S \times E \rightarrow S \times 2^A
$$

#### 3.4.1 Transition Rules

The following table summarizes the transition rules for $\mathcal{WC}$:

| Current State | Event              | Next State  | Actions                 |
|---------------|--------------------|-------------|-------------------------|
| Disconnected  | CONNECT_REQUEST    | Connecting  | InitiateConnection      |
| Connecting    | CONNECTION_SUCCESS | Connected   | HandleConnectionSuccess |
| Connecting    | CONNECTION_FAILURE | Disconnected| HandleConnectionFailure |
| Connected     | DISCONNECT_REQUEST | Disconnected| TerminateConnection     |
| Connected     | CONNECTION_CLOSED  | Disconnected| TerminateConnection     |
| Connected     | SEND_MESSAGE       | Connected   | SendMessage             |
| Connected     | MESSAGE_RECEIVED   | Connected   | ReceiveMessage          |
| Any State     | ERROR_OCCURRED     | Error       | LogError                |

**Notes:**

- **Any State:** The `ERROR_OCCURRED` event can transition the system from any state to the `Error` state.
- **Messages:** In the `Connecting` state, a `CONNECTION_FAILURE` event leads back to `Disconnected`, indicating a failed attempt to connect.

#### 3.4.2 Initial State

The initial state of the system is:

$$
s_0 = \text{Disconnected}
$$

## 4. Formal Properties of Components

Each component within $\mathcal{WC}$ possesses formal properties that define its behavior and constraints, ensuring the system operates reliably and predictably.

### 4.1 State Integrity

At any time $t$, $\mathcal{WC}$ is in exactly one of its defined states.

$$
\forall t, \, |\{ s \in S \ | \ \mathcal{WC}(t) = s \}| = 1
$$

### 4.2 Valid Transitions

Transitions between states adhere strictly to the defined transition function $\delta$.

$$
\forall s \in S, \, e \in E, \, \delta(s, e) \in S \times 2^A
$$

### 4.3 Action Execution

Actions are executed precisely as defined during state transitions.

$$
\forall s \in S, \, e \in E, \, a \in \delta(s, e).A \implies \text{Action } a \text{ is executed}
$$

## 5. System Invariants

System invariants ensure that $\mathcal{WC}$ maintains consistency and adheres to defined constraints throughout its operation.

### 5.1 Single Active State

The system is always in exactly one state at any given time.

$$
\forall t, \, |\{ s \in S \ | \ \mathcal{M}(t) = s \}| = 1
$$

### 5.2 Deterministic Transitions

For each state and event pair, there is exactly one defined transition.

$$
\forall s \in S, \, e \in E, \, |\delta(s, e)| = 1
$$

### 5.3 No Undefined States

All transitions result in states within the defined set $S$.

$$
\forall s \in S, \, e \in E, \, \delta(s, e).S \in S
$$

## 6. Safety Properties

Safety properties ensure that $\mathcal{WC}$ operates reliably, preventing undesirable scenarios and maintaining system integrity.

### 6.1 No Invalid State Entry

The system cannot enter a state outside the defined set $S$.

$$
\forall t, \, \mathcal{WC}(t) \in S
$$

### 6.2 Error Handling

Upon encountering an error, the system transitions to the `Error` state, ensuring errors are consistently managed.

$$
\forall s \in S, \, e = \text{ERROR_OCCURRED}, \, \delta(s, e).S = \text{Error}
$$

### 6.3 Connection Consistency

A successful connection leads to the `Connected` state, and a failure results in the `Disconnected` state, maintaining logical consistency.

$$
\begin{align*}
\forall s = \text{Connecting}, \, e = \text{CONNECTION_SUCCESS}, \, \delta(s, e).S &= \text{Connected} \\
\forall s = \text{Connecting}, \, e = \text{CONNECTION_FAILURE}, \, \delta(s, e).S &= \text{Disconnected}
\end{align*}
$$

## 7. Optional Features

While the core state machine defines the fundamental behavior of the WebSocket Client, additional features can enhance functionality and user experience. These features are optional and can be integrated without altering the core state machine.

### 7.1 Rate Limiting

Implements controls to prevent excessive message sending, ensuring compliance with server policies and preventing potential overloads.

#### 7.1.1 Definition

$$
\mathcal{R} = (W, \text{MAX\_MESSAGES}, \text{WINDOW\_SIZE})
$$

where:

- **$W$** is a sliding window over time.
- **$\text{MAX\_MESSAGES} \in \mathbb{N}$** is the maximum messages allowed per window.
- **$\text{WINDOW\_SIZE} \in \mathbb{R}^+$** is the window duration in milliseconds.

#### 7.1.2 Properties

1. **Rate Compliance:**

   The number of messages sent within any window does not exceed $\text{MAX\_MESSAGES}$.

   $$
   \forall t, \, |W(t)| \leq \text{MAX\_MESSAGES}
   $$

2. **Sliding Window Accuracy:**

   Each sliding window accurately reflects the defined `WINDOW_SIZE`.

   $$
   \forall t, \, \text{duration}(W(t)) \leq \text{WINDOW\_SIZE}
   $$

3. **canSend Functionality:**

   Determines if a message can be sent without violating rate limits.

   $$
   \text{canSend}(t) = 
   \begin{cases}
     \text{true} & \text{if } |W(t)| < \text{MAX\_MESSAGES} \\
     \text{false} & \text{otherwise}
   \end{cases}
   $$
   
### 7.2 Message Queue

Manages messages awaiting transmission, ensuring order and handling overflow scenarios.

#### 7.2.1 Definition

$$
\mathcal{Q} = (M, \text{MAX\_QUEUE\_SIZE})
$$

where:

- **$M$** is an ordered list of messages.
- **$\text{MAX\_QUEUE\_SIZE} \in \mathbb{N}$** is the maximum allowable messages in the queue.

#### 7.2.2 Properties

1. **FIFO Order:**

   Messages are dequeued in the exact order they were enqueued.

   $$
   \forall m_1, m_2 \in M, \, \text{if } m_1 \text{ enqueued before } m_2, \text{ then } m_1 \text{ dequeued before } m_2
   $$

2. **Capacity Constraint:**

   $$
   |M| \leq \text{MAX\_QUEUE\_SIZE}
   $$

3. **Overflow Handling:**

   Upon reaching capacity, the oldest message is removed to enqueue a new message.

   $$
   \text{If } |M| = \text{MAX\_QUEUE\_SIZE}, \text{ then } M.\text{remove}(m_{\text{oldest}}) \text{ before } M.\text{add}(m_{\text{new}})
   $$

