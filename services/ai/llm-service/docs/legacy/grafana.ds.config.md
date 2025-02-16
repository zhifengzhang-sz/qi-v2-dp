# Grafana Datasource Configuration Guide

## Available Datasource Types

For our LLM Service, we can configure several types of datasources:

1. SQLite (Primary metrics storage)
2. Prometheus (If using for additional metrics)
3. Loki (If using for log aggregation)
4. PostgreSQL (If using for long-term metrics storage)

## Datasource Configuration Files

Place all datasource configurations in `metrics/grafana/provisioning/datasources/`:

```
metrics/grafana/provisioning/datasources/
├── sqlite.yaml      # Main metrics database
├── prometheus.yaml  # Optional Prometheus metrics
├── loki.yaml       # Optional log aggregation
└── postgres.yaml   # Optional long-term storage
```

## Configuration Examples

### 1. SQLite (Primary)

```yaml
# metrics/grafana/provisioning/datasources/sqlite.yaml
apiVersion: 1

datasources:
  - name: SQLite
    type: sqlite
    uid: sqlite
    access: proxy
    isDefault: true
    jsonData:
      path: /metrics/db/metrics.db
    version: 1
```

### 2. Prometheus

```yaml
# metrics/grafana/provisioning/datasources/prometheus.yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    uid: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: false
    jsonData:
      timeInterval: "15s"
    version: 1
```

### 3. Loki

```yaml
# metrics/grafana/provisioning/datasources/loki.yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    uid: loki
    access: proxy
    url: http://loki:3100
    isDefault: false
    jsonData:
      maxLines: 1000
    version: 1
```

### 4. PostgreSQL

```yaml
# metrics/grafana/provisioning/datasources/postgres.yaml
apiVersion: 1

datasources:
  - name: PostgreSQL
    type: postgres
    uid: postgres
    access: proxy
    url: postgres:5432
    database: metrics
    user: ${POSTGRES_USER}
    secureJsonData:
      password: ${POSTGRES_PASSWORD}
    jsonData:
      sslmode: "disable"
      maxOpenConns: 100
      maxIdleConns: 100
      connMaxLifetime: 14400
    version: 1
```

## Docker Compose Integration

Update your docker-compose.yml to include additional datasources:

```yaml
services:
  metrics-viewer:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - ./metrics/grafana/dashboards:/var/lib/grafana/dashboards
      - ./metrics/grafana/provisioning:/etc/grafana/provisioning
      - ./metrics/db:/metrics/db
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=frser-sqlite-datasource,grafana-postgresql-datasource
      # Add environment variables for datasource credentials
      - POSTGRES_USER=metrics_user
      - POSTGRES_PASSWORD=secure_password
    depends_on:
      - llm-service
      # Add dependencies for additional datasources
      - prometheus
      - loki
      - postgres

  # Add additional service definitions for each datasource
  prometheus:
    image: prom/prometheus
    volumes:
      - ./metrics/prometheus:/etc/prometheus
    ports:
      - "9090:9090"

  loki:
    image: grafana/loki
    ports:
      - "3100:3100"

  postgres:
    image: postgres:latest
    environment:
      - POSTGRES_USER=metrics_user
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=metrics
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Datasource Setup Steps

1. Install required plugins:

```bash
docker-compose exec metrics-viewer grafana-cli plugins install grafana-postgresql-datasource
```

2. Create datasource configurations:

```bash
mkdir -p metrics/grafana/provisioning/datasources
cp datasource-configs/*.yaml metrics/grafana/provisioning/datasources/
```

3. Configure environment variables:

```bash
# .env file
POSTGRES_USER=metrics_user
POSTGRES_PASSWORD=secure_password
```

4. Restart Grafana to apply changes:

```bash
docker-compose restart metrics-viewer
```

## Verification

1. Check datasource status:

   - Access Grafana UI (http://localhost:3000)
   - Navigate to Configuration > Data Sources
   - Verify each datasource shows "Working" status

2. Test queries:
   - Create a new dashboard
   - Add a panel
   - Select different datasources and run test queries

## Troubleshooting

### Common Issues

1. Connection Failed

```bash
# Check service availability
docker-compose ps

# View connection logs
docker-compose logs metrics-viewer
```

2. Authentication Issues

```bash
# Verify environment variables
docker-compose exec metrics-viewer env | grep POSTGRES

# Check datasource configuration
cat metrics/grafana/provisioning/datasources/postgres.yaml
```

3. Plugin Missing

```bash
# List installed plugins
docker-compose exec metrics-viewer grafana-cli plugins ls

# Install missing plugin
docker-compose exec metrics-viewer grafana-cli plugins install <plugin-name>
```

## Best Practices

1. Security:

   - Use environment variables for credentials
   - Implement proper access controls
   - Regularly rotate passwords

2. Performance:

   - Configure appropriate connection limits
   - Set up query caching where applicable
   - Monitor datasource performance

3. Maintenance:
   - Regular backup of configurations
   - Monitor disk usage
   - Update plugins and datasources regularly
