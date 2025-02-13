from dataclasses import dataclass
from typing import List, Dict

@dataclass
class DatasetConfig:
    name: str
    split: str
    sample_size: str
    filter_keywords: List[str]
    description: str
    source_type: str  # Added to distinguish data sources

DATASET_CONFIGS: Dict[str, DatasetConfig] = {
    "c4_design": DatasetConfig(
        name="c4",
        split="train",
        sample_size="0.1%",
        filter_keywords=["architecture", "design", "system", "component"],
        description="C4 dataset filtered for design and architecture content",
        source_type="web_text"
    ),
    "github_typescript": DatasetConfig(
        name="codeparrot/github-code",
        split="train",
        sample_size="1000",
        filter_keywords=[".ts", ".tsx"],
        description="GitHub TypeScript code examples",
        source_type="code"
    )
}