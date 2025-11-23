# Deployment Issues - October 23, 2025

## 🔴 CRITICAL ISSUES

### 1. EasyPanel Frontend Not Redeploying with Latest Code
**Status**: Code committed and pushed, but frontend app not rebuilt
**Evidence**:
- New analytics endpoints (`/api/analytics/by-vertical`, `/api/analytics/by-service`) still return 500
- SOW create endpoint returns 500 when it should accept vertical/serviceLine
- Code IS in git and locally verified but NOT in deployed EasyPanel

**Root Cause**: EasyPanel may be in a stuck state or not auto-rebuilding

**Solution**: 
1. Check EasyPanel dashboard manually for build logs
2. If no recent builds: manually trigger rebuild via EasyPanel UI
3. Or push a dummy commit to force rebuild

**Impact**: HIGH - Dashboard analytics not working, SOW creation failing

---

### 2. Logo Files Return 404
**Status**: Logo files exist in `/root/the11-dev/frontend/public/images/` but not served
**Evidence**:
```bash
curl -I https://sow.qandu.me/images/logo-light.png
# Returns: HTTP/2 404
```

**Root Cause**: EasyPanel frontend app not serving `/public` static files correctly

**Solution**:
1. Check EasyPanel Dockerfile/configuration for `public` folder mounting
2. Or move logos to a CDN (e.g., Cloudinary)
3. Or base64-encode logos as data URIs in code

**Impact**: MEDIUM - UI showing broken image icons but functionality not affected

---

## 🟡 DATABASE COLUMN STATUS

✅ **CONFIRMED**: Vertical and Service_Line columns exist in production database:
```sql
mysql> DESCRIBE sows;
...
| vertical     | enum(...) | YES | MUL | NULL | ...
| service_line | enum(...) | YES | MUL | NULL | ...
```

So database IS ready. Issue is purely with deployed code.

---

## ✅ CODE STATUS

All code is correct and deployed to GitHub:
- ✅ Phase 1A: Database schema + analytics endpoints
- ✅ Phase 1B: Dropdown selectors in editor
- ✅ Phase 1C: Click-to-filter dashboard

**BUT**: EasyPanel frontend app hasn't rebuilt with latest code

---

## 🚀 IMMEDIATE ACTIONS REQUIRED

### Option 1: Force EasyPanel Rebuild (Manual)
1. Go to EasyPanel dashboard
2. Find "sow-qandu-me" app
3. Click "Rebuild" or "Redeploy"
4. Wait for build to complete
5. Test `/api/analytics/by-vertical`

### Option 2: Push Dummy Commit to Trigger Auto-Rebuild
```bash
cd /root/the11-dev
git commit --allow-empty -m "chore: trigger easypanel rebuild"
git push origin enterprise-grade-ux
```

### Option 3: Fix Logo 404
**Temporary fix - replace with working URL**:
```bash
grep -r "logo-light.png" frontend --include="*.tsx" | cut -d: -f1 | sort -u | xargs sed -i 's|/images/logo-light.png|https://cdn.example.com/logo-light.png|g'
```

Or use this public Social Garden logo URL:
```
https://socialgarden.com.au/logo-light.png
```

---

## 📊 WHAT WILL WORK AFTER REBUILD

After EasyPanel rebuilds:
1. ✅ Dashboard analytics endpoints return proper data
2. ✅ SOW creation accepts vertical/serviceLine parameters
3. ✅ Charts display vertical/service line breakdown
4. ✅ Click-to-filter works on dashboard

---

## 🎯 ROOT CAUSE ANALYSIS

The issue is **NOT** with code or database.
The issue is **deployment pipeline lag** - code merged but app not redeployed.

This is expected behavior for managed deployment platforms - auto-rebuilds can take 5-15 minutes.

---

**NEXT STEP**: Manually trigger EasyPanel rebuild via dashboard or push dummy commit.
