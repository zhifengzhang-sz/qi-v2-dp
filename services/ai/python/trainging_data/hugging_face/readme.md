# Dataset Configuration Guide

## Available Configurations

The dataset size and filtering can be configured in `config/dataset_config.py`:

```python
DATASET_CONFIGS = {
    "c4_design": DatasetConfig(
        name="c4",
        split="train",
        sample_size="0.1%",  # Use "0.1%" for 0.1% of the dataset
        filter_keywords=["architecture", "design", "system", "component"],
        description="C4 dataset filtered for design and architecture content"
    )
}
```

## Sample Size Options

- Use percentages: "0.1%", "1%", "10%"
- Use absolute counts: "1000", "10000"
- Use ranges: "0:1000", "1000:2000"

## Examples

### For Design Content
```bash
# Default size (0.1%)
python trainging_data/hugging_face/c4.py --config c4_design

# After changing config to 1000 examples
# In config/dataset_config.py, update sample_size="1000"
```

### For TypeScript Content
```bash
# Default size (0.1%)
python trainging_data/hugging_face/c4.py --config c4_typescript

# After changing config to first 5000 examples
# In config/dataset_config.py, update sample_size="5000"
```

## Dataset Sizes Reference

| Sample Size | Approximate Download Size | Time Estimate |
|-------------|-------------------------|---------------|
| "0.1%"      | ~320MB                 | 5-10 minutes  |
| "1%"        | ~3.2GB                 | 30-45 minutes |
| "1000"      | ~50MB                  | 2-3 minutes   |
| "10000"     | ~500MB                 | 10-15 minutes |

Note: Actual download times may vary based on your internet connection.