/**
 * @fileoverview WebSocket state machine services for XState v5
 * @module @qi/core/network/websocket/services
 *
 * @author zhifengzhang-sz
 * @created 2024-12-24
 * @modified 2024-12-25
 */

import { AnyActorRef } from "xstate";
import { WebSocketContext, WebSocketEvent } from "./types.js";
import { ApplicationError, ErrorCode, StatusCode } from "@qi/core/errors";
import { validateUrl } from "./utils.js";
import { mapTransitionCloseCodeToError } from "./transitions.js";

function isValidMessageData(
  data: unknown
): data is string | ArrayBufferLike | Blob | ArrayBufferView {
  return (
    typeof data === "string" ||
    data instanceof ArrayBuffer ||
    data instanceof Blob ||
    ArrayBuffer.isView(data)
  );
}

/**
 * Type-safe service implementations for XState v5
 */
export const services = {
  /**
   * Main WebSocket service implementation
   */
  webSocket: ({ context }: { context: WebSocketContext }) => ({
    init: ({ self }: { self: AnyActorRef }) => {
      let socket: WebSocket | null = null;
      let heartbeatInterval: NodeJS.Timeout | null = null;

      // Cleanup function to handle resource disposal
      const cleanup = () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        if (socket) {
          try {
            socket.close();
          } catch (error) {
            console.error("Error closing socket:", error);
          }
          socket = null;
        }
      };

      // Validate URL before attempting connection
      const urlValidation = validateUrl(context.url || "");
      if (!urlValidation.isValid) {
        self.send({
          type: "ERROR",
          error: new ApplicationError(
            urlValidation.reason || "Invalid WebSocket URL",
            ErrorCode.WEBSOCKET_INVALID_URL,
            StatusCode.BAD_REQUEST,
            { url: context.url }
          ),
          timestamp: Date.now(),
        });
        return cleanup;
      }

      // Initialize WebSocket connection
      try {
        socket = new WebSocket(
          context.url!,
          context.options.protocols
            ? Array.from(context.options.protocols)
            : undefined
        );

        // Configure connection timeout
        const connectionTimeout = setTimeout(() => {
          if (socket?.readyState !== WebSocket.OPEN) {
            self.send({
              type: "ERROR",
              error: new ApplicationError(
                "Connection timeout",
                ErrorCode.WEBSOCKET_TIMEOUT,
                StatusCode.GATEWAY_TIMEOUT,
                { url: context.url }
              ),
              timestamp: Date.now(),
            });
            cleanup();
          }
        }, context.options.connectionTimeout || 10000);

        // WebSocket event handlers
        socket.onopen = () => {
          clearTimeout(connectionTimeout);
          self.send({ type: "OPEN", timestamp: Date.now() });

          // Setup heartbeat if configured
          if (context.options.heartbeatInterval) {
            heartbeatInterval = setInterval(() => {
              if (socket?.readyState === WebSocket.OPEN) {
                socket.send("ping");
              }
            }, context.options.heartbeatInterval);
          }
        };

        socket.onmessage = (event) => {
          // Skip processing of heartbeat messages
          if (event.data === "ping" || event.data === "pong") {
            return;
          }

          self.send({
            type: "MESSAGE",
            data: event.data,
            size: event.data.length,
            timestamp: Date.now(),
          });
        };

        socket.onerror = (error) => {
          self.send({
            type: "ERROR",
            error: new ApplicationError(
              "WebSocket error occurred",
              ErrorCode.WEBSOCKET_ERROR,
              StatusCode.INTERNAL_SERVER_ERROR,
              {
                error: error instanceof Error ? error.message : "Unknown error",
                url: context.url,
                readyState: socket?.readyState,
              }
            ),
            timestamp: Date.now(),
          });
        };

        socket.onclose = (event) => {
          const { errorCode, statusCode, recoverable } =
            mapTransitionCloseCodeToError(event.code);

          self.send({
            type: "CLOSE",
            code: event.code,
            reason: event.reason || "",
            wasClean: event.wasClean,
            timestamp: Date.now(),
          });

          if (!event.wasClean) {
            self.send({
              type: "ERROR",
              error: new ApplicationError(
                event.reason || `Connection closed with code ${event.code}`,
                errorCode,
                statusCode,
                {
                  code: event.code,
                  wasClean: event.wasClean,
                  recoverable,
                  url: context.url,
                }
              ),
              timestamp: Date.now(),
            });
          }

          cleanup();
        };
      } catch (error) {
        self.send({
          type: "ERROR",
          error: new ApplicationError(
            error instanceof Error
              ? error.message
              : "Failed to initialize WebSocket",
            ErrorCode.WEBSOCKET_ERROR,
            StatusCode.INTERNAL_SERVER_ERROR,
            { error, url: context.url }
          ),
          timestamp: Date.now(),
        });
        cleanup();
      }

      // Return cleanup function
      return cleanup;
    },

    /**
     * Handle machine events
     */
    update: ({ event }: { event: WebSocketEvent }) => {
      if (
        event.type === "SEND" &&
        context.socket?.readyState === WebSocket.OPEN
      ) {
        if (!isValidMessageData(event.data)) {
          return {
            type: "ERROR",
            error: new ApplicationError(
              "Invalid message data type",
              ErrorCode.WEBSOCKET_INVALID_DATA,
              StatusCode.UNPROCESSABLE_ENTITY,
              { dataType: typeof event.data }
            ),
            timestamp: Date.now(),
          };
        }

        try {
          context.socket.send(event.data);
        } catch (error) {
          return {
            type: "ERROR",
            error: new ApplicationError(
              "Failed to send message",
              ErrorCode.WEBSOCKET_SEND_FAILED,
              StatusCode.INTERNAL_SERVER_ERROR,
              { error, data: event.data }
            ),
            timestamp: Date.now(),
          };
        }
      }
    },
  }),

  /**
   * Health check service implementation
   */
  healthCheck: ({ context }: { context: WebSocketContext }) => ({
    init: ({ self }: { self: AnyActorRef }) => {
      const checkHealth = () => {
        if (!context.socket || context.socket.readyState !== WebSocket.OPEN) {
          self.send({
            type: "ERROR",
            error: new ApplicationError(
              "Health check failed - socket not connected",
              ErrorCode.WEBSOCKET_NOT_CONNECTED,
              StatusCode.SERVICE_UNAVAILABLE,
              { readyState: context.socket?.readyState }
            ),
            timestamp: Date.now(),
          });
          return;
        }

        try {
          context.socket.send("ping");
          self.send({ type: "HEALTH_OK", timestamp: Date.now() });
        } catch (error) {
          self.send({
            type: "ERROR",
            error: new ApplicationError(
              "Health check failed",
              ErrorCode.WEBSOCKET_ERROR,
              StatusCode.SERVICE_UNAVAILABLE,
              { error }
            ),
            timestamp: Date.now(),
          });
        }
      };

      // Initial check
      checkHealth();

      // Setup interval if configured
      const interval = context.options.healthCheckInterval;
      if (interval) {
        const timer = setInterval(checkHealth, interval);
        return () => clearInterval(timer);
      }

      return () => {};
    },
  }),
} as const;
