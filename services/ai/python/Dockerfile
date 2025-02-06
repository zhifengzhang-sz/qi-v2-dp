#FROM python:3.14.0a4-slim-bookworm
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TRANSFORMERS_CACHE=/cache/transformers \
    HF_HOME=/cache/huggingface

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        gcc \
        g++ \
        make \
        && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python packages for direct Mixtral usage
COPY requirements.txt .
# First upgrade pip and install PyTorch CPU
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt