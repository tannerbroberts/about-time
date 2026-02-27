#!/bin/bash

# Railway Database Migration Script
# Runs migrations against the production database using Railway's local proxy

set -e

echo "Running database migrations on Railway..."
echo ""

# Get the DATABASE_URL from Railway and extract connection details
DATABASE_URL=$(railway variables | grep -A 2 "DATABASE_URL" | tail -1 | awk '{print $2$3$4}')

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Could not find DATABASE_URL"
  exit 1
fi

echo "Found database connection"
echo ""

# Use railway run to execute migrations with proper environment
# This runs locally but with Railway environment variables available
echo "Attempting to run migrations..."

# Try using Railway's proxy mode
railway run --service about-time-backend bash -c "
  cd /app 2>/dev/null || cd .
  npm run migrate --workspace=@about-time/backend
"

echo ""
echo "✅ Migrations completed"
