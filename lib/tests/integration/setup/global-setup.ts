#!/usr/bin/env bun

/**
 * Global Setup for Integration Tests
 *
 * This runs BEFORE any integration tests and validates that all required
 * external services are available. If setup fails, no tests will run.
 */

import { getError, isFailure } from "../../../src/qicore/base";
import { EXTERNAL_SERVICES, ExternalServiceSetup } from "./external-services";

export async function setup(): Promise<void> {
  const serviceSetup = new ExternalServiceSetup();

  // Register all required external services
  serviceSetup.registerService(EXTERNAL_SERVICES.COINGECKO_MCP);

  // Add more services as needed:
  // serviceSetup.registerService(EXTERNAL_SERVICES.REDPANDA_CLUSTER);
  // serviceSetup.registerService(EXTERNAL_SERVICES.TIMESCALE_DB);

  // Attempt to setup all external services
  const result = await serviceSetup.setupAll();

  if (isFailure(result)) {
    const error = getError(result);
    console.error("\n❌ INTEGRATION TEST SETUP FAILED\n");
    console.error(`Error: ${error?.message}\n`);
    console.error("🔧 To fix this issue:");
    console.error("   1. Ensure external services are running and accessible");
    console.error("   2. Check network connectivity");
    console.error("   3. Verify service URLs and configurations\n");

    // Exit with error code to stop test execution
    process.exit(1);
  }

  // Store service status for tests to use
  globalThis.__INTEGRATION_SETUP__ = {
    services: serviceSetup.getSetupResults(),
    setupTime: new Date(),
  };

  console.log(`🚀 Integration test environment ready at ${new Date().toISOString()}\n`);
}

export async function teardown(): Promise<void> {
  console.log("\n🧹 Tearing down integration test environment...\n");

  // Cleanup any global resources
  if (globalThis.__INTEGRATION_SETUP__) {
    globalThis.__INTEGRATION_SETUP__ = undefined;
  }
}

// Type declaration for global setup data
declare global {
  var __INTEGRATION_SETUP__:
    | {
        services: Array<{
          name: string;
          isAvailable: boolean;
          responseTime: number;
          error?: string;
        }>;
        setupTime: Date;
      }
    | undefined;
}
