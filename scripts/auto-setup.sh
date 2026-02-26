#!/bin/bash

set -e

echo "🚀 About Time - Automated Local Setup"
echo "======================================"
echo ""

# Check if Docker is ready
echo "⏳ Waiting for Docker..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if docker ps > /dev/null 2>&1; then
    echo "✅ Docker is ready!"
    break
  fi
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Docker is not ready after 30 attempts. Please sign in to Docker Desktop and try again."
    exit 1
  fi
  sleep 2
done

echo ""
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

until docker exec about-time-postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "   Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

echo ""
echo "⏳ Waiting for Redis to be ready..."
until docker exec about-time-redis redis-cli ping > /dev/null 2>&1; do
  echo "   Waiting for Redis..."
  sleep 2
done
echo "✅ Redis is ready!"

echo ""
echo "🗄️  Running database migrations..."
cd apps/backend
npm run migrate
cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start backend:  cd apps/backend && npm run dev"
echo "   2. Start frontend: cd apps/frontend && npm run dev"
echo "   3. Open browser:   http://localhost:5173"
echo ""
echo "🧪 To run load tests:"
echo "   cd scripts/load-tests && k6 run api-load-test.js"
echo ""
