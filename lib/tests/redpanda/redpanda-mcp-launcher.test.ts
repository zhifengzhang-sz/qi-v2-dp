import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
// lib/tests/redpanda/redpanda-mcp-launcher.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfficialRedpandaMCPLauncher } from "../../src/redpanda/redpanda-mcp-launcher";

// Mock child_process
vi.mock("node:child_process", () => ({
  spawn: vi.fn(),
}));

// Mock RedpandaConfigManager
vi.mock("../../src/redpanda/redpanda-config", () => ({
  RedpandaConfigManager: {
    getInstance: () => ({
      getMCPConfig: () => ({
        command: "rpk",
        args: ["mcp", "server", "--brokers", "localhost:9092"],
        environment: {
          REDPANDA_BROKERS: "localhost:9092",
          RPK_MCP_LOG_LEVEL: "info",
          RPK_MCP_CLIENT_ID: "test-client",
        },
      }),
    }),
  },
}));

class MockChildProcess extends EventEmitter {
  pid = 12345;
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill = vi.fn();
}

describe("OfficialRedpandaMCPLauncher", () => {
  let launcher: OfficialRedpandaMCPLauncher;
  let mockProcess: MockChildProcess;

  beforeEach(() => {
    launcher = new OfficialRedpandaMCPLauncher();
    mockProcess = new MockChildProcess();
    vi.mocked(spawn).mockReturnValue(mockProcess as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("start", () => {
    it("should start MCP server successfully", async () => {
      const startPromise = launcher.start();

      // Simulate rpk version check success
      setTimeout(() => {
        const versionProcess = new MockChildProcess();
        vi.mocked(spawn).mockReturnValueOnce(versionProcess as any);
        setTimeout(() => versionProcess.emit("exit", 0), 10);
      }, 100);

      await startPromise;

      expect(spawn).toHaveBeenCalledWith("rpk", ["mcp", "server", "--brokers", "localhost:9092"], {
        env: expect.objectContaining({
          REDPANDA_BROKERS: "localhost:9092",
          RPK_MCP_LOG_LEVEL: "info",
          RPK_MCP_CLIENT_ID: "test-client",
        }),
        stdio: ["pipe", "pipe", "pipe"],
      });

      const status = launcher.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.pid).toBe(12345);
    });

    it("should not start if already running", async () => {
      // First start
      const startPromise1 = launcher.start();
      setTimeout(() => {
        const versionProcess = new MockChildProcess();
        vi.mocked(spawn).mockReturnValueOnce(versionProcess as any);
        setTimeout(() => versionProcess.emit("exit", 0), 10);
      }, 100);
      await startPromise1;

      // Second start attempt
      await launcher.start();

      // spawn should only be called twice (once for main process, once for version check)
      expect(spawn).toHaveBeenCalledTimes(2);
    });

    it("should handle rpk version check failure", async () => {
      const startPromise = launcher.start();

      setTimeout(() => {
        const versionProcess = new MockChildProcess();
        vi.mocked(spawn).mockReturnValueOnce(versionProcess as any);
        setTimeout(() => versionProcess.emit("exit", 1), 10);
      }, 100);

      await expect(startPromise).rejects.toThrow("rpk not available");
    });

    it("should handle process error", async () => {
      const _startPromise = launcher.start();

      setTimeout(() => {
        mockProcess.emit("error", new Error("Process failed"));
      }, 100);

      const status = launcher.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it("should handle process exit", async () => {
      const startPromise = launcher.start();

      setTimeout(() => {
        const versionProcess = new MockChildProcess();
        vi.mocked(spawn).mockReturnValueOnce(versionProcess as any);
        setTimeout(() => versionProcess.emit("exit", 0), 10);
      }, 100);

      await startPromise;

      // Simulate process exit
      mockProcess.emit("exit", 0);

      const status = launcher.getStatus();
      expect(status.isRunning).toBe(false);
    });
  });

  describe("stop", () => {
    it("should stop running process gracefully", async () => {
      // Start first
      const startPromise = launcher.start();
      setTimeout(() => {
        const versionProcess = new MockChildProcess();
        vi.mocked(spawn).mockReturnValueOnce(versionProcess as any);
        setTimeout(() => versionProcess.emit("exit", 0), 10);
      }, 100);
      await startPromise;

      // Stop
      const stopPromise = launcher.stop();

      // Simulate graceful exit
      setTimeout(() => {
        mockProcess.emit("exit", 0);
      }, 100);

      await stopPromise;

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");

      const status = launcher.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it("should force kill after timeout", async () => {
      vi.useFakeTimers();

      // Start first
      const startPromise = launcher.start();
      setTimeout(() => {
        const versionProcess = new MockChildProcess();
        vi.mocked(spawn).mockReturnValueOnce(versionProcess as any);
        setTimeout(() => versionProcess.emit("exit", 0), 10);
      }, 100);
      await startPromise;

      // Stop but don't emit exit
      const stopPromise = launcher.stop();

      // Fast forward timeout
      vi.advanceTimersByTime(10000);

      await stopPromise;

      expect(mockProcess.kill).toHaveBeenCalledWith("SIGTERM");

      vi.useRealTimers();
    });

    it("should do nothing if not running", async () => {
      await launcher.stop();

      expect(mockProcess.kill).not.toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("should return correct initial status", () => {
      const status = launcher.getStatus();

      expect(status).toEqual({
        isRunning: false,
        pid: undefined,
      });
    });
  });

  describe("getAvailableTools", () => {
    it("should return list of available MCP tools", () => {
      const tools = launcher.getAvailableTools();

      expect(tools).toEqual([
        "create_topic",
        "list_topics",
        "describe_topic",
        "list_consumer_groups",
        "describe_consumer_group",
        "reset_consumer_group_offset",
        "produce_message",
        "consume_messages",
        "cluster_info",
      ]);
    });
  });
});
