/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};