# 🚀 Launch Guide - Deploy About Time to Production

## Quick Decision Guide

**Want to launch TODAY?** → Option 1: Railway (Easiest, ~$20/month)
**Have a domain and want full control?** → Option 2: VPS with Docker (~$5-10/month)
**Need enterprise scale?** → Option 3: Kubernetes (Complex, $50+/month)

---

## Option 1: Railway (Recommended - Easiest) ⭐

**Best for:** Quick launch, minimal DevOps, GitHub integration
**Time:** 30 minutes
**Cost:** ~$20/month
**Pros:** Automatic deployments, managed databases, SSL included

### Step 1: Prepare Your Code

```bash
# Make sure everything is committed
git add -A
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Set Up Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `about-time` repository

### Step 3: Add Services

Railway will create one service. You need to add more:

**Add PostgreSQL:**
1. Click "+ New" → "Database" → "Add PostgreSQL"
2. Note the connection string (automatically available as `DATABASE_URL`)

**Add Redis:**
1. Click "+ New" → "Database" → "Add Redis"
2. Note the connection string (automatically available as `REDIS_URL`)

**Configure Backend Service:**
1. Select the backend service
2. Go to "Settings" → "Root Directory" → Set to `apps/backend`
3. Go to "Variables" → Add:
   ```
   NODE_ENV=production
   PORT=3001
   SESSION_SECRET=<generate with: openssl rand -base64 48>
   CORS_ORIGIN=https://<your-frontend-url>.up.railway.app
   ```
4. Railway automatically connects DATABASE_URL and REDIS_URL

**Add Frontend Service:**
1. Click "+ New" → "Empty Service" → "GitHub Repo"
2. Select your repo again
3. Go to "Settings":
   - Root Directory: `apps/frontend`
   - Build Command: `npm install && npm run build --workspace=@about-time/frontend`
   - Start Command: `npx serve -s dist -p $PORT`
4. Go to "Variables" → Add:
   ```
   VITE_API_URL=https://<your-backend-url>.up.railway.app/api
   ```

### Step 4: Run Migrations

After backend deploys:
1. Go to backend service → "Settings" → "Deploy"
2. Click "Custom Start Command"
3. Temporarily change to: `npm run migrate --workspace=@about-time/backend && node dist/index.js`
4. Redeploy
5. After successful migration, change back to: `node dist/index.js`

### Step 5: Migrate Your Local Data (Optional)

If you have templates locally:
```bash
# Export from browser localStorage (open export-localStorage.html)
# Then use the migration API endpoint
curl -X POST https://<your-backend-url>.up.railway.app/api/migrate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=<your-session-cookie>" \
  -d @about-time-export-2024-02-26.json
```

### Step 6: Access Your App! 🎉

- Frontend: `https://<your-frontend-url>.up.railway.app`
- Backend API: `https://<your-backend-url>.up.railway.app`

---

## Option 2: VPS with Docker (More Control)

**Best for:** Developers who want more control, have a domain
**Time:** 1-2 hours
**Cost:** $5-10/month (DigitalOcean, Linode, Vultr)
**Pros:** Full control, cheaper, can use your own domain

### Prerequisites

- A VPS server (Ubuntu 22.04+ recommended)
- A domain name (optional but recommended)
- SSH access to your server

### Step 1: Prepare Your Server

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app directory
mkdir -p /opt/about-time
cd /opt/about-time
```

### Step 2: Create Production Docker Compose

```bash
cat > docker-compose.prod.yml << 'COMPOSE_EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: about_time
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ${DOCKER_REGISTRY}/about-time-backend:latest
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/about_time
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
      PORT: 3001
      SESSION_SECRET: ${SESSION_SECRET}
      CORS_ORIGIN: ${FRONTEND_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3

  frontend:
    image: ${DOCKER_REGISTRY}/about-time-frontend:latest
    restart: unless-stopped
    ports:
      - "80:8080"
      - "443:8080"  # If using SSL
    depends_on:
      - backend
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  postgres-data:
  redis-data:

networks:
  app-network:
    driver: bridge
COMPOSE_EOF
```

### Step 3: Create Environment File

```bash
cat > .env.production << 'ENV_EOF'
# Database
POSTGRES_PASSWORD=<generate-secure-password>
REDIS_PASSWORD=<generate-secure-password>

# Backend
SESSION_SECRET=<openssl rand -base64 48>
FRONTEND_URL=https://your-domain.com

# Docker Registry (if using private registry)
DOCKER_REGISTRY=your-username
ENV_EOF

# Secure the file
chmod 600 .env.production
```

### Step 4: Build and Push Docker Images

**On your local machine:**

```bash
# Build backend
docker build -f infrastructure/docker/Dockerfile.backend \
  -t your-username/about-time-backend:latest .

# Build frontend (with production API URL)
docker build -f infrastructure/docker/Dockerfile.frontend \
  --build-arg VITE_API_URL=https://api.your-domain.com/api \
  -t your-username/about-time-frontend:latest .

# Push to Docker Hub
docker login
docker push your-username/about-time-backend:latest
docker push your-username/about-time-frontend:latest
```

### Step 5: Deploy on Server

```bash
# On your server
cd /opt/about-time

# Pull images
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f

# Run migrations
docker compose -f docker-compose.prod.yml exec backend npm run migrate --workspace=@about-time/backend
```

### Step 6: Set Up Nginx Reverse Proxy (Optional)

If you want custom domains:

```bash
# Install nginx
apt install nginx certbot python3-certbot-nginx -y

# Create nginx config
cat > /etc/nginx/sites-available/about-time << 'NGINX_EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Enable site
ln -s /etc/nginx/sites-available/about-time /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Get SSL certificates
certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## Option 3: Kubernetes (Enterprise Scale)

**Best for:** Large scale, high availability, team environments
**Time:** 4-8 hours
**Cost:** $50-200+/month
**Pros:** Auto-scaling, high availability, professional grade

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or DigitalOcean Kubernetes)
- kubectl configured
- cert-manager installed (for SSL)
- nginx-ingress-controller installed

### Deployment Steps

See [`infrastructure/kubernetes/README.md`](infrastructure/kubernetes/README.md) for complete guide.

**Quick version:**

```bash
cd infrastructure/kubernetes

# 1. Create secrets
kubectl create secret generic about-time-secrets \
  --namespace=about-time \
  --from-literal=DATABASE_USER=postgres \
  --from-literal=DATABASE_PASSWORD=$(openssl rand -base64 32) \
  --from-literal=SESSION_SECRET=$(openssl rand -base64 48)

# 2. Update image references in deployment files
# Edit backend-deployment.yaml and frontend-deployment.yaml

# 3. Deploy
./deploy.sh

# 4. Run migrations
BACKEND_POD=$(kubectl get pods -n about-time -l app=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n about-time $BACKEND_POD -- npm run migrate --workspace=@about-time/backend
```

---

## Post-Launch Checklist

### Security
- [ ] Change all default passwords
- [ ] Generate secure SESSION_SECRET (min 64 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS_ORIGIN to your actual domain
- [ ] Set up firewall rules
- [ ] Enable database backups

### Monitoring
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Set up log aggregation
- [ ] Monitor database size

### Backups
```bash
# Automated daily backups (cron job)
0 2 * * * docker exec about-time-postgres pg_dump -U postgres about_time | gzip > /backups/about-time-$(date +\%Y\%m\%d).sql.gz

# Keep last 7 days
find /backups -name "about-time-*.sql.gz" -mtime +7 -delete
```

### Performance
- [ ] Enable gzip compression (nginx)
- [ ] Configure CDN for static assets (Cloudflare)
- [ ] Set up database connection pooling
- [ ] Enable Redis caching

---

## Migrating Your Data

If you have templates in browser localStorage:

1. Open `scripts/export-localStorage.html` in your browser
2. Click "Export to JSON"
3. After deployment, use the migration API:

```bash
# First, register an account on your new deployment
# Then get your session cookie from browser DevTools

curl -X POST https://your-api-url.com/api/migrate \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=<your-session-cookie>" \
  -d @about-time-export.json
```

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs about-time-backend
# or
kubectl logs -n about-time -l app=backend

# Common issues:
# - DATABASE_URL not set correctly
# - CORS_ORIGIN doesn't match frontend URL
# - Migrations not run
```

### Frontend shows errors
```bash
# Check if API URL is correct
# In browser console: localStorage.getItem('apiUrl')

# Rebuild with correct API URL
docker build --build-arg VITE_API_URL=https://your-api-url.com/api ...
```

### Database connection errors
```bash
# Test database connection
docker exec -it about-time-backend sh
node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); client.connect().then(() => console.log('Connected!')).catch(console.error)"
```

---

## Recommended Launch Path

**For Your First Launch:**

1. **Start with Railway** (Option 1)
   - Fastest path to production
   - Handles infrastructure automatically
   - Easy to migrate away later if needed

2. **Add monitoring**
   - Set up UptimeRobot for free uptime checks
   - Add Sentry for error tracking

3. **Configure backups**
   - Railway has automatic backups, but export your data weekly

4. **Get a custom domain** (optional)
   - Buy domain from Namecheap/Cloudflare
   - Point to Railway URLs
   - Railway handles SSL automatically

5. **Scale later**
   - Once you have users, consider migrating to VPS or Kubernetes
   - Railway makes it easy to export your database

---

## Cost Comparison

| Option | Setup Time | Monthly Cost | Complexity | Best For |
|--------|------------|--------------|------------|----------|
| Railway | 30 min | ~$20 | Low | Quick launch, startups |
| VPS + Docker | 1-2 hrs | $5-10 | Medium | Cost-conscious, control |
| Kubernetes | 4-8 hrs | $50-200+ | High | Scale, enterprise |

---

## Next Steps

1. Choose your deployment option above
2. Follow the step-by-step guide
3. Test everything thoroughly
4. Set up monitoring and backups
5. Share with users! 🎉

Need help? Check the troubleshooting section or open an issue on GitHub.
