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
    environment: "node",
    globals: true,
    include: ["./lib/tests/**/*.test.ts", "./app/tests/**/*.test.ts", "./tests/**/*.test.ts"],
    exclude: ["./node_modules/**", "./dist/**"],
    isolate: true,
    pool: "forks",
  },
});
