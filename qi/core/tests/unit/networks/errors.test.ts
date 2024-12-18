/**
 * @fileoverview Network Error Handling Tests
 * @module @qi/core/tests/unit/networks/errors.test
 */

import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { ApplicationError, ErrorCode } from "@qi/core/errors";
import {
  HttpStatusCode,
  mapHttpStatusToErrorCode,
  createNetworkError,
  transformAxiosError,
  mapWebSocketErrorToStatus,
} from "@qi/core/networks";

describe("Network Error Handling", () => {
  describe("mapHttpStatusToErrorCode", () => {
    it("should map authentication errors correctly", () => {
      expect(mapHttpStatusToErrorCode(HttpStatusCode.UNAUTHORIZED)).toBe(
        ErrorCode.AUTH_ERROR
      );
      expect(mapHttpStatusToErrorCode(HttpStatusCode.FORBIDDEN)).toBe(
        ErrorCode.AUTH_ERROR
      );
    });

    it("should map client errors correctly", () => {
      expect(mapHttpStatusToErrorCode(HttpStatusCode.NOT_FOUND)).toBe(
        ErrorCode.NOT_FOUND_ERROR
      );
      expect(mapHttpStatusToErrorCode(HttpStatusCode.TOO_MANY_REQUESTS)).toBe(
        ErrorCode.RATE_LIMIT_ERROR
      );
      expect(mapHttpStatusToErrorCode(HttpStatusCode.BAD_REQUEST)).toBe(
        ErrorCode.VALIDATION_ERROR
      );
      expect(
        mapHttpStatusToErrorCode(HttpStatusCode.UNPROCESSABLE_ENTITY)
      ).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it("should map timeout errors correctly", () => {
      expect(mapHttpStatusToErrorCode(HttpStatusCode.GATEWAY_TIMEOUT)).toBe(
        ErrorCode.TIMEOUT_ERROR
      );
      expect(mapHttpStatusToErrorCode(HttpStatusCode.REQUEST_TIMEOUT)).toBe(
        ErrorCode.TIMEOUT_ERROR
      );
    });

    it("should map server errors correctly", () => {
      expect(mapHttpStatusToErrorCode(HttpStatusCode.SERVICE_UNAVAILABLE)).toBe(
        ErrorCode.SERVICE_ERROR
      );
      expect(
        mapHttpStatusToErrorCode(HttpStatusCode.INTERNAL_SERVER_ERROR)
      ).toBe(ErrorCode.NETWORK_ERROR);
      expect(mapHttpStatusToErrorCode(HttpStatusCode.BAD_GATEWAY)).toBe(
        ErrorCode.NETWORK_ERROR
      );
    });

    it("should map rate limit errors correctly", () => {
      expect(mapHttpStatusToErrorCode(HttpStatusCode.TOO_MANY_REQUESTS)).toBe(
        ErrorCode.RATE_LIMIT_ERROR
      );
    });

    it("should default to operation error for unmapped status codes", () => {
      expect(mapHttpStatusToErrorCode(HttpStatusCode.OK)).toBe(
        ErrorCode.OPERATION_ERROR
      );
      expect(mapHttpStatusToErrorCode(HttpStatusCode.CREATED)).toBe(
        ErrorCode.OPERATION_ERROR
      );
    });
  });

  describe("createNetworkError", () => {
    it("should create error with default status code", () => {
      const error = createNetworkError("Network failure");
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.message).toBe("Network failure");
    });

    it("should create error with custom status code and context", () => {
      const context = { url: "https://api.example.com", method: "GET" };
      const error = createNetworkError(
        "Not Found",
        HttpStatusCode.NOT_FOUND,
        context
      );

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.statusCode).toBe(HttpStatusCode.NOT_FOUND);
      expect(error.code).toBe(ErrorCode.NOT_FOUND_ERROR);
      expect(error.message).toBe("Not Found");
      expect(error.details).toEqual(context);
    });
  });

  describe("transformAxiosError", () => {
    it("should transform AxiosError with response", () => {
      const axiosError = new AxiosError(
        "Bad Gateway",
        "ERR_BAD_GATEWAY",
        {
          url: "https://api.example.com",
          method: "GET",
          headers: new AxiosHeaders(),
        },
        undefined,
        {
          status: HttpStatusCode.BAD_GATEWAY,
          statusText: "Bad Gateway",
          data: null,
          headers: new AxiosHeaders(),
          config: {
            url: "https://api.example.com",
            method: "GET",
            headers: new AxiosHeaders(),
          },
        }
      );

      const error = transformAxiosError(axiosError);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.statusCode).toBe(HttpStatusCode.BAD_GATEWAY);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.details).toEqual({
        url: "https://api.example.com",
        method: "GET",
        code: "ERR_BAD_GATEWAY",
        response: {
          data: null,
          headers: expect.any(AxiosHeaders),
          status: HttpStatusCode.BAD_GATEWAY,
        },
      });
    });

    it("should transform AxiosError without response", () => {
      const axiosError = new AxiosError("Network Error", "ERR_NETWORK", {
        url: "https://api.example.com",
        method: "GET",
        headers: new AxiosHeaders(),
      });

      const error = transformAxiosError(axiosError);
      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.details).toEqual({
        url: "https://api.example.com",
        method: "GET",
        code: "ERR_NETWORK",
      });
    });

    it("should transform non-Axios errors", () => {
      const regularError = new Error("Unknown error");
      const error = transformAxiosError(regularError);

      expect(error).toBeInstanceOf(ApplicationError);
      expect(error.statusCode).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.details).toHaveProperty("error");
    });

    it("should transform axios error", () => {
      const axiosError = new AxiosError("Network Error", "ERR_NETWORK", {
        url: "https://api.example.com",
        method: "GET",
        headers: new AxiosHeaders(),
      });

      const error = transformAxiosError(axiosError);
      expect(error).toBeInstanceOf(ApplicationError);
    });

    it("should handle timeout errors", () => {
      const axiosError = new AxiosError("Timeout Error", "ECONNABORTED", {
        url: "https://api.example.com",
        method: "GET",
        headers: new AxiosHeaders(),
      });

      const error = transformAxiosError(axiosError);
      expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR);
    });
  });

  describe("mapWebSocketErrorToStatus", () => {
    it("should map WebSocket system errors to correct HTTP status codes", () => {
      expect(mapWebSocketErrorToStatus(new Error("ETIMEDOUT"))).toBe(
        HttpStatusCode.GATEWAY_TIMEOUT
      );
      expect(mapWebSocketErrorToStatus(new Error("ECONNREFUSED"))).toBe(
        HttpStatusCode.SERVICE_UNAVAILABLE
      );
      expect(mapWebSocketErrorToStatus(new Error("ECONNRESET"))).toBe(
        HttpStatusCode.BAD_GATEWAY
      );
      expect(mapWebSocketErrorToStatus(new Error("EPROTO"))).toBe(
        HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR
      );
      expect(mapWebSocketErrorToStatus(new Error("EMSGSIZE"))).toBe(
        HttpStatusCode.WEBSOCKET_MESSAGE_TOO_BIG
      );
    });

    it("should handle non-Error objects correctly", () => {
      expect(mapWebSocketErrorToStatus("ECONNREFUSED")).toBe(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mapWebSocketErrorToStatus(null)).toBe(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mapWebSocketErrorToStatus(undefined)).toBe(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mapWebSocketErrorToStatus({ message: "ECONNREFUSED" })).toBe(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    });

    it("should return INTERNAL_SERVER_ERROR for unknown error messages", () => {
      expect(mapWebSocketErrorToStatus(new Error("UNKNOWN_ERROR"))).toBe(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
      expect(mapWebSocketErrorToStatus(new Error(""))).toBe(
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    });
  });
});
