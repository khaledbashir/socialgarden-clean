# CRITICAL FIXES - Oct 22

## Issue #1: Workspace Config Endpoint 404 ✅ FIXED IN .env

**Problem:** POST /undefined/api/v1/workspace/test123/update → 404

**Root Cause:** Code uses `process.env.NEXT_PUBLIC_ANYTHINGLLM_URL` but `.env` has `ANYTHINGLLM_URL`. In Next.js, ONLY `NEXT_PUBLIC_*` variables are exposed to browser code.

**Fix Applied:**
```
Change in frontend/.env:
OLD: ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
NEW: NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
```

**Status:** ✅ DONE - Restart frontend to apply

---

## Issue #2: SOW Creation Returns 500

**Problem:** POST /api/sow/create → 500 error when creating new workspace

**Likely Causes:**
1. Database connection pool exhausted
2. MySQL credentials not working
3. Missing schema column (but thread_slug is already in schema ✓)

**Test Database Connection:**
```bash
mysql -h 168.231.115.219 -u sg_sow_user -p socialgarden_sow -e "SELECT COUNT(*) FROM sows;"
```

**If that fails, restart backend and try again**

**Next Step:** Check backend logs:
- On PM2: `pm2 logs sow-backend | tail -100`
- Or SSH and check MySQL error log

---

## Issue #3: "content script loaded" Message During Chat

**Problem:** See repeated "content script loaded" + chat content becomes empty

**What This Means:** Browser extension or script is reloading. Not a code issue, but:
- Might be Chrome reloading on file change
- Or an extension interfering

**Check:**
1. Open DevTools → check if "Live.js" or any extension script showing
2. Disable extensions and retry
3. Try incognito mode

**This MIGHT not be your code - could be browser or extension**

---

## Issue #4: Dashboard Chat Doesn't Update After New Workspace

**Problem:** Create workspace → Dashboard shows old data → Must click workspace to refresh

**This is Expected UX** but can improve:
- Dashboard is a separate component with its own state
- It doesn't auto-refresh when new workspaces created
- User must manually click workspace to load it

**Not a bug - it's by design.** But we can add auto-refresh if needed.

---

## ACTION ITEMS (RIGHT NOW)

1. **In terminal:**
   ```bash
   cd /root/the11-dev/frontend
   # Edit .env file and change ANYTHINGLLM_URL to NEXT_PUBLIC_ANYTHINGLLM_URL
   nano .env
   ```

2. **Restart frontend dev server:**
   ```bash
   pkill -f "pnpm dev"
   sleep 2
   cd /root/the11-dev/frontend && pnpm dev
   ```

3. **Test again:**
   - Create new workspace
   - Check browser console for errors
   - Try creating SOW

4. **If SOW creation still fails with 500:**
   - Test MySQL: `mysql -h 168.231.115.219 -u sg_sow_user -p socialgarden_sow -e "SELECT 1;"`
   - Report the error message from DevTools network tab (copy full response)

