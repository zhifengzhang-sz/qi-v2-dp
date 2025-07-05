# Schema Registry Configuration

This file defines the setup and best practices for the Avro/Protobuf schema registry used by our data-stream platform.

## Confluent Schema Registry (v7.3.0)
- **Endpoint**: `http://schema-registry.dev:8081`
- **Authentication**: Basic Auth via API key (configured in Helm chart)
- **Compatibility Level**: `BACKWARD` for production topics; `NONE` for experimental topics
- **Storage**: Kafka-backed internal topic `_schemas`

### Common Commands

Register a schema:
```
kafka-avro-console-producer \
  --broker-list redpanda:9092 \
  --topic _schemas \
  --property value.schema='{"type":"record","name":"Price","fields":[{"name":"symbol","type":"string"},{"name":"timestamp","type":"long"},{"name":"price","type":"double"}]}'
```

List all subjects:
```
curl -s http://schema-registry.dev:8081/subjects
```

Check compatibility:
```
curl -s -X GET http://schema-registry.dev:8081/config/PriceDataTopic-value
```

## Best Practices

- Store all schema definitions in `schemas/` directory (version-controlled).
- Enforce schema validation in CI (use `avro-tools` or `protobuf-lint`).
- Tag schemas with semantic versions and include change logs.
