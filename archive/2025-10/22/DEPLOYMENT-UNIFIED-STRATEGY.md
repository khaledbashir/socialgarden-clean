# Unified Deployment Strategy (October 22, 2025)

## Problem: Confusing Deployment Split

**Current (CONFUSING ❌)**:
- Frontend: GitHub → EasyPanel
- Backend: DockerHub → EasyPanel
- Backend code doesn't have clear source tracking
- Hard to correlate versions

---

## Solution: Single Source of Truth

**Everything lives in GitHub (`the11-dev` repo)**:

```
the11-dev/ (GitHub)
├── frontend/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── app/
│       └── [Next.js code]
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   └── [FastAPI code]
├── database/
│   └── schema.sql
├── Dockerfile              ← Frontend image
├── Dockerfile.backend      ← Backend image (or backend/Dockerfile)
└── docker-compose.yml      ← Local development
```

---

## Deployment Flow

### Option 1: Frontend (Easy ✅)
```
1. Push to GitHub
2. EasyPanel auto-deploys from Git
3. No Docker needed (EasyPanel handles Node.js)
```

### Option 2: Backend (More Complex 🚀)

**Approach A: EasyPanel Docker Service** (Recommended)
```
1. Push code to GitHub
2. EasyPanel monitors repository
3. On push, EasyPanel:
   - Pulls latest code
   - Builds Docker image: docker build -f backend/Dockerfile -t sow-backend:latest .
   - Runs container on port 8000
4. No DockerHub needed
```

**Approach B: DockerHub Pipeline** (Current)
```
1. Push code to GitHub
2. GitHub Actions (if set up) or manual:
   - docker build -f backend/Dockerfile -t yourusername/socialgarden-backend:latest .
   - docker push yourusername/socialgarden-backend:latest
3. EasyPanel pulls image from DockerHub
4. Runs container on port 8000
```

---

## Current Status

✅ **Code Organization**:
- Frontend: `the11-dev/frontend/` (GitHub)
- Backend: `the11-dev/backend/` (GitHub)
- Both tracked in same repository

✅ **Docker Files**:
- Frontend: `Dockerfile` (root)
- Backend: `backend/Dockerfile`

⏳ **Build Pipeline**:
- Option A: Set up EasyPanel to build backend Docker directly from Git
- Option B: Keep using DockerHub with manual or GitHub Actions build

---

## Recommended Next Step: EasyPanel Direct Build

Instead of DockerHub, configure EasyPanel to:

1. **Go to EasyPanel**: https://control.easypanel.io
2. **Create NEW service**: Docker (not Node.js)
3. **Configure**:
   - Repository: `https://github.com/khaledbashir/the11-dev.git`
   - Dockerfile path: `backend/Dockerfile`
   - Build context: `.`
   - Port: `8000`
4. **Deploy**: EasyPanel will build & run automatically

**Benefits**:
- ✅ Single source of truth (GitHub only)
- ✅ Automatic builds on push
- ✅ Clear version history
- ✅ No DockerHub account needed
- ✅ Faster deploys

---

## Environment Variables

### Frontend (in EasyPanel UI)
```
NEXT_PUBLIC_ANYTHINGLLM_URL=...
NEXT_PUBLIC_ANYTHINGLLM_API_KEY=...
DB_HOST=...
[etc]
```

### Backend (in EasyPanel UI)
```
DB_HOST=168.231.115.219
DB_PORT=3306
DB_USER=sg_sow_user
DB_PASSWORD=...
DB_NAME=socialgarden_sow
ANYTHINGLLM_URL=...
ANYTHINGLLM_API_KEY=...
```

---

## Database

**Location**: External MySQL (NOT containerized)
- Host: `168.231.115.219`
- Accessed by: Both frontend & backend containers
- Schema: `the11-dev/database/schema.sql`
- Migrations: `the11-dev/database/migrations/`

**Why external?**
- Data persistence (survives container restarts)
- Can restart containers without losing data
- Can scale frontend/backend independently
- Standard production practice

---

## Summary

| Component | Location | Deployment |
|-----------|----------|------------|
| Frontend Code | `the11-dev/frontend/` (GitHub) | EasyPanel (Git) |
| Backend Code | `the11-dev/backend/` (GitHub) | EasyPanel (Docker) |
| Frontend Docker | `Dockerfile` (GitHub) | EasyPanel (Git) |
| Backend Docker | `backend/Dockerfile` (GitHub) | EasyPanel (Git) or DockerHub |
| Database | `168.231.115.219` (External) | MySQL (remote) |

**All code in ONE GitHub repo. All deployable from ONE dashboard (EasyPanel).**
