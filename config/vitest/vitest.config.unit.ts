import { resolve } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const rootDir = resolve(__dirname, "../..");

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    name: "unit",
    environment: "node",
    globals: true,
    include: [
      resolve(rootDir, "lib/tests/qicore/**/*.test.ts"),
      resolve(rootDir, "lib/tests/domain/**/*.test.ts"),
      resolve(rootDir, "lib/tests/dsl/**/*.test.ts"),
      resolve(rootDir, "lib/tests/utils/**/*.test.ts"),
      resolve(rootDir, "lib/tests/sources/**/*.test.ts"),
    ],
    exclude: [resolve(rootDir, "node_modules/**"), resolve(rootDir, "dist/**")],
    isolate: true,
    pool: "forks",
    testTimeout: 5000, // Fast unit tests
    hookTimeout: 5000,
    teardownTimeout: 5000,
    reporters: ["verbose", "json"],
    outputFile: {
      json: resolve(rootDir, "test-results/unit-results.json"),
    },
  },
});
