## 1. Data Specifications

### 1.1 Event Specifications

#### Base Event Types
| Type | Description |
|------|-------------|
| `timestamp` | Number representing Unix timestamp in milliseconds |
| `messageId` | String UUID v4 |
| `code` | Number representing WebSocket close codes (1000-4999) |
| `reason` | String explanation for errors or closures |

#### Event Definitions
| Event | Payload | Description |
|-------|---------|-------------|
| `CONNECT` | `{ url: string; protocols?: string[]; options?: ConnectionOptions }` | Initiates a connection |
| `DISCONNECT` | `{ code?: number; reason?: string }` | Initiates graceful disconnection |
| `OPEN` | `{ event: Event; timestamp: number }` | Connection established |
| `CLOSE` | `{ code: number; reason: string; wasClean: boolean }` | Connection closed |
| `ERROR` | `{ error: Error; timestamp: number; attempt?: number }` | Connection error |
| `MESSAGE` | `{ data: any; timestamp: number; id?: string }` | Message received |
| `SEND` | `{ data: any; id?: string; options?: SendOptions }` | Send message |
| `PING` | `{ timestamp: number }` | Connection health check |
| `PONG` | `{ latency: number; timestamp: number }` | Health check response |
| `RETRY` | `{ attempt: number; delay: number }` | Reconnection attempt |
| `MAX_RETRIES` | `{ attempts: number; lastError?: Error }` | Max retries reached |
| `TERMINATE` | `{ code?: number; reason?: string; immediate?: boolean }` | Force termination |

#### Option Types
```typescript
interface ConnectionOptions {
  // Reconnection settings
  reconnect: boolean;                // Enable/disable auto-reconnect
  maxReconnectAttempts: number;      // Maximum number of retry attempts
  reconnectInterval: number;         // Base delay between retries in ms
  reconnectBackoffRate: number;      // Exponential backoff multiplier
  
  // Health check settings
  pingInterval: number;              // Interval between pings in ms
  pongTimeout: number;              // Time to wait for pong response
  
  // Message handling
  messageQueueSize: number;         // Maximum queued messages
  messageTimeout: number;           // Default message timeout
  
  // Rate limiting
  rateLimit: {
    messages: number;               // Messages per window
    window: number;                 // Time window in ms
  };
}

interface SendOptions {
  retry: boolean;                   // Retry failed sends
  timeout: number;                  // Message timeout in ms
  priority: 'high' | 'normal';      // Message priority
  queueIfOffline: boolean;         // Queue if disconnected
}
```

#### Event Type

```typescript
// Full event type definitions
type WebSocketEvents = {
  CONNECT: {
    url: string;
    protocols?: string[];
    options?: ConnectionOptions;
  };
  DISCONNECT: {
    code?: number;
    reason?: string;
  };
  OPEN: {
    event: Event;
    timestamp: number;
  };
  CLOSE: {
    code: number;
    reason: string;
    wasClean: boolean;
  };
  ERROR: {
    error: Error;
    timestamp: number;
    attempt?: number;
  };
  MESSAGE: {
    data: any;
    timestamp: number;
    id?: string;
  };
  SEND: {
    data: any;
    id?: string;
    options?: SendOptions;
  };
  PING: {
    timestamp: number;
  };
  PONG: {
    latency: number;
    timestamp: number;
  };
  RETRY: {
    attempt: number;
    delay: number;
  };
  MAX_RETRIES: {
    attempts: number;
    lastError?: Error;
  };
  TERMINATE: {
    code?: number;
    reason?: string;
    immediate?: boolean;
  };
};
```

### 1.2 Context Specifications

#### Context State Properties
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `url` | `string` | WebSocket server URL | Required |
| `protocols` | `string[]` | Subprotocols to use | `[]` |
| `socket` | `WebSocket \| null` | Active socket instance | `null` |

#### Connection State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `status` | `ConnectionStatus` | Current connection status | `'disconnected'` |
| `readyState` | `number` | WebSocket ready state | `0` |
| `connectTime` | `number` | Last successful connect time | `0` |
| `disconnectTime` | `number` | Last disconnect time | `0` |
| `isCleanDisconnect` | `boolean` | Was last disconnect clean | `true` |

#### Reconnection State  
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `reconnectAttempts` | `number` | Current retry attempt count | `0` |
| `maxReconnectAttempts` | `number` | Maximum retry attempts | `5` |
| `reconnectInterval` | `number` | Base delay between retries | `1000` |
| `lastReconnectTime` | `number` | Last retry attempt time | `0` |
| `nextReconnectDelay` | `number` | Next retry delay in ms | `0` |

#### Message Queue State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `messageQueue` | `QueuedMessage[]` | Pending messages | `[]` |
| `messageQueueSize` | `number` | Max queue size | `100` |
| `processingMessage` | `boolean` | Queue processing flag | `false` |
| `lastMessageId` | `string` | Last processed message | `''` |

#### Health Check State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `pingInterval` | `number` | Ms between pings | `30000` |
| `pongTimeout` | `number` | Ms to wait for pong | `5000` |
| `lastPingTime` | `number` | Last ping sent time | `0` |
| `lastPongTime` | `number` | Last pong received time | `0` |
| `latency` | `number[]` | Recent latency samples | `[]` |

#### Metrics State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `messagesSent` | `number` | Total messages sent | `0` |
| `messagesReceived` | `number` | Total messages received | `0` |
| `bytesReceived` | `number` | Total bytes received | `0` |
| `bytesSent` | `number` | Total bytes sent | `0` |
| `errors` | `ErrorRecord[]` | Error history | `[]` |

#### Rate Limiting State
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `messageCount` | `number` | Messages in window | `0` |
| `windowStart` | `number` | Current window start | `0` |
| `rateLimit` | `RateLimit` | Rate limit config | Required |

```typescript
// Supporting Types
type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'disconnecting'
  | 'reconnecting'
  | 'backingOff'
  | 'rateLimited'
  | 'suspended';

interface QueuedMessage {
  id: string;
  data: any;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: 'high' | 'normal';
}

interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

interface RateLimit {
  messages: number;
  window: number;
}

// Full Context Type
interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionStatus;
  readyState: number;
  
  // Timing
  connectTime: number;
  disconnectTime: number;
  isCleanDisconnect: boolean;
  
  // Reconnection
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  lastReconnectTime: number;
  nextReconnectDelay: number;
  
  // Message Queue
  messageQueue: QueuedMessage[];
  messageQueueSize: number;
  processingMessage: boolean;
  lastMessageId: string;
  
  // Health Check
  pingInterval: number;
  pongTimeout: number;
  lastPingTime: number;
  lastPongTime: number;
  latency: number[];
  
  // Metrics
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  errors: ErrorRecord[];
  
  // Rate Limiting
  messageCount: number;
  windowStart: number;
  rateLimit: RateLimit;
}
```

### 1.3 Configuration

The client should accept configuration for all tunable parameters with sensible defaults:

```typescript
interface WebSocketConfig {
  // Connection
  url: string;                      // Required
  protocols?: string[];             // Default: []
  
  // Reconnection
  reconnect?: boolean;              // Default: true
  maxReconnectAttempts?: number;    // Default: 5
  reconnectInterval?: number;       // Default: 1000
  reconnectBackoffRate?: number;    // Default: 1.5
  
  // Health Check
  pingInterval?: number;            // Default: 30000
  pongTimeout?: number;            // Default: 5000
  
  // Message Handling
  messageQueueSize?: number;        // Default: 100
  messageTimeout?: number;          // Default: 5000
  
  // Rate Limiting
  rateLimit?: {
    messages: number;               // Default: 100
    window: number;                 // Default: 1000
  };
}
```
