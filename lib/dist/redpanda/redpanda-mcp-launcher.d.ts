export interface RedpandaMCPConfig {
  brokers?: string[];
  useCloudMCP?: boolean;
  authToken?: string;
  configPath?: string;
}
export declare class OfficialRedpandaMCPLauncher {
  private process?;
  private isRunning;
  private config;
  constructor(config?: RedpandaMCPConfig);
  start(): Promise<void>;
  stop(): Promise<void>;
  private waitForReady;
  getStatus(): {
    isRunning: boolean;
    pid?: number;
    config: RedpandaMCPConfig;
  };
  getAvailableTools(): string[];
  getServerInfo(): object;
  isCloudEnabled(): boolean;
  getBrokerInfo(): object;
}
