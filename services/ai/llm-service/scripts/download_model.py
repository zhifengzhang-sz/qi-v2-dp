#!/usr/bin/env python3
import argparse
import sys
import logging
import os
from config.settings import Settings
from downloader.hf import ModelDownloader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    """CLI interface for model download."""
    parser = argparse.ArgumentParser(
        description="Download models from HuggingFace")
    parser.add_argument("--model-id", required=True,
                        help="HuggingFace model ID")
    parser.add_argument("--cache-dir", help="Cache directory for models")
    parser.add_argument("--timeout", type=int,
                        help="Download timeout in seconds")
    parser.add_argument("--retries", type=int, help="Number of retry attempts")
    parser.add_argument("--offline", action="store_true",
                        help="Use offline mode")
    args = parser.parse_args()

    # Add offline mode handling
    if args.offline:
        os.environ["HF_HUB_OFFLINE"] = "1"

    # Override settings with CLI arguments
    os.environ["CACHE_DIR"] = args.cache_dir if args.cache_dir else os.getenv(
        "CACHE_DIR", ".cache")
    if args.timeout:
        os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = str(args.timeout)
    if args.retries:
        os.environ["HF_MAX_RETRIES"] = str(args.retries)

    settings = Settings()
    downloader = ModelDownloader(settings)
    success = downloader.download(args.model_id)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
