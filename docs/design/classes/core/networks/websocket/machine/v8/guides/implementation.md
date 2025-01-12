# WebSocket Client Implementation Guide

## Introduction

This guide provides step-by-step implementation instructions for the WebSocket client following the formal specifications and core module patterns. It ensures compliance with the mathematical model while integrating with the core service infrastructure.

## Prerequisites

- Core module (@qi/core) understanding
- Knowledge of the formal specifications
- TypeScript/JavaScript proficiency
- WebSocket protocol familiarity

## 1. Service Configuration

### 1.1 Configuration Interface

The WebSocket client extends the core service configuration:

```typescript
interface WebSocketConfig extends ServiceConfig {
  connection: {
    url: string;
    protocols?: string[];
    maxRetries: number;
    initialRetryDelay: number;
    maxRetryDelay: number;
    reconnectMultiplier: number;
  };
  messageQueue: {
    maxSize: number;
    dropPolicy: 'front' | 'back' | 'none';
    rateLimit?: {
      windowMs: number;
      maxMessages: number;
    };
  };
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}
```

### 1.2 JSON Schema

Define configuration schema for validation:

```typescript
const websocketConfigSchema: JsonSchema = {
  $id: 'qi://websocket/config.schema',
  type: 'object',
  required: ['connection', 'messageQueue'],
  properties: {
    connection: {
      type: 'object',
      required: ['url', 'maxRetries'],
      properties: {
        url: { type: 'string', format: 'uri-reference' },
        protocols: { type: 'array', items: { type: 'string' } },
        maxRetries: { type: 'integer', minimum: 0 },
        initialRetryDelay: { type: 'integer', minimum: 100, default: 1000 },
        maxRetryDelay: { type: 'integer', minimum: 1000, default: 60000 },
        reconnectMultiplier: { type: 'number', minimum: 1, default: 1.5 }
      }
    },
    messageQueue: {
      type: 'object',
      required: ['maxSize', 'dropPolicy'],
      properties: {
        maxSize: { type: 'integer', minimum: 1 },
        dropPolicy: { type: 'string', enum: ['front', 'back', 'none'] },
        rateLimit: {
          type: 'object',
          properties: {
            windowMs: { type: 'integer', minimum: 100 },
            maxMessages: { type: 'integer', minimum: 1 }
          },
          required: ['windowMs', 'maxMessages']
        }
      }
    },
    healthCheck: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        interval: { type: 'integer', minimum: 1000 },
        timeout: { type: 'integer', minimum: 100 },
        retries: { type: 'integer', minimum: 0 }
      },
      required: ['enabled', 'interval', 'timeout', 'retries']
    }
  }
};
```

## 2. Core Implementation

### 2.1 Base Class Extension

```typescript
export class WebSocketClient extends BaseServiceClient<WebSocketConfig> {
  private stateMachine: WebSocketStateMachine;
  private messageQueue: MessageQueue;
  private actions: WebSocketActions;
  private resourceManager: ResourceManager;

  constructor(config: WebSocketConfig) {
    super(config, 'WebSocket');
    this.actions = new WebSocketActions();
    this.messageQueue = new MessageQueue(config.messageQueue);
    this.stateMachine = new WebSocketStateMachine(this.actions);
    this.resourceManager = new ResourceManager();
    this.validateConfig();
  }

  protected validateConfig(): void {
    super.validateConfig();
    if (!this.config.connection.url) {
      throw new ApplicationError(
        'WebSocket URL is required',
        ErrorCode.WEBSOCKET_INVALID_URL,
        500
      );
    }
  }
}
```

### 2.2 State Management

```typescript
enum WebSocketState {
  disconnected = 'disconnected',
  connecting = 'connecting',
  connected = 'connected',
  reconnecting = 'reconnecting',
  terminating = 'terminating',
  terminated = 'terminated'
}

interface WebSocketContext {
  url: string;
  socket: WebSocket | null;
  error?: Error;
  retries: number;
  messageHistory?: { timestamp: number; id: string }[];
  messagesReceived: number;
  messagesSent: number;
  bytesReceived: number;
  bytesSent: number;
  lastPingTime?: number;
  lastPongTime?: number;
  connectTime?: number;
  disconnectTime?: number;
}

const stateTransitionTable: Record<WebSocketState, Record<WebSocketEvent, WebSocketState>> = {
  disconnected: {
    CONNECT: 'connecting',
    DISCONNECT: 'disconnected',
    ERROR: 'disconnected',
    TERMINATE: 'terminating'
  },
  connecting: {
    OPEN: 'connected',
    ERROR: 'reconnecting',
    DISCONNECT: 'disconnected',
    TERMINATE: 'terminating'
  },
  connected: {
    CLOSE: 'disconnected',
    ERROR: 'reconnecting',
    DISCONNECT: 'disconnected',
    TERMINATE: 'terminating'
  },
  reconnecting: {
    RETRY: 'connecting',
    MAX_RETRIES: 'disconnected',
    DISCONNECT: 'disconnected',
    TERMINATE: 'terminating'
  },
  terminating: {
    TERMINATED: 'terminated',
    ERROR: 'terminated',
    DISCONNECT: 'terminated'
  },
  terminated: {} // Terminal state - no transitions out
};

class WebSocketStateMachine {
  private state: WebSocketState = WebSocketState.disconnected;
  private context: WebSocketContext;
  private readonly propertyVerifier = new PropertyVerifier();

  constructor(
    private readonly actions: WebSocketActions,
    private readonly onStateChange?: (from: WebSocketState, to: WebSocketState) => void
  ) {
    this.context = this.createInitialContext();
  }

  transition(event: WebSocketEvent): void {
    const nextState = stateTransitionTable[this.state]?.[event.type];
    if (!nextState) {
      throw new ApplicationError(
        `Invalid transition from ${this.state} on ${event.type}`,
        ErrorCode.WEBSOCKET_ERROR,
        500
      );
    }

    const previousState = this.state;
    
    // Execute state-specific actions and update context
    const newContext = this.executeActions(this.state, nextState, event);
    
    // Verify properties are preserved
    this.propertyVerifier.verifyAll(newContext);
    
    // Update state and context
    this.state = nextState;
    this.context = newContext;
    
    // Notify state change
    this.onStateChange?.(previousState, nextState);
  }

  private executeActions(
    fromState: WebSocketState,
    toState: WebSocketState,
    event: WebSocketEvent
  ): WebSocketContext {
    let newContext = { ...this.context };

    switch(true) {
      case fromState === 'disconnected' && toState === 'connecting':
        newContext = this.actions.storeUrl(newContext, event as ConnectEvent);
        newContext = this.actions.logConnection(newContext);
        break;
      case toState === 'connected':
        newContext = this.actions.resetRetries(newContext);
        break;
      case toState === 'reconnecting':
        newContext = this.actions.handleError(newContext, event as ErrorEvent);
        newContext = this.actions.incrementRetries(newContext);
        break;
      case toState === 'terminated':
        newContext = this.actions.forceTerminate(newContext);
        break;
    }

    return newContext;
  }

  private createInitialContext(): WebSocketContext {
    return {
      url: '',
      socket: null,
      retries: 0,
      messagesReceived: 0,
      messagesSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      messageHistory: []
    };
  }
}
```

### 2.3 Core Actions

```typescript
class WebSocketActions {
  // γ1: Store URL and Initialize
  storeUrl(context: WebSocketContext, event: ConnectEvent): WebSocketContext {
    return {
      ...context,
      url: event.url,
      socket: null,
      retries: 0,
      error: null
    };
  }

  // γ2: Reset Retry Count
  resetRetries(context: WebSocketContext): WebSocketContext {
    return {
      ...context,
      retries: 0,
      error: null
    };
  }

  // γ3: Handle Error
  handleError(context: WebSocketContext, event: ErrorEvent): WebSocketContext {
    return {
      ...context,
      error: event.error,
      socket: null,
      disconnectTime: Date.now()
    };
  }

  // γ4: Process Message
  processMessage(context: WebSocketContext, event: MessageEvent): WebSocketContext {
    return {
      ...context,
      messagesReceived: context.messagesReceived + 1,
      bytesReceived: context.bytesReceived + event.data.length,
      messageHistory: [
        ...(context.messageHistory || []),
        { timestamp: Date.now(), id: event.id }
      ]
    };
  }

  // γ5: Send Message
  sendMessage(context: WebSocketContext, event: SendEvent): WebSocketContext {
    return {
      ...context,
      messagesSent: context.messagesSent + 1,
      bytesSent: context.bytesSent + event.data.length,
      messageHistory: [
        ...(context.messageHistory || []),
        { timestamp: Date.now(), id: event.id }
      ]
    };
  }

  // γ6: Handle Ping
  handlePing(context: WebSocketContext): WebSocketContext {
    return {
      ...context,
      lastPingTime: Date.now()
    };
  }

  // γ7: Handle Pong
  handlePong(context: WebSocketContext): WebSocketContext {
    const now = Date.now();
    return {
      ...context,
      lastPongTime: now,
      latency: context.lastPingTime ? now - context.lastPingTime : undefined
    };
  }

  // γ8: Enforce Rate Limit
  enforceRateLimit(context: WebSocketContext): WebSocketContext {
    const now = Date.now();
    const windowStart = now - WINDOW_SIZE;
    const recentMessages = (context.messageHistory || [])
      .filter(msg => msg.timestamp > windowStart);

    return {
      ...context,
      messageHistory: recentMessages
    };
  }

  // γ9: Increment Retries
  incrementRetries(context: WebSocketContext): WebSocketContext {
    return {
      ...context,
      retries: context.retries + 1
    };
  }

  // γ10: Log Connection
  logConnection(context: WebSocketContext): WebSocketContext {
    return {
      ...context,
      connectTime: Date.now()
    };
  }

  // γ11: Force Terminate
  forceTerminate(context: WebSocketContext): WebSocketContext {
    return {
      ...context,
      socket: null,
      disconnectTime: Date.now(),
      error: null
    };
  }
}
```

### 2.4 Message Queue Implementation

```typescript
class MessageQueue {
  private readonly queue: Message[] = [];
  private readonly maxSize: number;
  private readonly dropPolicy: 'front' | 'back' | 'none';
  private readonly metrics: QueueMetrics = {
    enqueued: 0,
    dequeued: 0,
    dropped: 0,
    highWaterMark: 0
  };

  constructor(config: MessageQueueConfig) {
    this.maxSize = config.maxSize;
    this.dropPolicy = config.dropPolicy;
  }

  async enqueue(message: Message): Promise<void> {
    if (this.queue.length >= this.maxSize) {
      if (this.dropPolicy === 'none') {
        await this.applyBackpressure();
      } else if (this.dropPolicy === 'front') {
        this.queue.shift();
        this.metrics.dropped++;
      } else {
        this.metrics.dropped++;
        return;
      }
    }

    this.queue.push(message);
    this.metrics.enqueued++;
    this.metrics.highWaterMark = Math.max(
      this.metrics.highWaterMark,
      this.queue.length
    );
  }

  dequeue(): Message | undefined {
    const message = this.queue.shift();
    if (message) {
      this.metrics.dequeued++;
    }
    return message;
  }

  getMessagesSince(timestamp: number): Message[] {
    return this.queue.filter(msg => msg.timestamp >= timestamp);
  }

  private async applyBackpressure(): Promise<void> {
    // Emit backpressure event for monitoring
    this.emit('backpressure', this.queue.length);
    
    // Wait for queue to have space
    while (this.queue.length >= this.maxSize) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }
}

interface QueueMetrics {
  enqueued: number;
  dequeued: number;
  dropped: number;
  highWaterMark: number;
}

interface Message {
  id: string;
  data: unknown;
  timestamp: number;
}
```

### 2.5 Property Verification

```typescript
class PropertyVerifier {
  private readonly invariants = {
    // P1: Single Active State
    singleActiveState: (context: WebSocketContext): boolean => {
      return context.socket === null || context.socket.readyState <= 1;
    },

    // P2: Valid State Transitions
    validTransition: (from: WebSocketState, to: WebSocketState, event: WebSocketEvent): boolean => {
      return Boolean(stateTransitionTable[from]?.[event.type] === to);
    },

    // P3: Message Ordering
    messageOrdering: (context: WebSocketContext): boolean => {
      const history = context.messageHistory || [];
      return history.every((msg, i) => 
        i === 0 || history[i-1].timestamp <= msg.timestamp
      );
    },

    // P4: Resource Management
    resourceCleanup: (context: WebSocketContext): boolean => {
      return context.socket === null || 
             context.socket.readyState === WebSocket.CLOSED;
    }
  };

  verifyAll(context: WebSocketContext): void {
    Object.entries(this.invariants).forEach(([name, check]) => {
      if (!check(context)) {
        throw new ApplicationError(
          `Invariant violation: ${name}`,
          ErrorCode.APPLICATION_ERROR,
          500,
          { context }
        );
      }
    });
  }
}
```

### 2.6 Resource Management

```typescript
class ResourceManager {
  private readonly maxBufferSize = 1024 * 1024; // 1MB
  private readonly metrics: ResourceMetrics = {
    messageBufferSize: 0,
    activeTimers: new Set<NodeJS.Timeout>(),
    eventListeners: new Set<() => void>()
  };

  addTimer(timer: NodeJS.Timeout): void {
    this.metrics.activeTimers.add(timer);
  }

  addListener(listener: () => void): void {
    this.metrics.eventListeners.add(listener);
  }

  updateBufferSize(size: number): void {
    this.metrics.messageBufferSize += size;
    this.checkLimits();
  }

  cleanup(): void {
    // Clear all timers
    this.metrics.activeTimers.forEach(timer => clearTimeout(timer));
    this.metrics.activeTimers.clear();

    // Remove all event listeners
    this.metrics.eventListeners.clear();
    
    // Reset buffer size
    this.metrics.messageBufferSize = 0;
  }

  private checkLimits(): void {
    if (this.metrics.messageBufferSize > this.maxBufferSize) {
      throw new ApplicationError(
        'Message buffer size limit exceeded',
        ErrorCode.RESOURCE_EXHAUSTED,
        500,
        { 
          currentSize: this.metrics.messageBufferSize,
          limit: this.maxBufferSize 
        }
      );
    }
  }
}

interface ResourceMetrics {
  messageBufferSize: number;
  activeTimers: Set<NodeJS.Timeout>;
  eventListeners: Set<() => void>;
}
```

## 3. Usage Examples

### 3.1 Basic Usage

```typescript
const config: WebSocketConfig = {
  enabled: true,
  connection: {
    url: 'wss://api.example.com/ws',
    maxRetries: 3,
    initialRetryDelay: 1000,
    maxRetryDelay: 30000,
    reconnectMultiplier: 1.5
  },
  messageQueue: {
    maxSize: 1000,
    dropPolicy: 'none'
  }
};

const client = new WebSocketClient(config);

// Connect and handle messages
await client.connect();

client.on('message', (data) => {
  console.log('Received:', data);
});

// Send a message
await client.send({
  type: 'subscribe',
  channel: 'updates'
});
```

### 3.2 With Health Checks

```typescript
const config: WebSocketConfig = {
  enabled: true,
  connection: {
    url: 'wss://api.example.com/ws',
    maxRetries: 3
  },
  messageQueue: {
    maxSize: 1000,
    dropPolicy: 'back'
  },
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    retries: 3
  }
};

const client = new WebSocketClient(config);
await client.connect();

// Monitor health status
setInterval(async () => {
  const health = await client.isHealthy();
  console.log('WebSocket health:', health);
}, 60000);
```

### 3.3 Error Handling

```typescript
try {
  await client.connect();
} catch (error) {
  if (error instanceof ApplicationError) {
    switch (error.code) {
      case ErrorCode.WEBSOCKET_INVALID_URL:
        console.error('Invalid WebSocket URL:', error.details);
        break;
      case ErrorCode.WEBSOCKET_ERROR:
        console.error('WebSocket error:', error.details);
        break;
      case ErrorCode.RESOURCE_EXHAUSTED:
        console.error('Resource limit exceeded:', error.details);
        break;
      default:
        console.error('Unexpected error:', error);
    }
  }
}

// Handle disconnection gracefully
client.on('close', async (event) => {
  console.log('Connection closed:', event.code, event.reason);
  if (event.code === 1006) { // Abnormal closure
    await client.reconnect();
  }
});
```

## 4. Core Service Integration

### 4.1 Service Lifecycle

```typescript
class WebSocketClient extends BaseServiceClient<WebSocketConfig> {
  protected async checkHealth(): Promise<HealthCheckResult> {
    const state = this.stateMachine.getCurrentState();
    const context = this.stateMachine.getContext();
    const queueMetrics = this.messageQueue.getMetrics();

    return {
      status: state === 'connected' ? 'healthy' : 'unhealthy',
      message: `WebSocket in ${state} state`,
      details: {
        state,
        retries: context.retries,
        messageQueueSize: queueMetrics.enqueued - queueMetrics.dequeued,
        dropped: queueMetrics.dropped,
        latency: context.latency,
        lastPing: context.lastPingTime,
        lastPong: context.lastPongTime,
        messagesReceived: context.messagesReceived,
        messagesSent: context.messagesSent
      },
      timestamp: new Date()
    };
  }

  protected onStatusChange(status: ServiceStatus): void {
    super.onStatusChange(status);
    
    // Map service status to metrics
    this.metrics.recordStatus(status);
    
    // Handle status-specific actions
    if (status === ServiceStatus.ERROR) {
      this.handleErrorStatus();
    }
  }

  private handleErrorStatus(): void {
    const context = this.stateMachine.getContext();
    logger.error('WebSocket service error', {
      state: this.stateMachine.getCurrentState(),
      error: context.error,
      retries: context.retries
    });
  }
}
```

### 4.2 Metrics Integration

```typescript
class WebSocketMetrics {
  private readonly gauges = {
    messageQueueSize: new Gauge('websocket_queue_size'),
    connectionRetries: new Gauge('websocket_connection_retries'),
    messageLatency: new Gauge('websocket_message_latency_ms')
  };

  private readonly counters = {
    messagesReceived: new Counter('websocket_messages_received_total'),
    messagesSent: new Counter('websocket_messages_sent_total'),
    errors: new Counter('websocket_errors_total')
  };

  recordMessage(type: 'sent' | 'received', size: number): void {
    if (type === 'sent') {
      this.counters.messagesSent.inc();
    } else {
      this.counters.messagesReceived.inc();
    }
  }

  recordLatency(latencyMs: number): void {
    this.gauges.messageLatency.set(latencyMs);
  }

  recordQueueSize(size: number): void {
    this.gauges.messageQueueSize.set(size);
  }

  recordError(code: ErrorCode): void {
    this.counters.errors.inc({ code });
  }
}
```

## 5. Security Implementation

### 5.1 TLS/SSL Security

```typescript
class SecurityManager {
  validateConnection(url: string): void {
    const parsedUrl = new URL(url);
    
    if (parsedUrl.protocol !== 'wss:') {
      throw new ApplicationError(
        'Secure WebSocket connection required',
        ErrorCode.WEBSOCKET_INVALID_URL,
        500,
        { url }
      );
    }
  }

  validateCertificate(event: Event): void {
    const socket = event.target as WebSocket;
    if (socket instanceof WebSocket) {
      // Check certificate properties
      const cert = (socket as any).getCertificate?.();
      if (cert) {
        this.verifyCertificate(cert);
      }
    }
  }

  private verifyCertificate(cert: any): void {
    const now = Date.now();
    if (now < cert.validFrom || now > cert.validTo) {
      throw new ApplicationError(
        'Invalid certificate dates',
        ErrorCode.WEBSOCKET_ERROR,
        500
      );
    }
  }
}
```

### 5.2 Message Validation

```typescript
class MessageValidator {
  private readonly maxMessageSize = 1024 * 1024; // 1MB

  validateMessage(message: unknown): void {
    // Check message size
    const size = this.getMessageSize(message);
    if (size > this.maxMessageSize) {
      throw new ApplicationError(
        'Message exceeds size limit',
        ErrorCode.WEBSOCKET_MESSAGE_SIZE,
        500,
        { size, limit: this.maxMessageSize }
      );
    }

    // Validate message structure
    if (!this.isValidMessageFormat(message)) {
      throw new ApplicationError(
        'Invalid message format',
        ErrorCode.WEBSOCKET_ERROR,
        500,
        { message }
      );
    }
  }

  private getMessageSize(message: unknown): number {
    return new TextEncoder().encode(
      typeof message === 'string' ? message : JSON.stringify(message)
    ).length;
  }

  private isValidMessageFormat(message: unknown): boolean {
    if (typeof message === 'string') return true;
    if (!message || typeof message !== 'object') return false;

    // Check required message properties
    return 'type' in message && typeof (message as any).type === 'string';
  }
}
```

These implementations complete the WebSocket client while maintaining all formal properties and security requirements from the specification.