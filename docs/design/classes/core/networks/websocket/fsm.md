## 1. State machine specification of the `WebSocketClient`

To design an effective and maintainable state machine for the `WebSocketClient`, we'll outline its **states**, **events**, **transitions**, and **actions**. This formal definition serves as a blueprint before delving into the actual implementation.

---

### 1.1. Overview

The `WebSocketClient` manages a WebSocket connection's lifecycle, handling various states such as connecting, connected, disconnected, and handling errors. Additionally, it incorporates reconnection logic to ensure robustness against transient network issues.

---

### 1.2. States

| **State**       | **Description**                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `disconnected`  | The client is not connected to the WebSocket server.                                                |
| `connecting`    | The client is in the process of establishing a connection to the WebSocket server.                  |
| `connected`     | The client has successfully established a connection and is actively communicating with the server. |
| `reconnecting`  | The client is attempting to re-establish a connection after a disconnection or error.               |
| `disconnecting` | The client is in the process of gracefully closing the connection.                                  |

---

### 1.3. Events

| **Event**     | **Payload**                        | **Description**                                                                  |
| ------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `CONNECT`     | `{ url: string }`                  | Initiates a connection to the specified WebSocket server URL.                    |
| `DISCONNECT`  | _None_                             | Initiates a graceful disconnection from the WebSocket server.                    |
| `OPEN`        | _None_                             | Indicates that the WebSocket connection has been successfully established.       |
| `CLOSE`       | `{ code: number; reason: string }` | Indicates that the WebSocket connection has been closed.                         |
| `ERROR`       | `{ error: Error }`                 | Indicates that an error has occurred with the WebSocket connection.              |
| `RETRY`       | _None_                             | Triggers a reconnection attempt after a disconnection or error.                  |
| `MAX_RETRIES` | _None_                             | Indicates that the maximum number of reconnection attempts has been reached.     |
| `TERMINATE`   | _None_                             | Forcefully terminates the WebSocket connection without attempting reconnections. |

---

### 1.4. Transitions

| **From State**  | **Event**     | **To State**    | **Actions**                                                                                          |
| --------------- | ------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `disconnected`  | `CONNECT`     | `connecting`    | - Store the `url` from the event payload.                                                            |
| `connecting`    | `OPEN`        | `connected`     | - Reset reconnection attempts.<br>- Log successful connection.                                       |
| `connecting`    | `ERROR`       | `reconnecting`  | - Store the error.<br>- Log the error.<br>- Increment reconnection attempts.                         |
| `connecting`    | `CLOSE`       | `disconnected`  | - Log the closure reason.                                                                            |
| `connected`     | `DISCONNECT`  | `disconnecting` | - Initiate graceful shutdown.<br>- Log disconnection initiation.                                     |
| `connected`     | `ERROR`       | `reconnecting`  | - Store the error.<br>- Log the error.<br>- Increment reconnection attempts.                         |
| `connected`     | `CLOSE`       | `reconnecting`  | - Log the closure.<br>- Increment reconnection attempts.                                             |
| `reconnecting`  | `RETRY`       | `connecting`    | - Attempt to reconnect using the stored `url`.                                                       |
| `reconnecting`  | `MAX_RETRIES` | `disconnected`  | - Log that maximum reconnection attempts have been reached.<br>- Stop further reconnection attempts. |
| `disconnecting` | `CLOSE`       | `disconnected`  | - Log successful disconnection.<br>- Clean up resources.                                             |
| Any State       | `TERMINATE`   | `disconnected`  | - Forcefully close the WebSocket.<br>- Log termination.<br>- Reset reconnection attempts.            |

---

### 1.5. Actions

| **Action Name**       | **Description**                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `storeUrl`            | Saves the WebSocket server URL from the `CONNECT` event into the machine's context for future reconnections. |
| `resetRetries`        | Resets the reconnection attempts counter to zero upon a successful connection.                               |
| `logConnection`       | Logs successful connection establishment.                                                                    |
| `handleError`         | Logs the error and updates the context with the error details.                                               |
| `incrementRetries`    | Increments the reconnection attempts counter each time a reconnection is attempted.                          |
| `logClosure`          | Logs the reason for the WebSocket connection closure.                                                        |
| `initiateShutdown`    | Starts the graceful disconnection process.                                                                   |
| `logDisconnection`    | Logs that a disconnection has been initiated.                                                                |
| `attemptReconnection` | Attempts to reconnect by sending the `RETRY` event after a specified delay.                                  |
| `logMaxRetries`       | Logs that the maximum number of reconnection attempts has been reached.                                      |
| `forceTerminate`      | Forcefully terminates the WebSocket connection without attempting to reconnect.                              |

---

### 1.6. Context

The state machine maintains a **context** object to store dynamic data required across different states and transitions.

| **Property**        | **Type**             | **Description**                                                |
| ------------------- | -------------------- | -------------------------------------------------------------- |
| `url`               | `string`             | The WebSocket server URL to connect to.                        |
| `reconnectAttempts` | `number`             | The current number of reconnection attempts made.              |
| `error`             | `Error` _(optional)_ | The last error encountered during connection or communication. |

---

### 1.7. Reconnection Strategy

To ensure the `WebSocketClient` is resilient, a reconnection strategy is defined with the following parameters:

- **Maximum Reconnection Attempts (`maxReconnectAttempts`):** Defines how many times the client should attempt to reconnect before giving up.

- **Reconnection Interval (`reconnectInterval`):** The delay between consecutive reconnection attempts.

These parameters can be externalized as configuration options when initializing the state machine or the `WebSocketClient`.

---

### 1.8. Visual Representation

While not mandatory, visualizing the state machine can aid in understanding and communicating its behavior. Here's a simplified diagram representing the state transitions:

```
[disconnected] -- CONNECT --> [connecting]
[connecting] -- OPEN --> [connected]
[connecting] -- ERROR --> [reconnecting]
[connecting] -- CLOSE --> [disconnected]
[connected] -- DISCONNECT --> [disconnecting]
[connected] -- ERROR --> [reconnecting]
[connected] -- CLOSE --> [reconnecting]
[reconnecting] -- RETRY --> [connecting]
[reconnecting] -- MAX_RETRIES --> [disconnected]
[disconnecting] -- CLOSE --> [disconnected]
```

_Arrows indicate transitions triggered by events._

---

## 2. Formal definition

### 2.1. State Machine Representation

A **Finite State Machine (FSM)** can be formally defined as a 5-tuple:

\[
\mathcal{M} = (S, \Sigma, \delta, s_0, F)
\]

Where:

- \( S \) is a finite set of **states**.
- \( \Sigma \) is a finite set of **events** (inputs).
- \( \delta: S \times \Sigma \rightarrow S \) is the **transition function**.
- \( s_0 \in S \) is the **initial state**.
- \( F \subseteq S \) is the set of **final (accepting) states** (optional).

However, for more complex scenarios involving context (data associated with states) and actions (side-effects), we extend this to include:

\[
\mathcal{M} = (S, E, \delta, s_0, C, \gamma, F)
\]

Where:

- \( E \) is the set of **external events**.
- \( C \) is the set of **context variables**.
- \( \gamma \) represents **actions** triggered by transitions.

### 2.2. Definitions for WebSocketClient

#### States ($S$)

\[
S = \{s_i\mid i=1,2,\dots,n;\ n=5\}
\]
where
\[
\begin{eqnarray}
s_1 &=& \text{Disconnected}, \\
s_2 &=& \text{Connecting}, \\
s_3 &=& \text{Connected}, \\
s_4 &=& \text{Reconnecting},\\
s_5 &=& \text{Disconnecting}.
\end{eqnarray}
\]

For readability, we also use the following notations:

\[
\begin{eqnarray}
s_1 &=& s_{\tiny\text{Disconnected}}, \\
s_2 &=& s_{\tiny\text{Connecting}}, \\
s_3 &=& s_{\tiny\text{Connected}}, \\
s_4 &=& s_{\tiny\text{Reconnecting}},\\
s_5 &=& s_{\tiny\text{Disconnecting}}.
\end{eqnarray}
\]

#### Events (\( \Sigma \))

\[
\Sigma = \{\sigma_i\mid i=1,2,\dots,m;\ m=8\}  
\]
where
\[
\begin{eqnarray}
\sigma_1 &=& \text{CONNECT}, \\
\sigma_2 &=& \text{DISCONNECT}, \\
\sigma_3 &=& \text{OPEN}, \\
\sigma_4 &=& \text{CLOSE}, \\
\sigma_5 &=& \text{ERROR}, \\
\sigma_6 &=& \text{RETRY}, \\
\sigma_7 &=& \text{MAX_RETRIES}, \\
\sigma_8 &=& \text{TERMINATE}.
\end{eqnarray}
\]

or,

\[
\begin{eqnarray}
\sigma_1 &=& \sigma_{\tiny\text{CONNECT}}, \\
\sigma_2 &=& \sigma_{\tiny\text{DISCONNECT}}, \\
\sigma_3 &=& \sigma_{\tiny\text{OPEN}}, \\
\sigma_4 &=& \sigma_{\tiny\text{CLOSE}}, \\
\sigma_5 &=& \sigma_{\tiny\text{ERROR}}, \\
\sigma_6 &=& \sigma_{\tiny\text{RETRY}}, \\
\sigma_7 &=& \sigma_{\tiny\text{MAX_RETRIES}}, \\
\sigma_8 &=& \sigma_{\tiny\text{TERMINATE}}.
\end{eqnarray}
\]

#### Context (\( C \))

\[
C = \{c_i\mid i=1,2,3\}  
\]
where,
\[
\begin{eqnarray}
c_1 &=& \text{url}: \text{String}, \\
c_2 &=& \text{reconnectAttempts}: \text{Integer}, \\
c_3 &=& \text{error}: \text{Error (optional)}.
\end{eqnarray}
\]

or,

\[
\begin{eqnarray}
c_1 &=& c_{\tiny\text{url}}, \\
c_2 &=& c_{\tiny\text{reconnectAttempts}}, \\
c_3 &=& c_{\tiny\text{error}}.
\end{eqnarray}
\]

#### Transition Function (\( \delta \))

\[
\delta: S \times \Sigma \rightarrow S
\]

Defined as:

\[
\begin{aligned}
\delta(s_{\tiny\text{Disconnected}}, \sigma_{\tiny\text{CONNECT}}) & = s_{\tiny\text{Connecting}} \\
\delta(s_{\tiny\text{Connecting}}, \sigma_{\tiny\text{OPEN}}) & = s_{\tiny\text{Connected}} \\
\delta(s_{\tiny\text{Connecting}}, \sigma_{\tiny\text{ERROR}}) & = s_{\tiny\text{Reconnecting}} \\
\delta(s_{\tiny\text{Connecting}}, \sigma_{\tiny\text{CLOSE}}) & = s_{\tiny\text{Disconnected}} \\
\delta(s_{\tiny\text{Connected}}, \sigma_{\tiny\text{DISCONNECT}}) & = s_{\tiny\text{Disconnecting}} \\
\delta(s_{\tiny\text{Connected}}, \sigma_{\tiny\text{ERROR}}) & = s_{\tiny\text{Reconnecting}} \\
\delta(s_{\tiny\text{Connected}}, \sigma_{\tiny\text{CLOSE}}) & = s_{\tiny\text{Reconnecting}} \\
\delta(s_{\tiny\text{Reconnecting}}, \sigma_{\tiny\text{RETRY}}) & = s_{\tiny\text{Connecting}} \\
\delta(s_{\tiny\text{Reconnecting}}, \sigma_{\tiny\text{MAX_RETRIES}}) & = s_{\tiny\text{Disconnected}} \\
\delta(s_{\tiny\text{Disconnecting}}, \sigma_{\tiny\text{CLOSE}}) & = s_{\tiny\text{Disconnected}} \\
\delta(s, \sigma_{\tiny\text{TERMINATE}}) & = s_{\tiny\text{Disconnected}}, \forall s\in S
\end{aligned}
\]

or in words,
\[
\begin{aligned}
\delta(\text{Disconnected}, \text{CONNECT}) & = \text{Connecting} \\
\delta(\text{Connecting}, \text{OPEN}) & = \text{Connected} \\
\delta(\text{Connecting}, \text{ERROR}) & = \text{Reconnecting} \\
\delta(\text{Connecting}, \text{CLOSE}) & = \text{Disconnected} \\
\delta(\text{Connected}, \text{DISCONNECT}) & = \text{Disconnecting} \\
\delta(\text{Connected}, \text{ERROR}) & = \text{Reconnecting} \\
\delta(\text{Connected}, \text{CLOSE}) & = \text{Reconnecting} \\
\delta(\text{Reconnecting}, \text{RETRY}) & = \text{Connecting} \\
\delta(\text{Reconnecting}, \text{MAX_RETRIES}) & = \text{Disconnected} \\
\delta(\text{Disconnecting}, \text{CLOSE}) & = \text{Disconnected} \\
\delta(\text{Any}, \text{TERMINATE}) & = \text{Disconnected}
\end{aligned}
\]

_Note:_ "Any" refers to all states \( S \).

#### Actions (\( \Gamma \))

Each transition in the state machine may trigger one or more **actions**. Actions are operations that can modify the machine's context or produce side effects (such as logging). Formally, each action \( \gamma \in \Gamma \) is defined as a function:

\[
\gamma: C \times \Sigma \rightarrow C'
\]

Where:
- \( C \) is the current context.
- \( \Sigma \) is the set of events.
- \( C' \) is the updated context after the action is performed.

In the `WebsocketClient` state machine, each transition may trigger one or more the following **actions**:

- **\(\gamma_1\)=`StoreURL`:** On `CONNECT`.
- **\(\gamma_2\)=`ResetRetries`:** On successful `OPEN`.
- **\(\gamma_3\)=`LogEvents`:** On various transitions (`Connected`, `Disconnected`, `Error`, etc.).
- **\(\gamma_4\)=`HandleErrors`:** On `ERROR` events.
- **\(\gamma_5\)=`InitiateReconnection`:** On `ERROR` or `CLOSE`.
- **\(\gamma_6\)=`TerminateConnection`:** On `TERMINATE`.

1. **Trigger:** On `CONNECT` event.

   **Definition:**
\[
\gamma_1(c, \sigma_{\tiny\text{CONNECT}}) = c'
\]
\[
c' = c \cup \{ c_{\tiny\text{url}}: \text{url}\in\sigma_{\tiny\text{CONNECT}} \}
\]

   **Description:** Stores the WebSocket server URL from the `CONNECT` event into the machine's context.


2. **Trigger:** On successful `OPEN` event.

   **Definition:**
\[
\gamma_2(c, \sigma_{\tiny\text{OPEN}}) = c'
\]
\[
c' = c \cup \{ c_{\tiny\text{reconnectAttempts}}: 0 \}
\]

   **Description:** Resets the `reconnectAttempts` counter to zero upon a successful connection.

3, **Trigger:** On various transitions (`Connected`, `Disconnected`, `Error`, etc.).

   **Definition:**
\[
\gamma_3(c, \sigma) = c
\]

   **Side Effect:** Log the event \(\sigma\), type with relevant context information.

   **Description:** Logs event details for transitions such as `Connected`, `Disconnected`, and `Error`. This action does not modify the context.

4. **Trigger:** On `ERROR` events.

   **Definition:**
\[
\gamma_4(c, \sigma_{\tiny\text{ERROR}}) = c'
\]
\[
c' = c \cup \{ c_{\tiny\text{error}}: \text{error}\in\sigma_{\tiny\text{ERROR}} \}
\]

   **Description:** Stores the error information from an `ERROR` event into the context and logs the error.

5. **Trigger:** On `ERROR` or `CLOSE` events.

   **Definition:**
\[
\gamma_5(c, \sigma_{\tiny\text{ERROR}}/\sigma_{\tiny\text{CLOSE}}) = c'
\]
\[
c' = c \cup \{ c_{\tiny\text{reconnectAttempts}}: c_{\tiny\text{reconnectAttempts}} + 1 \}
\]

   **Description:** Increments the `reconnectAttempts` counter and logs the reconnection attempt. If `reconnectAttempts` exceed a predefined maximum, triggers the `MAX_RETRIES` event.

6. Trigger:** On `TERMINATE` event from any state.

   **Definition:**
\[
\gamma_6(c, \sigma_{\tiny\text{TERMINATE}}) = c'
\]
\[
c' = \text{Reset Context to Initial State}
\]

   **Side Effect:** Forcefully close the WebSocket connection and log termination.


   **Description:** Forcefully terminates the WebSocket connection without attempting to reconnect. Resets the context to its initial state and logs the termination.

---

### Summary of Actions

| **Action (\( \gamma \))** | **Trigger Event**        | **Functionality**                                                                             |
|----------------------------|--------------------------|-----------------------------------------------------------------------------------------------|
| \( \gamma_1 \) - `StoreURL`       | `CONNECT`                | Stores the `url` from the `CONNECT` event into the context.                                  |
| \( \gamma_2 \) - `ResetRetries`   | `OPEN`                   | Resets the `reconnectAttempts` counter to zero upon a successful connection.                 |
| \( \gamma_3 \) - `LogEvent`       | Various (`Connected`, `Disconnected`, `Error`, etc.) | Logs the type of event along with relevant context information.                                 |
| \( \gamma_4 \) - `HandleError`    | `ERROR`                  | Stores the encountered error in the context and logs the error details.                       |
| \( \gamma_5 \) - `InitiateReconnection` | `ERROR`, `CLOSE`         | Increments the `reconnectAttempts` counter, logs the reconnection attempt, and triggers `MAX_RETRIES` if necessary. |
| \( \gamma_6 \) - `TerminateConnection` | `TERMINATE`             | Forcefully closes the WebSocket connection, resets the context, and logs the termination.     |

---

### Applying Actions to Transitions

Each transition in the state machine is augmented with the corresponding actions it should execute. The following table maps each transition to its associated actions:

| **Transition** | **Trigger Event** | **Actions (\( \Gamma \))**                             |
|----------------|-------------------|---------------------------------------------------------|
| Disconnected → Connecting | `CONNECT` | \( \gamma_1 \) (`StoreURL`)                            |
| Connecting → Connected | `OPEN` | \( \gamma_2 \) (`ResetRetries`), \( \gamma_3 \) (`LogEvent`) |
| Connecting → Reconnecting | `ERROR` | \( \gamma_4 \) (`HandleError`), \( \gamma_5 \) (`InitiateReconnection`) |
| Connecting → Disconnected | `CLOSE` | \( \gamma_3 \) (`LogEvent`)                            |
| Connected → Disconnecting | `DISCONNECT` | \( \gamma_3 \) (`LogEvent`), \( \gamma_5 \) (`InitiateReconnection`) |
| Connected → Reconnecting | `ERROR` | \( \gamma_4 \) (`HandleError`), \( \gamma_5 \) (`InitiateReconnection`) |
| Connected → Reconnecting | `CLOSE` | \( \gamma_3 \) (`LogEvent`), \( \gamma_5 \) (`InitiateReconnection`) |
| Reconnecting → Connecting | `RETRY` | \( \gamma_3 \) (`LogEvent`)                            |
| Reconnecting → Disconnected | `MAX_RETRIES` | \( \gamma_3 \) (`LogEvent`)                            |
| Disconnecting → Disconnected | `CLOSE` | \( \gamma_3 \) (`LogEvent`)                            |
| Any State → Disconnected | `TERMINATE` | \( \gamma_6 \) (`TerminateConnection`)                |

---

## 3. TikZ Diagram

Below is the **TikZ** code to visualize the `WebSocketClient` state machine. This diagram illustrates the states and transitions based on the events.

```latex
\documentclass{standalone}
\usepackage{tikz}
\usetikzlibrary{automata, positioning, arrows.meta}

\begin{document}

\begin{tikzpicture}[node distance=2.5cm, >=Stealth, on grid, auto]
    % Define states
    \node[state, initial] (Disconnected) {Disconnected};
    \node[state, right=of Disconnected] (Connecting) {Connecting};
    \node[state, right=of Connecting] (Connected) {Connected};
    \node[state, below=of Connecting] (Reconnecting) {Reconnecting};
    \node[state, below=of Disconnected] (Disconnecting) {Disconnecting};

    % Transitions from Disconnected
    \path[->]
        (Disconnected) edge node {CONNECT} (Connecting);

    % Transitions from Connecting
    \path[->]
        (Connecting) edge node {OPEN} (Connected)
        (Connecting) edge node {ERROR} (Reconnecting)
        (Connecting) edge [bend right] node {CLOSE} (Disconnected);

    % Transitions from Connected
    \path[->]
        (Connected) edge node {DISCONNECT} (Disconnecting)
        (Connected) edge node {ERROR} (Reconnecting)
        (Connected) edge node {CLOSE} (Reconnecting);

    % Transitions from Reconnecting
    \path[->]
        (Reconnecting) edge node {RETRY} (Connecting)
        (Reconnecting) edge node {MAX\_RETRIES} (Disconnected);

    % Transitions from Disconnecting
    \path[->]
        (Disconnecting) edge node {CLOSE} (Disconnected);

    % Transitions from Any State to Disconnected on TERMINATE
    \path[->, dashed]
        (Disconnected) edge [loop above] node {TERMINATE} ()
        (Connecting) edge [bend right] node {TERMINATE} (Disconnected)
        (Connected) edge [bend left] node {TERMINATE} (Disconnected)
        (Reconnecting) edge [bend right] node {TERMINATE} (Disconnected)
        (Disconnecting) edge [bend left] node {TERMINATE} (Disconnected);
\end{tikzpicture}

\end{document}
```

### 3.1. Explanation of the Diagram

- **States:**

  - **Disconnected:** Initial state where no WebSocket connection exists.
  - **Connecting:** Attempting to establish a connection.
  - **Connected:** Successfully connected to the WebSocket server.
  - **Reconnecting:** Trying to re-establish the connection after a failure or disconnection.
  - **Disconnecting:** Gracefully closing the existing connection.

- **Transitions:**

  - **CONNECT:** Initiates connection from `Disconnected` to `Connecting`.
  - **OPEN:** Successful connection from `Connecting` to `Connected`.
  - **ERROR:** Encounter an error during `Connecting` or `Connected` leading to `Reconnecting`.
  - **CLOSE:** Connection closed from `Connecting` leads to `Disconnected`; from `Connected` leads to `Reconnecting`.
  - **DISCONNECT:** Initiates disconnection from `Connected` to `Disconnecting`.
  - **RETRY:** Attempts to reconnect from `Reconnecting` back to `Connecting`.
  - **MAX_RETRIES:** Exceeded reconnection attempts from `Reconnecting` back to `Disconnected`.
  - **TERMINATE:** Forcefully terminates connection from any state back to `Disconnected` (represented by dashed arrows).

- **Dashed Arrows:**
  - Represent global transitions applicable from **any** state, specifically the `TERMINATE` event leading to `Disconnected`.

---

## 4. Implementation plan

With the formal definition and diagram in hand, the next steps involve:

1. **Implementing the State Machine:**

   - Translate the formal definitions into XState v5 syntax within your `WebSocketClient`.
   - Coding the defined states, events, transitions, and actions using XState v5.

2. **Integrating with Existing Code:**

   - Ensure that the `WebSocketClient` interacts seamlessly with the state machine, handling events and context appropriately.
   - Embedding the state machine logic within the `WebSocketClient` class to manage connections based on state transitions.

3. **Updating and Enhancing Tests:**

   - Modify existing tests to align with the new state machine behavior, ensuring comprehensive coverage and reliability.
   - Add new tests to cover all transitions and edge cases.

4. **Enhancing Functionality:** Adding additional features like heartbeat mechanisms, message handling, and subscription management as needed, while maintaining simplicity.

5. **Documentation and Maintenance:**
   - Document the state machine within your codebase for future reference.
   - Utilize tools like XState Visualizer for ongoing visualization and debugging.
