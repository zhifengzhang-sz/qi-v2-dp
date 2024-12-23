# Project Source Code Documentation

## machine

### constants.ts

```typescript
/**
 * @fileoverview WebSocket constants and configuration
 * @module @qi/core/network/websocket/constants
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-23
 */

/**
 * Core WebSocket states
 */
export const STATES = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  DISCONNECTING: "disconnecting",
  TERMINATED: "terminated",
} as const;

/**
 * Core WebSocket events
 */
export const EVENTS = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  OPEN: "OPEN",
  CLOSE: "CLOSE",
  ERROR: "ERROR",
  MESSAGE: "MESSAGE",
  SEND: "SEND",
  RETRY: "RETRY",
  MAX_RETRIES: "MAX_RETRIES",
  TERMINATE: "TERMINATE",
} as const;

/**
 * Basic configuration defaults
 */
export const BASE_CONFIG = {
  reconnect: true,
  maxReconnectAttempts: 5,
  reconnectInterval: 1000,
  messageQueueSize: 100,
  maxLatencyHistory: 50,
  maxEventHistory: 100,
  maxStateHistory: 200,
} as const;

/**
 * WebSocket close codes
 */
export const CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  INVALID_DATA: 1003,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  INTERNAL_ERROR: 1011,
  CONNECTION_FAILED: 1006, // Add abnormal closure code
} as const;

```

### errors.ts

```typescript
/**
 * @fileoverview Basic WebSocket error definitions
 * @module @qi/core/network/websocket/errors
 */

/**
 * Basic error codes
 */
export const ERROR_CODES = {
  CONNECTION_FAILED: "CONNECTION_FAILED",
  MESSAGE_FAILED: "MESSAGE_FAILED",
  TIMEOUT: "TIMEOUT",
  INVALID_STATE: "INVALID_STATE",
  PROTOCOL_ERROR: "PROTOCOL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Basic error context
 */
export interface ErrorContext {
  readonly code: ErrorCode;
  readonly timestamp: number;
  readonly message: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * WebSocket base error
 */
export class WebSocketError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly context: ErrorContext
  ) {
    super(message);
    this.name = "WebSocketError";
  }
}

```

### states.ts

```typescript
/**
 * @fileoverview Enhanced WebSocket state definitions
 * @module @qi/core/network/websocket/states
 */

import { WebSocketContext, State, WebSocketEvent } from "./types.js";

/**
 * Enhanced state metadata
 */
export interface StateMetadata {
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly timeoutMs?: number;
  readonly maxDurationMs?: number;
  readonly retryable: boolean;
}

/**
 * Enhanced state definition
 */
export interface StateDefinition {
  readonly name: State;
  readonly allowedEvents: ReadonlySet<WebSocketEvent["type"]>;
  readonly invariants: ReadonlyArray<{
    readonly check: (context: WebSocketContext) => boolean;
    readonly description: string;
  }>;
  readonly metadata: StateMetadata;
  readonly onEnter?: (context: WebSocketContext) => WebSocketContext;
  readonly onExit?: (context: WebSocketContext) => WebSocketContext;
}

/**
 * Enhanced state definitions with metadata and multiple invariants
 */
export const states: Record<State, StateDefinition> = {
  disconnected: {
    name: "disconnected",
    allowedEvents: new Set(["CONNECT"]),
    invariants: [
      {
        check: (ctx) => ctx.socket === null,
        description: "Socket must be null in disconnected state",
      },
      {
        check: (ctx) => ctx.messageFlags.isProcessing === false,
        description: "No message processing should be active",
      },
      {
        check: (ctx) => ctx.retryCount === 0,
        description: "Retry count should be reset",
      },
    ],
    metadata: {
      description: "WebSocket is disconnected and ready for new connection",
      tags: ["idle", "ready", "stable"],
      retryable: true,
    },
  },
  connecting: {
    name: "connecting",
    allowedEvents: new Set(["OPEN", "ERROR", "CLOSE"]),
    invariants: [
      {
        check: (ctx) => ctx.socket !== null,
        description: "Socket must be non-null while connecting",
      },
      {
        check: (ctx) => ctx.url !== null,
        description: "URL must be set while connecting",
      },
      {
        check: (ctx) => ctx.retryCount <= ctx.options.maxReconnectAttempts,
        description: "Must not exceed max retry attempts",
      },
    ],
    metadata: {
      description: "WebSocket is attempting to establish connection",
      tags: ["transitional", "active"],
      timeoutMs: 30000,
      retryable: true,
    },
  },
  connected: {
    name: "connected",
    allowedEvents: new Set(["DISCONNECT", "MESSAGE", "SEND", "ERROR", "CLOSE"]),
    invariants: [
      {
        check: (ctx) => ctx.socket !== null,
        description: "Socket must be non-null while connected",
      },
      {
        check: (ctx) => ctx.url !== null,
        description: "URL must be set while connected",
      },
      {
        check: (ctx) => ctx.timing.connectEnd !== null,
        description: "Connection end time must be set",
      },
      {
        check: (ctx) => ctx.error === null,
        description: "No errors should be present in connected state",
      },
    ],
    metadata: {
      description: "WebSocket connection is established and active",
      tags: ["stable", "active", "ready"],
      retryable: true,
    },
  },
  reconnecting: {
    name: "reconnecting",
    allowedEvents: new Set(["RETRY", "MAX_RETRIES"]),
    invariants: [
      {
        check: (ctx) => ctx.socket === null,
        description: "Socket must be null while reconnecting",
      },
      {
        check: (ctx) => ctx.url !== null,
        description: "URL must be present for reconnection",
      },
      {
        check: (ctx) => ctx.retryCount <= ctx.options.maxReconnectAttempts,
        description: "Must not exceed max retry attempts",
      },
      {
        check: (ctx) => ctx.backoffDelay > 0,
        description: "Must have positive backoff delay",
      },
    ],
    metadata: {
      description: "WebSocket is attempting to reconnect after failure",
      tags: ["transitional", "recovery"],
      timeoutMs: 5000,
      retryable: true,
    },
  },
  disconnecting: {
    name: "disconnecting",
    allowedEvents: new Set(["CLOSE"]),
    invariants: [
      {
        check: (ctx) => ctx.socket !== null,
        description: "Socket must be non-null while disconnecting",
      },
      {
        check: (ctx) => !ctx.messageFlags.isProcessing,
        description: "No message processing should be active",
      },
    ],
    metadata: {
      description: "WebSocket is in the process of disconnecting",
      tags: ["transitional", "cleanup"],
      timeoutMs: 5000,
      retryable: false,
    },
  },
  terminated: {
    name: "terminated",
    allowedEvents: new Set([]),
    invariants: [
      {
        check: (ctx) => ctx.socket === null,
        description: "Socket must be null in terminated state",
      },
      {
        check: (ctx) => !ctx.messageFlags.isProcessing,
        description: "No message processing should be active",
      },
      {
        check: (ctx) => ctx.messageFlags.processingHistory.length === 0,
        description: "Processing history should be clear",
      },
    ],
    metadata: {
      description: "WebSocket connection is permanently terminated",
      tags: ["final", "terminal"],
      retryable: false,
    },
  },
};

/**
 * Enhanced state validation
 */
export function validateState(
  state: State,
  context: WebSocketContext
): { isValid: boolean; failures: string[] } {
  const stateDefinition = states[state];
  const failures: string[] = [];

  stateDefinition.invariants.forEach((invariant) => {
    if (!invariant.check(context)) {
      failures.push(invariant.description);
    }
  });

  return {
    isValid: failures.length === 0,
    failures,
  };
}

/**
 * Event validation with detailed feedback
 */
export function validateEvent(
  state: State,
  event: WebSocketEvent,
  context: WebSocketContext
): { isValid: boolean; reason?: string } {
  const stateDefinition = states[state];

  // Check if event is allowed in current state
  if (!stateDefinition.allowedEvents.has(event.type)) {
    return {
      isValid: false,
      reason: `Event ${event.type} is not allowed in state ${state}`,
    };
  }

  // Check rate limiting for message events
  if (event.type === "MESSAGE" || event.type === "SEND") {
    const isRateLimited = context.rateLimit.count >= context.rateLimit.maxBurst;
    if (isRateLimited) {
      return {
        isValid: false,
        reason: "Rate limit exceeded",
      };
    }
  }

  return { isValid: true };
}

/**
 * Get state metadata
 */
export function getStateMetadata(state: State): StateMetadata {
  return states[state].metadata;
}

/**
 * Check if state is retriable
 */
export function isStateRetriable(state: State): boolean {
  return states[state].metadata.retryable;
}

/**
 * Check if state has timeout
 */
export function getStateTimeout(state: State): number | undefined {
  return states[state].metadata.timeoutMs;
}

/**
 * Get state tags
 */
export function getStateTags(state: State): ReadonlyArray<string> {
  return states[state].metadata.tags;
}

```

### transitions.ts

```typescript
/**
 * @fileoverview Enhanced state transitions and validations
 * @module @qi/core/network/websocket/transitions
 */

import { State, WebSocketContext, WebSocketEvent } from "./types.js";
import { CLOSE_CODES } from "./constants.js";
import { ErrorCode, ERROR_CODES, ErrorContext } from "./errors.js";
import { validateState } from "./states.js";

// Enhanced transition types
type EventType = WebSocketEvent["type"];
type TransitionConfig = Partial<Record<EventType, State>>;
type TransitionMap = Record<State, TransitionConfig>;

/**
 * Enhanced transition metadata
 */
export interface TransitionMetadata {
  readonly description: string;
  readonly guards: ReadonlyArray<string>;
  readonly actions: ReadonlyArray<string>;
  readonly timeout?: number;
  readonly retryable: boolean;
  readonly clearErrors: boolean;
}

export type TransitionMetaMap = Record<
  State,
  Partial<Record<EventType, TransitionMetadata>>
>;

/**
 * Enhanced transition history entry
 */
export interface TransitionHistoryEntry {
  readonly from: State;
  readonly to: State;
  readonly event: EventType;
  readonly timestamp: number;
  readonly duration?: number;
  readonly success: boolean;
  readonly error?: ErrorContext;
}

/**
 * Core transition map
 */
export const transitions: TransitionMap = {
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
 * Enhanced transition metadata
 */
export const transitionMeta: TransitionMetaMap = {
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
  },
  disconnecting: {
    CLOSE: {
      description: "Cleanup connection",
      guards: [],
      actions: ["cleanup", "logTransition"],
      retryable: false,
      clearErrors: true,
    },
  },
  terminated: {},
} as const;

/**
 * Enhanced transition validation
 */
export function validateTransition(
  from: State,
  event: WebSocketEvent,
  to: State,
  context: WebSocketContext
): { isValid: boolean; reason?: string } {
  // Check basic transition existence
  const allowedState = transitions[from]?.[event.type];
  if (!allowedState || allowedState !== to) {
    return {
      isValid: false,
      reason: `Invalid transition from ${from} to ${to} on ${event.type}`,
    };
  }

  // Check state invariants
  const stateValidation = validateState(to, context);
  if (!stateValidation.isValid) {
    return {
      isValid: false,
      reason: `State invariants failed: ${stateValidation.failures.join(", ")}`,
    };
  }

  // Check transition metadata guards
  const meta = transitionMeta[from]?.[event.type];
  if (meta?.guards.length) {
    // Note: Actual guard checking would be done in Layer 4
    // Here we just validate the structure
    if (!meta.guards.every((guard) => typeof guard === "string")) {
      return {
        isValid: false,
        reason: "Invalid guard configuration",
      };
    }
  }

  // Check special conditions based on event type
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
    case "CLOSE":
      if (context.socket === null) {
        return {
          isValid: false,
          reason: "No socket to close",
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Map close codes to error codes with enhanced validation
 */
export function mapCloseCodeToError(code: number): {
  errorCode: ErrorCode;
  recoverable: boolean;
} {
  const closeCodeMap: Record<
    number,
    { errorCode: ErrorCode; recoverable: boolean }
  > = {
    [CLOSE_CODES.GOING_AWAY]: {
      errorCode: ERROR_CODES.CONNECTION_FAILED,
      recoverable: true,
    },
    [CLOSE_CODES.CONNECTION_FAILED]: {
      errorCode: ERROR_CODES.CONNECTION_FAILED,
      recoverable: true,
    },
    [CLOSE_CODES.MESSAGE_TOO_BIG]: {
      errorCode: ERROR_CODES.MESSAGE_FAILED,
      recoverable: true,
    },
    [CLOSE_CODES.PROTOCOL_ERROR]: {
      errorCode: ERROR_CODES.PROTOCOL_ERROR,
      recoverable: false,
    },
    [CLOSE_CODES.INVALID_DATA]: {
      errorCode: ERROR_CODES.PROTOCOL_ERROR,
      recoverable: false,
    },
    [CLOSE_CODES.POLICY_VIOLATION]: {
      errorCode: ERROR_CODES.PROTOCOL_ERROR,
      recoverable: false,
    },
    [CLOSE_CODES.INTERNAL_ERROR]: {
      errorCode: ERROR_CODES.INVALID_STATE,
      recoverable: true,
    },
  };

  return (
    closeCodeMap[code] ?? {
      errorCode: ERROR_CODES.INVALID_STATE,
      recoverable: true,
    }
  );
}

/**
 * Get available transitions for a state
 */
export function getAvailableTransitions(state: State): ReadonlyArray<{
  event: EventType;
  targetState: State;
  metadata: TransitionMetadata;
}> {
  const stateTransitions = transitions[state];
  return Object.entries(stateTransitions).map(([event, targetState]) => ({
    event: event as EventType,
    targetState,
    metadata: transitionMeta[state][event as EventType]!,
  }));
}

/**
 * Check if transition is retryable
 */
export function isTransitionRetryable(from: State, event: EventType): boolean {
  return transitionMeta[from]?.[event]?.retryable ?? false;
}

/**
 * Get transition timeout
 */
export function getTransitionTimeout(
  from: State,
  event: EventType
): number | undefined {
  return transitionMeta[from]?.[event]?.timeout;
}

/**
 * Get required guards for transition
 */
export function getTransitionGuards(
  from: State,
  event: EventType
): ReadonlyArray<string> {
  return transitionMeta[from]?.[event]?.guards ?? [];
}

/**
 * Get required actions for transition
 */
export function getTransitionActions(
  from: State,
  event: EventType
): ReadonlyArray<string> {
  return transitionMeta[from]?.[event]?.actions ?? [];
}

```

### types.ts

```typescript
/**
 * @fileoverview Core WebSocket types with enhanced state tracking
 * @module @qi/core/network/websocket/types
 */

import { STATES } from "./constants.js";
import { ErrorContext } from "./errors.js";

/**
 * Core state type
 */
export type State = (typeof STATES)[keyof typeof STATES];

/**
 * Base event with timing
 */
export interface BaseEvent {
  readonly timestamp: number;
  readonly id?: string;
}

/**
 * Enhanced WebSocket events
 */
export type WebSocketEvent =
  | ({ type: "CONNECT"; url: string } & BaseEvent)
  | ({ type: "DISCONNECT"; code?: number; reason?: string } & BaseEvent)
  | ({ type: "OPEN" } & BaseEvent)
  | ({
      type: "CLOSE";
      code: number;
      reason: string;
      wasClean: boolean;
    } & BaseEvent)
  | ({ type: "ERROR"; error: ErrorContext } & BaseEvent)
  | ({ type: "MESSAGE"; data: unknown; size?: number } & BaseEvent)
  | ({ type: "SEND"; data: unknown; size?: number } & BaseEvent)
  | ({ type: "RETRY"; attempt: number; delay: number } & BaseEvent)
  | ({ type: "MAX_RETRIES"; attempts: number } & BaseEvent)
  | ({ type: "TERMINATE"; code?: number; reason?: string } & BaseEvent);

/**
 * Enhanced timing metrics
 */
export interface Timing {
  readonly connectStart: number | null;
  readonly connectEnd: number | null;
  readonly lastMessageTime: number | null;
  readonly lastEventTime: number | null;
  readonly stateHistory: ReadonlyArray<{
    readonly state: State;
    readonly timestamp: number;
    readonly duration?: number;
  }>;
}

/**
 * Enhanced rate limiting
 */
export interface RateLimit {
  readonly count: number;
  readonly window: number;
  readonly lastReset: number;
  readonly maxBurst: number;
  readonly history: ReadonlyArray<{
    readonly timestamp: number;
    readonly count: number;
  }>;
}

/**
 * Enhanced metrics
 */
export interface Metrics {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly errors: ReadonlyArray<ErrorContext>;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly latency: ReadonlyArray<number>;
  readonly eventHistory: ReadonlyArray<{
    readonly type: WebSocketEvent["type"];
    readonly timestamp: number;
    readonly metadata?: Record<string, unknown>;
  }>;
}

/**
 * Enhanced options
 */
export interface Options {
  readonly reconnect: boolean;
  readonly maxReconnectAttempts: number;
  readonly reconnectInterval: number;
  readonly messageQueueSize: number;
  readonly maxLatencyHistory: number;
  readonly maxEventHistory: number;
  readonly maxStateHistory: number;
}

/**
 * Enhanced message processing flags
 */
export interface MessageProcessingFlags {
  readonly isProcessing: boolean;
  readonly lastProcessedMessageId: string | null;
  readonly processingHistory: ReadonlyArray<{
    readonly messageId: string;
    readonly startTime: number;
    readonly endTime?: number;
    readonly status: "success" | "error" | "timeout";
  }>;
}

/**
 * Enhanced queue state
 */
export interface QueueState {
  readonly messages: ReadonlyArray<string>;
  readonly pending: boolean;
  readonly droppedMessages: number;
}

/**
 * Enhanced WebSocket context
 */
export interface WebSocketContext {
  readonly url: string | null;
  readonly status: State;
  readonly socket: WebSocket | null;
  readonly error: ErrorContext | null;
  readonly options: Options;
  readonly metrics: Metrics;
  readonly timing: Timing;
  readonly rateLimit: RateLimit;
  readonly messageFlags: MessageProcessingFlags;
  readonly queue: QueueState;
  readonly reconnectAttempts: number;
  readonly backoffDelay: number;
  readonly retryCount: number; // Added property
}

/**
 * Enhanced machine types for XState v5
 */
export interface WebSocketMachineTypes {
  context: WebSocketContext;
  events: WebSocketEvent;
  guards: {
    canConnect: (context: WebSocketContext) => boolean;
    canRetry: (context: WebSocketContext) => boolean;
    isRateLimited: (context: WebSocketContext) => boolean;
    hasValidUrl: (context: WebSocketContext) => boolean;
  };
  actions: {
    initConnection: (context: WebSocketContext) => WebSocketContext;
    cleanupConnection: (context: WebSocketContext) => WebSocketContext;
    updateMetrics: (
      context: WebSocketContext,
      event: WebSocketEvent
    ) => WebSocketContext;
    handleError: (
      context: WebSocketContext,
      event: Extract<WebSocketEvent, { type: "ERROR" }>
    ) => WebSocketContext;
  };
  actors: {
    webSocketActor: {
      data: WebSocketContext;
    };
  };
}

/**
 * Type guards
 */
export function isWebSocketEvent(value: unknown): value is WebSocketEvent {
  if (
    !value ||
    typeof value !== "object" ||
    !("type" in value) ||
    !("timestamp" in value)
  ) {
    return false;
  }
  const event = value as Partial<WebSocketEvent>;
  return typeof event.type === "string" && typeof event.timestamp === "number";
}

```

### utils.ts

```typescript
/**
 * @fileoverview Enhanced pure utility functions
 * @module @qi/core/network/websocket/utils
 */

import {
  WebSocketContext,
  Options,
  WebSocketEvent,
  Metrics,
  RateLimit,
  Timing,
  MessageProcessingFlags,
  QueueState,
} from "./types.js";
import { ErrorCode, ErrorContext } from "./errors.js";
import { validateState } from "./states.js";
import { validateTransition } from "./transitions.js";

/**
 * Enhanced event validation with metadata
 */
export function validateEventPayload(event: WebSocketEvent): {
  isValid: boolean;
  reason?: string;
} {
  if (!event || typeof event !== "object") {
    return { isValid: false, reason: "Event must be an object" };
  }

  if (!("type" in event)) {
    return { isValid: false, reason: "Event must have a type" };
  }

  if (!("timestamp" in event)) {
    return { isValid: false, reason: "Event must have a timestamp" };
  }

  // Type-specific validations
  switch (event.type) {
    case "CONNECT":
      if (!event.url || typeof event.url !== "string") {
        return {
          isValid: false,
          reason: "CONNECT event must have a valid URL",
        };
      }
      break;

    case "MESSAGE":
    case "SEND":
      if (event.size !== undefined && typeof event.size !== "number") {
        return { isValid: false, reason: "Message size must be a number" };
      }
      break;

    case "RETRY":
      if (
        typeof event.attempt !== "number" ||
        typeof event.delay !== "number"
      ) {
        return {
          isValid: false,
          reason: "RETRY event must have valid attempt and delay",
        };
      }
      break;
  }

  return { isValid: true };
}

/**
 * Enhanced URL validation
 */
export function validateUrl(url: string): {
  isValid: boolean;
  reason?: string;
} {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      return {
        isValid: false,
        reason: "URL must use ws: or wss: protocol",
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      reason: "Invalid URL format",
    };
  }
}

/**
 * Create initial metrics
 */
function createInitialMetrics(): Metrics {
  return {
    messagesSent: 0,
    messagesReceived: 0,
    errors: [],
    bytesSent: 0,
    bytesReceived: 0,
    latency: [],
    eventHistory: [],
  };
}

/**
 * Create initial timing metrics
 */
function createInitialTiming(): Timing {
  return {
    connectStart: null,
    connectEnd: null,
    lastMessageTime: null,
    lastEventTime: null,
    stateHistory: [],
  };
}

/**
 * Create initial rate limit
 */
function createInitialRateLimit(): RateLimit {
  return {
    count: 0,
    window: 60000, // 1 minute default
    lastReset: Date.now(),
    maxBurst: 100,
    history: [],
  };
}

/**
 * Create initial message flags
 */
function createInitialMessageFlags(): MessageProcessingFlags {
  return {
    isProcessing: false,
    lastProcessedMessageId: null,
    processingHistory: [],
  };
}

/**
 * Create initial queue state
 */
function createInitialQueue(): QueueState {
  return {
    messages: [],
    pending: false,
    droppedMessages: 0,
  };
}

/**
 * Enhanced context creation
 */
export function createContext(options: Options): WebSocketContext {
  return {
    url: null,
    status: "disconnected",
    socket: null,
    error: null,
    options,
    metrics: createInitialMetrics(),
    timing: createInitialTiming(),
    rateLimit: createInitialRateLimit(),
    messageFlags: createInitialMessageFlags(),
    queue: createInitialQueue(),
    reconnectAttempts: 0,
    backoffDelay: options.reconnectInterval,
    retryCount: 0,
  };
}

/**
 * Enhanced context update with validation
 */
export function updateContext(
  context: WebSocketContext,
  updates: Partial<WebSocketContext>,
  event?: WebSocketEvent
): {
  context: WebSocketContext;
  isValid: boolean;
  reason?: string;
} {
  const newContext = { ...context, ...updates };

  // Validate state if it's being updated
  if (updates.status) {
    const stateValidation = validateState(updates.status, newContext);
    if (!stateValidation.isValid) {
      return {
        context,
        isValid: false,
        reason: `Invalid state: ${stateValidation.failures.join(", ")}`,
      };
    }
  }

  // Validate transition if event is provided
  if (event && updates.status) {
    const transitionValidation = validateTransition(
      context.status,
      event,
      updates.status,
      newContext
    );
    if (!transitionValidation.isValid) {
      return {
        context,
        isValid: false,
        reason: transitionValidation.reason,
      };
    }
  }

  // Update timing information
  const timing = { ...newContext.timing };
  if (updates.status !== context.status) {
    timing.stateHistory = [
      ...timing.stateHistory,
      {
        state: updates.status!,
        timestamp: Date.now(),
        duration: timing.lastEventTime
          ? Date.now() - timing.lastEventTime
          : undefined,
      },
    ];
  }

  return {
    context: { ...newContext, timing },
    isValid: true,
  };
}

/**
 * Update metrics with new event
 */
export function updateMetrics(
  context: WebSocketContext,
  event: WebSocketEvent,
  error?: ErrorContext
): WebSocketContext {
  const metrics = { ...context.metrics };

  // Update event history
  metrics.eventHistory = [
    ...metrics.eventHistory,
    {
      type: event.type,
      timestamp: event.timestamp,
      metadata: error ? { error } : undefined,
    },
  ];

  // Update error tracking
  if (error) {
    metrics.errors = [...metrics.errors, error];
  }

  // Update message counts and bytes
  if (event.type === "MESSAGE") {
    metrics.messagesReceived++;
    if ("size" in event) {
      metrics.bytesReceived += event.size ?? 0;
    }
  } else if (event.type === "SEND") {
    metrics.messagesSent++;
    if ("size" in event) {
      metrics.bytesSent += event.size ?? 0;
    }
  }

  return {
    ...context,
    metrics,
    timing: {
      ...context.timing,
      lastEventTime: event.timestamp,
    },
  };
}

/**
 * Update rate limiting context
 */
export function updateRateLimit(
  context: WebSocketContext,
  event: WebSocketEvent
): WebSocketContext {
  const now = event.timestamp; // Use event timestamp instead of Date.now()
  const windowEnd = context.rateLimit.lastReset + context.rateLimit.window;

  // Check if we need to reset the window based on event timestamp
  if (now > windowEnd) {
    return {
      ...context,
      rateLimit: {
        ...context.rateLimit,
        count: 1,
        lastReset: now,
        history: [
          {
            timestamp: now,
            count: 1,
          },
        ],
      },
    };
  }

  // For message events, increment the count
  if (event.type === "MESSAGE" || event.type === "SEND") {
    return {
      ...context,
      rateLimit: {
        ...context.rateLimit,
        count: context.rateLimit.count + 1,
        history: [
          ...context.rateLimit.history,
          {
            timestamp: now,
            count: context.rateLimit.count + 1,
          },
        ],
      },
    };
  }

  // For non-message events, return context unchanged
  return context;
}
/**
 * Calculate exponential backoff
 */
export function calculateBackoff(
  retryCount: number,
  baseInterval: number,
  maxInterval: number = 30000
): number {
  const delay = baseInterval * Math.pow(2, retryCount);
  return Math.min(delay, maxInterval);
}

/**
 * Format bytes for logging
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Create error context
 */
export function createErrorContext(
  code: ErrorCode,
  message: string,
  metadata?: Record<string, unknown>
): ErrorContext {
  return {
    code,
    timestamp: Date.now(),
    message,
    metadata,
  };
}

/**
 * Update message processing state
 */
export function updateMessageProcessing(
  context: WebSocketContext,
  messageId: string,
  status: "success" | "error" | "timeout"
): WebSocketContext {
  const now = Date.now();

  return {
    ...context,
    messageFlags: {
      ...context.messageFlags,
      isProcessing: false,
      lastProcessedMessageId: messageId,
      processingHistory: [
        ...context.messageFlags.processingHistory,
        {
          messageId,
          startTime: now,
          endTime: now,
          status,
        },
      ],
    },
  };
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimited(context: WebSocketContext): boolean {
  return context.rateLimit.count >= context.rateLimit.maxBurst;
}

/**
 * Get current connection state duration
 */
export function getCurrentStateDuration(context: WebSocketContext): number {
  const lastStateChange =
    context.timing.stateHistory[context.timing.stateHistory.length - 1];
  return lastStateChange ? Date.now() - lastStateChange.timestamp : 0;
}

/**
 * Check if reconnection is allowed
 */
export function canReconnect(context: WebSocketContext): boolean {
  return (
    context.options.reconnect &&
    context.retryCount < context.options.maxReconnectAttempts &&
    !isRateLimited(context)
  );
}

```

