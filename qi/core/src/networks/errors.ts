/**
 * @fileoverview Network Error Handling Module
 * @module @qi/core/networks/errors
 *
 * @description
 * Provides network-specific error handling, including HTTP and WebSocket errors.
 * Integrates with the core error system while providing network-specific functionality.
 *
 * @author zhifengzhang-sz
 * @created 2024-12-12
 * @modified 2024-12-12
 */

import { ApplicationError, ErrorCode } from "@qi/core/errors";
import { AxiosError, HttpStatusCode as AxiosHttpStatusCode } from "axios";

/**
 * Network error context interface
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

/**
 * HTTP Status Codes
 */
export const HttpStatusCode = {
  // 2xx Success
  OK: AxiosHttpStatusCode.Ok,
  CREATED: AxiosHttpStatusCode.Created,
  ACCEPTED: AxiosHttpStatusCode.Accepted,
  NO_CONTENT: AxiosHttpStatusCode.NoContent,

  // 3xx Redirection
  MOVED_PERMANENTLY: AxiosHttpStatusCode.MovedPermanently,
  FOUND: AxiosHttpStatusCode.Found,
  NOT_MODIFIED: AxiosHttpStatusCode.NotModified,
  TEMPORARY_REDIRECT: AxiosHttpStatusCode.TemporaryRedirect,

  // 4xx Client Errors
  BAD_REQUEST: AxiosHttpStatusCode.BadRequest,
  UNAUTHORIZED: AxiosHttpStatusCode.Unauthorized,
  FORBIDDEN: AxiosHttpStatusCode.Forbidden,
  NOT_FOUND: AxiosHttpStatusCode.NotFound,
  REQUEST_TIMEOUT: AxiosHttpStatusCode.RequestTimeout,
  METHOD_NOT_ALLOWED: AxiosHttpStatusCode.MethodNotAllowed,
  CONFLICT: AxiosHttpStatusCode.Conflict,
  UNPROCESSABLE_ENTITY: AxiosHttpStatusCode.UnprocessableEntity,
  TOO_MANY_REQUESTS: AxiosHttpStatusCode.TooManyRequests,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: AxiosHttpStatusCode.InternalServerError,
  NOT_IMPLEMENTED: AxiosHttpStatusCode.NotImplemented,
  BAD_GATEWAY: AxiosHttpStatusCode.BadGateway,
  SERVICE_UNAVAILABLE: AxiosHttpStatusCode.ServiceUnavailable,
  GATEWAY_TIMEOUT: AxiosHttpStatusCode.GatewayTimeout,

  // WebSocket Status Codes
  WEBSOCKET_NORMAL_CLOSURE: 1000,
  WEBSOCKET_GOING_AWAY: 1001,
  WEBSOCKET_PROTOCOL_ERROR: 1002,
  WEBSOCKET_UNSUPPORTED_DATA: 1003,
  WEBSOCKET_INVALID_FRAME: 1007,
  WEBSOCKET_POLICY_VIOLATION: 1008,
  WEBSOCKET_MESSAGE_TOO_BIG: 1009,
  WEBSOCKET_INTERNAL_ERROR: 1011,
} as const;

export type HttpStatusCodeType =
  (typeof HttpStatusCode)[keyof typeof HttpStatusCode];

/**
 * Maps HTTP status codes to appropriate application error codes
 */
export function mapHttpStatusToErrorCode(
  status: HttpStatusCodeType
): ErrorCode {
  switch (status) {
    case HttpStatusCode.UNAUTHORIZED:
    case HttpStatusCode.FORBIDDEN:
      return ErrorCode.AUTH_ERROR;
    case HttpStatusCode.NOT_FOUND:
      return ErrorCode.NOT_FOUND_ERROR;
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return ErrorCode.RATE_LIMIT_ERROR;
    case HttpStatusCode.BAD_REQUEST:
    case HttpStatusCode.UNPROCESSABLE_ENTITY:
      return ErrorCode.VALIDATION_ERROR;
    case HttpStatusCode.GATEWAY_TIMEOUT:
    case HttpStatusCode.REQUEST_TIMEOUT:
      return ErrorCode.TIMEOUT_ERROR;
    case HttpStatusCode.SERVICE_UNAVAILABLE:
      return ErrorCode.SERVICE_ERROR;
    default:
      if (status >= HttpStatusCode.INTERNAL_SERVER_ERROR) {
        return ErrorCode.NETWORK_ERROR;
      }
      return ErrorCode.OPERATION_ERROR;
  }
}

/**
 * Creates a network-specific application error
 */
export function createNetworkError(
  message: string,
  statusCode: HttpStatusCodeType = HttpStatusCode.INTERNAL_SERVER_ERROR,
  context?: NetworkErrorContext
): ApplicationError {
  const errorCode = mapHttpStatusToErrorCode(statusCode);
  return new ApplicationError(message, errorCode, statusCode, context);
}

/**
 * Maps WebSocket errors to appropriate HTTP status codes
 */
export function mapWebSocketErrorToStatus(error: unknown): HttpStatusCodeType {
  if (error instanceof Error) {
    switch (error.message) {
      case "ETIMEDOUT":
        return HttpStatusCode.GATEWAY_TIMEOUT;
      case "ECONNREFUSED":
        return HttpStatusCode.SERVICE_UNAVAILABLE;
      case "ECONNRESET":
        return HttpStatusCode.BAD_GATEWAY;
      case "EPROTO":
        return HttpStatusCode.WEBSOCKET_PROTOCOL_ERROR;
      case "EMSGSIZE":
        return HttpStatusCode.WEBSOCKET_MESSAGE_TOO_BIG;
      default:
        return HttpStatusCode.INTERNAL_SERVER_ERROR;
    }
  }
  return HttpStatusCode.INTERNAL_SERVER_ERROR;
}

/**
 * Transforms Axios errors into application errors
 */
export function transformAxiosError(error: unknown): ApplicationError {
  if (error instanceof AxiosError) {
    const status =
      error.response?.status || HttpStatusCode.INTERNAL_SERVER_ERROR;
    return createNetworkError(error.message, status, {
      url: error.config?.url,
      method: error.config?.method,
      code: error.code,
      response: error.response && {
        data: error.response.data,
        headers: error.response.headers,
        status: error.response.status,
      },
    });
  }

  return createNetworkError(
    error instanceof Error ? error.message : "Unknown network error",
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    {
      error: error instanceof Error ? error.stack : String(error),
    }
  );
}
