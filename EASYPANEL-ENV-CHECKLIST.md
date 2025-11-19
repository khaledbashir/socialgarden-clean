# Easypanel Environment Variables Checklist

## ✅ Issues Found & Fixed

### 1. **CRITICAL: Missing Frontend Variable**
- ❌ **Missing:** `NEXT_PUBLIC_ANYTHINGLLM_API_KEY`
- ✅ **Required:** The frontend code throws an error if this is not set
- ✅ **Fix:** Add `NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA` to frontend

### 2. **Database Host Format**
- ✅ **Frontend:** `ahmad_mysql-database` (underscore) - **CORRECT**
- ⚠️ **Backend:** `ahmad-mysql-database` (hyphen) - **Should match frontend**
- ✅ **Fix:** Changed backend to use underscore to match frontend

## 📋 Frontend Environment Variables (Corrected)

See `EASYPANEL-FRONTEND-ENV-CORRECTED.txt` for the complete list.

**Key Changes:**
- ✅ Added `NEXT_PUBLIC_ANYTHINGLLM_API_KEY` (was missing)
- ✅ Verified `DB_HOST=ahmad_mysql-database` (correct format)

## 📋 Backend Environment Variables (Corrected)

See `EASYPANEL-BACKEND-ENV-CORRECTED.txt` for the complete list.

**Key Changes:**
- ✅ Changed `DB_HOST` from `ahmad-mysql-database` to `ahmad_mysql-database` to match frontend

## 🔍 How to Verify

### Check if services are running:
```bash
docker ps
```

### Test database connection:
```bash
# From within frontend container
mysql -h ahmad_mysql-database -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -e "SELECT 1;"
```

### Test AnythingLLM connection:
```bash
# Check if API key is set
echo $NEXT_PUBLIC_ANYTHINGLLM_API_KEY
```

## 🚨 Critical Actions Required

1. **Add missing variable to Frontend:**
   - Go to Easypanel → Frontend Service → Environment Variables
   - Add: `NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA`
   - Restart the frontend service

2. **Update Backend DB_HOST (optional but recommended):**
   - Change `DB_HOST=ahmad-mysql-database` to `DB_HOST=ahmad_mysql-database`
   - This ensures consistency with frontend

3. **Restart Services:**
   - After adding/updating variables, restart both frontend and backend services
   - Check logs to ensure no errors

## 📝 Notes

- All environment variables are case-sensitive
- `NEXT_PUBLIC_*` variables are exposed to the browser (client-side)
- Non-`NEXT_PUBLIC_*` variables are server-side only
- Database hostname format (underscore vs hyphen) should match what Docker network uses
- If you see connection errors, verify the hostname matches exactly what `docker ps` shows

