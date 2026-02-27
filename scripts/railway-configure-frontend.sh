#!/bin/bash

# Configure Railway Frontend Service
# Sets the correct root directory and build settings

set -e

echo "Configuring frontend service..."

CONFIG_FILE="$HOME/.railway/config.json"
TOKEN=$(jq -r '.user.token' "$CONFIG_FILE")
FRONTEND_SERVICE_ID="cdcd68c0-aa8a-4963-8b70-c3338fe40a18"

# GraphQL mutation to update service source
MUTATION='mutation serviceUpdate($input: ServiceUpdateInput!, $id: String!) {
  serviceUpdate(input: $input, id: $id) {
    id
    name
  }
}'

VARIABLES=$(cat <<EOF
{
  "id": "$FRONTEND_SERVICE_ID",
  "input": {
    "rootDirectory": "apps/frontend"
  }
}
EOF
)

echo "Setting root directory to apps/frontend..."
RESULT=$(curl -s 'https://backboard.railway.app/graphql/v2' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$(echo $MUTATION | tr '\n' ' ')\",\"variables\":$VARIABLES}")

if echo "$RESULT" | jq -e '.errors' > /dev/null 2>&1; then
  echo "❌ Error updating service:"
  echo "$RESULT" | jq '.errors'
  exit 1
fi

echo "✅ Frontend service configured"
echo ""
echo "Root directory: apps/frontend"
echo ""
echo "The service will use apps/frontend/railway.toml for build configuration"
