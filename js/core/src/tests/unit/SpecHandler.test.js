/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

/**
 * @fileoverview
 * @module
 *
 * @author zhifengzhang-sz
 * @date 2024-11-05
 */

// js/tests/unit/SpecHandler.test.js

import { SpecHandler, CliConfig } from '@qi/core/cli';
import { logger } from '@qi/core/logger';

// Mock logger to suppress or inspect log outputs during tests
jest.mock('@qi/core/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('SpecHandler', () => {
  let specHandler;
  let cliConfig;

  beforeAll(() => {
    // Mock configuration data
    const mockSpec = {
      prompt: 'CLI> ',
      cmd: {
        param_cmd: [
          {
            name: 'set',
            action: 'set',
            description: 'Sets a parameter value',
            arguments: ['paramName', 'paramValue'],
          },
          {
            name: 'get',
            action: 'get',
            description: 'Retrieves a parameter value',
            arguments: ['paramName'],
          },
          {
            name: 'reset',
            action: 'reset',
            description: 'Resets a parameter to its default value',
            arguments: ['paramName'],
          },
        ],
        system_cmd: ['?', 'quit'],
      },
      parameters: {
        timeout: {
          type: 'number',
          default: 30,
        },
      },
    };

    // Mock validators
    const mockValidators = {
      SetCommandArgs: jest.fn((data) => {
        if (typeof data.name !== 'string' || typeof data.value !== 'string') {
          SetCommandArgs.errors = [
            { instancePath: '/name', message: 'must be string' },
            { instancePath: '/value', message: 'must be string' },
          ];
          return false;
        }
        return true;
      }),
      GetResetCommandArgs: jest.fn((data) => {
        if (typeof data.name !== 'string') {
          GetResetCommandArgs.errors = [
            { instancePath: '/name', message: 'must be string' },
          ];
          return false;
        }
        return true;
      }),
    };

    // Mock CliConfig
    cliConfig = {
      getSpec: jest.fn(() => mockSpec),
      getValidationSchema: jest.fn(() => mockValidators),
    };

    specHandler = new SpecHandler(cliConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateParamCommand', () => {
    test('should validate "set" command with correct arguments', () => {
      const cmd = 'set';
      const args = ['timeout', '60'];

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(`Validating parameter command: 'set'`);
      expect(logger.info).toHaveBeenCalledWith(`Arguments: timeout 60`);
      expect(logger.info).toHaveBeenCalledWith(expect.any(Array));
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('should invalidate "set" command with incorrect number of arguments', () => {
      const cmd = 'set';
      const args = ['timeout'];

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Usage: set <paramName> <paramValue>');
    });

    test('should invalidate "set" command with incorrect argument types', () => {
      const cmd = 'set';
      const args = [123, true]; // Invalid types

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Validation errors for command 'set':");
      expect(logger.error).toHaveBeenCalledWith('  /name must be string');
      expect(logger.error).toHaveBeenCalledWith('  /value must be string');
    });

    test('should validate "get" command with correct arguments', () => {
      const cmd = 'get';
      const args = ['timeout'];

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(`Validating parameter command: 'get'`);
      expect(logger.info).toHaveBeenCalledWith(`Arguments: timeout`);
      expect(logger.info).toHaveBeenCalledWith(expect.any(Array));
      expect(logger.error).not.toHaveBeenCalled();
    });

    test('should invalidate "get" command with incorrect number of arguments', () => {
      const cmd = 'get';
      const args = [];

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Usage: get <paramName>');
    });

    test('should invalidate "get" command with incorrect argument types', () => {
      const cmd = 'get';
      const args = [42]; // Invalid type

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Validation errors for command 'get':");
      expect(logger.error).toHaveBeenCalledWith('  /name must be string');
    });

    test('should return false for unknown commands', () => {
      const cmd = 'unknown';
      const args = ['someArg'];

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Parameter command not found: 'unknown'");
    });

    test('should return false if validator is missing for a command', () => {
      // Mock a command without a validator
      specHandler.spec.cmd.param_cmd.push({
        name: 'delete',
        action: 'delete',
        description: 'Deletes a parameter',
        arguments: ['paramName'],
      });

      const cmd = 'delete';
      const args = ['timeout'];

      const result = specHandler.validateParamCommand(cmd, args);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith("Validator for command 'delete' not found.");
    });
  });
});