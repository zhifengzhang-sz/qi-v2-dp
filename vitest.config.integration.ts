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
    name: "integration",
    environment: "node",
    globals: true,
    include: ["./lib/tests/integration/**/*.test.ts"],
    exclude: ["./node_modules/**", "./dist/**", "./lib/tests/integration/setup/**"],
    isolate: true,
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    reporters: ["verbose", "json"],
    outputFile: {
      json: "./test-results/integration-results.json",
    },
    // Global setup - validates external services BEFORE running any tests
    globalSetup: ["./lib/tests/integration/setup/global-setup.ts"],
    // External services must be available - no retries on service failures
    retry: 0,
  },
});
