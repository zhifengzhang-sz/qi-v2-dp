/**
 * @fileoverview WebSocket constants and configuration
 * @module @qi/core/network/websocket/constants
 */

export const CONNECTION_STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
} as const;

export const DEFAULT_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  reconnectBackoffRate: 1.5,
  connectionTimeout: 30000,
  pingInterval: 30000,
  pongTimeout: 5000,
  messageQueueSize: 100,
  messageTimeout: 5000,
  rateLimit: {
    messages: 100,
    window: 1000,
  },
} as const;

// Initial context state
export const INITIAL_CONTEXT = {
  url: "",
  protocols: [],
  socket: null,
  status: CONNECTION_STATES.DISCONNECTED,
  readyState: WebSocket.CLOSED,
  options: DEFAULT_CONFIG,
  state: {
    connectionAttempts: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    lastError: null,
    lastMessageTime: 0,
    lastErrorTime: 0,
  },
  metrics: {
    messagesSent: 0,
    messagesReceived: 0,
    bytesReceived: 0,
    bytesSent: 0,
    messageTimestamps: [],
    totalErrors: 0,
    consecutiveErrors: 0,
    lastSuccessfulConnection: 0,
    errors: [],
  },
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0,
  },
} as const;
