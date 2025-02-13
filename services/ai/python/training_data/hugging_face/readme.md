# Dataset Configuration Guide

## Available Datasets

We use two different data sources:

1. **C4 Dataset** (web text)
   - Used for architecture and design patterns
   - Contains documentation, discussions, articles
   - Filtered for design-related content

2. **GitHub Code Dataset** (source code)
   - Used for TypeScript examples
   - Contains actual code from GitHub repositories
   - Filtered for .ts and .tsx files

## Sample Size Configuration

### C4 Dataset
```python
"c4_design": DatasetConfig(
    name="c4",
    split="train",
    sample_size="0.1%",  # Configure size here
    filter_keywords=["architecture", "design", "system", "component"],
    description="C4 dataset filtered for design and architecture content",
    source_type="web_text"
)
```

### GitHub Code Dataset
```python
"github_typescript": DatasetConfig(
    name="codeparrot/github-code",
    split="train",
    sample_size="1000",  # Configure size here
    filter_keywords=[".ts", ".tsx"],
    description="GitHub TypeScript code examples",
    source_type="code"
)
```

## Usage Examples

```bash
# Download C4 design content
python training_data/hugging_face/c4.py --config c4_design

# Download GitHub TypeScript examples
python training_data/hugging_face/c4.py --config github_typescript
```

## Dataset Sizes Reference

### C4 Dataset
| Sample Size | Approximate Download Size | Time Estimate |
|-------------|-------------------------|---------------|
| "0.1%"      | ~320MB                 | 5-10 minutes  |
| "1%"        | ~3.2GB                 | 30-45 minutes |

### GitHub Code Dataset
| Sample Size | Approximate Download Size | Time Estimate |
|-------------|-------------------------|---------------|
| "1000"      | ~50MB                  | 2-3 minutes   |
| "10000"     | ~500MB                 | 10-15 minutes |

Note: Actual download times may vary based on your internet connection.

## Cleanup

To remove cached datasets and start fresh:

```bash
# With confirmation prompt
python scripts/cleanup_cache.py

# Force cleanup without confirmation
python scripts/cleanup_cache.py --force
```

This will remove all cached datasets from:
- ~/.cache/huggingface/datasets
- ~/.cache/huggingface/hub

Note: After cleanup, the next download will fetch the data again.