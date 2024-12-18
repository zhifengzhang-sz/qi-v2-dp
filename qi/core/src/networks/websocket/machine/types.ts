/**
 * @fileoverview WebSocket type definitions
 * @module @qi/core/network/websocket/types
 */

import { NetworkErrorContext } from "../../errors.js";
import { CONNECTION_STATES, DEFAULT_CONFIG } from "./constants.js";
import type { EventObject } from "xstate";

export type ConnectionState =
  (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];

export interface ConnectionOptions {
  reconnect: boolean;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  reconnectBackoffRate: number;
  connectionTimeout: number;
  pingInterval: number;
  pongTimeout: number;
  messageQueueSize: number;
  messageTimeout: number;
  rateLimit: {
    messages: number;
    window: number;
  };
}

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
  attempt?: number;
  context?: string;
}

export interface WebSocketMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesReceived: number;
  bytesSent: number;
  messageTimestamps: number[];
  totalErrors: number;
  consecutiveErrors: number;
  lastSuccessfulConnection?: number;
  errors: ErrorRecord[];
}

export interface WebSocketContext {
  url: string;
  protocols: string[];
  socket: WebSocket | null;
  status: ConnectionState;
  readyState: number;
  options: Required<ConnectionOptions>;
  state: {
    connectionAttempts: number;
    lastConnectTime: number;
    lastDisconnectTime: number;
    lastError: Error | null;
    lastMessageTime: number;
    lastErrorTime: number;  // Add this property
  };
  metrics: WebSocketMetrics;
  queue: {
    messages: QueuedMessage[];
    pending: boolean;
    lastProcessed: number;
  };
}

export interface WebSocketErrorContext extends NetworkErrorContext {
  socket?: WebSocket | null;  // Add this line
  connectionAttempts: number;
  lastError?: Error;
  closeCode?: number;
  closeReason?: string;
  lastSuccessfulConnection?: number;
  totalErrors: number;
  consecutiveErrors: number;
  retryDelay?: number;
}

export interface WebSocketError extends Error {
  statusCode: number;
  context?: WebSocketErrorContext;
}

export interface WebSocketLogic extends EventObject {
  type: "webSocketLogic"; // Required by EventObject
  input: WebSocketContext;
  events: WebSocketEvents;
}

export type WebSocketEvents =
  | {
      type: "CONNECT";
      url: string;
      protocols?: string[];
      options?: Partial<ConnectionOptions>;
    }
  | { type: "DISCONNECT"; code?: number; reason?: string }
  | { type: "OPEN"; timestamp: number }
  | {
      type: "CLOSE";
      code: number;
      reason: string;
      wasClean: boolean;
      error?: Error;
    }
  | { type: "ERROR"; error: Error; timestamp: number; attempt?: number }
  | { type: "MESSAGE"; data: unknown; timestamp: number; id?: string }
  | {
      type: "SEND";
      data: unknown;
      id?: string;
      options?: { priority: "high" | "normal" };
    }
  | { type: "PING"; timestamp: number }
  | { type: "PONG"; latency: number; timestamp: number }
  | { type: "RETRY"; attempt: number; delay: number };

export type WebSocketServices = {
  webSocketService: (context: WebSocketContext) => (send: Sender) => Cleanup;
  pingService: (context: WebSocketContext) => (send: Sender) => Cleanup;
};

export type Cleanup = void | (() => void);
export type Sender = <E extends WebSocketEvents>(event: E) => void;
