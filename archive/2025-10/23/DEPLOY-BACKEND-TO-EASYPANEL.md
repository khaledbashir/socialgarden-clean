# Deploy FastAPI Backend to EasyPanel - STEP BY STEP

## ⚡ Quick Summary
The PDF export is failing because **the backend service isn't deployed to EasyPanel**. We need to add it as a new Docker service.

---

## 🚀 **STEP 1: Open EasyPanel Dashboard**
1. Go to: https://840tjq.easypanel.host
2. Login with your credentials
3. You should see: `sow-frontend`, `ahmad-mysql-database`, `ahmad-anything-llm`

---

## 🚀 **STEP 2: Create New Backend Service**

### Click "+ Service" button (top right)

Select: **Docker**

---

## 🚀 **STEP 3: Configure Service**

Fill in these fields:

| Field | Value |
|-------|-------|
| **Service Name** | `socialgarden-backend` |
| **Git Repository** | `https://github.com/khaledbashir/the11-dev` |
| **Dockerfile Path** | `/backend/Dockerfile` |
| **Build Context** | `/` |
| **Port** | `8000` |

---

## 🚀 **STEP 4: Add Environment Variables**

Click "Environment Variables" and add these:

```
DB_HOST=ahmad-mysql-database
DB_PORT=3306
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
```

---

## 🚀 **STEP 5: Deploy**

Click **"Create Service"** or **"Deploy"** button

Wait 3-5 minutes for:
- ✅ Docker image to build
- ✅ Container to start
- ✅ Service to become "Running"

You'll see status updates in the Activity tab.

---

## 🚀 **STEP 6: Create Domain (Optional but Recommended)**

Once the service is running:

1. Go to the `socialgarden-backend` service
2. Click "Domains" tab
3. Click "+ Add Domain"
4. Configure:
   - **Domain**: `ahmad-socialgarden-backend.840tjq.easypanel.host` (or custom)
   - **Protocol**: HTTP
   - **Port**: `8000`
   - **Path**: `/`

---

## ✅ **STEP 7: Verify It Works**

Once deployed, test:

```bash
curl https://ahmad-socialgarden-backend.840tjq.easypanel.host/docs
```

Should return FastAPI Swagger UI (blue page with API docs), NOT 404

---

## 🎯 **Then PDF Export Will Work**

Once backend is running:
1. Hard refresh frontend: **Ctrl+Shift+R**
2. Try PDF export
3. Should work! ✅

---

## 📋 **Troubleshooting**

**If deployment fails:**
- Check Activity tab for error messages
- Verify Git repo URL is correct
- Verify Dockerfile path is `/backend/Dockerfile`

**If service won't start:**
- Check logs in EasyPanel
- Verify environment variables are set correctly
- Make sure database service `ahmad-mysql-database` is running

**If domain returns 404:**
- Make sure service is in "Running" state
- Check port is `8000`
- Wait a few minutes for DNS to propagate

---

## 💡 **Why This Works**

- `socialgarden-backend` = FastAPI app (our PDF service)
- Runs on port 8000
- Has access to database via `DB_HOST=ahmad-mysql-database`
- Domain points to it, so frontend can send PDF requests

Once this is done, the chain is complete:
```
Frontend (/api/generate-pdf)
    ↓
Backend (FastAPI @ ahmad-socialgarden-backend.840tjq.easypanel.host)
    ↓
WeasyPrint
    ↓
PDF
```

---

## ⏱️ **Time Estimate: 10 minutes**
- 2 min: Create service
- 3-5 min: Docker build + start
- 1 min: Create domain
- 1 min: Verify + test
