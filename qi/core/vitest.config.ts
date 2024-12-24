/**
 * @fileoverview
 * @module vitest.config.ts
 *
 * @author Zhifeng Zhang
 * @created 2024-11-19
 * @modified 2024-12-25
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.{test,spec}.ts"]
  }
});
