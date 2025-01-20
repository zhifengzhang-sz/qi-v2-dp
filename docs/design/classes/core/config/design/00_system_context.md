# System Context Design

## 1. System Boundaries

```mermaid
C4Context
    title Configuration System Context
    Person(dev, "Developer", "Application developer using config system")
    Person(admin, "Administrator", "System administrator managing configs")

    System(config, "Configuration System", "Core configuration management")

    System_Ext(files, "File System", "Configuration files")
    System_Ext(env, "Environment", "Environment variables")
    System_Ext(remote, "Remote Source", "Remote configuration")
    System_Ext(cache, "Cache Storage", "Configuration cache")

    Rel(dev, config, "Uses")
    Rel(admin, config, "Manages")

    Rel(config, files, "Reads/Writes")
    Rel(config, env, "Reads")
    Rel(config, remote, "Syncs")
    Rel(config, cache, "Stores/Retrieves")
```

## 2. Actor Responsibilities

| Actor                | Primary Responsibilities | Secondary Responsibilities |
| -------------------- | ------------------------ | -------------------------- |
| Developer            | Use configurations       | Monitor changes            |
| Administrator        | Manage configurations    | Setup sources              |
| Configuration System | Load & validate configs  | Cache & notify             |

## 3. External Systems

| System        | Role               | Protocol  |
| ------------- | ------------------ | --------- |
| File System   | Local storage      | File I/O  |
| Environment   | Runtime config     | ENV vars  |
| Remote Source | Distributed config | HTTP/gRPC |
| Cache Storage | Fast retrieval     | Cache API |

## 4. System Interfaces

### 4.1 Input Interfaces

$$I = \{FileSystem, Environment, RemoteSource\}$$

### 4.2 Output Interfaces

$$O = \{Cache, Events, Logs\}$$

### 4.3 Control Flow

$$Developer \xrightarrow{uses} Config \xrightarrow{reads} Source$$
$$Admin \xrightarrow{manages} Config \xrightarrow{writes} Source$$
