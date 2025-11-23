# Quick Answers: Database, Backend, Deployment

## 🗄️ Where is the Database?

**EXTERNAL MySQL Server** (NOT in a container):
- **Host**: `168.231.115.219`
- **Port**: `3306`
- **Accessed by**: Both frontend AND backend
- **Why external?**: Data persistence, independent scaling, production-standard

```
Frontend Container ──→ MySQL Database
Backend Container ──→ MySQL Database
```

---

## 🔧 What's in the Backend?

The backend (FastAPI) does **NOT just PDF**. It handles:

### 1. **PDF Generation** ✅
```
User clicks "Export PDF"
    ↓
Frontend: Convert TipTap JSON → HTML
    ↓
Frontend: POST /api/generate-pdf (HTML blob)
    ↓
Backend: POST /generate-pdf
    ├─ Render HTML with Jinja2 template
    ├─ Apply DEFAULT_CSS (embedded branding)
    ├─ WeasyPrint renders → PDF
    └─ Return PDF blob
    ↓
Frontend: User downloads PDF
```

### 2. **Google Sheets Export** ✅
```
User exports SOW to Sheets
    ↓
Backend: /export-to-sheets
    ├─ Reads Google Service Account credentials
    ├─ Creates/updates Google Sheet
    ├─ Auto-shares with client email
    └─ Returns Sheets URL
```

### 3. **OAuth Handling** ✅
```
Google OAuth callback → /oauth/callback
    ├─ Exchanges auth code for tokens
    ├─ Stores credentials
    └─ Redirects to app
```

### 4. **Health Check** ✅
```
EasyPanel monitoring: /health
    └─ Returns 200 if service alive
```

---

## 📦 GitHub vs DockerHub: Why Different?

**Current (CONFUSING ❌)**:
```
Frontend Code → GitHub → Deploy (Git)
Backend Code → ??? → Push to DockerHub → Deploy (Docker image)
```

**Problem**: Backend code not tracked in repo, hard to see history

---

## ✅ UNIFIED SOLUTION

**Everything in ONE place: GitHub**

```
the11-dev/ (GitHub)
├── frontend/           ← Next.js code
│   ├── app/
│   ├── lib/
│   └── package.json
├── backend/            ← FastAPI code
│   ├── main.py
│   ├── routes/
│   └── requirements.txt
├── database/           ← SQL schemas
│   ├── schema.sql
│   └── migrations/
├── Dockerfile          ← Frontend image (root)
├── backend/Dockerfile  ← Backend image
└── docker-compose.yml  ← Local dev
```

### Deployment from EasyPanel:

**Frontend**:
```
1. Push to GitHub
2. EasyPanel watches repo
3. Auto-deploys (no Docker)
4. Runs Node.js directly
```

**Backend**:
```
Option A (Recommended): EasyPanel Docker Direct
1. Push to GitHub
2. EasyPanel watches repo
3. Builds Docker image (from backend/Dockerfile)
4. Runs container on port 8000
5. No DockerHub needed

Option B (Current): DockerHub Pipeline
1. Push to GitHub
2. Build Docker image locally/CI
3. Push to DockerHub
4. EasyPanel pulls from DockerHub
5. Runs container on port 8000
```

---

## 📊 System Architecture (Simple View)

```
┌─────────────────────────────────────────┐
│ Browser (https://sow.qandu.me)          │
│ ├─ Dashboard (analytics)                 │
│ ├─ SOW Editor (TipTap)                   │
│ └─ Gardner Studio (AI agents)            │
└─────────────────────────────────────────┘
              ↓ HTTP/API
┌─────────────────────────────────────────┐
│ Frontend Container (Next.js, port 3001)  │
│ ├─ /api/sow/* (CRUD)                     │
│ ├─ /api/gardners/* (AI agents)           │
│ ├─ /api/generate-pdf (→ backend)         │
│ └─ /api/anythingllm/* (AI chat)          │
└─────────────────────────────────────────┘
              ↓ HTTP/API
┌─────────────────────────────────────────┐
│ Backend Container (FastAPI, port 8000)   │
│ ├─ /generate-pdf (WeasyPrint)            │
│ ├─ /export-to-sheets (Google Sheets)     │
│ ├─ /oauth/callback                       │
│ └─ /health                               │
└─────────────────────────────────────────┘
         ↓ SQL queries
┌─────────────────────────────────────────┐
│ MySQL Database (168.231.115.219:3306)    │
│ ├─ sows (documents)                      │
│ ├─ sow_activities (tracking)              │
│ └─ sow_comments (feedback)                │
└─────────────────────────────────────────┘

External Services:
┌─────────────────────────────────────────┐
│ AnythingLLM (workspaces, embeddings)      │
│ OpenRouter (inline AI)                   │
│ Google Sheets + OAuth                    │
└─────────────────────────────────────────┘
```

---

## 📋 Environment Variables

### Frontend (EasyPanel UI)
```env
# Client-side (NEXT_PUBLIC_ = exposed to browser)
NEXT_PUBLIC_ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
NEXT_PUBLIC_ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA
NEXT_PUBLIC_BASE_URL=https://sow.qandu.me
NEXT_PUBLIC_API_URL=http://168.231.115.219:8000
NEXT_PUBLIC_PDF_SERVICE_URL=http://168.231.115.219:8000

# Server-side (Not exposed to browser)
DB_HOST=168.231.115.219
DB_USER=sg_sow_user
DB_PASSWORD=...
DB_NAME=socialgarden_sow
OPENROUTER_API_KEY=...
GOOGLE_OAUTH_CLIENT_ID=...
```

### Backend (EasyPanel UI)
```env
# Database
DB_HOST=168.231.115.219
DB_USER=sg_sow_user
DB_PASSWORD=...
DB_NAME=socialgarden_sow

# AnythingLLM
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA

# Google
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SHEETS_PROJECT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
```

---

## ✅ Current Status

| Component | Location | Status |
|-----------|----------|--------|
| Frontend Code | `the11-dev/frontend/` (GitHub) | ✅ Tracked |
| Backend Code | `the11-dev/backend/` (GitHub) | ✅ Tracked |
| Frontend Dockerfile | `Dockerfile` (GitHub) | ✅ Ready |
| Backend Dockerfile | `backend/Dockerfile` (GitHub) | ✅ Ready |
| Database | 168.231.115.219 (External) | ✅ Live |
| AnythingLLM | EasyPanel | ✅ Running |
| Frontend Deployment | EasyPanel (Git) | ✅ Deployed |
| Backend Deployment | EasyPanel (Docker) or DockerHub | ⏳ Ready to optimize |

---

## 🎯 Next Steps

### Immediate (Fix current errors)
1. Update frontend env vars in EasyPanel
2. Redeploy frontend
3. Test workspace creation

### Optional (Optimize deployment)
1. Configure EasyPanel to build backend Docker directly from GitHub
2. Remove DockerHub dependency
3. Everything deployable from one dashboard

**Read**: `ARCHITECTURE-SYSTEM-OVERVIEW.md` for detailed system architecture
