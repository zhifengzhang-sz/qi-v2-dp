# QiCore Testing Architecture

This directory contains comprehensive documentation for the QiCore Crypto Data Platform's production-grade testing system.

## Overview

QiCore implements a **No-Mocking Testing Philosophy** with a two-phase testing architecture that provides honest production readiness signals. The testing system validates real external services and uses actual API data for comprehensive validation.

## Documentation Structure

### Core Testing Guides
- [**No-Mocking Philosophy**](./no-mocking-philosophy.md) - Why we avoid mocking and use real data
- [**Two-Phase Architecture**](./two-phase-architecture.md) - Complete setup and validation system
- [**Test Categories**](./test-categories.md) - Unit, integration, and system test breakdown

### Implementation Details
- [**Phase 1: Data Collection**](./phase1-data-collection.md) - One-time real data setup
- [**Phase 2: Service Validation**](./phase2-service-validation.md) - Per-test infrastructure checks
- [**Rate Limiting & Resilience**](./rate-limiting.md) - Handling real-world API constraints
- [**Real Data Fixtures**](./real-data-fixtures.md) - Managing test data from APIs

### Developer Guides
- [**Running Tests**](./running-tests.md) - Commands and workflows
- [**Troubleshooting**](./troubleshooting.md) - Common issues and solutions
- [**Adding New Tests**](./adding-new-tests.md) - Guidelines for test development

## Quick Start

```bash
# Run complete test suite
bun run test:unit && bun run test:integration:v1

# Set up test data (one-time)
bun run test:setup:phase1

# Validate services (per-test-run)
bun run test:setup:phase2
```

## Key Principles

1. **No Mocking Allowed**: All tests use real data or actual API responses
2. **Production Readiness**: Tests fail when real infrastructure is unavailable
3. **Rate Limiting Resilience**: Exponential backoff handles real-world constraints
4. **Auto-Infrastructure**: Missing databases and services are created automatically
5. **Fast Unit Tests**: Local mode bypasses external dependencies when appropriate

## Test Results (v1.0)

- ✅ **60/60 unit tests passing**
- ✅ **29/29 v1.0 integration tests passing** 
- ✅ **Real-time data validation with live Bitcoin prices**
- ✅ **External service integration: CoinGecko MCP, TimescaleDB, Redpanda**

---

*Last Updated: 2025-07-08 - v1.0 Release*