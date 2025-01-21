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
