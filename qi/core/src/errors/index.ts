/**
 * @fileoverview Core error handling system providing strongly-typed error classes
 * for different categories of application failures. Includes detailed error tracking,
 * type-safe error details, and standardized error codes.
 * @module @qi/core/errors
 *
 * @author Zhifeng Zhang
 * @created 2024-03-18
 * @modified 2024-12-07
 */

export { ErrorDetails, ApplicationError } from "./ApplicationError.js";
export { ErrorCode, StatusCode } from "./ErrorCodes.js";
