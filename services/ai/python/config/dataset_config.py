from dataclasses import dataclass
from typing import List


@dataclass
class DatasetConfig:
    name: str
    description: str
    source: str = "allenai/c4"  # Add source attribute
    split: str = "train"
    filter_keywords: List[str] = None
    sample_size: int = 100
    min_length: int = 500
    max_length: int = 8000


DATASET_CONFIGS = {
    "c4_design": DatasetConfig(
        name="c4_design",
        description="C4 dataset filtered for design and architecture content",
        source="allenai/c4",
        filter_keywords=["design pattern", "architecture", "software design"],
        sample_size=100,
    ),
    "typescript": DatasetConfig(
        name="typescript",
        description="TypeScript code examples from GitHub",
        source="codeparrot/github-code",
        split="train",  # Changed from "TypeScript-mit"
        filter_keywords=["typescript", "angular", "react"],
        sample_size=50,
        min_length=1000,
    ),
}
