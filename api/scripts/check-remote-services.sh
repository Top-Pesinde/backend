#!/bin/bash

echo "🔍 Checking remote services status..."
echo "===================================="

SERVER_IP=$(hostname -I | awk '{print $1}')

# Check Docker services
echo "🐳 Docker Services:"
if docker-compose -f docker-compose.remote.yml ps | grep -q "Up"; then
    docker-compose -f docker-compose.remote.yml ps
else
    echo "❌ No services running with docker-compose.remote.yml"
    echo "💡 Start with: npm run services:start:remote"
fi

echo ""
echo "🔌 Port Status:"

# Check PostgreSQL
if netstat -tlnp 2>/dev/null | grep -q ":5432 "; then
    echo "✅ PostgreSQL (5432) - LISTENING"
else
    echo "❌ PostgreSQL (5432) - NOT LISTENING"
fi

# Check Redis
if netstat -tlnp 2>/dev/null | grep -q ":6379 "; then
    echo "✅ Redis (6379) - LISTENING"
else
    echo "❌ Redis (6379) - NOT LISTENING"
fi

# Check MinIO API
if netstat -tlnp 2>/dev/null | grep -q ":9000 "; then
    echo "✅ MinIO API (9000) - LISTENING"
else
    echo "❌ MinIO API (9000) - NOT LISTENING"
fi

# Check MinIO Console
if netstat -tlnp 2>/dev/null | grep -q ":9001 "; then
    echo "✅ MinIO Console (9001) - LISTENING"
else
    echo "❌ MinIO Console (9001) - NOT LISTENING"
fi

echo ""
echo "🌐 Service URLs:"
echo "  - PostgreSQL: ${SERVER_IP}:5432"
echo "  - Redis: ${SERVER_IP}:6379"
echo "  - MinIO API: http://${SERVER_IP}:9000"
echo "  - MinIO Console: http://${SERVER_IP}:9001"

echo ""
echo "🧪 Connection Tests:"

# Test PostgreSQL
if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h ${SERVER_IP} -p 5432 -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL connection - OK"
    else
        echo "❌ PostgreSQL connection - FAILED"
    fi
else
    echo "⚠️ pg_isready not available for PostgreSQL test"
fi

# Test Redis
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli -h ${SERVER_IP} -p 6379 ping >/dev/null 2>&1; then
        echo "✅ Redis connection - OK"
    else
        echo "❌ Redis connection - FAILED"
    fi
else
    echo "⚠️ redis-cli not available for Redis test"
fi

# Test MinIO
if curl -f http://${SERVER_IP}:9000/minio/health/live >/dev/null 2>&1; then
    echo "✅ MinIO API connection - OK"
else
    echo "❌ MinIO API connection - FAILED"
fi

echo ""
echo "🔥 Firewall Status:"
if command -v ufw >/dev/null 2>&1; then
    sudo ufw status | grep -E "(5432|6379|9000|9001|3000)" || echo "No relevant firewall rules found"
elif command -v firewall-cmd >/dev/null 2>&1; then
    sudo firewall-cmd --list-ports | grep -E "(5432|6379|9000|9001|3000)" || echo "No relevant firewall rules found"
else
    echo "⚠️ No supported firewall tool found"
fi

echo ""
echo "💡 Next steps for remote client:"
echo "  1. Clone project: git clone <REPO_URL>"
echo "  2. Install deps: npm install"
echo "  3. Setup remote: npm run setup:remote"
echo "  4. Update .env with server IP: ${SERVER_IP}"
echo "  5. Test connection: npm run db:generate"
echo "  6. Start development: npm run dev" 