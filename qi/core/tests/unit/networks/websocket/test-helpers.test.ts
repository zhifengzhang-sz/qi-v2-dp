/**
 * @fileoverview
 * @module test-helpers.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-25
 * @modified 2024-12-25
 */

import { describe, test, expect, vi } from "vitest";
import { createTestContext, MockWebSocket } from "./test-helpers";
import { BASE_CONFIG } from "@qi/core/networks/websocket/machine/constants";

describe("MockWebSocket", () => {
  test("initializes with correct state", () => {
    const ws = new MockWebSocket("ws://localhost:8080");
    expect(ws.url).toBe("ws://localhost:8080");
    expect(ws.readyState).toBe(MockWebSocket.CONNECTING);
    expect(ws.binaryType).toBe("blob");
  });

  test("handles event listeners correctly", () => {
    const ws = new MockWebSocket("ws://localhost:8080");
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const onMessage = vi.fn();
    const onError = vi.fn();

    ws.addEventListener("open", onOpen);
    ws.addEventListener("close", onClose);
    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", onError);

    ws.mockEmitOpen();
    expect(onOpen).toHaveBeenCalledWith(expect.any(Event));

    ws.mockEmitClose(1000, "Normal");
    expect(onClose).toHaveBeenCalledWith(expect.any(CloseEvent));

    ws.mockEmitMessage("test");
    expect(onMessage).toHaveBeenCalledWith(expect.any(MessageEvent));

    ws.mockEmitError(new Error("test"));
    expect(onError).toHaveBeenCalledWith(expect.any(ErrorEvent));
  });

  test("removes event listeners correctly", () => {
    const ws = new MockWebSocket("ws://localhost:8080");
    const listener = vi.fn();

    ws.addEventListener("open", listener);
    ws.removeEventListener("open", listener);
    ws.mockEmitOpen();

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("createTestContext", () => {
  test("creates valid context with required properties", () => {
    const context = createTestContext();

    expect(context).toHaveProperty("url");
    expect(context).toHaveProperty("status");
    expect(context).toHaveProperty("socket");
    expect(context).toHaveProperty("options");
    expect(context).toHaveProperty("metrics");
    expect(context).toHaveProperty("queue");
    expect(context).toHaveProperty("reconnectAttempts");
  });

  test("allows partial overrides", () => {
    const context = createTestContext({
      url: "ws://test.com",
      reconnectAttempts: 2,
    });

    expect(context.url).toBe("ws://test.com");
    expect(context.reconnectAttempts).toBe(2);
  });

  test("enforces type-safety on properties", () => {
    const context = createTestContext();

    // These should fail at compile time
    // @ts-expect-error - Cannot assign to readonly property
    context.options.reconnect = false;
    // @ts-expect-error - Cannot assign to readonly property
    context.url = "new-url";

    // Values should match BASE_CONFIG
    expect(context.options).toEqual(BASE_CONFIG);
  });

  test("initializes with correct queue state", () => {
    const context = createTestContext();

    expect(context.queue).toEqual({
      messages: [],
      pending: false,
      droppedMessages: 0,
    });
  });
});
