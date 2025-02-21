#!/usr/bin/env python3

from huggingface_hub import snapshot_download
from huggingface_hub.utils import (
    HfHubHTTPError,
    RepositoryNotFoundError,
    LocalEntryNotFoundError,
)
import logging
import sys
import os
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


def download_model(model_id: str, cache_dir: Path) -> bool:
    """Download model using HuggingFace Hub functionality"""
    try:
        logger.info(f"Downloading model {model_id} to {cache_dir}")
        snapshot_download(
            repo_id=model_id,
            local_dir=cache_dir,
            token=os.getenv("HF_TOKEN"),
            # Removed resume_download as it's deprecated
            ignore_patterns=["*.msgpack", "*.h5"]
        )
        return True
    except RepositoryNotFoundError as e:
        logger.error(f"Model {model_id} not found: {e}")
        return False
    except HfHubHTTPError as e:
        logger.error(
            f"Download failed due to HTTP error: {e} (Status: {e.response.status_code if e.response else 'unknown'})")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during download: {e}")
        return False


def main():
    model_id = os.getenv("MODEL_ID")
    hf_token = os.getenv("HF_TOKEN")

    if not model_id:
        logger.error("MODEL_ID environment variable not set")
        sys.exit(1)

    if not hf_token:
        logger.warning("HF_TOKEN not set - attempting anonymous download")

    cache_dir = Path("/data/hub" if os.path.exists("/data/hub") else ".cache")
    cache_dir.mkdir(exist_ok=True)

    success = download_model(model_id, cache_dir)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
