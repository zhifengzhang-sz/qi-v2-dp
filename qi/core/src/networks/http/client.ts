/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-10
 * @modified 2024-12-12
 */

/**
 * @fileoverview HTTP Client Implementation
 * @module @qi/core/networks/http/client
 */

import { logger } from "@qi/core/logger";
import { retryOperation } from "@qi/core/utils";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { transformAxiosError } from "../errors.js";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}

export interface HttpConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface RequestConfig extends AxiosRequestConfig {
  retry?: boolean;
}

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly config: Required<HttpConfig>;

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for timing
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.startTime = Date.now();
        return config;
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        const duration = response.config.startTime
          ? Date.now() - response.config.startTime
          : undefined;

        logger.debug("HTTP Response", {
          url: response.config.url,
          status: response.status,
          duration,
        });
        return response;
      },
      (error) => {
        const duration = error.config?.startTime
          ? Date.now() - error.config.startTime
          : undefined;

        logger.error("HTTP Error", {
          url: error.config?.url,
          status: error.response?.status,
          error: error.message,
          duration,
        });

        throw transformAxiosError(error);
      }
    );
  }

  private async executeRequest<T>(
    config: RequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      if (config.retry === false) {
        return await this.client.request<T>(config);
      }

      return await retryOperation(() => this.client.request<T>(config), {
        retries: this.config.retries,
        minTimeout: this.config.retryDelay,
        onRetry: (times) => {
          logger.warn("Retrying HTTP request", {
            url: config.url,
            attempt: times,
          });
        },
      });
    } catch (error) {
      throw transformAxiosError(error);
    }
  }

  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "GET",
      url,
    });
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "POST",
      url,
      data,
    });
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "PUT",
      url,
      data,
    });
    return response.data;
  }

  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const response = await this.executeRequest<T>({
      ...config,
      method: "DELETE",
      url,
    });
    return response.data;
  }
}
