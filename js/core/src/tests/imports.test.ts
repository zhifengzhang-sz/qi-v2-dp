// src/tests/imports.test.ts
import { describe, it, expect } from '@jest/globals';  // Add this import
import { Database } from 'qi/core/db';
import { logger } from 'qi/core/utils';
import { Cache } from 'qi/core/cache';
import { Market, Instrument, OHLCV } from 'qi/core/db/models/cryptocompare';
import { validateConfig } from 'qi/core/config';

describe('Import Tests', () => {
  it('should import Database', () => {
    expect(Database).toBeDefined();
  });

  it('should import logger', () => {
    expect(logger).toBeDefined();
  });

  it('should import Cache', () => {
    expect(Cache).toBeDefined();
  });

  it('should import models', () => {
    expect(Market).toBeDefined();
    expect(Instrument).toBeDefined();
    expect(OHLCV).toBeDefined();
  });

  it('should import config validator', () => {
    expect(validateConfig).toBeDefined();
  });
});