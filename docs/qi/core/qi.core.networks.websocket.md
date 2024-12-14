# Project Source Code Documentation

## websocket

### client.ts

```typescript
/**
 * @fileoverview WebSocket Client Implementation
 * @module @qi/core/networks/websocket/client
 *
 * @created 2024-12-11
 */

import WebSocket from "ws";
import { EventEmitter } from "events";
import { logger } from "@qi/core/logger";
import { ConnectionState, ConnectionStateManager } from "./state.js";
import { HeartbeatManager } from "./heartbeat.js";
import { SubscriptionManager } from "./subscription.js";
import { createWebSocketError, transformWebSocketError } from "./errors.js";
import { defaultConfig, WebSocketConfig, MessageHandler } from "./types.js";

interface Events {
  connecting: () => void;
  connected: () => void;
  disconnecting: () => void;
  disconnected: () => void;
  reconnecting: (attempt: number, maxAttempts: number) => void;
  message: (data: unknown) => void;
  error: (error: Error) => void;
  stateChange: (state: ConnectionState) => void;
}

export class WebSocketClient extends EventEmitter {
  public emit<K extends keyof Events>(
    event: K,
    ...args: Parameters<Events[K]>
  ): boolean {
    return super.emit(event, ...args);
  }

  public on<K extends keyof Events>(event: K, listener: Events[K]): this {
    return super.on(event, listener);
  }

  public once<K extends keyof Events>(event: K, listener: Events[K]): this {
    return super.once(event, listener);
  }

  private ws: WebSocket | null = null;
  private readonly config: Required<WebSocketConfig>;
  private readonly stateManager: ConnectionStateManager;
  private readonly subscriptionManager: SubscriptionManager;
  private heartbeatManager?: HeartbeatManager;
  private reconnectAttempts = 0;

  constructor(config: WebSocketConfig = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
    this.stateManager = new ConnectionStateManager();
    this.subscriptionManager = new SubscriptionManager();

    this.stateManager.on("stateChange", (state) => {
      this.emit("stateChange", state);
      if (state === "connected") {
        this.setupHeartbeat();
        this.reconnectAttempts = 0;
      } else if (state === "disconnected") {
        this.handleDisconnect();
      }
    });
  }

  public getConfig(): Readonly<Required<WebSocketConfig>> {
    return { ...this.config };
  }

  private setupHeartbeat(): void {
    if (!this.ws) return;

    this.heartbeatManager = new HeartbeatManager(this.ws, this.config, () =>
      this.handlePongTimeout()
    );
    this.heartbeatManager.start();
  }

  private handlePongTimeout(): void {
    logger.warn("WebSocket pong timeout");
    this.ws?.terminate();
  }

  private async handleDisconnect(): Promise<void> {
    this.cleanup();
    this.emit("disconnected");

    if (
      this.config.reconnect &&
      this.reconnectAttempts < this.config.maxReconnectAttempts &&
      this.stateManager.getUrl()
    ) {
      this.reconnectAttempts++;
      this.emit(
        "reconnecting",
        this.reconnectAttempts,
        this.config.maxReconnectAttempts
      );

      await new Promise((resolve) =>
        setTimeout(resolve, this.config.reconnectInterval)
      );

      logger.info("Attempting WebSocket reconnection", {
        attempt: this.reconnectAttempts,
        maxAttempts: this.config.maxReconnectAttempts,
      });

      try {
        await this.connect(this.stateManager.getUrl()!);
      } catch (error) {
        logger.error("WebSocket reconnection failed", { error });
      }
    }
  }

  private cleanup(): void {
    this.heartbeatManager?.stop();
    this.ws?.removeAllListeners();
    this.ws = null;
  }

  async connect(url: string): Promise<void> {
    if (!this.stateManager.transition("connecting")) {
      throw createWebSocketError("Invalid connection state", {
        currentState: this.stateManager.getState(),
        url,
      });
    }

    this.emit("connecting");
    this.stateManager.setUrl(url);

    try {
      await this.establishConnection(url);
      this.stateManager.transition("connected");
      this.emit("connected");
      logger.info("WebSocket connected", { url });
    } catch (error) {
      this.stateManager.transition("disconnected");
      throw transformWebSocketError(error, { url });
    }
  }

  private async establishConnection(url: string): Promise<void> {
    return Promise.race([
      this.createConnection(url),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Connection timeout")),
          this.config.connectionTimeout
        )
      ),
    ]);
  }

  private async createConnection(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        const errorHandler = (error: Error) => {
          this.ws?.removeListener("error", errorHandler);
          reject(error);
        };

        this.ws.once("error", errorHandler);
        this.ws.once("open", () => {
          this.ws?.removeListener("error", errorHandler);
          this.setupEventHandlers();
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(data.toString());
        this.subscriptionManager.handleMessage(parsed);
        this.emit("message", parsed);
      } catch (error) {
        logger.error("WebSocket message parse error", { error, data });
      }
    });

    this.ws.on("error", (error) => {
      logger.error("WebSocket error", { error });
      this.emit("error", error);
    });

    this.ws.on("pong", () => {
      this.heartbeatManager?.handlePong();
    });
  }

  async send(data: unknown): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw createWebSocketError("WebSocket not connected", {
        readyState: this.ws?.readyState,
        expected: WebSocket.OPEN,
      });
    }

    return new Promise((resolve, reject) => {
      this.ws!.send(JSON.stringify(data), (error) => {
        if (error) {
          reject(
            transformWebSocketError(error, {
              data: typeof data === "object" ? { ...data } : data,
            })
          );
        } else {
          resolve();
        }
      });
    });
  }

  subscribe(channel: string, handler: MessageHandler): void {
    this.subscriptionManager.subscribe(channel, handler);

    if (this.isConnected()) {
      this.send({ type: "subscribe", channel }).catch((error) => {
        logger.error("Subscription request failed", { error, channel });
      });
    }
  }

  unsubscribe(channel: string, handler?: MessageHandler): void {
    this.subscriptionManager.unsubscribe(channel, handler);

    if (this.isConnected()) {
      this.send({ type: "unsubscribe", channel }).catch((error) => {
        logger.error("Unsubscription request failed", { error, channel });
      });
    }
  }

  async close(): Promise<void> {
    if (!this.ws) return;

    this.stateManager.transition("disconnecting");
    this.emit("disconnecting");
    this.config.reconnect = false;
    this.ws.close();
    this.cleanup();
    this.subscriptionManager.clear();
    this.stateManager.transition("disconnected");
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getState(): ConnectionState {
    return this.stateManager.getState();
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

```

### errors.ts

```typescript
/**
 * @fileoverview
 * @module errors.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/errors.ts
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import {
  HttpStatusCode,
  NetworkErrorContext,
  mapWebSocketErrorToStatus,
} from "../errors.js";

/**
 * Creates a WebSocket specific error with additional context
 */
export function createWebSocketError(
  message: string,
  context?: NetworkErrorContext
): ApplicationError {
  return new ApplicationError(
    message,
    ErrorCode.WEBSOCKET_ERROR,
    HttpStatusCode.SERVICE_UNAVAILABLE,
    context
  );
}

/**
 * Transforms WebSocket errors into application errors
 */
export function transformWebSocketError(
  error: unknown,
  context?: NetworkErrorContext
): ApplicationError {
  const status = mapWebSocketErrorToStatus(error);
  const errorCode =
    status === HttpStatusCode.GATEWAY_TIMEOUT
      ? ErrorCode.TIMEOUT_ERROR
      : ErrorCode.WEBSOCKET_ERROR;

  return new ApplicationError("WebSocket operation failed", errorCode, status, {
    ...context,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

```

### heartbeat.ts

```typescript
/**
 * @fileoverview
 * @module heartbeat.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/heartbeat.ts
import WebSocket from "ws";
import { WebSocketConfig } from "./types.js";

export class HeartbeatManager {
  private pingTimer?: NodeJS.Timeout;
  private pongTimer?: NodeJS.Timeout;

  constructor(
    private readonly ws: WebSocket,
    private readonly config: Required<WebSocketConfig>,
    private readonly onPongTimeout: () => void
  ) {}

  start(): void {
    this.stop();
    this.pingTimer = setInterval(() => this.ping(), this.config.pingInterval);
  }

  stop(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.pongTimer) clearTimeout(this.pongTimer);
    this.pingTimer = undefined;
    this.pongTimer = undefined;
  }

  handlePong(): void {
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = undefined;
    }
  }

  private ping(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
      this.pongTimer = setTimeout(this.onPongTimeout, this.config.pongTimeout);
    }
  }
}

```

### state.ts

```typescript
/**
 * @fileoverview
 * @module state.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

import EventEmitter from "events";

// websocket/state.ts
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

export class ConnectionStateManager extends EventEmitter {
  private state: ConnectionState = "disconnected";
  private url: string | null = null;

  private readonly validTransitions: Record<
    ConnectionState,
    ConnectionState[]
  > = {
    disconnected: ["connecting"],
    connecting: ["connected", "disconnected"],
    connected: ["disconnecting", "disconnected"],
    disconnecting: ["disconnected"],
  };

  getState(): ConnectionState {
    return this.state;
  }

  getUrl(): string | null {
    return this.url;
  }

  setUrl(url: string | null): void {
    this.url = url;
  }

  transition(newState: ConnectionState): boolean {
    if (!this.canTransitionTo(newState)) {
      return false;
    }
    this.state = newState;
    this.emit("stateChange", newState);
    return true;
  }

  private canTransitionTo(newState: ConnectionState): boolean {
    return this.validTransitions[this.state].includes(newState);
  }
}

```

### subscription.ts

```typescript
/**
 * @fileoverview
 * @module subscription.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

// websocket/subscription.ts
import { MessageHandler } from "./types.js";
import { logger } from "@qi/core/logger";

interface WebSocketMessage {
  channel: string;
  data: unknown;
}

export class SubscriptionManager {
  private subscriptions = new Map<string, Set<MessageHandler>>();

  subscribe(channel: string, handler: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);
  }

  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (!this.subscriptions.has(channel)) return;

    const handlers = this.subscriptions.get(channel)!;
    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }

  handleMessage(message: WebSocketMessage): void {
    if (message.channel && this.subscriptions.has(message.channel)) {
      const handlers = this.subscriptions.get(message.channel)!;
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          logger.error("Message handler error", {
            error,
            channel: message.channel,
          });
        }
      });
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }
}

```

### types.ts

```typescript
/**
 * @fileoverview WebSocket Types and Defaults
 * @module @qi/core/networks/websocket/types
 */

export interface WebSocketConfig {
  /** Interval in ms between ping messages */
  pingInterval?: number;
  /** Timeout in ms to wait for pong response */
  pongTimeout?: number;
  /** Whether to attempt reconnection on disconnect */
  reconnect?: boolean;
  /** Interval in ms between reconnection attempts */
  reconnectInterval?: number;
  /** Maximum number of reconnection attempts */
  maxReconnectAttempts?: number;
  /** Timeout in ms for initial connection attempt */
  connectionTimeout?: number;
}

export interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

export const defaultConfig: Required<WebSocketConfig> = {
  pingInterval: 30000,
  pongTimeout: 5000,
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  connectionTimeout: 30000,
};

```

### machine

#### actions.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Actions
 * Actions executed during state transitions
 */

import {
  WebSocketContext,
  WebSocketEvent,
  QueuedMessage,
  ErrorRecord,
  ConnectEvent,
  DisconnectEvent,
  MessageEvent,
  ErrorEvent,
} from "./types.js";
import { DEFAULT_CONFIG, WS_CLOSE_CODES, LIMITS, TIMING } from "./constants.js";

/**
 * Core state machine actions
 */
export const actions = {
  // Connection Management
  createSocket: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "CONNECT") return;
    const connectEvent = event as ConnectEvent;

    try {
      context.socket = new WebSocket(connectEvent.url, context.protocols);
      context.url = connectEvent.url;
      context.connectTime = Date.now();

      // Apply connection options
      if (connectEvent.options) {
        Object.assign(context, {
          ...DEFAULT_CONFIG,
          ...connectEvent.options,
        });
      }
    } catch (error) {
      actions.recordError(context, {
        type: "ERROR",
        error: error as Error,
        timestamp: Date.now(),
      });
    }
  },

  bindSocketEvents: (context: WebSocketContext) => {
    if (!context.socket) return;

    context.socket.onopen = () => {
      context.status = "connected";
      context.connectTime = Date.now();
      context.reconnectAttempts = 0;
      context.isCleanDisconnect = false;
    };

    context.socket.onclose = (event) => {
      context.disconnectTime = Date.now();
      context.isCleanDisconnect = event.wasClean;
      context.socket = null;
    };

    context.socket.onerror = (error) => {
      actions.recordError(context, {
        type: "ERROR",
        error: error instanceof Error ? error : new Error("WebSocket error"),
        timestamp: Date.now(),
      });
    };

    context.socket.onmessage = (event) => {
      actions.handleMessage(context, {
        type: "MESSAGE",
        data: event.data,
        timestamp: Date.now(),
      });
    };
  },

  closeSocket: (context: WebSocketContext, event: WebSocketEvent) => {
    if (!context.socket) return;

    const code =
      event.type === "DISCONNECT"
        ? (event as DisconnectEvent).code
        : WS_CLOSE_CODES.NORMAL_CLOSURE;
    const reason =
      event.type === "DISCONNECT"
        ? (event as DisconnectEvent).reason
        : "Normal closure";

    try {
      context.socket.close(code, reason);
      context.isCleanDisconnect = true;
    } catch (error) {
      actions.recordError(context, {
        type: "ERROR",
        error: error as Error,
        timestamp: Date.now(),
      });
    } finally {
      context.socket = null;
    }
  },

  // Message Handling
  handleMessage: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "MESSAGE") return;
    const messageEvent = event as MessageEvent;

    context.metrics.messagesReceived++;
    if (typeof messageEvent.data === "string") {
      context.metrics.bytesReceived += messageEvent.data.length;
    }

    // Process message based on type/protocol
    try {
      if (messageEvent.data === "pong") {
        actions.handlePong(context);
      }
      // Add other message type handling here
    } catch (error) {
      actions.recordError(context, {
        type: "ERROR",
        error: error as Error,
        timestamp: Date.now(),
      });
    }
  },

  enqueueMessage: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "SEND") return;

    const message: QueuedMessage = {
      id: event.id || crypto.randomUUID(),
      data: event.data,
      timestamp: Date.now(),
      attempts: 0,
      priority: event.options?.priority || "normal",
    };

    if (context.messageQueue.length < context.messageQueueSize) {
      context.messageQueue.push(message);
      actions.processQueue(context);
    }
  },

  processQueue: (context: WebSocketContext) => {
    if (context.processingMessage || !context.socket) return;

    context.processingMessage = true;

    try {
      while (
        context.messageQueue.length > 0 &&
        context.socket?.readyState === WebSocket.OPEN
      ) {
        const message = context.messageQueue[0];
        context.socket.send(JSON.stringify(message.data));
        context.metrics.messagesSent++;
        context.messageQueue.shift();
      }
    } finally {
      context.processingMessage = false;
    }
  },

  // Health Check Actions
  startHeartbeat: (context: WebSocketContext) => {
    actions.sendPing(context);

    setInterval(() => {
      if (context.socket?.readyState === WebSocket.OPEN) {
        actions.sendPing(context);
      }
    }, context.pingInterval);
  },

  sendPing: (context: WebSocketContext) => {
    if (!context.socket) return;

    try {
      context.socket.send("ping");
      context.lastPingTime = Date.now();
    } catch (error) {
      actions.recordError(context, {
        type: "ERROR",
        error: error as Error,
        timestamp: Date.now(),
      });
    }
  },

  handlePong: (context: WebSocketContext) => {
    const now = Date.now();
    context.lastPongTime = now;
    const latency = now - context.lastPingTime;

    context.latency.push(latency);
    if (context.latency.length > LIMITS.MAX_LATENCY_SAMPLES) {
      context.latency.shift();
    }
  },

  // Error Handling
  recordError: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "ERROR") return;
    const errorEvent = event as ErrorEvent;

    const errorRecord: ErrorRecord = {
      timestamp: errorEvent.timestamp,
      error: errorEvent.error,
      context: errorEvent.attempt
        ? `Reconnection attempt ${errorEvent.attempt}`
        : undefined,
    };

    context.errors.push(errorRecord);
    if (context.errors.length > LIMITS.MAX_ERROR_HISTORY) {
      context.errors.shift();
    }
  },

  // State Management
  updateConnectionState: (
    context: WebSocketContext,
    newState: WebSocketContext["status"]
  ) => {
    context.status = newState;
    context.readyState = context.socket?.readyState ?? WebSocket.CLOSED;
  },

  resetState: (context: WebSocketContext) => {
    context.socket = null;
    context.messageQueue = [];
    context.processingMessage = false;
    context.reconnectAttempts = 0;
    context.isCleanDisconnect = true;
    // Preserve error history and metrics
  },

  // Reconnection Management
  incrementRetryCounter: (context: WebSocketContext) => {
    context.reconnectAttempts++;
    context.lastReconnectTime = Date.now();
    context.nextReconnectDelay = Math.min(
      context.reconnectInterval *
        Math.pow(context.maxReconnectAttempts, context.reconnectAttempts),
      TIMING.MAX_RECONNECT_DELAY
    );
  },
};

/**
 * Action compositions for common scenarios
 */
export const composedActions = {
  establishConnection: (context: WebSocketContext, event: WebSocketEvent) => {
    actions.createSocket(context, event);
    actions.bindSocketEvents(context);
    actions.updateConnectionState(context, "connecting");
    actions.startHeartbeat(context);
  },

  performDisconnect: (context: WebSocketContext, event: WebSocketEvent) => {
    actions.closeSocket(context, event);
    actions.updateConnectionState(context, "disconnected");
    actions.resetState(context);
  },

  handleReconnection: (context: WebSocketContext, event: WebSocketEvent) => {
    actions.incrementRetryCounter(context);
    if (context.reconnectAttempts < context.maxReconnectAttempts) {
      actions.updateConnectionState(context, "reconnecting");
      actions.createSocket(context, event);
      actions.bindSocketEvents(context);
    } else {
      actions.updateConnectionState(context, "disconnected");
      actions.resetState(context);
    }
  },
};

// Export both individual and composed actions
export default {
  ...actions,
  ...composedActions,
};

```

#### constants.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Constants
 * Default values and configuration constants
 */

import { ConnectionOptions, SendOptions } from "./types.js";

// Default connection configuration
export const DEFAULT_CONFIG: Required<ConnectionOptions> = {
  // Reconnection settings
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,

  // Health check settings
  pingInterval: 30000,
  pongTimeout: 5000,

  // Message handling
  messageQueueSize: 100,
  messageTimeout: 5000,

  // Rate limiting
  rateLimit: {
    messages: 100,
    window: 1000,
  },
};

// Default send options
export const DEFAULT_SEND_OPTIONS: Required<SendOptions> = {
  retry: true,
  timeout: 5000,
  priority: "normal",
  queueIfOffline: true,
};

// WebSocket close codes
export const WS_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015,
} as const;

// Timing constants
export const TIMING = {
  MIN_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 30000,
  DEFAULT_PING_INTERVAL: 30000,
  DEFAULT_PONG_TIMEOUT: 5000,
  RATE_LIMIT_WINDOW: 1000,
} as const;

// Maximum values
export const LIMITS = {
  MAX_MESSAGE_SIZE: 1024 * 1024, // 1MB
  MAX_QUEUE_SIZE: 1000,
  MAX_RETRY_ATTEMPTS: 10,
  MAX_ERROR_HISTORY: 100,
  MAX_LATENCY_SAMPLES: 50,
} as const;

// Metric collection intervals
export const METRIC_INTERVALS = {
  LATENCY: 60000, // 1 minute
  RATE_LIMITING: 1000, // 1 second
  ERROR_CLEANUP: 300000, // 5 minutes
} as const;

// Default error messages
export const ERROR_MESSAGES = {
  INVALID_URL: "Invalid WebSocket URL provided",
  CONNECTION_TIMEOUT: "Connection attempt timed out",
  MAX_RETRIES_EXCEEDED: "Maximum reconnection attempts exceeded",
  RATE_LIMIT_EXCEEDED: "Message rate limit exceeded",
  QUEUE_FULL: "Message queue is full",
  INVALID_STATE: "Invalid state transition attempted",
  PONG_TIMEOUT: "WebSocket pong response timeout",
  MESSAGE_TOO_LARGE: "Message exceeds maximum size limit",
} as const;

```

#### guards.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Guards
 * Guard conditions for controlling state transitions
 */

import {
  WebSocketContext,
  WebSocketEvent,
  ConnectionState,
  ConnectEvent,
  SendEvent,
} from "./types.js";

// Type guard to narrow event types
const isEventType = <T extends WebSocketEvent>(
  event: WebSocketEvent,
  type: T["type"]
): event is T => event.type === type;

/**
 * Core guard conditions for state transitions
 */

export const guards = {
  // Connection Guards
  isValidUrl: (context: WebSocketContext, event: WebSocketEvent) => {
    if (!isEventType(event, "CONNECT")) return false;
    const connectEvent = event as ConnectEvent;
    try {
      const url = new URL(connectEvent.url);
      return url.protocol === "ws:" || url.protocol === "wss:";
    } catch {
      return false;
    }
  },

  hasActiveConnection: (context: WebSocketContext) => {
    return context.socket?.readyState === WebSocket.OPEN;
  },

  canReconnect: (context: WebSocketContext) => {
    return (
      context.maxReconnectAttempts > 0 &&
      context.reconnectAttempts < context.maxReconnectAttempts &&
      !context.isCleanDisconnect
    );
  },

  isWithinRetryLimit: (context: WebSocketContext) => {
    return context.reconnectAttempts < context.maxReconnectAttempts;
  },

  // Rate Limiting Guards
  isRateLimited: (context: WebSocketContext) => {
    const now = Date.now();
    const windowStart = context.windowStart;
    const windowSize = context.rateLimit.window;

    // Reset window if needed
    if (now - windowStart > windowSize) {
      return false;
    }

    return context.messageCount >= context.rateLimit.messages;
  },

  // Message Guards
  canSendMessage: (context: WebSocketContext) => {
    return (
      guards.hasActiveConnection(context) && !guards.isRateLimited(context)
    );
  },

  hasQueueSpace: (context: WebSocketContext) => {
    return context.messageQueue.length < context.messageQueueSize;
  },

  isValidMessage: (_: WebSocketContext, event: WebSocketEvent) => {
    if (!isEventType(event, "SEND")) return false;
    const sendEvent = event as SendEvent;
    return sendEvent.data !== undefined && sendEvent.data !== null;
  },

  canProcessQueue: (context: WebSocketContext) => {
    return !context.processingMessage && guards.hasActiveConnection(context);
  },

  // Health Check Guards
  needsPing: (context: WebSocketContext) => {
    const now = Date.now();
    return (
      guards.hasActiveConnection(context) &&
      now - context.lastPingTime >= context.pingInterval
    );
  },

  isPongOverdue: (context: WebSocketContext) => {
    const now = Date.now();
    return (
      context.lastPingTime > 0 &&
      now - context.lastPingTime >= context.pongTimeout &&
      context.lastPongTime < context.lastPingTime
    );
  },

  // State Transition Guards
  canTransitionTo: (targetState: ConnectionState) => {
    return (context: WebSocketContext) => {
      const validTransitions: Record<ConnectionState, ConnectionState[]> = {
        disconnected: ["connecting"],
        connecting: ["connected", "reconnecting", "disconnected"],
        connected: ["disconnecting", "reconnecting"],
        disconnecting: ["disconnected"],
        reconnecting: ["connecting", "disconnected"],
        backingOff: ["reconnecting", "disconnected"],
        rateLimited: ["connecting", "disconnected"],
        suspended: ["disconnected"],
      };

      return validTransitions[context.status]?.includes(targetState) ?? false;
    };
  },
};

/**
 * Guard compositions for common scenarios
 */
export const composedGuards = {
  canAttemptReconnect: (context: WebSocketContext) => {
    return (
      guards.canReconnect(context) &&
      guards.isWithinRetryLimit(context) &&
      !guards.isRateLimited(context)
    );
  },

  canInitiateConnection: (context: WebSocketContext, event: WebSocketEvent) => {
    return (
      guards.isValidUrl(context, event) &&
      !guards.hasActiveConnection(context) &&
      !guards.isRateLimited(context)
    );
  },

  shouldAttemptQueueProcessing: (context: WebSocketContext) => {
    return (
      guards.canProcessQueue(context) &&
      guards.hasQueueSpace(context) &&
      !guards.isRateLimited(context)
    );
  },
};

// Export both individual and composed guards
export default {
  ...guards,
  ...composedGuards,
};

```

#### machine.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Definition
 * Functional implementation using XState v5
 */

import { setup } from "xstate";
import type {
  WebSocketContext,
  WebSocketEvent,
  ConnectionOptions,
} from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";

/** Create immutable initial context */
const createInitialContext = (
  config: Partial<ConnectionOptions> = {}
): WebSocketContext => ({
  // Connection
  url: "",
  protocols: [],
  socket: null,
  status: "disconnected",
  readyState: WebSocket.CLOSED,
  options: {
    ...DEFAULT_CONFIG,
    ...config,
  },
  state: {
    connectionAttempts: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    lastError: null,
    lastMessageTime: 0,
  },

  // Timing
  connectTime: 0,
  disconnectTime: 0,
  isCleanDisconnect: true,

  // Reconnection
  reconnectAttempts: 0,
  maxReconnectAttempts:
    config.maxReconnectAttempts ?? DEFAULT_CONFIG.maxReconnectAttempts,
  reconnectInterval:
    config.reconnectInterval ?? DEFAULT_CONFIG.reconnectInterval,
  lastReconnectTime: 0,
  nextReconnectDelay: 0,

  // Message Queue
  messageQueue: [],
  messageQueueSize: config.messageQueueSize ?? DEFAULT_CONFIG.messageQueueSize,
  processingMessage: false,
  lastMessageId: "",
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0,
  },

  // Health Check
  pingInterval: config.pingInterval ?? DEFAULT_CONFIG.pingInterval,
  pongTimeout: config.pongTimeout ?? DEFAULT_CONFIG.pongTimeout,
  lastPingTime: 0,
  lastPongTime: 0,
  latency: [],

  // Metrics
  metrics: {
    messagesSent: 0,
    messagesReceived: 0,
    bytesReceived: 0,
    bytesSent: 0,
  },
  errors: [],

  // Rate Limiting
  messageCount: 0,
  windowStart: Date.now(),
  rateLimit: config.rateLimit ?? DEFAULT_CONFIG.rateLimit,
});

/** Pure function to update connection state */
const updateState = <T extends WebSocketContext>(
  context: T,
  updates: Partial<T>
): T => ({
  ...context,
  ...updates,
});

/** Pure action creators */
const actions = {
  updateConnectionState: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: WebSocketEvent;
  }) =>
    updateState(context, {
      status: event.type === "OPEN" ? "connected" : context.status,
    }),

  resetState: ({ context }: { context: WebSocketContext }) =>
    updateState(context, {
      socket: null,
      messageQueue: [],
      processingMessage: false,
      reconnectAttempts: 0,
      isCleanDisconnect: true,
    }),

  establishConnection: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: WebSocketEvent;
  }) => {
    if (event.type !== "CONNECT") return context;

    try {
      const socket = new WebSocket(event.url, context.protocols);
      return updateState(context, {
        socket,
        url: event.url,
        connectTime: Date.now(),
        ...(event.options && { ...event.options }),
      });
    } catch (error) {
      return updateState(context, {
        errors: [
          ...context.errors,
          { timestamp: Date.now(), error: error as Error },
        ],
      });
    }
  },

  handleMessage: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: WebSocketEvent;
  }) => {
    if (event.type !== "MESSAGE") return context;

    const metrics = {
      ...context.metrics,
      messagesReceived: context.metrics.messagesReceived + 1,
      bytesReceived:
        typeof event.data === "string"
          ? context.metrics.bytesReceived + event.data.length
          : context.metrics.bytesReceived,
    };

    return updateState(context, { metrics });
  },

  enqueueMessage: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: WebSocketEvent;
  }) => {
    if (event.type !== "SEND") return context;

    const message = {
      id: event.id || crypto.randomUUID(),
      data: event.data,
      timestamp: Date.now(),
      attempts: 0,
      priority: event.options?.priority || "normal",
    };

    return updateState(context, {
      messageQueue: [...context.messageQueue, message],
    });
  },

  processQueue: ({ context }: { context: WebSocketContext }) => {
    if (
      !context.socket ||
      context.processingMessage ||
      context.messageQueue.length === 0
    ) {
      return context;
    }

    const { messageQueue, metrics } = context;
    const [message, ...remainingQueue] = messageQueue;

    if (context.socket.readyState === WebSocket.OPEN) {
      context.socket.send(JSON.stringify(message.data));
      return updateState(context, {
        messageQueue: remainingQueue,
        metrics: {
          ...metrics,
          messagesSent: metrics.messagesSent + 1,
        },
      });
    }

    return context;
  },

  incrementRetryCounter: ({ context }: { context: WebSocketContext }) => {
    const attempts = context.reconnectAttempts + 1;
    const delay = Math.min(
      context.reconnectInterval * Math.pow(2, attempts),
      context.maxReconnectAttempts
    );

    return updateState(context, {
      reconnectAttempts: attempts,
      lastReconnectTime: Date.now(),
      nextReconnectDelay: delay,
    });
  },
};

/** Pure guard creators */
const guards = {
  canInitiateConnection: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: WebSocketEvent;
  }) => {
    if (event.type !== "CONNECT") return false;
    try {
      const url = new URL(event.url);
      return (
        (url.protocol === "ws:" || url.protocol === "wss:") &&
        !context.socket &&
        context.messageCount < context.rateLimit.messages
      );
    } catch {
      return false;
    }
  },

  canReconnect: ({ context }: { context: WebSocketContext }) =>
    context.maxReconnectAttempts > 0 &&
    context.reconnectAttempts < context.maxReconnectAttempts &&
    !context.isCleanDisconnect,

  isWithinRetryLimit: ({ context }: { context: WebSocketContext }) =>
    context.reconnectAttempts < context.maxReconnectAttempts,

  canSendMessage: ({ context }: { context: WebSocketContext }) =>
    context.socket?.readyState === WebSocket.OPEN &&
    context.messageCount < context.rateLimit.messages,
};

/** Create the state machine */
export const createWebSocketMachine = (config?: Partial<ConnectionOptions>) => {
  return setup({
    types: {
      context: {} as WebSocketContext,
      events: {} as WebSocketEvent,
    },
    actions,
    guards,
  }).createMachine({
    id: "webSocket",
    initial: "disconnected",
    context: createInitialContext(config),
    states: {
      disconnected: {
        on: {
          CONNECT: {
            target: "connecting",
            guard: "canInitiateConnection",
            actions: "establishConnection",
          },
        },
      },

      connecting: {
        on: {
          OPEN: {
            target: "connected",
            actions: "updateConnectionState",
          },
          ERROR: [
            {
              target: "backingOff",
              guard: "canReconnect",
            },
            {
              target: "disconnected",
              actions: "resetState",
            },
          ],
          CLOSE: {
            target: "disconnected",
            actions: "resetState",
          },
        },
      },

      connected: {
        entry: "processQueue",
        on: {
          SEND: {
            guard: "canSendMessage",
            actions: ["enqueueMessage", "processQueue"],
          },
          MESSAGE: {
            actions: "handleMessage",
          },
          ERROR: [
            {
              target: "backingOff",
              guard: "canReconnect",
            },
            {
              target: "disconnected",
              actions: "resetState",
            },
          ],
          DISCONNECT: {
            target: "disconnecting",
          },
        },
      },

      disconnecting: {
        on: {
          CLOSE: {
            target: "disconnected",
            actions: "resetState",
          },
        },
      },

      backingOff: {
        entry: "incrementRetryCounter",
        after: {
          RECONNECT_DELAY: {
            target: "reconnecting",
            guard: "isWithinRetryLimit",
          },
        },
      },

      reconnecting: {
        on: {
          RETRY: {
            target: "connecting",
            guard: "isWithinRetryLimit",
            actions: "establishConnection",
          },
          MAX_RETRIES: {
            target: "disconnected",
            actions: "resetState",
          },
        },
      },
    },
  });
};

export default createWebSocketMachine;

```

#### types.ts

```typescript
/**
 * @fileoverview WebSocket State Machine Types
 * Core type definitions for the WebSocket state machine implementation
 */

// Connection States
export const ConnectionStates = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTING: "disconnecting",
  RECONNECTING: "reconnecting",
  BACKING_OFF: "backingOff",
  RATE_LIMITED: "rateLimited",
  SUSPENDED: "suspended",
} as const;

export type ConnectionState =
  (typeof ConnectionStates)[keyof typeof ConnectionStates];

/**
 * Connection state tracking
 */
export interface ConnectionStateInfo {
  connectionAttempts: number;
  lastConnectTime: number;
  lastDisconnectTime: number;
  lastError: Error | null;
  lastMessageTime: number;
}

/**
 * Message queue state
 */
export interface QueueState {
  messages: QueuedMessage[];
  pending: boolean;
  lastProcessed: number;
}

// Event Types remain the same
export const EventTypes = {
  // Connection Events
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  ERROR: "ERROR",

  // Message Events
  MESSAGE: "MESSAGE",
  SEND: "SEND",

  // Health Check Events
  PING: "PING",
  PONG: "PONG",

  // Reconnection Events
  RETRY: "RETRY",
  MAX_RETRIES: "MAX_RETRIES",
  TERMINATE: "TERMINATE",
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

// Event Payloads remain the same
export interface BaseEvent {
  type: EventType;
  timestamp: number;
}

// ... all other event interfaces remain the same ...

// Configuration Types
export interface ConnectionOptions {
  // Reconnection settings
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;

  // Health check settings
  pingInterval: number;
  pongTimeout: number;

  // Message handling
  messageQueueSize: number;
  messageTimeout: number;

  // Rate limiting
  rateLimit: {
    messages: number;
    window: number;
  };
}

export interface SendOptions {
  retry: boolean;
  timeout: number;
  priority: "high" | "normal";
  queueIfOffline: boolean;
}

// Message Types
export interface QueuedMessage {
  id: string;
  data: unknown;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: "high" | "normal";
}

export interface ErrorRecord {
  timestamp: number;
  error: Error;
  context?: string;
}

export interface ConnectionMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
}

// Updated WebSocket Context
export interface WebSocketContext {
  // Connection
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  readyState: number;
  options: ConnectionOptions;
  state: ConnectionStateInfo;

  // Message Queue
  queue: QueueState;
  messageQueueSize: number;

  // Health Check
  pingInterval: number;
  pongTimeout: number;
  lastPingTime: number;
  lastPongTime: number;
  latency: number[];

  // Metrics
  metrics: ConnectionMetrics;
  errors: ErrorRecord[];

  // Rate Limiting
  messageCount: number;
  windowStart: number;
  rateLimit: {
    messages: number;
    window: number;
  };
}

```

