from datasets import load_dataset, IterableDataset
import sys
from pathlib import Path
import time
from requests.exceptions import ConnectionError
import socket

# Add the project root to Python path
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

from config.dataset_config import DATASET_CONFIGS

def load_filtered_dataset(config_name: str, max_retries=3, retry_delay=5):
    """Load and filter dataset based on configuration with retry logic"""
    if config_name not in DATASET_CONFIGS:
        raise ValueError(f"Unknown config name: {config_name}")
    
    config = DATASET_CONFIGS[config_name]
    print(f"Loading dataset: {config.description}")
    print(f"Sample size: {config.sample_size}")
    
    # Retry logic for dataset loading
    for attempt in range(max_retries):
        try:
            # Test connection first
            socket.gethostbyname('huggingface.co')
            
            # Remove buffer_size from load_dataset parameters
            dataset = load_dataset(
                "allenai/c4",
                "en",
                split=config.split,
                streaming=True,
                trust_remote_code=True
            )
            break
        except (ConnectionError, socket.gaierror) as e:
            if attempt == max_retries - 1:
                raise ConnectionError(
                    f"Failed to connect after {max_retries} attempts. "
                    "Please check your internet connection and DNS settings."
                ) from e
            print(f"Connection attempt {attempt + 1} failed. Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
    
    # Apply shuffling with buffer size to the iterable dataset
    if isinstance(dataset, IterableDataset):
        dataset = dataset.shuffle(
            seed=42,
            buffer_size=1000  # Buffer size for shuffling
        )
    
    # Filter based on keywords
    def contains_keywords(text: str) -> bool:
        text = text.lower()
        return any(keyword in text for keyword in config.filter_keywords)
    
    # Filter and limit to specified sample size with progress tracking
    filtered_data = []
    sample_size = int(config.sample_size)
    processed = 0
    
    print("Starting to process and filter data...")
    for item in dataset:
        processed += 1
        if contains_keywords(item["text"]):
            filtered_data.append(item)
            print(f"\rFound {len(filtered_data)}/{sample_size} matching examples...", end="")
            if len(filtered_data) >= sample_size:
                print("\nReached desired sample size!")
                break
        if processed % 1000 == 0:
            print(f"\rProcessed {processed} items, found {len(filtered_data)} matches...", end="")
    
    print(f"\nCollection complete: {len(filtered_data)} {config_name} examples from {processed} items")
    return filtered_data

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--config",
        choices=list(DATASET_CONFIGS.keys()),
        default="c4_design",
        help="Dataset configuration to use"
    )
    args = parser.parse_args()
    
    dataset = load_filtered_dataset(args.config)