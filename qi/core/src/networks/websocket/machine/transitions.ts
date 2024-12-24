/**
 * @fileoverview WebSocket state transition definitions and validation
 * @module @qi/core/network/websocket/transitions
 *
 * @author zhifengzhang-sz
 * @created 2024-12-22
 * @modified 2024-12-25
 */

import { State, EventType, CLOSE_CODES } from "./constants.js";
import { ErrorCode, StatusCode } from "@qi/core/errors";
import { WebSocketContext, WebSocketEvent, ValidationResult } from "./types.js";

/**
 * Core state transition map
 */
export const transitions: Readonly<
  Record<State, Partial<Record<EventType, State>>>
> = {
  disconnected: {
    CONNECT: "connecting",
    TERMINATE: "terminated",
  },
  connecting: {
    OPEN: "connected",
    ERROR: "reconnecting",
    CLOSE: "disconnected",
    TERMINATE: "terminated",
  },
  connected: {
    DISCONNECT: "disconnecting",
    ERROR: "reconnecting",
    CLOSE: "disconnected",
    TERMINATE: "terminated",
  },
  reconnecting: {
    RETRY: "connecting",
    MAX_RETRIES: "disconnected",
    TERMINATE: "terminated",
  },
  disconnecting: {
    CLOSE: "disconnected",
    TERMINATE: "terminated",
  },
  terminated: {},
} as const;

/**
 * Transition metadata type
 */
export interface TransitionMetadata {
  readonly description: string;
  readonly guards: ReadonlyArray<string>;
  readonly actions: ReadonlyArray<string>;
  readonly timeout?: number;
  readonly retryable: boolean;
  readonly clearErrors: boolean;
}

/**
 * Transition metadata map
 */
export const transitionMeta: Readonly<
  Record<State, Partial<Record<EventType, TransitionMetadata>>>
> = {
  disconnected: {
    CONNECT: {
      description: "Initiate connection",
      guards: ["canConnect", "hasValidUrl"],
      actions: ["initConnection", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Permanent termination",
      guards: [],
      actions: ["cleanupResources", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  connecting: {
    OPEN: {
      description: "Connection established",
      guards: ["isSocketValid"],
      actions: ["onConnected", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    ERROR: {
      description: "Connection failed",
      guards: ["canRetry"],
      actions: ["onError", "scheduleReconnect", "logTransition"],
      timeout: 5000,
      retryable: true,
      clearErrors: false,
    },
    CLOSE: {
      description: "Connection closed",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Force termination during connect",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  connected: {
    DISCONNECT: {
      description: "Initiate disconnect",
      guards: ["isSocketValid"],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
    ERROR: {
      description: "Connection error",
      guards: ["canRetry"],
      actions: ["onError", "scheduleReconnect", "logTransition"],
      timeout: 5000,
      retryable: true,
      clearErrors: false,
    },
    CLOSE: {
      description: "Connection closed",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: true,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Force termination while connected",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  reconnecting: {
    RETRY: {
      description: "Retry connection",
      guards: ["canRetry", "hasValidUrl"],
      actions: ["initConnection", "logTransition"],
      timeout: 30000,
      retryable: true,
      clearErrors: true,
    },
    MAX_RETRIES: {
      description: "Max retries reached",
      guards: [],
      actions: ["onMaxRetries", "logTransition"],
      retryable: false,
      clearErrors: false,
    },
    TERMINATE: {
      description: "Force termination during reconnect",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  disconnecting: {
    CLOSE: {
      description: "Cleanup connection",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
    TERMINATE: {
      description: "Force termination during disconnect",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  terminated: {},
} as const;

/**
 * Validate state transition
 */
export function validateTransition(
  from: State,
  event: WebSocketEvent,
  to: State,
  context: WebSocketContext
): ValidationResult {
  // Check if transition exists
  const allowedState = transitions[from]?.[event.type];
  if (!allowedState || allowedState !== to) {
    return {
      isValid: false,
      reason: `Invalid transition from ${from} to ${to} on ${event.type}`,
    };
  }

  // Special conditions based on event type
  switch (event.type) {
    case "RETRY":
      if (context.retryCount >= context.options.maxReconnectAttempts) {
        return {
          isValid: false,
          reason: "Maximum retry attempts exceeded",
        };
      }
      break;
    case "CONNECT":
      if (context.socket !== null) {
        return {
          isValid: false,
          reason: "Socket already exists",
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Maps WebSocket close codes to error codes and status codes
 */
export function mapTransitionCloseCodeToError(code: number): {
  errorCode: ErrorCode;
  statusCode: StatusCode;
  recoverable: boolean;
} {
  const closeCodeMap: Record<
    number,
    { errorCode: ErrorCode; statusCode: StatusCode; recoverable: boolean }
  > = {
    [CLOSE_CODES.NORMAL_CLOSURE]: {
      errorCode: ErrorCode.WEBSOCKET_CLOSED,
      statusCode: StatusCode.OK,
      recoverable: false,
    },
    [CLOSE_CODES.GOING_AWAY]: {
      errorCode: ErrorCode.WEBSOCKET_DISCONNECT,
      statusCode: StatusCode.SERVICE_UNAVAILABLE,
      recoverable: true,
    },
    [CLOSE_CODES.PROTOCOL_ERROR]: {
      errorCode: ErrorCode.WEBSOCKET_PROTOCOL,
      statusCode: StatusCode.BAD_REQUEST,
      recoverable: false,
    },
    [CLOSE_CODES.INVALID_DATA]: {
      errorCode: ErrorCode.WEBSOCKET_INVALID_DATA,
      statusCode: StatusCode.UNPROCESSABLE_ENTITY,
      recoverable: false,
    },
    [CLOSE_CODES.POLICY_VIOLATION]: {
      errorCode: ErrorCode.WEBSOCKET_POLICY,
      statusCode: StatusCode.FORBIDDEN,
      recoverable: false,
    },
    [CLOSE_CODES.MESSAGE_TOO_BIG]: {
      errorCode: ErrorCode.WEBSOCKET_MESSAGE_SIZE,
      statusCode: StatusCode.BAD_REQUEST,
      recoverable: true,
    },
    [CLOSE_CODES.INTERNAL_ERROR]: {
      errorCode: ErrorCode.WEBSOCKET_INTERNAL,
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      recoverable: true,
    },
    [CLOSE_CODES.CONNECTION_FAILED]: {
      errorCode: ErrorCode.WEBSOCKET_ABNORMAL,
      statusCode: StatusCode.BAD_GATEWAY,
      recoverable: true,
    },
  };

  return (
    closeCodeMap[code] ?? {
      errorCode: ErrorCode.WEBSOCKET_ERROR,
      statusCode: StatusCode.INTERNAL_SERVER_ERROR,
      recoverable: true,
    }
  );
}

/**
 * Get available transitions for a state
 */
export function getAvailableTransitions(state: State): ReadonlyArray<{
  readonly event: EventType;
  readonly targetState: State;
  readonly metadata: TransitionMetadata;
}> {
  const stateTransitions = transitions[state];
  return Object.entries(stateTransitions).map(([event, targetState]) => ({
    event: event as EventType,
    targetState,
    metadata: transitionMeta[state][event as EventType]!,
  }));
}
