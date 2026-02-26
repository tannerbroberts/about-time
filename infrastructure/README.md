# About Time - Infrastructure

This directory contains all infrastructure-related files for deploying the about-time application to Kubernetes and Docker.

## Directory Structure

```
infrastructure/
├── docker/
│   ├── Dockerfile.backend      # Backend Node.js container
│   ├── Dockerfile.frontend     # Frontend nginx container
│   └── nginx.conf              # Nginx configuration for frontend
│
└── kubernetes/
    ├── namespace.yaml          # Kubernetes namespace
    ├── configmap.yaml          # Configuration (non-sensitive)
    ├── secrets.yaml.example    # Secrets template (DO NOT commit actual secrets!)
    ├── postgres-statefulset.yaml  # PostgreSQL database with persistent storage
    ├── redis-deployment.yaml      # Redis cache and session store
    ├── backend-deployment.yaml    # Backend API deployment
    ├── backend-service.yaml       # Backend service (ClusterIP)
    ├── backend-hpa.yaml          # Backend auto-scaling (3-10 replicas)
    ├── frontend-deployment.yaml   # Frontend deployment
    ├── frontend-service.yaml      # Frontend service (ClusterIP)
    ├── ingress.yaml              # Ingress with SSL/TLS
    ├── deploy.sh                 # Deployment script
    └── README.md                 # Kubernetes deployment guide
```

## Quick Start

### Local Development with Docker Compose

For local development, use docker-compose from the root directory:

```bash
# Start PostgreSQL and Redis only (recommended - run backend/frontend in dev mode)
docker-compose up -d

# Or start everything in Docker (uncomment backend/frontend in docker-compose.yml)
docker-compose up -d backend frontend

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment to Kubernetes

See [kubernetes/README.md](kubernetes/README.md) for detailed Kubernetes deployment instructions.

Quick deploy:

```bash
cd infrastructure/kubernetes

# 1. Create secrets
kubectl create secret generic about-time-secrets \
  --namespace=about-time \
  --from-literal=DATABASE_USER=postgres \
  --from-literal=DATABASE_PASSWORD=your-secure-password \
  --from-literal=SESSION_SECRET=$(openssl rand -base64 48) \
  --from-literal=GOOGLE_CLIENT_ID=your-google-client-id \
  --from-literal=GOOGLE_CLIENT_SECRET=your-google-client-secret \
  --from-literal=GITHUB_CLIENT_ID=your-github-client-id \
  --from-literal=GITHUB_CLIENT_SECRET=your-github-client-secret

# 2. Update image registry in deployment files
# Edit backend-deployment.yaml and frontend-deployment.yaml

# 3. Run deployment script
./deploy.sh

# Or deploy manually
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f backend-hpa.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f ingress.yaml
```

## Docker Images

### Building Images

```bash
# Backend
docker build -f infrastructure/docker/Dockerfile.backend \
  -t your-registry/about-time-backend:latest .

# Frontend (with API URL)
docker build -f infrastructure/docker/Dockerfile.frontend \
  --build-arg VITE_API_URL=https://api.about-time.app \
  -t your-registry/about-time-frontend:latest .

# Push to registry
docker push your-registry/about-time-backend:latest
docker push your-registry/about-time-frontend:latest
```

### Image Registries

Supported registries:
- Docker Hub: `docker.io/username/about-time-backend`
- GitHub Container Registry: `ghcr.io/username/about-time-backend`
- AWS ECR: `123456789.dkr.ecr.us-east-1.amazonaws.com/about-time-backend`
- Google GCR: `gcr.io/project-id/about-time-backend`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Ingress (nginx-ingress + cert-manager)                 │
│  - about-time.app → Frontend                            │
│  - api.about-time.app → Backend                         │
│  - SSL/TLS with Let's Encrypt                           │
└─────────────────┬───────────────────────────────────────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼──────┐      ┌──────▼──────┐
│  Frontend   │      │   Backend   │
│  (nginx)    │      │  (Node.js)  │
│  2 replicas │      │ 3-10 replicas│
│  (HPA)      │      │   (HPA)     │
└─────────────┘      └──────┬──────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐        ┌──────▼──────┐
         │  PostgreSQL │        │    Redis    │
         │ StatefulSet │        │  Deployment │
         │ Persistent  │        │   Session   │
         │   Storage   │        │    Cache    │
         └─────────────┘        └─────────────┘
```

## Resource Requirements

### Development (docker-compose)
- PostgreSQL: ~200MB
- Redis: ~50MB
- Backend: ~150MB (if running in Docker)
- Frontend: ~20MB (if running in Docker)
- **Total: ~420MB**

### Production (Kubernetes)
- PostgreSQL: 1-2GB RAM, 0.5-1 CPU, 20GB storage
- Redis: 256-512MB RAM, 0.1-0.5 CPU
- Backend (per pod): 256-512MB RAM, 0.25-0.5 CPU
- Frontend (per pod): 64-128MB RAM, 0.05-0.2 CPU
- **Total (minimum 3 backend + 2 frontend pods): ~3-5GB RAM**

## Monitoring and Logging

### Logs

```bash
# Backend logs
kubectl logs -n about-time -l app=backend -f

# Frontend logs
kubectl logs -n about-time -l app=frontend -f

# PostgreSQL logs
kubectl logs -n about-time -l app=postgres -f

# Ingress logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller -f
```

### Metrics

```bash
# Resource usage
kubectl top pods -n about-time
kubectl top nodes

# HPA status
kubectl get hpa -n about-time
```

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n about-time
kubectl logs <pod-name> -n about-time
```

**Database connection errors:**
```bash
# Test database connectivity
kubectl exec -n about-time deploy/backend -- \
  pg_isready -h postgres-service -p 5432
```

**Image pull errors:**
- Verify image exists in registry
- Check imagePullSecrets if using private registry
- Ensure registry credentials are correct

**Ingress not working:**
```bash
# Check ingress status
kubectl describe ingress about-time-ingress -n about-time

# Check cert-manager certificates
kubectl get certificates -n about-time
```

## Security

- All services run as non-root users
- Secrets stored in Kubernetes Secrets (base64 encoded at rest)
- TLS/SSL encryption for all external traffic
- Network policies can be added to restrict pod-to-pod communication
- Resource limits prevent resource exhaustion attacks
- Health checks ensure only healthy pods receive traffic

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
1. Runs tests and linting
2. Builds Docker images
3. Pushes to GitHub Container Registry
4. Deploys to Kubernetes cluster
5. Runs smoke tests

Required secrets in GitHub:
- `KUBE_CONFIG`: Base64-encoded kubeconfig file
- `VITE_API_URL`: Frontend API URL

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend -n about-time --replicas=5

# Scale frontend
kubectl scale deployment frontend -n about-time --replicas=3
```

### Auto-Scaling (HPA)

Backend auto-scales based on CPU/memory:
- Min: 3 replicas
- Max: 10 replicas
- Target CPU: 70%
- Target Memory: 80%

Adjust in `backend-hpa.yaml` and reapply.

## Backup and Recovery

### Database Backups

```bash
# Manual backup
kubectl exec -n about-time postgres-0 -- \
  pg_dump -U postgres about_time > backup.sql

# Restore from backup
kubectl exec -i -n about-time postgres-0 -- \
  psql -U postgres about_time < backup.sql
```

### Automated Backups

Consider using:
- Velero for cluster-wide backups
- Cloud provider backup solutions (AWS RDS, Google Cloud SQL)
- Cron jobs with pg_dump

## Cost Optimization

1. **Use Spot/Preemptible instances** for non-critical workloads
2. **Right-size resources** based on actual usage
3. **Enable cluster autoscaling** to scale nodes down during low traffic
4. **Use PersistentVolume** storage classes with lower IOPS for cost savings
5. **Implement pod disruption budgets** to allow safe node draining

## Next Steps

- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure alerting (AlertManager)
- [ ] Implement log aggregation (ELK/Loki)
- [ ] Add network policies for security
- [ ] Configure automated backups
- [ ] Set up staging environment
- [ ] Implement canary deployments
- [ ] Configure rate limiting per user
- [ ] Add DDoS protection (Cloudflare)
- [ ] Set up APM (Application Performance Monitoring)
