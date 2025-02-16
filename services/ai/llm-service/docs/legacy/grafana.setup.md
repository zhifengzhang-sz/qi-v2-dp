# Grafana Setup Guide

## Directory Structure

Place your Grafana configurations in the following structure:

```
metrics/
├── grafana/
│   ├── dashboards/          # Dashboard JSON configurations
│   ├── datasources/         # Datasource configurations
│   └── provisioning/        # Grafana provisioning configs
```

```
metrics/
├── grafana/
│   ├── dashboards/          # Dashboard JSON configurations
│   │   ├── main.json       
│   │   └── alerts.json
│   ├── datasources/         # Datasource configurations
│   │   └── sqlite.yaml
│   └── provisioning/        # Grafana provisioning configs
│       ├── dashboards/
│       │   └── default.yaml
│       └── datasources/
│           └── default.yaml
```

## Setup Steps

1. Create the directory structure:

```bash
mkdir -p metrics/grafana/{dashboards,datasources,provisioning/{dashboards,datasources}}
```

2. Configure the SQLite datasource:

```bash
# metrics/grafana/provisioning/datasources/default.yaml
apiVersion: 1

datasources:
  - name: SQLite
    type: sqlite
    uid: sqlite
    access: proxy
    isDefault: true
    jsonData:
      path: /metrics/db/metrics.db
```

3. Configure dashboard provisioning:

```bash
# metrics/grafana/provisioning/dashboards/default.yaml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

4. Place the dashboard configuration:

```bash
# Copy the dashboard JSON to the dashboards directory
cp metrics/dashboards/main.json metrics/grafana/dashboards/
```

5. Update docker-compose.yml to include Grafana configurations:

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
      - GF_INSTALL_PLUGINS=frser-sqlite-datasource
    depends_on:
      - llm-service
```

## Initial Access

1. Access Grafana:

   - URL: http://localhost:3000
   - Username: admin
   - Password: admin (as set in docker-compose.yml)

2. Verify datasource:

   - Navigate to Configuration > Data Sources
   - The SQLite datasource should be automatically configured
   - Click "Test" to verify the connection

3. View dashboards:
   - Navigate to Dashboards
   - The main dashboard should be automatically loaded
   - If not, click "Browse" and select "LLM Service Metrics"

## Dashboard Customization

1. Edit existing dashboard:

   - Click the dashboard settings (gear icon)
   - Make desired changes
   - Save the dashboard
   - Export the JSON to maintain changes in version control

2. Create new dashboard:
   - Click "+ Create" > "Dashboard"
   - Add desired panels
   - Save the dashboard
   - Export the JSON to `metrics/grafana/dashboards/`

## Metrics Queries

Example queries for dashboard panels:

1. Memory Usage:

```sql
SELECT
  timestamp as time,
  memory_usage_mb as value
FROM system_metrics
ORDER BY timestamp DESC
LIMIT 100
```

2. CPU Usage:

```sql
SELECT
  timestamp as time,
  cpu_percent as value
FROM system_metrics
ORDER BY timestamp DESC
LIMIT 100
```

3. Model Performance:

```sql
SELECT
  timestamp as time,
  avg_inference_time as value
FROM system_metrics
ORDER BY timestamp DESC
LIMIT 100
```

## Troubleshooting

1. Dashboard not loading:

   - Check provisioning logs:

   ```bash
   docker-compose logs metrics-viewer
   ```

   - Verify file permissions
   - Check dashboard JSON syntax

2. Data not appearing:

   - Verify metrics database exists
   - Check datasource connection
   - Validate SQL queries

3. Plugin issues:
   - Verify plugin installation:
   ```bash
   docker-compose exec metrics-viewer grafana-cli plugins ls
   ```
   - Reinstall plugin if needed:
   ```bash
   docker-compose exec metrics-viewer grafana-cli plugins install frser-sqlite-datasource
   ```

## Maintenance

1. Backup dashboard configurations:

```bash
# Backup all Grafana configurations
tar -czf grafana_backup.tar.gz metrics/grafana/
```

2. Update dashboard configurations:

```bash
# After making changes in the UI, export the JSON and update the file
cp new_dashboard.json metrics/grafana/dashboards/
```

3. Rotate metrics database:

```bash
# Set up metric rotation in metrics collector configuration
# Default retention period: 30 days
```
