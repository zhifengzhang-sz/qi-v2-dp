# Qi Chat Service

A containerized chat service using Ollama, MongoDB, and HuggingFace's Chat UI.

## Architecture

- **MongoDB**: Database server
- **Ollama**: LLM service running Deepseek model(s)
- **Chat UI**: HuggingFace's web interface

## Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.0+
- Make
- 8GB+ RAM (for the Ollama service)
- NVIDIA GPU (optional)

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Create environment files:**

   ```bash
   cp .env.example .env
   cp .env.local.example .env.local
   ```
   
3. **Configure your environment:**

   - **Common Configuration (.env):**  
     Edit `.env` for global settings such as MongoDB, Ollama port, UI port, HuggingFace token, and single‑model parameters.

     Example `.env`:

     ```ini
     MONGO_ROOT_USER=admin
     MONGO_ROOT_PASSWORD=your_secure_password
     MONGO_PORT=27017
     OLLAMA_PORT=11434
     UI_PORT=3100
     HF_TOKEN=your_huggingface_token

     # Single-model configuration:
     MODEL_NAME=deepseek-r1
     MODEL_SIZE=8b
     MODEL_VARIANT=llama-distill-q4_K_M
     ```

   - **Multi‑Model Configuration (.env-multi, optional):**  
     If running in multi‑model mode, create/edit a JSON file named `.env-multi` that includes only model-specific details. When using multi‑model mode, the common settings from `.env` are loaded first, then model definitions from `.env-multi` are used for model installation.

     Example `.env-multi`:

     ```json
     {
       "MODELS": [
         {
           "name": "deepseek-r1:8b-llama-distill-q4_K_M",
           "parameters": {
             "num_thread": 12,
             "num_ctx": 2048,
             "num_batch": 512
           },
           "endpoints": [
             {
               "type": "ollama",
               "url": "http://ollama-service:11434",
               "ollamaName": "deepseek-r1:8b-llama-distill-q4_K_M"
             }
           ]
         },
         {
           "name": "deepseek-r1:7b-qwen-distill-q4_K_M",
           "parameters": {
             "num_thread": 12,
             "num_ctx": 2048,
             "num_batch": 512
           },
           "endpoints": [
             {
               "type": "ollama",
               "url": "http://ollama-service:11434",
               "ollamaName": "deepseek-r1:7b-qwen-distill-q4_K_M"
             }
           ]
         },
         {
           "name": "deepseek-r1:7b",
           "parameters": {
             "num_thread": 8,
             "num_ctx": 1024,
             "num_batch": 256
           },
           "endpoints": [
             {
               "type": "ollama",
               "url": "http://ollama-service:11434",
               "ollamaName": "deepseek-r1:7b"
             }
           ]
         }
       ]
     }
     ```

## Usage

The Makefile supports both single‑model (default) and multi‑model modes.

### Available Commands

- **make help**  
  Show available commands.

- **make start**  
  Generate configuration and start all containers.

- **make install**  
  Install the default (single) model if not already installed.

- **make install-multi-models**  
  Install models defined in `.env-multi` (multi‑model mode).  
  (Note: The global settings still come from `.env`.)

- **make stop**  
  Stop all containers.

- **make clean**  
  Stop containers and remove volumes.

- **make logs**  
  View logs from all containers.

- **make pull-model**  
  Pull a new Ollama model interactively.

- **make list-models**  
  List installed models.

- **make model-info**  
  Show info for a specific model.

### Quick Start

1. **Start services:**

   ```bash
   make start
   ```

2. **Install Deepseek model(s):**

   - For single‑model mode (default from `.env`):
     ```bash
     make install
     ```
   - For multi‑model mode (using models from `.env-multi`):
     ```bash
     make install-multi-models
     ```

3. **Access services:**

   - **Chat UI:** [http://localhost:3100](http://localhost:3100)
   - **Ollama API:** [http://localhost:11434](http://localhost:11434)
   - **MongoDB:** localhost:27017

## Troubleshooting

- **MongoDB startup issues:**

  ```bash
  make clean
  make start
  ```

- **Model installation issues:**

  For single‑model mode:
  ```bash
  make install
  ```
  For multi‑model mode:
  ```bash
  make install-multi-models
  ```

- **Viewing service logs:**

  ```bash
  docker logs qi-ollama
  docker logs qi-mongodb
  docker logs qi-chat-ui
  ```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to your branch.
5. Create a Pull Request.

## License

MIT License
