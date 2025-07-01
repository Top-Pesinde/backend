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
    echo "✅ Setup completed successfully!"
else
    echo "❌ Database connection failed!"
    echo "Please check your DATABASE_URL in .env.remote"
    echo "Make sure PostgreSQL server allows remote connections"
fi 