#!/bin/bash

# Delete NIXPACKS override variables to use railway.toml instead

set -e

CONFIG_FILE="$HOME/.railway/config.json"
TOKEN=$(jq -r '.user.token' "$CONFIG_FILE")
PROJECT_ID=$(jq -r '.projects["/Users/tannerbrobers/dev/about-time"].project' "$CONFIG_FILE")
ENV_ID=$(jq -r '.projects["/Users/tannerbrobers/dev/about-time"].environment' "$CONFIG_FILE")
BACKEND_SERVICE_ID="3c654e86-c10e-4d13-9a73-3ffd799bcee2"
FRONTEND_SERVICE_ID="cdcd68c0-aa8a-4963-8b70-c3338fe40a18"

echo "Deleting NIXPACKS override variables..."

# Delete backend NIXPACKS variables
for VAR in "NIXPACKS_BUILD_CMD" "NIXPACKS_START_CMD"; do
  echo "Deleting $VAR from backend..."
  MUTATION='mutation variableDelete($input: VariableDeleteInput!) {
    variableDelete(input: $input)
  }'

  VARIABLES=$(cat <<EOF
{
  "input": {
    "projectId": "$PROJECT_ID",
    "environmentId": "$ENV_ID",
    "serviceId": "$BACKEND_SERVICE_ID",
    "name": "$VAR"
  }
}
EOF
)

  curl -s 'https://backboard.railway.app/graphql/v2' \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$(echo $MUTATION | tr '\n' ' ')\",\"variables\":$VARIABLES}" > /dev/null
done

# Delete frontend NIXPACKS variables
for VAR in "NIXPACKS_BUILD_CMD" "NIXPACKS_START_CMD"; do
  echo "Deleting $VAR from frontend..."
  MUTATION='mutation variableDelete($input: VariableDeleteInput!) {
    variableDelete(input: $input)
  }'

  VARIABLES=$(cat <<EOF
{
  "input": {
    "projectId": "$PROJECT_ID",
    "environmentId": "$ENV_ID",
    "serviceId": "$FRONTEND_SERVICE_ID",
    "name": "$VAR"
  }
}
EOF
)

  curl -s 'https://backboard.railway.app/graphql/v2' \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$(echo $MUTATION | tr '\n' ' ')\",\"variables\":$VARIABLES}" > /dev/null
done

echo "✅ NIXPACKS variables deleted"
echo ""
echo "Services will now use railway.toml configuration files"
