# Error Handling Documentation

This directory contains comprehensive documentation for the error handling system used in the QI platform.

## Contents

- [Error Handling Handbook](ERROR_HANDBOOK.md) - Complete documentation of the error handling system
- [Error Code Workflow](ERROR_CODE_WORKFLOW.md) - Guide for managing and adding new error codes
- [Examples](./examples) - Code examples and patterns

## Quick Start

1. Basic error handling:
```typescript
import { ApplicationError, ErrorCode } from "@qi/core/errors";

try {
  // Operation that might fail
} catch (error) {
  throw new ApplicationError(
    "Operation failed",
    ErrorCode.OPERATION_ERROR,
    500,
    { originalError: error }
  );
}
```

2. Service errors:
```typescript
import { ServiceError } from "@qi/core/errors";

try {
  await service.initialize();
} catch (error) {
  throw new ServiceError(
    "Service initialization failed",
    error,
    { serviceName: "redis" }
  );
}
```

## Further Reading

- [Error Codes Reference](ERROR_HANDBOOK.md#error-codes)
- [Best Practices](ERROR_HANDBOOK.md#best-practices)
- [Adding New Error Codes](ERROR_CODE_WORKFLOW.md#adding-new-error-codes)

## Contributing

When adding new error types or modifying error handling:

1. Review the [Error Code Workflow](ERROR_CODE_WORKFLOW.md)
2. Follow the established patterns in [examples](./examples/exmaples.md)
3. Update relevant documentation
4. Add tests for new error scenarios

