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
    environment: "node",
    globals: true,
    include: ["./lib/tests/**/*.test.ts", "./app/tests/**/*.test.ts", "./tests/**/*.test.ts"],
    exclude: ["./node_modules/**", "./dist/**"],
    isolate: true,
    pool: "forks",
  },
});
