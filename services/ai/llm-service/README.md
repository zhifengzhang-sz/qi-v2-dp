# LLM Service

A production-ready service for running large language models, built on HuggingFace's infrastructure.

## Prerequisites

- Python 3.10 or higher
- pyenv (for Python version management)
- 48GB RAM minimum
- 100GB available disk space
- NVIDIA GPU (optional but recommended)

## Quick Start

```bash
# Setup Python environment
make python-env

# Install components separately (recommended)
make install-base      # Install base requirements
make install-torch     # Install PyTorch (large download)
make install-dev       # Install development tools

# Or install everything at once (might timeout)
make install-all
```

## Development Environment Setup

### 1. Install pyenv

```bash
# Install build dependencies
sudo apt update
sudo apt install -y make build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
libffi-dev liblzma-dev

# Install pyenv
curl https://pyenv.run | bash

# Add to shell configuration
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc

# Reload shell
exec $SHELL
```

### 2. Setup Project

```bash
# Install Python and create virtualenv
make python-env

# Install dependencies in stages (recommended)
make install-base
make install-torch
make install-dev

# Verify installation
python --version  # Should show 3.10.13
make test
```

## Available Commands

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `make help`          | Show available commands         |
| `make python-env`    | Setup Python with pyenv         |
| `make install-base`  | Install base requirements       |
| `make install-torch` | Install PyTorch                 |
| `make install-dev`   | Install development tools       |
| `make install-all`   | Install everything              |
| `make test`          | Run test suite                  |
| `make fmt`           | Format code                     |
| `make clean`         | Clean Python artifacts          |
| `make clean-all`     | Clean everything including venv |

## Project Structure

```plaintext
services/ai/llm-service/
├── cache/             # Cache management
├── config/            # Configuration
│   └── infra/        # Environment configs
├── downloader/        # Model download
├── requirements/      # Dependencies
│   ├── base.txt      # Core requirements
│   ├── torch.txt     # PyTorch requirements
│   └── dev.txt       # Development tools
├── scripts/          # CLI tools
└── tests/           # Test suite
```

## Testing

```bash
# Run all tests
make test

# Run specific test file
pytest tests/test_download.py -v

# Run with coverage
pytest --cov=. tests/
```

## Development Workflow

1. Activate environment:

```bash
source .venv/bin/activate
```

2. Install dependencies (if needed):

```bash
make install-all
```

3. Run tests:

```bash
make test
```

4. Format code:

```bash
make fmt
```
