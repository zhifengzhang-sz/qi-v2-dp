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
    name: "unit",
    environment: "node",
    globals: true,
    include: ["./lib/tests/unit/**/*.test.ts"],
    exclude: ["./node_modules/**", "./dist/**"],
    isolate: true,
    pool: "forks",
    timeout: 5000, // Fast unit tests
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    reporter: ["verbose", "json"],
    outputFile: {
      json: "./test-results/unit-results.json",
    },
  },
});