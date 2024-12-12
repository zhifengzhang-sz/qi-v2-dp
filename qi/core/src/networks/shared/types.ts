/**
 * @fileoverview
 * @module types.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

/**
 * Shared types for network operations
 */
export interface NetworkErrorContext {
  url?: string;
  readyState?: number;
  expected?: number;
  currentState?: string;
  data?: unknown;
  method?: string;
  statusCode?: number;
  [key: string]: unknown;
}
