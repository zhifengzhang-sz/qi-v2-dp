/**
 * @fileoverview
 * @module vitest.setup.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-19
 * @modified 2024-11-19
 */

// <reference types="vitest" />
import { beforeAll, afterAll, afterEach } from "vitest";

declare global {
  var vi: (typeof import("vitest"))["vi"];
}

beforeAll(() => {
  // Your global setup
});

afterAll(() => {
  // Your global teardown
});

afterEach(() => {
  // Your global cleanup
});
