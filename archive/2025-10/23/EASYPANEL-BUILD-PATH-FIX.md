# 🔧 CRITICAL FIX - EasyPanel Backend Build Path

## The Problem
Your backend service is building from `/` (root) which builds the **FRONTEND** (Next.js).

The logs show:
```
> novel-next-app@0.1.0 start /app
> next start
   ▲ Next.js 15.1.4
```

This is WRONG. It should be:
```
> uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## The Solution (ONE CHANGE)

### In EasyPanel:
1. Go to **socialgarden-backend** service
2. Click **Dockerfile** tab (not GitHub - Dockerfile tab)
3. Find **Build Path**: currently shows `/`
4. Change it to: `/backend`
5. Click **Save** or **Deploy**

Wait 3-5 minutes.

---

## Why This Works

- `/` = build entire monorepo → picks up frontend Dockerfile (wrong)
- `/backend` = build only backend folder → uses `/backend/Dockerfile` (correct) → FastAPI ✅

---

## After Changing Build Path

Test:
```bash
curl https://ahmad-socialgarden-backend.840tjq.easypanel.host/docs
```

Should return **Swagger UI** (blue page with API docs), NOT 404

Then PDF export will work! ✅
