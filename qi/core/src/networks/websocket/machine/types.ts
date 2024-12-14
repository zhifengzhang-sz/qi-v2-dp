/**
 * @fileoverview WebSocket Types and Defaults
 * @module @qi/core/networks/websocket/types
 */

// Connection Configuration Types
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

// Event Types
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

// Base Event Interface
export interface BaseEvent {
  type: EventType;
  timestamp: number;
}

// Event Interfaces
export interface ConnectEvent extends BaseEvent {
  type: "CONNECT";
  url: string;
  protocols?: string[];
  options?: ConnectionOptions;
}

export interface DisconnectEvent extends BaseEvent {
  type: "DISCONNECT";
  code?: number;
  reason?: string;
}

export interface OpenEvent extends BaseEvent {
  type: "OPEN";
  event: Event;
}

export interface CloseEvent extends BaseEvent {
  type: "CLOSE";
  code: number;
  reason: string;
  wasClean: boolean;
}

export interface ErrorEvent extends BaseEvent {
  type: "ERROR";
  error: Error;
  attempt?: number;
}

export interface MessageEvent extends BaseEvent {
  type: "MESSAGE";
  data: unknown;
  id?: string;
}

export interface SendEvent extends BaseEvent {
  type: "SEND";
  data: unknown;
  id?: string;
  options?: SendOptions;
}

export interface PingEvent extends BaseEvent {
  type: "PING";
}

export interface PongEvent extends BaseEvent {
  type: "PONG";
  latency: number;
}

export interface RetryEvent extends BaseEvent {
  type: "RETRY";
  attempt: number;
  delay: number;
}

export interface MaxRetriesEvent extends BaseEvent {
  type: "MAX_RETRIES";
  attempts: number;
  lastError?: Error;
}

export interface TerminateEvent extends BaseEvent {
  type: "TERMINATE";
  code?: number;
  reason?: string;
  immediate?: boolean;
}

// Union type for all WebSocket events
export type WebSocketEvent =
  | ConnectEvent
  | DisconnectEvent
  | OpenEvent
  | CloseEvent
  | ErrorEvent
  | MessageEvent
  | SendEvent
  | PingEvent
  | PongEvent
  | RetryEvent
  | MaxRetriesEvent
  | TerminateEvent;

// Connection Options
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

// Message Options
export interface SendOptions {
  retry: boolean;
  timeout: number;
  priority: "high" | "normal";
  queueIfOffline: boolean;
}

// Message Queue Types
export interface QueuedMessage {
  id: string;
  data: unknown;
  timestamp: number;
  attempts: number;
  timeout?: number;
  priority: "high" | "normal";
}

// State Types
export interface ConnectionStateInfo {
  connectionAttempts: number;
  lastConnectTime: number;
  lastDisconnectTime: number;
  lastError: Error | null;
  lastMessageTime: number;
}

export interface QueueState {
  messages: QueuedMessage[];
  pending: boolean;
  lastProcessed: number;
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

// Connection States
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "reconnecting"
  | "backingOff"
  | "rateLimited"
  | "suspended";

// WebSocket Context
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

// Message Handler Type
export interface MessageHandler {
  (data: unknown): void | Promise<void>;
}

// Default Configuration
export const defaultConfig: Required<WebSocketConfig> = {
  pingInterval: 30000,
  pongTimeout: 5000,
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  connectionTimeout: 30000,
};
