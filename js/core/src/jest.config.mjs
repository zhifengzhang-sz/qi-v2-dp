// jest.config.mjs

const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  moduleNameMapper: {
    '^@qi/core/(.*)$': '<rootDir>/dist/$1',
    '^@qi/cli/(.*)$': '<rootDir>/dist/cli/$1',
    '^@qi/errors/(.*)$': '<rootDir>/dist/errors/$1',
    '^@qi/services/(.*)$': '<rootDir>/dist/services/$1',
    '^@qi/cache/(.*)$': '<rootDir>/dist/cache/$1',
    '^@qi/utils/(.*)$': '<rootDir>/dist/utils/$1',
    '^@qi/websocket/(.*)$': '<rootDir>/dist/websocket/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
  moduleFileExtensions: ['ts', 'js'],
  moduleDirectories: ['node_modules', 'dist']
};

export default config;
