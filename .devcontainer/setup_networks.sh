# .devcontainer/setup_networks.sh
#!/bin/bash

declare -a networks=("qi_db" "redis_network" "redpanda_network")

for network in "${networks[@]}"; do
  if ! docker network ls --filter name=^${network}$ --format '{{.Name}}' | grep -w ${network} > /dev/null; then
    echo "Network ${network} not found. Creating..."
    docker network create ${network}
  else
    echo "Network ${network} already exists."
  fi
done