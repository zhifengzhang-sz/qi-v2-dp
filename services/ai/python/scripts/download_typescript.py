import os
from datasets import load_dataset
import logging
from pathlib import Path
import json
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def download_samples(output_dir: str, max_samples: int = 50):
    """
    Download and filter TypeScript code samples from the GitHub dataset.

    Args:
        output_dir: Directory to save the filtered samples
        max_samples: Maximum number of samples to collect
    """
    # Set environment variables for stability
    os.environ["HF_HUB_DOWNLOAD_TIMEOUT"] = "300"

    # Ensure cache and output directories exist
    cache_dir = Path(".cache/huggingface")
    output_path = Path(output_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)
    output_path.mkdir(parents=True, exist_ok=True)

    logger.info("Initializing dataset download")
    try:
        # Load dataset in streaming mode without parallel processing
        dataset = load_dataset(
            "codeparrot/github-code",
            split="train",
            streaming=True,
            trust_remote_code=True,
            cache_dir=str(cache_dir),
            verification_mode="no_checks",
        )

        logger.info("Successfully initialized dataset streaming")

        # Filter and collect samples
        filtered_data = []
        processed = 0
        keywords = ["typescript", "angular", "react"]

        for item in dataset:
            try:
                processed += 1
                if processed % 100 == 0:
                    logger.info(
                        f"Processed {processed} items, found {len(filtered_data)} matching samples"
                    )

                content = item.get("content", "")
                if not content:  # Skip empty content
                    continue

                content_lower = content.lower()

                # Check if content matches our criteria
                if any(keyword in content_lower for keyword in keywords):
                    if 1000 <= len(content) <= 8000:  # Length constraints
                        sample = {
                            "content": content,
                            "length": len(content),
                            "matched_keywords": [
                                k for k in keywords if k in content_lower
                            ],
                        }
                        filtered_data.append(sample)
                        logger.info(
                            f"Found matching sample #{len(filtered_data)} with keywords: {sample['matched_keywords']}"
                        )

                        # Save incrementally every 10 samples
                        if len(filtered_data) % 10 == 0:
                            output_file = (
                                output_path / "typescript_samples_partial.json"
                            )
                            with open(output_file, "w") as f:
                                json.dump(filtered_data, f, indent=2)
                            logger.info(
                                f"Saved {len(filtered_data)} samples to {output_file}"
                            )

                        if len(filtered_data) >= max_samples:
                            break

            except Exception as e:
                logger.warning(f"Error processing item {processed}: {str(e)}")
                continue

        # Save final results
        if filtered_data:
            final_output = output_path / "typescript_samples.json"
            with open(final_output, "w") as f:
                json.dump(filtered_data, f, indent=2)
            logger.info(
                f"Successfully saved {len(filtered_data)} samples to {final_output}"
            )
            logger.info(f"Total items processed: {processed}")
        else:
            logger.warning("No matching samples found")

        return filtered_data

    except Exception as e:
        logger.error(f"Failed to download dataset: {str(e)}", exc_info=True)
        raise


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Download TypeScript code samples from GitHub dataset"
    )
    parser.add_argument(
        "--output", default="training_data", help="Output directory for samples"
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=50,
        help="Maximum number of samples to collect",
    )
    args = parser.parse_args()

    try:
        samples = download_samples(args.output, args.max_samples)
        if samples:
            logger.info("Download completed successfully")
    except KeyboardInterrupt:
        logger.info("\nDownload interrupted by user")
    except Exception as e:
        logger.error(f"Download failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
