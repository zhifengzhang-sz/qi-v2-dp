/**
 * @fileoverview
 * @module machine.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-14
 * @modified 2024-12-14
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createActor } from "xstate";
import { createWebSocketMachine } from "../../../../src/networks/websocket/machine/machine.js";

// Mock WebSocket implementation
const mockSocket = vi.fn(() => ({
  readyState: 0,
  onopen: null,
  onclose: null,
  onerror: null,
  onmessage: null,
  close: vi.fn(),
  send: vi.fn(),
}));

describe("WebSocket Machine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("WebSocket", mockSocket);
  });

  it("should start in disconnected state", () => {
    const machine = createWebSocketMachine();
    const actor = createActor(machine);
    actor.start();

    expect(actor.getSnapshot().value).toBe("disconnected");
  });

  it("should transition to connecting state on CONNECT event", () => {
    const machine = createWebSocketMachine();
    const actor = createActor(machine);
    actor.start();

    actor.send({ type: "CONNECT", url: "ws://test", timestamp: Date.now() });
    expect(actor.getSnapshot().value).toBe("connecting");
  });

  // Add more test cases...
});
