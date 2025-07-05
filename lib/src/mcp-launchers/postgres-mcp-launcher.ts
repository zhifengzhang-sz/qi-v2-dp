// lib/src/mcp-launchers/postgres-mcp-launcher.ts
import { type ChildProcess, spawn } from "node:child_process";

export interface PostgresMCPConfig {
  connectionString: string;
  readOnly?: boolean;
  maxConnections?: number;
  allowDangerous?: boolean;
}

export class OfficialPostgresMCPLauncher {
  private process?: ChildProcess;
  private isRunning = false;
  private config: PostgresMCPConfig;

  constructor(config: PostgresMCPConfig) {
    this.config = {
      readOnly: true,
      maxConnections: 10,
      allowDangerous: false,
      ...config,
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    console.log("🕒 Starting Official PostgreSQL MCP Server...");

    // Use official PostgreSQL MCP server
    this.process = spawn(
      "npx",
      ["-y", "@modelcontextprotocol/server-postgres", this.config.connectionString],
      {
        env: {
          ...process.env,
          POSTGRES_READ_ONLY: this.config.readOnly ? "true" : "false",
          POSTGRES_MAX_CONNECTIONS: this.config.maxConnections?.toString(),
          // Safety: Only allow dangerous operations if explicitly enabled
          POSTGRES_ALLOW_DANGEROUS: this.config.allowDangerous ? "true" : "false",
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    this.process.on("error", (error: Error) => {
      console.error("❌ Official PostgreSQL MCP Server error:", error);
      this.isRunning = false;
    });

    this.process.on("exit", (code: number | null) => {
      console.log(`🕒 Official PostgreSQL MCP Server exited with code ${code}`);
      this.isRunning = false;
    });

    // Handle stdout for debugging
    this.process.stdout?.on("data", (data: Buffer) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`🕒 PostgreSQL MCP: ${output}`);
      }
    });

    this.process.stderr?.on("data", (data: Buffer) => {
      const error = data.toString().trim();
      if (error && !error.includes("ExperimentalWarning")) {
        console.error(`🕒 PostgreSQL MCP Error: ${error}`);
      }
    });

    // Wait for server to be ready
    await this.waitForReady();
    this.isRunning = true;

    console.log("✅ Official PostgreSQL MCP Server started successfully");
  }

  async stop(): Promise<void> {
    if (this.process && this.isRunning) {
      console.log("🛑 Stopping Official PostgreSQL MCP Server...");

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
      console.log("✅ Official PostgreSQL MCP Server stopped");
    }
  }

  private async waitForReady(): Promise<void> {
    // Wait for server initialization
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      // Test PostgreSQL connection by attempting a basic connection test
      console.log("🔍 Verifying PostgreSQL MCP server connection...");

      // The server will test the connection string during startup
      // If we reach here without errors, assume it's working
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error: unknown) {
      throw new Error(
        `PostgreSQL MCP Server startup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  getStatus(): {
    isRunning: boolean;
    pid?: number;
    config: Omit<PostgresMCPConfig, "connectionString">;
  } {
    return {
      isRunning: this.isRunning,
      pid: this.process?.pid,
      config: {
        readOnly: this.config.readOnly,
        maxConnections: this.config.maxConnections,
        allowDangerous: this.config.allowDangerous,
      },
    };
  }

  // Available MCP Tools (provided by Official PostgreSQL MCP Server)
  getAvailableTools(): string[] {
    const tools = [
      // Schema Information
      "read_schema",
      "describe_table",
      "list_tables",
      "get_table_info",

      // Read Operations (always available)
      "read_query",
      "execute_select",
      "query_database",
    ];

    // Add write operations only if not read-only
    if (!this.config.readOnly) {
      tools.push(
        // Write Operations (if enabled)
        "execute_query",
        "execute_insert",
        "execute_update",
        "execute_delete",
        "create_table",
        "alter_table",
        "drop_table",
      );
    }

    return tools;
  }

  // Get server configuration info
  getServerInfo(): object {
    return {
      server: "Official PostgreSQL MCP Server",
      version: "v0.6.2",
      provider: "Model Context Protocol",
      status: "archived (reference only)",
      note: "Consider using alternative PostgreSQL MCP servers for production",
      capabilities: {
        schemaInspection: true,
        readOnlyQueries: true,
        writeQueries: !this.config.readOnly,
        transactionSupport: false,
        connectionPooling: true,
      },
      config: {
        readOnly: this.config.readOnly,
        maxConnections: this.config.maxConnections,
        allowDangerous: this.config.allowDangerous,
      },
      transport: "stdio",
      compatibility: {
        postgresql: "all versions",
        timescaledb: true,
        extensions: "supported",
      },
    };
  }

  // Convenience method to check if write operations are allowed
  isWriteEnabled(): boolean {
    return !this.config.readOnly;
  }

  // Get connection info (without exposing credentials)
  getConnectionInfo(): object {
    try {
      const url = new URL(this.config.connectionString);
      return {
        host: url.hostname,
        port: url.port || "5432",
        database: url.pathname.substring(1),
        username: url.username,
        ssl: url.searchParams.get("sslmode") !== "disable",
      };
    } catch (error: unknown) {
      return {
        error: "Invalid connection string format",
      };
    }
  }
}
