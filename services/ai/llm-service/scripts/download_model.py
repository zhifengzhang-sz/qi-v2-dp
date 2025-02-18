#!/usr/bin/env python3
"""
Model downloader for TGI service
Downloads model files from HuggingFace Hub based on configuration
"""

import os
from pathlib import Path
import logging
from huggingface_hub import snapshot_download, logging as hf_logging
from tqdm.auto import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
hf_logging.set_verbosity_info()


def load_model_config():
    """Load model configuration from environment variables"""
    model_id = os.getenv('HF_MODEL_ID')
    if not model_id:
        raise ValueError("HF_MODEL_ID environment variable must be set")
    return model_id


def download_model(model_id: str, output_dir: str = "/data"):
    """
    Download model files from HuggingFace Hub

    Args:
        model_id: HuggingFace model ID
        output_dir: Directory to save model files
    """
    logger.info(f"Starting download for model: {model_id}")
    logger.info(f"Output directory: {output_dir}")

    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=output_dir,
            max_workers=4,
            token=os.getenv("HF_TOKEN"),
            tqdm_class=tqdm  # Show progress bar
        )
        logger.info("Model download completed successfully")

        # Verify downloaded files
        model_path = Path(output_dir)
        files = list(model_path.glob('*'))
        logger.info(f"Downloaded files: {[f.name for f in files]}")
        return True

    except Exception as e:
        logger.error(f"Error downloading model: {str(e)}")
        return False


def main():
    try:
        model_id = load_model_config()
        success = download_model(model_id)
        if not success:
            exit(1)
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()
