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

1. **Download the model**:
```bash
# Clean download with proper permissions
make download-clean

# If you encounter permission issues
make fix-permissions
```

2. **Start the service**:
```bash
# For CPU mode
make start-cpu

# For GPU mode
make start-gpu
```

3. **Stop the service**:
```bash
make stop
```

## Commands

| Command | Description |
|---------|-------------|
| `make download` | Download model |
| `make download-clean` | Clean cache and download fresh |
| `make fix-permissions` | Fix cache directory permissions |
| `make start-cpu` | Start CPU service |
| `make start-gpu` | Start GPU service |
| `make stop` | Stop all services |
| `make clean` | Clean all temporary files |

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
llm-service/
├── Makefile           # Service management commands
├── docker/            # Docker-related files
│   ├── config/        # Configuration files
│   ├── Dockerfile*    # Various Dockerfiles
│   └── docker-compose*.yml
├── .cache/           # Model cache directory
└── README.md
```

## Configuration

All configuration is managed through environment files in the `docker/config` directory:
- `config/infra/` - Infrastructure settings
- `config/models/` - Model-specific settings

## Development

To see all available commands:
```bash
make help
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