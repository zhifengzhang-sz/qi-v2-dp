# Component Version Compatibility

## Version Matrix

| Component  | Version | Dependencies   | Compatible With |
| ---------- | ------- | -------------- | --------------- |
| Download   | v1.0    | Events >= 1.0  | Cache >= 1.0    |
|            |         | Storage >= 1.0 | TGI >= 1.0      |
| Cache      | v1.0    | Storage >= 1.0 | Download >= 1.0 |
|            |         | Events >= 1.0  |                 |
| Storage    | v1.0    | Events >= 1.0  | All >= 1.0      |
| Validation | v1.0    | Storage >= 1.0 | Download >= 1.0 |
|            |         | Events >= 1.0  |                 |
| Events     | v1.0    | None           | All >= 1.0      |

## API Versioning

```yaml
api:
  current: v1
  supported:
    - v1
  deprecated:
    - beta
  sunset_dates:
    beta: "2024-12-31"
```

## Storage Format Versioning

```yaml
storage:
  index_format: v1
  cache_format: v1
  backward_compatible: true
  migration_required: false
```

## Event Schema Versioning

```yaml
events:
  schema_version: v1
  backward_compatible: true
  supported_versions:
    - v1
```

## Component Interface Changes

### v1.0 to v1.1

```diff
# Download Interface
+ async download_with_options(model: ModelIdentity, options: DownloadOptions)
- download_with_config(model: ModelIdentity, config: Dict)

# Cache Interface
+ get_cache_stats() -> CacheStats
+ cleanup_by_policy(policy: CachePolicy)

# Storage Interface
+ async copy_file(source: Path, dest: Path)
+ get_storage_metrics() -> StorageMetrics
```

## Breaking Changes

### v1.0

- Initial stable release
- Base interfaces defined
- Standard event schemas

### Future v2.0

- New cache format (migration required)
- Enhanced validation pipeline
- Updated event schemas
