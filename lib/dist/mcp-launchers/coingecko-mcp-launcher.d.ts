export interface CoinGeckoMCPConfig {
  apiKey?: string;
  rateLimit?: number;
  timeout?: number;
  environment?: "free" | "pro" | "demo";
  useRemoteServer?: boolean;
}
export declare class OfficialCoinGeckoMCPLauncher {
  private process?;
  private isRunning;
  private config;
  constructor(config?: CoinGeckoMCPConfig);
  start(): Promise<void>;
  stop(): Promise<void>;
  private waitForReady;
  getStatus(): {
    isRunning: boolean;
    pid?: number;
    config: CoinGeckoMCPConfig;
  };
  getAvailableTools(): string[];
  getServerInfo(): object;
}
