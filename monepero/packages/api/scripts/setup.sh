#!/bin/bash

echo "🚀 Setting up Express.js TypeScript API with PostgreSQL..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file..."
    cp env.local.example .env
    echo "✅ .env file created. Please update the DATABASE_URL if needed."
fi

# Start PostgreSQL and Redis with Docker Compose
echo "🐳 Starting PostgreSQL and Redis containers..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma db push

# Seed the database
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Setup completed!"
echo ""
echo "📊 Services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - PgAdmin: http://localhost:8080 (admin@admin.com / admin123)"
echo "  - Redis: localhost:6379"
echo ""
echo "🚀 To start the development server:"
echo "  npm run dev"
echo ""
echo "🐳 To start everything with Docker:"
echo "  docker-compose -f docker-compose.dev.yml up" 