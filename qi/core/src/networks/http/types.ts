/**
 * @fileoverview
 * @module types.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-18
 * @modified 2024-12-18
 */

import { AxiosRequestConfig } from "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    retry?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: {
    limit: number;
    delay: number;
    enabled: boolean;
  };
  logger?: {
    warn: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
    debug: (message: string, ...args: unknown[]) => void;
  };
}

export interface RequestConfig extends AxiosRequestConfig {
  retry?: boolean;
}
