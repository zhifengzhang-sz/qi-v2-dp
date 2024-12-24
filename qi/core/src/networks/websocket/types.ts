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

export interface WebSocketContext {
  url: string;
  protocols?: string | string[];
  socket?: WebSocket;
  options: {
    connectionTimeout: number;
    pingInterval: number;
  };
  metrics: {
    totalErrors: number;
    consecutiveErrors: number;
  };
  state: {
    connectionAttempts: number;
  };
}

export interface WebSocketError extends Error {
  code?: number;
  reason?: string;
  wasClean?: boolean;
}

export interface WebSocketEvents {
  type: "OPEN" | "CLOSE" | "MESSAGE" | "PING";
  timestamp: number;
  data?: any;
  code?: number;
  reason?: string;
  wasClean?: boolean;
  error?: Error;
}
