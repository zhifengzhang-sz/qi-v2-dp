# Avro Setup Guide

## Prerequisites
- Node.js 16.x or later
- npm or yarn 
- TypeScript 4.x or later

## Installation

### 1. Install Required Package

```bash
# Using npm
npm install avsc

# Using yarn
yarn add avsc
```

### 2. Configure TypeScript

Ensure your `tsconfig.json` has the following settings to handle Avro schema files:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true,
  }
}
```

### 3. Schema Loading Configuration

#### Option A: Using webpack
If you're using webpack, add the following to your webpack config:

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.avsc$/,
        use: ['json-loader'],
        type: 'javascript/auto'
      }
    ]
  }
};
```

#### Option B: Using ts-node
For development with ts-node, add these settings to your `tsconfig.json`:

```json
{
  "ts-node": {
    "require": ["tsconfig-paths/register"],
    "files": true
  }
}
```

## Verification

Create a test file to verify the installation:

```typescript
import { Type } from 'avsc';

const schema = {
  type: 'record',
  name: 'Test',
  fields: [{ name: 'message', type: 'string' }]
};

const type = Type.forSchema(schema);
console.log('Avro setup successful!');
```

Run the test:
```bash
ts-node test.ts
```

## Additional Tools

For development and testing:

```bash
# Schema validation tool
npm install --save-dev avro-schema-validator

# Schema registry client (if using Confluent Schema Registry)
npm install --save @kafkajs/confluent-schema-registry
```