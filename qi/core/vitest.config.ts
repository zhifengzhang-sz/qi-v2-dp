/**
 * @fileoverview
 * @module vitest.config.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.{test,spec}.ts"],
    setupFiles: ["tests/vitest.setup.ts"],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    }
  },
  resolve: {
    alias: {
      "@qi/core": resolve(__dirname, "./src"),
    },
  },
});