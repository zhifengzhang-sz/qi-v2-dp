# Download Error Handling

## Error Types

### Domain Errors

```python
class DownloadError(Exception):
    """Base class for download errors"""
    def __init__(self, message: str, code: str, retryable: bool = False):
        self.message = message
        self.code = code
        self.retryable = retryable

class ModelNotFoundError(DownloadError):
    """Model not found in repository"""
    def __init__(self, model_id: str):
        super().__init__(
            f"Model {model_id} not found",
            "MODEL_NOT_FOUND",
            retryable=False
        )

class StorageError(DownloadError):
    """Storage-related errors"""
    def __init__(self, message: str, retryable: bool = True):
        super().__init__(
            message,
            "STORAGE_ERROR",
            retryable=retryable
        )

class ValidationError(DownloadError):
    """Model validation errors"""
    def __init__(self, message: str, failures: List[str]):
        super().__init__(
            message,
            "VALIDATION_ERROR",
            retryable=False
        )
        self.failures = failures
```

## Error Handling Strategies

### Retry Policy

```python
@dataclass
class RetryConfig:
    max_attempts: int = 3
    initial_delay: float = 1.0
    max_delay: float = 30.0
    backoff_factor: float = 2.0
```

### Error Mapping

| Error Code       | HTTP Status | Description                        | Retryable |
| ---------------- | ----------- | ---------------------------------- | --------- |
| MODEL_NOT_FOUND  | 404         | Model not found in repository      | No        |
| STORAGE_ERROR    | 507         | Storage space or permission issues | Yes       |
| VALIDATION_ERROR | 400         | Model validation failed            | No        |
| NETWORK_ERROR    | 503         | Network connectivity issues        | Yes       |
| AUTH_ERROR       | 401         | Authentication failed              | No        |

### Recovery Procedures

1. **Network Errors**:

   - Implement exponential backoff
   - Maintain partial downloads
   - Resume from last successful chunk

2. **Storage Errors**:

   - Attempt cache cleanup
   - Check alternative storage locations
   - Clear temporary files

3. **Validation Errors**:
   - Log validation failures
   - Clean up invalid files
   - Report specific validation issues

## Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {
      "model_id": "affected model",
      "failures": ["specific error details"],
      "retryable": true|false
    },
    "request_id": "uuid for tracking"
  }
}
```

## Monitoring and Alerts

### Key Metrics

- Download failure rate
- Validation failure rate
- Storage error frequency
- Network error frequency

### Alert Thresholds

- Download failure rate > 10%
- Storage space < 20%
- Network errors > 5/minute
