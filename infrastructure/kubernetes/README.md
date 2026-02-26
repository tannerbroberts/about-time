# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the about-time application.

## Prerequisites

- Kubernetes cluster (v1.27+)
- kubectl configured with cluster access
- Docker registry for storing images
- cert-manager installed for SSL certificates
- nginx-ingress-controller installed

## Quick Start

### 1. Build and Push Docker Images

```bash
# Build backend image
docker build -f infrastructure/docker/Dockerfile.backend \
  -t your-registry/about-time-backend:latest .

# Build frontend image (with API URL)
docker build -f infrastructure/docker/Dockerfile.frontend \
  --build-arg VITE_API_URL=https://api.about-time.app \
  -t your-registry/about-time-frontend:latest .

# Push images to registry
docker push your-registry/about-time-backend:latest
docker push your-registry/about-time-frontend:latest
```

### 2. Update Image References

Edit the deployment files to use your registry:
- `backend-deployment.yaml`: Update `image:` field
- `frontend-deployment.yaml`: Update `image:` field

### 3. Create Secrets

```bash
# Create secrets from command line
kubectl create secret generic about-time-secrets \
  --namespace=about-time \
  --from-literal=DATABASE_USER=postgres \
  --from-literal=DATABASE_PASSWORD=your-secure-password \
  --from-literal=SESSION_SECRET=$(openssl rand -base64 48) \
  --from-literal=GOOGLE_CLIENT_ID=your-google-client-id \
  --from-literal=GOOGLE_CLIENT_SECRET=your-google-client-secret \
  --from-literal=GITHUB_CLIENT_ID=your-github-client-id \
  --from-literal=GITHUB_CLIENT_SECRET=your-github-client-secret

# Or create from file (copy secrets.yaml.example to secrets.yaml first)
kubectl apply -f secrets.yaml
```

### 4. Deploy Application

```bash
# Apply all manifests in order
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
# Apply secrets (created in step 3)
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f redis-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n about-time --timeout=300s

# Deploy backend and frontend
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml

# Deploy ingress (requires cert-manager)
kubectl apply -f ingress.yaml
```

### 5. Run Database Migrations

```bash
# Get backend pod name
BACKEND_POD=$(kubectl get pods -n about-time -l app=backend -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n about-time $BACKEND_POD -- npm run migrate
```

### 6. Verify Deployment

```bash
# Check all resources
kubectl get all -n about-time

# Check pod logs
kubectl logs -n about-time -l app=backend --tail=50
kubectl logs -n about-time -l app=frontend --tail=50

# Check ingress
kubectl get ingress -n about-time
```

## Configuration

### Environment Variables

Edit `configmap.yaml` to change non-sensitive configuration:
- Database host/port
- Redis host/port
- CORS origin
- API URL

### Secrets

Secrets are stored in `about-time-secrets` Secret:
- Database credentials
- Session signing key
- OAuth client credentials

### Resource Limits

Edit deployment files to adjust resource requests/limits:
- Backend: 256Mi-512Mi memory, 250m-500m CPU
- Frontend: 64Mi-128Mi memory, 50m-200m CPU
- PostgreSQL: 1Gi-2Gi memory, 500m-1000m CPU
- Redis: 256Mi-512Mi memory, 100m-500m CPU

### Auto-Scaling

Backend auto-scaling is configured in `backend-hpa.yaml`:
- Min replicas: 3
- Max replicas: 10
- Target CPU: 70%
- Target memory: 80%

## SSL/TLS Configuration

The ingress uses cert-manager with Let's Encrypt for SSL certificates.

### Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### Configure DNS

Point your domain DNS records to the ingress IP:
```
A     about-time.app       -> <ingress-ip>
A     www.about-time.app   -> <ingress-ip>
A     api.about-time.app   -> <ingress-ip>
```

Get ingress IP:
```bash
kubectl get ingress -n about-time about-time-ingress
```

## Monitoring

### View Logs

```bash
# Backend logs
kubectl logs -n about-time -l app=backend -f

# Frontend logs
kubectl logs -n about-time -l app=frontend -f

# Database logs
kubectl logs -n about-time -l app=postgres -f
```

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods -n about-time

# Node resource usage
kubectl top nodes
```

### Health Checks

```bash
# Backend health
kubectl exec -n about-time deploy/backend -- curl localhost:3001/health

# Frontend health
kubectl exec -n about-time deploy/frontend -- curl localhost:8080/health
```

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend -n about-time --replicas=5

# Scale frontend
kubectl scale deployment frontend -n about-time --replicas=3
```

### Auto-Scaling

Backend auto-scaling is automatic via HPA. To adjust:

```bash
# Edit HPA
kubectl edit hpa backend-hpa -n about-time
```

## Rollback

```bash
# View rollout history
kubectl rollout history deployment/backend -n about-time

# Rollback to previous version
kubectl rollout undo deployment/backend -n about-time

# Rollback to specific revision
kubectl rollout undo deployment/backend -n about-time --to-revision=2
```

## Troubleshooting

### Pods not starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name> -n about-time

# Check logs
kubectl logs <pod-name> -n about-time --previous
```

### Database connection issues

```bash
# Check database is running
kubectl get pods -n about-time -l app=postgres

# Test connection from backend pod
kubectl exec -n about-time deploy/backend -- \
  pg_isready -h postgres-service -p 5432
```

### Ingress not working

```bash
# Check ingress events
kubectl describe ingress about-time-ingress -n about-time

# Check cert-manager certificates
kubectl get certificates -n about-time
kubectl describe certificate about-time-tls-cert -n about-time
```

### High resource usage

```bash
# Check resource usage
kubectl top pods -n about-time

# Check HPA status
kubectl get hpa -n about-time

# Increase resource limits if needed
kubectl edit deployment backend -n about-time
```

## Cleanup

```bash
# Delete all resources
kubectl delete namespace about-time

# Or delete individually
kubectl delete -f ingress.yaml
kubectl delete -f frontend-service.yaml
kubectl delete -f frontend-deployment.yaml
kubectl delete -f backend-hpa.yaml
kubectl delete -f backend-service.yaml
kubectl delete -f backend-deployment.yaml
kubectl delete -f redis-deployment.yaml
kubectl delete -f postgres-statefulset.yaml
kubectl delete -f configmap.yaml
kubectl delete -f namespace.yaml
```

## Production Checklist

- [ ] Update image registry URLs in deployments
- [ ] Create secrets with secure passwords
- [ ] Configure DNS records
- [ ] Install cert-manager for SSL
- [ ] Install nginx-ingress-controller
- [ ] Set resource limits appropriate for load
- [ ] Configure backup for PostgreSQL
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Set up logging (ELK/Loki)
- [ ] Configure alerting
- [ ] Set up CI/CD pipeline
- [ ] Test rollback procedures
- [ ] Document incident response procedures
