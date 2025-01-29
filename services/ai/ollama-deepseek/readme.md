# Qi Chat Service

A containerized chat service using Ollama, MongoDB, and HuggingFace's Chat UI.

## Architecture

- **MongoDB**: Database server (v4.4.6)
- **Ollama**: LLM service with Deepseek model
- **Chat UI**: HuggingFace's web interface

## Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.0+
- Make
- 8GB+ RAM for Ollama service
- NVIDIA GPU (optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Create environment files:
```bash
cp .env.example .env
cp .env.local.example .env.local
```

3. Configure environment variables in `.env`:
```ini
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_PORT=27017
OLLAMA_PORT=11434
UI_PORT=3100
HF_TOKEN=your_huggingface_token
```

## Usage

Available make commands:

- `make help` - Show available commands
- `make start` - Start all services
- `make stop` - Stop all services
- `make install` - Install Deepseek model
- `make logs` - View container logs
- `make clean` - Remove containers and volumes
- `make restart` - Restart all services
- `make status` - Check services status

## Quick Start

1. Start services:
```bash
make start
```

2. Install Deepseek model:
```bash
make install
```

3. Access services:
- Chat UI: http://localhost:3100
- Ollama API: http://localhost:11434
- MongoDB: localhost:27017

## Troubleshooting

1. If MongoDB fails to start:
```bash
make clean
make start
```

2. If Ollama model download fails:
```bash
make restart
make install
```

3. Check logs for specific service:
```bash
docker logs qi-ollama
docker logs qi-mongodb
docker logs qi-chat-ui
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License 