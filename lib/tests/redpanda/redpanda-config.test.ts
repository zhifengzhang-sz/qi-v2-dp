// lib/redpanda/redpanda-config.test.ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RedpandaConfigManager } from "../../src/base/streaming/redpanda/redpanda-config";

describe("RedpandaConfigManager", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Reset singleton instance
    (RedpandaConfigManager as unknown as { instance: undefined }).instance = undefined;
  });

  afterEach(() => {
    process.env = originalEnv;
    (RedpandaConfigManager as unknown as { instance: undefined }).instance = undefined;
  });

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = RedpandaConfigManager.getInstance();
      const instance2 = RedpandaConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("getConfig", () => {
    it("should return default configuration", () => {
      const config = RedpandaConfigManager.getInstance().getConfig();

      expect(config).toEqual({
        brokers: ["localhost:9092"],
        clientId: "qicore-crypto-platform",
        groupId: "crypto-group",
        enableAutoCommit: false,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      });
    });

    it("should use environment variables when provided", () => {
      process.env.REDPANDA_BROKERS = "broker1:9092,broker2:9092";
      process.env.REDPANDA_CLIENT_ID = "test-client";
      process.env.REDPANDA_GROUP_ID = "test-group";
      process.env.REDPANDA_AUTO_COMMIT = "true";
      process.env.REDPANDA_SESSION_TIMEOUT = "45000";
      process.env.REDPANDA_HEARTBEAT_INTERVAL = "5000";

      const config = RedpandaConfigManager.getInstance().getConfig();

      expect(config).toEqual({
        brokers: ["broker1:9092,broker2:9092"],
        clientId: "test-client",
        groupId: "test-group",
        enableAutoCommit: true,
        sessionTimeout: 45000,
        heartbeatInterval: 5000,
      });
    });

    it("should handle invalid numeric environment variables", () => {
      process.env.REDPANDA_SESSION_TIMEOUT = "invalid";
      process.env.REDPANDA_HEARTBEAT_INTERVAL = "invalid";

      const config = RedpandaConfigManager.getInstance().getConfig();

      expect(config.sessionTimeout).toBe(Number.NaN);
      expect(config.heartbeatInterval).toBe(Number.NaN);
    });
  });

  describe("updateConfig", () => {
    it("should update configuration partially", () => {
      const manager = RedpandaConfigManager.getInstance();
      const originalConfig = manager.getConfig();

      manager.updateConfig({
        clientId: "updated-client",
        sessionTimeout: 60000,
      });

      const updatedConfig = manager.getConfig();

      expect(updatedConfig).toEqual({
        ...originalConfig,
        clientId: "updated-client",
        sessionTimeout: 60000,
      });
    });

    it("should not mutate original config", () => {
      const manager = RedpandaConfigManager.getInstance();
      const config1 = manager.getConfig();

      manager.updateConfig({ clientId: "new-client" });

      expect(config1.clientId).toBe("qicore-crypto-platform");
    });
  });

  describe("getMCPConfig", () => {
    it("should return MCP server configuration", () => {
      const manager = RedpandaConfigManager.getInstance();
      const mcpConfig = manager.getMCPConfig();

      expect(mcpConfig).toEqual({
        server: "rpk",
        command: "rpk",
        args: ["mcp", "server", "--brokers", "localhost:9092"],
        transport: "stdio",
        environment: {
          REDPANDA_BROKERS: "localhost:9092",
          RPK_MCP_LOG_LEVEL: "info",
          RPK_MCP_CLIENT_ID: "qicore-crypto-platform",
        },
      });
    });

    it("should use custom broker configuration", () => {
      const manager = RedpandaConfigManager.getInstance();
      manager.updateConfig({
        brokers: ["broker1:9092", "broker2:9092"],
      });

      const mcpConfig = manager.getMCPConfig();

      expect(mcpConfig.args).toEqual(["mcp", "server", "--brokers", "broker1:9092,broker2:9092"]);
      expect(mcpConfig.environment.REDPANDA_BROKERS).toBe("broker1:9092,broker2:9092");
    });

    it("should use environment variables for MCP settings", () => {
      process.env.RPK_MCP_LOG_LEVEL = "debug";

      const manager = RedpandaConfigManager.getInstance();
      const mcpConfig = manager.getMCPConfig();

      expect(mcpConfig.environment.RPK_MCP_LOG_LEVEL).toBe("debug");
    });
  });
});
