# Model Download API

## Endpoints

### Download Model
```yaml
POST /api/v1/models/download
description: Initiate model download
authorization: Bearer token required

request:
  content-type: application/json
  body:
    model_id:
      type: string
      description: Model identifier (namespace/name@revision)
      required: true
      example: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
    force:
      type: boolean
      description: Force re-download even if cached
      default: false

responses:
  202:
    description: Download initiated successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            task_id: 
              type: string
              format: uuid
            status_url:
              type: string
              format: uri
  
  400:
    description: Invalid model identifier
  
  401:
    description: Unauthorized
  
  507:
    description: Insufficient storage space
```

### Get Download Status
```yaml
GET /api/v1/models/download/{task_id}
description: Get download progress
authorization: Bearer token required

parameters:
  - name: task_id
    in: path
    required: true
    schema:
      type: string
      format: uuid

responses:
  200:
    description: Download status
    content:
      application/json:
        schema:
          type: object
          properties:
            state:
              type: string
              enum: [initializing, downloading, validating, complete, failed]
            progress:
              type: number
              format: float
              minimum: 0
              maximum: 100
            bytes_downloaded:
              type: integer
            total_bytes:
              type: integer
            error:
              type: string
              nullable: true

  404:
    description: Download task not found
```

## Event Stream

```yaml
GET /api/v1/models/download/{task_id}/events
description: SSE stream for download progress
content-type: text/event-stream

events:
  download.progress:
    data:
      progress: float
      bytes_downloaded: integer
      
  download.complete:
    data:
      model_path: string
      
  download.error:
    data:
      error: string
      details: object
```

## Examples

### Initiating Download
```bash
curl -X POST https://api.example.com/api/v1/models/download \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    "force": false
  }'
```

### Streaming Progress
```javascript
const events = new EventSource('/api/v1/models/download/${task_id}/events');

events.addEventListener('download.progress', (e) => {
  const data = JSON.parse(e.data);
  console.log(`Download progress: ${data.progress}%`);
});
```