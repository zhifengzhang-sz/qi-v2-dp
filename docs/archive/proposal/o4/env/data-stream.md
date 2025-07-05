# Data Stream Environment Configurations

## Redpanda Cluster (Dev)
- Version: 23.3.1
- Deployment: Docker Compose (see `deploy/redpanda-compose.yml`)
- Brokers: 3 replicas
- CPU: 2 cores each
- Memory: 4GB each
- Storage: Host-mounted volumes, 50GB each
- TLS: Enabled with self-signed certs

## Kafka Cluster (Dev)
- Version: 3.5.0
- Deployment: Kubernetes (Helm chart `bitnami/kafka`)
- Brokers: 3 replicas
- CPU: 2 cores each
- Memory: 4GB each
- Storage: PVCs, 100GB each
- TLS: Enabled using cert-manager

## Common Configuration
- ZooKeeper: Embedded (Kafka Helm) vs built-in (Redpanda)
- Schema Registry: Confluent Schema Registry v7.3.0
- Topic Defaults: 3 partitions, RF=2, retention=7 days
