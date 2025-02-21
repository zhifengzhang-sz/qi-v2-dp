# Model Manager Sequence Diagrams

## Model Download Flow
```mermaid
sequenceDiagram
    participant Client
    participant MM as ModelManager
    participant Cache as CacheManager
    participant DL as Downloader
    participant Worker as DownloadWorker
    participant Store as ModelStore

    Client->>MM: download_model(identity)
    MM->>Cache: validate_cache(identity)
    
    alt Cache Hit
        Cache-->>MM: model_found
        MM-->>Client: download_complete
    else Cache Miss
        Cache-->>MM: not_found
        MM->>Cache: ensure_space(required_size)
        Cache-->>MM: space_available
        
        MM->>DL: start_download(identity)
        DL->>Worker: execute_download(task)
        
        loop Until Complete
            Worker->>Store: store_chunk(data)
            Worker->>DL: report_progress(bytes)
            DL->>MM: download_event(progress)
        end
        
        Worker->>Cache: validate_files()
        Cache-->>Worker: validation_result
        Worker->>DL: download_complete
        DL->>MM: download_success
        MM-->>Client: download_complete
    end
```

## Cache Management Flow
```mermaid
sequenceDiagram
    participant DL as Downloader
    participant Cache as CacheManager
    participant Policy as CachePolicy
    participant Store as ModelStore
    
    DL->>Cache: ensure_space(size)
    Cache->>Policy: should_evict()
    
    alt Need Eviction
        Policy-->>Cache: true
        Cache->>Policy: select_candidates()
        Policy-->>Cache: candidates
        
        loop For Each Candidate
            Cache->>Store: remove_file(file)
            Store-->>Cache: removed
        end
        
        Cache-->>DL: space_available
    else Space Available
        Policy-->>Cache: false
        Cache-->>DL: space_available
    end
```

## Model Validation Flow
```mermaid
sequenceDiagram
    participant MM as ModelManager
    participant Val as Validator
    participant Cache as CacheManager
    participant Store as ModelStore
    
    MM->>Val: validate_model(identity)
    Val->>Cache: get_cache_entry(identity)
    Cache-->>Val: entry
    
    loop For Each File
        Val->>Store: read_file(path)
        Store-->>Val: file_data
        Val->>Val: verify_hash(data)
    end
    
    Val->>Cache: update_validation(result)
    Val-->>MM: validation_result
```

These sequence diagrams show:
1. Complete download workflow
2. Cache management decisions
3. Model validation process
4. Error handling points
5. Event propagation
