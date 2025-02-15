# Modified version of download_data.py with CDN workarounds

import os
from datasets import load_dataset
import logging
from pathlib import Path
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def download_samples(config_name: str, output_dir: str, max_retries=5, retry_delay=10):
    """Download and filter dataset with improved error handling"""

    # Set environment variables to bypass CDN and increase stability
    os.environ["HF_ENDPOINT"] = "https://huggingface.co"  # Use main API endpoint
    os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "300"
    os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"

    # Ensure cache directory exists
    cache_dir = Path(".cache/huggingface")
    cache_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Starting download with config: {config_name}")
    logger.info(f"Cache directory: {cache_dir}")

    # Configure the dataset loading with minimal concurrent operations
    try:
        dataset = load_dataset(
            "codeparrot/github-code",
            split="train",
            streaming=True,
            trust_remote_code=True,
            cache_dir=str(cache_dir),
            num_proc=1,  # Minimize concurrent downloads
            verification_mode="no_checks",
            download_mode="force_redownload",  # Force fresh download
        )

        logger.info("Successfully initialized dataset streaming")

        # Process the stream with careful error handling
        filtered_data = []
        processed = 0

        for item in dataset:
            try:
                processed += 1
                if processed % 100 == 0:
                    logger.info(f"Processed {processed} items...")

                content = item.get("content", "").lower()

                # Apply filters
                if any(
                    keyword in content for keyword in ["typescript", "angular", "react"]
                ):
                    if 1000 <= len(content) <= 8000:  # Length constraints
                        filtered_data.append(
                            {"content": content, "length": len(content)}
                        )

                        logger.info(f"Found matching sample ({len(filtered_data)})")

                        if len(filtered_data) >= 50:  # Sample size limit
                            break

            except Exception as e:
                logger.warning(f"Error processing item {processed}: {str(e)}")
                continue

        # Save results
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)

        import json

        output_file = output_path / "typescript_samples.json"
        with open(output_file, "w") as f:
            json.dump(filtered_data, f, indent=2)

        logger.info(f"Successfully saved {len(filtered_data)} samples to {output_file}")
        return filtered_data

    except Exception as e:
        logger.error(f"Failed to download dataset: {str(e)}")
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="training_data")
    args = parser.parse_args()

    download_samples("typescript", args.output)
