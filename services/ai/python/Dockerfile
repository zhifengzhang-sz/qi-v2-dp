FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV HF_HOME=/app/.cache/huggingface
ENV HF_HUB_DOWNLOAD_TIMEOUT=1000
ENV OMP_NUM_THREADS=8
ENV MKL_NUM_THREADS=8

# Create cache directory
RUN mkdir -p /app/.cache/huggingface

# Run as non-root user
RUN useradd -m worker && chown -R worker:worker /app
USER worker

# Command to run the application
ENTRYPOINT ["python", "app.py"]