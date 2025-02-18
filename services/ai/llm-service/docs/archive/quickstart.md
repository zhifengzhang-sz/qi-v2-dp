# LLM Service Quick Start Guide

This guide helps you get started with the LLM Service quickly. For detailed information, refer to the full documentation.

## 1. Quick Installation

```bash
# Clone repository
git clone <repository-url>
cd llm-service

# Create required directories
mkdir -p .cache/huggingface metrics/db metrics/grafana

# Start service with default model (DeepSeek)
docker-compose up -d
```

## 2. Basic Usage

### Generate Code

```bash
# Using curl
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a Python function to sort a list"}'

# Using Python
import requests

response = requests.post(
    "http://localhost:8000/generate",
    json={"prompt": "Write a Python function to sort a list"}
)
print(response.json()["generated_text"])
```

### Check Service Health

```bash
# View service status
docker-compose ps

# Check detailed health
curl http://localhost:8000/health
```

### View Metrics

1. Open Grafana: http://localhost:3000
2. Login with:
   - Username: admin
   - Password: admin
3. View the "LLM Service Metrics" dashboard

## 3. Common Operations

### Switch Models

```bash
# Stop current service
docker-compose down

# Start with different model
docker-compose --env-file config/models/codellama.env up -d
```

### View Logs

```bash
# View service logs
docker-compose logs -f llm-service
```

### Monitor Resources

```bash
# View resource usage
docker stats llm-service
```

## 4. Troubleshooting

### Service Won't Start

1. Check system resources:

```bash
free -h
df -h
```

2. View error logs:

```bash
docker-compose logs llm-service
```

### Slow Performance

1. Check resource usage:

```bash
docker stats llm-service
```

2. Monitor metrics in Grafana dashboard

### Generation Fails

1. Check service health:

```bash
curl http://localhost:8000/health
```

2. Verify model cache:

```bash
ls -la .cache/huggingface
```

## 5. Next Steps

1. Read the full documentation for detailed configuration options
2. Set up monitoring alerts
3. Configure resource limits based on your hardware
4. Implement proper error handling in your applications

## 6. Getting Help

1. Check the troubleshooting guide in the full documentation
2. View service logs for detailed error messages
3. Monitor the metrics dashboard for performance issues
