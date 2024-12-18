/**
 * @fileoverview
 * @module test-helpers.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-18
 * @modified 2024-12-18
 */

import { vi } from "vitest";
import type { AnyActorRef, Subscription } from "xstate";
import { WebSocketStates } from "../../../../src/networks/websocket/machine/websocket-states.js";

// Mock WebSocket implementation
export const createMockSocket = () => ({
  readyState: WebSocketStates.CONNECTING as number,
  onopen: null as ((event: Event) => void) | null,
  onclose: null as ((event: CloseEvent) => void) | null,
  onerror: null as ((error: Error) => void) | null,
  onmessage: null as ((event: MessageEvent) => void) | null,
  close: vi.fn(),
  send: vi.fn(),
});

// Helper to wait for state transitions
export const waitForState = async (
  actor: AnyActorRef,
  expectedState: string,
  timeout = 100
) => {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error(`Timeout waiting for state: ${expectedState}`));
    }, timeout);

    const subscription: Subscription = actor.subscribe((state: any) => {
      if (state.value === expectedState) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve();
      }
    });
  });
};
