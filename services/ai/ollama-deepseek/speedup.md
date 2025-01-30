## How to Speed Up

### 1. Quantize the Model

#### **Goal**: Reduce model size and RAM usage using 4-bit quantization.

#### **Steps**:

1. **Pull a Quantized Model**:

   ```bash
   # Replace your current model with a quantized variant
   docker exec -it qi-ollama ollama pull deepseek-coder:7b-q4_0
   ```

2. **Update `.env-local`**:
   Modify the `MODELS` section to use the quantized model:
   ```bash
   MODELS=`[
     {
       "name": "Ollama DeepSeek (Quantized)",
       "endpoints": [
         {
           "type": "ollama",
           "url": "http://ollama-service:11434",
           "ollamaName": "deepseek-coder:7b-q4_0"  # Updated name
         }
       ]
     }
   ]`
   ```

---

### 2. Use CPU-Optimized GGUF Format

#### **Goal**: Leverate GGUF for better CPU performance.

#### **Steps**:

1. **Download a GGUF Model**:

   ```bash
   # In your local `ollama` directory
   mkdir -p ollama/models
   cd ollama/models
   wget https://huggingface.co/TheBloke/CodeLlama-7B-GGUF/resolve/main/codellama-7b.Q4_K_M.gguf
   ```

2. **Create a Modelfile**:
   Create `ollama/Modelfile` with:

   ```bash
   FROM ./codellama-7b.Q4_K_M.gguf
   PARAMETER num_ctx 2048  # Reduced context window
   PARAMETER num_threads 12  # Match your CPU threads
   ```

3. **Rebuild the Model in Ollama**:

   ```bash
   docker exec -it qi-ollama sh -c "ollama create codellama-gguf -f /root/.ollama/Modelfile"
   ```

4. **Update `.env-local`**:
   Add the GGUF model to your `MODELS` list:
   ```bash
   {
     "name": "Code Llama (GGUF)",
     "endpoints": [
       {
         "type": "ollama",
         "url": "http://ollama-service:11434",
         "ollamaName": "codellama-gguf"  # Name from Modelfile
       }
     ]
   }
   ```

---

### 3. Limit CPU Threads & Context Window

#### **Goal**: Prevent resource contention and reduce RAM usage.

#### **Steps**:

1. **Add Thread Limits**:
   In your `Modelfile` or model parameters, specify:

   ```bash
   # In ollama/Modelfile
   PARAMETER num_threads 12  # Set to 75% of your CPU cores (e.g., 12 for 16 cores)
   PARAMETER num_ctx 2048    # Reduce from default 4096
   ```

2. **Update Docker Compose for Ollama**:
   Add CPU constraints in `docker-compose.yml`:
   ```yaml
   ollama-service:
     deploy:
       resources:
         limits:
           cpus: "12" # Reserve 12 CPU cores
   ```

---

### 4. Enable Hardware Acceleration (AVX/AVX2)

#### **Goal**: Use CPU vectorization for faster math operations.

#### **Steps**:

1. **Verify CPU Support**:

   ```bash
   # On your host machine (not in Docker)
   lscpu | grep avx
   ```

   If `avx2` is listed, proceed.

2. **Rebuild Ollama with AVX Support**:
   Create a custom Dockerfile for Ollama:

   ```dockerfile
   FROM ollama/ollama
   # Ensure Ollama uses AVX-optimized binaries
   RUN apt-get update && apt-get install -y llama.cpp-avx2
   ```

   Update `docker-compose.yml`:

   ```yaml
   ollama-service:
     build: .
     # ... rest of config ...
   ```

---

### **Final Integration Workflow**

1. **Rebuild Containers**:

   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

2. **Verify Models**:

   ```bash
   docker exec -it qi-ollama ollama list
   # Should show:
   # deepseek-coder:7b-q4_0
   # codellama-gguf
   ```

3. **Test Performance**:
   ```bash
   docker exec -it qi-ollama ollama run deepseek-coder:7b-q4_0 "Hello"
   ```

---

### **Expected Results**

| Optimization          | RAM Usage (7B Model) | Speed (Tokens/sec) |
| --------------------- | -------------------- | ------------------ |
| Baseline (FP16)       | ~14GB                | 1–2                |
| Quantized (q4_0)      | ~7GB                 | 3–5                |
| GGUF + Thread Control | ~6GB                 | 5–8                |

---

### **Troubleshooting**

- **Ollama Fails to Load Model**:
  - Check model files are mounted correctly in `./ollama/models`.
  - Verify `Modelfile` paths in the container.
- **Low Speed**:
  - Confirm `num_threads` matches your CPU cores.
  - Reduce `num_ctx` further (e.g., 1024).
- **RAM Exhaustion**:
  ```bash
  docker update qi-ollama --memory 48g --memory-swap 64g  # Limit Ollama's RAM
  ```

For 70B models, follow the same steps but use `codellama-70b.Q4_K_M.gguf` and ensure your system has ≥48GB free RAM.

## Updating Process

### 1. File Structure

```
services/ai/ollama-deepseek/
├── Dockerfile.ollama         # AVX-enabled build
├── docker-compose.yml        # Resource limits
├── Makefile                 # Installation commands
├── .env                     # Basic config
├── .env.local              # Model definitions
├── ollama/
│   └── config/
│       └── config.json     # Ollama optimization settings
└── models/
    └── deepseek-coder/     # Model storage
```

### 2. Update Files

#### `Dockerfile.ollama`

```dockerfile
FROM golang:1.21 as builder

RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    cmake

WORKDIR /build
RUN git clone https://github.com/ollama/ollama.git && \
    cd ollama && \
    CGO_ENABLED=1 GOARCH=amd64 go build -ldflags="-w -s" -tags="avx avx2 fma" -o /go/bin/ollama ./cmd/ollama

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /go/bin/ollama /usr/local/bin/ollama

EXPOSE 11434
ENV OLLAMA_HOST=0.0.0.0
ENV OLLAMA_MODELS=/root/.ollama/models

ENTRYPOINT ["/usr/local/bin/ollama"]
CMD ["serve"]
```

#### `docker-compose.yml`: using the following to replace the `ollama-service` service

```yaml
services:
  ollama-service:
    build:
      context: .
      dockerfile: Dockerfile.ollama
    container_name: qi-ollama
    volumes:
      - ./ollama:/root/.ollama
    ports:
      - "${OLLAMA_PORT:-11434}:11434"
    environment:
      - OLLAMA_CPU_ONLY=1
      - OLLAMA_COMPUTE=cpu
      - OLLAMA_THREAD=12
    deploy:
      resources:
        limits:
          memory: 8G
          cpus: "12"
    networks:
      - chat-ui
```

#### `ollama/config/config.json`

```json
{
  "gpu": false,
  "compute": "cpu",
  "numThread": 12,
  "modelPath": "/root/.ollama/models",
  "format": "gguf",
  "parameters": {
    "num_ctx": 2048,
    "num_batch": 512,
    "num_gqa": 8,
    "rope_frequency_base": 1e6
  }
}
```

#### `.env-local`

```javascript
MONGODB_URL =
  "mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongodb:27017/chat_db?authSource=admin";
HF_TOKEN = abc;
MODELS = `[{
  "name": "Deepseek Coder Optimized",
  "parameters": {
    "num_thread": 12,
    "num_ctx": 2048,
    "num_batch": 512,
    "num_gqa": 8,
    "rope_frequency_base": 1e6,
    "temperature": 0.1
  },
  "endpoints": [{
    "type": "ollama",
    "url": "http://ollama-service:11434",
    "ollamaName": "deepseek-coder:7b-q4_0-gguf"
  }]
}]`;
```

#### `Makefile`: the added items

```makefile
# Models to install
MODELS = deepseek-coder:7b-q4_0-gguf codellama:7b-q4_0-gguf

.PHONY: build
build: ## Build optimized Ollama
	docker-compose build ollama-service

.PHONY: configure
configure: ## Configure Ollama
	@mkdir -p ollama/config
	@cp ollama/config/config.json /root/.ollama/config/

.PHONY: install
install: configure ## Install models
	@echo "Installing models..."
	@for model in $(MODELS); do \
		docker exec -it qi-ollama ollama pull $$model; \
	done

.PHONY: verify
verify: ## Check installation
	@docker exec -it qi-ollama ollama list
```

### 3. Deployment Steps

```bash
# 1. Build optimized image
make build

# 2. Start services
make start

# 3. Install and configure
make install

# 4. Verify setup
make verify
```

### 4. Verification

1. Check CPU features:

```bash
lscpu | grep avx
```

2. Monitor performance:

```bash
docker stats qi-ollama
```

3. Test model:

```bash
curl -X POST http://localhost:11434/api/generate -d '{
  "model": "deepseek-coder:7b-q4_0-gguf",
  "prompt": "// write hello world in python"
}'
```
