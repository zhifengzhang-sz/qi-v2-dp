from datasets import load_dataset
import sys
from pathlib import Path

# Add the project root to Python path
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

from config.dataset_config import DATASET_CONFIGS

def load_filtered_dataset(config_name: str):
    """Load and filter dataset based on configuration"""
    if config_name not in DATASET_CONFIGS:
        raise ValueError(f"Unknown config name: {config_name}")
    
    config = DATASET_CONFIGS[config_name]
    print(f"Loading dataset: {config.description}")
    print(f"Sample size: {config.sample_size}")
    
    # Load dataset with configured sample size
    dataset = load_dataset(
        config.name,
        "en",
        split=f"{config.split}[:{config.sample_size}]"
    )
    
    # Filter based on keywords
    def contains_keywords(text: str) -> bool:
        text = text.lower()
        return any(keyword in text for keyword in config.filter_keywords)
    
    filtered_data = dataset.filter(lambda x: contains_keywords(x["text"]))
    print(f"Collected {len(filtered_data)} {config_name} examples")
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