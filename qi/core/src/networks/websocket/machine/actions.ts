/**
 * @fileoverview
 * @module actions.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

import type {
  WebSocketContext,
  WebSocketEvent,
  ErrorRecord,
  QueuedMessage,
} from "./types.js";
import { TIMING } from "./constants.js";

export const actions = {
  // Connection Management
  establishConnection: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "CONNECT") return;
    try {
      const socket = new WebSocket(event.url, context.protocols);
      context.socket = socket;
      context.url = event.url;
      context.state.lastConnectTime = Date.now();
      context.state.connectionAttempts = 0;

      if (event.options) {
        context.options = { ...context.options, ...event.options };
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
      context.state.lastConnectTime = Date.now();
      context.state.connectionAttempts = 0;
    };

    context.socket.onclose = () => {
      context.state.lastDisconnectTime = Date.now();
      context.socket = null;
    };

    context.socket.onerror = (error) => {
      context.state.lastError =
        error instanceof Error ? error : new Error("WebSocket error");
      actions.recordError(context, {
        type: "ERROR",
        error: context.state.lastError,
        timestamp: Date.now(),
      });
    };

    context.socket.onmessage = (event) => {
      context.state.lastMessageTime = Date.now();
      actions.handleMessage(context, {
        type: "MESSAGE",
        data: event.data,
        timestamp: Date.now(),
      });
    };
  },

  // Message Handling
  handleMessage: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "MESSAGE") return;
    context.metrics.messagesReceived++;
    if (typeof event.data === "string") {
      context.metrics.bytesReceived += event.data.length;
    }

    if (event.data === "pong") {
      actions.handlePong(context);
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

    context.queue.messages.push(message);
    actions.processQueue(context);
  },

  processQueue: (context: WebSocketContext) => {
    if (context.queue.pending || !context.socket) return;

    context.queue.pending = true;
    try {
      while (
        context.queue.messages.length > 0 &&
        context.socket?.readyState === WebSocket.OPEN
      ) {
        const message = context.queue.messages[0];
        context.socket.send(JSON.stringify(message.data));
        context.metrics.messagesSent++;
        context.queue.messages.shift();
        context.queue.lastProcessed = Date.now();
      }
    } finally {
      context.queue.pending = false;
    }
  },

  // Health Check
  sendPing: (context: WebSocketContext) => {
    if (context.socket?.readyState === WebSocket.OPEN) {
      context.socket.send("ping");
      context.lastPingTime = Date.now();
    }
  },

  startHeartbeat: (context: WebSocketContext) => {
    actions.sendPing(context);
    setInterval(() => {
      if (context.socket?.readyState === WebSocket.OPEN) {
        actions.sendPing(context);
      }
    }, context.pingInterval);
  },

  handlePong: (context: WebSocketContext) => {
    const now = Date.now();
    context.lastPongTime = now;
    const latency = now - context.lastPingTime;

    context.latency.push(latency);
    if (context.latency.length > 50) {
      context.latency.shift();
    }
  },

  // Error Handling
  recordError: (context: WebSocketContext, event: WebSocketEvent) => {
    if (event.type !== "ERROR") return;

    const errorRecord: ErrorRecord = {
      timestamp: event.timestamp,
      error: event.error,
      context: event.attempt
        ? `Reconnection attempt ${event.attempt}`
        : undefined,
    };

    context.errors.push(errorRecord);
    if (context.errors.length > 100) {
      context.errors.shift();
    }

    context.state.lastError = errorRecord.error;
  },

  // State Management
  resetState: (context: WebSocketContext) => {
    context.socket = null;
    context.queue.messages = [];
    context.queue.pending = false;
    context.state.connectionAttempts = 0;
  },

  // Reconnection Management
  incrementRetryCounter: (context: WebSocketContext) => {
    context.state.connectionAttempts++;
  },

  calculateBackoff: (context: WebSocketContext) => {
    return Math.min(
      context.options.reconnectInterval *
        Math.pow(2, context.state.connectionAttempts),
      TIMING.MAX_RECONNECT_DELAY
    );
  },

  initiateClose: (context: WebSocketContext) => {
    context.socket?.close();
  },
};

export default actions;
