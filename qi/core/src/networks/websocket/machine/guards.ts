/**
 * @fileoverview WebSocket state machine guards
 * @module @qi/core/network/websocket/guards
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

import { WebSocketContext, WebSocketEvent } from "./types.js";
import { validateUrl } from "./utils.js";

/**
 * Type-safe guard implementations for XState v5
 */
export const guards = {
  canConnect: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "CONNECT" }>;
  }): boolean => {
    return context.socket === null && validateUrl(event.url).isValid;
  },

  isSocketValid: ({ context }: { context: WebSocketContext }): boolean => {
    return (
      context.socket !== null && context.socket.readyState === WebSocket.OPEN
    );
  },

  canRetry: ({ context }: { context: WebSocketContext }): boolean => {
    return (
      context.options.reconnect &&
      context.retryCount < context.options.maxReconnectAttempts
    );
  },

  hasValidUrl: ({
    context,
    event,
  }: {
    context: WebSocketContext;
    event: Extract<WebSocketEvent, { type: "CONNECT" | "RETRY" }>;
  }): boolean => {
    if (event.type === "CONNECT") {
      return validateUrl(event.url).isValid;
    }
    return context.url !== null && validateUrl(context.url).isValid;
  },

  isRateLimited: ({ context }: { context: WebSocketContext }): boolean => {
    const { rateLimit } = context;
    const now = Date.now();

    // Reset rate limit window if needed
    if (now - rateLimit.lastReset >= rateLimit.window) {
      return false;
    }

    return rateLimit.count >= rateLimit.maxBurst;
  },
} as const;
