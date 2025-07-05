// lib/tests/mcp-tools/tool-registry.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { StreamCryptoDataTool } from "../../src/mcp-tools/crypto-data-tools";
import { type MCPToolRegistry, createMCPToolRegistry } from "../../src/mcp-tools/registry";

describe("MCPToolRegistry", () => {
  let registry: MCPToolRegistry;
  let mockProducer: any;
  let mockConsumer: any;

  beforeEach(() => {
    mockProducer = { start: () => {}, stop: () => {}, getStatus: () => ({ isRunning: true }) };
    mockConsumer = { start: () => {}, stop: () => {}, getStatus: () => ({ isRunning: true }) };
    registry = createMCPToolRegistry(mockProducer, mockConsumer);
  });

  describe("tool registration", () => {
    it("should register a new tool", () => {
      const tool = new StreamCryptoDataTool(mockProducer);
      registry.registerTool(tool);

      expect(registry.getTool("stream_crypto_data")).toBe(tool);
      expect(registry.getToolNames()).toContain("stream_crypto_data");
    });

    it("should return all registered tools", () => {
      // Registry already has 4 tools from initialization
      const tools = registry.getAllTools();
      expect(tools.length).toBeGreaterThanOrEqual(4);
    });

    it("should return tools metadata", () => {
      // Registry already has tools from initialization
      const metadata = registry.getToolsMetadata();
      expect(metadata.length).toBeGreaterThanOrEqual(4);
      expect(metadata[0]).toHaveProperty("name");
      expect(metadata[0]).toHaveProperty("description");
    });
  });

  describe("tool execution", () => {
    it("should execute registered tool", async () => {
      const mockTool = {
        name: "test_tool",
        description: "Test tool",
        execute: async (params: any) => ({ success: true, params }),
      };

      registry.registerTool(mockTool);

      const result = await registry.executeTool("test_tool", { test: "data" });
      expect(result).toEqual({ success: true, params: { test: "data" } });
    });

    it("should throw error for non-existent tool", async () => {
      await expect(registry.executeTool("non_existent", {})).rejects.toThrow(
        "Tool not found: non_existent",
      );
    });
  });

  describe("factory function", () => {
    it("should create empty registry", () => {
      const newRegistry = createMCPToolRegistry(mockProducer, mockConsumer);
      expect(newRegistry.getAllTools().length).toBeGreaterThanOrEqual(4);
      expect(newRegistry.getToolNames().length).toBeGreaterThanOrEqual(4);
    });
  });
});
