from dataclasses import dataclass
from typing import List

@dataclass
class BenchmarkConfig:
    num_samples: int = 5  # Reduce number of samples for faster testing
    max_tokens: int = 512  # Limit output size
    timeout: int = 30     # Set timeout per generation
    prompts: List[str] = [
        "Write a function to sort a list",
        "Implement binary search",
        "Create a simple linked list class"
    ]