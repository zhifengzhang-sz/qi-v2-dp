/**
 * @fileoverview WebSocket state type definitions
 * @module @qi/core/network/websocket/states
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-25
 */

import { State, EventType } from "./constants.js";
import { WebSocketContext } from "./types.js";

/**
 * State metadata
 */
export interface StateMetadata {
  readonly description: string;
  readonly tags: ReadonlyArray<string>;
  readonly timeoutMs?: number;
  readonly maxDurationMs?: number;
  readonly retryable: boolean;
}

/**
 * State invariant
 */
export interface StateInvariant {
  readonly check: (context: WebSocketContext) => boolean;
  readonly description: string;
}

/**
 * State definition
 */
export interface StateDefinition {
  readonly name: State;
  readonly allowedEvents: ReadonlySet<EventType>;
  readonly invariants: ReadonlyArray<StateInvariant>;
  readonly metadata: StateMetadata;
}

/**
 * State validation result
 */
export interface StateValidationResult {
  readonly isValid: boolean;
  readonly failures: ReadonlyArray<string>;
}

/**
 * State transition definition
 */
export interface StateTransition {
  readonly from: State;
  readonly to: State;
  readonly event: EventType;
  readonly metadata?: Record<string, unknown>;
}

/**
 * State transition validation result
 */
export interface TransitionValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

/**
 * State history entry
 */
export interface StateHistoryEntry {
  readonly state: State;
  readonly enteredAt: number;
  readonly exitedAt?: number;
  readonly duration?: number;
  readonly transitions: ReadonlyArray<StateTransition>;
}
