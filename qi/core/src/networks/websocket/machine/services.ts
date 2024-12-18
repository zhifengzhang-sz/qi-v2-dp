/**
 * @fileoverview WebSocket state machine services
 * @module @qi/core/network/websocket/services
 */

/// <reference lib="dom" />

import { fromCallback } from "xstate";
import { logger } from "@qi/core/logger";
import type {
  WebSocketContext,
  WebSocketEvents as WebSocketStateEvents,
  WebSocketLogic,
} from "./types.js";
import { createWebSocketError, retryWithBackoff } from "./utils.js";
import { HttpStatusCode } from "../../errors.js";
import type { WebSocket as BrowserWebSocket } from 'ws';

interface WebSocketCloseEvent extends Event {
  code: number;
  reason: string;
  wasClean: boolean;
}

interface WebSocketEvents extends Event {
  data?: any;
  code?: number;
  reason?: string;
  wasClean?: boolean;
}

type WebSocketType = globalThis.WebSocket;
type WebSocketErrorType = Event;
type WebSocketMessageType = MessageEvent;
type WebSocketCloseType = WebSocketCloseEvent;

// Helper function (was missing)
function cleanupWebSocket(
  socket: WebSocketType | null,
  reason = "Service cleanup"
) {
  if (!socket) return;

  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
  socket.onopen = null;

  if (
    socket.readyState !== WebSocket.CLOSED &&
    socket.readyState !== WebSocket.CLOSING
  ) {
    socket.close(HttpStatusCode.WEBSOCKET_NORMAL_CLOSURE, reason);
  }
}

export const webSocketService = fromCallback(
  ({
    input: context,
    self,
  }: {
    input: WebSocketContext;
    self: { send: (event: WebSocketStateEvents) => void };
  }) => {
    let socket: WebSocketType | null = null;

    // Error handlers defined at service level
    const handleConnectionError = (error: Error) => {
      const wsError = createWebSocketError(
        "Failed to establish WebSocket connection",
        error,
        {
          url: context.url,
          connectionAttempts: context.state.connectionAttempts,
          totalErrors: context.metrics.totalErrors + 1,
          consecutiveErrors: context.metrics.consecutiveErrors + 1,
          readyState: socket?.readyState ?? WebSocket.CLOSED,
          socket,
        }
      );

      self.send({
        type: "ERROR",
        error: wsError,
        timestamp: Date.now(),
      });
    };

    const handleSocketError = (event: WebSocketErrorType) => {
      const wsError = createWebSocketError(
        "WebSocket encountered an error",
        new Error("WebSocket error occurred"),
        {
          url: context.url,
          connectionAttempts: context.state.connectionAttempts,
          totalErrors: context.metrics.totalErrors + 1,
          consecutiveErrors: context.metrics.consecutiveErrors + 1,
          lastSuccessfulConnection: context.metrics.lastSuccessfulConnection,
          readyState: socket?.readyState ?? WebSocket.CLOSED,
          socket,
        }
      );

      self.send({
        type: "ERROR",
        error: wsError,
        timestamp: Date.now(),
      });
    };

    const handleClose = (event: {
      code: number;
      reason: string;
      wasClean: boolean;
    }) => {
      const wsError = createWebSocketError(
        "WebSocket connection closed",
        new Error(event.reason || "Connection closed"),
        {
          closeCode: event.code,
          closeReason: event.reason,
          wasClean: event.wasClean,
          url: context.url,
          totalErrors: context.metrics.totalErrors,
          consecutiveErrors: context.metrics.consecutiveErrors,
          connectionAttempts: context.state.connectionAttempts,
          readyState: socket?.readyState ?? WebSocket.CLOSED,
          socket,
        }
      );

      self.send({
        type: "CLOSE",
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        error: wsError,
      });
    };

    const connect = async () => {
      try {
        socket = await retryWithBackoff(async () => {
          const ws = new WebSocket(context.url, context.protocols);

          return new Promise<WebSocketType>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Connection timeout"));
            }, context.options.connectionTimeout);

            ws.onopen = function(this: WebSocket) {
              clearTimeout(timeout);
              resolve(ws);
            };

            ws.onerror = function(this: WebSocket, ev: Event) {
              reject(new Error("Connection failed"));
            };
          });
        }, context);

        socket.onmessage = function(this: WebSocket, ev: MessageEvent) {
          logger.debug("WebSocket message received", {
            size: ev.data.length,
            type: typeof ev.data,
          });

          self.send({
            type: "MESSAGE",
            data: ev.data,
            timestamp: Date.now(),
          });
        };

        socket.onerror = function(this: WebSocket, ev: Event) {
          handleSocketError(ev);
        };

        socket.onclose = handleClose;

        self.send({ type: "OPEN", timestamp: Date.now() });
      } catch (error) {
        handleConnectionError(error as Error);
      }
    };

    // Start connection
    connect();

    // Return cleanup function
    return () => {
      logger.info("Cleaning up WebSocket connection", {
        url: context.url,
        readyState: socket?.readyState,
      });

      if (socket) {
        cleanupWebSocket(socket);
      }
    };
  }
);

export const pingService = fromCallback(
  ({
    input: context,
    self,
  }: {
    input: WebSocketContext;
    self: { send: (event: WebSocketStateEvents) => void };
  }) => {
    const pingInterval = setInterval(() => {
      if (context.socket?.readyState === WebSocket.OPEN) {
        const timestamp = Date.now();
        self.send({ type: "PING", timestamp });
      }
    }, context.options.pingInterval);

    // Return cleanup function
    return () => clearInterval(pingInterval);
  }
);

export const services = {
  webSocketService,
  pingService
};
