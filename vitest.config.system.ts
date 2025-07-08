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
    name: "system",
    environment: "node",
    globals: true,
    include: ["./lib/tests/system/**/*.test.ts"],
    exclude: ["./node_modules/**", "./dist/**"],
    isolate: true,
    pool: "forks",
    timeout: 60000, // Very long timeout for end-to-end tests
    testTimeout: 60000,
    hookTimeout: 15000,
    teardownTimeout: 15000,
    reporter: ["verbose", "json"],
    outputFile: {
      json: "./test-results/system-results.json",
    },
    // Allow retries for flaky end-to-end tests
    retry: 2,
    // Run system tests sequentially to avoid resource conflicts
    threads: false,
  },
});