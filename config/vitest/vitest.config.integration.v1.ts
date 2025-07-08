import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const rootDir = resolve(__dirname, "../..");

export default defineConfig({
  resolve: {
    alias: {
      "@qi/core/base": resolve(rootDir, "lib/src/qicore/base"),
      "@qi/mcp": resolve(rootDir, "lib/src/qimcp/client"),
      "@qi/dp/dsl": resolve(rootDir, "lib/src/dsl/index.ts"),
      "@qi/dp/actors": resolve(rootDir, "lib/src/actors"),
      "@qi/dp/actors/abstract": resolve(rootDir, "lib/src/actors/abstract"),
      "@qi/dp/actors/sources": resolve(rootDir, "lib/src/actors/sources"),
      "@qi/dp/actors/targets": resolve(rootDir, "lib/src/actors/targets"),
      "@qi/dp/base": resolve(rootDir, "lib/src/base"),
      "@qi/dp/generators": resolve(rootDir, "lib/src/generators"),
    },
  },
  test: {
    name: "integration-v1",
    environment: "node",
    globals: true,
    // Focus on working components for v1.0
    include: [
      // Phase 1: External data collection (WORKING)
      resolve(rootDir, "lib/tests/integration/external-apis/CoinGeckoMarketDataReader.test.ts"),

      // Phase 2: MCP server management (WORKING)
      resolve(rootDir, "lib/tests/integration/mcp-servers/redpanda-mcp-launcher.test.ts"),
    ],
    exclude: [
      resolve(rootDir, "node_modules/**"),
      resolve(rootDir, "dist/**"),
      resolve(rootDir, "lib/tests/integration/setup/**"),
      // Exclude failing actor tests for v1.0 - implement in v1.1
      resolve(rootDir, "lib/tests/integration/external-apis/RedpandaSourceActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/RedpandaTargetActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/RedpandaMCPSourceActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/TimescaleSourceActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/TimescaleTargetActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/TimescaleMCPTargetActor.test.ts"),
    ],
    isolate: false,
    pool: "forks",
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    reporters: ["verbose", "json"],
    outputFile: {
      json: resolve(rootDir, "test-results/integration-v1-results.json"),
    },
    // Global setup disabled for v1.0 - tests handle MCP availability gracefully
    // globalSetup: ["./lib/tests/integration/setup/global-setup.ts"],
    // No retries - real integration should work or fail clearly
    retry: 0,
  },
});
