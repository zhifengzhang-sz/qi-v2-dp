/**
 * @fileoverview
 * @module machine.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-18
 */

import { createMachine } from "xstate";
import { actions } from "./actions.js";
import { guards } from "./guards.js";
import { services } from "./services.js";
import { states } from "./states.js";
import { INITIAL_CONTEXT, CONNECTION_STATES } from "./constants.js";
import type {
  WebSocketContext,
  WebSocketEvents,
  ConnectionOptions,
} from "./types.js";

const defaultContext: WebSocketContext = {
  ...INITIAL_CONTEXT,
  protocols: [],
  metrics: {
    ...INITIAL_CONTEXT.metrics,
    errors: [],
    messageTimestamps: [],
  },
  queue: {
    ...INITIAL_CONTEXT.queue,
    messages: [],
  }
} satisfies WebSocketContext;

export const webSocketMachine = createMachine({
  id: "webSocket",
  initial: CONNECTION_STATES.DISCONNECTED,
  context: defaultContext,
  states: {
    [CONNECTION_STATES.DISCONNECTED]: {
      on: {
        CONNECT: {
          target: CONNECTION_STATES.CONNECTING,
          guard: 'canInitiateConnection',
          actions: 'prepareConnection'
        }
      }
    },
    [CONNECTION_STATES.CONNECTING]: {
      invoke: {
        src: 'webSocketService',
        onError: {
          target: CONNECTION_STATES.RECONNECTING,
          actions: 'handleError'
        }
      },
      on: {
        OPEN: {
          target: CONNECTION_STATES.CONNECTED,
          actions: 'handleOpen'
        }
      }
    }
  }
} satisfies {
  context: WebSocketContext,
  events: WebSocketEvents
});

export function createWebSocketMachine(options?: Partial<ConnectionOptions>) {
  return createMachine({
    ...webSocketMachine.definition,
    context: {
      ...defaultContext,
      options: {
        ...defaultContext.options,
        ...options,
      },
    },
  }).provide({
    actions,
    guards,
    services,
  });
}

export const createWebSocketEvent = {
  connect: (url: string, protocols?: string[], options?: Partial<ConnectionOptions>) => ({
    type: "CONNECT",
    url,
    protocols,
    options,
  }),
  disconnect: (code?: number, reason?: string) => ({
    type: "DISCONNECT" as const,
    code,
    reason,
  }),
  send: (data: unknown, options?: { priority: "high" | "normal" }) => ({
    type: "SEND" as const,
    data,
    id: crypto.randomUUID(),
    options,
  }),
} as const;
