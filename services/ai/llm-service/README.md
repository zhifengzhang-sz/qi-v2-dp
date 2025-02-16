# LLM Service

A production-ready service for running large language models, built on HuggingFace's infrastructure. Optimized for code generation with support for DeepSeek and CodeLlama models.

## Features

- 🚀 Production-ready HuggingFace model execution
- 📊 Built-in monitoring and metrics
- ⚡ Resource optimization and management
- 🔄 Support for multiple models
- 🛟 Comprehensive error handling
- 📈 Performance monitoring and alerting

## Prerequisites

- Docker and Docker Compose
- 48GB RAM minimum
- 100GB available disk space
- NVIDIA GPU (optional but recommended)

## Quick Start

1. Clone the repository:
```bash
#git clone <repository-url>
cd services/ai/llm-service
```

2. Create required directories:
```bash
mkdir -p .cache/huggingface
mkdir -p metrics/db
mkdir -p metrics/grafana
```

3. Start the service:
```bash
# With DeepSeek model
docker-compose --env-file config/models/deepseek.env up -d

# Or with CodeLlama
docker-compose --env-file config/models/codellama.env up -d
```

4. Verify deployment:
```bash
# Check service status
docker-compose ps

# Run health check
docker-compose exec llm-service python /app/workspace/health_check.py
```

## Documentation

- [Full Service Documentation](docs/service-docs.md)
- [Quick Start Guide](docs/quickstart.md)
- [API Documentation](docs/api.md)
- [Configuration Guide](docs/configuration.md)
- [Monitoring Guide](docs/monitoring.md)
- [Troubleshooting Guide](docs/troubleshooting.md)

## Monitoring & Metrics

Access the Grafana dashboard at `http://localhost:3000`:
- Default username: admin
- Default password: admin

## Testing

Run the test suite:
```bash
# Run with default configuration
python tests/run_tests.py

# Run with custom configuration
python tests/run_tests.py --config tests/test_config.json
```

## Alert System

Configure and start the alert system:
```bash
# Configure alerts
cp config/alerts.json.example config/alerts.json

# Set up environment variables
export SMTP_PASSWORD="your-smtp-password"
export SLACK_WEBHOOK_URL="your-webhook-url"

# Start alert system
python alerts/alert_system.py
```

## Project Status

⚠️ **Note**: This project is in pre-deployment phase. Final deployment steps are pending. See [Implementation Status](docs/implementation-status.md) for details.

## Directory Structure

```
/
├── docker-compose.yml           # Service configuration
├── config/
│   ├── models/                 # Model configurations
│   └── resources/             # Resource configurations
├── workspace/                 # Service scripts
├── tests/                    # Test suite
├── alerts/                   # Alert system
├── metrics/                  # Metrics collection
├── docs/                    # Documentation
└── .cache/                 # Model cache
```

## License

[License details to be added]

## Contributing

[Contribution guidelines to be added]

## Support

For issues and support:
1. Check the [Troubleshooting Guide](docs/troubleshooting.md)
2. Open an issue in the repository
3. Contact the development team