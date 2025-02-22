#!/usr/bin/env python3

import argparse
import logging
import os
import sys
from pathlib import Path

from huggingface_hub import snapshot_download
from huggingface_hub.utils import HfHubHTTPError, RepositoryNotFoundError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Required files for model verification
REQUIRED_FILES = {
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
}


def verify_model(model_dir: Path, model_id: str) -> bool:
    """Verify required model files are present."""
    if not model_dir.exists():
        logger.error(f"Model directory {model_dir} does not exist")
        return False

    downloaded_files = {f.name for f in model_dir.iterdir() if f.is_file()}
    missing_files = REQUIRED_FILES - downloaded_files
    if missing_files:
        logger.error(f"Missing required files for {model_id}: {missing_files}")
        return False

    logger.info(f"Model {model_id} verified successfully")
    return True


def download_model(model_id: str, cache_dir: Path) -> bool:
    """Download model using HuggingFace Hub functionality."""
    model_dir = cache_dir / "models" / model_id.replace("/", "--")

    try:
        model_dir.parent.mkdir(parents=True, exist_ok=True)
        logger.info(f"Downloading model {model_id} to {model_dir}")

        snapshot_download(
            repo_id=model_id,
            local_dir=model_dir,
            token=os.getenv("HF_TOKEN"),
            ignore_patterns=["*.msgpack", "*.h5"],
        )

        return verify_model(model_dir, model_id)

    except RepositoryNotFoundError:
        logger.error(f"Model {model_id} not found")
        return False
    except HfHubHTTPError as e:
        logger.error(f"HuggingFace Hub error: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to download model {model_id}: {e}")
        return False


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Download models from HuggingFace Hub")
    parser.add_argument("--model-id", required=True, help="HuggingFace model ID")
    parser.add_argument(
        "--cache-dir",
        type=Path,
        default=Path(".cache"),
        help="Cache directory (default: .cache)",
    )

    args = parser.parse_args()
    success = download_model(args.model_id, args.cache_dir)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
