# EasyPanel Configuration: Switch to Dockerfile Build

**Commit**: `d16a9e8` - "feat: Implement standalone Dockerfile build with multi-stage optimization"

**Status**: Code changes pushed ✅ | Configuration changes pending ⏳

---

## What Changed

We've implemented a **multi-stage Dockerfile** that:
1. **Stage 1 (Builder)**: Builds the entire Next.js application correctly
2. **Stage 2 (Runtime)**: Contains only the compiled `.next` folder + dependencies (minimal, optimized)

This bypasses EasyPanel's broken build process entirely.

---

## Step-by-Step EasyPanel Configuration

### 1. Access the Frontend Service Settings
- Go to **https://app.easypanel.io**
- Select your project
- Click on **sow-qandu-me** (frontend service)
- Go to the **Settings** tab

### 2. Change Build Method to Dockerfile

**Current Setting** (Broken):
- Build Source: `Nixpacks` or similar buildpack system

**New Setting** (Fixed):
- Build Source: `Dockerfile`
- Dockerfile Path: `/Dockerfile`
- Build Context: `/` (project root)

### 3. Update Environment Variables (If Needed)

Make sure these are set in the service environment:
- `NEXT_PUBLIC_ANYTHINGLLM_URL` = `https://ahmad-anything-llm.840tjq.easypanel.host`
- `NEXT_PUBLIC_PDF_SERVICE_URL` = `https://ahmad-socialgarden-backend.840tjq.easypanel.host`
- `DB_HOST` = `ahmad-mysql-database` (internal Docker name for EasyPanel MySQL)
- `DB_USER` = `sg_sow_user`
- `DB_NAME` = `socialgarden_sow`

### 4. Save and Deploy

- Click **Save**
- EasyPanel will detect the new Dockerfile and trigger a rebuild
- Wait for deployment status to show **"Successfully deployed"** ✅

---

## What This Fixes

**Before (Broken)**:
- EasyPanel's Nixpacks build system failing silently
- Stale `.next` build artifacts reused
- `/api/generate-pdf` route returning 404

**After (Fixed)**:
- Our proven, clean build process runs
- Fresh `.next` directory generated every deploy
- `/api/generate-pdf` route available and functional

---

## Verification After Deploy

1. Hard refresh browser: **Ctrl+Shift+R** on https://sow.qandu.me
2. Try exporting a SOW as PDF
3. Check browser console (F12):
   ```
   🔍 [POST /api/generate-pdf] Request received
   📨 [PDF Service] Sending request to: https://ahmad-socialgarden-backend.840tjq.easypanel.host/generate-pdf
   ✅ [PDF Service] PDF generated successfully
   ```

---

## Troubleshooting

**If deployment fails during build**:
- Check EasyPanel build logs for pnpm/node errors
- Verify `pnpm-lock.yaml` exists in `frontend/` directory
- Ensure `Dockerfile` path is set to `/Dockerfile` (not `/frontend/Dockerfile`)

**If PDF still returns 404 after deploy**:
- Hard refresh (Ctrl+Shift+R) to clear browser cache
- Check that service is actually running on port 3001
- Verify environment variables are set correctly

**If service won't start**:
- Confirm port 3001 is available
- Check that `.next` folder was created during build
- Verify `node_modules` are properly copied

---

## Git Commit Details

```
commit d16a9e8
Author: root <root@srv848342.hstgr.cloud>
Date:   Oct 23 2025

    feat: Implement standalone Dockerfile build with multi-stage optimization to fix runtime issues
    
    Changes:
    - Modified frontend/package.json: start script now uses "next start -p 3001"
    - Updated Dockerfile: converted to multi-stage build for production optimization
      * Stage 1 (builder): Node 18 alpine, installs deps, runs pnpm build
      * Stage 2 (runtime): Node 18 alpine with only .next + node_modules
    - Eliminates source code from production image
    - Guarantees clean build every deployment
    - Fixes /api/generate-pdf 404 by ensuring route is properly compiled
```

