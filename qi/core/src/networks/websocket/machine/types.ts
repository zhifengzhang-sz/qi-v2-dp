/**
 * @fileoverview Core WebSocket types with enhanced state tracking
 * @module @qi/core/network/websocket/types
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

import { State, EventType, BaseConfig, CloseCode } from "./constants.js";
import { ErrorContext } from "./errors.js";

/**
 * Base event with timing
 */
export interface BaseEvent {
  readonly timestamp: number;
  readonly id?: string;
}

/**
 * WebSocket events
 */
export type WebSocketEvent =
  | ({ type: "CONNECT"; url: string } & BaseEvent)
  | ({ type: "DISCONNECT"; code?: CloseCode; reason?: string } & BaseEvent)
  | ({ type: "OPEN" } & BaseEvent)
  | ({
      type: "CLOSE";
      code: CloseCode;
      reason: string;
      wasClean: boolean;
    } & BaseEvent)
  | ({ type: "ERROR"; error: ErrorContext } & BaseEvent)
  | ({ type: "MESSAGE"; data: unknown; size?: number } & BaseEvent)
  | ({ type: "SEND"; data: unknown; size?: number } & BaseEvent)
  | ({ type: "RETRY"; attempt: number; delay: number } & BaseEvent)
  | ({ type: "MAX_RETRIES"; attempts: number } & BaseEvent)
  | ({ type: "TERMINATE"; code?: CloseCode; reason?: string } & BaseEvent);

/**
 * Timing metrics
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
 * Rate limiting configuration
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
 * Connection metrics
 */
export interface Metrics {
  readonly messagesSent: number;
  readonly messagesReceived: number;
  readonly errors: ReadonlyArray<ErrorContext>;
  readonly bytesSent: number;
  readonly bytesReceived: number;
  readonly latency: ReadonlyArray<number>;
  readonly eventHistory: ReadonlyArray<{
    readonly type: EventType;
    readonly timestamp: number;
    readonly metadata?: Record<string, unknown>;
  }>;
}

/**
 * WebSocket configuration options
 */
export interface Options extends BaseConfig {
  readonly protocols?: ReadonlyArray<string>;
  readonly headers?: ReadonlyMap<string, string>;
  readonly connectionTimeout?: number;
  readonly heartbeatInterval?: number;
  readonly healthCheckInterval?: number;
}

/**
 * Message processing state
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
 * Message queue state
 */
export interface QueueState {
  readonly messages: ReadonlyArray<string>;
  readonly pending: boolean;
  readonly droppedMessages: number;
}

/**
 * WebSocket context
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
  readonly retryCount: number;
}

/**
 * Validation result types
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

export interface StateValidationResult extends ValidationResult {
  readonly failures: ReadonlyArray<string>;
}

export type TransitionValidationResult = ValidationResult;
