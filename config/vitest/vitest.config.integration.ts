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
    name: "integration",
    environment: "node",
    globals: true,
    include: [resolve(rootDir, "lib/tests/integration/**/*.test.ts")],
    exclude: [resolve(rootDir, "node_modules/**"), resolve(rootDir, "dist/**"), resolve(rootDir, "lib/tests/integration/setup/**")],
    isolate: true,
    pool: "forks",
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    reporters: ["verbose", "json"],
    outputFile: {
      json: resolve(rootDir, "test-results/integration-results.json"),
    },
    // Global setup - validates external services BEFORE running any tests
    globalSetup: [resolve(rootDir, "lib/tests/integration/setup/global-setup.ts")],
    // External services must be available - no retries on service failures
    retry: 0,
  },
});
