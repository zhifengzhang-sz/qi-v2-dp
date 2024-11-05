// js/core/src/tests/imports.test.ts
import { describe, it, expect } from '@jest/globals';
import * as Core from '@qi/core';
import * as Cli from '@qi/core/cli';
import * as Errors from '@qi/core/errors';
import * as Services from '@qi/core/services';
import * as Cache from '@qi/core/cache';
import * as Utils from '@qi/core/utils';

describe('Core Module Imports', () => {
  it('should have TSDBConnection defined in Core', () => {
    expect(Core.TSDBConnection).toBeDefined();
  });

  it('should have logger defined in Core', () => {
    expect(Core.logger).toBeDefined();
  });

  it('should have RedisCache defined in Core', () => {
    expect(Core.RedisCache).toBeDefined();
  });

  it('should have TimescaleDB models defined in Core', () => {
    expect(Core.Market).toBeDefined();
    expect(Core.Instrument).toBeDefined();
    expect(Core.OHLCV).toBeDefined();
  });

  it('should have ConfigHandler defined in Core', () => {
    expect(Core.ConfigHandler).toBeDefined();
  });
});

describe('CLI Module Imports', () => {
  it('should have CliConfig defined in CLI', () => {
    expect(Cli.CliConfig).toBeDefined();
  });

  // Add more CLI import tests as needed
});

describe('Errors Module Imports', () => {
  it('should have defined custom errors', () => {
    expect(Errors.CustomError).toBeDefined();
    // Replace with actual error class names
  });

  // Add more Errors import tests as needed
});

describe('Services Module Imports', () => {
  it('should have KafkaService defined in Services', () => {
    expect(Services.KafkaService).toBeDefined();
  });

  it('should have other services defined', () => {
    expect(Services.SomeOtherService).toBeDefined();
    // Replace with actual service class names
  });

  // Add more Services import tests as needed
});

describe('Cache Module Imports', () => {
  it('should have RedisCache defined in Cache', () => {
    expect(Cache.RedisCache).toBeDefined();
  });

  // Add more Cache import tests as needed
});

describe('Utils Module Imports', () => {
  it('should have utility functions defined', () => {
    expect(Utils.someUtilityFunction).toBeDefined();
    // Replace with actual utility function names
  });

  // Add more Utils import tests as needed
});