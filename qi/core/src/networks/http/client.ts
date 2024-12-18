/**
 * @fileoverview
 * @module client.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-10
 * @modified 2024-12-18
 */

import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { logger } from "@qi/core/logger";
import {
  createNetworkError,
  transformAxiosError,
  HttpStatusCode,
  mapHttpStatusToErrorCode,
} from "../errors.js";
import { ApplicationError } from "@qi/core/errors";
import { retryOperation } from "@qi/core/utils";
import type { HttpConfig, RequestConfig } from "./types.js";

export { HttpStatusCode, mapHttpStatusToErrorCode };
export type { HttpConfig, RequestConfig };

export class HttpClient {
  public readonly config: Required<HttpConfig>;
  private readonly client: AxiosInstance;

  constructor(config: HttpConfig = {}) {
    this.config = {
      baseURL: config.baseURL || "",
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      retry: {
        limit: 3,
        delay: 1000,
        enabled: true,
        ...config.retry,
      },
      logger: config.logger || logger,
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

    // Update response interceptor setup
    this.client.interceptors.response.use(
      (response) => {
        const config = response.config as InternalAxiosRequestConfig;
        const duration = config.startTime
          ? Date.now() - config.startTime
          : undefined;

        this.config.logger.debug("HTTP Response", {
          url: config.url,
          status: response.status,
          duration,
        });
        return response;
      },
      (error: unknown) => {
        if (error instanceof AxiosError) {
          const status =
            error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR;
          const errorCode = mapHttpStatusToErrorCode(status);

          const transformedError = new ApplicationError(
            error.message,
            errorCode,
            status,
            {
              url: error.config?.url,
              method: error.config?.method,
              code: error.code,
              response: error.response && {
                data: error.response.data,
                headers: error.response.headers,
                status: error.response.status,
              },
            }
          );

          if (error.config) {
            const config = error.config as InternalAxiosRequestConfig;
            const duration = config.startTime
              ? Date.now() - config.startTime
              : undefined;

            this.config.logger.error("HTTP Error", {
              url: config.url,
              status: error.response?.status,
              error: error.message,
              duration,
            });
          }

          throw transformedError;
        }
        throw createNetworkError(
          "Unknown error occurred",
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    );
  }

  private async executeRequest<T>(
    config: RequestConfig
  ): Promise<AxiosResponse<T>> {
    const requestConfig = { ...config }; // Cache config for retry logging

    try {
      if (config.retry === false) {
        return await this.client.request<T>(config);
      }

      return await retryOperation(
        async () => {
          try {
            return await this.client.request<T>(requestConfig);
          } catch (error) {
            // Don't transform here - let interceptor handle it
            throw error;
          }
        },
        {
          retries: this.config.retry.limit,
          minTimeout: this.config.retry.delay,
          onRetry: (times) => {
            // Use cached config for logging
            this.config.logger.warn("Retrying request", {
              url: requestConfig.url,
              attempt: times,
            });
          },
        }
      );
    } catch (error) {
      // Error is already transformed by interceptor
      throw error;
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
