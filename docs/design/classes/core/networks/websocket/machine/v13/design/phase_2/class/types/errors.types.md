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
