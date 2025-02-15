import argparse
from pathlib import Path
import sys
import json

# Add project root to Python path
root_dir = Path(__file__).parent.parent
sys.path.append(str(root_dir))

from config.dataset_config import DATASET_CONFIGS
from training_data.download_data import download_samples

def main():
    parser = argparse.ArgumentParser(description="Download and prepare training data")
    parser.add_argument(
        "--source",
        choices=list(DATASET_CONFIGS.keys()),
        required=True,
        help="Dataset configuration to use"
    )
    parser.add_argument(
        "--output",
        default="training_data",
        help="Output directory for downloaded data"
    )
    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(exist_ok=True)

    dataset = download_samples(args.source, args.output)
    output_file = output_dir / f"{args.source}_samples.json"
    
    with open(output_file, "w") as f:
        json.dump(dataset, f, indent=2)
    
    print(f"Saved {len(dataset)} samples to {output_file}")

if __name__ == "__main__":
    main()
