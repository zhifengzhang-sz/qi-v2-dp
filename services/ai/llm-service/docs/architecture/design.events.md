# Event System Design

## 1. Component Overview

```mermaid
C4Component
    title Event System Components

    Container_Boundary(events, "Event System") {
        Component(event_bus, "Event Bus", "Core", "Event distribution")
        Component(dispatcher, "Event Dispatcher", "Core", "Handler management")
        Component(queue, "Event Queue", "Core", "Event buffering")
        Component(monitor, "Event Monitor", "Core", "System monitoring")
    }

    Container_Ext(download, "Download System")
    Container_Ext(storage, "Storage System")
    Container_Ext(validation, "Validation System")

    Rel(download, event_bus, "Publishes to")
    Rel(storage, event_bus, "Publishes to")
    Rel(validation, event_bus, "Publishes to")
    Rel(event_bus, dispatcher, "Routes via")
    Rel(dispatcher, queue, "Buffers in")
    Rel(monitor, event_bus, "Monitors")
```

## 2. Event Hierarchy

```mermaid
classDiagram
    class Event {
        +id: UUID
        +type: EventType
        +timestamp: datetime
        +data: Dict
    }

    class DownloadEvent {
        +model: ModelIdentity
        +state: DownloadState
        +progress: float
    }

    class StorageEvent {
        +path: Path
        +operation: StorageOp
        +size: int
    }

    class ValidationEvent {
        +model: ModelIdentity
        +result: ValidationResult
    }

    Event <|-- DownloadEvent
    Event <|-- StorageEvent
    Event <|-- ValidationEvent
```

## 3. Event Processing

```mermaid
sequenceDiagram
    participant P as Publisher
    participant B as EventBus
    participant D as Dispatcher
    participant H as Handler
    participant Q as Queue

    P->>B: publish(event)
    B->>D: dispatch(event)
    D->>Q: enqueue(event)
    loop Process Queue
        Q->>D: dequeue()
        D->>H: handle(event)
        H-->>D: result
    end
```

## 4. Handler Management

```mermaid
classDiagram
    class EventHandler {
        <<interface>>
        +handle(event: Event)
        +supports(event: Event) bool
    }

    class DownloadHandler {
        +handle(event: DownloadEvent)
        +supports(event: Event)
    }

    class StorageHandler {
        +handle(event: StorageEvent)
        +supports(event: Event)
    }

    EventHandler <|-- DownloadHandler
    EventHandler <|-- StorageHandler
```

## 5. Event Types

### Download Events

- `DOWNLOAD_STARTED`
- `DOWNLOAD_PROGRESS`
- `DOWNLOAD_COMPLETED`
- `DOWNLOAD_FAILED`

### Storage Events

- `STORAGE_FILE_CREATED`
- `STORAGE_FILE_DELETED`
- `STORAGE_SPACE_LOW`
- `STORAGE_ERROR`

### Validation Events

- `VALIDATION_STARTED`
- `VALIDATION_COMPLETED`
- `VALIDATION_FAILED`

## 6. Integration Points

1. **With Download System**

   ```python
   class DownloadManager:
       def __init__(self, event_bus: EventBus):
           self.event_bus = event_bus

       def start_download(self, model: ModelIdentity):
           self.event_bus.publish(DownloadEvent(
               type=EventType.DOWNLOAD_STARTED,
               model=model
           ))
   ```

2. **With Storage System**

   ```python
   class StorageManager:
       def __init__(self, event_bus: EventBus):
           self.event_bus = event_bus

       def store_file(self, file: ModelFile):
           self.event_bus.publish(StorageEvent(
               type=EventType.STORAGE_FILE_CREATED,
               path=file.path
           ))
   ```

3. **With Validation System**

   ```python
   class ValidationManager:
       def __init__(self, event_bus: EventBus):
           self.event_bus = event_bus

       def validate_model(self, model: ModelIdentity):
           self.event_bus.publish(ValidationEvent(
               type=EventType.VALIDATION_STARTED,
               model=model
           ))
   ```
