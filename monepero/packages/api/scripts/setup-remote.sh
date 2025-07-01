#!/bin/bash

echo "🚀 Setting up API for remote database connection..."

# Check if .env.remote exists
if [ ! -f ".env.remote" ]; then
    echo "❌ .env.remote file not found!"
    echo "Please copy .env.example to .env.remote and configure your database settings"
    exit 1
fi

# Backup current .env
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backed up current .env to .env.backup"
fi

# Copy remote config to .env
cp .env.remote .env
echo "✅ Applied remote configuration"

# Test database connection
echo "🔍 Testing database connection..."
npx prisma db pull --preview-feature > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful!"
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    # Test MinIO connection
    echo "🗄️ Testing MinIO connection..."
    MINIO_ENDPOINT=$(grep MINIO_ENDPOINT .env | cut -d '=' -f2 | tr -d '"')
    MINIO_PORT=$(grep MINIO_PORT .env | cut -d '=' -f2 | tr -d '"')
    
    if curl -f "http://${MINIO_ENDPOINT}:${MINIO_PORT}/minio/health/live" > /dev/null 2>&1; then
        echo "✅ MinIO connection successful!"
        echo "🌐 MinIO Console: http://${MINIO_ENDPOINT}:9001"
        echo "📊 MinIO API: http://${MINIO_ENDPOINT}:9000"
    else
        echo "⚠️ MinIO connection failed (this might be normal if MinIO is not running)"
        echo "To start MinIO with remote access, run: docker-compose -f docker-compose.remote.yml up -d minio"
    fi
    
    echo "✅ Setup completed successfully!"
else
    echo "❌ Database connection failed!"
    echo "Please check your DATABASE_URL in .env.remote"
    echo "Make sure PostgreSQL server allows remote connections"
fi 