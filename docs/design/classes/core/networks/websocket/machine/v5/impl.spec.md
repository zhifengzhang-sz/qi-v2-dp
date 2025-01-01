# WebSocket Client Specification for xstate v5 and ws

## 1. States and Transitions

A WebSocket client must maintain exactly four states:
1. Disconnected: No active connection or pending operations
2. Connecting: Connection attempt in progress
3. Connected: Active, open connection
4. Reconnecting: Error recovery in progress

Valid transitions between states are:
- Disconnected → Connecting (via connect command)
- Connecting → Connected (on successful open)
- Connecting → Reconnecting (on error)  
- Connected → Reconnecting (on error/close)
- Connected → Disconnected (via disconnect command)
- Reconnecting → Connecting (retry attempt)
- Reconnecting → Disconnected (max retries exceeded)

## 2. Timing Requirements 

The implementation must enforce these timing bounds:

Connection Timeouts:
- Initial connect: Maximum 30 seconds
- Reconnect: Same as initial connect
- Must abort and transition on timeout

Retry Backoff:
- Initial delay: 1 second
- Subsequent delays: Previous × 1.5 up to 60 seconds
- Maximum retries: 5

Health Monitoring:
- Ping interval: 30 seconds
- Pong timeout: 5 seconds
- Must disconnect on pong timeout

## 3. Rate Limiting

Must implement fixed window rate limiting:
- Window size: 1 second
- Maximum 100 messages per window
- Count resets each new window
- Must reject messages over limit

## 4. Message Guarantees

Ordering:
- Messages must be sent in order of submission
- Messages must be delivered in order received 
- No reordering of queued messages

Queueing:
- Maximum queue size: 1000 messages
- Must reject when queue full
- Must clear queue on disconnect

## 5. Error Handling

Must integrate with `@qi/core/errors`:
- Capture connection errors with `WEBSOCKET_ERROR` code
- Provide detailed error context
- Track retry counts
- Clear error state on successful connect

## 6. Resource Management

Must properly manage resources:
- Close socket on state exit
- Cancel all timers
- Clear message queues
- Reset rate limit windows

## 7. Logging

Must use `@qi/core/logger` for:
- State transitions 
- Connection events
- Errors with context
- Rate limit violations

## 8. Implementation Requirements

Must use:
- xstate v5 for state machine
- ws package for WebSocket
- TypeScript for type safety
- Provided error/logging modules

