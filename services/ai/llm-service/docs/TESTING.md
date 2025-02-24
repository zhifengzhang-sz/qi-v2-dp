# Testing Guide: HuggingFace Hub Integration

## Common Issues and Solutions

### 1. Mocking HuggingFace Hub Functions

Correct way to mock the hub interface:

```python
# Mock at the point where code imports it
mocker.patch(
    "downloader.hf.snapshot_download",
    autospec=True,
    return_value=str(model_path)
)
```

Common pitfalls:

- ❌ Mocking wrong import path (`huggingface_hub.snapshot_download`)
- ❌ Not using `autospec=True`
- ❌ Returning `Path` objects instead of strings

### 2. Understanding HuggingFace Hub API

Key function signatures to understand:

```python
def snapshot_download(
    repo_id: str,
    local_dir: Optional[str | Path] = None,
    local_dir_use_symlinks: bool = True,
    token: Optional[str] = None,
    local_files_only: bool = False,
    max_workers: int = 8,
) -> str:  # Note: Always returns str
```

### 3. Test Environment Setup

Required fixtures:

```python
@pytest.fixture
def env_setup(monkeypatch: pytest.MonkeyPatch) -> None:
    """Setup required environment variables."""
    monkeypatch.setenv("ENV", "test")
    monkeypatch.setenv("HF_TOKEN", "dummy-token")
```

## Best Practices

1. **Mock Configuration**

   - Mock where code imports the function
   - Use `autospec=True` for function signature validation
   - Return correct types from mocks (str for paths)

2. **Test Coverage**

   - Verify retry logic (3 attempts)
   - Test timeout scenarios
   - Check file existence after downloads
   - Test progress callbacks

3. **Environment Setup**
   - Use fixtures for repeatable setup
   - Set required environment variables
   - Create temporary directories

## Current Coverage Status

```text
Name                        Stmts   Miss  Cover
-----------------------------------------------
cache/manager.py               12      0   100%
config/settings.py             76     13    83%
downloader/hf.py              49     14    71%
scripts/download_model.py      27     27     0%
-----------------------------------------------
TOTAL                        164     54    67%
```

## Areas for Improvement

1. **Download Script Testing (0% coverage)**

   - Add CLI argument tests
   - Test main function execution
   - Mock model download calls

2. **Error Cases**

   - Network failures
   - Invalid model IDs
   - Permission issues

3. **Configuration Tests**
   - Environment loading edge cases
   - File permission scenarios
   - Cache directory handling
