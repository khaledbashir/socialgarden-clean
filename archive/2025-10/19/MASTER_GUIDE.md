# 🎯 MASTER GUIDE - Everything You Need to Know

**Last Updated:** October 14, 2025 - 18:30 UTC  
**Project:** Social Garden SOW Generator  
**Your Location:** `/root/the11/` (this is your REAL project!)

---

## 🚀 QUICK START - ONE COMMAND!

```bash
cd /root/the11
./dev.sh
```

**That's it!** This starts:
- ✅ Frontend (port 3333) with hot reload
- ✅ Backend (port 8000) with auto-restart
- ✅ Everything you need to code!

Press **Ctrl+C** to stop everything.

---

## 📁 PROJECT STRUCTURE

```
/root/the11/  ← YOU ARE HERE! Your real project!
│
├── docs/                    ← All guides (NEW!)
│   ├── MASTER_GUIDE.md     ← This file!
│   ├── development.md      ← Dev vs Production
│   ├── deployment.md       ← How to deploy
│   └── troubleshooting.md  ← Fix common issues
│
├── novel-editor-demo/      ← Frontend (Next.js + Novel)
│   └── apps/web/
│       ├── components/     ← React components
│       │   └── tailwind/
│       │       ├── slash-command.tsx      ← /table, /heading, etc.
│       │       └── generative/            ← AI features
│       │           ├── ai-selector.tsx    ← AI menu
│       │           └── generative-menu-switch.tsx  ← Ask AI popup
│       ├── styles/
│       │   └── globals.css ← Colors, dark mode
│       └── public/
│           └── social-garden-logo.png  ← Logo (366x44)
│
├── pdf-service/            ← Backend (Python + FastAPI)
│   ├── main.py            ← PDF generation
│   ├── requirements.txt   ← Python deps
│   └── social-garden-logo-dark.png  ← Logo for PDFs
│
├── dev.sh                 ← 🔥 NEW! Run everything!
├── docker-compose.yml     ← Production deployment
├── .env                   ← API keys (NEVER commit!)
└── .env.example          ← Template

/root/thespace11/  ← DELETE THIS! Just temp files!
```

---

## 🔥 DEVELOPMENT WORKFLOW

### Daily Coding (Hot Reload, Instant Changes):

```bash
# 1. Start dev server
cd /root/the11
./dev.sh

# 2. Edit files (changes appear INSTANTLY!)
# Frontend code: novel-editor-demo/apps/web/
# Backend code: pdf-service/

# 3. Test in browser
# http://srv848342.hstgr.cloud:3333

# 4. Commit when done
git add -A
git commit -m "Your changes"
git push origin production-ready

# 5. Stop (press Ctrl+C)
```

**No rebuilds! No docker-compose! Just code and see changes!**

---

## 🐳 PRODUCTION DEPLOYMENT

### When Ready to Deploy:

```bash
# Stop dev server (Ctrl+C)

# Build for production
docker-compose build

# Start production
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Runs at:
- Frontend: http://srv848342.hstgr.cloud:3333
- PDF API: http://srv848342.hstgr.cloud:8000

---

## 📦 KEY LOCATIONS

### Where to Edit What:

| What | File |
|------|------|
| Slash commands (/table, /heading) | `novel-editor-demo/apps/web/components/tailwind/slash-command.tsx` |
| AI features (improve, fix, etc.) | `novel-editor-demo/apps/web/components/tailwind/generative/ai-selector.tsx` |
| Ask AI popup | `novel-editor-demo/apps/web/components/tailwind/generative/generative-menu-switch.tsx` |
| Colors & dark mode | `novel-editor-demo/apps/web/styles/globals.css` |
| PDF generation | `pdf-service/main.py` |
| Environment vars | `.env` |

### Current State:
- ✅ Logo fixed (366x44 horizontal)
- ✅ Table command added (/table)
- ✅ Divider command added (/divider)
- ✅ Ask AI popup fixed (with extensive logging)
- ✅ Pitch black dark mode
- ✅ Port conflicts resolved (killed old processes)
- ✅ `dev.sh` script created!

---

## 🎯 UNDERSTANDING THE SETUP

### Where Your Project Lives:

1. **VPS (srv848342.hstgr.cloud):** `/root/the11/`
   - This is where it RUNS 24/7
   - You edit files here
   
2. **GitHub:** `github.com/khaledbashir/the11`
   - Backup of all your code
   - Can clone anywhere
   
3. **Your Laptop (optional):** `~/the11/`
   - Clone from GitHub if you want
   - Same code, just local

**They're all the same files!** Just different locations.

---

## 🆕 IF YOU GET A NEW COMPUTER

### Option 1: Just SSH (Easiest)
```bash
ssh root@srv848342.hstgr.cloud
cd /root/the11
./dev.sh  # Start coding!
```

### Option 2: VS Code Remote (Best!)
1. Install VS Code
2. Install "Remote - SSH" extension
3. Connect to `root@srv848342.hstgr.cloud`
4. Open folder `/root/the11`
5. See all files in sidebar!

### Option 3: Clone Locally
```bash
git clone https://github.com/khaledbashir/the11.git
cd the11
./dev.sh  # Run locally!
```

---

## 🔄 SWITCHING VPS PROVIDERS

```bash
# On new VPS:
ssh root@new-vps.com

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and run
git clone https://github.com/khaledbashir/the11.git
cd the11
cp .env.example .env
nano .env  # Add API key
docker-compose up -d

# Done! Running on new VPS!
```

---

## 🎁 DELIVERING TO CLIENT

### Give them these instructions:

```bash
# 1. Clone
git clone https://github.com/khaledbashir/the11.git
cd the11

# 2. Setup
cp .env.example .env
nano .env  # Add their OpenRouter API key

# 3. Run
docker-compose up -d

# Done! Running on http://localhost:3333
```

**Or use PM2:**
```bash
cd the11/novel-editor-demo/apps/web
pnpm install
pnpm build
pm2 start "pnpm start" --name sow-generator
```

---

## 🐛 COMMON ISSUES

### Port already in use?
```bash
# Kill old processes
pkill -f next-server
pkill -f uvicorn

# Or check what's using port
netstat -tulpn | grep 3333
kill -9 <PID>
```

### Docker won't start?
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Changes not appearing?
```bash
# Are you in dev mode?
./dev.sh  # Use this, not Docker!

# Dev mode = instant changes
# Docker = for production only
```

### Lost in wrong folder?
```bash
pwd  # Shows current location

# Should be:
/root/the11/  ← Your project!

# NOT:
/root/thespace11/  ← Temp folder (can delete!)
```

---

## 🎨 BRANDING INFO

**Social Garden Colors:**
- Dark: `#0e2e33` (accents only, not backgrounds!)
- Green: `#20e28f` (accents, highlights, buttons)
- Dark mode: Pitch black (`#000000`) backgrounds

**Logo:**
- Size: 366x44 horizontal
- Location: `novel-editor-demo/apps/web/public/social-garden-logo.png`
- PDF Logo: `pdf-service/social-garden-logo-dark.png`

**Font:** Jakarta Sans

---

## 📝 GIT WORKFLOW

```bash
# See changes
git status

# Commit
git add -A
git commit -m "Description of changes"

# Push to GitHub
git push origin production-ready

# Pull latest
git pull origin production-ready

# Check branches
git branch

# Switch branch
git checkout branch-name
```

---

## 🔐 ENVIRONMENT VARIABLES

File: `.env` (in `/root/the11/`)

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxx  # Required for AI features
FRONTEND_PORT=3333                  # Change if port in use
```

**NEVER commit `.env` to GitHub!** It's in `.gitignore`.

---

## 🎓 LEARNING POINTS

### Docker vs Development:

**Docker (Production):**
- Slow rebuilds (60+ seconds)
- Use only when deploying
- `docker-compose build && docker-compose up -d`

**Dev Mode (Coding):**
- Instant hot reload
- Use for daily coding
- `./dev.sh`

### Key Insight:
**We were using Docker for development like idiots!** That's why everything was slow. Use `./dev.sh` instead!

---

## 🚨 IMPORTANT NOTES

1. **Your project is at `/root/the11/`** (not thespace11!)
2. **Use `./dev.sh` for coding** (not Docker!)
3. **Use Docker only for production** (deployment)
4. **Never commit `.env`** (has API keys!)
5. **Always `cd /root/the11`** before starting work
6. **Push to GitHub often** (backup your work!)

---

## 📚 MORE DOCS

All organized in `docs/` folder:
- `development.md` - Full dev workflow
- `deployment.md` - Deploy anywhere
- `troubleshooting.md` - Fix issues
- `ai-development-guide.md` - For AI assistants

---

## ✅ QUICK CHECKLIST

**Before coding:**
- [ ] `cd /root/the11`
- [ ] `./dev.sh`
- [ ] Wait for "READY TO CODE!" message
- [ ] Open browser to test

**After coding:**
- [ ] Press Ctrl+C to stop
- [ ] `git add -A`
- [ ] `git commit -m "..."`
- [ ] `git push origin production-ready`

**For production:**
- [ ] Stop dev server (Ctrl+C)
- [ ] `docker-compose build`
- [ ] `docker-compose up -d`
- [ ] Test at http://srv848342:3333

---

## 🎯 CURRENT PRIORITIES

1. 🔥 **Switch to OpenRouter API** (key ready, need to migrate)
2. 🔥 **Fix PDF security warning** (browser shows warning)
3. Fix slash command disappearing bug
4. Fix YouTube/Twitter embed UI
5. Enhance PDF beauty

---

## 💬 SUMMARY OF LAST SESSION

**What We Fixed:**
- ✅ Explained Docker vs Development workflow
- ✅ Created `dev.sh` - ONE command to run everything!
- ✅ Killed port-blocking processes
- ✅ Organized all docs into `docs/` folder
- ✅ Clarified folder structure (`the11` vs `thespace11`)

**Key Revelations:**
- Docker is for DEPLOYMENT, not development
- Use `./dev.sh` for daily coding with hot reload
- Your project is at `/root/the11/` (not thespace11!)
- `thespace11` was just temp files (can delete)

**What You Can Do Now:**
- Run everything with ONE command: `./dev.sh`
- See changes INSTANTLY (no rebuilds!)
- Clone and run anywhere (VPS, laptop, client)
- Switch VPS providers easily
- Deliver to client with simple instructions

---

## 🎉 YOU'RE NOT LOST ANYMORE!

**Remember:**
1. `cd /root/the11`
2. `./dev.sh`
3. Code!
4. Commit & push!

**That's it! Simple!** 🚀

---

**Need help? Check `docs/` folder or ask me anything!**
