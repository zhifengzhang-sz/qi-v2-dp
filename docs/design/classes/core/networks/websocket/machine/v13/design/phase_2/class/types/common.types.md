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

Represents a _high-level_ status used by external interfaces (optional mapping to internal states).

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
