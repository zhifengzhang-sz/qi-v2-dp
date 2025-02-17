# TGI-Based LLM Server Design

## 1. Context Diagram

```mermaid
C4Context
    title LLM Service - System Context

    Person(developer, "Developer", "Uses LLM service for code generation")
    Person(admin, "Administrator", "Manages and monitors the service")

    System_Boundary(llm, "LLM Service") {
        Container(model, "Model Service", "Handles model loading and execution\n[CPU/GPU]")
        Container(inference, "Inference Engine", "Manages generation requests")
        Container(cache, "Cache Service", "Model weights and generation cache")
    }

    System_Ext(docker, "Docker Engine", "Container runtime")
    System_Ext(cuda, "CUDA Runtime", "GPU computation [Optional]")
    System_Ext(huggingface, "HuggingFace Hub", "Model repository")

    Rel(developer, model, "Sends prompts")
    Rel(admin, model, "Manages and monitors")

    Rel(model, huggingface, "Downloads models")
    Rel(model, docker, "Runs in")
    Rel(model, cuda, "Uses for GPU acceleration [Optional]")
```

## 2. Container Diagram

```mermaid
C4Container
    title LLM Service - Containers

    Person(developer, "Developer", "Uses LLM service")
    Person(admin, "Administrator", "Manages service")

    Container_Boundary(llm_service, "LLM Service") {
        Container(api_gateway, "API Gateway", "FastAPI", "Handles external API requests")
        Container(tgi_service, "TGI Service", "Docker", "Manages TGI instance\n[CPU/GPU modes]")
        Container(config_service, "Config Service", "Python", "Infrastructure & model configuration")
        Container(health_monitor, "Health Monitor", "Python", "Service health monitoring")
    }

    System_Ext(monitoring, "Monitoring Stack", "Metrics collection")
    System_Ext(logging, "Logging Service", "Log aggregation")

    Rel(developer, api_gateway, "Uses", "HTTPS")
    Rel(admin, api_gateway, "Manages", "HTTPS")

    Rel(api_gateway, tgi_service, "Sends requests to")
    Rel(tgi_service, config_service, "Gets config from")
    Rel(health_monitor, monitoring, "Reports to")
    Rel(api_gateway, logging, "Logs to")
```

## 3. Component Diagram

```mermaid
C4Component
    title LLM Service - Components

    Container_Boundary(api, "API Gateway") {
        Component(request_handler, "Request Handler", "Handles API requests")
        Component(tgi_client, "TGI Client", "Communicates with TGI")
        Component(response_formatter, "Response Formatter", "Formats TGI responses")
    }

    Container_Boundary(tgi, "TGI Service") {
        Component(tgi_server, "TGI Server", "Text Generation Inference")
        Component(model_loader, "Model Loader", "Loads models from HF")
        Component(inference_engine, "Inference Engine", "Handles generation")
    }

    Container_Boundary(config, "Config Service") {
        Component(config_loader, "Config Loader", "Loads configurations")
        Component(env_manager, "Environment Manager", "Manages env variables")
    }

    Container_Boundary(monitor, "Health Monitor") {
        Component(health_checker, "Health Checker", "Checks service health")
        Component(metric_collector, "Metric Collector", "Collects metrics")
    }

    Rel(request_handler, tgi_client, "Uses")
    Rel(tgi_client, tgi_server, "Sends requests to")
    Rel(tgi_server, model_loader, "Uses")
    Rel(tgi_server, inference_engine, "Uses")
    Rel(health_checker, tgi_server, "Monitors")
```

## 4. Class Diagram

```mermaid
classDiagram
    %% Base Classes
    class TGIClient {
        +generate(prompt: str)
        +generate_stream(prompt: str)
        -handle_response()
    }

    class ConfigManager {
        +load_config()
        +get_model_config()
        +get_service_config()
    }

    class HealthMonitor {
        +check_health()
        +collect_metrics()
        -monitor_resources()
    }

    %% Data Classes
    class ModelConfig {
        +model_id: str
        +parameters: Dict
    }

    class ServiceConfig {
        +max_batch_size: int
        +max_total_tokens: int
        +max_input_length: int
    }

    class HealthStatus {
        +status: str
        +metrics: Dict
        +timestamp: datetime
    }

    %% Relationships
    TGIClient --> ModelConfig
    ConfigManager --> ServiceConfig
    HealthMonitor --> HealthStatus
```

## Key Differences from Previous Design

1. **Simplified Architecture**

   - TGI handles model management, inference, and resource optimization
   - Removed custom model managers and inference engine
   - Simplified configuration management

2. **Component Reduction**

   - No need for separate model factory
   - No custom tokenizer implementation
   - Resource management handled by TGI

3. **New Components**
   - TGI Client for communication with TGI service
   - Health monitoring specific to TGI
   - Streamlined configuration for TGI parameters

## Implementation Approach

1. **Infrastructure Layer**

   - Docker configuration for TGI
   - Resource allocation
   - Network setup

2. **Service Layer**

   - API Gateway implementation
   - TGI client wrapper
   - Configuration management

3. **Monitoring Layer**
   - Health checks
   - Metrics collection
   - Logging integration

## Deployment Structure

```
/
├── docker-compose.yml           # TGI and service configuration
├── config/
│   ├── models/                 # Model configurations
│   └── service/               # Service configurations
├── src/
│   ├── api/                   # API Gateway implementation
│   ├── client/               # TGI client wrapper
│   └── monitoring/           # Health and metrics
└── scripts/
    └── deploy.sh             # Deployment automation
```
