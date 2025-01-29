# setup_env.sh
#!/usr/bin/bash
echo "PGADMIN_DEFAULT_EMAIL=qi@tianyi.com" > .env
echo "PGADMIN_DEFAULT_PASSWORD=$(openssl rand -base64 12)" >> .env
echo "" >> .env
echo "# === PGAdmin Configuration ===" >> .env
echo "PGADMIN_DEFAULT_EMAIL=qi@tianyi.com" >> .env
echo "PGADMIN_DEFAULT_PASSWORD=$(openssl rand -base64 12)" >> .env
echo "" >> .env
echo "# === TimescaleDB/PostgreSQL Configuration ===" >> .env
echo "POSTGRES_HOST=timescaledb" >> .env
echo "POSTGRES_PORT=5432" >> .env
echo "POSTGRES_DATABASE=postgres" >> .env
echo "POSTGRES_USER=postgres" >> .env
echo "POSTGRES_PASSWORD=$(openssl rand -base64 12)" >> .env
echo "PGDATA=/var/lib/postgresql/data" >> .env
echo "" >> .env
echo "# === QuestDB Configuration ===" >> .env
echo "QDB_TELEMETRY_ENABLED=false" >> .env
echo "" >> .env
echo "# === Grafana Configuration ===" >> .env
echo "GF_INSTALL_PLUGINS=questdb-questdb-datasource;grafana-postgresql-datasource" >> .env
echo "" >> .env
echo "=== Redis Configuration ===" >> .env
# Uncomment and set if Redis authentication is enabled
echo "REDIS_PASSWORD=$(openssl rand -base64 12)" >> .env
echo "" >> .env
echo "# === Redpanda Configuration ===" >> .env
echo "REDPANDA_BROKER_ID=1" >> .env
echo "REDPANDA_ADVERTISED_KAFKA_API=localhost:9092" >> .env
echo "REDPANDA_ADVERTISED_SCHEMA_REGISTRY_API=localhost:8081" >> .env