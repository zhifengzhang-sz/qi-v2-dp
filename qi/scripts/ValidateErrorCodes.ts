/**
 * @fileoverview
 * @module ValidateErrorCodes.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-11-21
 * @modified 2024-11-21
 */

// scripts/validateErrorCodes.ts

import { ErrorCode } from "@qi/core/errors/ErrorCodes";

const codes = Object.values(ErrorCode);
const uniqueCodes = new Set(codes);

if (codes.length !== uniqueCodes.size) {
  throw new Error("Duplicate error codes found!");
} else {
  console.log("All error codes are unique.");
}
