/**
 * @fileoverview
 * @module vitest.config.ts
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-12-18
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.ts"],
    setupFiles: ["tests/vitest.setup.ts"],
    typecheck: {
      tsconfig: "./tsconfig.test.json",
      include: ["tests/**/*.{test,spec}.ts"],
    },
  },
  resolve: {
    alias: {
      "@qi/core": resolve(__dirname, "./src"),
    },
  },
});
