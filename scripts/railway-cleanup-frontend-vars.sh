#!/bin/bash

# Clean up redundant NIXPACKS variables for frontend

set -e

CONFIG_FILE="$HOME/.railway/config.json"
TOKEN=$(jq -r '.user.token' "$CONFIG_FILE")
PROJECT_ID=$(jq -r '.projects["/Users/tannerbrobers/dev/about-time"].project' "$CONFIG_FILE")
ENV_ID=$(jq -r '.projects["/Users/tannerbrobers/dev/about-time"].environment' "$CONFIG_FILE")
FRONTEND_SERVICE_ID="cdcd68c0-aa8a-4963-8b70-c3338fe40a18"

echo "Cleaning up frontend NIXPACKS variables..."

for VAR in "NIXPACKS_BUILD_CMD" "NIXPACKS_INSTALL_CMD"; do
  echo "Deleting $VAR..."
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

echo "✅ Cleanup complete"
echo ""
echo "Frontend now uses:"
echo "  - nixpacks.toml for install and build"
echo "  - NIXPACKS_START_CMD for start command"
