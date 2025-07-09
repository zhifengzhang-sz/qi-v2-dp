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
    environment: "node",
    globals: true,
    include: [
      resolve(rootDir, "lib/tests/**/*.test.ts"),
      resolve(rootDir, "app/tests/**/*.test.ts"),
      resolve(rootDir, "tests/**/*.test.ts"),
    ],
    exclude: [resolve(rootDir, "node_modules/**"), resolve(rootDir, "dist/**")],
    isolate: true,
    pool: "forks",
  },
});
