/**
 * @fileoverview WebSocket state machine states
 * @module @qi/core/network/websocket/states
 */

import { CONNECTION_STATES } from "./constants.js";

export const states = {
  [CONNECTION_STATES.DISCONNECTED]: {
    on: {
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: "prepareConnection",
      },
    },
  },

  [CONNECTION_STATES.CONNECTING]: {
    invoke: {
      src: "webSocketService",
      onError: {
        target: CONNECTION_STATES.RECONNECTING,
        actions: "handleError",
      },
    },
    on: {
      OPEN: {
        target: CONNECTION_STATES.CONNECTED,
        actions: "handleOpen",
      },
      ERROR: {
        target: CONNECTION_STATES.RECONNECTING,
        guard: "canReconnect",
        actions: "handleError",
      },
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["handleClose", "cleanup"],
      },
    },
  },

  [CONNECTION_STATES.CONNECTED]: {
    invoke: {
      src: "pingService",
    },
    on: {
      SEND: {
        guard: "canSendMessage", // Changed from array to single guard
        actions: "enqueueMessage",
      },
      MESSAGE: {
        actions: "handleMessage",
      },
      ERROR: {
        target: CONNECTION_STATES.RECONNECTING,
        guard: "canReconnect",
        actions: "handleError",
      },
      CLOSE: {
        target: CONNECTION_STATES.RECONNECTING,
        guard: "canReconnect",
        actions: "handleClose",
      },
      DISCONNECT: {
        target: CONNECTION_STATES.DISCONNECTING,
      },
    },
  },

  [CONNECTION_STATES.RECONNECTING]: {
    on: {
      RETRY: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canReconnect",
      },
      CONNECT: {
        target: CONNECTION_STATES.CONNECTING,
        guard: "canInitiateConnection",
        actions: "prepareConnection",
      },
    },
  },

  [CONNECTION_STATES.DISCONNECTING]: {
    on: {
      CLOSE: {
        target: CONNECTION_STATES.DISCONNECTED,
        actions: ["handleClose", "cleanup"],
      },
    },
  },
} as const;
