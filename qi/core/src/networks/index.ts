/**
 * @fileoverview Network Module Entry Point
 * @module @qi/core/networks
 *
 * @description
 * Exports all network-related functionality including HTTP and WebSocket clients,
 * error handling utilities, and all necessary types and interfaces for external use.
 *
 * @author zhifengzhang-sz
 * @created 2024-12-11
 * @modified 2024-12-12
 */

// Core error types and utilities
export type { NetworkErrorContext, HttpStatusCodeType } from "./errors.js";
export {
  HttpStatusCode,
  mapHttpStatusToErrorCode,
  createNetworkError,
  transformAxiosError,
} from "./errors.js";

// WebSocket types and utilities
export type { WebSocketConfig, MessageHandler } from "./websocket/types.js";
export type { ConnectionState } from "./websocket/state.js";
export {
  createWebSocketError,
  transformWebSocketError,
} from "./websocket/errors.js";

// HTTP types
export type { HttpConfig, RequestConfig } from "./http/client.js";

// Client implementations
export { HttpClient } from "./http/client.js";
export { WebSocketClient } from "./websocket/client.js";

// Re-export default config
export { defaultConfig as defaultWebSocketConfig } from "./websocket/types.js";
