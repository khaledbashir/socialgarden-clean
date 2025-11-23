# 🌱 Social Garden - SOW Generator

**Production-ready Statement of Work generator with AI-powered content, interactive pricing tables, and professional PDF export.**

---

## 🚀 Quick Start

```bash
./dev.sh
```

**That's it.** One command starts everything:
- ✅ Frontend: http://localhost:3333
- ✅ PDF Service: http://localhost:8000  
- ✅ Hot reload enabled
- ✅ Database connected

Press `Ctrl+C` to stop.

---

## 📋 What You Get

### Core Features
- **📝 Rich Text Editor** - TipTap/ProseMirror with full formatting
- **💰 Interactive Pricing Tables** - 82 pre-loaded roles with drag-drop reordering
- **🤖 AI-Powered Generation** - The Architect agent creates complete SOWs
- **📄 Professional PDF Export** - WeasyPrint with Social Garden branding
- **📊 Excel Export** - Pricing tables to .xlsx
- **🎨 Dark Theme** - Brand color #0e2e33 throughout
- **📱 Client Portal** - Share SOWs with clients for review/approval
- **💬 AnythingLLM Integration** - AI chat with context about each SOW
- **🗄️ MySQL Database** - Full persistence (folders, documents, agents)
- **🏷️ Smart Tagging System** - Auto-categorize SOWs by vertical and service line (Phase 1A BI)

### 🏷️ SOW Tagging & BI Dashboard

The system includes intelligent tagging to categorize SOWs for analytics:

**Backfill Existing Data:**
```bash
# One-time migration to auto-tag all historical SOWs
curl https://sow.qandu.me/api/admin/backfill-tags
```

**Easy Tagging for New SOWs:**
- Tags appear in sidebar as editable dropdowns next to each SOW
- Auto-save on selection
- Once tagged, shows as colored badges
- Supports: 9 verticals (Property, Education, Finance, etc.) + 7 service lines (CRM, Marketing Automation, etc.)

See [SOW-TAGGING-SYSTEM.md](./SOW-TAGGING-SYSTEM.md) for complete setup & troubleshooting guide.

### Live Services
- **Database:** 168.231.115.219:3306 (socialgarden_sow)
- **AnythingLLM:** ahmad-anything-llm.840tjq.easypanel.host
- **VPS:** 168.231.115.219

---

## 🏗️ Project Structure

```
/root/the11/
├── frontend/                     ← Next.js app (Main application)
│   ├── app/                      ← Next.js 15 App Router
│   ├── components/               ← React components
│   ├── lib/                      ← Utilities, database, AI logic
│   └── public/                   ← Static assets
│
├── backend/                      ← FastAPI service (PDF generation)
│   ├── main.py                   ← PDF API server
│   ├── requirements.txt          ← Python dependencies
│   └── venv/                     ← Python virtual environment
│
├── database/                     ← SQL schemas
│   ├── schema.sql                ← Full database schema
│   └── init.sql                  ← Initial setup
│
├── docs/                         ← Technical documentation
│   └── archive/                  ← Historical session notes
│
├── dev.sh                        ← Start development (ONE COMMAND)
├── .env.example                  ← Environment variables template
├── .gitignore                    ← Git ignore rules
└── README.md                     ← You are here
```

**Clean & Simple:** No nested submodules. No monorepo complexity. Just a clean frontend/backend structure.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=168.231.115.219
DB_USER=sg_sow_user
DB_PASSWORD=SG_sow_2025_SecurePass!
DB_NAME=socialgarden_sow
DB_PORT=3306

# AnythingLLM
ANYTHINGLLM_URL=https://ahmad-anything-llm.840tjq.easypanel.host
ANYTHINGLLM_API_KEY=0G0WTZ3-6ZX4D20-H35VBRG-9059WPA

# OpenAI / OpenRouter (for AI features)
OPENROUTER_API_KEY=your_key_here
# OR
OPENAI_API_KEY=your_key_here

# App Config
NEXT_PUBLIC_BASE_URL=http://localhost:3333
NEXT_PUBLIC_API_URL=http://localhost:8000
FRONTEND_PORT=3333
```

---

## 🛠️ Development

### Start Development Server
```bash
./dev.sh
```

This script:
1. Stops any Docker containers
2. Starts PDF service (Python/FastAPI on port 8000)
3. Starts frontend (Next.js on port 3333)
4. Enables hot reload for both services

### Manual Start (if needed)

**Frontend:**
```bash
cd /root/the11/frontend
pnpm install  # First time only
pnpm dev
```

**Backend:**
```bash
cd /root/the11/backend
python3 -m venv venv  # First time only
source venv/bin/activate
pip install -r requirements.txt  # First time only
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Tech Stack
- **Frontend:** Next.js 15.1.4, React 18, TypeScript
- **Editor:** TipTap, ProseMirror
- **Styling:** Tailwind CSS, Radix UI
- **AI:** OpenAI SDK, AnythingLLM
- **Backend:** FastAPI, Uvicorn
- **PDF:** WeasyPrint, Jinja2
- **Database:** MySQL 8.0
- **Deployment:** Docker, Docker Compose

---

## 📊 Database Schema

The app uses MySQL with these tables:

| Table | Purpose |
|-------|---------|
| `folders` | Folder hierarchy |
| `documents` | SOW documents (with full content) |
| `sows` | Client-facing SOW metadata |
| `agents` | AI agent configurations |
| `ai_conversations` | Chat history |
| `chat_messages` | Message details |
| `sow_activities` | Client engagement tracking |
| `sow_comments` | Client comments on SOWs |
| `sow_acceptances` | Digital signatures |
| `sow_rejections` | Rejection tracking |
| `user_preferences` | User settings |
| `active_sows_dashboard` | Dashboard view |

**Schema location:** `/root/the11/database/schema.sql`

---

## 🚀 Production Deployment

### Using Docker Compose (Recommended)

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Manual Deployment

**Frontend:**
```bash
cd /root/the11/frontend
pnpm install
pnpm build
pnpm start  # or use pm2
```

**Backend:**
```bash
cd /root/the11/backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000  # or use gunicorn
```

### Production Checklist
- [ ] Set all environment variables
- [ ] Database is accessible
- [ ] Ports 3333 and 8000 are open
- [ ] SSL certificates configured (if using domain)
- [ ] AnythingLLM workspace created
- [ ] Backup strategy in place

---

## 🎯 Common Tasks

### Create a New SOW
1. Open http://localhost:3333
2. Click "+" in left sidebar to create new document
3. Use AI chat (right sidebar) or type manually
4. Add pricing table: Insert → Pricing Table
5. Fill in roles, hours, rates
6. Click "Export PDF" when ready

### Use AI to Generate SOW
1. Click AI button (bottom right)
2. Select "The Architect (SOW Generator)" agent
3. Prompt example: "Create a HubSpot implementation SOW for $50k"
4. Click "📝 Insert to Editor" when generated
5. Review and adjust pricing table

### Share SOW with Client
1. Click "🔗 Share" in left sidebar
2. Copy generated link
3. Send to client
4. Track when they view it (dashboard)

### Export as PDF
1. Click "📄 Export PDF" in left sidebar
2. PDF generates with Social Garden branding
3. Download automatically starts

---

## 🔧 Troubleshooting

### Port already in use
```bash
lsof -ti:3333 | xargs kill -9  # Kill frontend
lsof -ti:8000 | xargs kill -9  # Kill backend
./dev.sh  # Restart
```

### App not loading
```bash
# Check logs
tail -f /tmp/nextjs.log

# Check services
curl http://localhost:3333  # Should return HTML
curl http://localhost:8000/health  # Should return OK
```

### Database connection errors
```bash
# Test connection
mysql -h 168.231.115.219 -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -e "SHOW TABLES;"

# Check credentials in .env
cat .env | grep DB_
```

### PDF generation failing
```bash
# Check PDF service
curl http://localhost:8000/health

# Check Python dependencies
cd /root/the11/pdf-service
source venv/bin/activate
pip list | grep weasyprint
```

### Changes not showing
```bash
# Hard refresh browser: Ctrl+Shift+R

# Clear Next.js cache
cd /root/the11/novel-editor-demo/apps/web
rm -rf .next
pnpm dev
```

---

## 📖 Additional Documentation

- **API Reference:** `/docs/API.md` - All API endpoints documented
- **Architecture:** `/docs/ARCHITECTURE.md` - System design decisions
- **Database Schema:** `/database/schema.sql` - Complete SQL schema
- **Deployment Guide:** `/docs/DEPLOYMENT.md` - Production deployment details

---

## 🤝 Contributing

### Code Style
- TypeScript for frontend
- Python type hints for backend
- Prettier for formatting
- ESLint for linting

### Git Workflow
```bash
git checkout -b feature/your-feature
git add -A
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

### Testing Before Push
```bash
# Frontend
cd novel-editor-demo/apps/web
pnpm typecheck
pnpm lint

# Backend
cd pdf-service
python -m pytest  # if tests exist
```

---

## 📝 License

Proprietary - Social Garden © 2025

---

## 🆘 Support

- **Issues:** Check `/docs/TROUBLESHOOTING.md`
- **Database:** Check credentials in `.env`
- **Logs:** `tail -f /tmp/nextjs.log`
- **Contact:** [Your contact info]

---

**Last Updated:** October 17, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
