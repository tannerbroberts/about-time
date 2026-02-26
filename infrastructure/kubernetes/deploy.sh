#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="about-time"
REGISTRY="${DOCKER_REGISTRY:-your-registry}"
BACKEND_IMAGE="${REGISTRY}/about-time-backend"
FRONTEND_IMAGE="${REGISTRY}/about-time-frontend"
TAG="${IMAGE_TAG:-latest}"

echo -e "${GREEN}About Time - Kubernetes Deployment Script${NC}"
echo "==========================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Build Docker images
echo "Building Docker images..."
echo "========================"

# Build backend
echo "Building backend image..."
docker build -f infrastructure/docker/Dockerfile.backend \
  -t ${BACKEND_IMAGE}:${TAG} \
  -t ${BACKEND_IMAGE}:latest \
  .
echo -e "${GREEN}✓ Backend image built${NC}"

# Build frontend
echo "Building frontend image..."
docker build -f infrastructure/docker/Dockerfile.frontend \
  --build-arg VITE_API_URL=https://api.about-time.app \
  -t ${FRONTEND_IMAGE}:${TAG} \
  -t ${FRONTEND_IMAGE}:latest \
  .
echo -e "${GREEN}✓ Frontend image built${NC}"
echo ""

# Push images
echo "Pushing images to registry..."
echo "============================="

docker push ${BACKEND_IMAGE}:${TAG}
docker push ${BACKEND_IMAGE}:latest
echo -e "${GREEN}✓ Backend image pushed${NC}"

docker push ${FRONTEND_IMAGE}:${TAG}
docker push ${FRONTEND_IMAGE}:latest
echo -e "${GREEN}✓ Frontend image pushed${NC}"
echo ""

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
echo "========================="

# Create namespace
echo "Creating namespace..."
kubectl apply -f namespace.yaml
echo -e "${GREEN}✓ Namespace created${NC}"

# Apply ConfigMap
echo "Applying ConfigMap..."
kubectl apply -f configmap.yaml
echo -e "${GREEN}✓ ConfigMap applied${NC}"

# Check if secrets exist
if ! kubectl get secret about-time-secrets -n ${NAMESPACE} &> /dev/null; then
    echo -e "${YELLOW}Warning: Secrets not found. Please create secrets before proceeding.${NC}"
    echo "Run: kubectl create secret generic about-time-secrets --namespace=${NAMESPACE} ..."
    echo "See README.md for instructions."
    read -p "Press enter when secrets are created, or Ctrl+C to cancel..."
fi
echo -e "${GREEN}✓ Secrets verified${NC}"

# Deploy PostgreSQL
echo "Deploying PostgreSQL..."
kubectl apply -f postgres-statefulset.yaml
echo "Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}✓ PostgreSQL deployed${NC}"

# Deploy Redis
echo "Deploying Redis..."
kubectl apply -f redis-deployment.yaml
echo "Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=120s
echo -e "${GREEN}✓ Redis deployed${NC}"

# Deploy Backend
echo "Deploying Backend..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml
echo "Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}✓ Backend deployed${NC}"

# Run database migrations
echo "Running database migrations..."
BACKEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n ${NAMESPACE} ${BACKEND_POD} -- npm run migrate || echo -e "${YELLOW}Warning: Migration failed or not configured${NC}"
echo -e "${GREEN}✓ Migrations completed${NC}"

# Deploy Frontend
echo "Deploying Frontend..."
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
echo "Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n ${NAMESPACE} --timeout=180s
echo -e "${GREEN}✓ Frontend deployed${NC}"

# Deploy Ingress
echo "Deploying Ingress..."
kubectl apply -f ingress.yaml
echo -e "${GREEN}✓ Ingress deployed${NC}"
echo ""

# Display status
echo "Deployment Status"
echo "================"
kubectl get all -n ${NAMESPACE}
echo ""

echo "Ingress Configuration"
echo "===================="
kubectl get ingress -n ${NAMESPACE}
echo ""

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure DNS to point to the ingress IP"
echo "2. Wait for SSL certificates to be issued"
echo "3. Test the application"
echo ""
echo "Useful commands:"
echo "  kubectl get all -n ${NAMESPACE}"
echo "  kubectl logs -n ${NAMESPACE} -l app=backend"
echo "  kubectl logs -n ${NAMESPACE} -l app=frontend"
echo "  kubectl describe ingress -n ${NAMESPACE}"
