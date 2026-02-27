# Railway Deployment Setup

This guide explains how to connect the Railway services that cannot be configured purely in code (for security reasons).

## Automated Configuration

The following are configured via code in this repository:
- ✅ Build command (railway.json)
- ✅ Start command (railway.json)
- ✅ Health check endpoint (railway.json)
- ✅ Node version (package.json engines)
- ✅ Build process (nixpacks.toml)

## Manual Configuration Required

The following must be set in Railway UI (cannot be stored in git for security):

### 1. Database Connection (about-time-backend service)

**Variables Tab → New Variable → Add Reference:**

| Variable Name | Reference From | Reference Variable |
|---------------|----------------|-------------------|
| `DATABASE_URL` | Postgres service | `DATABASE_URL` |
| `REDIS_URL` | Redis service | `REDIS_URL` |

### 2. Security & Config (about-time-backend service)

**Variables Tab → New Variable → Add Variable:**

| Variable Name | Value | How to Generate |
|---------------|-------|----------------|
| `SESSION_SECRET` | (random string) | Click "Generate" or `openssl rand -base64 48` |
| `NODE_ENV` | `production` | Type manually |
| `PORT` | `3001` | Type manually |
| `CORS_ORIGIN` | `https://<frontend>.up.railway.app` | Copy from frontend URL after deploy |

### 3. Enable Public URL

**Settings Tab → Networking:**
- Toggle "Generate Domain" ON
- Copy the generated URL (you'll need this for CORS_ORIGIN)

## Quick Setup Commands

After creating the services in Railway, run these CLI commands:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set variables (replace with actual values)
railway variables set SESSION_SECRET=$(openssl rand -base64 48)
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Note: DATABASE_URL and REDIS_URL must be connected via References in the UI
# Note: CORS_ORIGIN should be set after frontend deployment
```

## Verification

After setup, verify your configuration:

```bash
# Check all variables are set
railway variables

# Check deployment status
railway status

# View logs
railway logs

# Test health endpoint
curl https://<your-backend-url>.up.railway.app/health
```

## Update CORS After Frontend Deploys

Once your frontend is deployed:

1. Get frontend URL from Railway dashboard
2. Update backend CORS_ORIGIN:
   ```bash
   railway variables set CORS_ORIGIN=https://<frontend-url>.up.railway.app
   ```
3. Service will auto-redeploy with new CORS setting

## Why Some Config Must Be Manual

Railway (correctly) prevents these from being in git:
- **Database URLs**: Contain credentials, generated per environment
- **Session secrets**: Must be kept secret, not committed to git
- **Service references**: Tied to specific Railway project IDs

This is standard practice for production deployments to maintain security.
