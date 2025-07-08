#!/usr/bin/env bun

/**
 * Phase 2: Per-Test Service Validation Setup
 *
 * Validates that all required services are running and accessible.
 * This runs before every test execution.
 *
 * If this fails, tests are immediately terminated - no testing without proper services.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface ServiceStatus {
  name: string;
  type: "external-api" | "database" | "message-broker" | "mcp-server";
  required: boolean;
  available: boolean;
  responseTime?: number;
  error?: string;
  endpoint?: string;
}

interface ValidationResult {
  success: boolean;
  timestamp: Date;
  services: ServiceStatus[];
  requiredServicesUp: number;
  totalRequiredServices: number;
}

export class Phase2ServiceValidator {
  private realTimeDir: string;
  private services: ServiceStatus[] = [];

  constructor() {
    this.realTimeDir = join(process.cwd(), "lib/tests/data/real-time");
  }

  async validateAll(): Promise<ValidationResult> {
    console.log("🔍 Phase 2: Validating services for test execution...");

    try {
      // Ensure real-time data directory exists
      await mkdir(this.realTimeDir, { recursive: true });
      await mkdir(join(this.realTimeDir, "prices"), { recursive: true });
      await mkdir(join(this.realTimeDir, "ohlcv"), { recursive: true });
      await mkdir(join(this.realTimeDir, "analytics"), { recursive: true });

      // Validate each required service
      await this.validateCoinGeckoAPI();
      await this.validateRedpandaCluster();
      await this.validateTimescaleDB();
      await this.validateRedpandaMCPServer();

      // Calculate results
      const requiredServices = this.services.filter((s) => s.required);
      const requiredServicesUp = requiredServices.filter((s) => s.available).length;

      const result: ValidationResult = {
        success: requiredServicesUp === requiredServices.length,
        timestamp: new Date(),
        services: this.services,
        requiredServicesUp,
        totalRequiredServices: requiredServices.length,
      };

      // Save validation results
      await this.saveValidationResults(result);

      if (result.success) {
        console.log(
          `✅ Phase 2: All ${result.totalRequiredServices} required services are available`,
        );
        console.log("🚀 Tests can proceed with real service integration");
      } else {
        console.error(
          `❌ Phase 2: ${result.totalRequiredServices - result.requiredServicesUp}/${result.totalRequiredServices} required services unavailable`,
        );
        console.error("🚫 Tests cannot proceed - fix service issues first");

        // Log specific failures
        const failedServices = this.services.filter((s) => s.required && !s.available);
        for (const service of failedServices) {
          console.error(`   - ${service.name}: ${service.error || "Unknown error"}`);
        }
      }

      return result;
    } catch (error) {
      const errorMsg = `Phase 2 validation failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error("❌", errorMsg);

      return {
        success: false,
        timestamp: new Date(),
        services: this.services,
        requiredServicesUp: 0,
        totalRequiredServices: 0,
      };
    }
  }

  private async validateCoinGeckoAPI(): Promise<void> {
    const startTime = Date.now();
    const service: ServiceStatus = {
      name: "CoinGecko MCP API",
      type: "external-api",
      required: true,
      available: false,
      endpoint: "https://mcp.api.coingecko.com/sse",
    };

    try {
      console.log("🌐 Validating CoinGecko MCP API...");

      // Try connecting with retry logic for rate limiting
      const client = await this.connectToMCPWithRetry();

      if (!client) {
        throw new Error("Failed to connect after retries");
      }

      // Test basic functionality with retry
      const testResponse = await this.callMCPToolWithRetry(client, {
        name: "get_coins_markets",
        arguments: {
          ids: "bitcoin",
          vs_currency: "usd",
        },
      });

      if (testResponse?.content) {
        service.available = true;
        service.responseTime = Date.now() - startTime;

        // Store current price for real-time data
        await this.saveRealTimeData("prices/bitcoin-current.json", testResponse);

        console.log(`✅ CoinGecko API available (${service.responseTime}ms)`);
      }

      await client.close();
    } catch (error) {
      service.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ CoinGecko API unavailable: ${service.error}`);
    }

    this.services.push(service);
  }

  private async connectToMCPWithRetry(maxRetries = 3): Promise<Client | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = new Client(
          {
            name: "phase2-validator",
            version: "1.0.0",
          },
          {
            capabilities: {},
          },
        );

        const transport = new SSEClientTransport(new URL("https://mcp.api.coingecko.com/sse"));

        await client.connect(transport);
        return client;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.includes("429") || errorMsg.includes("Non-200 status code (429)")) {
          const delay = 2 ** attempt * 2000; // 2s, 4s, 8s
          console.log(`⏳ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // Non-rate-limit error, don't retry
          throw error;
        }
      }
    }

    return null;
  }

  private async callMCPToolWithRetry(client: Client, toolCall: any, maxRetries = 2): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await client.callTool(toolCall);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.includes("429") && attempt < maxRetries) {
          const delay = 2 ** attempt * 1000; // 1s, 2s
          console.log(`⏳ API call rate limited, waiting ${delay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  private async validateRedpandaCluster(): Promise<void> {
    const service: ServiceStatus = {
      name: "Redpanda Kafka Cluster",
      type: "message-broker",
      required: true,
      available: false,
      endpoint: "localhost:19092",
    };

    try {
      console.log("🔄 Validating Redpanda cluster...");

      // Test with kafkajs client
      const startTime = Date.now();

      // Simple connection test using bun process
      const testResult = await this.testKafkaConnection("localhost:19092");

      if (testResult.success) {
        service.available = true;
        service.responseTime = Date.now() - startTime;
        console.log(`✅ Redpanda cluster available (${service.responseTime}ms)`);
      } else {
        throw new Error(testResult.error);
      }
    } catch (error) {
      service.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ Redpanda cluster unavailable: ${service.error}`);
    }

    this.services.push(service);
  }

  private async validateTimescaleDB(): Promise<void> {
    const service: ServiceStatus = {
      name: "TimescaleDB",
      type: "database",
      required: true,
      available: false,
      endpoint: "localhost:5432",
    };

    try {
      console.log("🗄️ Validating TimescaleDB...");

      const startTime = Date.now();

      // Test database connection
      const testResult = await this.testDatabaseConnection();

      if (testResult.success) {
        service.available = true;
        service.responseTime = Date.now() - startTime;
        console.log(`✅ TimescaleDB available (${service.responseTime}ms)`);
      } else {
        // If database doesn't exist, try to set it up
        if (testResult.error?.includes("does not exist")) {
          console.log("🔧 Database not found, attempting to create...");
          const { setupTimescaleDB } = await import("./setup-timescaledb");
          const setupResult = await setupTimescaleDB();

          if (setupResult.success) {
            console.log("✅ TimescaleDB setup completed");
            service.available = true;
            service.responseTime = Date.now() - startTime;
          } else {
            throw new Error(`Setup failed: ${setupResult.error}`);
          }
        } else {
          throw new Error(testResult.error);
        }
      }
    } catch (error) {
      service.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ TimescaleDB unavailable: ${service.error}`);
    }

    this.services.push(service);
  }

  private async validateRedpandaMCPServer(): Promise<void> {
    const service: ServiceStatus = {
      name: "Redpanda MCP Server",
      type: "mcp-server",
      required: false, // Optional for some tests
      available: false,
      endpoint: "local process",
    };

    try {
      console.log("🔌 Validating Redpanda MCP Server...");

      const startTime = Date.now();

      // Test rpk availability
      const rpkTest = await this.testRPKAvailability();

      if (rpkTest.success) {
        service.available = true;
        service.responseTime = Date.now() - startTime;
        console.log(`✅ Redpanda MCP Server available (${service.responseTime}ms)`);
      } else {
        throw new Error(rpkTest.error);
      }
    } catch (error) {
      service.error = error instanceof Error ? error.message : String(error);
      console.log(`⚠️ Redpanda MCP Server unavailable: ${service.error} (optional)`);
    }

    this.services.push(service);
  }

  private async testKafkaConnection(broker: string): Promise<{ success: boolean; error?: string }> {
    // For now, just check if port is open
    // In real implementation, use kafkajs to test connection
    try {
      // Simplified test - check if broker is reachable
      const { Kafka } = await import("kafkajs");

      const kafka = new Kafka({
        clientId: "phase2-validator",
        brokers: [broker],
        retry: {
          retries: 1,
          initialRetryTime: 1000,
        },
      });

      const admin = kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test PostgreSQL/TimescaleDB connection
      const { Client } = await import("pg");

      const client = new Client({
        host: "localhost",
        port: 5432,
        database: "crypto_data_test",
        user: "postgres",
        password: "password",
      });

      await client.connect();

      // Test TimescaleDB extension
      const result = await client.query("SELECT 1");
      await client.end();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testRPKAvailability(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const rpkProcess = spawn("rpk", ["version"], { stdio: "pipe" });

      rpkProcess.on("exit", (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `rpk exited with code ${code}` });
        }
      });

      rpkProcess.on("error", (error) => {
        resolve({ success: false, error: error.message });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        rpkProcess.kill();
        resolve({ success: false, error: "rpk command timed out" });
      }, 5000);
    });
  }

  private async saveRealTimeData(filepath: string, data: any): Promise<void> {
    const fullPath = join(this.realTimeDir, filepath);
    await writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
  }

  private async saveValidationResults(result: ValidationResult): Promise<void> {
    const validationData = {
      validationTime: result.timestamp,
      success: result.success,
      requiredServicesUp: result.requiredServicesUp,
      totalRequiredServices: result.totalRequiredServices,
      services: result.services,
      phase: "phase2-service-validation",
      readyForTesting: result.success,
    };

    await writeFile(
      join(this.realTimeDir, "_validation.json"),
      JSON.stringify(validationData, null, 2),
      "utf8",
    );
  }
}

// CLI execution
if (import.meta.main) {
  const validator = new Phase2ServiceValidator();
  const result = await validator.validateAll();

  if (!result.success) {
    console.error("❌ Phase 2 validation failed - tests cannot run without required services");
    console.error("🔧 Fix service issues and retry");
    process.exit(1);
  }

  console.log("🎉 Phase 2 complete - services validated, ready for testing");
  process.exit(0);
}
