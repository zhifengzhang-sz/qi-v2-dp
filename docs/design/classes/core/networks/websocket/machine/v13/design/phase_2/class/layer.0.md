Below is a **Layer 0** example set of four `.md` files—**`common.types.md`**, **`events.types.md`**, **`states.types.md`**, and **`errors.types.md`**—that define the **core types** we’ll use throughout the rest of the WebSocket Client design. Each file references the **formal specs** (`machine.md`, `websocket.md`) in relevant sections. These files are **not** final code; they’re design documents that specify types, constants, and enumerations in a way that can be turned into actual code (TypeScript, Java, etc.) later on.

---

# File 1: `common.types.md`

```md
# common.types.md

## Overview
This file defines **common constants, enumerations, and utility types** used throughout the WebSocket Client.  
References:
- `machine.md` for timing and retry constraints
- `websocket.md` for protocol constants and close codes

---

## 1. Constants

### Connection & Retry
- **MAX_RETRIES**: `5`  
  From `machine.md` section 1.1 and 4.1 (retry limit).  
- **INITIAL_RETRY_DELAY**: `1000` (ms)  
  From `machine.md` timing definition (1.1).  
- **MAX_RETRY_DELAY**: `60000` (ms)  
  From `machine.md` timing definition.  
- **RETRY_MULTIPLIER**: `1.5`  
  Exponential backoff multiplier.

### Timeouts
- **CONNECT_TIMEOUT**: `30000` (ms)  
- **DISCONNECT_TIMEOUT**: `3000` (ms)  
- **STABILITY_TIMEOUT**: `5000` (ms)

### Message Constraints
- **MAX_QUEUE_SIZE**: `1000`  
  Max number of buffered messages.  
- **MAX_MESSAGE_SIZE**: `1 MB` (or `1048576` bytes)  
  May be enforced at the protocol framing level.  
- **RATE_LIMIT**: `100` (msgs/sec)  
  (From `machine.md` or `websocket.md` rate-limiting if applicable.)

---

## 2. Common Enums

### ConnectionStatus
Represents a *high-level* status used by external interfaces (optional mapping to internal states).

```pseudo
enum ConnectionStatus {
  CLOSED,
  CONNECTING,
  OPEN,
  CLOSING,
  RECONNECTING,
  STABILIZING
}
```

Referenced in `machine.md` (states: disconnected → CLOSED, connecting → CONNECTING, etc.).

### CloseCode (Optional)
While exact codes often come from the WebSocket standard, we may define known constants here:

```pseudo
enum CloseCode {
  NORMAL_CLOSURE = 1000,
  GOING_AWAY = 1001,
  PROTOCOL_ERROR = 1002,
  UNSUPPORTED_DATA = 1003,
  POLICY_VIOLATION = 1008,
  MESSAGE_TOO_BIG = 1009,
  INTERNAL_ERROR = 1011
}
```
(From `websocket.md` section 1.2.)

---

## 3. Utility Types

### TimeMs
An alias for “number” indicating milliseconds.

```pseudo
type TimeMs = number
```

### Bytes
An alias for “number” indicating bytes size (useful for message size checks).

```pseudo
type Bytes = number
```

---

## 4. Notes & References

- **machine.md**: Sections 1.1 (System Constants), 4.1 (Connection Timing), 2.5 (Transition constraints for timeouts).
- **websocket.md**: Additional close code definitions in section 1.2, protocol constraints for message size in section 1.10.

```

---

# File 2: `events.types.md`

```md
# events.types.md

## Overview
Defines **all events** the WebSocket Client may handle or dispatch, referencing `machine.md` (section 2.2) and `websocket.md` (section 1.3).

---

## 1. Core Event Enum

From `machine.md` section 2.2, we have:

- `CONNECT`
- `DISCONNECT`
- `OPEN`
- `CLOSE`
- `ERROR`
- `RETRY`
- `MAX_RETRIES` (reached)
- `TERMINATE`
- `MESSAGE`
- `SEND`
- `PING`
- `PONG`
- `DISCONNECTED`
- `RECONNECTED`
- `STABILIZED`

We can represent them as an enumeration:

```pseudo
enum ClientEvent {
  CONNECT,
  DISCONNECT,
  OPEN,
  CLOSE,
  ERROR,
  RETRY,
  MAX_RETRIES_REACHED,
  TERMINATE,
  MESSAGE,
  SEND,
  PING,
  PONG,
  DISCONNECTED,
  RECONNECTED,
  STABILIZED
}
```

---

## 2. Event Payloads

Some events may carry data:

1. **ERROR**  
   - Could have `errorCode`, or a reference to the `CloseCode`.
2. **MESSAGE**  
   - Might include the actual message payload from server or client.
3. **SEND**  
   - Outbound message content to be queued or sent.

A possible approach is to define typed structures, e.g.:

```pseudo
type ErrorEventPayload = {
  code: number
  message?: string
}

type MessageEventPayload = {
  data: any
  timestamp: TimeMs
}
```
---

## 3. WebSocket-Specific Events (Optional Sub-Enum)

From `websocket.md` section 1.3:

```pseudo
enum WebSocketEvent {
  open,
  close,
  error,
  message,
  disconnected,
  reconnected,
  stabilized
}
```
(If we prefer merging them into `ClientEvent`, that’s fine too—just keep it consistent.)

---

## 4. References

- `machine.md` section 2.2 for the full list of named events.
- `websocket.md` section 1.3 for protocol event types.
- Each event is associated with transitions in the state machine definitions (see `states.types.md` and `machine.class.md`).

```

---

# File 3: `states.types.md`

```md
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

```

---

# File 4: `errors.types.md`

```md
# errors.types.md

## Overview
Classifies errors for the WebSocket Client, referencing `machine.md` (error actions) and `websocket.md` (close codes, error classification).  

---

## 1. ErrorType Enum

From `websocket.md` section 1.11 (Error Handling Properties) or section 1.10 (Message Handling if relevant), we see errors can be:

- **Recoverable** (network issues, code 1001 or 1006 possibly)
- **Fatal** (protocol errors 1002, 1003, 1008)
- **Transient** (others, or custom classification)

```pseudo
enum ErrorType {
  RECOVERABLE,
  FATAL,
  TRANSIENT
}
```

---

## 2. Error Structures

We might define a structure to carry more details:

```pseudo
type ClientError = {
  code: number,
  reason?: string,
  type: ErrorType
}
```
(where `code` might be a `CloseCode` from `common.types.md`).

---

## 3. Mapping Close Codes to ErrorType

`websocket.md` defines close codes like `1002` = PROTOCOL_ERROR. We can store them in a map or table:

| Code  | Meaning            | Default ErrorType |
|-------|--------------------|--------------------|
| 1000  | NORMAL_CLOSURE     | Might not be error |
| 1001  | GOING_AWAY         | RECOVERABLE?       |
| 1002  | PROTOCOL_ERROR     | FATAL              |
| 1003  | UNSUPPORTED_DATA   | FATAL              |
| 1008  | POLICY_VIOLATION   | FATAL              |
| 1009  | MESSAGE_TOO_BIG    | FATAL              |
| 1011  | INTERNAL_ERROR     | FATAL              |

(Feel free to adjust logic as needed.)

---

## 4. References

- `websocket.md` sections 1.2, 1.11 for close code definitions and error classification.  
- `machine.md` for `ERROR` events and related transitions.


```

---

## Summary

We now have **Layer 0** with four `.md` files that define all our **core types**, enumerations, and constants:

1. **`common.types.md`**  
2. **`events.types.md`**  
3. **`states.types.md`**  
4. **`errors.types.md`**

**Next Step**: Move on to **Layer 1** (Base Interfaces & Classes) where we create files like `interfaces/internal.interface.md`, `state/context.class.md`, `protocol/errors.class.md`, `message/queue.class.md`, etc.  

Together, these Layer 0 definitions will power everything that follows—**every class** in subsequent layers will import from these `.md` specs to stay consistent with the formal specs (`machine.md` and `websocket.md`).