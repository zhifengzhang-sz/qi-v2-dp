from transformers import pipeline
import os
import psutil
import json
import time
from pathlib import Path


def get_metrics():
    """Collect basic system metrics"""
    process = psutil.Process()
    memory_info = process.memory_info()

    return {
        "timestamp": time.time(),
        "memory_usage_mb": memory_info.rss / 1024 / 1024,
        "cpu_percent": process.cpu_percent(),
        "cache_size_mb": get_cache_size(),
        "system_memory_percent": psutil.virtual_memory().percent
    }


def get_cache_size():
    """Get HuggingFace cache size"""
    cache_dir = Path("/app/.cache/huggingface")
    if not cache_dir.exists():
        return 0

    total_size = sum(
        f.stat().st_size for f in cache_dir.rglob('*') if f.is_file())
    return total_size / 1024 / 1024


def main():
    metrics = get_metrics()
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
