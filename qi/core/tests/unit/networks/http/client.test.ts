/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @fileoverview
 * @module client.test.ts
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-14
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { createNetworkError } from "@qi/core/networks";
import { HttpClient, HttpStatusCode } from "@qi/core/networks";
import * as utils from "@qi/core/utils";
import { logger } from "@qi/core/logger";

// Mock modules
vi.mock("axios");
vi.mock("@qi/core/utils");
vi.mock("@qi/core/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("HttpClient", () => {
  let client: HttpClient;
  let mockAxiosInstance: AxiosInstance;
  let mockRequest: ReturnType<typeof vi.fn>;
  let requestInterceptor: (
    config: InternalAxiosRequestConfig
  ) => InternalAxiosRequestConfig;
  let responseInterceptor: (response: AxiosResponse) => AxiosResponse;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let errorInterceptor: (error: unknown) => never;
  let mockRetryOperation: ReturnType<typeof vi.fn>;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();

    mockRequest = vi.fn();
    mockAxiosInstance = {
      request: mockRequest,
      interceptors: {
        request: {
          use: vi.fn((interceptor) => {
            requestInterceptor = interceptor;
          }),
        },
        response: {
          use: vi.fn((success, error) => {
            responseInterceptor = success;
            errorInterceptor = error;
          }),
        },
      },
    } as unknown as AxiosInstance;

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance);
    mockRetryOperation = vi.fn().mockImplementation((fn) => fn());
    vi.mocked(utils.retryOperation).mockImplementation(mockRetryOperation);

    // Create mock fetch function
    mockFetch = vi.fn();
    // Replace global fetch with mock
    vi.stubGlobal("fetch", mockFetch);
    // Create client instance
    client = new HttpClient();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should create client with default config", () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: "",
        timeout: 30000,
        headers: {},
      });
    });

    it("should create client with custom config", () => {
      const customConfig = {
        baseURL: "https://api.example.com",
        timeout: 5000,
        headers: { "X-Custom": "value" },
        retries: 5,
        retryDelay: 2000,
      };
      client = new HttpClient(customConfig);
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: customConfig.baseURL,
        timeout: customConfig.timeout,
        headers: customConfig.headers,
      });
    });
  });

  describe("request interceptors", () => {
    it("should add startTime to requests", () => {
      const config = {} as InternalAxiosRequestConfig;
      const result = requestInterceptor(config);
      expect(result.startTime).toBeDefined();
      expect(typeof result.startTime).toBe("number");
    });

    it("should log successful responses with timing", () => {
      const response = {
        config: { startTime: Date.now() - 100, url: "/test" },
        status: 200,
        data: { success: true },
      } as AxiosResponse;

      responseInterceptor(response);

      expect(logger.debug).toHaveBeenCalledWith("HTTP Response", {
        url: "/test",
        status: 200,
        duration: expect.any(Number),
      });
    });

    it("should transform errors properly", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      try {
        await client.get("/test");
        expect.fail("Should have thrown");
      } catch (error) {
        const appError = error as ApplicationError;
        expect(appError).toBeInstanceOf(ApplicationError);
        expect(appError).toHaveProperty("code", ErrorCode.NETWORK_ERROR);
        expect(appError).toHaveProperty(
          "statusCode",
          HttpStatusCode.BAD_GATEWAY
        );
      }
    });
  });

  describe("HTTP methods", () => {
    const mockResponse = {
      data: { result: "success" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { startTime: Date.now() },
    };

    it("should make GET request", async () => {
      mockRequest.mockResolvedValueOnce(mockResponse);
      const result = await client.get("/test");
      expect(result).toEqual(mockResponse.data);
      expect(mockRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "/test",
      });
    });

    it("should make POST request with data", async () => {
      const postData = { name: "test" };
      mockRequest.mockResolvedValueOnce(mockResponse);
      const result = await client.post("/test", postData);
      expect(result).toEqual(mockResponse.data);
      expect(mockRequest).toHaveBeenCalledWith({
        method: "POST",
        url: "/test",
        data: postData,
      });
    });

    it("should make PUT request with data", async () => {
      const putData = { name: "test" };
      mockRequest.mockResolvedValueOnce(mockResponse);
      const result = await client.put("/test", putData);
      expect(result).toEqual(mockResponse.data);
      expect(mockRequest).toHaveBeenCalledWith({
        method: "PUT",
        url: "/test",
        data: putData,
      });
    });

    it("should make DELETE request", async () => {
      mockRequest.mockResolvedValueOnce(mockResponse);
      const result = await client.delete("/test");
      expect(result).toEqual(mockResponse.data);
      expect(mockRequest).toHaveBeenCalledWith({
        method: "DELETE",
        url: "/test",
      });
    });
  });

  describe("retry behavior", () => {
    it("should retry failed requests by default", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: "success" }))
        );

      const response = await client.get("/test");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response).toBe("success");
    });

    it("should not retry when retry option is false", async () => {
      const error = new AxiosError("Network Error", "ERR_NETWORK");
      mockRequest.mockRejectedValueOnce(error);

      await expect(client.get("/test", { retry: false })).rejects.toThrow(
        ApplicationError
      );

      expect(mockRetryOperation).not.toHaveBeenCalled();
    });

    it("should log retry attempts", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Network error"));
      mockRetryOperation.mockImplementationOnce((fn, options) => {
        options.onRetry(1);
        return { data: { success: true } };
      });

      await client.get("/test");

      expect(logger.warn).toHaveBeenCalledWith("Retrying HTTP request", {
        url: "/test",
        attempt: 1,
      });
    });
  });
});
