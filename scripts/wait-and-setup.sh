#!/bin/bash

echo "🔐 Waiting for Docker Desktop authentication..."
echo ""
echo "Please sign in to Docker Desktop in the window that just opened."
echo "Once you sign in, setup will continue automatically..."
echo ""

# Poll Docker every 2 seconds until it's ready
attempt=0
max_attempts=120  # 4 minutes

while [ $attempt -lt $max_attempts ]; do
  if docker ps > /dev/null 2>&1; then
    echo ""
    echo "✅ Docker is authenticated!"
    echo ""

    # Run the setup script
    exec ./scripts/auto-setup.sh
    exit 0
  fi

  # Show a dot every 10 attempts (20 seconds)
  if [ $((attempt % 10)) -eq 0 ]; then
    echo -n "."
  fi

  sleep 2
  attempt=$((attempt + 1))
done

echo ""
echo "❌ Timed out waiting for Docker authentication."
echo "Please sign in to Docker Desktop and run: ./scripts/auto-setup.sh"
exit 1
