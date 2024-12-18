/**
 * @fileoverview Network Module Entry Point
 * @module @qi/core/networks
 */

// Core HTTP functionality
export { HttpClient } from "./http/client.js";
export type { HttpConfig, RequestConfig } from "./http/types.js";

// Error handling and types
export type { NetworkErrorContext } from "./shared/types.js";
export {
  HttpStatusCode,
  createNetworkError,
  transformAxiosError,
  mapHttpStatusToErrorCode,
  mapWebSocketErrorToStatus,
  type HttpStatusCodeType,
} from "./errors.js";

// WebSocket types and utilities
export type { WebSocketConfig, MessageHandler } from "./websocket/types.js";
export type { ConnectionState } from "./websocket/state.js";
export {
  createWebSocketError,
  transformWebSocketError,
} from "./websocket/errors.js";

export { WebSocketClient } from "./websocket/client.js";

export { defaultConfig as defaultWebSocketConfig } from "./websocket/types.js";