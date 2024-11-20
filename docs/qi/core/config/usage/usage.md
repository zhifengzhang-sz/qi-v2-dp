# Configuration Management System Usage Guide

## Table of Contents
1. [Basic Usage](#basic-usage)
2. [Schema Definition](#schema-definition)
3. [Loading Configurations](#loading-configurations)
4. [Environment Variables](#environment-variables)
5. [Caching](#caching)
6. [Change Detection](#change-detection)
7. [Error Handling](#error-handling)

## Basic Usage

### Setting Up Configuration Management

```typescript
import { ConfigFactory, Schema, JsonSchema, BaseConfig } from '@qi/core/config';

// 1. Define your configuration interface
interface AppConfig extends BaseConfig {
  port: number;
  host: string;
  database: {
    url: string;
    pool: number;
  };
}

// 2. Define schema
const schema: JsonSchema = {
  $id: 'app-config',
  type: 'object',
  properties: {
    port: { type: 'number', minimum: 1024 },
    host: { type: 'string' },
    database: {
      type: 'object',
      properties: {
        url: { type: 'string', format: 'uri' },
        pool: { type: 'number', default: 5 }
      },
      required: ['url']
    }
  },
  required: ['port', 'host']
};

// 3. Create factory and loader
const factory = new ConfigFactory(new Schema());
const loader = factory.createLoader<AppConfig>({
  type: 'app',
  version: '1.0',
  schema
});

// 4. Load configuration
const config = await loader.load();
```

## Schema Definition

### Using JSON Schema Validation

```typescript
const schema: JsonSchema = {
  $id: 'database-config',
  type: 'object',
  properties: {
    connections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          host: { type: 'string' },
          port: { type: 'number' },
          credentials: {
            type: 'object',
            properties: {
              username: { type: 'string' },
              password: { type: 'string' }
            },
            required: ['username', 'password']
          }
        },
        required: ['host', 'port']
      },
      minItems: 1
    },
    poolSize: { 
      type: 'number',
      minimum: 1,
      maximum: 100
    }
  }
};
```

## Loading Configurations

### Using JsonLoader

```typescript
// Load from file
const jsonLoader = new JsonLoader<AppConfig>(
  'config/app.json',
  schema,
  'app-config'
);
const config = await jsonLoader.load();

// Load from object
const configObject = {
  port: 3000,
  host: 'localhost',
  database: {
    url: 'postgresql://localhost:5432/mydb',
    pool: 10
  }
};

const objectLoader = new JsonLoader<AppConfig>(
  configObject,
  schema,
  'app-config'
);
```

## Environment Variables

### Using EnvLoader

```typescript
const envLoader = new EnvLoader<AppConfig>(schema, 'app-config', {
  path: '.env',
  override: true,
  extraFiles: ['.env.local'],
  required: true,
  watch: true,
  refreshInterval: 60000
});

const config = await envLoader.load();
```

## Caching

### Implementing Cache

```typescript
const cache = new ConfigCache<AppConfig>({
  ttl: 3600000, // 1 hour
  refreshOnAccess: true,
  onExpire: (key) => {
    console.log(`Cache expired for ${key}`);
  }
});

const cachedLoader = new CachedConfigLoader(jsonLoader, cache);
const config = await cachedLoader.load();
```

## Change Detection

### Watching for Changes

```typescript
loader.watch((event) => {
  console.log('Previous config:', event.previous);
  console.log('New config:', event.current);
  console.log('Change timestamp:', event.timestamp);
  console.log('Change source:', event.source);
});

// Stop watching
loader.unwatch();
```

## Error Handling

### Handling Configuration Errors

```typescript
try {
  const config = await loader.load();
} catch (error) {
  if (error instanceof ConfigError) {
    switch (error.code) {
      case CONFIG_ERROR_CODES.INVALID_SCHEMA:
        console.error('Schema validation failed:', error.message);
        break;
      case CONFIG_ERROR_CODES.CONFIG_LOAD_ERROR:
        console.error('Failed to load config:', error.message);
        break;
      case CONFIG_ERROR_CODES.ENV_LOAD_ERROR:
        console.error('Failed to load environment variables:', error.message);
        break;
    }
  }
}
```