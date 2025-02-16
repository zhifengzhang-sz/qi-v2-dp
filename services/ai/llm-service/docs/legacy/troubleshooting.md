# LLM Service Troubleshooting Guide

## Common Issues and Solutions

### 1. Service Fails to Start

#### Symptoms

- Docker container exits immediately
- Health check fails
- Container logs show initialization errors

#### Common Causes and Solutions

##### Insufficient Resources

```bash
# Check available memory
free -h

# Check available disk space
df -h

# Solution: Free up resources or adjust limits in docker-compose.yml
```

##### Port Conflicts

```bash
# Check for port conflicts
netstat -tulpn | grep 8000

# Solution: Change port mapping in docker-compose.yml or stop conflicting service
```

##### Model Download Issues

```bash
# Check network connectivity
ping huggingface.co

# Check cache directory permissions
ls -la .cache/huggingface

# Solutions:
# 1. Clear cache and retry
rm -rf .cache/huggingface/*

# 2. Verify HuggingFace credentials
echo $HF_TOKEN

# 3. Check proxy settings if applicable
echo $HTTPS_PROXY
```

### 2. High Memory Usage

#### Symptoms

- Container OOM (Out of Memory) errors
- Slow response times
- System becomes unresponsive

#### Solutions

##### Check Current Usage

```bash
# Monitor container stats
docker stats llm-service

# Check system memory
free -h
```

##### Adjust Resource Limits

1. Modify docker-compose.yml:

```yaml
deploy:
  resources:
    limits:
      memory: 48G
```

2. Adjust model parameters:

```bash
# Reduce batch size or max length in config/models/model.env
MAX_LENGTH=1024
```

### 3. Model Loading Failures

#### Symptoms

- Health check fails
- Generation requests fail
- Errors in model initialization

#### Solutions

##### Check Model Configuration

```bash
# Verify model ID
echo $MODEL_ID

# Check model cache
ls -la .cache/huggingface/models
```

##### Clear and Reload Model

```bash
# Remove cached model
rm -rf .cache/huggingface/models/*

# Restart service
docker-compose restart llm-service
```

##### Verify Resource Allocation

```bash
# Check GPU availability (if using GPU)
nvidia-smi

# Check CPU allocation
nproc
```

### 4. Performance Issues

#### Symptoms

- Slow response times
- High latency
- Inconsistent performance

#### Solutions

##### Monitor Resource Usage

```bash
# Check CPU usage
top -n 1 | grep python

# Monitor GPU usage (if applicable)
nvidia-smi -l 1
```

##### Optimize Configuration

1. Adjust thread settings:

```bash
export OMP_NUM_THREADS=9
export MKL_NUM_THREADS=9
```

2. Modify model parameters:

```bash
# Reduce temperature or top_p for faster inference
TEMPERATURE=0.7
TOP_P=0.9
```

### 5. Alert System Issues

#### Symptoms

- Missing alerts
- False positives
- Notification failures

#### Solutions

##### Check Alert Configuration

```bash
# Verify alert config
cat config/alerts.json

# Check alert logs
docker-compose logs llm-service | grep "ALERT"
```

##### Test Notification Channels

```bash
# Test email configuration
python alerts/test_notifications.py --type email

# Test Slack webhook
python alerts/test_notifications.py --type slack
```

### 6. Metrics Collection Issues

#### Symptoms

- Missing metrics
- Incorrect data in Grafana
- Database errors

#### Solutions

##### Check Database

```bash
# Verify database exists
ls -l metrics/db/metrics.db

# Check permissions
ls -l metrics/db
```

##### Verify Grafana Connection

1. Check Grafana status:

```bash
docker-compose ps metrics-viewer
```

2. Test database connection:

```bash
# Connect to metrics database
sqlite3 metrics/db/metrics.db
```

## Debugging Tools

### 1. Log Analysis

```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f llm-service

# Filter error messages
docker-compose logs | grep ERROR
```

### 2. Health Checks

```bash
# Run manual health check
python workspace/health_check.py

# Check specific components
python workspace/health_check.py --component model
python workspace/health_check.py --component memory
```

### 3. Performance Monitoring

```bash
# Monitor real-time metrics
python workspace/monitor.py --watch

# Generate performance report
python workspace/monitor.py --report
```

## Maintenance Procedures

### 1. Cache Management

```bash
# Clear model cache
rm -rf .cache/huggingface/*

# Clear metrics database
rm metrics/db/metrics.db
```

### 2. Service Reset

```bash
# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

### 3. Backup and Restore

```bash
# Backup configurations
tar -czf config_backup.tar.gz config/

# Backup metrics
sqlite3 metrics/db/metrics.db ".backup 'metrics_backup.db'"

# Restore from backup
tar -xzf config_backup.tar.gz
cp metrics_backup.db metrics/db/metrics.db
```

## Getting Help

If the above solutions don't resolve your issue:

1. Check the logs for detailed error messages
2. Review the configuration files for misconfigurations
3. Verify system requirements are met
4. Check for known issues in the documentation
5. Contact support with:
   - Error logs
   - System configuration
   - Steps to reproduce
   - Recent changes made
