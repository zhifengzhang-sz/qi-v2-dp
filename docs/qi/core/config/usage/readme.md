# Configuration Management System

A robust, type-safe configuration management system for TypeScript/Node.js applications with JSON Schema validation, environment variable support, and caching capabilities.

## Features

- **Type-Safe Configuration**: Full TypeScript support with interface-based configuration definitions
- **Schema Validation**: JSON Schema-based validation with custom validation rules
- **Multiple Sources**: Support for JSON files and environment variables
- **Caching**: Built-in caching system with TTL and refresh policies
- **Change Detection**: Watch for configuration changes with event notifications
- **Extensible**: Plugin-based architecture for custom loaders and validators
- **Error Handling**: Comprehensive error types and detailed error messages

## Installation

```bash
npm install @qi/core
```

## Quick Start

```typescript
import { ConfigFactory, Schema, JsonSchema } from '@qi/core/config';

// Define your configuration schema
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

// Create configuration factory
const factory = new ConfigFactory(new Schema());

// Create and use configuration loader
const loader = factory.createLoader({
  type: 'app',
  version: '1.0',
  schema
});

// Load configuration
const config = await loader.load();
```

## Key Components

- **ConfigFactory**: Central factory for creating loaders and validators
- **Schema**: JSON Schema management and validation
- **JsonLoader**: JSON file-based configuration loader
- **EnvLoader**: Environment variable-based configuration loader
- **ConfigCache**: Configuration caching with TTL support
- **SchemaValidator**: Schema validation implementation

## Documentation

- [API Documentation](./docs/api.md)
- [Usage Guide](./docs/usage.md)
- [Class Diagram](./docs/diagram.md)

## Error Handling

The system provides detailed error types for different failure scenarios:

- `ConfigError`: Base error type for configuration-related errors
- Specific error types for validation, loading, and schema-related issues
- Detailed error messages with context information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License

## Acknowledgments

Built with:
- TypeScript
- ajv (JSON Schema validation)
- Winston (logging)