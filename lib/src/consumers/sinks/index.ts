// lib/src/consumers/sinks/index.ts
// Data sinks - Output destinations for processed data

// TODO: Implement when multiple output formats are needed
// Condition: After core TimescaleDB consumer is working and additional outputs required
// Priority: Low - focus on primary database storage first

export const SINKS_TODO = {
  'file-sink': 'TODO: Write processed data to files (CSV, JSON, Parquet)',
  'api-sink': 'TODO: Send data to external APIs (webhooks, REST endpoints)',
  'cache-sink': 'TODO: Write to Redis cache for fast access',
  'stream-sink': 'TODO: Forward to other streaming platforms',
  'notification-sink': 'TODO: Send alerts and notifications',
  'backup-sink': 'TODO: Archive data to cloud storage (S3, GCS)'
} as const;