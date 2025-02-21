# Download System Design

## 1. Component Architecture

```mermaid
C4Component
    title Download System Components

    Container_Boundary(download, "Download System") {
        Component(dl_mgr, "Download Manager", "Core", "Orchestrates downloads")
        Component(dl_strategy, "Download Strategy", "Core", "Download patterns")
        Component(dl_worker, "Download Worker", "Core", "Executes downloads")
        Component(validator, "Validator", "Core", "Validates files")
    }

    Container_Boundary(cache, "Cache System") {
        Component(cache_mgr, "Cache Manager", "Core", "Manages cache")
        Component(storage, "Storage", "Core", "File operations")
    }

    Rel(dl_mgr, dl_worker, "Manages")
    Rel(dl_worker, dl_strategy, "Uses")
    Rel(dl_worker, validator, "Validates using")
    Rel(dl_worker, cache_mgr, "Stores via")
```

## 2. State Management

```mermaid
stateDiagram-v2
    [*] --> INITIALIZING
    INITIALIZING --> CHECKING_CACHE: init_complete
    CHECKING_CACHE --> CHECKING_SPACE: cache_miss
    CHECKING_CACHE --> COMPLETE: cache_hit
    CHECKING_SPACE --> DOWNLOADING: space_available
    CHECKING_SPACE --> FAILED: insufficient_space
    DOWNLOADING --> VALIDATING: download_complete
    DOWNLOADING --> FAILED: download_error
    VALIDATING --> COMPLETE: validation_success
    VALIDATING --> FAILED: validation_error
```

## 3. Download Strategy Pattern

```mermaid
classDiagram
    class DownloadStrategy {
        <<interface>>
        +download_file(file: ModelFile)
        +validate_file(file: ModelFile)
        +resume_download(file: ModelFile)
    }

    class SafetensorsStrategy {
        -repo_client: RepositoryClient
        -cache: CacheManager
        +download_file(file: ModelFile)
        +validate_file(file: ModelFile)
        +resume_download(file: ModelFile)
    }

    class PyTorchStrategy {
        -repo_client: RepositoryClient
        -cache: CacheManager
        +download_file(file: ModelFile)
        +validate_file(file: ModelFile)
        +resume_download(file: ModelFile)
    }

    DownloadStrategy <|-- SafetensorsStrategy
    DownloadStrategy <|-- PyTorchStrategy
```

## 4. Event System Integration

```mermaid
classDiagram
    class DownloadEvent {
        +type: EventType
        +model: ModelIdentity
        +timestamp: datetime
        +data: Dict
    }

    class ProgressEvent {
        +bytes_downloaded: int
        +total_bytes: int
        +progress: float
    }

    class StateChangeEvent {
        +old_state: DownloadState
        +new_state: DownloadState
        +reason: str
    }

    DownloadEvent <|-- ProgressEvent
    DownloadEvent <|-- StateChangeEvent
```

## 5. Cross-Component Communication

### Download Manager to Cache

```mermaid
sequenceDiagram
    participant DM as DownloadManager
    participant CM as CacheManager
    participant S as Storage

    DM->>CM: ensure_space(size)
    CM->>S: check_available()
    S-->>CM: space_available
    CM->>CM: apply_cache_policy()
    CM-->>DM: space_ensured

    DM->>CM: store_file(file)
    CM->>S: write_file()
    S-->>CM: write_complete
    CM-->>DM: store_complete
```

### Download Worker to Validator

```mermaid
sequenceDiagram
    participant DW as DownloadWorker
    participant V as Validator
    participant CM as CacheManager

    DW->>V: validate_file(file)
    V->>CM: get_file(path)
    CM-->>V: file_data
    V->>V: check_hash()
    V->>V: verify_format()
    V-->>DW: validation_result
```

## 6. Integration Points

1. **With Model Manager**

   - Download initiation
   - Status reporting
   - Cache management

2. **With Cache System**

   - Space management
   - File storage
   - Validation

3. **With API Gateway**
   - Progress reporting
   - Error handling
   - Status updates
