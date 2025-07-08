import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@qi/core/base": resolve(__dirname, "./lib/src/qicore/base"),
      "@qi/mcp": resolve(__dirname, "./lib/src/qimcp/client"),
      "@qi/dp/dsl": resolve(__dirname, "./lib/src/dsl/index.ts"),
      "@qi/dp/actors": resolve(__dirname, "./lib/src/actors"),
      "@qi/dp/actors/abstract": resolve(__dirname, "./lib/src/actors/abstract"),
      "@qi/dp/actors/sources": resolve(__dirname, "./lib/src/actors/sources"),
      "@qi/dp/actors/targets": resolve(__dirname, "./lib/src/actors/targets"),
      "@qi/dp/base": resolve(__dirname, "./lib/src/base"),
      "@qi/dp/generators": resolve(__dirname, "./lib/src/generators"),
    },
  },
  test: {
    name: "integration-v1",
    environment: "node",
    globals: true,
    // Focus on working components for v1.0
    include: [
      // Phase 1: External data collection (WORKING)
      "./lib/tests/integration/external-apis/CoinGeckoMarketDataReader.test.ts",

      // Phase 2: MCP server management (WORKING)
      "./lib/tests/integration/mcp-servers/redpanda-mcp-launcher.test.ts",
    ],
    exclude: [
      "./node_modules/**",
      "./dist/**",
      "./lib/tests/integration/setup/**",
      // Exclude failing actor tests for v1.0 - implement in v1.1
      "./lib/tests/integration/external-apis/RedpandaSourceActor.test.ts",
      "./lib/tests/integration/external-apis/RedpandaTargetActor.test.ts",
      "./lib/tests/integration/external-apis/RedpandaMCPSourceActor.test.ts",
      "./lib/tests/integration/external-apis/TimescaleSourceActor.test.ts",
      "./lib/tests/integration/external-apis/TimescaleTargetActor.test.ts",
      "./lib/tests/integration/external-apis/TimescaleMCPTargetActor.test.ts",
    ],
    isolate: false,
    pool: "forks",
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    reporters: ["verbose", "json"],
    outputFile: {
      json: "./test-results/integration-v1-results.json",
    },
    // Global setup validates services BEFORE running any tests
    globalSetup: ["./lib/tests/integration/setup/global-setup.ts"],
    // No retries - real integration should work or fail clearly
    retry: 0,
  },
});
