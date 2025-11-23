# 🌱 Social Garden SOW Generator

> **Beautiful, AI-powered Statement of Work generator with professional PDF export**

**Location:** `/root/the11/` (You are here!)

---

## ⚡ QUICK START

```bash
./dev.sh
```

**That's it!** This ONE command starts everything with hot reload.

- Frontend: http://localhost:3333
- PDF API: http://localhost:8000
- Changes appear INSTANTLY!

Press `Ctrl+C` to stop.

---

## 📚 DOCUMENTATION

**👉 START HERE:** [`docs/MASTER_GUIDE.md`](docs/MASTER_GUIDE.md)

Everything you need in one organized document!

### Other Guides:

| Doc | What's Inside |
|-----|---------------|
| [`MASTER_GUIDE.md`](docs/MASTER_GUIDE.md) | 🎯 **START HERE!** Complete guide, everything in one place |
| [`quick-start.md`](docs/quick-start.md) | ⚡ Get running in 30 seconds |
| [`development.md`](docs/development.md) | 🔨 Dev vs Production workflows |
| [`deployment.md`](docs/deployment.md) | 🚀 Deploy to VPS, client, or anywhere |
| [`quick-reference.md`](docs/quick-reference.md) | 📖 Simple truth, direct answers |
| [`visual-guide.md`](docs/visual-guide.md) | 🖼️ Visual diagrams and explanations |
| [`understanding-setup.md`](docs/understanding-setup.md) | 🧠 VPS, GitHub, Docker explained |
| [`ai-development-guide.md`](docs/ai-development-guide.md) | 🤖 For AI assistants editing this project |
| [`session-summary.md`](docs/session-summary.md) | 📝 What we fixed in last session |

---

## 🎯 COMMON TASKS

### Daily Coding:
```bash
./dev.sh              # Start dev server
# Edit files, see changes instantly!
git add -A            # Stage changes
git commit -m "..."   # Commit
git push              # Push to GitHub
```

### Deploy to Production:
```bash
docker-compose build  # Build once
docker-compose up -d  # Run forever
```

### Check Status:
```bash
docker-compose ps     # See running containers
docker-compose logs   # View logs
```

---

## 🔥 KEY FEATURES

- 📝 **Rich text editor** with slash commands (`/table`, `/divider`, `/heading`)
- 🤖 **AI writing assistant** (improve, shorten, lengthen, simplify, fix)
- 📄 **Professional PDF export** with Social Garden branding
- 🎨 **Beautiful dark mode** (pitch black with brand accents)
- 💾 **Auto-save** to localStorage
- 🖼️ **Image uploads** and embeds
- 📊 **Tables** with proper formatting

---

## 📁 PROJECT STRUCTURE

```
the11/
├── docs/                 ← All documentation
├── novel-editor-demo/    ← Frontend (Next.js)
│   └── apps/web/         ← Main app
│       ├── components/   ← React components
│       ├── styles/       ← CSS (dark mode, colors)
│       └── public/       ← Logo, assets
├── pdf-service/          ← Backend (Python/FastAPI)
│   ├── main.py          ← PDF generation
│   └── requirements.txt  ← Dependencies
├── dev.sh               ← 🔥 Run everything!
├── docker-compose.yml   ← Production deployment
└── .env                 ← API keys (never commit!)
```

---

## 🆘 TROUBLESHOOTING

**Port already in use?**
```bash
pkill -f next-server
pkill -f uvicorn
```

**Changes not appearing?**
- Use `./dev.sh` for development (NOT Docker!)
- Docker is only for production

**Lost?**
- Read `docs/MASTER_GUIDE.md` - has everything!

---

## 🔒 ENVIRONMENT VARIABLES

Copy `.env.example` to `.env` and add your API key:

```bash
cp .env.example .env
nano .env
```

Required:
- `OPENROUTER_API_KEY` - Get free at https://openrouter.ai/keys

---

## 🚀 DEPLOYMENT

**VPS/Cloud:**
```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
cp .env.example .env
nano .env  # Add API key
docker-compose up -d
```

**Client Delivery:**
Send them the repo link + above instructions!

---

## 📝 GIT WORKFLOW

```bash
git status           # Check changes
git add -A           # Stage all
git commit -m "..."  # Commit
git push             # Push to GitHub
```

**Current branch:** `production-ready`

---

## 🎨 BRANDING

**Social Garden Colors:**
- Dark: `#0e2e33` (accents)
- Green: `#20e28f` (highlights)
- Dark mode: Pitch black backgrounds

**Logo:** 366x44 horizontal (Jakarta Sans font)

---

## 🎯 CURRENT STATUS

**✅ Working:**
- Logo in PDFs (366x44 horizontal)
- Table command (`/table`)
- Divider command (`/divider`)
- Ask AI popup (with extensive logging)
- Pitch black dark mode
- Development script (`./dev.sh`)

**🔥 High Priority:**
- Switch to OpenRouter API
- Fix PDF security warning
- Fix slash command disappearing
- Fix YouTube/Twitter embeds

---

**Made with ❤️ for Social Garden**

🌐 Need help? Check `docs/MASTER_GUIDE.md`!
