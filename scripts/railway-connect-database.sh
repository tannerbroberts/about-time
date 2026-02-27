#!/bin/bash

# Railway Database Connection Script
# Connects DATABASE_URL variable to Postgres service using Railway's template syntax

set -e

echo "Connecting DATABASE_URL to Postgres service..."
echo ""

# Use Railway's template syntax for service references
# Format: ${{ServiceName.VARIABLE_NAME}}
railway variables set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'

echo ""
echo "✅ DATABASE_URL reference created successfully!"
echo ""
echo "The service will automatically redeploy with the new configuration."
echo ""
echo "To verify, run: railway variables | grep DATABASE"
