# Cache Management Design

## Overview

The cache management system handles model file storage, validation, and cleanup.

## Components

### Cache Structure

```mermaid
classDiagram
    class CacheManager {
        -root_dir: Path
        -policies: List[CachePolicy]
        +initialize()
        +validate_cache(model: ModelIdentity)
        +ensure_space(required: int)
        +get_cache_status() CacheStatus
    }

    class CachePolicy {
        <<interface>>
        +should_evict() bool
        +select_candidates() List[CacheEntry]
        +apply() Result
    }

    class LRUPolicy {
        -max_size: int
        -usage_tracker: UsageTracker
        +should_evict() bool
        +select_candidates() List[CacheEntry]
    }

    class TTLPolicy {
        -max_age: timedelta
        -last_accessed: Dict
        +should_evict() bool
        +select_candidates() List[CacheEntry]
    }

    class CacheEntry {
        +model: ModelIdentity
        +size: int
        +last_accessed: datetime
        +is_complete: bool
        +validate() bool
    }

    CacheManager --> CachePolicy
    CachePolicy <|-- LRUPolicy
    CachePolicy <|-- TTLPolicy
    CacheManager --> CacheEntry
```

### State Management

```mermaid
stateDiagram-v2
    [*] --> Initializing
    Initializing --> Ready: Cache validated
    Ready --> Validating: New entry
    Validating --> Ready: Valid
    Validating --> Cleaning: Invalid
    Ready --> Cleaning: Space needed
    Cleaning --> Ready: Space freed
    Ready --> [*]: Shutdown
```

## Operations

### Cache Validation

```mermaid
sequenceDiagram
    participant MM as ModelManager
    participant CM as CacheManager
    participant FS as FileSystem

    MM->>CM: validate_cache(model)
    CM->>FS: check_files()
    FS-->>CM: file_status
    CM->>CM: verify_hashes()
    CM-->>MM: validation_result
```

### Space Management

```mermaid
sequenceDiagram
    participant DL as Downloader
    participant CM as CacheManager
    participant POL as CachePolicy

    DL->>CM: ensure_space(size)
    CM->>POL: should_evict()
    POL-->>CM: true
    CM->>POL: select_candidates()
    POL-->>CM: entries
    CM->>CM: remove_entries()
    CM-->>DL: space_available
```

## Implementation Notes

1. Cache Directory Structure:

```
cache/
├── models/
│   ├── <namespace>/
│   │   └── <model>/
│   │       ├── <revision>/
│   │       │   ├── model.safetensors
│   │       │   └── config.json
│   │       └── metadata.json
│   └── temp/
└── index.json
```

2. Cache Index Format:

```json
{
  "entries": [
    {
      "model": "namespace/name@revision",
      "files": [
        {
          "path": "models/namespace/name/revision/file",
          "hash": "sha256:...",
          "size": 1234567,
          "last_accessed": "2024-02-21T12:00:00Z"
        }
      ],
      "total_size": 1234567,
      "is_complete": true
    }
  ],
  "size": 1234567,
  "last_cleanup": "2024-02-21T12:00:00Z"
}
```
