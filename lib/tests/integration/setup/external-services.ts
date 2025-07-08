#!/usr/bin/env bun

/**
 * External Service Setup for Integration Tests
 *
 * This module sets up and validates external services required for integration testing.
 * If any external service fails to connect, the entire integration test suite should fail.
 */

import {
  type ResultType as Result,
  createQiError,
  failure,
  success,
} from "../../../src/qicore/base";

export interface ExternalServiceConfig {
  name: string;
  url: string;
  timeout: number;
  healthCheck: () => Promise<boolean>;
}

export interface ExternalServiceStatus {
  name: string;
  isAvailable: boolean;
  responseTime: number;
  error?: string;
}

export class ExternalServiceSetup {
  private services: ExternalServiceConfig[] = [];
  private setupResults: ExternalServiceStatus[] = [];

  /**
   * Register an external service for testing
   */
  registerService(config: ExternalServiceConfig): void {
    this.services.push(config);
  }

  /**
   * Setup all external services - MUST succeed for tests to proceed
   */
  async setupAll(): Promise<Result<ExternalServiceStatus[]>> {
    console.log("\n🔌 Setting up external services for integration testing...\n");

    this.setupResults = [];

    for (const service of this.services) {
      const result = await this.setupService(service);
      this.setupResults.push(result);

      if (!result.isAvailable) {
        console.log(`❌ External service setup FAILED: ${service.name}`);
        console.log(`   URL: ${service.url}`);
        console.log(`   Error: ${result.error}`);
        console.log("\n🚫 Integration tests cannot proceed without external services\n");

        return failure(
          createQiError(
            "EXTERNAL_SERVICE_UNAVAILABLE",
            `External service '${service.name}' is not available: ${result.error}`,
            "EXTERNAL",
            { service: service.name, url: service.url },
          ),
        );
      }

      console.log(`✅ ${service.name} - Available (${result.responseTime}ms)`);
    }

    console.log("\n🎉 All external services are ready for integration testing!\n");
    return success(this.setupResults);
  }

  /**
   * Setup individual external service
   */
  private async setupService(config: ExternalServiceConfig): Promise<ExternalServiceStatus> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Checking ${config.name}...`);

      const isAvailable = await Promise.race([
        config.healthCheck(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${config.timeout}ms`)), config.timeout),
        ),
      ]);

      const responseTime = Date.now() - startTime;

      return {
        name: config.name,
        isAvailable,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        name: config.name,
        isAvailable: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get setup results for reporting
   */
  getSetupResults(): ExternalServiceStatus[] {
    return [...this.setupResults];
  }

  /**
   * Cleanup all external services
   */
  async cleanup(): Promise<void> {
    console.log("\n🧹 Cleaning up external service connections...\n");
    // Add any cleanup logic here if needed
  }
}

/**
 * Predefined external service configurations
 */
export const EXTERNAL_SERVICES = {
  COINGECKO_MCP: {
    name: "CoinGecko MCP Server",
    url: "https://mcp.api.coingecko.com/sse",
    timeout: 10000,
    healthCheck: async (): Promise<boolean> => {
      try {
        // Try to establish SSE connection to CoinGecko MCP server
        const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
        const { SSEClientTransport } = await import("@modelcontextprotocol/sdk/client/sse.js");

        const client = new Client(
          {
            name: "integration-test-health-check",
            version: "1.0.0",
          },
          {
            capabilities: {},
          },
        );

        const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));

        await client.connect(transport);

        // Test basic functionality
        const result = await client.listTools();

        await client.close();

        return result.tools && result.tools.length > 0;
      } catch (error) {
        return false;
      }
    },
  } as ExternalServiceConfig,

  // Add more external services as needed
  // REDPANDA_CLUSTER: { ... },
  // TIMESCALE_DB: { ... },
} as const;
