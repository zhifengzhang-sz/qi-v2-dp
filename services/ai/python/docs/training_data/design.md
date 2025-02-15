I understand you want to balance simplicity with proper engineering patterns for a Hugging Face data loader. Here's a suggested structure:

```python
from dataclasses import dataclass
from typing import List

@dataclass
class DatasetConfig:
    name: str
    source: str = "allenai/c4"
    split: str = "train"
    keywords: List[str] = None
    min_length: int = 500
    max_length: int = 8000
    sample_size: int = 100

    def __post_init__(self):
        if self.keywords is None:
            self.keywords = ["architecture", "design"]
```

```python
from datasets import load_dataset
import json
from pathlib import Path
from config.data_config import DatasetConfig

def load_dataset_samples(config: DatasetConfig) -> list:
    """Load and filter samples from Hugging Face dataset based on config"""
    print(f"Loading {config.name} dataset:")
    print(f"- Keywords: {config.keywords}")
    print(f"- Sample size: {config.sample_size}")
    
    dataset = load_dataset(
        config.source,
        "en",
        split=config.split,
        streaming=True
    )
    
    samples = []
    processed = 0
    
    for item in dataset:
        processed += 1
        content = item["text"].strip()
        if (any(k in content.lower() for k in config.keywords) and 
            config.min_length <= len(content) <= config.max_length):
            samples.append(content)
            print(f"\rFound {len(samples)}/{config.sample_size} (checked {processed} items)", end="")
            if len(samples) >= config.sample_size:
                break
    
    print(f"\nHit rate: {len(samples)/processed*100:.1f}%")
    return samples
```

Usage example:

```python
from config.data_config import DatasetConfig
from huggingface_loader import load_dataset_samples
from pathlib import Path
import json

def download_dataset(config_name: str, output_dir: str = "training_data"):
    """Download dataset using specified configuration"""
    # Define configurations
    configs = {
        "design": DatasetConfig(
            name="design_patterns",
            keywords=["architecture", "design", "pattern"],
            sample_size=100
        ),
        "typescript": DatasetConfig(
            name="typescript",
            keywords=["typescript", "angular", "react"],
            sample_size=50,
            min_length=1000
        )
    }
    
    if config_name not in configs:
        raise ValueError(f"Unknown config: {config_name}")
    
    # Load samples using config
    samples = load_dataset_samples(configs[config_name])
    
    # Save samples
    Path(output_dir).mkdir(exist_ok=True)
    output_file = Path(output_dir) / f"{config_name}_samples.json"
    with open(output_file, "w") as f:
        json.dump(samples, f, indent=2)
    
    print(f"Saved {len(samples)} samples to {output_file}")

if __name__ == "__main__":
    import sys
    config_name = sys.argv[1] if len(sys.argv) > 1 else "design"
    download_dataset(config_name)
```

This structure:
1. Uses a config pattern with dataclasses
2. Separates concerns (config, loading, saving)
3. Maintains simplicity in each component
4. Allows easy addition of new dataset configurations

Run it with:
```bash
python training_data/download.py design
# or
python training_data/download.py typescript
```

The code is organized but still straightforward, with each file having a single responsibility while the config pattern makes it extensible.