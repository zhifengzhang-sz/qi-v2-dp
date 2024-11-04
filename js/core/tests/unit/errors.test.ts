/**
 * @module tests/unit/errors
 * @description Unit tests for error classes
 */

import {
  ApplicationError,
  ValidationError,
  DatabaseError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ExternalServiceError,
  RateLimitError,
  ConfigurationError,
  CacheError
} from '@qi/core/errors';

describe('ApplicationError', () => {
  it('should create error with default values', () => {
    const error = new ApplicationError('Test error');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toBeUndefined();
  });

  it('should create error with custom values', () => {
    const error = new ApplicationError(
      'Custom error',
      'CUSTOM_CODE',
      418,
      { reason: 'testing' }
    );

    expect(error.message).toBe('Custom error');
    expect(error.code).toBe('CUSTOM_CODE');
    expect(error.statusCode).toBe(418);
    expect(error.details).toEqual({ reason: 'testing' });
  });
});

describe('ValidationError', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid input', {
      field: 'email',
      reason: 'format'
    });

    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({
      field: 'email',
      reason: 'format'
    });
  });
});

describe('DatabaseError', () => {
  it('should create database error', () => {
    const error = new DatabaseError('Database connection failed', {
      table: 'users',
      operation: 'insert'
    });

    expect(error.message).toBe('Database connection failed');
    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({
      table: 'users',
      operation: 'insert'
    });
  });
});

describe('NotFoundError', () => {
  it('should create not found error', () => {
    const error = new NotFoundError('User not found', { id: 123 });

    expect(error.message).toBe('User not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ id: 123 });
  });
});

describe('AuthenticationError', () => {
  it('should create authentication error', () => {
    const error = new AuthenticationError('Invalid credentials');

    expect(error.message).toBe('Invalid credentials');
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(401);
  });
});

describe('AuthorizationError', () => {
  it('should create authorization error', () => {
    const error = new AuthorizationError('Insufficient permissions', {
      required: 'admin',
      actual: 'user'
    });

    expect(error.message).toBe('Insufficient permissions');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.statusCode).toBe(403);
    expect(error.details).toEqual({
      required: 'admin',
      actual: 'user'
    });
  });
});

describe('ExternalServiceError', () => {
  it('should create external service error', () => {
    const error = new ExternalServiceError('API request failed', {
      service: 'payment',
      status: 500
    });

    expect(error.message).toBe('API request failed');
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
    expect(error.statusCode).toBe(502);
    expect(error.details).toEqual({
      service: 'payment',
      status: 500
    });
  });
});

describe('RateLimitError', () => {
  it('should create rate limit error', () => {
    const error = new RateLimitError('Too many requests', {
      limit: 100,
      reset: 60
    });

    expect(error.message).toBe('Too many requests');
    expect(error.code).toBe('RATE_LIMIT_ERROR');
    expect(error.statusCode).toBe(429);
    expect(error.details).toEqual({
      limit: 100,
      reset: 60
    });
  });
});

describe('ConfigurationError', () => {
  it('should create configuration error', () => {
    const error = new ConfigurationError('Invalid configuration', {
      key: 'API_KEY',
      reason: 'missing'
    });

    expect(error.message).toBe('Invalid configuration');
    expect(error.code).toBe('CONFIGURATION_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({
      key: 'API_KEY',
      reason: 'missing'
    });
  });
});

describe('CacheError', () => {
  it('should create cache error', () => {
    const error = new CacheError('Cache operation failed', {
      operation: 'set',
      key: 'user:123'
    });

    expect(error.message).toBe('Cache operation failed');
    expect(error.code).toBe('CACHE_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.details).toEqual({
      operation: 'set',
      key: 'user:123'
    });
  });
});