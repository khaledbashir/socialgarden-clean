# 🎯 ONE COMMAND TO RUN EVERYTHING

## 🚀 Development Mode (Coding with Hot Reload)

```bash
cd /root/the11
./dev.sh
```

**That's it!** This ONE command:
- ✅ Stops Docker (if running)
- ✅ Clears ports
- ✅ Starts PDF service (background)
- ✅ Starts frontend (port 3333)
- ✅ Installs dependencies (if needed)
- ✅ Hot reload enabled!

**Now you can:**
- Edit files → See changes INSTANTLY!
- No rebuilds needed!
- Press Ctrl+C to stop everything!

---

## 🐳 Production Mode (Deploy to VPS/Client)

```bash
cd /root/the11
docker-compose build
docker-compose up -d
```

Runs on:
- Frontend: http://srv848342.hstgr.cloud:3333
- PDF API: http://srv848342.hstgr.cloud:8000

---

## 📁 What's What?

### `/root/the11/` ← YOUR REAL PROJECT
Your actual codebase with:
- `novel-editor-demo/` - Frontend (Next.js)
- `pdf-service/` - Backend (Python)
- `docker-compose.yml` - Production deployment
- `dev.sh` - **NEW! Run everything with one command!**

### `/root/thespace11/` ← TEMP FOLDER (Can delete!)
Just temporary files:
- Logo files I copied from
- Some test files
- **You can delete this whole folder if you want!**

---

## 🎯 Your Workflow Now:

### Daily Coding:
```bash
cd /root/the11
./dev.sh

# Code all day!
# Changes appear instantly!
# Press Ctrl+C when done!

# Commit changes:
git add -A
git commit -m "My changes"
git push
```

### Deploy/Test Production:
```bash
# Stop dev server (Ctrl+C)
docker-compose build
docker-compose up -d
```

---

## 🔥 FAQ

**Q: One command for everything?**  
A: `./dev.sh` - That's it!

**Q: How do I stop it?**  
A: Press Ctrl+C

**Q: Where do I edit files?**  
A: In `/root/the11/` - changes appear instantly!

**Q: What about that thespace11 folder?**  
A: You can delete it! It was just temp files.

**Q: How do I see logs?**  
A: Frontend logs show in terminal. PDF logs: `tail -f /tmp/pdf-service.log`

---

## 🎬 TRY IT NOW!

```bash
cd /root/the11
./dev.sh
```

Open http://srv848342.hstgr.cloud:3333 and start coding! 🚀
