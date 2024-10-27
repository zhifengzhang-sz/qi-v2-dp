# Provisioning

---

## Docker-compose file

### Setting up grafana provisioning

Provisioning in Grafana typically involves setting up YAML files for data sources, dashboards, and notification channels.

#### 1. Data Sources

Create a file in `./provisioning/datasources/` directory, for example, `datasource.yaml`:

```yaml
apiVersion: 1

datasources:
  - name: MyDataSource
    type: prometheus # adjust the type according to the data source
    access: proxy
    url: http://localhost:9090 # adjust the URL based on the service
    isDefault: true # or false if we have multiple datasources and want to specify a default
    editable: true
```

- **`type`:** This will depend on the kind of data source we are integrating with Grafana (e.g., Prometheus, InfluxDB, etc.).
- **`url`:** The address where the data source is reachable. Ensure this can be accessed from the Grafana container.

#### 2. Dashboards

Create a file in `./provisioning/dashboards/` directory, such as `dashboard.yaml`:

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    options:
      path: /var/lib/grafana/dashboards # local path inside the container
```

Place the JSON dashboard files in a directory for instance `./provisioning/dashboards/custom/`. Inside the container, we map it to `/var/lib/grafana/dashboards` in the `docker-compose` file.

#### 3. Directory Structure 

Ensure the directory structure looks somewhat like this:

```
./provisioning
|-- datasources
|    |-- datasource.yaml
|-- dashboards
|    |-- dashboard.yaml
|    |-- custom
        |-- the_dashboard.json
```

#### 4. Environment Variables

Make sure we have a `.env` file with relevant environment variables such as:

```env
GF_SECURITY_ADMIN_PASSWORD=the_secure_password
# Add others as necessary for the configuration
```

### Deploy Grafana

Make sure we have these files in place before running `docker-compose up`. When Grafana starts, it will read the provisioning configurations, and set up the data sources and dashboards as specified.

Remember to adjust file paths, URLs, and setup details to match the rest of the application's configuration, network settings, and available services. Monitor the logs of the Grafana service for any errors related to provisioning to troubleshoot and ensure the configurations are correctly applied.

---

## Manually setup provisioning

If we remove the provisioning directory from the Docker Compose setup, we can manually configure Grafana after it starts up. Here's what we would typically do:

### Setting Up Grafana Manually

1. **Start the Grafana Container:**
   - Run the `docker-compose up` command to start Grafana without the provisioning files.

2. **Access the Grafana Web Interface:**
   - Open the browser and navigate to `http://localhost:3000`.
   - Log in using the default credentials (`admin` / `admin`). we will be prompted to change the password upon first login.

3. **Add Data Sources:**
   - Go to the "Configuration" (gear icon) in the side menu, and click on "Data Sources".
   - Click "Add data source" and select the desired data source type (e.g., Prometheus, InfluxDB, etc.).
   - Configure it by providing necessary details such as the data source URL, access method, etc.

4. **Create or Import Dashboards:**
   - Once the data sources are configured, we can either create new dashboards or import existing ones.
   - To import a dashboard, go to the "Create" (plus icon) in the side menu, click on "Import".
   - We can upload a JSON file, paste JSON directly, or use a Grafana.com dashboard ID.

5. **Configure Grafana:**
   - We can further configure Grafana settings, users, notification channels, etc., via the web interface as needed.

### Persistent Data With Docker Volumes

If we're manually setting up dashboards and configuring Grafana directly via its web interface, we'll want the configurations to persist across container restarts. Ensure we have a persistent volume mapped for `/var/lib/grafana`, like we have with `grafana_volume:/var/lib/grafana`. This way, any configurations, dashboards, and plugins we set up will not be lost when the container restarts.

```yaml
volumes:
  - grafana_volume:/var/lib/grafana
```

### Conclusion

By removing the provisioning setup, Grafana becomes more flexible in terms of manual configuration through its user interface. This method is beneficial during the development and testing phases, allowing us to adjust settings as we evaluate without modifying configuration files externally.

---

## Installing the manually setup provisioning

Once we've manually configured Grafana by adding data sources and dashboards through its web interface, we can extract this configuration to use for automated provisioning later. Here's a step-by-step guide:

### Steps to Get Manually Configured Provisioning Data

#### Exporting Data Sources

1. **Access Grafana's API:**
   - Grafana provides a REST API that we can use to export configured data sources.
   - We need an API key to interact with the Grafana API. This can be generated in the Grafana UI under **Configuration > API Keys**.

2. **Get API Key:**
   - Create a new API key with "Admin" role.

3. **Fetch Data Sources:**
   - Use a tool like `curl` or Postman to send a GET request to fetch all data sources.
   - Example using `curl`:

     ```bash
     curl -H "Authorization: Bearer the_API_KEY" http://localhost:3000/api/datasources
     ```

   - This command returns a JSON array of the data sources. Save this output to use as the base for a datasource provisioning YAML file.

#### Exporting Dashboards

1. **Export Dashboards via the Grafana UI:**
   - Go to the Grafana web interface, navigate to each dashboard we want to export.
   - Click on the dashboard’s title to open the menu, then select **Save As > Export**.
   - Choose the option to export the dashboard as a JSON file.

2. **Organize the JSON files:**
   - Save each exported JSON in a directory (e.g., `./provisioning/dashboards/custom/`).

3. **Create a Dashboards Provisioning File:**

   ```yaml
   apiVersion: 1

   providers:
     - name: 'default'
       orgId: 1
       folder: ''
       type: file
       disableDeletion: false
       options:
         path: /var/lib/grafana/dashboards
   ```

   Ensure that the folder path within the container (e.g., `/var/lib/grafana/dashboards`) matches where we've placed the JSON files.

### Setting Up Docker Compose for Provisioning

Once we have the data sources and dashboards defined in their respective YAML and JSON files, we can configure Docker Compose to map these into the Grafana container:

1. **Directory Structure:**

   Ensure the directory structure matches the provisioning configuration:

   ```
   ./provisioning
   ├── datasources
   │   └── datasource.yaml
   └── dashboards
       ├── dashboard.yaml
       └── custom
           ├── the_dashboard1.json
           └── the_dashboard2.json
   ```

2. **Docker Compose Configuration:**

   Update the `docker-compose.yaml` to include the provisioning volume mapping:

   ```yaml
   services:
     grafana:
       image: grafana/grafana-oss:9.5.2
       hostname: grafana
       container_name: grafana
       networks:
         - qi_db_network
       ports:
         - "3000:3000"
       volumes:
         - grafana_volume:/var/lib/grafana
         - ./provisioning:/etc/grafana/provisioning
       env_file:
         - .env
       environment:
         - GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD}
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
         interval: 30s
         timeout: 10s
         retries: 3
       depends_on:
         - timescaledb
         - questdb
   ```

### Reloading Configurations

With this setup, we can restart the Grafana container using Docker Compose, and it will automatically load the configured data sources and dashboards from the provisioning files. This is especially useful for deploying Grafana configurations consistently across different environments or for easily recovering a specific configuration state.