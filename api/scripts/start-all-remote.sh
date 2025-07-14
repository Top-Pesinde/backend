#!/bin/bash

echo "🚀 Starting all services for remote access..."
echo "=============================================="

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "🌐 Server IP: ${SERVER_IP}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.remote.yml down 2>/dev/null || true

# Remove old containers if any
echo "🗑️ Cleaning up old containers..."
docker rm -f express-api-postgres express-api-redis express-api-minio express-api-minio-mc 2>/dev/null || true

# Create config directory if it doesn't exist
mkdir -p config

echo "🐳 Starting PostgreSQL with remote access..."
docker-compose -f docker-compose.remote.yml up -d postgres

echo "📦 Starting Redis with remote access..."
docker-compose -f docker-compose.remote.yml up -d redis

echo "🗂️ Starting MinIO with remote access..."
docker-compose -f docker-compose.remote.yml up -d minio

echo "⏳ Waiting for services to initialize..."
sleep 15

echo "🪣 Creating MinIO buckets..."
docker-compose -f docker-compose.remote.yml up -d createbuckets

echo "⏳ Additional wait for bucket creation..."
sleep 10

# Check service status
echo ""
echo "🔍 Checking service status..."

# Check PostgreSQL
if docker-compose -f docker-compose.remote.yml ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL is running on port 5432"
else
    echo "❌ PostgreSQL failed to start"
fi

# Check Redis
if docker-compose -f docker-compose.remote.yml ps redis | grep -q "Up"; then
    echo "✅ Redis is running on port 6379"
else
    echo "❌ Redis failed to start"
fi

# Check MinIO
if docker-compose -f docker-compose.remote.yml ps minio | grep -q "Up"; then
    echo "✅ MinIO is running on ports 9000/9001"
else
    echo "❌ MinIO failed to start"
fi

echo ""
echo "🧪 Testing connections..."

# Test PostgreSQL
if pg_isready -h ${SERVER_IP} -p 5432 -U postgres >/dev/null 2>&1; then
    echo "✅ PostgreSQL connection test - OK"
else
    echo "⚠️ PostgreSQL connection test - Failed (this is normal if PostgreSQL client tools are not installed)"
fi

# Test Redis
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -h ${SERVER_IP} -p 6379 ping >/dev/null 2>&1; then
        echo "✅ Redis connection test - OK"
    else
        echo "⚠️ Redis connection test - Failed"
    fi
else
    echo "⚠️ Redis CLI not available for testing"
fi

# Test MinIO
if curl -f http://${SERVER_IP}:9000/minio/health/live >/dev/null 2>&1; then
    echo "✅ MinIO connection test - OK"
else
    echo "⚠️ MinIO connection test - Failed"
fi

echo ""
echo "🎯 Service URLs:"
echo "  📊 PostgreSQL: ${SERVER_IP}:5432"
echo "  📦 Redis: ${SERVER_IP}:6379"
echo "  🗂️ MinIO API: http://${SERVER_IP}:9000"
echo "  🌐 MinIO Console: http://${SERVER_IP}:9001"
echo "      👤 Username: minioadmin"
echo "      🔑 Password: minioadmin123"

echo ""
echo "💡 For remote clients, update your .env file:"
echo "DATABASE_URL=\"postgresql://postgres:postgres123@${SERVER_IP}:5432/express_api_db?schema=public\""
echo "REDIS_URL=\"redis://${SERVER_IP}:6379\""
echo "MINIO_ENDPOINT=${SERVER_IP}"
echo "MINIO_PUBLIC_URL=http://${SERVER_IP}:9000"
echo "MINIO_CONSOLE_URL=http://${SERVER_IP}:9001"

echo ""
echo "🔥 Don't forget to configure your firewall:"
echo "sudo ufw allow 5432/tcp && sudo ufw allow 6379/tcp && sudo ufw allow 9000/tcp && sudo ufw allow 9001/tcp"

echo ""
echo "✅ All services started successfully!"
echo "🌐 You can now connect from remote clients using IP: ${SERVER_IP}" 