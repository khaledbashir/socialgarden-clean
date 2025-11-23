# 🚀 Dev Environment Setup - Complete Clone

**Date:** October 19, 2025
**Project:** Social Garden SOW Generator
**Branch:** production-latest (dev repo)

---

## 🎯 What This Is
A complete, working clone of the Social Garden SOW Generator with all APIs configured and ready to run. Just follow these steps and you'll have a fully functional development environment.

---

## 📋 Prerequisites
- Node.js 18+
- Python 3.8+
- MySQL 8.0+ (or Docker)
- Git

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Clone the dev repo
git clone https://github.com/khaledbashir/the11-dev.git
cd the11-dev

# 2. Switch to the production branch
git checkout production-latest

# 3. Start everything
./dev.sh
```

**That's it!** Your app will be running at:
- Frontend: http://localhost:3333
- Backend API: http://localhost:8000

---

## 🔧 Manual Setup (if dev.sh doesn't work)

### 1. Install Dependencies
```bash
# Frontend
cd frontend
pnpm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Database Setup
```bash
# If using local MySQL
mysql -u root -p
CREATE DATABASE socialgarden_sow;
CREATE USER 'sg_sow_user'@'localhost' IDENTIFIED BY 'SG_sow_2025_SecurePass!';
GRANT ALL PRIVILEGES ON socialgarden_sow.* TO 'sg_sow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
cd database
mysql -u sg_sow_user -p socialgarden_sow < schema.sql
```

### 3. Start Services
```bash
# Terminal 1: Backend (PDF service)
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
pnpm dev
```

---

## 🔑 API Keys & Services (Already Configured)

### ✅ Working APIs:
- **OpenRouter AI:** `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`
- **AnythingLLM:** `https://ahmad-anything-llm.840tjq.easypanel.host`
- **Database:** Local MySQL (socialgarden_sow)

### 🔄 API Endpoints:
- Frontend: `http://localhost:3333`
- PDF Generation: `http://localhost:8000/generate-pdf`
- SOW API: `http://localhost:3333/api/sow/*`
- AI Chat: `http://localhost:3333/api/anythingllm/*`

---

## 🧪 Test Everything Works

1. **Open browser:** http://localhost:3333
2. **Create a SOW:** Should work with AI suggestions
3. **Generate PDF:** Should download a branded PDF
4. **AI Chat:** Should respond in client portals

---

## 🛠️ Development Workflow

### Making Changes:
```bash
# Work on production-latest branch
git checkout production-latest

# Make your changes
# Test locally
# Commit and push
git add .
git commit -m "feat: your awesome feature"
git push origin production-latest
```

### When Ready for Production:
```bash
# Push to production repo
git push upstream production-latest:main
```

---

## 📚 Key Files to Know

- **Frontend:** `frontend/app/` (Next.js pages)
- **APIs:** `frontend/app/api/` (Next.js API routes)
- **Backend:** `backend/main.py` (FastAPI PDF service)
- **Database:** `database/schema.sql`
- **Config:** `.env` (already set up)
- **Start Script:** `./dev.sh`

---

## 🚨 If Something Breaks

1. **Check logs:** `logs/` folder
2. **Restart services:** Kill and rerun `./dev.sh`
3. **Check .env:** Make sure all variables are set
4. **Database:** Ensure MySQL is running and DB exists

---

## 📞 Need Help?

- **AI Instructions:** `AI_INSTRUCTIONS.md`
- **Full Docs:** `REPOSITORY-SETUP-DOCUMENTATION.md`
- **Owner:** Khaled Bashir

---

**This is a complete, working clone. Just run `./dev.sh` and start coding!** 🚀