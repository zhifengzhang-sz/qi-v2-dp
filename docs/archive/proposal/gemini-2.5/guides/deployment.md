# Developer Guide: Deployment & Running the Platform

This guide covers how to run the entire QiCore Crypto Data Platform using the provided Docker Compose setup. This is the standard way to run the application for both development and production-like environments.

## 1. Prerequisites

-   **Docker and Docker Compose**: Ensure you have both installed on your system. You can verify this by running `docker --version` and `docker-compose --version`.
-   **Environment File**: You must have a `.env` file in the root of the project, based on the .env.example template. This file contains necessary credentials for databases and external APIs.

## 2. Understanding the docker-compose.yml

The docker-compose.yml file, located in the root of the project (`/home/zzhang/dev/qi/github/mcp-server/dp/docker-compose.yml`), orchestrates all the services required to run the platform. It defines:
-   **`redpanda`**: The Kafka-compatible streaming bus.
-   **`timescaledb`**: The operational time-series database.
-   **`clickhouse`**: The analytical database.
-   **`redis`**: The in-memory cache (used for MCP Memory, etc.).
-   **`app`**: Our main TypeScript application, which runs the streamers and agents.

The `app` service is built from the `Dockerfile` in the project root, which compiles the TypeScript code and sets up the Bun runtime environment.

## 3. Step-by-Step Deployment

### Step 1: Create Your Environment File

If you haven't already, copy the example environment file from the project root:
```bash
cp .env.example .env
```
Now, open the `.env` file and fill in the required values, such as your CryptoCompare API key.

### Step 2: Build and Start the Services

From the root of the project (dp), run the following command:

```bash
docker-compose up --build -d
```

-   `up`: This command creates and starts the containers.
-   `--build`: This flag forces Docker Compose to rebuild the `app` image from your latest source code. You should use this whenever you make code changes.
-   `-d`: This runs the containers in "detached" mode, meaning they run in the background and don't lock up your terminal.

This command will:
1.  Pull the official images for Redpanda, TimescaleDB, ClickHouse, and Redis.
2.  Build a Docker image for our `app` service based on the current code.
3.  Start all the services and connect them on a shared Docker network.

### Step 3: Verify the Services are Running

You can check the status of your running containers with:
```bash
docker-compose ps
```
You should see all the services listed with a state of `Up`.

To view the logs from a specific service, use the `logs` command. For example, to see the output from our main application:
```bash
docker-compose logs -f app
```
-   `-f`: This "follows" the log output, streaming new logs to your terminal in real-time.

You should see the startup messages from your streamers and agents.

### Step 4: Accessing Services

-   **Redpanda Console**: You can often access a web UI for Redpanda to inspect topics and messages. Check the docker-compose.yml for the exposed port (e.g., `http://localhost:8080`).
-   **Database Connections**: You can connect to TimescaleDB and ClickHouse using their standard ports (`5432` for PostgreSQL/TimescaleDB, `8123` for ClickHouse HTTP) from a database client like DBeaver or DataGrip. The connection details (user, password, database) are in your `.env` file.

### Step 5: Stopping the Platform

To stop all the running services, use:
```bash
docker-compose down
```
This will stop and remove the containers. If you want to also remove the data volumes (i.e., delete all your stored data), you can use `docker-compose down -v`.

This workflow provides a consistent and reproducible environment for running the entire QiCore platform.
