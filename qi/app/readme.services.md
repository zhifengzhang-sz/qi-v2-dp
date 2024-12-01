# @qi/app

Application layer for the QI system.

## Features
- Service configuration management
- Redis client integration
- ES modules support
- TypeScript strict mode

## Project Structure
```
qi/app/
├── config/                  # Configuration files
│   ├── services-1.0.json   # Service configuration
│   └── services.env        # Environment variables
├── src/
│   ├── services/           # Service implementations
│   │   ├── config/         # Configuration service
│   │   │   └── index.ts
│   │   └── redis/         # Redis service
│   │       └── index.ts
│   └── services.main.ts    # Services entry point
└── package.json
```

## Getting Started

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start services
npm run start:services
```

## Configuration
Place your configuration files in the `config` directory:
- `services-1.0.json`: Service configuration
- `services.env`: Environment variables

## Usage
```typescript
import { initializeConfig } from './services/config';
import { initializeRedis } from './services/redis';

async function main() {
  // Initialize services
  const services = await initializeConfig();
  const redis = await initializeRedis();

  // Use services...
}
```