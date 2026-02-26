#!/bin/bash

# Setup local development database
# This script starts PostgreSQL and Redis with docker-compose and runs migrations

set -e

echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec about-time-postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "⏳ Waiting for Redis to be ready..."
until docker exec about-time-redis redis-cli ping > /dev/null 2>&1; do
  sleep 1
done

echo "✅ Database services are ready!"
echo ""
echo "🔄 Running database migrations..."
npm run migrate --workspace=@about-time/backend

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Copy apps/backend/.env.example to apps/backend/.env"
echo "  2. Update SESSION_SECRET in apps/backend/.env"
echo "  3. Start backend: npm run dev --workspace=@about-time/backend"
echo "  4. Start frontend: npm run dev --workspace=@about-time/frontend"
