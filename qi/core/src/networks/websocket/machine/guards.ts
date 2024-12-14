/**
 * @fileoverview
 * @module guards.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

// guards.ts
import type {
  WebSocketContext,
  WebSocketEvent,
  ConnectEvent,
  DisconnectEvent,
  SendEvent,
  ConnectionState,
} from "./types.js";
import { EventTypes } from "./types.js";
import {
  TIMING,
  LIMITS,
  DEFAULT_CONFIG,
  CONNECTION_STATES,
} from "./constants.js";

// Type Guards
const isConnectEvent = (event: WebSocketEvent): event is ConnectEvent =>
  event.type === EventTypes.CONNECT;

const isDisconnectEvent = (event: WebSocketEvent): event is DisconnectEvent =>
  event.type === EventTypes.DISCONNECT;

const isSendEvent = (event: WebSocketEvent): event is SendEvent =>
  event.type === EventTypes.SEND;

export const guards = {
  canInitiateConnection: (
    context: WebSocketContext,
    event: WebSocketEvent
  ): boolean => {
    if (!isConnectEvent(event)) return false;

    try {
      const url = new URL(event.url);
      return (
        (url.protocol === "ws:" || url.protocol === "wss:") &&
        context.status === CONNECTION_STATES.DISCONNECTED &&
        !context.socket
      );
    } catch {
      return false;
    }
  },

  canDisconnect: (
    context: WebSocketContext,
    event: WebSocketEvent
  ): boolean => {
    if (!isDisconnectEvent(event)) return false;
    return context.socket?.readyState === WebSocket.OPEN;
  },

  hasActiveConnection: (context: WebSocketContext): boolean => {
    return (
      context.socket?.readyState === WebSocket.OPEN &&
      context.status === CONNECTION_STATES.CONNECTED
    );
  },

  canReconnect: (context: WebSocketContext): boolean => {
    return (
      context.options.reconnect &&
      context.state.connectionAttempts < DEFAULT_CONFIG.maxReconnectAttempts &&
      context.status !== CONNECTION_STATES.SUSPENDED
    );
  },

  isRateLimited: (context: WebSocketContext): boolean => {
    const now = Date.now();
    const windowEnd = context.windowStart + TIMING.RATE_LIMIT_WINDOW;

    if (now > windowEnd) {
      return false;
    }

    return context.messageCount >= DEFAULT_CONFIG.rateLimit.messages;
  },

  canSendMessage: (
    context: WebSocketContext,
    event: WebSocketEvent
  ): boolean => {
    if (!isSendEvent(event)) return false;

    const messageSize =
      typeof event.data === "string"
        ? event.data.length
        : JSON.stringify(event.data).length;

    return (
      guards.hasActiveConnection(context) &&
      !guards.isRateLimited(context) &&
      messageSize <= LIMITS.MAX_MESSAGE_SIZE
    );
  },

  canQueueMessage: (
    context: WebSocketContext,
    event: WebSocketEvent
  ): boolean => {
    if (!isSendEvent(event)) return false;

    return (
      context.queue.messages.length < LIMITS.MAX_QUEUE_SIZE &&
      event.options?.queueIfOffline !== false
    );
  },

  canProcessQueue: (context: WebSocketContext): boolean => {
    return (
      !context.queue.pending &&
      guards.hasActiveConnection(context) &&
      context.queue.messages.length > 0
    );
  },

  shouldReconnect: (context: WebSocketContext): boolean => {
    const reconnectableStates: ConnectionState[] = [
      "disconnected",
      "backingOff",
    ];
    return (
      context.options.reconnect &&
      context.state.connectionAttempts < DEFAULT_CONFIG.maxReconnectAttempts &&
      reconnectableStates.includes(context.status)
    );
  },
};
export default guards;
