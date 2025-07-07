import type { MCPTool } from "./registry";
/**
 * High-Performance Platform Health Monitoring Tool
 */
export declare class PlatformHealthTool implements MCPTool {
  name: string;
  description: string;
  execute(params: {
    components: ("redpanda" | "timescale" | "producers" | "consumers")[];
    detailed?: boolean;
  }): Promise<any>;
  private checkComponentHealth;
}
/**
 * Performance Metrics Collection Tool
 */
export declare class PerformanceMetricsTool implements MCPTool {
  name: string;
  description: string;
  execute(params: {
    metrics: ("throughput" | "latency" | "errors" | "resources")[];
    timeRange?: {
      start: number;
      end: number;
    };
  }): Promise<any>;
  private collectMetric;
}
