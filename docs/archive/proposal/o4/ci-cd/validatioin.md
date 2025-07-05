# CI/CD Validation Overview

This document describes the integration and performance tests, thresholds, and workflows needed to validate our data-stream platform and agents.

## Integration Tests

### StreamConnector POC
- Validate end-to-end publish/subscribe with both Redpanda and Kafka.
- Ensure message integrity (schema validation, payload correctness).
- Use Mocha/Jest in TypeScript with Docker-based test fixtures.

### Agent Workflow Tests
- Simulate a full data flow: Publisher → Topic → Consumer.
- Validate that agent workflows complete without errors and meet throughput targets.

## Performance Thresholds

| Metric                   | Threshold (Redpanda) | Threshold (Kafka) |
|--------------------------|----------------------|-------------------|
| Throughput (msgs/sec)    | ≥ 10,000             | ≥ 8,000           |
| End-to-End Latency (ms)  | ≤ 50                | ≤ 100             |

## Automated Pipelines

1. **Build**: Lint, compile, and containerize (`npm run build && docker build`).
2. **Test**: Run unit tests, integration tests, and performance tests.
3. **Publish**: Push Docker images and npm packages.
4. **Deploy (Staging)**: Helm upgrade to staging cluster.
5. **Smoke Test**: Run quick POC tests to validate deploy.

## Failure Policies

- On test failures: Send Slack notifications with logs.
- On performance regression: Block merge and tag issue for investigation.
