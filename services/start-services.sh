#!/bin/bash
# Start QiCore Crypto Data Platform services

echo "🚀 Starting QiCore Crypto Data Platform services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start services
docker compose up -d

# Wait a moment for services to initialize
sleep 5

# Show service status
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Services started! Access points:"
echo "   - Redpanda: localhost:19092"
echo "   - TimescaleDB: localhost:5432"
echo "   - ClickHouse: localhost:8123"
echo "   - Redis: localhost:6379"
echo "   - Redpanda Console: localhost:8080"