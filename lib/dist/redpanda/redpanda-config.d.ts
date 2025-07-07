import type { RedpandaConfig } from "./types";
export declare class RedpandaConfigManager {
  private static instance;
  private config;
  private constructor();
  static getInstance(): RedpandaConfigManager;
  getConfig(): RedpandaConfig;
  updateConfig(updates: Partial<RedpandaConfig>): void;
  getMCPConfig(): {
    server: string;
    command: string;
    args: string[];
    transport: string;
    environment: {
      REDPANDA_BROKERS: string;
      RPK_MCP_LOG_LEVEL: string;
      RPK_MCP_CLIENT_ID: string;
    };
  };
}
export declare const redpandaConfig: RedpandaConfigManager;
