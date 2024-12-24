/**
 * @fileoverview WebSocket constants and configuration
 * @module @qi/core/network/websocket/constants
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

/**
 * Core WebSocket states
 */
export const STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
  TERMINATED: "terminated",
} as const;

export type State = (typeof STATES)[keyof typeof STATES];

/**
 * Core WebSocket events
 */
export const EVENTS = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  ERROR: "ERROR",
  MESSAGE: "MESSAGE",
  SEND: "SEND",
  RETRY: "RETRY",
  MAX_RETRIES: "MAX_RETRIES",
  TERMINATE: "TERMINATE",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Basic configuration defaults
 */
export const BASE_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  messageQueueSize: 100,
  maxLatencyHistory: 50,
  maxEventHistory: 100,
  maxStateHistory: 200,
} as const;

export type BaseConfig = typeof BASE_CONFIG;

/**
 * WebSocket close codes
 */
export const CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  INVALID_DATA: 1003,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
  CONNECTION_FAILED: 1006,
} as const;

export type CloseCode = (typeof CLOSE_CODES)[keyof typeof CLOSE_CODES];
