/**
 * @module tests/jest.setup
 * @description Jest setup file for all tests
 */

// Load environment variables
import dotenv from 'dotenv';
import { logger } from '@qi/core/logger';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set required environment variables for tests
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'qi_test',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || '6379'
};

// Disable logging in tests
logger.transports.forEach((t) => (t.silent = true));

// Global test timeout
globalThis.jest?.setTimeout(10000);