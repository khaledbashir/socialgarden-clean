# 🔥 FIX: Change Backend Branch to enterprise-grade-ux

## Problem
- EasyPanel backend service is using branch: `backend-service`
- That branch doesn't have the Dockerfile!
- Latest code is on `enterprise-grade-ux` branch

## Solution: Change the Branch

### In EasyPanel UI:

1. Go to: **ahmad / socialgarden-backend** service
2. Click the **GitHub** tab (in the Source section)
3. Change **Branch**: from `backend-service` → `enterprise-grade-ux`
4. Click **Deploy**

That's it! Wait 3-5 minutes for rebuild.

---

## Verification

Once deployed:
```bash
curl https://ahmad-socialgarden-backend.840tjq.easypanel.host/docs
```

Should return FastAPI Swagger UI (blue page with API docs)

---

## Why This Works

- `enterprise-grade-ux` branch has:
  - ✅ `/backend/Dockerfile` with all dependencies
  - ✅ `backend/requirements.txt` with FastAPI + WeasyPrint
  - ✅ `backend/main.py` with working PDF endpoint
  
- `backend-service` branch doesn't have the Dockerfile, so build fails

---

**Do this NOW and test PDF export after ~5 minutes! 🚀**
