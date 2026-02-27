# Frontend Deployment - Manual Configuration Required

## Issue

Railway's root `railway.json` file is being applied to ALL services in the project. The CLI and API don't support overriding build/start commands per-service when a root configuration file exists.

## Solution: Configure in Railway Dashboard

You need to manually override the build and start commands for the frontend service in the Railway dashboard.

### Step 1: Access Frontend Service Settings

Go to: https://railway.com/project/4d1708ff-f303-4d6a-9498-97eb15c96658/service/cdcd68c0-aa8a-4963-8b70-c3338fe40a18/settings

### Step 2: Override Build Command

In the **Settings** tab, find the **Build** section:

1. Click "Custom Build Command" or similar
2. Set **Build Command** to:
   ```
   npm run build --workspace=@tannerbroberts/about-time-core && npm run build --workspace=@about-time/api-client && npm run build --workspace=@about-time/frontend
   ```
3. Click Save

### Step 3: Override Start Command

In the same **Settings** tab, find the **Deploy** section:

1. Click "Custom Start Command" or similar
2. Set **Start Command** to:
   ```
   npx serve -s apps/frontend/dist -l $PORT
   ```
3. Click Save

### Step 4: Set Root Directory (if available)

If there's a **Root Directory** setting:

1. Set it to: `apps/frontend`
2. Click Save

**Note**: This may not be necessary if the build/start commands are set correctly.

### Step 5: Trigger Deployment

After saving all settings:

1. Go to the **Deployments** tab
2. Click **"Redeploy"** button on the latest deployment
3. Monitor the build logs to ensure it's building the frontend (not backend)

## Expected Behavior

After configuration:
- Build will compile: core → api-client → frontend
- Server will start with `npx serve` hosting the frontend dist folder
- Frontend will be available at: https://about-time-frontend-production.up.railway.app
- You should see the login/register page

## After Frontend Deploys Successfully

Update backend CORS to allow the frontend origin:

```bash
railway variables set CORS_ORIGIN=https://about-time-frontend-production.up.railway.app --service about-time-backend
```

## Troubleshooting

**If you see backend errors in logs**:
- The root `railway.json` is still being used
- Make sure the custom build/start commands are set in Settings
- Try setting the root directory to `apps/frontend`

**If deployment fails**:
- Check that `serve` package is installed (it is, in devDependencies)
- Verify the build actually creates `apps/frontend/dist` folder
- Check build logs for TypeScript or lint errors

**If you see 404 errors**:
- The service might still be deploying (check status)
- Health check might be failing (check logs for serve output)
- Try accessing `/index.html` directly to test
