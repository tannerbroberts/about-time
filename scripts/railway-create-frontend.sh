#!/bin/bash

# Create Railway Frontend Service Script

set -e

echo "Creating frontend service in Railway..."

CONFIG_FILE="$HOME/.railway/config.json"
TOKEN=$(jq -r '.user.token' "$CONFIG_FILE")
PROJECT_ID=$(jq -r '.projects["/Users/tannerbrobers/dev/about-time"].project' "$CONFIG_FILE")
ENV_ID=$(jq -r '.projects["/Users/tannerbrobers/dev/about-time"].environment' "$CONFIG_FILE")

# GraphQL mutation to create a service
MUTATION='mutation serviceCreate($input: ServiceCreateInput!) {
  serviceCreate(input: $input) {
    id
    name
  }
}'

VARIABLES=$(cat <<EOF
{
  "input": {
    "projectId": "$PROJECT_ID",
    "environmentId": "$ENV_ID",
    "name": "about-time-frontend",
    "branch": "main",
    "source": {
      "repo": "tannerbroberts/about-time"
    }
  }
}
EOF
)

RESULT=$(curl -s 'https://backboard.railway.app/graphql/v2' \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"$(echo $MUTATION | tr '\n' ' ')\",\"variables\":$VARIABLES}")

if echo "$RESULT" | jq -e '.errors' > /dev/null 2>&1; then
  echo "❌ Error creating service:"
  echo "$RESULT" | jq '.errors'
  exit 1
fi

SERVICE_ID=$(echo "$RESULT" | jq -r '.data.serviceCreate.id')
echo "✅ Frontend service created: $SERVICE_ID"
echo ""
echo "Service name: about-time-frontend"
echo ""
echo "Next: Configure environment variables and trigger deployment"
