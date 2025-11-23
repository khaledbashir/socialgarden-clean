# QUICKFIX: Backend Port Configuration

**Issue Found**: The reverse proxy at `ahmad-socialgarden-backend.840tjq.easypanel.host` is pointing to port 80, but FastAPI backend should run on port 8000.

---

## What You Need to Do in EasyPanel

### In the ahmad-socialgarden-backend Service (Reverse Proxy)

Go to: **EasyPanel → ahmad-socialgarden-backend → Settings → Domains**

**Current Configuration** (WRONG):
```
Protocol: HTTP
Port: 80
Path: /
```

**Should Be** (CORRECT):
```
Protocol: HTTP
Port: 8000
Path: /
```

**OR if you have the actual FastAPI service deployed separately:**

Check the internal service name and port where your backend is actually running, then update the reverse proxy to point there.

---

## Verification Steps

### Step 1: Check What's Actually Running

In EasyPanel, look for services:
- [ ] Is there a service called `socialgarden-backend` (FastAPI)?
- [ ] Is there only `ahmad-socialgarden-backend` (reverse proxy)?
- [ ] Is the backend service deployed and running?

### Step 2: Update the Port

If `ahmad-socialgarden-backend` is a reverse proxy:
- Change destination port from 80 to 8000
- Save

### Step 3: Test the Fix

```bash
curl https://ahmad-socialgarden-backend.840tjq.easypanel.host/docs
```

Should return FastAPI Swagger UI (not 404)

---

## If Backend Isn't Deployed

If there's NO actual FastAPI backend service in EasyPanel:

1. Go to EasyPanel Dashboard
2. Click "+ Service"
3. Select Docker
4. Name: "socialgarden-backend"
5. Git Repo: `https://github.com/khaledbashir/the11-dev`
6. Dockerfile: `/backend/Dockerfile`
7. Build Context: `/`
8. Environment Variables:
   ```
   DB_HOST=ahmad-mysql-database
   DB_PORT=3306
   DB_USER=sg_sow_user
   DB_PASSWORD=SG_sow_2025_SecurePass!
   DB_NAME=socialgarden_sow
   ```
9. Port: 8000
10. Deploy

Then create a domain pointing to it.

---

## Current Status

**Environment variables in frontend are correct:**
```
NEXT_PUBLIC_PDF_SERVICE_URL=https://ahmad-socialgarden-backend.840tjq.easypanel.host
```

**What's wrong:**
- The service listening on that domain is either:
  - Pointing to wrong port (80 instead of 8000)
  - Not the actual FastAPI backend
  - Backend not deployed

**Quick fix**: Update the port in the reverse proxy domain configuration from 80 to 8000 and test.

