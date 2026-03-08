# Deployment Checklist for Railway

## Pre-Deployment Verification

### 1. Local Build Tests ✅
- [x] Backend build passes: `npm run build --workspace=@about-time/backend`
- [x] Frontend build passes: `npm run build --workspace=@about-time/frontend`
- [x] All TypeScript errors resolved
- [x] All ESLint errors resolved (warnings are acceptable)

### 2. Code Review
- [ ] Review all changes in git status
- [ ] Verify no sensitive information in code (API keys, passwords, etc.)
- [ ] Check that .env.example is up to date with new environment variables

## Database Migration

### 3. Migration Files
Current migration to apply:
- `apps/backend/drizzle/0008_black_stellaris.sql` - Adds usage tracking to library_memberships

### 4. Migration Steps
**IMPORTANT:** Run migrations AFTER deploying but BEFORE users access the new features.

```bash
# Option 1: Railway CLI
railway run npm run db:push --workspace=@about-time/backend

# Option 2: Manual SQL execution via Railway dashboard
# Navigate to: Project → Database → Query
# Copy and paste the SQL from 0008_black_stellaris.sql
```

Migration content:
```sql
ALTER TABLE "library_memberships" ADD COLUMN "last_used_at" timestamp with time zone;
ALTER TABLE "library_memberships" ADD COLUMN "usage_count" integer DEFAULT 0 NOT NULL;
```

## Git Commit and Push

### 5. Commit All Changes
```bash
# Review what will be committed
git status

# Add all files
git add .

# Commit with descriptive message
git commit -m "$(cat <<'EOF'
feat: Complete library system with composites and confidence tracking

Features Added:
- Library system with many-to-many template organization
- Scoped libraries for LaneTemplates
- Composite variable system with versioning (snapshot vs live-link)
- Confidence intervals for uncertain values
- Usage tracking (lastUsedAt, usageCount)
- Library cleanup tools (never used, 90+ days stale detection)
- Export/import library functionality
- Circular reference prevention with DFS cycle detection
- Composite/Expanded variable view toggle
- Enhanced variable display with source tracking

Backend Changes:
- New tables: libraries, library_memberships
- Migration 0008: Added usage tracking columns
- LibraryService with full CRUD, export/import, cycle detection
- Updated TemplateService to track usage
- New API endpoints for libraries management
- Integration tests for library operations

Frontend Changes:
- LibraryBrowser component for library management
- CleanupTools component with stats dashboard
- CompositeVariablePicker for adding composites
- CreateCompositeDialog for creating new composites
- VariableViewToggle for switching display modes
- EnhancedVariablesList with dual-view rendering
- TemplateLibraryBadges showing library membership
- LibrarySelector for quick adding to libraries

Documentation:
- USER_GUIDE.md - Complete end-user documentation
- API.md - Full API reference with examples
- ARCHITECTURE.md - Technical architecture and algorithms
- Updated CLAUDE.md with library, composite, confidence sections

Tests:
- Integration tests for library CRUD operations
- E2E workflow test covering all features (18 steps)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"

# Push to main branch (triggers Railway deployment)
git push origin main
```

### 6. Monitor Railway Deployment
1. Open Railway dashboard: https://railway.app
2. Navigate to your project
3. Watch the deployment logs for both backend and frontend services
4. Wait for "Deployment successful" status
5. Check for any errors in build or startup logs

## Post-Deployment Verification

### 7. Run Database Migration
After deployment succeeds but BEFORE step 8:
```bash
# Connect to Railway and run migration
railway run npm run db:push --workspace=@about-time/backend

# Verify migration applied successfully
railway run npm run db:studio --workspace=@about-time/backend
# Check that library_memberships table has last_used_at and usage_count columns
```

### 8. Smoke Tests
Test the following features in production:

#### Library System
- [ ] Create a new library
- [ ] Add templates to library
- [ ] View library details
- [ ] Remove template from library
- [ ] Delete library
- [ ] View library badges on template cards

#### Composite Variables
- [ ] Create a new composite variable
- [ ] Add composite to a template (snapshot mode)
- [ ] Add composite to a template (live-link mode)
- [ ] View composite in variable list
- [ ] Toggle between composite and expanded view
- [ ] Update composite and verify live-link updates

#### Confidence Factors
- [ ] Add a variable with confidence interval
- [ ] View expanded variable list showing confidence ranges
- [ ] Verify composite aggregation includes confidence

#### Usage Tracking
- [ ] Use a template (add it to a segment)
- [ ] Open library cleanup tools
- [ ] Verify usage count incremented
- [ ] Verify lastUsedAt updated

#### Cleanup Tools
- [ ] Open library detail view
- [ ] Navigate to cleanup tools section
- [ ] Verify stats are calculated correctly
- [ ] Select unused templates
- [ ] Remove selected templates from library

#### Export/Import
- [ ] Export a library as JSON
- [ ] Import the exported library
- [ ] Verify all data preserved

#### Circular Reference Prevention
- [ ] Attempt to add a template to itself (should be blocked)
- [ ] Attempt to create a circular chain (A → B → A) (should be blocked)

### 9. Check for Errors
- [ ] Check browser console for JavaScript errors
- [ ] Check Railway backend logs for server errors
- [ ] Verify all API endpoints responding correctly
- [ ] Check database query performance (Railway metrics dashboard)

### 10. Rollback Plan (if needed)
If critical issues are found:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or force reset to previous working commit
git reset --hard <previous-commit-hash>
git push --force origin main

# Rollback database migration (if applied)
# Run this SQL in Railway Query interface:
ALTER TABLE "library_memberships" DROP COLUMN "last_used_at";
ALTER TABLE "library_memberships" DROP COLUMN "usage_count";
```

## Environment Variables

Verify these are set in Railway:

### Backend Service
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Railway)
- `NODE_ENV` - Set to "production"
- `JWT_SECRET` - Secure random string for auth tokens
- `PORT` - Port number (default: 3001, auto-set by Railway)
- `FRONTEND_URL` - Your frontend Railway URL for CORS

### Frontend Service
- `VITE_API_URL` - Your backend Railway URL
- `NODE_ENV` - Set to "production"

## Post-Launch Monitoring

### First 24 Hours
- [ ] Monitor Railway logs for unusual errors
- [ ] Check application metrics (response times, error rates)
- [ ] Monitor database query performance
- [ ] Watch for user-reported issues

### First Week
- [ ] Review usage analytics for new features
- [ ] Collect user feedback on library system
- [ ] Monitor database growth (library_memberships table size)
- [ ] Check for performance issues with large libraries

## Success Criteria

Deployment is successful when:
- ✅ Both frontend and backend deploy without errors
- ✅ Database migration applies successfully
- ✅ All smoke tests pass
- ✅ No errors in browser console or backend logs
- ✅ Users can access and use all new features
- ✅ No performance degradation from pre-deployment state

## Notes

- Railway automatically deploys on push to main branch
- Database migrations are NOT automatic - must be run manually
- Frontend environment variables must include `VITE_` prefix
- Backend uses `dotenv` for local development but Railway env vars in production
- Monitor the Railway dashboard during deployment for real-time status

## Support

If issues arise during deployment:
- Check Railway logs: Project → Service → Logs
- Check Railway build logs: Project → Service → Deployments → [Latest] → View Logs
- Review database status: Project → Database → Metrics
- Test API directly: `curl https://your-backend.railway.app/api/health`

---

**Last Updated:** 2026-03-08
**Deployment Target:** Railway (Frontend + Backend + PostgreSQL)
**Migration Version:** 0008_black_stellaris
