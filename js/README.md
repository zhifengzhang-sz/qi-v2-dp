# Qi Data Platform

A modular TypeScript/JavaScript data platform for cryptocurrency data processing.

## Project Structure

The project is organized into several modules:

```
qi/
├── core/               # Core functionality and shared code
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── api/               # REST API service
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── producer/          # Data producer service
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── consumer/          # Data consumer service
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── package.json       # Root package.json
└── tsconfig.json      # Base TypeScript configuration
```

## Module Overview

- **core**: Contains shared functionality, database models, utilities, and common types
- **api**: REST API service for data access
- **producer**: Service for collecting and producing data from various sources
- **consumer**: Service for consuming and processing data streams

## Setup

1. Install dependencies:
```bash
npm install
```

This will install dependencies for all modules thanks to npm workspaces.

2. Build all modules:
```bash
npm run build
```

## Development

Each module can be developed independently while sharing core functionality:

```bash
# Work on core module
cd core
npm run build
npm test

# Work on API service
cd api
npm run build
npm test

# Similarly for producer and consumer
```

## Import Examples

Code in each module can import from core or other modules:

```typescript
// In api/src/controllers/market.ts
import { Market } from '@qi/core/db/models/cryptocompare/market';
import { DatabaseConnection } from '@qi/core/db/connection';

// In producer/src/services/dataCollector.ts
import { Instrument } from '@qi/core/db/models/cryptocompare/instrument';
import { logger } from '@qi/core/utils/logger';

// In consumer/src/processors/tickProcessor.ts
import { Tick } from '@qi/core/db/models/cryptocompare/tick';
```

## Configuration

Environment variables are managed through the core module's configuration system:

```typescript
import { EnvValidator } from '@qi/core/config/validator';

const env = EnvValidator.getInstance();
env.validateEnv();

const dbHost = env.getRequiredEnv('DB_HOST');
const logLevel = env.getOptionalEnv('LOG_LEVEL', 'info');
```

Required environment variables:
- NODE_ENV
- DB_HOST
- DB_PORT
- DB_NAME
- DB_USER
- DB_PASSWORD
- REDIS_HOST
- REDIS_PORT

Optional environment variables:
- LOG_LEVEL (default: 'info')
- API_PORT (default: '3000')