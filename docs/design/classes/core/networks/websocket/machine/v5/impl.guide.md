# WebSocket Client Implementation Guide

## 1. Core Types

### State Machine
- States: `disconnected`, `connecting`, `connected`, `reconnecting`
- Events: `CONNECT`, `CONNECTED`, `DISCONNECT`, `ERROR`, `RECONNECT`, `SEND`, `RECEIVE`
- Context: Must track retries, error, socket, queue, configuration
- Machine Type: XState v5 machine with typestates

### Messages
- Types: Text, Binary
- Structure: Must include timestamps (send, transmit, receive, deliver)
- Queue: FIFO, max 1000 messages
- Rate Limit: 100 messages per second window

## 2. Component Structure

### WebSocket Client
- Must use BaseServiceClient from @qi/core/services/base
- Must implement message queueing
- Must handle rate limiting
- Must track state via XState

### Connection Manager
- Must use ws package for connections
- Must implement health monitoring (30s ping, 5s timeout)
- Must handle connection timeouts (30s max)
- Must implement retry logic (max 5 retries, 1.5x backoff)

### Rate Limiter
- Must use fixed window
- Must track message counts
- Must handle window transitions
- Must reject over-limit messages

## 3. Error Handling

### Categories
- Use WebSocket error codes from @qi/core/errors
- Connection errors: Use WEBSOCKET_ERROR family
- Rate limit errors: Use RATE_LIMIT_ERROR
- Queue errors: Use QUEUE_ERROR family

### Requirements
- Must provide error context
- Must log via @qi/core/logger
- Must trigger state transitions
- Must clean up resources

## 4. Resource Management

### Cleanup Required
- Socket connections
- Timers (ping/pong, retry, connect)
- Message queue
- Rate limit windows

### Timing Requirements
- Connect timeout: 30s
- Initial retry delay: 1s
- Max retry delay: 60s
- Ping interval: 30s
- Pong timeout: 5s

## 5. Integration Points

### Required Modules 
- @qi/core/services/base: Use BaseServiceClient
- @qi/core/errors: Use ApplicationError, ErrorCodes
- @qi/core/logger: Use for structured logging
- @qi/core/config: Use for configuration management

### External Libraries
- xstate v5: Use for state management
- ws: Use for WebSocket connections

## 6. Key Behaviors

### Connection Lifecycle
1. Start in disconnected state
2. Move to connecting on connect command
3. Handle success/failure transitions
4. Implement retry logic for failures
5. Allow manual disconnection

### Message Flow
1. Validate message
2. Check rate limit
3. Add to queue
4. Send in order
5. Track delivery

### Health Monitoring
1. Send ping every 30s
2. Expect pong within 5s
3. Disconnect on timeout
4. Trigger reconnection