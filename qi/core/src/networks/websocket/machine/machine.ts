/**
 * @fileoverview
 * @module machine.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

// machine.ts
import { setup } from "xstate";
import type {
  WebSocketContext,
  WebSocketEvent,
  ConnectionOptions,
  ConnectEvent,
  SendEvent,
} from "./types.js";
import { DEFAULT_CONFIG } from "./constants.js";
import { actions } from "./actions.js";
import { guards } from "./guards.js";
import { WebSocketStates } from "./websocket-states.js";

/** Create immutable initial context */
const createInitialContext = (
  config: Partial<ConnectionOptions> = {}
): WebSocketContext => ({
  // Connection
  url: "",
  protocols: [],
  socket: null,
  status: "disconnected",
  readyState: WebSocket.CLOSED,
  options: {
    ...DEFAULT_CONFIG,
    ...config,
  },
  state: {
    connectionAttempts: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
    lastError: null,
    lastMessageTime: 0,
  },

  // Message Queue
  queue: {
    messages: [],
    pending: false,
    lastProcessed: 0,
  },
  messageQueueSize: DEFAULT_CONFIG.messageQueueSize,

  // Health Check
  pingInterval: config.pingInterval ?? DEFAULT_CONFIG.pingInterval,
  pongTimeout: config.pongTimeout ?? DEFAULT_CONFIG.pongTimeout,
  lastPingTime: 0,
  lastPongTime: 0,
  latency: [],

  // Metrics
  metrics: {
    messagesSent: 0,
    messagesReceived: 0,
    bytesReceived: 0,
    bytesSent: 0,
  },
  errors: [],

  // Rate Limiting
  messageCount: 0,
  windowStart: Date.now(),
  rateLimit: config.rateLimit ?? DEFAULT_CONFIG.rateLimit,
});

/** State machine definition */
export const createWebSocketMachine = (config?: Partial<ConnectionOptions>) => {
  // @xstate-layout N4IgpgJg5mDOIC5QBcD2FWwHQBUB0ANmAMQDKYAdgC4QB2...
  return setup({
    types: {} as {
      context: WebSocketContext;
      events: WebSocketEvent;
    },
    actors: {},
    guards: {
      canInitiateConnection: ({ context, event }) =>
        guards.canInitiateConnection(context, event as ConnectEvent),
      canReconnect: ({ context }) => guards.canReconnect(context),
      canSendMessage: ({ context, event }) =>
        guards.canSendMessage(context, event as SendEvent),
      isWithinRetryLimit: ({ context }) => guards.shouldReconnect(context),
    },
    actions: {
      establishConnection: ({ context, event }) =>
        actions.establishConnection(context, event as ConnectEvent),
      bindSocketEvents: ({ context }) => actions.bindSocketEvents(context),
      updateConnectionState: ({ context }) => {
        if (!context.socket) return;
        context.status =
          context.socket.readyState === WebSocketStates.OPEN
            ? "connected"
            : "disconnected";
        context.readyState = context.socket.readyState;
      },
      startHeartbeat: ({ context }) => {
        actions.sendPing(context);
      },
      recordError: ({ context, event }) => actions.recordError(context, event),
      incrementRetryCounter: ({ context }) =>
        actions.incrementRetryCounter(context),
      resetState: ({ context }) => actions.resetState(context),
      processQueue: ({ context }) => actions.processQueue(context),
      enqueueMessage: ({ context, event }) =>
        actions.enqueueMessage(context, event as SendEvent),
      handleMessage: ({ context, event }) =>
        actions.handleMessage(context, event),
      initiateClose: ({ context }) => actions.initiateClose(context),
      calculateBackoff: ({ context }) => actions.calculateBackoff(context),
    },
  }).createMachine({
    id: "webSocket",
    initial: "disconnected",
    context: createInitialContext(config),
    states: {
      disconnected: {
        on: {
          CONNECT: {
            target: "connecting",
            guard: { type: "canInitiateConnection" },
            actions: { type: "establishConnection" },
          },
        },
      },

      connecting: {
        entry: { type: "bindSocketEvents" },
        on: {
          OPEN: {
            target: "connected",
            actions: [
              { type: "updateConnectionState" },
              { type: "startHeartbeat" },
            ],
          },
          ERROR: [
            {
              target: "backingOff",
              guard: { type: "canReconnect" },
              actions: [
                { type: "recordError" },
                { type: "incrementRetryCounter" },
              ],
            },
            {
              target: "disconnected",
              actions: [{ type: "recordError" }, { type: "resetState" }],
            },
          ],
          CLOSE: {
            target: "disconnected",
            actions: { type: "resetState" },
          },
        },
      },

      connected: {
        entry: { type: "processQueue" },
        on: {
          SEND: {
            guard: { type: "canSendMessage" },
            actions: [{ type: "enqueueMessage" }, { type: "processQueue" }],
          },
          MESSAGE: {
            actions: { type: "handleMessage" },
          },
          ERROR: [
            {
              target: "backingOff",
              guard: { type: "canReconnect" },
              actions: [
                { type: "recordError" },
                { type: "incrementRetryCounter" },
              ],
            },
            {
              target: "disconnected",
              actions: [{ type: "recordError" }, { type: "resetState" }],
            },
          ],
          DISCONNECT: {
            target: "disconnecting",
            actions: { type: "initiateClose" },
          },
        },
      },

      disconnecting: {
        exit: { type: "resetState" },
        on: {
          CLOSE: {
            target: "disconnected",
          },
        },
      },

      backingOff: {
        after: {
          RECONNECT_DELAY: {
            target: "reconnecting",
            guard: { type: "isWithinRetryLimit" },
          },
        },
      },

      reconnecting: {
        entry: { type: "calculateBackoff" },
        on: {
          RETRY: {
            target: "connecting",
            guard: { type: "isWithinRetryLimit" },
            actions: { type: "establishConnection" },
          },
          MAX_RETRIES: {
            target: "disconnected",
            actions: { type: "resetState" },
          },
        },
      },
    },
  });
};

export default createWebSocketMachine;
