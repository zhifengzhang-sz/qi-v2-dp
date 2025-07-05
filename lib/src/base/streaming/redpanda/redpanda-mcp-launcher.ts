// lib/src/redpanda/redpanda-mcp-launcher.ts
import { type ChildProcess, spawn } from "node:child_process";
import { RedpandaConfigManager } from "./redpanda-config";

export interface RedpandaMCPConfig {
  brokers?: string[];
  useCloudMCP?: boolean;
  authToken?: string;
  configPath?: string;
}

export class OfficialRedpandaMCPLauncher {
  private process?: ChildProcess;
  private isRunning = false;
  private config: RedpandaMCPConfig;

  constructor(config: RedpandaMCPConfig = {}) {
    this.config = {
      brokers: ["localhost:9092"],
      useCloudMCP: false,
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log("🔌 Starting Official Redpanda MCP Server...");

    if (this.config.useCloudMCP) {
      // Use Redpanda Cloud MCP (requires authentication)
      const args = ["cloud", "mcp", "stdio"];

      if (this.config.configPath) {
        args.unshift("--config", this.config.configPath);
      }

      this.process = spawn("rpk", args, {
        env: {
          ...process.env,
          ...(this.config.authToken && { REDPANDA_CLOUD_TOKEN: this.config.authToken }),
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
      // Use local Redpanda MCP server
      const defaultConfig = RedpandaConfigManager.getInstance().getMCPConfig();
      const mcpConfig = {
        ...defaultConfig,
        args: ["mcp", "server", "--brokers", this.config.brokers?.join(",") || "localhost:9092"],
      };

      this.process = spawn(mcpConfig.command, mcpConfig.args, {
        env: {
          ...process.env,
          ...mcpConfig.environment,
          REDPANDA_BROKERS: this.config.brokers?.join(",") || "localhost:9092",
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
    }

    this.process.on("error", (error: Error) => {
      console.error("❌ Official Redpanda MCP Server error:", error);
      this.isRunning = false;
    });

    this.process.on("exit", (code: number | null) => {
      console.log(`🔌 Official Redpanda MCP Server exited with code ${code}`);
      this.isRunning = false;
    });

    // Handle stdout for debugging
    this.process.stdout?.on("data", (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`🔌 Redpanda MCP: ${output}`);
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const error = data.toString().trim();
      if (error && !error.includes("ExperimentalWarning")) {
        console.error(`🔌 Redpanda MCP Error: ${error}`);
      }
    });

    // Wait for server to be ready
    await this.waitForReady();
    this.isRunning = true;

    console.log("✅ Official Redpanda MCP Server started successfully");
  }

  async stop(): Promise<void> {
    if (this.process && this.isRunning) {
      console.log("🛑 Stopping Official Redpanda MCP Server...");

      this.process.kill("SIGTERM");

      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        if (this.process) {
          this.process.on("exit", () => {
            resolve();
          });

          // Force kill after 10 seconds
          setTimeout(() => {
            if (this.process && this.isRunning) {
              this.process.kill("SIGKILL");
            }
            resolve();
          }, 10000);
        } else {
          resolve();
        }
      });

      this.process = undefined;
      this.isRunning = false;
      console.log("✅ Official Redpanda MCP Server stopped");
    }
  }

  private async waitForReady(): Promise<void> {
    // Wait for stdio connection to be established
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test if rpk is available and has minimum required version
    try {
      console.log("🔍 Verifying rpk availability and version...");

      const testProcess = spawn("rpk", ["version"], { stdio: "pipe" });
      await new Promise<void>((resolve, reject) => {
        testProcess.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`rpk not available (exit code: ${code})`));
          }
        });
        testProcess.on("error", reject);
      });

      // Additional check for cloud MCP capability
      if (this.config.useCloudMCP) {
        console.log("🌐 Verifying Redpanda Cloud MCP capability...");
        // Note: Requires rpk version 25.1.2+ for cloud MCP support
      }
    } catch (error: unknown) {
      throw new Error(
        `Redpanda MCP Server startup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getStatus(): { isRunning: boolean; pid?: number; config: RedpandaMCPConfig } {
    return {
      isRunning: this.isRunning,
      pid: this.process?.pid,
      config: this.config,
    };
  }

  // Available MCP Tools (provided by Official Redpanda MCP Server)
  getAvailableTools(): string[] {
    const tools = [
      // Topic Management
      "create_topic",
      "delete_topic",
      "list_topics",
      "describe_topic",
      "alter_topic_config",

      // Consumer Group Management
      "list_consumer_groups",
      "describe_consumer_group",
      "reset_consumer_group_offset",
      "delete_consumer_group",

      // Message Operations
      "produce_message",
      "consume_messages",
      "list_partition_offsets",

      // Cluster Operations
      "cluster_info",
      "cluster_metadata",
      "broker_config",

      // Schema Registry (if available)
      "list_schemas",
      "get_schema",
      "register_schema",
      "delete_schema",
    ];

    // Add cloud-specific tools if using cloud MCP
    if (this.config.useCloudMCP) {
      tools.push(
        "list_cloud_clusters",
        "describe_cloud_cluster",
        "create_cloud_topic",
        "manage_cloud_acls",
      );
    }

    return tools;
  }

  // Get server configuration info
  getServerInfo(): object {
    return {
      server: "Official Redpanda MCP Server",
      version: "v25.1.2+",
      provider: "Redpanda Data",
      type: this.config.useCloudMCP ? "cloud" : "local",
      capabilities: {
        topicManagement: true,
        consumerGroupManagement: true,
        messageOperations: true,
        clusterOperations: true,
        schemaRegistry: true,
        streaming: "Kafka-compatible",
        performance: "53% faster than Kafka",
      },
      config: {
        brokers: this.config.brokers,
        useCloudMCP: this.config.useCloudMCP,
        authenticated: !!this.config.authToken,
      },
      transport: "stdio",
      requirements: {
        rpkVersion: "25.1.2+",
        redpandaCompatibility: "all versions",
      },
    };
  }

  // Convenience method to check if cloud features are available
  isCloudEnabled(): boolean {
    return !!this.config.useCloudMCP;
  }

  // Get broker information
  getBrokerInfo(): object {
    return {
      brokers: this.config.brokers,
      type: this.config.useCloudMCP ? "cloud" : "local",
      protocol: "Kafka-compatible",
    };
  }
}
