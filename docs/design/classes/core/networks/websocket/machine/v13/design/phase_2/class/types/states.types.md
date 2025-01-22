# states.types.md

## Overview

Lists **all states** from the formal specs, referencing `machine.md` (sections 2.1, 2.5) and `websocket.md` (section 1.1 for state mapping).

---

## 1. Core State Enum

From `machine.md` section 2.1:

- `disconnected`
- `disconnecting`
- `connecting`
- `connected`
- `reconnecting`
- `reconnected`

```pseudo
enum ClientState {
  DISCONNECTED,
  DISCONNECTING,
  CONNECTING,
  CONNECTED,
  RECONNECTING,
  RECONNECTED
}
```

---

## 2. Optional Extended States

Depending on our design, we might also define:

```pseudo
// If needed
enum TerminatedState {
  TERMINATED
}
```

Or fold `terminated` into `ClientState`. The same if we want a “transient” internal state or “stabilizing” sub-state.

---

## 3. State Mapping (High-Level)

`websocket.md` section 1.1 mentions these states map to core states in `machine.md`:

- `disconnected` -> `s_1`
- `disconnecting` -> `s_2`
- `connecting` -> `s_3`
- `connected` -> `s_4`
- `reconnecting` -> `s_5`
- `reconnected` -> `s_6`

We can note that for design reference:

```pseudo
// Just a note for clarity
// s_1 = DISCONNECTED
// s_2 = DISCONNECTING
// ...
```

---

## 4. References

- `machine.md` sections 2.1 and 2.5 (transitions).
- `websocket.md` sections 1.1, 1.3 (protocol states).
- Class-level logic that uses these states will appear in `machine.class.md` and `transition.class.md`.

## 5. State Invariants

From `machine.md` section 2.6.1:

### Disconnected State

```pseudo
when DISCONNECTED:
  socket = null
  error = null
  reconnectAttempts = 0
```

### Disconnecting State
```pseudo
when DISCONNECTING:
  socket != null
  disconnectReason != null
  duration <= DISCONNECT_TIMEOUT
```

### Connecting State

```pseudo
when CONNECTING:
  socket != null
  url != null
  duration <= CONNECT_TIMEOUT
```

### Connected State

```pseudo
when CONNECTED:
  socket != null
  error = null
  readyState = 1
```

### Reconnecting State

```pseudo
when RECONNECTING:
  socket = null
  retries <= MAX_RETRIES
  error != null
```

### Reconnected State

```pseudo
when RECONNECTED:
  socket != null
  reconnectCount > 0
  lastStableConnection != null
  duration <= STABILITY_TIMEOUT
```
