# HuggingFace Integration

## Related Documentation
- [System Overview](../../architecture/overview.md)
- [Download Component](../components/download.md)

## Components Used

1. **Hub API**

   ```python
   from huggingface_hub import snapshot_download
   ```

2. **Error Handling**
   ```python
   from huggingface_hub.utils import (
       HfHubHTTPError,
       RepositoryNotFoundError,
   )
   ```

## Configuration

```python
from huggingface_hub import snapshot_download

def download_model(model_id: str, cache_dir: Path) -> bool:
    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=cache_dir,
            token=os.getenv("HF_TOKEN"),
            resume_download=True,
            ignore_patterns=["*.msgpack", "*.h5"]
        )
        return True
    except Exception as e:
        logger.error(f"Download failed: {e}")
        return False
```

## Integration Details
1. Model Download: `huggingface_hub.snapshot_download`
2. Error Handling: `HfHubHTTPError`, `RepositoryNotFoundError`
3. Cache Management: Built-in HF cache system

## 1. Core HuggingFace Components We Use

1. **Model Hub**

   - Repository access
   - Model files download
   - File validation
   - Versioning

2. **Transformers Library**

   - Model loading
   - File format handling
   - Model validation

3. **TGI (Text Generation Inference)**
   - Model serving
   - Request handling
   - Resource management

## 2. Our Integration Points

```mermaid
C4Container
    title Integration Architecture

    Container_Boundary(our_system, "Our System") {
        Container(model_mgr, "Model Manager", "Python", "Orchestrates model lifecycle")
        Container(api, "API Gateway", "FastAPI", "Service interface")
    }

    Container_Boundary(hf, "HuggingFace") {
        Container(hub, "Model Hub", "External", "Model repository")
        Container(tgi, "TGI", "External", "Inference service")
        Container(transformers, "Transformers", "Library", "Model handling")
    }

    Rel(model_mgr, hub, "Downloads from")
    Rel(model_mgr, transformers, "Validates using")
    Rel(api, tgi, "Routes to")
```

## 3. What We Don't Need to Implement

1. **Download System**

   - ✅ Use `huggingface_hub.snapshot_download()`
   - ✅ Built-in caching
   - ✅ Automatic validation
   - ✅ Resume capability

2. **Validation**

   - ✅ Use `transformers.AutoModel.from_pretrained()`
   - ✅ Built-in format validation
   - ✅ Hash verification
   - ✅ Compatibility checks

3. **Storage**
   - ✅ Use HuggingFace's cache system
   - ✅ Built-in space management
   - ✅ File organization

## 4. What We Need to Implement

```mermaid
classDiagram
    class ModelManager {
        +download_model(model_id: str)
        +get_model_status(model_id: str)
        -handle_download_completion()
    }

    class TGIService {
        +load_model(model_id: str)
        +unload_model(model_id: str)
        +get_status()
    }

    class APIGateway {
        +handle_download_request()
        +handle_inference_request()
        +get_model_status()
    }
```

## 5. Simplified Implementation Approach

```python
# Example integration code
from huggingface_hub import snapshot_download
from transformers import AutoModel

class ModelManager:
    def download_model(self, model_id: str):
        # HuggingFace handles download, caching, and validation
        path = snapshot_download(
            repo_id=model_id,
            cache_dir=self.cache_dir
        )
        return path

    def validate_model(self, model_id: str):
        # Transformers handles validation
        try:
            AutoModel.from_pretrained(model_id)
            return True
        except Exception as e:
            return False
```

## 6. Configuration Focus

```yaml
huggingface:
  cache_dir: /data/models
  token: ${HF_TOKEN}
  revision: main

tgi:
  max_models: 2
  max_input_length: 1024
  max_total_tokens: 2048
```

## Implementation Details

```python
def download_model(model_id: str, cache_dir: Path) -> bool:
    try:
        snapshot_download(
            repo_id=model_id,
            local_dir=cache_dir,
            token=os.getenv("HF_TOKEN"),
            resume_download=True
        )
        return True
    except Exception as e:
        logger.error(f"Download failed: {e}")
        return False
```

## Configuration

Environment variables:

- `HF_TOKEN`: Authentication token
- `HF_HUB_DOWNLOAD_TIMEOUT`: Download timeout (default: 600s)
- `HF_HUB_ENABLE_HF_TRANSFER`: Use HF transfer protocol (default: 0)
