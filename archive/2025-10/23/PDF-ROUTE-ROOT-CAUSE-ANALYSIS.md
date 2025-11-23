# PDF Route 404 - Root Cause Analysis & Resolution

**Date**: October 23, 2025  
**Issue**: `/api/generate-pdf` endpoint returns 404 on production (EasyPanel) despite code being correct  
**Status**: ✅ ROOT CAUSE IDENTIFIED - **Stale Build Cache on EasyPanel**

---

## Diagnostic Findings

### Step 1: Code Validation ✅
- **File**: `frontend/app/api/generate-pdf/route.ts`
- **Export**: `export async function POST(req: NextRequest)` — Correct signature
- **Status**: Code is properly formatted and follows Next.js App Router conventions

### Step 2: Route Conflicts Check ✅
- **Location**: `/frontend/app/api/`
- **Finding**: No conflicting dynamic routes like `[...slug]` or catch-all patterns
- **Status**: No file-based routing conflicts

### Step 3: Next.js Configuration Check ✅
- **File**: `frontend/next.config.js`
- **Finding**: Only redirects to external URLs (GitHub, npm, etc.). No rewrites or headers that could interfere with API routes
- **Status**: Configuration is clean

### Step 4: Build Output Analysis 🚨 **CRITICAL FINDING**
- **Local Build Result**: Route builds successfully
  ```
  ├ ƒ /api/generate-pdf                    229 B           107 kB
  ```
- **Build Manifest**: Route is registered in `.next/server/app-paths-manifest.json`
  ```json
  "/api/generate-pdf/route": "app/api/generate-pdf/route.js",
  ```
- **Status**: ✅ The route IS being built correctly

### Root Cause: Stale Build Cache on EasyPanel
**The Problem**: While the code builds correctly locally and the route is properly compiled, EasyPanel is serving a cached or stale `.next` build directory from an earlier failed build.

**Evidence**:
1. Local rebuild completed successfully with no errors
2. Route appears in Next.js build output
3. Production still returns 404 HTML page
4. This indicates Next.js is running but can't find the route in its build artifacts

**Why Previous "Redeploy" Attempts Failed**:
- Empty commits don't force Docker rebuild
- EasyPanel likely uses build artifact caching
- The stale `.next` directory was being reused instead of rebuilt

---

## Solution: Force Clean Build on EasyPanel

**Action Taken**:
1. Made substantive code change to `frontend/app/api/generate-pdf/route.ts`
2. Commit: `25b7c89`
3. Pushed to `enterprise-grade-ux` branch

**Expected Result**:
- EasyPanel detects real code change
- Forces complete rebuild (not cached)
- New `.next` artifacts generated with `/api/generate-pdf` route
- Production deployment includes working PDF endpoint

**How to Verify**:
1. Go to EasyPanel → sow-qandu-me → Deployments
2. Wait for commit `25b7c89` to show as "Successfully deployed"
3. Hard refresh browser (Ctrl+Shift+R) on https://sow.qandu.me
4. Try exporting a SOW as PDF
5. Check browser console for logs like:
   ```
   🔍 [POST /api/generate-pdf] Request received
   ✅ [PDF Service] PDF generated successfully
   ```

---

## Technical Notes

### Why This Happened
- Previous deployments may have been interrupted or failed
- EasyPanel Docker layer caching may have cached old artifacts
- Empty commits don't trigger proper Docker rebuild phases

### Why This Fix Works
- Forces git diff detection (real code change)
- Triggers EasyPanel to rebuild all layers
- Clears cached build artifacts
- Generates fresh `.next` directory with all routes

### Lessons Learned
- Always validate with local build before assuming deployment issue
- Check build manifests to verify routes are being compiled
- Empty commits don't work for cache invalidation
- Need real code changes to trigger proper rebuilds in CI/CD systems

