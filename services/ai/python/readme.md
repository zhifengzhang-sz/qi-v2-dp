# Python Coding Service

A Python-based service for running Large Language Models (LLMs) optimized for code generation and completion.

## Project Structure

```plaintext
.
├── app.py              # Main application
├── config/            
│   └── dataset_config.py  # Dataset configurations
├── training_data/
│   └── download_data.py   # Data download utilities
└── scripts/
    └── prepare_data.py    # Data preparation script
```

## Data Preparation

### Available Datasets

The project supports downloading and preparing two types of training data:

1. **C4 Design Patterns** (`c4_design`)
   - Source: allenai/c4
   - Content: Software architecture and design patterns
   - Keywords: "design pattern", "architecture", "software design"

2. **TypeScript Examples** (`typescript`)
   - Source: codeparrot/github-code
   - Content: TypeScript code examples
   - Keywords: "typescript", "angular", "react"

### Usage

1. Set up the environment:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Download training data:
```bash
# Download design patterns dataset
python scripts/prepare_data.py --source="c4_design" --output="training_data"

# Download typescript examples
python scripts/prepare_data.py --source="typescript" --output="training_data"
```

### Output

The script will:
- Create JSON files in the specified output directory
- Filter content based on configured keywords
- Include progress updates during download
- Save metadata with each sample

Output files:
- `training_data/c4_design_samples.json`
- `training_data/typescript_samples.json`

### Configuration

To modify dataset configurations, edit `config/dataset_config.py`. You can adjust:
- Sample size
- Keywords for filtering
- Text length limits
- Data sources

## Development

### Environment
```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests
make test

# Format code
make format

# Type checking
make check
```

### Environment Variables

Required environment variables in `.devcontainer/devcontainer.json`:
```json
{
    "containerEnv": {
        "HF_HOME": "/home/${USERNAME}/python/.cache/huggingface",
        "HF_HUB_DOWNLOAD_TIMEOUT": "1000"
    }
}
```

Or in `.devcontainer/docker-compose.yml`:
```yaml
services:
  coder:
    environment:
      - HF_HOME=/home/${USERNAME}/python/.cache/huggingface
      - HF_HUB_DOWNLOAD_TIMEOUT=1000
      - OMP_NUM_THREADS=${CPU_COUNT:-8}
      - MKL_NUM_THREADS=${CPU_COUNT:-8}
    volumes:
      - ..:/home/${USER}/python:cached
      - ${HOME}/python/.cache/huggingface:/home/${USER}/python/.cache/huggingface:cached
```

### Testing
Tests are written using pytest and can be found in the `tests/` directory. The test suite includes:
- Model factory validation
- Configuration validation
- Input validation
- Preprocessing functionality

Run the full test suite with:
```bash
make test
```

Current test results:
- ✅ All 4 tests passing
- ⚠️ 1 deprecation warning (will be resolved when using `HF_HOME`)

#### Known Warnings
The following warning should no longer appear once HF_HOME is properly set:
```
FutureWarning: Using `TRANSFORMERS_CACHE` is deprecated and will be removed in v5 of Transformers. Use `HF_HOME` instead.
```

### Adding New Models

1. Create model class in `models/`
2. Implement `BaseModel` interface
3. Add configuration in `config/model_config.py`
4. Update factory in `models/factory.py`

## Resource Requirements

- CPU: 8+ cores recommended
- RAM: 32GB minimum, 56GB recommended
- Storage: ~20GB per model

## Environment Variables

Set in `.devcontainer/docker-compose.yml`:
```yaml
services:
  coder:
    environment:
      - HF_HOME=/home/${USER}/services/ai/python/.cache
      - HF_HUB_DOWNLOAD_TIMEOUT=1000
      - OMP_NUM_THREADS=${CPU_COUNT:-8}
      - MKL_NUM_THREADS=${CPU_COUNT:-8}
    volumes:
      - ..:/home/${USER}/python:cached
      - ${HOME}/services/ai/python/.cache:/home/${USER}/services/ai/python/.cache:cached
```

> Note: Remove any references to `TRANSFORMERS_CACHE` as it's deprecated in favor of `HF_HOME`.

## Performance Monitoring

Built-in monitoring tools:
- Memory profiling via `memory-profiler`
- Resource tracking decorators
- Benchmark utilities

## Running

### Interactive Mode
```bash
# Start interactive mode with default model (DeepSeek 6.7B)
python app.py

# Start interactive mode with specific model
MODEL_NAME=codegen-350m python app.py
```

Example prompts to try:
```bash
# When prompted, enter coding tasks like:
Write a Python function to implement merge sort
Create a binary search tree class
Write a function to find prime numbers
```

### Benchmark Mode
```bash
# Run benchmarks with default model
python app.py --benchmark

# Run benchmarks with specific model
MODEL_NAME=codegen-350m python app.py --benchmark
```

### Environment Optimization
For better performance on CPU, set thread counts:
```bash
# Run with optimized thread settings
OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 python app.py

# Complete example with model selection and thread optimization
MODEL_NAME=codegen-350m OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 python app.py
```

### Response Times
Actual benchmark results on CPU (8 cores):

DeepSeek 6.7B:
- Simple prompts (67-70 tokens): 170-205 seconds
- Complex prompts (178 tokens): ~540 seconds
- Throughput: ~0.3-0.4 tokens/second

CodeGen 350M:
- Simple prompts: 5-10 seconds
- Complex prompts: 15-30 seconds
- Throughput: ~6-8 tokens/second

Factors affecting performance:
- Prompt complexity
- Output length
- CPU cores available
- Memory speed
- Thread optimization

> Note: Performance measured with `OMP_NUM_THREADS=8 MKL_NUM_THREADS=8` on a system with 8 CPU cores.

### Benchmark Results Analysis

Latest benchmark measurements for DeepSeek 6.7B:
```
Simple prompt (67 tokens): 169.22s
Medium prompt (70 tokens): 205.06s
Complex prompt (178 tokens): 541.45s
```

For CPU-only environments, we strongly recommend:
- Using the `codegen-350m` model
- Setting thread counts via `OMP_NUM_THREADS=8 MKL_NUM_THREADS=8`
- Limiting prompt complexity to maintain reasonable response times

## Available Models

The service supports multiple models that can be configured via environment variables:

| Model Name | Parameters | CPU Friendly | Description |
|------------|------------|--------------|-------------|
| deepseek-6.7b | 6.7B | No | DeepSeek Coder 6.7B - Full model |
| codegen-350m | 350M | Yes | CodeGen 350M - Fast CPU model |

### Running Different Models

```bash
# Run with default model (DeepSeek 6.7B)
OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 python app.py

# Run with specific model
MODEL_NAME=codegen-350m OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 python app.py

# Run benchmarks
MODEL_NAME=codegen-350m OMP_NUM_THREADS=8 MKL_NUM_THREADS=8 python app.py --benchmark
```

### Model Configuration

Models are configured in `config/model_config.py` and can be selected using the `MODEL_NAME` environment variable. Example configuration:

```python
MODEL_CONFIGS = {
    "deepseek-6.7b": ModelConfig(
        model_id="deepseek-ai/deepseek-coder-6.7b-base",
        model_type="deepseek",
        description="DeepSeek Coder 6.7B - Full model",
        parameters="6.7B",
        cpu_friendly=False
    ),
    "codegen-350m": ModelConfig(
        model_id="Salesforce/codegen-350m-mono",
        model_type="codegen",
        description="CodeGen 350M - Fast CPU model",
        parameters="350M",
        cpu_friendly=True
    )
}
```

### Model Selection Guidelines

- For CPU-only environments: Use `codegen-350m`
- For environments with GPU: Use `deepseek-6.7b`
- Memory requirements:
  - deepseek-6.7b: ~14GB RAM
  - codegen-350m: ~700MB RAM

## Docker Support

### Building and Running

Build the Docker image:
```bash
docker compose build
```

Run the service:
```bash
# Run with default model (CodeGen 350M)
docker compose up

# Run with specific model
MODEL_NAME=deepseek-6.7b docker compose up

# Run benchmark mode
docker compose run --rm coder --benchmark
```

### Configuration

The service is configured via environment variables in `docker-compose.yml`:
- `MODEL_NAME`: Select model to use (default: codegen-350m)
- `OMP_NUM_THREADS`: Number of CPU threads (default: 8)
- `MKL_NUM_THREADS`: Number of MKL threads (default: 8)

### Resource Limits

Docker container is configured with:
- CPU: 8 cores
- RAM: 16GB
- Cache persistence via volume mount

> Note: Adjust resource limits in docker-compose.yml based on your hardware.

## Model Fine-tuning

### Specialized Training Areas

1. **C4 System Design**
   - Architecture patterns and principles
   - Component design and interfaces
   - System integration patterns
   - Configuration management

2. **TypeScript Development**
   - Type system and interfaces
   - Modern TypeScript patterns
   - Framework-specific implementations
   - Testing patterns

3. **Continuous Project Learning**
   - Project-specific patterns
   - Codebase understanding
   - Architectural decisions
   - Custom conventions

### Fine-tuning Process

```bash
# Prepare training data
python scripts/prepare_data.py --source="project_repo" --output="training_data"

# Start fine-tuning
python scripts/train.py \
  --model="codegen-350m" \
  --training_data="training_data" \
  --epochs=3 \
  --batch_size=4

# Export fine-tuned model
python scripts/export.py --output="models/fine_tuned"
```

### Required Training Data

1. **C4 Design Examples**
   - System architecture documents
   - Component specifications
   - Interface definitions
   - Configuration templates

2. **TypeScript Codebase**
   - Project source code
   - Test cases
   - API specifications
   - Type definitions

3. **Project Context**
   - Git history
   - Pull requests
   - Code reviews
   - Documentation

### Continuous Learning Pipeline

```python
MODEL_CONFIGS = {
    "project-tuned": ModelConfig(
        model_id="./models/fine_tuned",
        model_type="custom",
        description="Project-specific tuned model",
        parameters="350M",
        cpu_friendly=True,
        continuous_learning=True
    )
}
```

### Learning Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Learning Rate | 1e-5 | Fine-tuning rate |
| Batch Size | 4 | Training batch size |
| Context Window | 2048 | Token context length |
| Training Steps | 1000 | Steps per epoch |
| Validation Split | 0.1 | Validation data ratio |

### Monitoring Progress

```bash
# View training metrics
tensorboard --logdir=training_logs

# Evaluate model performance
python scripts/evaluate.py --model="project-tuned"

# Compare with baseline
python scripts/benchmark.py --models="codegen-350m,project-tuned"
```
