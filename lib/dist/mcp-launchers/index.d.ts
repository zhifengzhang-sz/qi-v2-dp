export { OfficialRedpandaMCPLauncher } from "../redpanda/redpanda-mcp-launcher";
export type { RedpandaMCPConfig } from "../redpanda/redpanda-mcp-launcher";
export { OfficialPostgresMCPLauncher } from "./postgres-mcp-launcher";
export type { PostgresMCPConfig } from "./postgres-mcp-launcher";
export { OfficialCoinGeckoMCPLauncher } from "./coingecko-mcp-launcher";
export type { CoinGeckoMCPConfig } from "./coingecko-mcp-launcher";
import type { OfficialRedpandaMCPLauncher } from "../redpanda/redpanda-mcp-launcher";
import type { RedpandaMCPConfig } from "../redpanda/redpanda-mcp-launcher";
import type { OfficialCoinGeckoMCPLauncher } from "./coingecko-mcp-launcher";
import type { CoinGeckoMCPConfig } from "./coingecko-mcp-launcher";
import type { OfficialPostgresMCPLauncher } from "./postgres-mcp-launcher";
import type { PostgresMCPConfig } from "./postgres-mcp-launcher";
export interface MCPServerRegistry {
  redpanda?: OfficialRedpandaMCPLauncher;
  postgres?: OfficialPostgresMCPLauncher;
  coingecko?: OfficialCoinGeckoMCPLauncher;
}
export declare class MCPServerManager {
  private servers;
  startAll(configs: {
    redpanda?: RedpandaMCPConfig;
    postgres?: PostgresMCPConfig;
    coingecko?: CoinGeckoMCPConfig;
  }): Promise<void>;
  stopAll(): Promise<void>;
  getServerStatus(): object;
  getServerInfo(): object;
  getAllAvailableTools(): Record<string, string[]>;
}
