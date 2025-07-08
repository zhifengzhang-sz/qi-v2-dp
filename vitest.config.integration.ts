import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@qi/core/base": resolve(__dirname, "./lib/src/qicore/base"),
      "@qi/agent": resolve(__dirname, "./lib/src/qiagent/index"),
      "@qi/mcp": resolve(__dirname, "./lib/src/qimcp/client"),
      "@qi/prompt": resolve(__dirname, "./lib/src/qiprompt/index"),
      "@qi/dp/abstract/*": resolve(__dirname, "./lib/src/abstract/*"),
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
    timeout: 30000, // Longer timeout for external services
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    reporter: ["verbose", "json"],
    outputFile: {
      json: "./test-results/integration-results.json",
    },
    // Global setup - validates external services BEFORE running any tests
    globalSetup: ["./lib/tests/integration/setup/global-setup.ts"],
    // External services must be available - no retries on service failures
    retry: 0,
  },
});