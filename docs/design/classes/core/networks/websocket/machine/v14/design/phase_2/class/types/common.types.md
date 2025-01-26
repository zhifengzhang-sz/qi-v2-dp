# common.types.md

## Overview

Core type definitions for WebSocket Client system, defining fundamental types referenced across all components.

## 1. System Constants

```mermaid
classDiagram
    class SystemConstants {
        <<constant>>
        +MAX_RETRIES: number = 5
        +MAX_MESSAGES: number = 100
        +WINDOW_SIZE: TimeMs = 1000
        +MAX_WINDOW_LIFETIME: TimeMs = 60000
        +MAX_QUEUE_SIZE: number = 1000
    }

    class TimingConstants {
        <<constant>>
        +CONNECT_TIMEOUT: TimeMs = 30000
        +INITIAL_RETRY_DELAY: TimeMs = 1000
        +MAX_RETRY_DELAY: TimeMs = 60000
        +RETRY_MULTIPLIER: number = 1.5
        +STABILITY_TIMEOUT: TimeMs = 5000
        +DISCONNECT_TIMEOUT: TimeMs = 3000
    }
```

_Reference: `machine.md` §1.1 System Constants_

## 2. Basic Types

```mermaid
classDiagram
    class TimeMs {
        <<type>>
        number in milliseconds
    }

    class Bytes {
        <<type>>
        number representing byte count
    }

    class BinaryData {
        <<type>>
        ArrayBuffer | Buffer | Uint8Array
    }
```

## 3. Core Interfaces

```mermaid
classDiagram
    class IConnectionContext {
        <<interface>>
        +url: string
        +protocols?: string[]
        +socket: WebSocket|null
        +status: ConnectionStatus
        +readyState: number
        +reconnectCount: number
        +lastError?: Error
        +closeCode?: number
        +lastStableConnection?: TimeMs
    }

    class IMetrics {
        <<interface>>
        +messagesSent: number
        +messagesReceived: number
        +bytesSent: Bytes
        +bytesReceived: Bytes
        +reconnectAttempts: number
        +reset(): void
        +snapshot(): Record~string,number~
    }

    class IHealthCheck {
        <<interface>>
        +status: HealthStatus
        +timestamp: TimeMs
        +details?: Record~string,unknown~
    }

    IConnectionContext -- IMetrics
    IConnectionContext -- IHealthCheck
```

_Reference: Context structure from `machine.md` §2.3_

## 4. Dependencies

- Does not depend on other type definitions
- Used by:
  - `events.types.md` for event payloads
  - `states.types.md` for state context
  - `errors.types.md` for error context

## 5. Type Requirements

1. All time values must use `TimeMs` type
2. All size values must use `Bytes` type
3. Binary data must use `BinaryData` type
4. Constants must be immutable (`readonly`)
