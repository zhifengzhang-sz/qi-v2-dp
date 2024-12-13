# WebSocketClient State Machine

## 1. State Definitions

The `WebSocketClient` state machine consists of the following states:

- **Disconnected:** Initial state where no WebSocket connection exists.
- **Connecting:** Attempting to establish a connection.
- **Connected:** Successfully connected to the WebSocket server.
- **Reconnecting:** Attempting to re-establish a connection after an error.
- **Disconnecting:** Attempting to gracefully close the connection.

## 2. State Transitions

The table maps each transition to its associated actions:

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
```