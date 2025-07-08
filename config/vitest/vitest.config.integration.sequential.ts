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
    name: "integration-sequential",
    environment: "node",
    globals: true,
    // Sequential execution for proper data flow
    sequence: {
      concurrent: false,
      shuffle: false,
      hooks: "stack",
    },
    // Test files in dependency order based on data flow
    include: [
      // Phase 1: External data collection
      resolve(rootDir, "lib/tests/integration/external-apis/CoinGeckoMarketDataReader.test.ts"),

      // Phase 2: Data writers (populate storage)
      resolve(rootDir, "lib/tests/integration/external-apis/RedpandaTargetActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/TimescaleTargetActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/TimescaleMCPTargetActor.test.ts"),

      // Phase 3: Data readers (consume from populated storage)
      resolve(rootDir, "lib/tests/integration/external-apis/RedpandaSourceActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/RedpandaMCPSourceActor.test.ts"),
      resolve(rootDir, "lib/tests/integration/external-apis/TimescaleSourceActor.test.ts"),

      // Phase 4: MCP server management
      resolve(rootDir, "lib/tests/integration/mcp-servers/redpanda-mcp-launcher.test.ts"),
    ],
    exclude: [resolve(rootDir, "node_modules/**"), resolve(rootDir, "dist/**"), resolve(rootDir, "lib/tests/integration/setup/**")],
    isolate: false, // Tests share data flow state
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // Force single process for sequential execution
      },
    },
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    reporters: ["verbose", "json"],
    outputFile: {
      json: resolve(rootDir, "test-results/integration-sequential-results.json"),
    },
    // Global setup validates services BEFORE running any tests
    globalSetup: [resolve(rootDir, "lib/tests/integration/setup/global-setup.ts")],
    // No retries - real integration should work or fail clearly
    retry: 0,
    // Fail fast on first error to prevent cascading failures
    bail: 1,
  },
});
