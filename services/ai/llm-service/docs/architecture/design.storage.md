# Storage System Design

## 1. Component Overview

```mermaid
C4Component
    title Storage System Components

    Container_Boundary(storage, "Storage System") {
        Component(store_mgr, "Storage Manager", "Core", "Manages file operations")
        Component(space_mgr, "Space Manager", "Core", "Manages storage space")
        Component(index_mgr, "Index Manager", "Core", "Manages file index")
        Component(lock_mgr, "Lock Manager", "Core", "Manages file locks")
    }

    Container_Boundary(fs, "File System") {
        Component(fs_adapter, "FS Adapter", "Infrastructure", "File system operations")
        Component(fs_monitor, "FS Monitor", "Infrastructure", "Monitors changes")
    }

    Rel(store_mgr, space_mgr, "Uses")
    Rel(store_mgr, index_mgr, "Uses")
    Rel(store_mgr, lock_mgr, "Uses")
    Rel(store_mgr, fs_adapter, "Writes via")
    Rel(fs_monitor, fs_adapter, "Monitors")
```

## 2. Storage Directory Structure

```plaintext
/data/model-cache/
├── models/
│   ├── <namespace>/
│   │   └── <model>/
│   │       ├── <revision>/
│   │       │   ├── model.safetensors
│   │       │   └── config.json
│   │       └── metadata.json
│   └── temp/
├── index.json
└── locks/
```

## 3. Storage Operations

```mermaid
sequenceDiagram
    participant Client
    participant SM as StorageManager
    participant FS as FileSystem
    participant Lock as LockManager
    participant Index as IndexManager

    Client->>SM: store_file(file)
    SM->>Lock: acquire_lock(file)
    SM->>FS: write_file(data)
    SM->>Index: update_index(file)
    Index-->>SM: index_updated
    SM->>Lock: release_lock(file)
    SM-->>Client: success
```

## 4. Space Management

```mermaid
classDiagram
    class SpaceManager {
        -available: int
        -threshold: int
        +check_space(required: int)
        +reserve_space(size: int)
        +release_space(size: int)
    }

    class SpacePolicy {
        <<interface>>
        +should_free_space()
        +select_files() List[ModelFile]
    }

    class LRUSpacePolicy {
        -max_size: int
        -usage_tracker: Dict
        +should_free_space()
        +select_files()
    }

    SpaceManager --> SpacePolicy
    SpacePolicy <|-- LRUSpacePolicy
```

## 5. File Locking

```mermaid
classDiagram
    class LockManager {
        +acquire(path: Path)
        +release(path: Path)
        +is_locked(path: Path)
    }

    class FileLock {
        +path: Path
        +owner: str
        +timestamp: datetime
        +is_expired() bool
    }

    class LockError {
        +path: Path
        +reason: str
        +owner: str
    }

    LockManager --> FileLock
```

## 6. Index Management

```mermaid
classDiagram
    class IndexManager {
        +add_entry(entry: IndexEntry)
        +remove_entry(model: ModelIdentity)
        +get_entry(model: ModelIdentity)
        +list_entries() List[IndexEntry]
    }

    class IndexEntry {
        +model: ModelIdentity
        +files: List[ModelFile]
        +size: int
        +created_at: datetime
        +accessed_at: datetime
    }

    class IndexOperations {
        <<interface>>
        +save_index()
        +load_index()
        +update_entry(entry: IndexEntry)
    }

    IndexManager --> IndexEntry
    IndexManager --> IndexOperations
```

## 7. Integration Points

1. **With Download System**

   - File writing
   - Space checking
   - Temporary storage

2. **With Validation System**

   - File reading
   - Lock management
   - Index queries

3. **With Event System**
   - Storage events
   - Space alerts
   - Index updates
