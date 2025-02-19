# LLM Service Deployment Test Plan

## Phase 1: Model Download Service

### Test 1.1: Configuration Validation

```bash
# Navigate to docker directory
cd docker

# Validate download service configuration
docker compose -f docker-compose.download.yml config
```

Expected outcome: Configuration resolves without errors, all paths are correct

### Test 1.2: Model Download

```bash
# Start download service
docker compose -f docker-compose.download.yml up

# Monitor logs for progress
docker compose -f docker-compose.download.yml logs -f
```

Expected outcome:

- Service starts successfully
- Model downloads to .cache directory
- Health check passes
- Service exits cleanly after download

### Test 1.3: Cache Verification

```bash
# Check .cache directory structure
ls -la ../.cache/

# Verify model files
test -f ../.cache/config.json && echo "Config exists" || echo "Missing config"
```

Expected outcome: Model files present in cache directory

## Phase 2: CPU Service Deployment

### Test 2.1: Configuration Validation

```bash
# Validate CPU service configuration
docker compose -f docker-compose.cpu.yml config
```

Expected outcome: Configuration resolves without errors

### Test 2.2: Service Startup

```bash
# Start CPU service
docker compose -f docker-compose.cpu.yml up -d

# Monitor logs
docker compose -f docker-compose.cpu.yml logs -f
```

Expected outcome:

- Service starts successfully
- Model loads from cache
- Health check passes

### Test 2.3: Health Check Validation

```bash
# Wait for service to initialize
sleep 30

# Check service health
curl http://localhost:8080/health
```

Expected outcome: Health endpoint returns 200 OK

### Test 2.4: Basic Inference Test

```bash
# Test basic inference
curl -X POST http://localhost:8080/generate \
    -H 'Content-Type: application/json' \
    -d '{"inputs":"Write a Python function to add two numbers.","parameters":{"max_new_tokens":50}}'
```

Expected outcome: Service returns generated text

## Phase 3: Resource Validation

### Test 3.1: Resource Usage Monitoring

```bash
# Monitor container resources
docker stats --no-stream tgi-service-tgi-1
```

Expected metrics:

- Memory usage < 32GB
- CPU usage within limits

### Test 3.2: Concurrent Request Handling

```bash
# Test concurrent requests (implement in Python)
python3 ../tests/load_test.py
```

Expected outcome: Service handles concurrent requests within configured limits

## Error Recovery Tests

### Test 4.1: Service Recovery

```bash
# Stop service
docker compose -f docker-compose.cpu.yml down

# Start service
docker compose -f docker-compose.cpu.yml up -d
```

Expected outcome: Service recovers and resumes normal operation

### Test 4.2: Cache Persistence

```bash
# Verify cache persistence
docker compose -f docker-compose.cpu.yml down
docker compose -f docker-compose.cpu.yml up -d
```

Expected outcome: Service uses cached model without redownload

## Clean-up Procedures

```bash
# Stop services
docker compose -f docker-compose.cpu.yml down

# Clean up containers
docker container prune -f

# Optional: Clean cache
# rm -rf ../.cache/*
```
