# Notes on Docker

## Docker maintenance

### Changing the Location of Docker Images and Volumes

Docker uses a default storage location for images, volumes, containers, and other data. On Linux, this is typically `/var/lib/docker/`. If we want to change this location, we can do so by configuring the Docker daemon.

#### Steps:

- **Edit Docker’s Configuration**: Modify the Docker configuration file to change the data directory.

  - On **Linux**, create or edit the file `/etc/docker/daemon.json` to specify a new directory:

    ```json
    {
      "data-root": "/path/to/new/docker-directory"
    }
    ```

  - On **Windows**, we can use the `daemon.json` file located at `C:\ProgramData\docker\config\daemon.json`.

  - On **macOS** with Docker Desktop, there is no straightforward way to change the location due to how Docker Desktop is integrated with macOS, but we can use symbolic links as a workaround.

- **Reload Docker**: After making these changes, restart the Docker service to apply the new configuration:

  ```bash
  sudo systemctl restart docker
  ```

- **Migrate Existing Data**: we may need to manually move existing data from the old directory to the new one, depending on the setup.

### Backing Up and Restoring Docker Volumes

Volumes can be backed up and restored using tar commands or similar tools. Here’s how we can perform these operations:

#### Backing Up a Volume

1. **Find the Volume Location**:
   Use the following command to get the mount point of the volume:

   ```bash
   docker volume inspect <volume_name>
   ```

2. **Create a Backup**:
   we can create a backup by starting a temporary container and using tar:
   ```bash
   docker run --rm -v <volume_name>:/data -v $(pwd):/backup ubuntu tar cvf /backup/<volume_name>.tar /data
   ```
   This command backs up the volume to a tar file in the current directory.

#### Restoring a Volume

1. **Create a Volume**:
   If the volume doesn't exist, create it:

   ```bash
   docker volume create <volume_name>
   ```

2. **Restore the Backup**:
   Use a temporary container to extract the tar backup:
   ```bash
   docker run --rm -v <volume_name>:/data -v $(pwd):/backup ubuntu bash -c "cd /data && tar xvf /backup/<volume_name>.tar --strip 1"
   ```
   This extracts the contents of the tar file into the volume.

By following these methods, we can manage the location of Docker’s storage and ensure that the volume data is safely backed up and restorable. Always make sure we have a solid backup strategy in place, especially when making significant changes to the Docker environment.

## Named volumes

1. **Named Volumes**: When we define volumes in the `docker-compose.yml` using the `volumes` section at the top level (as we have done with `questdb_data`, `timescaledb_data`, etc.), they are named volumes. These should appear in the output of `docker volume ls`.

2. **Anonymous Volumes**: If we mount volumes without specifying a name in the `volumes` section, Docker assigns them a random name, and they are considered anonymous volumes. These also appear in `docker volume ls` but may have less recognizable names.

3. **Bind Mounts**: If we were instead using bind mounts (directly mapping a host directory to a container directory), those would not appear as volumes in `docker volume ls` because they are directly tied to filesystem paths on the host.

If we have run `docker-compose down` with the `--volumes` option, it would indeed delete the named volumes, and they would no longer appear in `docker volume ls`.

If after running `docker-compose up` the volumes are recreated, they should again appear in `docker volume ls`. If we truly cannot see the volumes after expected operations (without using `--volumes` to remove them), we might want to ensure:

- There are no errors occurring during the creation of volumes.
- we have an unaltered, correctly specified `docker-compose.yml`.

If the volumes don't appear despite having the correct `docker-compose.yml` and setup, and no explicit removal has occurred, it might be helpful to check for any deviations or errors in volume creation.

## Healthcheck

### Basic Structure of a Healthcheck

In the `docker-compose.yml`, under each service definition, we can define a `healthcheck` like this:

```yaml
services:
  the_service_name:
    image: example/image:tag
    healthcheck:
      test: ["CMD", "the_health_check_command"]
      interval: 30s # How often to run the check (default is 30s)
      timeout: 10s # When to consider a health check failed (default is 30s)
      retries: 3 # Number of consecutive failures for a container to be considered unhealthy (default is 3)
      start_period: 5s # Start period before counting retries (useful for initialization delay)
```

### Example: Using a Healthcheck

Let's say we have a web application running in a container, and we want to check if the HTTP service is up:

```yaml
version: "3.8"

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

### Explanation

- **`test`**: Specifies the command to run to check the health of the service. In the example, it tries to curl the web server. If the command returns a non-zero status or an error, it is considered a failure.
- **`interval`**: How often to run the health check. Here, it's set to check every 30 seconds.

- **`timeout`**: How long to wait for the check command to complete. If it takes longer than this value, the check fails.

- **`retries`**: How many consecutive failed checks are needed before the container is marked as unhealthy. This example marks the container as unhealthy after 3 failed attempts.

- **`start_period`**: An initialization period that allows the container to start up before beginning to count failures towards the `retries` limit. It's particularly useful for applications that require warm-up time.

### Checking Health Status

we can check the health status of containers using the Docker command-line tool. For instance:

```bash
docker ps
```

This will show a column indicating health status (e.g., `healthy`, `unhealthy`, `starting`). Additionally, we can use:

```bash
docker inspect --format='{{json .State.Health}}' <container_name_or_id>
```

This command will provide detailed health status information.

Using `healthcheck`, we can set up more robust and reliable containerized applications, as we can tailor it to the specific needs of the services, ensuring they are operating correctly before other dependent services start or restart automatically.


## .env for the Docker Compose File
### Steps to Verify:

1. **Validate Against .env**:
   Run `docker-compose config` to ensure that the `docker-compose.yml` reads the `.env` file correctly and that all variables are rendered as expected.

2. **Testing**:
   Test the environment setup by bringing up the services with `docker-compose up` and observe for any errors or warnings.

By ensuring these `.env` variables are correctly defined and used, the Docker setup should be robust and ready for deployment. If we anticipate configuration changes frequently, managing these with versioning or environment-specific overrides (like `.env.development`, `.env.production`) can ensure smooth transitions.
