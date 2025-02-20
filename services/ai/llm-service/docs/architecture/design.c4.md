# LLM Service C4 Architecture

## Level 1: System Context

```mermaid
C4Context
    title LLM Service System Context

    Person(user, "Service User", "Uses LLM service")
    Person(admin, "Administrator", "Manages service")

    System(llm, "LLM Service", "Text generation inference service")

    System_Ext(model_repo, "Model Repository", "HuggingFace Hub")
    System_Ext(compute, "Compute Resources", "CPU/GPU")
    System_Ext(metrics, "Monitoring", "Metrics & logging")

    Rel(user, llm, "Makes inference requests")
    Rel(admin, llm, "Manages models and deployment")
    Rel(llm, model_repo, "Downloads models")
    Rel(llm, compute, "Uses for inference")
    Rel(llm, metrics, "Reports status")
```

## Level 2: Container

```mermaid
C4Container
    title LLM Service Containers

    Person(user, "Service User")
    Person(admin, "Administrator")

    System_Boundary(llm, "LLM Service") {
        Container(gateway, "API Gateway", "FastAPI", "Service interface")
        Container(model_mgr, "Model Manager", "Python", "Model lifecycle")
        Container(inference, "Inference Engine", "TGI/Rust", "Text generation")

        ContainerDb(model_store, "Model Store", "File System", "Model storage")
        ContainerDb(metrics_db, "Metrics Store", "Prometheus", "Service metrics")
    }

    System_Ext(model_repo, "HuggingFace")

    Rel(user, gateway, "Uses", "HTTPS/REST")
    Rel(admin, gateway, "Manages", "HTTPS/REST")
    Rel(gateway, inference, "Routes to", "gRPC")
    Rel(model_mgr, model_repo, "Downloads from", "HTTPS")
    Rel(model_mgr, model_store, "Manages", "File I/O")
    Rel(inference, model_store, "Loads from", "File I/O")
```

## Level 3: Component

### Model Manager Components

```mermaid
C4Component
    title Model Manager Components

    Container_Boundary(model_mgr, "Model Manager") {
        Component(dl_svc, "Download Service", "Core", "Downloads models")
        Component(validation, "Validation Service", "Core", "Validates models")
        Component(storage, "Storage Service", "Core", "Manages storage")
        Component(lifecycle, "Lifecycle Manager", "Core", "Model lifecycle")
    }

    ContainerDb(model_store, "Model Store")
    System_Ext(model_repo, "HuggingFace")

    Rel(dl_svc, model_repo, "Downloads from")
    Rel(dl_svc, validation, "Validates using")
    Rel(validation, storage, "Stores via")
    Rel(storage, model_store, "Manages")
    Rel(lifecycle, storage, "Uses")
```

### Inference Engine Components

```mermaid
C4Component
    title Inference Engine Components

    Container_Boundary(inference, "Inference Engine") {
        Component(tgi, "TGI Service", "Core", "Model inference")
        Component(loader, "Model Loader", "Core", "Loads models")
        Component(scheduler, "Request Scheduler", "Core", "Manages requests")
        Component(monitor, "Health Monitor", "Core", "Monitors health")
    }

    ContainerDb(model_store, "Model Store")
    ContainerDb(metrics_db, "Metrics Store")

    Rel(loader, model_store, "Loads from")
    Rel(tgi, loader, "Uses")
    Rel(scheduler, tgi, "Routes to")
    Rel(monitor, metrics_db, "Reports to")
```

### API Gateway Components

```mermaid
C4Component
    title API Gateway Components

    Container_Boundary(gateway, "API Gateway") {
        Component(http, "HTTP Handler", "FastAPI", "REST endpoints")
        Component(rpc, "RPC Handler", "gRPC", "Internal comms")
        Component(auth, "Auth Service", "Core", "Authentication")
        Component(router, "Request Router", "Core", "Request routing")
    }

    Container_Ext(inference, "Inference Engine")
    Container_Ext(model_mgr, "Model Manager")

    Rel(http, auth, "Authenticates via")
    Rel(http, router, "Routes through")
    Rel(router, rpc, "Uses")
    Rel(rpc, inference, "Calls")
    Rel(rpc, model_mgr, "Manages")
```

## Level 4: Class

See component-specific class diagrams:

- [Model Manager Classes](classes/model_manager.md)
- [Inference Engine Classes](classes/inference_engine.md)
- [API Gateway Classes](classes/api_gateway.md)
