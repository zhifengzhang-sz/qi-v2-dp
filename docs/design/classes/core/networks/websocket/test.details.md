## 8.1 Unit Test Scenarios

#### State Transitions

| Test Case | Initial State | Event | Expected State | Description |
|-----------|--------------|-------|----------------|-------------|
| Connect - Basic | disconnected | CONNECT | connecting | Basic connect with valid URL |
| Connect - With Protocols | disconnected | CONNECT | connecting | Connect with subprotocols |
| Connect - With Options | disconnected | CONNECT | connecting | Connect with custom options |
| Connect - Invalid URL | disconnected | CONNECT | disconnected | Invalid WebSocket URL |
| Connect - Already Connecting | connecting | CONNECT | connecting | Connect while already connecting |
| Connect - During Reconnect | reconnecting | CONNECT | connecting | New connect during reconnect |
| Connect - Rate Limited | rateLimited | CONNECT | rateLimited | Connect while rate limited |
| Connection - Success | connecting | OPEN | connected | Normal connection success |
| Connection - With Protocol | connecting | OPEN | connected | Connection with agreed protocol |
| Connection - Protocol Error | connecting | ERROR | reconnecting | Protocol negotiation failed |
| Connection - Timeout | connecting | TIMEOUT | reconnecting | Connection attempt timeout |
| Connection - DNS Error | connecting | ERROR | reconnecting | DNS resolution failed |
| Connection - Network Error | connecting | ERROR | reconnecting | Network interface error |
| Connected - Normal Message | connected | MESSAGE | connected | Regular message received |
| Connected - Invalid Message | connected | ERROR | connected | Invalid message format |
| Connected - Ping Success | connected | PONG | connected | Successful ping response |
| Connected - Ping Timeout | connected | PING_TIMEOUT | reconnecting | No pong received |
| Connected - Client Close | connected | DISCONNECT | disconnecting | Client initiates close |
| Connected - Server Close | connected | CLOSE | reconnecting | Server initiates close |
| Connected - Fatal Error | connected | ERROR | disconnected | Non-recoverable error |
| Connected - Backpressure | connected | BACKPRESSURE | rateLimited | Queue limit reached |
| Disconnecting - Clean | disconnecting | CLOSE | disconnected | Clean connection close |
| Disconnecting - Error | disconnecting | ERROR | disconnected | Error during close |
| Disconnecting - Timeout | disconnecting | TIMEOUT | disconnected | Close timeout reached |
| Reconnecting - First Try | reconnecting | RETRY | connecting | First reconnection attempt |
| Reconnecting - Backoff | reconnecting | RETRY | connecting | With exponential backoff |
| Reconnecting - Max Retries | reconnecting | MAX_RETRIES | disconnected | Maximum retries reached |
| Reconnecting - Cancel | reconnecting | DISCONNECT | disconnecting | Cancel reconnection |
| Rate Limited - Window End | rateLimited | RATE_OK | connected | Rate limit window expires |
| Rate Limited - Message | rateLimited | SEND | rateLimited | Message during rate limit |
| Any State - Terminate | any | TERMINATE | disconnected | Forced termination |

#### Guard Tests

| Guard | Context | Event | Should Allow | Description |
|-------|---------|-------|--------------|-------------|
| isValidUrl | any | CONNECT(ws://) | true | Valid WS protocol |
| isValidUrl | any | CONNECT(wss://) | true | Valid WSS protocol |
| isValidUrl | any | CONNECT(http://) | false | Invalid protocol |
| isValidUrl | any | CONNECT(ws://[invalid]) | false | Invalid URL format |
| canReconnect | retries: 0 | ERROR | true | First retry attempt |
| canReconnect | retries: max-1 | ERROR | true | Under retry limit |
| canReconnect | retries: max | ERROR | false | At retry limit |
| canReconnect | retries: 0, reconnect: false | ERROR | false | Reconnect disabled |
| isRateLimited | msgCount: 0 | SEND | false | Start of window |
| isRateLimited | msgCount: max-1 | SEND | false | Under message limit |
| isRateLimited | msgCount: max | SEND | true | At message limit |
| isRateLimited | msgCount: 0, window: expired | SEND | false | New window |
| hasQueueSpace | queue: [] | SEND | true | Empty queue |
| hasQueueSpace | queue: [partial] | SEND | true | Queue has space |
| hasQueueSpace | queue: [full] | SEND | false | Queue full |
| hasQueueSpace | queue: [], priority: high | SEND | true | High priority bypass |
| isValidMessage | any | SEND(string) | true | Valid string message |
| isValidMessage | any | SEND(binary) | true | Valid binary message |
| isValidMessage | any | SEND(null) | false | Null message |
| isValidMessage | any | SEND(undefined) | false | Undefined message |
| isValidMessage | any | SEND(toolarge) | false | Message too large |
| canProcessQueue | connected, processing: false | PROCESS | true | Ready to process |
| canProcessQueue | disconnected | PROCESS | false | Not connected |
| canProcessQueue | connected, processing: true | PROCESS | false | Already processing |
| shouldReconnect | error: network | ERROR | true | Network error |
| shouldReconnect | error: protocol | ERROR | false | Protocol error |
| shouldReconnect | error: authentication | ERROR | false | Auth error |

#### Activity Tests

| Activity | Initial State | Trigger | Expected Behavior | Success Criteria | Cleanup |
|----------|--------------|---------|-------------------|------------------|---------|
| pingPong | connected | Timer | Send ping message | Receive pong | Clear timer |
| pingPong | connected | Late pong | Close connection | Transition to reconnecting | Clear timer |
| pingPong | connected | Multiple pings | Ignore duplicate | Single ping pending | None |
| queueProcessor | connected | Message queued | Send in order | Queue emptied | None |
| queueProcessor | connected | Priority message | Send priority first | Priority respected | None |
| queueProcessor | connected | Queue error | Retry message | Message rescheduled | Clear error |
| queueProcessor | rateLimited | Message queued | Wait for window | Process after delay | None |
| reconnectBackoff | reconnecting | First retry | Immediate retry | Minimum delay | Clear timers |
| reconnectBackoff | reconnecting | Multiple retries | Increase delay | Exponential delay | Clear timers |
| reconnectBackoff | reconnecting | Max delay | Cap delay | Maximum delay | Clear timers |
| rateLimit | connected | Window start | Reset counters | Zero message count | None |
| rateLimit | connected | Window update | Update counts | Accurate counts | None |
| rateLimit | connected | Window rollover | Reset window | New window started | Clear old window |
| metricCollector | any | State change | Update metrics | Metrics recorded | Save metrics |
| metricCollector | any | Message send | Update counters | Counters updated | None |
| metricCollector | any | Error occurs | Record error | Error logged | None |
