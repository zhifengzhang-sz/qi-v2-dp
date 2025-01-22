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

| Code | Meaning          | Default ErrorType  |
| ---- | ---------------- | ------------------ |
| 1000 | NORMAL_CLOSURE   | Might not be error |
| 1001 | GOING_AWAY       | RECOVERABLE?       |
| 1002 | PROTOCOL_ERROR   | FATAL              |
| 1003 | UNSUPPORTED_DATA | FATAL              |
| 1008 | POLICY_VIOLATION | FATAL              |
| 1009 | MESSAGE_TOO_BIG  | FATAL              |
| 1011 | INTERNAL_ERROR   | FATAL              |

(Feel free to adjust logic as needed.)

---

## 4. References

- `websocket.md` sections 1.2, 1.11 for close code definitions and error classification.
- `machine.md` for `ERROR` events and related transitions.

## 5. Error Classification Logic

From `websocket.md` section 1.11.1 (Error Classification):

### 1. Default Error Classification

```pseudo
function classifyError(error, closeCode?): ErrorType {
  if (closeCode) {
    // Close codes from WebSocket protocol
    switch (closeCode) {
      case 1001, 1006:
        return ErrorType.RECOVERABLE  // 'Going Away' or abnormal close
      case 1002, 1003, 1008:
        return ErrorType.FATAL        // Protocol violations
      default:
        return ErrorType.TRANSIENT    // Other codes
    }
  }

  // Non-protocol errors (e.g., connection failures)
  if (error instanceof NetworkError) {
    return ErrorType.RECOVERABLE
  }

  if (error instanceof ProtocolError) {
    return ErrorType.FATAL
  }

  return ErrorType.TRANSIENT  // Default classification
}
```

### 2. Error State Requirements

From `websocket.md` section 1.11.1:

```pseudo
// Error state consistency rules
invariant ERROR_STATE_CONSISTENCY:
  when lastError != null:
    currentState in [RECONNECTING, DISCONNECTED]
  when currentState == RECONNECTING:
    lastError != null
```

### 3. Error Context Tracking

Error context must maintain:

- Last error type and details
- Retry count for recoverable errors
- Error history within current session

<blockquote>

Note: This bridges between the error code mapping and recovery rules by:

1. Defining the classification logic that converts errors into types
2. Specifying error state invariants
3. Outlining error context requirements

The classification logic then feeds into section 6's recovery rules.

</blockquote>

## 5. Error Recovery Implementation Guide

References `websocket.md` section 1.11.

### 5.1 Error Classification Rules

Required classification patterns based on protocol close codes:

1. RECOVERABLE

   - Codes: 1001, 1006
   - Action: Retry sequence
   - State: RECONNECTING if retries < MAX_RETRIES

2. FATAL

   - Codes: 1002, 1003, 1008
   - Action: Terminate
   - State: DISCONNECTED

3. TRANSIENT
   - Other codes
   - Action: Retry if under MAX_RETRIES
   - State: Based on retry count

### 5.2 Error State Invariants

From `websocket.md` section 1.11.1:

1. State Requirements

   - lastError != null only in RECONNECTING/DISCONNECTED
   - RECONNECTING requires non-null lastError
   - Transition to DISCONNECTED after max retries

2. Error Context
   - Track retry counts by error type
   - Maintain error history in session
   - Log timestamps for debugging
