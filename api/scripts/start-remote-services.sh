#!/bin/bash

echo "🚀 Starting services for remote access..."

# Check if docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "🗄️ Starting PostgreSQL for remote access..."
docker-compose -f docker-compose.remote.yml up -d postgres

echo "📦 Starting Redis for remote access..."
docker-compose -f docker-compose.remote.yml up -d redis

echo "🗂️ Starting MinIO for remote access..."
docker-compose -f docker-compose.remote.yml up -d minio createbuckets

echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "🔍 Checking service status..."

# Check PostgreSQL
if docker-compose -f docker-compose.remote.yml ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL is running (Port: 5432)"
else
    echo "❌ PostgreSQL failed to start"
fi

# Check Redis
if docker-compose -f docker-compose.remote.yml ps redis | grep -q "Up"; then
    echo "✅ Redis is running (Port: 6379)"
else
    echo "❌ Redis failed to start"
fi

# Check MinIO
if docker-compose -f docker-compose.remote.yml ps minio | grep -q "Up"; then
    echo "✅ MinIO is running"
    echo "   📊 API: http://0.0.0.0:9000"
    echo "   🌐 Console: http://0.0.0.0:9001"
    echo "   👤 Username: minioadmin"
    echo "   🔑 Password: minioadmin123"
else
    echo "❌ MinIO failed to start"
fi

echo ""
echo "🔧 To apply remote configuration to your API, run:"
echo "   npm run setup:remote"
echo ""
echo "🛑 To stop services, run:"
echo "   docker-compose -f docker-compose.remote.yml down" 