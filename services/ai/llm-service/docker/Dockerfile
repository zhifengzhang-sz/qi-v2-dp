FROM python:3.10-slim

WORKDIR /app

ARG DEVICE_TYPE=cpu
ENV DEVICE_TYPE=${DEVICE_TYPE} \
    PIP_DEFAULT_TIMEOUT=1000 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements/ requirements/

# Install Python packages with retry mechanism
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir --retries 3 -r requirements/${DEVICE_TYPE}.txt

COPY config/ config/
COPY scripts/ scripts/

RUN mkdir -p /app/.cache && touch /app/.ready

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import os; exit(0 if os.path.exists('/app/.ready') else 1)"

ENTRYPOINT ["python", "-u", "scripts/download_model.py"]