#!/usr/bin/env bun

/**
 * MCP Base Reader - Extends Generic Base with MCP Lifecycle
 *
 * Extends BaseReader with MCP protocol lifecycle management.
 * Follows the proven v-0.1.0 architecture:
 * - Generic base = no lifecycle
 * - MCP base = adds MCP lifecycle
 * - Concrete classes = handlers only
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import {
  type ResultType as Result,
  createQiError,
  failure,
  success,
} from "@qi/core/base";
import { BaseReader } from "./BaseReader";

// =============================================================================
// MCP BASE READER - ADDS MCP LIFECYCLE TO GENERIC BASE
// =============================================================================

export interface BaseMCPReaderConfig {
  name: string;
  debug?: boolean;
  mcpServerUrl: string;
  timeout?: number;
  maxRetries?: number;
}

export abstract class BaseMCPReader extends BaseReader {
  protected mcpClient: Client;
  protected mcpClientInitialized = false;
  protected isInitialized = false;

  constructor(protected config: BaseMCPReaderConfig) {
    super({ name: config.name, debug: config.debug });

    // Create MCP client
    this.mcpClient = new Client(
      {
        name: config.name,
        version: "1.0.0",
      },
      {
        capabilities: {},
      },
    );
  }

  // =============================================================================
  // MCP LIFECYCLE MANAGEMENT
  // =============================================================================

  async initialize(): Promise<Result<void>> {
    if (this.isInitialized) {
      return success(undefined);
    }

    try {
      if (this.config.debug) {
        console.log(`🎭 Initializing ${this.config.name}...`);
      }

      const connected = await this.connectToMCPWithRetry();
      if (!connected) {
        return failure(
          createQiError("MCP_CONNECTION_FAILED", "Failed to connect to MCP server", "SYSTEM", {
            config: this.config,
          }),
        );
      }

      this.isInitialized = true;
      return success(undefined);
    } catch (error) {
      this.errorCount++;
      return failure(
        createQiError(
          "READER_INIT_FAILED",
          `${this.config.name} initialization failed: ${error}`,
          "SYSTEM",
          { error, config: this.config },
        ),
      );
    }
  }

  async cleanup(): Promise<Result<void>> {
    try {
      if (this.config.debug) {
        console.log(`🛑 Cleaning up ${this.config.name}...`);
      }

      if (this.mcpClient && this.mcpClientInitialized) {
        await this.mcpClient.close();
        this.mcpClientInitialized = false;
      }

      this.isInitialized = false;
      return success(undefined);
    } catch (error) {
      this.errorCount++;
      return failure(
        createQiError(
          "READER_CLEANUP_FAILED",
          `${this.config.name} cleanup failed: ${error}`,
          "SYSTEM",
          { error },
        ),
      );
    }
  }

  // =============================================================================
  // MCP UTILITIES FOR CONCRETE CLASSES
  // =============================================================================

  protected async callMCPTool(toolName: string, arguments_: any): Promise<any> {
    if (!this.mcpClientInitialized) {
      throw new Error("MCP client not initialized");
    }

    const result = await this.mcpClient.callTool({
      name: toolName,
      arguments: arguments_,
    });

    return this.extractMCPData(result);
  }

  protected extractMCPData<T>(result: any): T {
    if (result?.content?.[0]?.text) {
      try {
        return JSON.parse(result.content[0].text);
      } catch (error) {
        throw new Error(`Failed to parse MCP response: ${error}`);
      }
    }
    return result?.data || result;
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  private async connectToMCPWithRetry(maxRetries = 3): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.config.debug) {
          console.log(`🚀 Connecting to MCP server (attempt ${attempt}/${maxRetries})...`);
        }

        const transport = new SSEClientTransport(new URL(this.config.mcpServerUrl));
        await this.mcpClient.connect(transport);
        this.mcpClientInitialized = true;
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.includes("429")) {
          const delay = 2 ** attempt * 2000; // 2s, 4s, 8s
          if (this.config.debug) {
            console.log(
              `⏳ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          if (this.config.debug) {
            console.log(`❌ MCP connection error: ${errorMsg}`);
          }
          break;
        }
      }
    }

    return false;
  }
}
